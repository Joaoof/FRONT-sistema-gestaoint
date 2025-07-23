import { gql } from '@apollo/client';

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      document
      type
      email
      phone
      address
      city
      state
      zipCode
      active
      createdAt
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      document
      type
      email
      phone
      address
      city
      state
      zipCode
      active
      updatedAt
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_CUSTOMER_STATUS = gql`
  mutation ToggleCustomerStatus($id: ID!) {
    toggleCustomerStatus(id: $id) {
      id
      active
      updatedAt
    }
  }
`;