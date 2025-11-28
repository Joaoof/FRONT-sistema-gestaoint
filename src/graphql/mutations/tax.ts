import { gql } from '@apollo/client';

/**
 * Cria uma nova Conta a Pagar (Payable).
 * A entrada (input) deve corresponder à estrutura esperada pelo backend.
 * Nota: Os campos de status aqui são em maiúsculas (PENDENTE, PAGO, VENCIDO) 
 * para seguir a convenção de enums do GraphQL/backend.
 */
export const CREATE_TAX_EXPENSE = gql`
 mutation CreateTaxExpense($input: CreateTaxExpenseInput!) {
  createTaxExpense(input: $input) {
    id
    supplier
    value
    description
    dueDate
    status
    user_id
  }
} `;
