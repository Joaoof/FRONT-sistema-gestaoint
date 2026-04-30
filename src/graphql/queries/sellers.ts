import { gql } from '@apollo/client';

const SELLER_FIELDS = `
  id
  name
  email
  phone
  document
  commissionPercent
  active
  totalCommission
  createdAt
  updatedAt
`;

export const GET_SELLERS = gql`
  query GetSellers($search: String, $activeOnly: Boolean) {
    sellers(search: $search, activeOnly: $activeOnly) {
      ${SELLER_FIELDS}
    }
  }
`;

export const GET_SELLER = gql`
  query GetSeller($id: String!) {
    seller(id: $id) {
      ${SELLER_FIELDS}
    }
  }
`;

export const CREATE_SELLER = gql`
  mutation CreateSeller($input: CreateSellerInput!) {
    createSeller(input: $input) {
      ${SELLER_FIELDS}
    }
  }
`;

export const UPDATE_SELLER = gql`
  mutation UpdateSeller($id: String!, $input: UpdateSellerInput!) {
    updateSeller(id: $id, input: $input) {
      ${SELLER_FIELDS}
    }
  }
`;

export const DELETE_SELLER = gql`
  mutation DeleteSeller($id: String!) {
    deleteSeller(id: $id)
  }
`;
