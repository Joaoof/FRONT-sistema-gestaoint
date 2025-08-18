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