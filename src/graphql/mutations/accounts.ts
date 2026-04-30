import { gql } from '@apollo/client';

export const CREATE_ACCOUNT_RECEIVABLE = gql`
  mutation CreateAccountReceivable($input: CreateAccountReceivableInput!) {
    createAccountReceivable(input: $input) {
      id customerId productId description amount interestRate dueDate status
    }
  }
`;

export const UPDATE_ACCOUNT_RECEIVABLE = gql`
  mutation UpdateAccountReceivable($input: UpdateAccountReceivableInput!) {
    updateAccountReceivable(input: $input) {
      id customerId productId description amount interestRate dueDate paidAt status notes
      finalAmount interestAccrued daysOverdue
      customer { id name }
    }
  }
`;

export const DELETE_ACCOUNT_RECEIVABLE = gql`
  mutation DeleteAccountReceivable($id: String!) {
    deleteAccountReceivable(id: $id)
  }
`;

export const CREATE_ACCOUNT_PAYABLE = gql`
  mutation CreateAccountPayable($input: CreateAccountPayableInput!) {
    createAccountPayable(input: $input) {
      id supplierId productId supplierName description amount interestRate dueDate status
    }
  }
`;

export const UPDATE_ACCOUNT_PAYABLE = gql`
  mutation UpdateAccountPayable($input: UpdateAccountPayableInput!) {
    updateAccountPayable(input: $input) {
      id supplierId productId supplierName description amount interestRate dueDate paidAt status notes
      finalAmount interestAccrued daysOverdue
    }
  }
`;

export const DELETE_ACCOUNT_PAYABLE = gql`
  mutation DeleteAccountPayable($id: String!) {
    deleteAccountPayable(id: $id)
  }
`;

export const CREATE_CUSTOMER_BASIC = gql`
  mutation CreateCustomerBasic($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id name document email phone
    }
  }
`;
