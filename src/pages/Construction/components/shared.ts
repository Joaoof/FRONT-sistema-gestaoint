export type ObraStatus = 'PLANEJAMENTO' | 'EM_EXECUCAO' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA';
export type TipoTransacao = 'RECEITA' | 'DESPESA';
export type StatusTransacao = 'PENDENTE' | 'CONFIRMADO' | 'ESTORNADO' | 'CANCELADO';
export type VersaoOrcamentoStatus = 'RASCUNHO' | 'ATIVO' | 'SUBSTITUIDO' | 'ARQUIVADO';
export type CategoriaConstrucaoTipo =
  | 'MATERIAL'
  | 'MAO_DE_OBRA'
  | 'EQUIPAMENTO'
  | 'SERVICO_TERCEIRO'
  | 'ADMINISTRATIVO'
  | 'IMPOSTO'
  | 'OUTRO';
export type TipoData = 'COMPETENCIA' | 'REAL';
export type GranularidadeFluxo = 'DIA' | 'SEMANA' | 'MES';

export const formatBRL = (n: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n ?? 0));

export const formatPct = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `${Number(n).toFixed(1)}%`;

export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

export const OBRA_STATUS_LABEL: Record<ObraStatus, string> = {
  PLANEJAMENTO: 'Planejamento',
  EM_EXECUCAO: 'Em execução',
  PAUSADA: 'Pausada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const OBRA_STATUS_TONE: Record<ObraStatus, string> = {
  PLANEJAMENTO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  EM_EXECUCAO: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  PAUSADA: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  CONCLUIDA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  CANCELADA: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

export const TRANS_STATUS_LABEL: Record<StatusTransacao, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ESTORNADO: 'Estornado',
  CANCELADO: 'Cancelado',
};

export const TRANS_STATUS_TONE: Record<StatusTransacao, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  ESTORNADO: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  CANCELADO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export const TIPO_TRANS_TONE: Record<TipoTransacao, string> = {
  RECEITA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  DESPESA: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

export const VERSAO_STATUS_LABEL: Record<VersaoOrcamentoStatus, string> = {
  RASCUNHO: 'Rascunho',
  ATIVO: 'Ativo',
  SUBSTITUIDO: 'Substituído',
  ARQUIVADO: 'Arquivado',
};

export const VERSAO_STATUS_TONE: Record<VersaoOrcamentoStatus, string> = {
  RASCUNHO: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  ATIVO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  SUBSTITUIDO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ARQUIVADO: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export const CAT_TIPO_LABEL: Record<CategoriaConstrucaoTipo, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  EQUIPAMENTO: 'Equipamento',
  SERVICO_TERCEIRO: 'Serviço terceiro',
  ADMINISTRATIVO: 'Administrativo',
  IMPOSTO: 'Imposto',
  OUTRO: 'Outro',
};
