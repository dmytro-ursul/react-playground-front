import { gql } from 'graphql-request';

export const SIGN_IN = gql`
  mutation signIn($username: String!, $password: String!) {
    signIn(input: {username: $username, password: $password}) {
      token,
      requiresTwoFactor,
      tempToken,
      user {
        firstName,
        lastName,
        otpEnabled
      }
    }
  }
`;

export const VERIFY_TWO_FACTOR = gql`
  mutation verifyTwoFactor($tempToken: String!, $code: String!) {
    verifyTwoFactor(input: {tempToken: $tempToken, code: $code}) {
      token,
      user {
        firstName,
        lastName,
        otpEnabled
      }
    }
  }
`;

export const SETUP_TWO_FACTOR = gql`
  mutation setupTwoFactor {
    setupTwoFactor(input: {}) {
      secret,
      provisioningUri,
      qrCodeSvg
    }
  }
`;

export const ENABLE_TWO_FACTOR = gql`
  mutation enableTwoFactor($code: String!) {
    enableTwoFactor(input: {code: $code}) {
      success,
      message
    }
  }
`;

export const DISABLE_TWO_FACTOR = gql`
  mutation disableTwoFactor($password: String!, $code: String!) {
    disableTwoFactor(input: {password: $password, code: $code}) {
      success,
      message
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query getCurrentUser {
    currentUser {
      id,
      username,
      email,
      firstName,
      lastName,
      otpEnabled
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!, $newPasswordConfirmation: String!) {
    changePassword(
      input: {
        currentPassword: $currentPassword
        newPassword: $newPassword
        newPasswordConfirmation: $newPasswordConfirmation
      }
    ) {
      user {
        id
        username
        email
      }
      message
    }
  }
`;
