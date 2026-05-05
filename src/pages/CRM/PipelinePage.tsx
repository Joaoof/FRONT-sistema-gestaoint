import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CREATE_OPPORTUNITY,
  GET_PIPELINE,
  MOVE_OPPORTUNITY_STAGE,
} from '../../graphql/queries/opportunities';

type Stage =
  | 'NEW'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

interface Opportunity {
  id: string;
  companyId: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  title: string;
  source: string | null;
  stage: Stage;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  closedAt: string | null;
  ownerUserId: string | null;
  notes: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PipelineStage {
  stage: Stage;
  count: number;
  totalValue: number;
  items: Opportunity[];
}

const STAGES: Stage[] = [
  'NEW',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
];

const STAGE_LABEL: Record<Stage, string> = {
  NEW: 'Novos',
  QUALIFIED: 'Qualificados',
  PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação',
  WON: 'Ganhas',
  LOST: 'Perdidas',
};

const STAGE_COLOR: Record<Stage, string> = {
  NEW: 'bg-slate-100 text-slate-700 border-slate-300',
  QUALIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
  PROPOSAL: 'bg-amber-50 text-amber-700 border-amber-200',
  NEGOTIATION: 'bg-violet-50 text-violet-700 border-violet-200',
  WON: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOST: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STAGE_HEADER: Record<Stage, string> = {
  NEW: 'border-t-slate-400',
  QUALIFIED: 'border-t-blue-500',
  PROPOSAL: 'border-t-amber-500',
  NEGOTIATION: 'border-t-violet-500',
  WON: 'border-t-emerald-500',
  LOST: 'border-t-rose-500',
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

interface CreateModalProps {
  defaultStage: Stage;
  onClose: () => void;
  onCreated: () => void;
}

function CreateModal({ defaultStage, onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    source: '',
    stage: defaultStage,
    value: '0',
    probability: '50',
    expectedCloseDate: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [createOpp, { loading }] = useMutation(CREATE_OPPORTUNITY);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createOpp({
        variables: {
          input: {
            title: form.title.trim(),
            customerName: form.customerName.trim() || undefined,
            customerPhone: form.customerPhone.trim() || undefined,
            customerEmail: form.customerEmail.trim() || undefined,
            source: form.source.trim() || undefined,
            stage: form.stage,
            value: Number(form.value) || 0,
            probability: Number(form.probability) || 0,
            expectedCloseDate: form.expectedCloseDate
              ? new Date(form.expectedCloseDate).toISOString()
              : undefined,
            notes: form.notes.trim() || undefined,
          },
        },
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Nova oportunidade</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Título *</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ex.: Concreto bombeado para obra X"
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Cliente (nome)</span>
            <input
              value={form.customerName}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerName: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Telefone</span>
            <input
              value={form.customerPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerPhone: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">E-mail</span>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerEmail: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Origem</span>
            <input
              value={form.source}
              onChange={(e) =>
                setForm((p) => ({ ...p, source: e.target.value }))
              }
              placeholder="Ex.: Indicação, site, WhatsApp"
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Estágio</span>
            <select
              value={form.stage}
              onChange={(e) =>
                setForm((p) => ({ ...p, stage: e.target.value as Stage }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Valor (R$)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">
              Probabilidade (%)
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.probability}
              onChange={(e) =>
                setForm((p) => ({ ...p, probability: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">
              Data prevista de fechamento
            </span>
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, expectedCloseDate: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Observações</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
        </div>
        {error && (
          <div className="mx-6 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-sm hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.title}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar
          </button>
        </div>
      </form>
    </div>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<Stage | null>(null);

  const variables = useMemo(
    () => ({ filter: search ? { search } : {} }),
    [search],
  );

  const { data, loading, error, refetch } = useQuery<{
    pipeline: PipelineStage[];
  }>(GET_PIPELINE, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const [moveStage] = useMutation(MOVE_OPPORTUNITY_STAGE);

  const stages = data?.pipeline ?? [];
  const totalCount = stages.reduce((s, st) => s + st.count, 0);
  const totalValue = stages.reduce((s, st) => s + st.totalValue, 0);
  const wonValue =
    stages.find((s) => s.stage === 'WON')?.totalValue ?? 0;
  const winRate =
    totalCount > 0
      ? Math.round(
          ((stages.find((s) => s.stage === 'WON')?.count ?? 0) / totalCount) *
            100,
        )
      : 0;

  const handleMove = async (id: string, stage: Stage) => {
    await moveStage({ variables: { id, stage } });
    refetch();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold">CRM · Pipeline</h1>
            <p className="text-xs text-slate-500">
              Funil de vendas — arraste valores entre estágios.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating('NEW')}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nova oportunidade
        </button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-slate-500">Oportunidades</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-slate-500">Valor total no funil</div>
          <div className="text-2xl font-bold">{fmtBRL(totalValue)}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-slate-500">Ganhas (R$)</div>
          <div className="text-2xl font-bold text-emerald-600">
            {fmtBRL(wonValue)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-slate-500">Taxa de conversão</div>
          <div className="text-2xl font-bold flex items-center gap-1">
            {winRate}%
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, cliente ou origem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded pl-9 pr-3 py-2 text-sm"
          />
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar pipeline: {error.message}
        </div>
      )}

      {loading && stages.length === 0 ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((col) => (
            <div
              key={col.stage}
              className={`bg-slate-50 border-t-4 ${STAGE_HEADER[col.stage]} rounded-lg flex flex-col min-h-[300px]`}
            >
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {STAGE_LABEL[col.stage]}
                  </h3>
                  <span className="text-xs text-slate-500">{col.count}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {fmtBRL(col.totalValue)}
                </div>
                <button
                  onClick={() => setCreating(col.stage)}
                  className="mt-2 w-full text-xs text-blue-600 hover:bg-blue-50 rounded py-1 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </button>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
                {col.items.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">
                    Sem oportunidades
                  </div>
                ) : (
                  col.items.map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => navigate(`/crm/oportunidades/${opp.id}`)}
                      className="bg-white border rounded p-2 cursor-pointer hover:shadow-sm hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-sm line-clamp-2">
                          {opp.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      </div>
                      {opp.customerName && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {opp.customerName}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs font-semibold ${col.stage === 'WON' ? 'text-emerald-600' : col.stage === 'LOST' ? 'text-rose-600' : 'text-slate-700'}`}
                        >
                          {fmtBRL(opp.value)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {opp.probability}%
                        </span>
                      </div>
                      {opp.expectedCloseDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(opp.expectedCloseDate)}
                        </div>
                      )}
                      <select
                        value={opp.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleMove(opp.id, e.target.value as Stage)}
                        className={`mt-2 w-full text-xs border rounded px-1.5 py-0.5 ${STAGE_COLOR[opp.stage]}`}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateModal
          defaultStage={creating}
          onClose={() => setCreating(null)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
