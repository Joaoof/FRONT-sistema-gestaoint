// /src/graphql/mutations.ts
export const CREATE_CASH_MOVEMENT = `
  mutation CreateCashMovement($input: CreateCashMovementInput!) {
    createCashMovement(input: $input) {
      id
      type
      category
      value
      description
      date
    }
  }
`;