import { gql } from '@apollo/client';

const NOTIFICATION_FIELDS = `
  id
  companyId
  userId
  type
  severity
  title
  message
  href
  entity
  entityId
  metadataJson
  readAt
  createdAt
  expiresAt
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($filter: NotificationFilterInput) {
    notifications(filter: $filter) {
      items { ${NOTIFICATION_FIELDS} }
      total
      page
      pageSize
      unreadCount
    }
  }
`;

export const GET_NOTIFICATIONS_UNREAD_COUNT = gql`
  query GetNotificationsUnreadCount {
    notificationsUnreadCount
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) { ${NOTIFICATION_FIELDS} }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const DISMISS_NOTIFICATION = gql`
  mutation DismissNotification($id: String!) {
    dismissNotification(id: $id)
  }
`;
