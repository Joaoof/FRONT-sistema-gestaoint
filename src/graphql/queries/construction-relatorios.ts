import { gql } from '@apollo/client';

export const REL_PREVISTO_VS_REALIZADO = gql`
  query RelatorioPrevistoVsRealizado($filter: RelatorioFiltroInput!) {
    relatorioPrevistoVsRealizado(filter: $filter) {
      totalPrevisto
      totalRealizado
      totalPendente
      saldo
      percentExecutado
      porObra { chaveId chaveNome previsto realizado pendente saldo percentExecutado }
      porEtapa { chaveId chaveNome previsto realizado pendente saldo percentExecutado }
      porCategoria { chaveId chaveNome previsto realizado pendente saldo percentExecutado }
    }
  }
`;

export const REL_DESVIO = gql`
  query RelatorioDesvio($filter: RelatorioFiltroInput!) {
    relatorioDesvio(filter: $filter) {
      totalDesvios
      porObra { chaveId chaveNome previsto realizado desvioAbs desvioPct }
      porEtapa { chaveId chaveNome previsto realizado desvioAbs desvioPct }
      porCategoria { chaveId chaveNome previsto realizado desvioAbs desvioPct }
    }
  }
`;

export const REL_FLUXO_CAIXA = gql`
  query RelatorioFluxoCaixa($input: RelatorioFluxoCaixaInput!) {
    relatorioFluxoCaixa(input: $input) {
      totalEntradasConfirmadas
      totalSaidasConfirmadas
      totalEntradasPrevistas
      totalSaidasPrevistas
      saldoFinalConfirmado
      saldoFinalProjetado
      pontos {
        periodo
        entradasConfirmadas
        saidasConfirmadas
        entradasPrevistas
        saidasPrevistas
        saldoConfirmado
        saldoProjetado
      }
    }
  }
`;

export const REL_QUEBRA_CUSTOS = gql`
  query RelatorioQuebraCustos($filter: RelatorioFiltroInput!) {
    relatorioQuebraCustos(filter: $filter) {
      total
      porCategoria { id nome valor percentTotal }
      porTipoCategoria { id nome valor percentTotal }
      porCentroCusto { id nome valor percentTotal }
      porFornecedor { id nome valor percentTotal }
    }
  }
`;
