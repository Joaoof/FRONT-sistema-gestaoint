import { gql } from '@apollo/client';

const SETTINGS_FIELDS = `
  id
  companyId
  currency
  locale
  timezone
  dateFormat
  timeFormat
  numberDecimals
  numberDecimalSep
  numberThousandSep
  weekStartsOn
  fiscalYearStartMonth
  defaultPageSize
  companyWhatsappNumber
  companyWhatsappName
  createdAt
  updatedAt
`;

export const GET_COMPANY_SETTINGS = gql`
  query GetCompanySettings {
    companySettings {
      ${SETTINGS_FIELDS}
    }
  }
`;

export const UPSERT_COMPANY_SETTINGS = gql`
  mutation UpsertCompanySettings($input: UpsertCompanySettingsInput!) {
    upsertCompanySettings(input: $input) {
      ${SETTINGS_FIELDS}
    }
  }
`;
