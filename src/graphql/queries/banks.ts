import { gql } from '@apollo/client';

const BANK_FIELDS = `
  id
  name
  tipo
  agencia
  conta
  digito
  titular
  documento
  pixKey
  saldoInicial
  corHex
  ativo
  observacoes
  user_id
  createdAt
  updatedAt
`;

export const GET_BANKS = gql`
  query GetBanks($search: String, $activeOnly: Boolean) {
    banks(search: $search, activeOnly: $activeOnly) {
      ${BANK_FIELDS}
    }
  }
`;

export const GET_BANK = gql`
  query GetBank($id: String!) {
    bank(id: $id) {
      ${BANK_FIELDS}
    }
  }
`;

export const CREATE_BANK = gql`
  mutation CreateBank($input: CreateBankInput!) {
    createBank(input: $input) {
      ${BANK_FIELDS}
    }
  }
`;

export const UPDATE_BANK = gql`
  mutation UpdateBank($id: String!, $input: UpdateBankInput!) {
    updateBank(id: $id, input: $input) {
      ${BANK_FIELDS}
    }
  }
`;

export const DELETE_BANK = gql`
  mutation DeleteBank($id: String!) {
    deleteBank(id: $id)
  }
`;
