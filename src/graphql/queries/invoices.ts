import { gql } from '@apollo/client';

const INVOICE_FIELDS = `
  id
  companyId
  userId
  orderId
  type
  status
  ambiente
  numero
  serie
  chaveAcesso
  protocoloAutorizacao
  protocoloCancelamento
  motivoCancelamento
  dataEmissao
  dataAutorizacao
  dataCancelamento
  recipientName
  recipientDocument
  recipientEmail
  recipientAddress
  recipientCity
  recipientUf
  recipientZip
  naturezaOperacao
  paymentMethod
  valorProdutos
  valorDesconto
  valorFrete
  valorTotal
  observacoes
  providerName
  providerRef
  xmlUrl
  danfeUrl
  errorMessage
  errorCode
  createdAt
  updatedAt
  items {
    id
    ordem
    codigo
    descricao
    ncm
    cfop
    cest
    unidade
    quantidade
    valorUnitario
    valorDesconto
    valorTotal
    origemMercadoria
    csosn
    cstIcms
    aliquotaIcms
    productId
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices($input: ListInvoicesInput) {
    invoices(input: $input) {
      ${INVOICE_FIELDS}
    }
  }
`;

export const GET_INVOICE = gql`
  query GetInvoice($id: String!) {
    invoice(id: $id) {
      ${INVOICE_FIELDS}
    }
  }
`;

export const ISSUE_INVOICE = gql`
  mutation IssueInvoice($input: IssueInvoiceInput!) {
    issueInvoice(input: $input) {
      ${INVOICE_FIELDS}
    }
  }
`;

export const CANCEL_INVOICE = gql`
  mutation CancelInvoice($input: CancelInvoiceInput!) {
    cancelInvoice(input: $input) {
      ${INVOICE_FIELDS}
    }
  }
`;

export const RESYNC_INVOICE = gql`
  mutation ResyncInvoice($id: String!) {
    resyncInvoice(id: $id) {
      ${INVOICE_FIELDS}
    }
  }
`;
