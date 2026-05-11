import { gql } from '@apollo/client';

const RECEIPT_FIELDS = `
  id accountReceivableId accountPayableId amount paymentMethod bankId
  paidAt notes cashMovementId createdByUserId createdAt
`;

export const RECEIVABLE_PAYMENTS = gql`
  query ReceivablePayments($accountReceivableId: String!) {
    receivablePayments(accountReceivableId: $accountReceivableId) { ${RECEIPT_FIELDS} }
  }
`;

export const PAYABLE_PAYMENTS = gql`
  query PayablePayments($accountPayableId: String!) {
    payablePayments(accountPayableId: $accountPayableId) { ${RECEIPT_FIELDS} }
  }
`;

export const RECORD_RECEIVABLE_PAYMENT = gql`
  mutation RecordReceivablePayment($input: RecordPaymentInput!) {
    recordReceivablePayment(input: $input) {
      accountId newPaidAmount status fullyPaid
      receipt { ${RECEIPT_FIELDS} }
    }
  }
`;

export const RECORD_PAYABLE_PAYMENT = gql`
  mutation RecordPayablePayment($input: RecordPaymentInput!) {
    recordPayablePayment(input: $input) {
      accountId newPaidAmount status fullyPaid
      receipt { ${RECEIPT_FIELDS} }
    }
  }
`;
