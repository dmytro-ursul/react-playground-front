import { gql } from 'graphql-request';

export const GET_PUSH_NOTIFICATION_CONFIG = gql`
  query GetPushNotificationConfig {
    pushNotificationConfig {
      publicKey
    }
  }
`;

export const REGISTER_PUSH_SUBSCRIPTION = gql`
  mutation RegisterPushSubscription(
    $endpoint: String!
    $p256dh: String!
    $auth: String!
    $expirationTime: ISO8601DateTime
  ) {
    registerPushSubscription(
      input: {
        endpoint: $endpoint
        p256dh: $p256dh
        auth: $auth
        expirationTime: $expirationTime
      }
    ) {
      success
    }
  }
`;

export const UNREGISTER_PUSH_SUBSCRIPTION = gql`
  mutation UnregisterPushSubscription($endpoint: String!) {
    unregisterPushSubscription(input: { endpoint: $endpoint }) {
      success
    }
  }
`;

export const SEND_TEST_PUSH_NOTIFICATION = gql`
  mutation SendTestPushNotification {
    sendTestPushNotification(input: {}) {
      success
    }
  }
`;
