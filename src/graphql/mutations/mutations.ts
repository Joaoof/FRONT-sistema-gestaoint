import { gql } from '@apollo/client';

export const CREATE_CASH_MOVEMENT = gql`
  mutation CreateCashMovement($input: CreateCashMovementInput!) {
    createCashMovement(input: $input) {
      id
      type
      category
      value
      description
      date
      user_id
      message
    }
  }
`;

export const DELETE_CASH_MOVEMENT = gql`
  mutation DeleteCashMovement($movementId: String!) {
    cashMovementDelete(movementId: $movementId)
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;
