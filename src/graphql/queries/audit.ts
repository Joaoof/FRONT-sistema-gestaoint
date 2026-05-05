import { gql } from '@apollo/client';

const AUDIT_LOG_FIELDS = `
  id
  companyId
  userId
  userName
  userEmail
  entity
  entityId
  action
  beforeJson
  afterJson
  reason
  createdAt
`;

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: AuditLogFilterInput) {
    auditLogs(filter: $filter) {
      items {
        ${AUDIT_LOG_FIELDS}
      }
      total
      page
      pageSize
    }
  }
`;

export const GET_AUDIT_LOG = gql`
  query GetAuditLog($id: String!) {
    auditLog(id: $id) {
      ${AUDIT_LOG_FIELDS}
    }
  }
`;

export const GET_AUDIT_LOGS_FOR_ENTITY = gql`
  query GetAuditLogsForEntity(
    $entity: String!
    $entityId: String!
    $limit: Int
  ) {
    auditLogsForEntity(entity: $entity, entityId: $entityId, limit: $limit) {
      ${AUDIT_LOG_FIELDS}
    }
  }
`;

export const VERIFY_AUDIT_ACCESS = gql`
  mutation VerifyAuditAccess($password: String!) {
    verifyAuditAccess(password: $password) {
      token
      expiresIn
    }
  }
`;

export const GET_AUDIT_LOGS_EXPORT_CSV = gql`
  query GetAuditLogsExportCsv($filter: AuditLogFilterInput) {
    auditLogsExportCsv(filter: $filter)
  }
`;
