import { gql } from '@apollo/client';

const CALENDAR_ITEM_FIELDS = `
  id
  source
  sourceId
  occurrenceId
  title
  description
  color
  allDay
  startAt
  endAt
  status
  priority
  category
  link
  location
  amount
  editable
`;

const CALENDAR_EVENT_FIELDS = `
  id
  companyId
  userId
  title
  description
  location
  color
  allDay
  startAt
  endAt
  timezone
  rrule
  recurrenceUntil
  category
  priority
  link
  reminders { offsetMin channels }
  channels
  createdBy
  createdAt
  updatedAt
`;

export const GET_CALENDAR_ITEMS = gql`
  query GetCalendarItems($range: CalendarRangeInput!) {
    calendarItems(range: $range) { ${CALENDAR_ITEM_FIELDS} }
  }
`;

export const GET_CALENDAR_EVENT = gql`
  query GetCalendarEvent($id: String!) {
    calendarEvent(id: $id) { ${CALENDAR_EVENT_FIELDS} }
  }
`;

export const CREATE_CALENDAR_EVENT = gql`
  mutation CreateCalendarEvent($input: CreateCalendarEventInput!) {
    createCalendarEvent(input: $input) { ${CALENDAR_EVENT_FIELDS} }
  }
`;

export const UPDATE_CALENDAR_EVENT = gql`
  mutation UpdateCalendarEvent($input: UpdateCalendarEventInput!) {
    updateCalendarEvent(input: $input) { ${CALENDAR_EVENT_FIELDS} }
  }
`;

export const DELETE_CALENDAR_EVENT = gql`
  mutation DeleteCalendarEvent($id: String!) {
    deleteCalendarEvent(id: $id)
  }
`;

export const CANCEL_CALENDAR_OCCURRENCE = gql`
  mutation CancelCalendarOccurrence($eventId: String!, $occurrence: DateTime!) {
    cancelCalendarOccurrence(eventId: $eventId, occurrence: $occurrence)
  }
`;

export const GET_WEB_PUSH_PUBLIC_KEY = gql`
  query GetWebPushPublicKey {
    webPushPublicKey
  }
`;

export const SUBSCRIBE_WEB_PUSH = gql`
  mutation SubscribeWebPush($input: PushSubscriptionInput!) {
    subscribeWebPush(input: $input)
  }
`;

export const UNSUBSCRIBE_WEB_PUSH = gql`
  mutation UnsubscribeWebPush($endpoint: String!) {
    unsubscribeWebPush(endpoint: $endpoint)
  }
`;

export const TEST_WEB_PUSH = gql`
  mutation TestWebPush {
    testWebPush
  }
`;

export const SUMMARIZE_AGENDA = gql`
  mutation SummarizeAgenda(
    $period: String!
    $referenceDate: DateTime
    $sources: [String!]
  ) {
    summarizeAgenda(
      period: $period
      referenceDate: $referenceDate
      sources: $sources
    )
  }
`;

export const SUMMARIZE_AGENDA_AUDIO = gql`
  mutation SummarizeAgendaAudio(
    $period: String!
    $referenceDate: DateTime
    $sources: [String!]
    $voice: String
  ) {
    summarizeAgendaAudio(
      period: $period
      referenceDate: $referenceDate
      sources: $sources
      voice: $voice
    ) {
      audioBase64
      transcript
      mimeType
    }
  }
`;
