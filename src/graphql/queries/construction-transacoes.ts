import { gql } from '@apollo/client';

const TRANS_FIELDS = `
  id
  companyId
  obraId
  etapaId
  subetapaId
  itemWbsId
  centroCustoId
  categoriaId
  supplierId
  accountPayableId
  accountReceivableId
  estornoDeId
  tipo
  status
  valor
  descricao
  documento
  dataReal
  dataCompetencia
  dataPrevistaPgto
  observacoes
  confirmadoEm
  createdAt
  updatedAt
`;

export const GET_TRANSACOES = gql`
  query GetTransacoes($filter: ListTransacoesFilterInput!) {
    transacoes(filter: $filter) { ${TRANS_FIELDS} }
  }
`;

export const GET_TRANSACAO = gql`
  query GetTransacao($id: String!) {
    transacao(id: $id) { ${TRANS_FIELDS} }
  }
`;

export const CREATE_TRANSACAO = gql`
  mutation CreateTransacao($input: CreateTransacaoInput!) {
    createTransacao(input: $input) { ${TRANS_FIELDS} }
  }
`;

export const CONFIRMAR_TRANSACAO = gql`
  mutation ConfirmarTransacao($input: ConfirmarTransacaoInput!) {
    confirmarTransacao(input: $input) { ${TRANS_FIELDS} }
  }
`;

export const ESTORNAR_TRANSACAO = gql`
  mutation EstornarTransacao($input: EstornarTransacaoInput!) {
    estornarTransacao(input: $input) { ${TRANS_FIELDS} }
  }
`;

export const CANCELAR_TRANSACAO_PENDENTE = gql`
  mutation CancelarTransacaoPendente($id: String!, $motivo: String) {
    cancelarTransacaoPendente(id: $id, motivo: $motivo)
  }
`;
