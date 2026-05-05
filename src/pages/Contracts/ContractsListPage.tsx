import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  CREATE_CONTRACT,
  GET_CONTRACTS,
} from '../../graphql/queries/contracts';

type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'TERMINATED';

type BillingCycle =
  | 'ONCE'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'WEEKLY';

interface Contract {
  id: string;
  companyId: string;
  customerId: string;
  number: string;
  title: string;
  status: ContractStatus;
  startDate: string | null;
  endDate: string | null;
  value: number;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  sellerId: string | null;
  description: string | null;
  terms: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<ContractStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  EXPIRED: 'Expirado',
  TERMINATED: 'Encerrado',
};

const STATUS_COLOR: Record<ContractStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
  EXPIRED: 'bg-slate-200 text-slate-700 border-slate-400',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CYCLE_LABEL: Record<BillingCycle, string> = {
  ONCE: 'Único',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
};

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateContractModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState({
    number: '',
    title: '',
    customerId: '',
    value: '0',
    billingCycle: 'MONTHLY' as BillingCycle,
    startDate: '',
    endDate: '',
    autoRenew: false,
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [createContract, { loading }] = useMutation(CREATE_CONTRACT);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createContract({
        variables: {
          input: {
            number: form.number.trim(),
            title: form.title.trim(),
            customerId: form.customerId.trim(),
            value: Number(form.value) || 0,
            billingCycle: form.billingCycle,
            startDate: form.startDate
              ? new Date(form.startDate).toISOString()
              : null,
            endDate: form.endDate
              ? new Date(form.endDate).toISOString()
              : null,
            autoRenew: form.autoRenew,
            description: form.description.trim() || null,
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
          <h2 className="text-lg font-semibold">Novo contrato</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Número *</span>
            <input
              required
              value={form.number}
              onChange={(e) =>
                setForm((p) => ({ ...p, number: e.target.value }))
              }
              placeholder="Ex.: CT-2026-0001"
              className="w-full border rounded px-3 py-2 font-mono"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Título *</span>
            <input
              required
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Cliente (ID) *</span>
            <input
              required
              value={form.customerId}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerId: e.target.value }))
              }
              placeholder="ID do cliente"
              className="w-full border rounded px-3 py-2 font-mono"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Valor (R$)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.value}
              onChange={(e) =>
                setForm((p) => ({ ...p, value: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Ciclo de cobrança</span>
            <select
              value={form.billingCycle}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  billingCycle: e.target.value as BillingCycle,
                }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {(Object.keys(CYCLE_LABEL) as BillingCycle[]).map((c) => (
                <option key={c} value={c}>
                  {CYCLE_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Início</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Fim</span>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.autoRenew}
              onChange={(e) =>
                setForm((p) => ({ ...p, autoRenew: e.target.checked }))
              }
              className="rounded"
            />
            <span>Renovação automática</span>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Descrição</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
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
            disabled={loading || !form.number || !form.title || !form.customerId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar contrato
          </button>
        </div>
      </form>
    </div>
  );
}

export function ContractsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ContractStatus>('');
  const [customerIdFilter, setCustomerIdFilter] = useState('');
  const [creating, setCreating] = useState(false);

  const variables = useMemo(() => {
    const filter: Record<string, unknown> = {};
    if (search) filter.search = search;
    if (statusFilter) filter.status = statusFilter;
    if (customerIdFilter) filter.customerId = customerIdFilter;
    return { filter };
  }, [search, statusFilter, customerIdFilter]);

  const { data, loading, error, refetch } = useQuery<{
    contracts: Contract[];
  }>(GET_CONTRACTS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const contracts = data?.contracts ?? [];

  const totals = useMemo(() => {
    const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
    const totalActive = activeContracts.length;
    const monthlyRecurring = activeContracts
      .filter((c) => c.billingCycle === 'MONTHLY')
      .reduce((sum, c) => sum + (c.value || 0), 0);
    const now = Date.now();
    const in30 = now + 30 * 24 * 60 * 60 * 1000;
    const expiringSoon = contracts.filter((c) => {
      if (!c.endDate) return false;
      const t = new Date(c.endDate).getTime();
      return t >= now && t <= in30;
    }).length;
    return { totalActive, monthlyRecurring, expiringSoon };
  }, [contracts]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold">Contratos</h1>
            <p className="text-xs text-slate-500">
              Gerencie contratos, vigência, ciclo de cobrança e SLAs.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Novo contrato
        </button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-4 h-4" />
            Contratos ativos
          </div>
          <div className="text-2xl font-bold mt-1">{totals.totalActive}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DollarSign className="w-4 h-4" />
            Receita mensal recorrente
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {fmtBRL(totals.monthlyRecurring)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarClock className="w-4 h-4" />
            Expirando em &lt;30d
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {totals.expiringSoon}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="w-4 h-4" />
            Breaches do mês
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-400">—</div>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs md:col-span-1">
            <span className="block mb-1 text-slate-600">Busca</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por número, título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
              />
            </div>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Status</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as '' | ContractStatus)
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {(Object.keys(STATUS_LABEL) as ContractStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Cliente (ID)</span>
            <input
              type="text"
              value={customerIdFilter}
              onChange={(e) => setCustomerIdFilter(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm font-mono"
            />
          </label>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar contratos: {error.message}
        </div>
      )}

      <section className="bg-white border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b text-sm">
          <span className="text-slate-600">
            {loading
              ? 'Carregando...'
              : `${contracts.length.toLocaleString('pt-BR')} contrato(s)`}
          </span>
        </div>

        {loading && contracts.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum contrato encontrado
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Número</th>
                <th className="px-3 py-2 font-medium">Título</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Valor</th>
                <th className="px-3 py-2 font-medium">Ciclo</th>
                <th className="px-3 py-2 font-medium">Início</th>
                <th className="px-3 py-2 font-medium">Fim</th>
                <th className="px-3 py-2 font-medium text-center">Auto</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/contratos/${c.id}`)}
                  className="border-t hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {c.number || (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{c.title}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600 max-w-[180px] truncate">
                    {c.customerId}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded border ${STATUS_COLOR[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {fmtBRL(c.value)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {CYCLE_LABEL[c.billingCycle]}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(c.startDate)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(c.endDate)}</td>
                  <td className="px-3 py-2 text-center text-xs">
                    {c.autoRenew ? (
                      <span className="text-emerald-600">Sim</span>
                    ) : (
                      <span className="text-slate-400">Não</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {creating && (
        <CreateContractModal
          onClose={() => setCreating(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
