import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import {
  CANCELAR_TRANSACAO_PENDENTE,
  CONFIRMAR_TRANSACAO,
  ESTORNAR_TRANSACAO,
  GET_TRANSACOES,
} from '../../../graphql/queries/construction-transacoes';
import { GET_OBRAS } from '../../../graphql/queries/construction-obras';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import {
  formatBRL,
  formatDate,
  TIPO_TRANS_TONE,
  TRANS_STATUS_LABEL,
  TRANS_STATUS_TONE,
  type StatusTransacao,
  type TipoData,
  type TipoTransacao,
} from '../components/shared';

interface Trans {
  id: string;
  obraId: string;
  tipo: TipoTransacao;
  status: StatusTransacao;
  valor: number;
  descricao: string;
  documento?: string | null;
  dataReal?: string | null;
  dataCompetencia: string;
}

export function TransacoesList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialObra = params.get('obraId') ?? '';

  const [obraId, setObraId] = useState(initialObra);
  const [tipo, setTipo] = useState<TipoTransacao | ''>('');
  const [status, setStatus] = useState<StatusTransacao | ''>('');
  const [tipoData, setTipoData] = useState<TipoData>('COMPETENCIA');

  const filter = {
    obraId: obraId || null,
    tipo: tipo || null,
    status: status || null,
    tipoData,
  };

  const { data: obrasData } = useQuery<{ obras: { id: string; codigo: string; nome: string }[] }>(GET_OBRAS, {
    fetchPolicy: 'cache-first',
  });
  const { data, loading, refetch } = useQuery<{ transacoes: Trans[] }>(GET_TRANSACOES, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
  });

  const [confirmar] = useMutation(CONFIRMAR_TRANSACAO);
  const [estornar] = useMutation(ESTORNAR_TRANSACAO);
  const [cancelar] = useMutation(CANCELAR_TRANSACAO_PENDENTE);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [estornoTarget, setEstornoTarget] = useState<Trans | null>(null);
  const [estornoMotivo, setEstornoMotivo] = useState('');
  const [estornoBusy, setEstornoBusy] = useState(false);

  const items = data?.transacoes ?? [];
  const totals = items.reduce(
    (acc, t) => {
      const v = Number(t.valor);
      if (t.tipo === 'RECEITA' && t.status === 'CONFIRMADO') acc.receitasConf += v;
      if (t.tipo === 'DESPESA' && t.status === 'CONFIRMADO') acc.despesasConf += v;
      if (t.status === 'PENDENTE') acc.pendentes += v;
      return acc;
    },
    { receitasConf: 0, despesasConf: 0, pendentes: 0 },
  );

  function setObra(v: string) {
    setObraId(v);
    if (v) params.set('obraId', v);
    else params.delete('obraId');
    setParams(params, { replace: true });
  }

  async function handleConfirmar(t: Trans) {
    const dataReal = prompt('Data real do pagamento (AAAA-MM-DD):', new Date().toISOString().slice(0, 10));
    if (!dataReal) return;
    setConfirmingId(t.id);
    try {
      await confirmar({ variables: { input: { id: t.id, dataReal: new Date(dataReal).toISOString() } } });
      toast.success('Transação confirmada.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao confirmar.');
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleEstornar() {
    if (!estornoTarget || !estornoMotivo.trim()) return;
    setEstornoBusy(true);
    try {
      await estornar({ variables: { input: { id: estornoTarget.id, motivo: estornoMotivo.trim() } } });
      toast.success('Transação estornada.');
      setEstornoTarget(null);
      setEstornoMotivo('');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao estornar.');
    } finally {
      setEstornoBusy(false);
    }
  }

  async function handleCancelar(t: Trans) {
    const motivo = prompt('Motivo do cancelamento:');
    if (!motivo) return;
    try {
      await cancelar({ variables: { id: t.id, motivo } });
      toast.success('Transação pendente cancelada.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao cancelar.');
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
              Transações de obra
            </h1>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Realizado e pendente. Confirmadas são imutáveis — para corrigir, estornar.
          </p>
        </div>
        <button
          onClick={() => navigate('/obras/transacoes/cadastrar' + (obraId ? `?obraId=${obraId}` : ''))}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova transação
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPI label="Receitas confirmadas" value={formatBRL(totals.receitasConf)} tone="emerald" />
        <KPI label="Despesas confirmadas" value={formatBRL(totals.despesasConf)} tone="rose" />
        <KPI label="Pendentes (a pagar/receber)" value={formatBRL(totals.pendentes)} tone="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3">
        <select value={obraId} onChange={(e) => setObra(e.target.value)} className={selCls}>
          <option value="">Todas as obras</option>
          {obrasData?.obras.map((o) => (
            <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo((e.target.value as TipoTransacao) || '')} className={selCls}>
          <option value="">Todos os tipos</option>
          <option value="RECEITA">Receita</option>
          <option value="DESPESA">Despesa</option>
        </select>
        <select value={status} onChange={(e) => setStatus((e.target.value as StatusTransacao) || '')} className={selCls}>
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="ESTORNADO">Estornado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select value={tipoData} onChange={(e) => setTipoData(e.target.value as TipoData)} className={selCls}>
          <option value="COMPETENCIA">Por competência</option>
          <option value="REAL">Por data real</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Competência</th>
                <th className="px-4 py-3">Data real</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Carregando…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <Wallet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  Sem transações.
                </td></tr>
              )}
              {items.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${TIPO_TRANS_TONE[t.tipo]}`}>
                      {t.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200 truncate max-w-[280px]">{t.descricao}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{t.documento ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${TRANS_STATUS_TONE[t.status]}`}>
                      {TRANS_STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(t.dataCompetencia)}</td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(t.dataReal)}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${t.tipo === 'RECEITA' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {t.tipo === 'RECEITA' ? '+' : '−'} {formatBRL(Number(t.valor))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {t.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => handleConfirmar(t)}
                            disabled={confirmingId === t.id}
                            title="Confirmar pagamento"
                            className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11.5px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {confirmingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleCancelar(t)}
                            title="Cancelar pendente"
                            className="w-7 h-7 grid place-items-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {t.status === 'CONFIRMADO' && (
                        <button
                          onClick={() => setEstornoTarget(t)}
                          title="Estornar"
                          className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11.5px] font-semibold bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-800 dark:text-purple-300"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Estornar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {estornoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-md shadow-xl border border-slate-200 dark:border-white/10">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                Estornar transação
              </h3>
            </div>
            <div className="px-5 py-4 text-[13px] text-slate-700 dark:text-slate-300 space-y-3">
              <p>
                <span className="text-slate-500">Descrição:</span>{' '}
                <span className="font-semibold">{estornoTarget.descricao}</span>
              </p>
              <p>
                <span className="text-slate-500">Valor:</span>{' '}
                <span className="font-semibold tabular-nums">{formatBRL(Number(estornoTarget.valor))}</span>
              </p>
              <div>
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Motivo *</label>
                <textarea
                  value={estornoMotivo}
                  onChange={(e) => setEstornoMotivo(e.target.value)}
                  rows={3}
                  className="w-full p-2 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px]"
                  placeholder="NF cancelada, valor incorreto, etc."
                />
              </div>
              <div className="p-2.5 rounded bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-[12px] text-purple-800 dark:text-purple-300">
                Será criada uma transação reversa CONFIRMADA com tipo invertido. A original ficará marcada como ESTORNADA.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-lg">
              <button
                onClick={() => { setEstornoTarget(null); setEstornoMotivo(''); }}
                disabled={estornoBusy}
                className="h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-md disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEstornar}
                disabled={estornoBusy || !estornoMotivo.trim()}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50"
              >
                {estornoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Estornar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'rose' | 'amber' }) {
  const map: Record<string, string> = {
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300',
    amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${map[tone]} p-3.5`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <p className="mt-1.5 text-[20px] font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

const selCls =
  'h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] text-slate-700 dark:text-slate-200';
