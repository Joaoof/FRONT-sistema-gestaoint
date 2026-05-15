export const Q_EVOLUTION_STATUS = `
  query SuperAdminEvolutionStatus($companyId: String!) {
    superAdminEvolutionStatus(companyId: $companyId) {
      configured serverUrl hasApiKey apiKeyHint instanceName
      status connectionState phone profileName profilePicUrl
      qrCodeBase64 webhookUrl webhookToken lastError lastSyncAt
    }
  }
`;

export const M_SAVE_EVOLUTION_CONFIG = `
  mutation SuperAdminSaveEvolutionConfig($input: SaveEvolutionConfigInput!) {
    superAdminSaveEvolutionConfig(input: $input) {
      configured serverUrl hasApiKey apiKeyHint instanceName status
      webhookUrl webhookToken lastError lastSyncAt
    }
  }
`;

export const M_EVOLUTION_CONNECT = `
  mutation SuperAdminEvolutionConnect($companyId: String!) {
    superAdminEvolutionConnect(companyId: $companyId) {
      configured status qrCodeBase64 phone profileName lastError
    }
  }
`;

export const M_EVOLUTION_REFRESH = `
  mutation SuperAdminEvolutionRefreshStatus($companyId: String!) {
    superAdminEvolutionRefreshStatus(companyId: $companyId) {
      configured status phone profileName profilePicUrl
      qrCodeBase64 lastError lastSyncAt
    }
  }
`;

export const M_EVOLUTION_DISCONNECT = `
  mutation SuperAdminEvolutionDisconnect($companyId: String!) {
    superAdminEvolutionDisconnect(companyId: $companyId) {
      status qrCodeBase64
    }
  }
`;

export const Q_EVOLUTION_FLOWS = `
  query SuperAdminEvolutionFlows($companyId: String!) {
    superAdminEvolutionFlows(companyId: $companyId) {
      id name trigger pattern responseBody priority enabled cooldownMinutes createdAt updatedAt
    }
  }
`;

export const M_CREATE_EVOLUTION_FLOW = `
  mutation SuperAdminCreateEvolutionFlow($input: CreateEvolutionFlowInput!) {
    superAdminCreateEvolutionFlow(input: $input) {
      id name trigger pattern responseBody priority enabled cooldownMinutes
    }
  }
`;

export const M_UPDATE_EVOLUTION_FLOW = `
  mutation SuperAdminUpdateEvolutionFlow($input: UpdateEvolutionFlowInput!) {
    superAdminUpdateEvolutionFlow(input: $input) {
      id name trigger pattern responseBody priority enabled cooldownMinutes
    }
  }
`;

export const M_DELETE_EVOLUTION_FLOW = `
  mutation SuperAdminDeleteEvolutionFlow($companyId: String!, $id: ID!) {
    superAdminDeleteEvolutionFlow(companyId: $companyId, id: $id)
  }
`;
