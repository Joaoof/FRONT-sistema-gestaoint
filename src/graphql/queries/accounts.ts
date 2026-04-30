import { gql } from '@apollo/client';

const PRODUCT_FIELDS = `
  id
  nameProduct
  sku
  unit
  costPrice
  salePrice
  quantity
  description
  status
  images { id url isPrimary order }
`;

export const GET_ACCOUNTS_RECEIVABLE = gql`
  query GetAccountsReceivable($search: String, $status: AccountStatus) {
    accountsReceivable(search: $search, status: $status) {
      id
      customerId
      productId
      description
      amount
      interestRate
      dueDate
      paidAt
      status
      notes
      finalAmount
      interestAccrued
      daysOverdue
      createdAt
      updatedAt
      customer { id name document email phone }
      product { ${PRODUCT_FIELDS} }
    }
  }
`;

export const GET_ACCOUNT_RECEIVABLE = gql`
  query GetAccountReceivable($id: String!) {
    accountReceivable(id: $id) {
      id
      customerId
      productId
      description
      amount
      interestRate
      dueDate
      paidAt
      status
      notes
      finalAmount
      interestAccrued
      daysOverdue
      createdAt
      updatedAt
      customer { id name document email phone address }
      product { ${PRODUCT_FIELDS} }
    }
  }
`;

export const GET_ACCOUNTS_RECEIVABLE_SUMMARY = gql`
  query GetAccountsReceivableSummary {
    accountsReceivableSummary { total pending paid overdue countTotal }
  }
`;

export const GET_ACCOUNTS_PAYABLE = gql`
  query GetAccountsPayable($search: String, $status: AccountStatus) {
    accountsPayable(search: $search, status: $status) {
      id
      supplierId
      productId
      supplierName
      description
      amount
      interestRate
      dueDate
      paidAt
      status
      notes
      finalAmount
      interestAccrued
      daysOverdue
      createdAt
      updatedAt
      supplier { id name email phone }
      product { ${PRODUCT_FIELDS} }
    }
  }
`;

export const GET_ACCOUNT_PAYABLE = gql`
  query GetAccountPayable($id: String!) {
    accountPayable(id: $id) {
      id
      supplierId
      productId
      supplierName
      description
      amount
      interestRate
      dueDate
      paidAt
      status
      notes
      finalAmount
      interestAccrued
      daysOverdue
      createdAt
      updatedAt
      supplier { id name email phone }
      product { ${PRODUCT_FIELDS} }
    }
  }
`;

export const GET_ACCOUNTS_PAYABLE_SUMMARY = gql`
  query GetAccountsPayableSummary {
    accountsPayableSummary { total pending paid overdue countTotal }
  }
`;

export const GET_CUSTOMERS_LIST = gql`
  query GetCustomersList($search: String) {
    customers(search: $search) {
      id name document email phone
    }
  }
`;
