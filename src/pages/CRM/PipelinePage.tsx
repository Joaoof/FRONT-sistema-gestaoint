import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileSignature,
  Filter,
  GripVertical,
  Layout,
  List,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
  Trophy,
  X,
  XCircle,
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

const STAGE_GRADIENT: Record<Stage, string> = {
  NEW: 'from-slate-100 to-slate-50',
  QUALIFIED: 'from-blue-100 to-blue-50',
  PROPOSAL: 'from-amber-100 to-amber-50',
  NEGOTIATION: 'from-violet-100 to-violet-50',
  WON: 'from-emerald-100 to-emerald-50',
  LOST: 'from-rose-100 to-rose-50',
};

const STAGE_BORDER: Record<Stage, string> = {
  NEW: 'border-l-slate-400',
  QUALIFIED: 'border-l-blue-500',
  PROPOSAL: 'border-l-amber-500',
  NEGOTIATION: 'border-l-violet-500',
  WON: 'border-l-emerald-500',
  LOST: 'border-l-rose-500',
};

const STAGE_TEXT: Record<Stage, string> = {
  NEW: 'text-slate-700',
  QUALIFIED: 'text-blue-700',
  PROPOSAL: 'text-amber-700',
  NEGOTIATION: 'text-violet-700',
  WON: 'text-emerald-700',
  LOST: 'text-rose-700',
};

const STAGE_ICON: Record<Stage, React.ComponentType<{ className?: string }>> = {
  NEW: Sparkles,
  QUALIFIED: CheckCheck,
  PROPOSAL: FileSignature,
  NEGOTIATION: MessagesSquare,
  WON: Trophy,
  LOST: XCircle,
};

const STAGE_COLUMN_BG: Record<Stage, string> = {
  NEW: 'bg-white',
  QUALIFIED: 'bg-white',
  PROPOSAL: 'bg-white',
  NEGOTIATION: 'bg-white',
  WON: 'bg-emerald-50/40',
  LOST: 'bg-rose-50/40',
};

