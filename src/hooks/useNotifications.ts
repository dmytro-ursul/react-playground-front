import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetPushNotificationConfigQuery,
  useRegisterPushSubscriptionMutation,
  useSendTestPushNotificationMutation,
  useUnregisterPushSubscriptionMutation,
} from '../components/todoList/services/apiSlice';
import type { RootState } from '../store';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const arrayBufferToBase64 = (value: ArrayBuffer | null) => {
  if (!value) {
    return '';
  }

  const bytes = new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
};

const serializeSubscription = (subscription: PushSubscription) => {
  const json = subscription.toJSON();

  return {
    endpoint: subscription.endpoint,
    expirationTime:
      json.expirationTime == null ? null : new Date(json.expirationTime).toISOString(),
    p256dh:
      json.keys?.p256dh ||
      arrayBufferToBase64(subscription.getKey('p256dh')),
    auth:
      json.keys?.auth ||
      arrayBufferToBase64(subscription.getKey('auth')),
  };
};

export const useNotifications = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: pushConfig } = useGetPushNotificationConfigQuery(undefined, { skip: !isSupported });
  const [registerPushSubscription] = useRegisterPushSubscriptionMutation();
  const [unregisterPushSubscription] = useUnregisterPushSubscriptionMutation();
  const [sendTestPushNotification] = useSendTestPushNotificationMutation();

  const publicKey = pushConfig?.pushNotificationConfig?.publicKey || null;

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    setIsSupported(supported);

    if (supported) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const syncBrowserSubscriptionState = useCallback(async () => {
    if (!isSupported) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(Boolean(subscription));
    return subscription;
  }, [isSupported]);

  const ensureServerRegistration = useCallback(
    async (subscription: PushSubscription) => {
      if (!token) {
        // Browser subscription exists but can't register with backend yet.
        // The sync effect will retry once the user logs in.
        return false;
      }

      const payload = serializeSubscription(subscription);
      await registerPushSubscription(payload).unwrap();
      setIsSubscribed(true);
      setError(null);
      return true;
    },
    [registerPushSubscription, token]
  );

  const ensurePushSubscription = useCallback(
    async ({ sendTestNotification = false }: { sendTestNotification?: boolean } = {}) => {
      if (!isSupported || Notification.permission !== 'granted' || !publicKey) {
        return false;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        await ensureServerRegistration(subscription);

        if (sendTestNotification && token) {
          await sendTestPushNotification().unwrap();
        }

        setError(null);
        return true;
      } catch (error) {
        console.error('Error ensuring push subscription:', error);
        setError('Failed to enable notifications. Please try again.');
        return false;
      }
    },
    [ensureServerRegistration, isSupported, publicKey, sendTestPushNotification, token]
  );

  useEffect(() => {
    if (!isSupported || Notification.permission !== 'granted' || !publicKey) {
      return;
    }

    syncBrowserSubscriptionState()
      .then((subscription) => {
        if (subscription) {
          ensureServerRegistration(subscription).catch((error) => {
            console.error('Error syncing push subscription with backend:', error);
          });
        }
      })
      .catch((error) => {
        console.error('Error checking push subscription:', error);
      });
  }, [ensureServerRegistration, isSupported, publicKey, syncBrowserSubscriptionState]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Notifications are not supported in this browser');
      return false;
    }

    setError(null);
    let permission = Notification.permission;

    if (permission !== 'granted') {
      try {
        permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        setError('Failed to request notification permission.');
        return false;
      }
    }

    if (permission === 'denied') {
      setError('Notifications were blocked. You can enable them in your browser settings.');
      return false;
    }

    if (permission !== 'granted') {
      return false;
    }

    return ensurePushSubscription({ sendTestNotification: true });
  }, [ensurePushSubscription, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      if (token) {
        await unregisterPushSubscription({ endpoint: subscription.endpoint }).unwrap();
      }

      await subscription.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setError('Failed to unsubscribe. Please try again.');
      return false;
    }
  }, [isSupported, token, unregisterPushSubscription]);

  return useMemo(
    () => ({
      isSupported,
      isSubscribed,
      isConfigured: Boolean(publicKey),
      notificationPermission,
      error,
      requestPermission,
      resubscribe: ensurePushSubscription,
      unsubscribe,
    }),
    [isSupported, isSubscribed, publicKey, notificationPermission, error, requestPermission, ensurePushSubscription, unsubscribe]
  );
};
