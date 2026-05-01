import { gql } from '@apollo/client';

const ITEM_ORC = `
  id
  versaoId
  etapaId
  subetapaId
  itemWbsId
  centroCustoId
  categoriaId
  descricao
  unidade
  quantidade
  valorUnitario
  valorTotal
  ordem
  notas
`;

const VERSAO_FIELDS = `
  id
  companyId
  obraId
  numero
  nome
  descricao
  status
  baseVersaoId
  total
  ativadoEm
  congeladoEm
  createdAt
  updatedAt
`;

export const GET_VERSOES_ORCAMENTO = gql`
  query GetVersoesOrcamento($obraId: String!) {
    versoesOrcamento(obraId: $obraId) { ${VERSAO_FIELDS} }
  }
`;

export const GET_VERSAO_ORCAMENTO = gql`
  query GetVersaoOrcamento($id: String!) {
    versaoOrcamento(id: $id) {
      ${VERSAO_FIELDS}
      itens { ${ITEM_ORC} }
    }
  }
`;

export const CREATE_VERSAO_ORCAMENTO = gql`
  mutation CreateVersaoOrcamento($input: CreateVersaoOrcamentoInput!) {
    createVersaoOrcamento(input: $input) {
      ${VERSAO_FIELDS}
      itens { ${ITEM_ORC} }
    }
  }
`;

export const ADD_ITENS_ORCAMENTO = gql`
  mutation AddItensOrcamento($input: AddItensOrcamentoInput!) {
    addItensOrcamento(input: $input) {
      ${VERSAO_FIELDS}
      itens { ${ITEM_ORC} }
    }
  }
`;

export const ATIVAR_VERSAO_ORCAMENTO = gql`
  mutation AtivarVersaoOrcamento($id: String!) {
    ativarVersaoOrcamento(id: $id) {
      ${VERSAO_FIELDS}
    }
  }
`;

export const COMPARAR_VERSOES = gql`
  query CompararVersoes($input: CompararVersoesInput!) {
    compararVersoesOrcamento(input: $input) {
      versaoBaseId
      versaoAlvoId
      totalBase
      totalAlvo
      diferencaAbs
      diferencaPct
      porEtapa { descricao etapaId valorBase valorAlvo diferencaAbs diferencaPct }
      porCategoria { descricao categoriaId valorBase valorAlvo diferencaAbs diferencaPct }
    }
  }
`;
