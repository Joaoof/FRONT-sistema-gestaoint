import { gql } from '@apollo/client';

const TIMELINE_FIELDS = `
  id
  type
  categories
  at
  title
  description
  actor
  amount
  peerNumber
  entityId
  entityType
  iconKey
  colorKey
`;

export const GET_COMPANY_TIMELINE = gql`
  query GetCompanyTimeline(
    $fromDate: DateTime
    $toDate: DateTime
    $types: [TimelineEventType!]
    $categories: [TimelineCategory!]
    $limit: Int
  ) {
    companyTimeline(
      fromDate: $fromDate
      toDate: $toDate
      types: $types
      categories: $categories
      limit: $limit
    ) {
      ${TIMELINE_FIELDS}
    }
  }
`;

const COMPANY_REMINDER_FIELDS = `
  id
  title
  description
  category
  priority
  link
  dueAt
  doneAt
  notifiedAt
  createdBy
  createdAt
`;

export const GET_COMPANY_REMINDERS = gql`
  query GetCompanyReminders($pending: Boolean, $category: String, $priority: String) {
    companyReminders(pending: $pending, category: $category, priority: $priority) {
      ${COMPANY_REMINDER_FIELDS}
    }
  }
`;

export const CREATE_COMPANY_REMINDER = gql`
  mutation CreateCompanyReminder(
    $title: String!
    $dueAt: DateTime!
    $description: String
    $category: String
    $priority: String
    $link: String
  ) {
    createCompanyReminder(
      title: $title
      dueAt: $dueAt
      description: $description
      category: $category
      priority: $priority
      link: $link
    ) {
      ${COMPANY_REMINDER_FIELDS}
    }
  }
`;

export const TOGGLE_COMPANY_REMINDER_DONE = gql`
  mutation ToggleCompanyReminderDone($id: String!, $done: Boolean!) {
    toggleCompanyReminderDone(id: $id, done: $done)
  }
`;

export const SNOOZE_COMPANY_REMINDER = gql`
  mutation SnoozeCompanyReminder($id: String!, $minutes: Int!) {
    snoozeCompanyReminder(id: $id, minutes: $minutes)
  }
`;

export const DELETE_COMPANY_REMINDER = gql`
  mutation DeleteCompanyReminder($id: String!) {
    deleteCompanyReminder(id: $id)
  }
`;

export const ON_COMPANY_REMINDER_DUE = gql`
  subscription OnCompanyReminderDue {
    companyReminderDue {
      ${COMPANY_REMINDER_FIELDS}
    }
  }
`;
