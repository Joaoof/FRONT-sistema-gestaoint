import { gql } from '@apollo/client';

// ============ Users ============
export const ADMIN_USERS = gql`
  query AdminUsers($search: String) {
    adminUsers(search: $search) {
      id name email phone role is_active isSuperAdmin
      company_id companyName createdAt
    }
  }
`;

export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    adminCreateUser(input: $input) {
      id name email role isSuperAdmin
    }
  }
`;

export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($input: AdminUpdateUserInput!) {
    adminUpdateUser(input: $input) {
      id name email role is_active isSuperAdmin
    }
  }
`;

export const ADMIN_RESET_PASSWORD = gql`
  mutation AdminResetUserPassword($input: AdminResetPasswordInput!) {
    adminResetUserPassword(input: $input)
  }
`;

export const ADMIN_DEACTIVATE_USER = gql`
  mutation AdminDeactivateUser($id: String!) {
    adminDeactivateUser(id: $id)
  }
`;

// ============ Plans / Modules ============
export const ADMIN_PLANS = gql`
  query AdminPlans {
    adminPlans {
      id name description isActive
      modules {
        id planId moduleId isActive permission
        module { id name module_key description }
      }
    }
  }
`;

export const ADMIN_MODULES = gql`
  query AdminModules {
    adminModules { id name module_key description }
  }
`;

export const ADMIN_CREATE_PLAN = gql`
  mutation AdminCreatePlan($input: AdminCreatePlanInput!) {
    adminCreatePlan(input: $input) { id name }
  }
`;

export const ADMIN_UPDATE_PLAN = gql`
  mutation AdminUpdatePlan($input: AdminUpdatePlanInput!) {
    adminUpdatePlan(input: $input) { id name isActive }
  }
`;

export const ADMIN_DELETE_PLAN = gql`
  mutation AdminDeletePlan($id: String!) {
    adminDeletePlan(id: $id)
  }
`;

export const ADMIN_CREATE_MODULE = gql`
  mutation AdminCreateModule($input: AdminCreateModuleInput!) {
    adminCreateModule(input: $input) { id name module_key }
  }
`;

export const ADMIN_UPSERT_PLAN_MODULE = gql`
  mutation AdminUpsertPlanModule($input: AdminUpsertPlanModuleInput!) {
    adminUpsertPlanModule(input: $input)
  }
`;

export const ADMIN_REMOVE_PLAN_MODULE = gql`
  mutation AdminRemovePlanModule($planId: String!, $moduleId: String!) {
    adminRemovePlanModule(planId: $planId, moduleId: $moduleId)
  }
`;

// ============ Companies ============
export const ADMIN_COMPANIES = gql`
  query AdminCompanies {
    adminCompanies {
      id name email userCount currentPlanId currentPlanName
    }
  }
`;

export const ADMIN_ASSIGN_PLAN = gql`
  mutation AdminAssignPlanToCompany($input: AdminAssignPlanInput!) {
    adminAssignPlanToCompany(input: $input)
  }
`;

// ============ Audit logs (master) ============
export const ADMIN_AUDIT_LOGS = gql`
  query AdminAuditLogs($filter: AuditLogFilterInput) {
    auditLogs(filter: $filter) {
      items {
        id entity entityId action userId userName userEmail reason createdAt
        beforeJson afterJson companyId
      }
      total page pageSize
    }
  }
`;
