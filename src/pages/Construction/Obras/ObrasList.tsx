import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Eye,
  HardHat,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { DELETE_OBRA, GET_OBRAS } from '../../../graphql/queries/construction-obras';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import {
  formatBRL,
  formatDate,
  OBRA_STATUS_LABEL,
  OBRA_STATUS_TONE,
  type ObraStatus,
} from '../components/shared';

interface ObraRow {
  id: string;
  codigo: string;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  status: ObraStatus;
  dataInicio?: string | null;
  dataFimPrev?: string | null;
  valorContrato?: number | null;
  createdAt: string;
}

export function ObrasList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ObraStatus | 'ALL'>('ALL');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{ obras: ObraRow[] }>(GET_OBRAS, {
    fetchPolicy: 'cache-and-network',
    variables: { status: statusFilter === 'ALL' ? null : statusFilter, search: search || null },
  });

  const [deleteObra] = useMutation(DELETE_OBRA);

  const obras = data?.obras ?? [];
  const confirm = obras.find((o) => o.id === confirmId);

  const stats = useMemo(() => {
    let emExec = 0;
    let plan = 0;
    let valorTotal = 0;
    for (const o of obras) {
      if (o.status === 'EM_EXECUCAO') emExec++;
      if (o.status === 'PLANEJAMENTO') plan++;
      valorTotal += Number(o.valorContrato ?? 0);
    }
    return { emExec, plan, valorTotal, total: obras.length };
  }, [obras]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return obras.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (q) {
        return (
          o.codigo.toLowerCase().includes(q) ||
          o.nome.toLowerCase().includes(q) ||
          (o.cidade ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [obras, search, statusFilter]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteObra({ variables: { id } });
      toast.success('Obra excluída.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao excluir obra.');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
              <HardHat className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
              Obras
            </h1>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Cadastro e gestão de obras — orçamento previsto vs realizado
          </p>
        </div>
        <button
          onClick={() => navigate('/obras/cadastrar')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova obra
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Em execução" value={String(stats.emExec)} sub="obras ativas" tone="sky" />
        <StatCard label="Planejamento" value={String(stats.plan)} sub="aguardando início" tone="amber" />
        <StatCard label="Total" value={String(stats.total)} sub="todas as obras" tone="slate" />
        <StatCard label="Valor contratual" value={formatBRL(stats.valorTotal)} sub="soma dos contratos" tone="indigo" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3 sm:items-center"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, nome ou cidade…"
            className="w-full h-10 pl-9 pr-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ObraStatus | 'ALL')}
          className="h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] text-slate-700 dark:text-slate-200"
        >
          <option value="ALL">Todos os status</option>
          <option value="PLANEJAMENTO">Planejamento</option>
          <option value="EM_EXECUCAO">Em execução</option>
          <option value="PAUSADA">Pausada</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </motion.div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Início</th>
                <th className="px-4 py-3">Prev. fim</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Contrato</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    Carregando obras…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    Nenhuma obra encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                    {o.codigo}
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
                    {o.nome}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {o.cidade ? `${o.cidade}${o.estado ? ' / ' + o.estado : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatDate(o.dataInicio)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatDate(o.dataFimPrev)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${OBRA_STATUS_TONE[o.status]}`}>
                      {OBRA_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                    {o.valorContrato ? formatBRL(Number(o.valorContrato)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/obras/${o.id}`)}
                        className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11.5px] font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Eye className="w-3 h-3" />
                        Abrir
                      </button>
                      <button
                        onClick={() => setConfirmId(o.id)}
                        disabled={deletingId === o.id}
                        title="Excluir obra"
                        className="w-7 h-7 grid place-items-center rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 disabled:opacity-50"
                      >
                        {deletingId === o.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/10 text-[11.5px] text-slate-500 dark:text-slate-400">
            {filtered.length} obra{filtered.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-md shadow-xl border border-slate-200 dark:border-white/10">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Excluir obra {confirm.codigo}?
              </h3>
            </div>
            <div className="px-5 py-4 text-[13px] text-slate-700 dark:text-slate-300 space-y-2">
              <p>{confirm.nome}</p>
              <div className="mt-3 p-2.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[12px] text-amber-800 dark:text-amber-300">
                Soft-delete. Obra com transações ativas (PENDENTE/CONFIRMADO) não pode ser excluída.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-lg">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deletingId === confirm.id}
                className="h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-md disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirm.id)}
                disabled={deletingId === confirm.id}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md disabled:opacity-50"
              >
                {deletingId === confirm.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'sky' | 'amber' | 'slate' | 'indigo';
}) {
  const map: Record<string, string> = {
    sky: 'from-sky-500/15 to-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300',
    amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300',
    indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    slate: 'from-slate-500/10 to-slate-500/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${map[tone]} p-3.5`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <p className="mt-1.5 text-[20px] font-bold leading-none tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-400">{sub}</p>
    </div>
  );
}
