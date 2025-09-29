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
