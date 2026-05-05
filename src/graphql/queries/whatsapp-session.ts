import { gql } from '@apollo/client';

const SESSION_FIELDS = `
  id
  companyId
  instanceName
  status
  qrCode
  phone
  profileName
  profilePicUrl
  lastError
  lastSeenAt
  connectedAt
  createdAt
  updatedAt
`;

const CONVERSATION_FIELDS = `
  peerNumber
  peerName
  customerId
  lastMessage
  lastMessageAt
  unreadCount
  totalMessages
`;

const MESSAGE_FIELDS = `
  id
  peerNumber
  fromMe
  body
  status
  externalId
  createdAt
  sentAt
  deliveredAt
  readAt
`;

export const GET_WHATSAPP_SESSION = gql`
  query GetWhatsappSession {
    whatsappSession { ${SESSION_FIELDS} }
  }
`;

export const GET_WHATSAPP_CONVERSATIONS = gql`
  query GetWhatsappConversations {
    whatsappConversations { ${CONVERSATION_FIELDS} }
  }
`;

export const GET_WHATSAPP_MESSAGES = gql`
  query GetWhatsappMessages($peerNumber: String!, $limit: Int) {
    whatsappMessages(peerNumber: $peerNumber, limit: $limit) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const CONNECT_WHATSAPP = gql`
  mutation ConnectWhatsapp {
    connectWhatsapp { ${SESSION_FIELDS} }
  }
`;

export const DISCONNECT_WHATSAPP = gql`
  mutation DisconnectWhatsapp {
    disconnectWhatsapp { ${SESSION_FIELDS} }
  }
`;

export const SEND_WHATSAPP_MESSAGE = gql`
  mutation SendWhatsappMessage(
    $to: String!
    $body: String!
    $customerId: String
  ) {
    sendWhatsappMessage(to: $to, body: $body, customerId: $customerId) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const MARK_WHATSAPP_CONVERSATION_READ = gql`
  mutation MarkWhatsappConversationRead($peerNumber: String!) {
    markWhatsappConversationRead(peerNumber: $peerNumber)
  }
`;