const SOURCE_SUGGESTIONS = ['Indicação', 'Site', 'WhatsApp', 'Telefone', 'Visita'];

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function fmtBRL(v: number): string {
  return brl.format(v || 0);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function getInitials(name: string | null | undefined, fallback: string): string {
  const source = (name && name.trim()) || fallback;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function probabilityBadge(p: number): string {
  if (p <= 30) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (p <= 70) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

function isOverdue(opp: Opportunity): boolean {
  if (!opp.expectedCloseDate) return false;
  if (opp.stage === 'WON' || opp.stage === 'LOST') return false;
  const date = new Date(opp.expectedCloseDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function buildWhatsAppUrl(opp: Opportunity): string | null {
  if (!opp.customerPhone) return null;
  const digits = opp.customerPhone.replace(/\D+/g, '');
  if (!digits) return null;
  const greeting = `Olá ${opp.customerName ?? ''}, sobre ${opp.title}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`;
}

interface FilterState {
  search: string;
  stages: Stage[];
  minValue: string;
  maxValue: string;
  closeFrom: string;
  closeTo: string;
  source: string;
  onlyOverdue: boolean;
}

const emptyFilters: FilterState = {
  search: '',
  stages: [],
  minValue: '',
  maxValue: '',
  closeFrom: '',
  closeTo: '',
  source: '',
  onlyOverdue: false,
};

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nova oportunidade</h2>
              <p className="text-xs text-white/80">
                Cadastre um novo prospect no funil
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-700 font-medium">
              Título <span className="text-rose-500">*</span>
            </span>
            <input
              required
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Ex.: Concreto bombeado para obra X"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-700 font-medium">
              Cliente (nome)
            </span>
            <input
              value={form.customerName}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerName: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-700 font-medium">
              Telefone
            </span>
            <input
              value={form.customerPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerPhone: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-700 font-medium">
              E-mail
            </span>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerEmail: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-700 font-medium">
              Estágio
            </span>
            <select
              value={form.stage}
              onChange={(e) =>
                setForm((p) => ({ ...p, stage: e.target.value as Stage }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-700 font-medium">
              Origem
            </span>
            <input
              value={form.source}
              onChange={(e) =>
                setForm((p) => ({ ...p, source: e.target.value }))
              }
              placeholder="Ex.: Indicação, site, WhatsApp"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SOURCE_SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setForm((p) => ({ ...p, source: s }))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    form.source === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm">
            <span className="block mb-1 text-slate-700 font-medium">
              Valor (R$)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.value}
              onChange={(e) =>
                setForm((p) => ({ ...p, value: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-700 font-medium">
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
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-700 font-medium">
              Data prevista de fechamento
            </span>
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, expectedCloseDate: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-700 font-medium">
              Observações
            </span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </label>
        </div>
        {error && (
          <div className="mx-6 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !form.title}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 shadow-md shadow-blue-500/25"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar oportunidade
          </button>
        </div>
      </motion.form>
    </div>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState<Stage | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>(() => {
    if (typeof window === 'undefined') return 'kanban';
    const saved = localStorage.getItem('crm:viewMode');
    return saved === 'list' || saved === 'table' ? saved : 'kanban';
  });
  useEffect(() => {
    localStorage.setItem('crm:viewMode', viewMode);
  }, [viewMode]);

  const variables = useMemo(
    () => ({ filter: filters.search ? { search: filters.search } : {} }),
    [filters.search],
  );

  const { data, loading, error, refetch } = useQuery<{
    pipeline: PipelineStage[];
  }>(GET_PIPELINE, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const [moveStage] = useMutation(MOVE_OPPORTUNITY_STAGE);

  const rawStages = data?.pipeline ?? [];

  // Apply client-side filters on top of pipeline result
  const stages: PipelineStage[] = useMemo(() => {
    return rawStages.map((col) => {
      const filtered = col.items.filter((opp) => {
        if (filters.stages.length > 0 && !filters.stages.includes(opp.stage)) {
          return false;
        }
        const min = parseFloat(filters.minValue);
        if (!Number.isNaN(min) && opp.value < min) return false;
        const max = parseFloat(filters.maxValue);
        if (!Number.isNaN(max) && opp.value > max) return false;
        if (filters.closeFrom) {
          if (
            !opp.expectedCloseDate ||
            new Date(opp.expectedCloseDate) < new Date(filters.closeFrom)
          ) {
            return false;
          }
        }
        if (filters.closeTo) {
          if (
            !opp.expectedCloseDate ||
            new Date(opp.expectedCloseDate) > new Date(filters.closeTo)
          ) {
            return false;
          }
        }
        if (filters.source.trim()) {
          const term = filters.source.trim().toLowerCase();
          if (!(opp.source ?? '').toLowerCase().includes(term)) return false;
        }
        if (filters.onlyOverdue && !isOverdue(opp)) return false;
        return true;
      });
      return {
        ...col,
        items: filtered,
        count: filtered.length,
        totalValue: filtered.reduce((sum, o) => sum + (o.value || 0), 0),
      };
    });
  }, [rawStages, filters]);

  const totalCount = stages.reduce((s, st) => s + st.count, 0);
  const totalValue = stages.reduce((s, st) => s + st.totalValue, 0);
  const wonValue = stages.find((s) => s.stage === 'WON')?.totalValue ?? 0;
  const wonCount = stages.find((s) => s.stage === 'WON')?.count ?? 0;
  const lostCount = stages.find((s) => s.stage === 'LOST')?.count ?? 0;
  const finishedCount = wonCount + lostCount;
  const winRate =
    finishedCount > 0 ? Math.round((wonCount / finishedCount) * 100) : 0;

  const openItemsCount = totalCount - finishedCount;
  const openValue = stages
    .filter((s) => s.stage !== 'WON' && s.stage !== 'LOST')
    .reduce((sum, st) => sum + st.totalValue, 0);
  const avgTicket = openItemsCount > 0 ? openValue / openItemsCount : 0;

  const allItems = useMemo(() => stages.flatMap((s) => s.items), [stages]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.stages.length > 0) count += 1;
    if (filters.minValue) count += 1;
    if (filters.maxValue) count += 1;
    if (filters.closeFrom) count += 1;
    if (filters.closeTo) count += 1;
    if (filters.source) count += 1;
    if (filters.onlyOverdue) count += 1;
    return count;
  }, [filters]);

  const handleDrop = async (stage: Stage) => {
    setDragOverStage(null);
    if (!draggingId) return;
    const opp = allItems.find((o) => o.id === draggingId);
    setDraggingId(null);
    if (!opp || opp.stage === stage) return;
    try {
      await moveStage({ variables: { id: opp.id, stage } });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const resetFilters = () => setFilters(emptyFilters);

  const toggleStageFilter = (s: Stage) => {
    setFilters((p) => ({
      ...p,
      stages: p.stages.includes(s)
        ? p.stages.filter((x) => x !== s)
        : [...p.stages, s],
    }));
  };

  const metrics = [
    {
      label: 'Total no funil',
      value: fmtBRL(totalValue),
      sub: `${totalCount} oportunidades`,
      icon: Target,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Ganhas no mês',
      value: fmtBRL(wonValue),
      sub: `${wonCount} negócios fechados`,
      icon: Trophy,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Taxa de conversão',
      value: `${winRate}%`,
      sub:
        finishedCount > 0
          ? `${wonCount} ganhas de ${finishedCount} fechadas`
          : 'sem fechamentos ainda',
      icon: TrendingUp,
      gradient: 'from-violet-500 to-fuchsia-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Ticket médio',
      value: fmtBRL(avgTicket),
      sub: `${openItemsCount} em aberto`,
      icon: Briefcase,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-2.5 rounded-xl shadow-md shadow-blue-500/30">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-['Rajdhani'] font-bold text-slate-900">
              CRM · Pipeline
            </h1>
            <p className="text-sm text-slate-500">
              Funil de vendas — arraste cards entre estágios
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-white border rounded-lg p-1 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                viewMode === 'kanban'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition ${
                viewMode === 'table'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Tabela
            </button>
          </div>
          <button
            onClick={() => setCreating('NEW')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 shadow-md shadow-blue-500/25 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova oportunidade
          </button>
        </div>
      </header>

      {/* Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative overflow-hidden bg-gradient-to-br ${m.gradient} text-white rounded-xl p-4 shadow-lg shadow-slate-900/10`}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide font-medium text-white/80">
                    {m.label}
                  </div>
                  <div className="text-2xl font-bold mt-1">{m.value}</div>
                  <div className="text-xs text-white/80 mt-1">{m.sub}</div>
                </div>
                <div className={`${m.iconBg} backdrop-blur p-2 rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Search + Filters bar */}
      <section className="bg-white border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, cliente ou origem..."
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((p) => !p)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition ${
              filtersOpen
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                filtersOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-slate-500 hover:text-rose-600"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-3 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="block text-xs font-medium text-slate-700 mb-2">
                    Estágios
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((s) => {
                      const Icon = STAGE_ICON[s];
                      const active = filters.stages.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleStageFilter(s)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                            active
                              ? `${STAGE_COLOR[s]} border-current`
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {STAGE_LABEL[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="text-xs">
                  <span className="block mb-1 font-medium text-slate-700">
                    Valor mínimo (R$)
                  </span>
                  <input
                    type="number"
                    value={filters.minValue}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, minValue: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="text-xs">
                  <span className="block mb-1 font-medium text-slate-700">
                    Valor máximo (R$)
                  </span>
                  <input
                    type="number"
                    value={filters.maxValue}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, maxValue: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="text-xs">
                  <span className="block mb-1 font-medium text-slate-700">
                    Origem
                  </span>
                  <input
                    type="text"
                    value={filters.source}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, source: e.target.value }))
                    }
                    placeholder="Ex.: Indicação"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="text-xs">
                  <span className="block mb-1 font-medium text-slate-700">
                    Fechamento de
                  </span>
                  <input
                    type="date"
                    value={filters.closeFrom}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, closeFrom: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="text-xs">
                  <span className="block mb-1 font-medium text-slate-700">
                    Fechamento até
                  </span>
                  <input
                    type="date"
                    value={filters.closeTo}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, closeTo: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm pt-5 select-none">
                  <input
                    type="checkbox"
                    checked={filters.onlyOverdue}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        onlyOverdue: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-300"
                  />
                  <span className="text-slate-700">Apenas atrasadas</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-lg">
          Erro ao carregar pipeline: {error.message}
        </div>
      )}

      {/* Content */}
      {loading && stages.length === 0 ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AnimatePresence>
            {stages.map((col, idx) => {
              const Icon = STAGE_ICON[col.stage];
              const isDropTarget = dragOverStage === col.stage;
              return (
                <motion.div
                  key={col.stage}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDragEnter={() => setDragOverStage(col.stage)}
                  onDragLeave={(e) => {
                    if (
                      e.currentTarget.contains(
                        e.relatedTarget as Node | null,
                      )
                    ) {
                      return;
                    }
                    setDragOverStage((p) =>
                      p === col.stage ? null : p,
                    );
                  }}
                  onDrop={() => handleDrop(col.stage)}
                  className={`${STAGE_COLUMN_BG[col.stage]} border rounded-xl flex flex-col min-h-[400px] transition-all ${
                    isDropTarget
                      ? 'ring-2 ring-blue-400 bg-blue-50/50 border-blue-300 shadow-lg'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Column header */}
                  <div
                    className={`bg-gradient-to-br ${STAGE_GRADIENT[col.stage]} rounded-t-xl p-3 border-b border-slate-200`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 bg-white/70 rounded-lg ${STAGE_TEXT[col.stage]}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3
                          className={`font-semibold text-sm ${STAGE_TEXT[col.stage]}`}
                        >
                          {STAGE_LABEL[col.stage]}
                        </h3>
                      </div>
                      <span
                        className={`bg-white/70 text-xs font-bold px-2 py-0.5 rounded-full ${STAGE_TEXT[col.stage]}`}
                      >
                        {col.count}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold mt-1 ${STAGE_TEXT[col.stage]}`}
                    >
                      {fmtBRL(col.totalValue)}
                    </div>
                    <button
                      onClick={() => setCreating(col.stage)}
                      className={`mt-2 w-full text-xs ${STAGE_TEXT[col.stage]} hover:bg-white/60 rounded-md py-1 flex items-center justify-center gap-1 transition`}
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
                    {col.items.length === 0 ? (
                      <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 rounded-lg">
                        <Icon className="w-8 h-8 text-slate-300 mb-2" />
                        <div className="text-xs text-slate-400 font-medium">
                          Sem oportunidades
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Arraste cards aqui
                        </div>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {col.items.map((opp) => {
                          const overdue = isOverdue(opp);
                          const wa = buildWhatsAppUrl(opp);
                          return (
                            <motion.div
                              key={opp.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              draggable
                              onDragStart={() => setDraggingId(opp.id)}
                              onDragEnd={() => {
                                setDraggingId(null);
                                setDragOverStage(null);
                              }}
                              onClick={() =>
                                navigate(`/crm/oportunidades/${opp.id}`)
                              }
                              className={`group relative bg-white border rounded-lg cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all border-l-4 ${STAGE_BORDER[opp.stage]} ${
                                draggingId === opp.id
                                  ? 'opacity-40'
                                  : ''
                              } ${
                                overdue
                                  ? 'border-t-2 border-t-rose-500'
                                  : ''
                              }`}
                            >
                              {overdue && (
                                <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-400 rounded-t" />
                              )}
                              <div className="p-2.5">
                                {/* Header: avatar + title */}
                                <div className="flex items-start gap-2">
                                  <div
                                    className="bg-gradient-to-br from-blue-400 to-violet-500 text-white text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                                    aria-hidden
                                  >
                                    {getInitials(
                                      opp.customerName,
                                      opp.title,
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm leading-snug line-clamp-2 text-slate-900">
                                      {opp.title}
                                    </div>
                                    {opp.customerName && (
                                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {opp.customerName}
                                      </div>
                                    )}
                                  </div>
                                  <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                                </div>

                                {/* Contact */}
                                {(opp.customerPhone ||
                                  opp.customerEmail) && (
                                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                                    {opp.customerPhone && (
                                      <span className="flex items-center gap-1 min-w-0">
                                        <Phone className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {opp.customerPhone}
                                        </span>
                                      </span>
                                    )}
                                    {opp.customerEmail && (
                                      <span className="flex items-center gap-1 min-w-0">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {opp.customerEmail}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Value + probability */}
                                <div className="flex items-center justify-between mt-2 gap-2">
                                  <span className="text-base font-semibold text-slate-900">
                                    {fmtBRL(opp.value)}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${probabilityBadge(opp.probability)}`}
                                  >
                                    {opp.probability}%
                                  </span>
                                </div>

                                {/* Date */}
                                {opp.expectedCloseDate && (
                                  <div
                                    className={`flex items-center gap-1 text-[11px] mt-1.5 ${
                                      overdue
                                        ? 'text-rose-600 font-medium'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {overdue ? (
                                      <AlertTriangle className="w-3 h-3" />
                                    ) : (
                                      <Calendar className="w-3 h-3" />
                                    )}
                                    {fmtDate(opp.expectedCloseDate)}
                                    {overdue && (
                                      <span className="ml-0.5">· atrasada</span>
                                    )}
                                  </div>
                                )}

                                {/* Footer hover actions */}
                                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                                  {wa && (
                                    <a
                                      href={wa}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100 transition"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      WhatsApp
                                    </a>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/crm/oportunidades/${opp.id}`,
                                      );
                                    }}
                                    className="flex items-center gap-1 text-[10px] px-2 py-1 bg-slate-50 text-slate-700 rounded border border-slate-200 hover:bg-slate-100 transition"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Editar
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : viewMode === 'list' ? (
        <ListView
          opps={allItems}
          onOpen={(id) => navigate(`/crm/oportunidades/${id}`)}
        />
      ) : (
        <TableView
          opps={allItems}
          onOpen={(id) => navigate(`/crm/oportunidades/${id}`)}
        />
      )}

      <AnimatePresence>
        {creating && (
          <CreateModal
            defaultStage={creating}
            onClose={() => setCreating(null)}
            onCreated={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface SubViewProps {
  opps: Opportunity[];
  onOpen: (id: string) => void;
}

function ListView({ opps, onOpen }: SubViewProps) {
  if (opps.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center text-slate-500">
        <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <div className="text-sm">Nenhuma oportunidade encontrada</div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {opps.map((opp, i) => {
          const overdue = isOverdue(opp);
          const wa = buildWhatsAppUrl(opp);
          const Icon = STAGE_ICON[opp.stage];
          return (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all border-l-4 ${STAGE_BORDER[opp.stage]} cursor-pointer`}
              onClick={() => onOpen(opp.id)}
            >
              <div className="flex items-start gap-4 flex-wrap">
                <div className="bg-gradient-to-br from-blue-400 to-violet-500 text-white text-sm font-bold w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                  {getInitials(opp.customerName, opp.title)}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">
                      {opp.title}
                    </h3>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${STAGE_COLOR[opp.stage]}`}
                    >
                      <Icon className="w-3 h-3" />
                      {STAGE_LABEL[opp.stage]}
                    </span>
                    {overdue && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Atrasada
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {opp.customerName && <span>{opp.customerName}</span>}
                    {opp.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {opp.customerPhone}
                      </span>
                    )}
                    {opp.customerEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {opp.customerEmail}
                      </span>
                    )}
                    {opp.expectedCloseDate && (
                      <span
                        className={`flex items-center gap-1 ${overdue ? 'text-rose-600' : ''}`}
                      >
                        <Calendar className="w-3 h-3" />
                        {fmtDate(opp.expectedCloseDate)}
                      </span>
                    )}
                    {opp.source && (
                      <span className="text-slate-400">via {opp.source}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">
                    {fmtBRL(opp.value)}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${probabilityBadge(opp.probability)} mt-1`}
                  >
                    {opp.probability}% prob.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(opp.id);
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function TableView({ opps, onOpen }: SubViewProps) {
  if (opps.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center text-slate-500">
        <Table2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <div className="text-sm">Nenhuma oportunidade encontrada</div>
      </div>
    );
  }
  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="px-3 py-2.5 font-semibold">Título</th>
              <th className="px-3 py-2.5 font-semibold">Cliente</th>
              <th className="px-3 py-2.5 font-semibold">Estágio</th>
              <th className="px-3 py-2.5 font-semibold text-right">Valor</th>
              <th className="px-3 py-2.5 font-semibold text-right">Prob.</th>
              <th className="px-3 py-2.5 font-semibold">Vencimento</th>
              <th className="px-3 py-2.5 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {opps.map((opp) => {
              const overdue = isOverdue(opp);
              const wa = buildWhatsAppUrl(opp);
              const Icon = STAGE_ICON[opp.stage];
              return (
                <tr
                  key={opp.id}
                  onClick={() => onOpen(opp.id)}
                  className="border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-900">
                      {opp.title}
                    </div>
                    {opp.source && (
                      <div className="text-[11px] text-slate-400">
                        via {opp.source}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-blue-400 to-violet-500 text-white text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                        {getInitials(opp.customerName, opp.title)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm truncate">
                          {opp.customerName ?? '—'}
                        </div>
                        {opp.customerPhone && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {opp.customerPhone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${STAGE_COLOR[opp.stage]}`}
                    >
                      <Icon className="w-3 h-3" />
                      {STAGE_LABEL[opp.stage]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    {fmtBRL(opp.value)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${probabilityBadge(opp.probability)}`}
                    >
                      {opp.probability}%
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2.5 ${overdue ? 'text-rose-600 font-medium' : 'text-slate-600'}`}
                  >
                    <div className="flex items-center gap-1">
                      {overdue ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {fmtDate(opp.expectedCloseDate)}
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => onOpen(opp.id)}
                        className="p-1.5 bg-slate-50 text-slate-700 rounded border border-slate-200 hover:bg-slate-100"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
