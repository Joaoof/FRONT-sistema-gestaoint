import { gql } from '@apollo/client';

const TEMPLATE_FIELDS = `
  id
  companyId
  key
  channel
  name
  subject
  body
  active
  createdAt
  updatedAt
`;

export const GET_NOTIFICATION_TEMPLATES = gql`
  query GetNotificationTemplates(
    $channel: NotificationChannel
    $activeOnly: Boolean
  ) {
    notificationTemplates(channel: $channel, activeOnly: $activeOnly) {
      ${TEMPLATE_FIELDS}
    }
  }
`;

export const CREATE_NOTIFICATION_TEMPLATE = gql`
  mutation CreateNotificationTemplate(
    $input: CreateNotificationTemplateInput!
  ) {
    createNotificationTemplate(input: $input) { ${TEMPLATE_FIELDS} }
  }
`;

export const UPDATE_NOTIFICATION_TEMPLATE = gql`
  mutation UpdateNotificationTemplate(
    $id: String!
    $input: UpdateNotificationTemplateInput!
  ) {
    updateNotificationTemplate(id: $id, input: $input) { ${TEMPLATE_FIELDS} }
  }
`;

export const DELETE_NOTIFICATION_TEMPLATE = gql`
  mutation DeleteNotificationTemplate($id: String!) {
    deleteNotificationTemplate(id: $id)
  }
`;
