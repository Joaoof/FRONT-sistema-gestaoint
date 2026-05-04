import { gql } from '@apollo/client';

const FISCAL_CONFIG_FIELDS = `
  id
  companyId
  ambiente
  regimeTributario
  cnpj
  inscricaoEstadual
  inscricaoMunicipal
  razaoSocial
  nomeFantasia
  endereco
  numero
  complemento
  bairro
  cidade
  codigoMunicipioIbge
  uf
  cep
  serieNfe
  proximoNumeroNfe
  serieNfce
  proximoNumeroNfce
  serieNfse
  proximoNumeroNfse
  hasCertificado
  certificadoValidoAte
  cscIdNfce
  providerName
  hasProviderToken
  providerCnpjReference
  ativo
  createdAt
  updatedAt
`;

export const GET_FISCAL_CONFIG = gql`
  query GetCompanyFiscalConfig {
    companyFiscalConfig {
      ${FISCAL_CONFIG_FIELDS}
    }
  }
`;

export const UPSERT_FISCAL_CONFIG = gql`
  mutation UpsertCompanyFiscalConfig($input: UpsertCompanyFiscalConfigInput!) {
    upsertCompanyFiscalConfig(input: $input) {
      ${FISCAL_CONFIG_FIELDS}
    }
  }
`;

export const DELETE_FISCAL_CONFIG = gql`
  mutation DeleteCompanyFiscalConfig {
    deleteCompanyFiscalConfig
  }
`;
