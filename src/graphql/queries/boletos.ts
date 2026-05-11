import { gql } from '@apollo/client';

const BOLETO_FIELDS = `
  id companyId accountReceivableId bankId provider providerBoletoId
  nossoNumero barcode digitableLine pdfUrl amount dueDate status
  errorMessage payerName payerDocument registeredAt paidAt createdAt
`;

export const BOLETOS = gql`
  query Boletos($status: String) {
    boletos(status: $status) { ${BOLETO_FIELDS} }
  }
`;

export const BOLETO = gql`
  query Boleto($id: String!) {
    boleto(id: $id) { ${BOLETO_FIELDS} }
  }
`;

export const ISSUE_BOLETO = gql`
  mutation IssueBoleto($input: IssueBoletoInput!) {
    issueBoleto(input: $input) { ${BOLETO_FIELDS} }
  }
`;

export const CANCEL_BOLETO = gql`
  mutation CancelBoleto($id: String!) {
    cancelBoleto(id: $id) { ${BOLETO_FIELDS} }
  }
`;

export const MARK_BOLETO_PAID = gql`
  mutation MarkBoletoPaid($id: String!, $paidAt: String) {
    markBoletoPaid(id: $id, paidAt: $paidAt) { ${BOLETO_FIELDS} }
  }
`;
