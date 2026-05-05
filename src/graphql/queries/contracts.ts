import { gql } from '@apollo/client';

const CONTRACT_FIELDS = `
  id
  companyId
  customerId
  number
  title
  status
  startDate
  endDate
  value
  billingCycle
  autoRenew
  sellerId
  description
  terms
  createdAt
  updatedAt
`;

const SLA_FIELDS = `
  id
  contractId
  kind
  name
  description
  targetValue
  unit
  penaltyPercent
  active
  createdAt
  updatedAt
`;

const SLA_EVENT_FIELDS = `
  id
  serviceLevelId
  occurredAt
  measuredValue
  met
  notes
  createdById
  createdAt
`;

const CONTRACT_EVENT_FIELDS = `
  id
  contractId
  type
  occurredAt
  notes
  createdById
  createdAt
`;

export const GET_CONTRACTS = gql`
  query GetContracts($filter: ContractFilterInput) {
    contracts(filter: $filter) { ${CONTRACT_FIELDS} }
  }
`;

export const GET_CONTRACT = gql`
  query GetContract($id: String!) {
    contract(id: $id) {
      ${CONTRACT_FIELDS}
      serviceLevels { ${SLA_FIELDS} }
    }
  }
`;

export const GET_CONTRACT_EVENTS = gql`
  query GetContractEvents($contractId: String!) {
    contractEvents(contractId: $contractId) { ${CONTRACT_EVENT_FIELDS} }
  }
`;

export const GET_SERVICE_LEVEL_EVENTS = gql`
  query GetServiceLevelEvents($serviceLevelId: String!) {
    serviceLevelEvents(serviceLevelId: $serviceLevelId) { ${SLA_EVENT_FIELDS} }
  }
`;

export const CREATE_CONTRACT = gql`
  mutation CreateContract($input: CreateContractInput!) {
    createContract(input: $input) { ${CONTRACT_FIELDS} }
  }
`;

export const UPDATE_CONTRACT = gql`
  mutation UpdateContract($id: String!, $input: UpdateContractInput!) {
    updateContract(id: $id, input: $input) { ${CONTRACT_FIELDS} }
  }
`;

export const ACTIVATE_CONTRACT = gql`
  mutation ActivateContract($id: String!) {
    activateContract(id: $id) { ${CONTRACT_FIELDS} }
  }
`;

export const SUSPEND_CONTRACT = gql`
  mutation SuspendContract($id: String!, $reason: String) {
    suspendContract(id: $id, reason: $reason) { ${CONTRACT_FIELDS} }
  }
`;

export const RESUME_CONTRACT = gql`
  mutation ResumeContract($id: String!) {
    resumeContract(id: $id) { ${CONTRACT_FIELDS} }
  }
`;

export const TERMINATE_CONTRACT = gql`
  mutation TerminateContract($id: String!, $reason: String) {
    terminateContract(id: $id, reason: $reason) { ${CONTRACT_FIELDS} }
  }
`;

export const RENEW_CONTRACT = gql`
  mutation RenewContract($id: String!, $newEndDate: DateTime!) {
    renewContract(id: $id, newEndDate: $newEndDate) { ${CONTRACT_FIELDS} }
  }
`;

export const DELETE_CONTRACT = gql`
  mutation DeleteContract($id: String!) {
    deleteContract(id: $id)
  }
`;

export const ADD_SERVICE_LEVEL = gql`
  mutation AddServiceLevel(
    $contractId: String!
    $input: CreateServiceLevelInput!
  ) {
    addServiceLevel(contractId: $contractId, input: $input) { ${SLA_FIELDS} }
  }
`;

export const UPDATE_SERVICE_LEVEL = gql`
  mutation UpdateServiceLevel(
    $id: String!
    $input: UpdateServiceLevelInput!
  ) {
    updateServiceLevel(id: $id, input: $input) { ${SLA_FIELDS} }
  }
`;

export const DELETE_SERVICE_LEVEL = gql`
  mutation DeleteServiceLevel($id: String!) {
    deleteServiceLevel(id: $id)
  }
`;

export const RECORD_SERVICE_LEVEL_EVENT = gql`
  mutation RecordServiceLevelEvent(
    $serviceLevelId: String!
    $input: CreateServiceLevelEventInput!
  ) {
    recordServiceLevelEvent(
      serviceLevelId: $serviceLevelId
      input: $input
    ) { ${SLA_EVENT_FIELDS} }
  }
`;
