/**
 * Queries/Mutations do sistema de feature flags por empresa.
 *
 *  - myFeatures: usado pelo cliente logado (gestaoint) pra saber quais
 *    módulos estão habilitados → gating de menu/rotas.
 *
 *  - superAdmin*: usado pelo SuperAdmin pra ligar/desligar módulos,
 *    salvar tokens criptografados, aplicar templates de negócio.
 */

export const MY_FEATURES_QUERY = `
  query MyFeatures {
    myFeatures {
      module_key
      name
      enabled
      source
      permission
      hasConfig
    }
  }
`;

// ============================================================
//   SUPER ADMIN
// ============================================================

export const SUPER_ADMIN_COMPANY_FEATURES_QUERY = `
  query SuperAdminCompanyFeatures($companyId: String!) {
    superAdminCompanyFeatures(companyId: $companyId) {
      module_key
      name
      enabled
      source
      permission
      hasConfig
    }
  }
`;

export const SUPER_ADMIN_COMPANY_OVERRIDES_QUERY = `
  query SuperAdminCompanyOverrides($companyId: String!) {
    superAdminCompanyOverrides(companyId: $companyId) {
      id
      companyId
      module_key
      enabled
      hasConfig
      updatedAt
    }
  }
`;

export const SUPER_ADMIN_COMPANY_MODULE_CONFIG_QUERY = `
  query SuperAdminCompanyModuleConfig($companyId: String!, $module_key: String!) {
    superAdminCompanyModuleConfig(companyId: $companyId, module_key: $module_key) {
      key
      type
      valueJson
      hasValue
      hint
    }
  }
`;

export const SUPER_ADMIN_BUSINESS_TEMPLATES_QUERY = `
  query SuperAdminBusinessTemplates {
    superAdminBusinessTemplates {
      id
      template_key
      name
      description
      icon
      isActive
      modules {
        module_key
        enabled
      }
    }
  }
`;

export const SUPER_ADMIN_TOGGLE_COMPANY_MODULE_MUTATION = `
  mutation SuperAdminToggleCompanyModule($input: ToggleCompanyModuleInput!) {
    superAdminToggleCompanyModule(input: $input)
  }
`;

export const SUPER_ADMIN_SET_COMPANY_MODULE_CONFIG_MUTATION = `
  mutation SuperAdminSetCompanyModuleConfig($input: SetCompanyModuleConfigInput!) {
    superAdminSetCompanyModuleConfig(input: $input)
  }
`;

export const SUPER_ADMIN_APPLY_BUSINESS_TEMPLATE_MUTATION = `
  mutation SuperAdminApplyBusinessTemplate($input: ApplyBusinessTemplateInput!) {
    superAdminApplyBusinessTemplate(input: $input)
  }
`;
