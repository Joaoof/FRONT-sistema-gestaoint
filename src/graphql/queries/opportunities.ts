import { gql } from '@apollo/client';

const OPP_FIELDS = `
  id
  companyId
  customerId
  customerName
  customerPhone
  customerEmail
  title
  source
  stage
  value
  probability
  expectedCloseDate
  closedAt
  ownerUserId
  sellerId
  notes
  lostReason
  createdAt
  updatedAt
`;

const ACTIVITY_FIELDS = `
  id
  opportunityId
  type
  status
  title
  description
  dueDate
  completedAt
  assignedToUserId
  createdAt
  updatedAt
`;

export const GET_PIPELINE = gql`
  query GetPipeline($filter: OpportunityFilterInput) {
    pipeline(filter: $filter) {
      stage
      count
      totalValue
      items { ${OPP_FIELDS} }
    }
  }
`;

export const GET_OPPORTUNITIES = gql`
  query GetOpportunities($filter: OpportunityFilterInput) {
    opportunities(filter: $filter) { ${OPP_FIELDS} }
  }
`;

export const GET_OPPORTUNITY = gql`
  query GetOpportunity($id: String!) {
    opportunity(id: $id) { ${OPP_FIELDS} }
  }
`;

export const GET_OPPORTUNITY_ACTIVITIES = gql`
  query GetOpportunityActivities($opportunityId: String!) {
    opportunityActivities(opportunityId: $opportunityId) { ${ACTIVITY_FIELDS} }
  }
`;

export const CREATE_OPPORTUNITY = gql`
  mutation CreateOpportunity($input: CreateOpportunityInput!) {
    createOpportunity(input: $input) { ${OPP_FIELDS} }
  }
`;

export const UPDATE_OPPORTUNITY = gql`
  mutation UpdateOpportunity($id: String!, $input: UpdateOpportunityInput!) {
    updateOpportunity(id: $id, input: $input) { ${OPP_FIELDS} }
  }
`;

export const MOVE_OPPORTUNITY_STAGE = gql`
  mutation MoveOpportunityStage($id: String!, $stage: OpportunityStage!) {
    moveOpportunityStage(id: $id, stage: $stage) { ${OPP_FIELDS} }
  }
`;

export const DELETE_OPPORTUNITY = gql`
  mutation DeleteOpportunity($id: String!) {
    deleteOpportunity(id: $id)
  }
`;

export const ADD_OPPORTUNITY_ACTIVITY = gql`
  mutation AddOpportunityActivity(
    $opportunityId: String!
    $input: CreateActivityInput!
  ) {
    addOpportunityActivity(opportunityId: $opportunityId, input: $input) {
      ${ACTIVITY_FIELDS}
    }
  }
`;

export const UPDATE_OPPORTUNITY_ACTIVITY = gql`
  mutation UpdateOpportunityActivity(
    $id: String!
    $input: UpdateActivityInput!
  ) {
    updateOpportunityActivity(id: $id, input: $input) { ${ACTIVITY_FIELDS} }
  }
`;

export const DELETE_OPPORTUNITY_ACTIVITY = gql`
  mutation DeleteOpportunityActivity($id: String!) {
    deleteOpportunityActivity(id: $id)
  }
`;
