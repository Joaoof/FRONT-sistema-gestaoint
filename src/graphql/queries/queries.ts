import { gql } from '@apollo/client';

export const GET_CASH_MOVEMENTS = gql`
  query CashMovements($input: FindAllCashMovementInput) {
    cashMovements(input: $input) {
      id
      type
      category
      value
      description
      date
      user_id
    }
  }
`;


export const CREATE_CASH_MOVEMENT = gql`
  mutation CreateCashMovement($input: CreateCashMovementInput!) {
    createCashMovement(input: $input) {
      id
      value
      description
      type # ENTRY ou EXIT
      category # SALE, EXPENSE, WITHDRAWAL, etc.
      date
      createdAt
      updatedAt
    }
  }
`;

/**
 * Atualiza uma movimentação existente
 */
export const UPDATE_CASH_MOVEMENT = gql`
  mutation UpdateCashMovement($id: ID!, $input: UpdateCashMovementInput!) {
    updateCashMovement(id: $id, input: $input) {
      id
      value
      description
      type
      category
      date
      updatedAt
    }
  }
`;

/**
 * Remove uma movimentação do caixa
 */
export const DELETE_CASH_MOVEMENT = gql`
  mutation DeleteCashMovement($id: ID!) {
    deleteCashMovement(id: $id)
  }
`;