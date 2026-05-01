import { gql } from '@apollo/client';

const CC_FIELDS = `
  id
  companyId
  codigo
  nome
  descricao
  ativo
  createdAt
  updatedAt
`;

const CAT_FIELDS = `
  id
  companyId
  parentId
  codigo
  nome
  tipo
  ativo
  createdAt
  updatedAt
`;

export const GET_CENTROS_CUSTO = gql`
  query GetCentrosCusto {
    centrosCusto { ${CC_FIELDS} }
  }
`;

export const CREATE_CENTRO_CUSTO = gql`
  mutation CreateCentroCusto($input: CreateCentroCustoInput!) {
    createCentroCusto(input: $input) { ${CC_FIELDS} }
  }
`;

export const UPDATE_CENTRO_CUSTO = gql`
  mutation UpdateCentroCusto($id: String!, $input: UpdateCentroCustoInput!) {
    updateCentroCusto(id: $id, input: $input) { ${CC_FIELDS} }
  }
`;

export const DELETE_CENTRO_CUSTO = gql`
  mutation DeleteCentroCusto($id: String!) {
    deleteCentroCusto(id: $id)
  }
`;

export const GET_CATEGORIAS_CONSTRUCAO = gql`
  query GetCategoriasConstrucao {
    categoriasConstrucao { ${CAT_FIELDS} }
  }
`;

export const CREATE_CATEGORIA_CONSTRUCAO = gql`
  mutation CreateCategoriaConstrucao($input: CreateCategoriaConstrucaoInput!) {
    createCategoriaConstrucao(input: $input) { ${CAT_FIELDS} }
  }
`;

export const UPDATE_CATEGORIA_CONSTRUCAO = gql`
  mutation UpdateCategoriaConstrucao($id: String!, $input: UpdateCategoriaConstrucaoInput!) {
    updateCategoriaConstrucao(id: $id, input: $input) { ${CAT_FIELDS} }
  }
`;
