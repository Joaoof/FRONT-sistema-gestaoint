import { gql } from '@apollo/client';

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      document
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

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($id: ID!, $input: UpdateSupplierInput!) {
    updateSupplier(id: $id, input: $input) {
      id
      name
      document
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

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: ID!) {
    deleteSupplier(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_SUPPLIER_STATUS = gql`
  mutation ToggleSupplierStatus($id: ID!) {
    toggleSupplierStatus(id: $id) {
      id
      active
      updatedAt
    }
  }
`;