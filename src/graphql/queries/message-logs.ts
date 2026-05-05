import { gql } from '@apollo/client';

const MESSAGE_FIELDS = `
  id
  companyId
  channel
  direction
  toAddress
  fromAddress
  subject
  body
  status
  externalId
  errorMessage
  customerId
  customerName
  templateKey
  createdAt
  sentAt
  deliveredAt
  readAt
`;

export const GET_MESSAGE_LOGS = gql`
  query GetMessageLogs($filter: MessageLogFilterInput) {
    messageLogs(filter: $filter) {
      items { ${MESSAGE_FIELDS} }
      total
      page
      pageSize
    }
  }
`;
