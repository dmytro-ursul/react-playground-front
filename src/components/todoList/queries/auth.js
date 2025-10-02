import { gql } from 'graphql-request';

export const SIGN_IN = gql`
  mutation signIn($username: String!, $password: String!) {
    signIn(input: {username: $username, password: $password}) {
      token,
      user {
        firstName,
        lastName,
      }
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
