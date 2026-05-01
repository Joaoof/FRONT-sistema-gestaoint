import { gql } from '@apollo/client';

const ETAPA_FIELDS = `
  id
  obraId
  codigo
  nome
  ordem
  descricao
  subetapas {
    id
    etapaId
    codigo
    nome
    ordem
    itens {
      id
      etapaId
      subetapaId
      codigo
      nome
      unidade
      quantidadeRef
      ordem
    }
  }
  itens {
    id
    etapaId
    subetapaId
    codigo
    nome
    unidade
    quantidadeRef
    ordem
  }
`;

const OBRA_FIELDS = `
  id
  companyId
  customerId
  codigo
  nome
  descricao
  endereco
  cidade
  estado
  cep
  status
  dataInicio
  dataFimPrev
  dataFimReal
  valorContrato
  createdAt
  updatedAt
`;

export const GET_OBRAS = gql`
  query GetObras($search: String, $status: ObraStatus, $customerId: String) {
    obras(search: $search, status: $status, customerId: $customerId) {
      ${OBRA_FIELDS}
    }
  }
`;

export const GET_OBRA = gql`
  query GetObra($id: String!) {
    obra(id: $id) {
      ${OBRA_FIELDS}
      etapas {
        ${ETAPA_FIELDS}
      }
    }
  }
`;

export const CREATE_OBRA = gql`
  mutation CreateObra($input: CreateObraInput!) {
    createObra(input: $input) {
      ${OBRA_FIELDS}
    }
  }
`;

export const UPDATE_OBRA = gql`
  mutation UpdateObra($id: String!, $input: UpdateObraInput!) {
    updateObra(id: $id, input: $input) {
      ${OBRA_FIELDS}
    }
  }
`;

export const DELETE_OBRA = gql`
  mutation DeleteObra($id: String!, $reason: String) {
    deleteObra(id: $id, reason: $reason)
  }
`;

export const CREATE_OBRA_ETAPA = gql`
  mutation CreateObraEtapa($input: CreateEtapaInput!) {
    createObraEtapa(input: $input) {
      id obraId codigo nome ordem
    }
  }
`;

export const CREATE_OBRA_SUBETAPA = gql`
  mutation CreateObraSubetapa($input: CreateSubetapaInput!) {
    createObraSubetapa(input: $input) {
      id etapaId codigo nome ordem
    }
  }
`;

export const CREATE_OBRA_ITEM_WBS = gql`
  mutation CreateObraItemWbs($input: CreateItemWbsInput!) {
    createObraItemWbs(input: $input) {
      id etapaId subetapaId codigo nome unidade quantidadeRef ordem
    }
  }
`;
