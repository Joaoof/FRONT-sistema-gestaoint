import { gql } from '@apollo/client';

const COMPANY_FIELDS = `
  id
  name
  nomeFantasia
  razaoSocial
  inscricaoEstadual
  email
  phone
  cnpj
  address
  bairro
  cidade
  estado
  cep
  latitude
  longitude
  logoUrl
`;

export const GET_MY_COMPANY = gql`
  query GetMyCompany {
    myCompany {
      ${COMPANY_FIELDS}
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: String!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      ${COMPANY_FIELDS}
    }
  }
`;
