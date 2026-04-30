import { gql } from '@apollo/client';

export const GET_MY_COMPANY = gql`
  query GetMyCompany {
    myCompany {
      id
      name
      email
      phone
      address
      cnpj
      logoUrl
    }
  }
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($id: String!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      email
      phone
      address
      cnpj
      logoUrl
    }
  }
`;
