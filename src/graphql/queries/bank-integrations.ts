import { gql } from '@apollo/client';

export const BANK_INTEGRATIONS_STATUS = gql`
  query BankIntegrationsStatus {
    bankIntegrationsStatus {
      provider
      label
      configured
      environment
      pixWebhookUrl
      boletoWebhookUrl
      lastWebhookAt
      lastErrorAt
      lastErrorMsg
      totalWebhooks
      processedWebhooks
      credentials { key label filled }
      recentEvents {
        id provider event processed errorMsg refType refId createdAt
      }
    }
  }
`;
