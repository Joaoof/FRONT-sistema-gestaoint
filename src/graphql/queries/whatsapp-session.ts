import { gql } from '@apollo/client';

const SESSION_FIELDS = `
  id
  companyId
  instanceName
  status
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
  profilePicUrl
  customerId
  lastMessage
  lastMessageAt
  unreadCount
  totalMessages
  isGroup
  isHiddenNumber
`;

const MESSAGE_FIELDS = `
  id
  peerNumber
  fromMe
  body
  status
  externalId
  participantNumber
  participantName
  mediaType
  mediaUrl
  mediaMimetype
  quotedMessageId
  quotedBody
  quotedParticipant
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
    $replyTo: String
    $mentions: [String!]
  ) {
    sendWhatsappMessage(
      to: $to
      body: $body
      customerId: $customerId
      replyTo: $replyTo
      mentions: $mentions
    ) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const SEND_WHATSAPP_IMAGE = gql`
  mutation SendWhatsappImage(
    $to: String!
    $file: WhatsappMediaInput!
    $caption: String
    $replyTo: String
    $customerId: String
  ) {
    sendWhatsappImage(to: $to, file: $file, caption: $caption, replyTo: $replyTo, customerId: $customerId) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const SEND_WHATSAPP_VIDEO = gql`
  mutation SendWhatsappVideo(
    $to: String!
    $file: WhatsappMediaInput!
    $caption: String
    $replyTo: String
    $customerId: String
  ) {
    sendWhatsappVideo(to: $to, file: $file, caption: $caption, replyTo: $replyTo, customerId: $customerId) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const SEND_WHATSAPP_VOICE = gql`
  mutation SendWhatsappVoice(
    $to: String!
    $file: WhatsappMediaInput!
    $replyTo: String
    $customerId: String
  ) {
    sendWhatsappVoice(to: $to, file: $file, replyTo: $replyTo, customerId: $customerId) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const SEND_WHATSAPP_FILE = gql`
  mutation SendWhatsappFile(
    $to: String!
    $file: WhatsappMediaInput!
    $caption: String
    $replyTo: String
    $customerId: String
  ) {
    sendWhatsappFile(to: $to, file: $file, caption: $caption, replyTo: $replyTo, customerId: $customerId) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const SEND_WHATSAPP_LOCATION = gql`
  mutation SendWhatsappLocation(
    $to: String!
    $latitude: Float!
    $longitude: Float!
    $title: String
  ) {
    sendWhatsappLocation(to: $to, latitude: $latitude, longitude: $longitude, title: $title) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const REACT_TO_WHATSAPP_MESSAGE = gql`
  mutation ReactToWhatsappMessage($messageId: String!, $reaction: String!) {
    reactToWhatsappMessage(messageId: $messageId, reaction: $reaction)
  }
`;

export const SET_WHATSAPP_TYPING = gql`
  mutation SetWhatsappTyping($peerNumber: String!, $typing: Boolean!) {
    setWhatsappTyping(peerNumber: $peerNumber, typing: $typing)
  }
`;

export const GET_WHATSAPP_PEER_PRESENCE = gql`
  query GetWhatsappPeerPresence($peerNumber: String!) {
    whatsappPeerPresence(peerNumber: $peerNumber) {
      presence
      lastSeen
    }
  }
`;

export const GET_WHATSAPP_CONTACT_ABOUT = gql`
  query GetWhatsappContactAbout($peerNumber: String!) {
    whatsappContactAbout(peerNumber: $peerNumber)
  }
`;

export const CHECK_WHATSAPP_NUMBER = gql`
  query CheckWhatsappNumber($phone: String!) {
    checkWhatsappNumber(phone: $phone) {
      exists
      chatId
    }
  }
`;

export const BLOCK_WHATSAPP_CONTACT = gql`
  mutation BlockWhatsappContact($peerNumber: String!, $block: Boolean!) {
    blockWhatsappContact(peerNumber: $peerNumber, block: $block)
  }
`;

export const GET_WHATSAPP_GROUP_PARTICIPANTS = gql`
  query GetWhatsappGroupParticipants($peerNumber: String!) {
    whatsappGroupParticipants(peerNumber: $peerNumber) {
      jid
      phone
      isAdmin
    }
  }
`;

export const EDIT_WHATSAPP_MESSAGE = gql`
  mutation EditWhatsappMessage($messageId: String!, $newBody: String!) {
    editWhatsappMessage(messageId: $messageId, newBody: $newBody) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const DELETE_WHATSAPP_MESSAGE = gql`
  mutation DeleteWhatsappMessage($messageId: String!) {
    deleteWhatsappMessage(messageId: $messageId)
  }
`;

export const STAR_WHATSAPP_MESSAGE = gql`
  mutation StarWhatsappMessage($messageId: String!, $star: Boolean!) {
    starWhatsappMessage(messageId: $messageId, star: $star)
  }
`;

export const PIN_WHATSAPP_MESSAGE = gql`
  mutation PinWhatsappMessage($messageId: String!, $pin: Boolean!) {
    pinWhatsappMessage(messageId: $messageId, pin: $pin)
  }
`;

export const FORWARD_WHATSAPP_MESSAGE = gql`
  mutation ForwardWhatsappMessage($messageId: String!, $toPeerNumber: String!) {
    forwardWhatsappMessage(messageId: $messageId, toPeerNumber: $toPeerNumber) {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const ARCHIVE_WHATSAPP_CHAT = gql`
  mutation ArchiveWhatsappChat($peerNumber: String!, $archive: Boolean!) {
    archiveWhatsappChat(peerNumber: $peerNumber, archive: $archive)
  }
`;

export const ON_WHATSAPP_MESSAGE_RECEIVED = gql`
  subscription OnWhatsappMessageReceived {
    whatsappMessageReceived {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const ON_WHATSAPP_MESSAGE_UPDATED = gql`
  subscription OnWhatsappMessageUpdated {
    whatsappMessageUpdated {
      ${MESSAGE_FIELDS}
    }
  }
`;

export const ON_WHATSAPP_PRESENCE_CHANGED = gql`
  subscription OnWhatsappPresenceChanged($peerNumber: String) {
    whatsappPresenceChanged(peerNumber: $peerNumber) {
      peerNumber
      presence
      lastSeen
    }
  }
`;

export const MARK_WHATSAPP_CONVERSATION_READ = gql`
  mutation MarkWhatsappConversationRead($peerNumber: String!) {
    markWhatsappConversationRead(peerNumber: $peerNumber)
  }
`;

export const RECONFIGURE_WHATSAPP_WEBHOOK = gql`
  mutation ReconfigureWhatsappWebhook {
    reconfigureWhatsappWebhook {
      ok
      format
      webhookUrl
    }
  }
`;

export const GET_WHATSAPP_WEBHOOK_CONFIG = gql`
  query GetWhatsappWebhookConfig {
    whatsappWebhookConfig
  }
`;

export const SYNC_WHATSAPP_FROM_EVOLUTION = gql`
  mutation SyncWhatsappFromEvolution {
    syncWhatsappFromEvolution
  }
`;

export const SYNC_WHATSAPP_CONTACTS = gql`
  mutation SyncWhatsappContacts {
    syncWhatsappContacts
  }
`;

export const SYNC_WHATSAPP_MESSAGES_FOR_PEER = gql`
  mutation SyncWhatsappMessagesForPeer($peerNumber: String!, $limit: Int) {
    syncWhatsappMessagesForPeer(peerNumber: $peerNumber, limit: $limit)
  }
`;

export const GET_WHATSAPP_CONTACT = gql`
  query GetWhatsappContact($peerNumber: String!) {
    whatsappContact(peerNumber: $peerNumber) {
      peerNumber
      displayName
      phoneFormatted
      isGroup
      profilePicUrl
      about
      isBusiness
      verifiedName
      businessCategory
      businessDescription
      customerId
      customerName
      totalMessages
      inboundCount
      outboundCount
      messages7d
      messages30d
      daysSinceLastMessage
      avgResponseMinutes
      unansweredOutbound
      mediaCount
      callCount
      shouldGreet
      tags
      internalNotes
      conversationStatus
      assignedUserId
      assignedUserName
      firstMessageAt
      lastMessageAt
      waLink
    }
  }
`;

export const GET_WHATSAPP_ACTIVITY_TIMELINE = gql`
  query GetWhatsappActivityTimeline($peerNumber: String!, $limit: Int) {
    whatsappActivityTimeline(peerNumber: $peerNumber, limit: $limit) {
      id
      type
      at
      description
      actor
      icon
    }
  }
`;

export const GET_WHATSAPP_MEDIA_SUMMARY = gql`
  query GetWhatsappMediaSummary($peerNumber: String!) {
    whatsappMediaSummary(peerNumber: $peerNumber) {
      images
      videos
      audios
      documents
      stickers
      locations
    }
  }
`;

export const UPDATE_WHATSAPP_CONTACT_CRM = gql`
  mutation UpdateWhatsappContactCrm(
    $peerNumber: String!
    $patch: WhatsappCrmInput!
  ) {
    updateWhatsappContactCrm(peerNumber: $peerNumber, patch: $patch)
  }
`;

export const GET_WHATSAPP_CONTACTS_LIST = gql`
  query GetWhatsappContactsList {
    whatsappContactsList {
      jid
      number
      name
      profilePicUrl
      isGroup
      messageCount
      customerId
      customerName
      lastInteractionAt
    }
  }
`;

export const CREATE_CUSTOMER_FROM_WHATSAPP_CONTACT = gql`
  mutation CreateCustomerFromWhatsappContact(
    $peerNumber: String!
    $name: String
    $document: String
    $email: String
  ) {
    createCustomerFromWhatsappContact(
      peerNumber: $peerNumber
      name: $name
      document: $document
      email: $email
    ) {
      customerId
      linkedMessages
    }
  }
`;

const REMINDER_FIELDS = `
  id
  peerNumber
  title
  description
  tag
  dueAt
  doneAt
  createdBy
  createdAt
`;

export const GET_WHATSAPP_REMINDERS = gql`
  query GetWhatsappReminders($peerNumber: String, $tag: String, $pending: Boolean) {
    whatsappReminders(peerNumber: $peerNumber, tag: $tag, pending: $pending) {
      ${REMINDER_FIELDS}
    }
  }
`;

export const CREATE_WHATSAPP_REMINDER = gql`
  mutation CreateWhatsappReminder(
    $peerNumber: String!
    $title: String!
    $dueAt: DateTime!
    $description: String
    $tag: String
  ) {
    createWhatsappReminder(
      peerNumber: $peerNumber
      title: $title
      dueAt: $dueAt
      description: $description
      tag: $tag
    ) {
      ${REMINDER_FIELDS}
    }
  }
`;

export const MARK_WHATSAPP_REMINDER_DONE = gql`
  mutation MarkWhatsappReminderDone($id: String!, $done: Boolean!) {
    markWhatsappReminderDone(id: $id, done: $done)
  }
`;

export const DELETE_WHATSAPP_REMINDER = gql`
  mutation DeleteWhatsappReminder($id: String!) {
    deleteWhatsappReminder(id: $id)
  }
`;

export const ON_WHATSAPP_REMINDER_DUE = gql`
  subscription OnWhatsappReminderDue {
    whatsappReminderDue {
      ${REMINDER_FIELDS}
    }
  }
`;

export const SEARCH_CUSTOMERS_FOR_LINK = gql`
  query SearchCustomersForLink($search: String) {
    customers(search: $search) {
      id
      name
      document
      phone
      email
    }
  }
`;

export const LINK_CUSTOMER_TO_WHATSAPP_CONTACT = gql`
  mutation LinkCustomerToWhatsappContact(
    $peerNumber: String!
    $customerId: String!
  ) {
    linkCustomerToWhatsappContact(
      peerNumber: $peerNumber
      customerId: $customerId
    )
  }
`;

export const UNLINK_CUSTOMER_FROM_WHATSAPP_CONTACT = gql`
  mutation UnlinkCustomerFromWhatsappContact($peerNumber: String!) {
    unlinkCustomerFromWhatsappContact(peerNumber: $peerNumber)
  }
`;
