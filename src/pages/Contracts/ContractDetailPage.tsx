import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity as ActivityIcon,
  ArrowLeft,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  StopCircle,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  ACTIVATE_CONTRACT,
  ADD_SERVICE_LEVEL,
  DELETE_CONTRACT,
  DELETE_SERVICE_LEVEL,
  GET_CONTRACT,
  GET_CONTRACT_EVENTS,
  GET_SERVICE_LEVEL_EVENTS,
  RECORD_SERVICE_LEVEL_EVENT,
  RENEW_CONTRACT,
  RESUME_CONTRACT,
  SUSPEND_CONTRACT,
  TERMINATE_CONTRACT,
  UPDATE_SERVICE_LEVEL,
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

type ServiceLevelKind =
  | 'DELIVERY_TIME_HOURS'
  | 'RESPONSE_TIME_HOURS'
  | 'UPTIME_PERCENT'
  | 'QUALITY_SCORE'
  | 'CUSTOM';

type ContractEventType =
  | 'CREATED'
  | 'ACTIVATED'
  | 'SUSPENDED'
  | 'RESUMED'
  | 'RENEWED'
  | 'TERMINATED'
  | 'EXPIRED'
  | 'AMENDED'
  | 'BREACH_REGISTERED'
  | 'NOTE';

interface ServiceLevel {
  id: string;
  contractId: string;
  kind: ServiceLevelKind;
  name: string;
  description: string | null;
  targetValue: number;
  unit: string | null;
  penaltyPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceLevelEvent {
  id: string;
  serviceLevelId: string;
  occurredAt: string;
  measuredValue: number;
  met: boolean;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
}

interface ContractEvent {
  id: string;
  contractId: string;
  type: ContractEventType;
  occurredAt: string;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
}

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
  serviceLevels: ServiceLevel[];
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

const SLA_KIND_LABEL: Record<ServiceLevelKind, string> = {
  DELIVERY_TIME_HOURS: 'Tempo de entrega (h)',
  RESPONSE_TIME_HOURS: 'Tempo de resposta (h)',
  UPTIME_PERCENT: 'Disponibilidade (%)',
  QUALITY_SCORE: 'Qualidade',
  CUSTOM: 'Personalizado',
};

const SLA_KIND_COLOR: Record<ServiceLevelKind, string> = {
  DELIVERY_TIME_HOURS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESPONSE_TIME_HOURS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  UPTIME_PERCENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QUALITY_SCORE: 'bg-violet-50 text-violet-700 border-violet-200',
  CUSTOM: 'bg-slate-100 text-slate-700 border-slate-300',
};

const EVENT_TYPE_LABEL: Record<ContractEventType, string> = {
  CREATED: 'Criado',
  ACTIVATED: 'Ativado',
  SUSPENDED: 'Suspenso',
  RESUMED: 'Reativado',
  RENEWED: 'Renovado',
  TERMINATED: 'Encerrado',
  EXPIRED: 'Expirado',
  AMENDED: 'Alterado',
  BREACH_REGISTERED: 'Quebra de SLA',
  NOTE: 'Nota',
};

const EVENT_TYPE_COLOR: Record<ContractEventType, string> = {
  CREATED: 'bg-slate-100 text-slate-700 border-slate-300',
  ACTIVATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
  RESUMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RENEWED: 'bg-blue-50 text-blue-700 border-blue-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
  EXPIRED: 'bg-slate-200 text-slate-700 border-slate-400',
  AMENDED: 'bg-violet-50 text-violet-700 border-violet-200',
  BREACH_REGISTERED: 'bg-rose-50 text-rose-700 border-rose-200',
  NOTE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR');

interface AddSlaModalProps {
  contractId: string;
  onClose: () => void;
  onCreated: () => void;
}

function AddSlaModal({ contractId, onClose, onCreated }: AddSlaModalProps) {
  const [form, setForm] = useState({
    kind: 'DELIVERY_TIME_HOURS' as ServiceLevelKind,
    name: '',
    description: '',
    targetValue: '0',
    unit: '',
    penaltyPercent: '0',
    active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [addSla, { loading }] = useMutation(ADD_SERVICE_LEVEL);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addSla({
        variables: {
          contractId,
          input: {
            kind: form.kind,
            name: form.name.trim(),
            description: form.description.trim() || null,
            targetValue: Number(form.targetValue) || 0,
            unit: form.unit.trim() || null,
            penaltyPercent: Number(form.penaltyPercent) || 0,
            active: form.active,
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
        className="bg-white rounded-lg shadow-xl w-full max-w-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Novo SLA</h2>
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
            <span className="block mb-1 text-slate-600">Tipo</span>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  kind: e.target.value as ServiceLevelKind,
                }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {(Object.keys(SLA_KIND_LABEL) as ServiceLevelKind[]).map((k) => (
                <option key={k} value={k}>
                  {SLA_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Nome *</span>
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Descrição</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Valor alvo</span>
            <input
              type="number"
              step="0.01"
              value={form.targetValue}
              onChange={(e) =>
                setForm((p) => ({ ...p, targetValue: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Unidade</span>
            <input
              value={form.unit}
              onChange={(e) =>
                setForm((p) => ({ ...p, unit: e.target.value }))
              }
              placeholder="Ex.: horas, %, pontos"
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">
              Penalidade (% do contrato)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.penaltyPercent}
              onChange={(e) =>
                setForm((p) => ({ ...p, penaltyPercent: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((p) => ({ ...p, active: e.target.checked }))
              }
              className="rounded"
            />
            <span>Ativo</span>
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
            disabled={loading || !form.name}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar SLA
          </button>
        </div>
      </form>
    </div>
  );
}

interface EditSlaModalProps {
  sla: ServiceLevel;
  onClose: () => void;
  onSaved: () => void;
}

function EditSlaModal({ sla, onClose, onSaved }: EditSlaModalProps) {
  const [form, setForm] = useState({
    kind: sla.kind,
    name: sla.name,
    description: sla.description ?? '',
    targetValue: String(sla.targetValue ?? 0),
    unit: sla.unit ?? '',
    penaltyPercent: String(sla.penaltyPercent ?? 0),
    active: sla.active,
  });
  const [error, setError] = useState<string | null>(null);
  const [updateSla, { loading }] = useMutation(UPDATE_SERVICE_LEVEL);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateSla({
        variables: {
          id: sla.id,
          input: {
            kind: form.kind,
            name: form.name.trim(),
            description: form.description.trim() || null,
            targetValue: Number(form.targetValue) || 0,
            unit: form.unit.trim() || null,
            penaltyPercent: Number(form.penaltyPercent) || 0,
            active: form.active,
          },
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow-xl w-full max-w-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Editar SLA</h2>
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
            <span className="block mb-1 text-slate-600">Tipo</span>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  kind: e.target.value as ServiceLevelKind,
                }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {(Object.keys(SLA_KIND_LABEL) as ServiceLevelKind[]).map((k) => (
                <option key={k} value={k}>
                  {SLA_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Nome *</span>
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Descrição</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Valor alvo</span>
            <input
              type="number"
              step="0.01"
              value={form.targetValue}
              onChange={(e) =>
                setForm((p) => ({ ...p, targetValue: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Unidade</span>
            <input
              value={form.unit}
              onChange={(e) =>
                setForm((p) => ({ ...p, unit: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Penalidade (%)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.penaltyPercent}
              onChange={(e) =>
                setForm((p) => ({ ...p, penaltyPercent: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((p) => ({ ...p, active: e.target.checked }))
              }
              className="rounded"
            />
            <span>Ativo</span>
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
            disabled={loading || !form.name}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

interface RecordEventModalProps {
  sla: ServiceLevel;
  onClose: () => void;
  onSaved: () => void;
}

function RecordEventModal({ sla, onClose, onSaved }: RecordEventModalProps) {
  const [measuredValue, setMeasuredValue] = useState('0');
  const [met, setMet] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recordEvent, { loading }] = useMutation(RECORD_SERVICE_LEVEL_EVENT);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await recordEvent({
        variables: {
          serviceLevelId: sla.id,
          input: {
            measuredValue: Number(measuredValue) || 0,
            met,
            notes: notes.trim() || null,
          },
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Registrar evento de SLA</h2>
            <p className="text-xs text-slate-500">{sla.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <label className="text-sm block">
            <span className="block mb-1 text-slate-600">
              Valor medido {sla.unit ? `(${sla.unit})` : ''}
            </span>
            <input
              type="number"
              step="0.01"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <span className="text-xs text-slate-500 mt-1 block">
              Alvo: {sla.targetValue} {sla.unit ?? ''}
            </span>
          </label>
          <fieldset className="text-sm">
            <legend className="block mb-1 text-slate-600">Resultado</legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={met}
                  onChange={() => setMet(true)}
                />
                <span className="text-emerald-700">Cumprido</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!met}
                  onChange={() => setMet(false)}
                />
                <span className="text-rose-700">Não cumprido</span>
              </label>
            </div>
          </fieldset>
          <label className="text-sm block">
            <span className="block mb-1 text-slate-600">Observações</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
}

interface SlaHistoryModalProps {
  sla: ServiceLevel;
  onClose: () => void;
}

function SlaHistoryModal({ sla, onClose }: SlaHistoryModalProps) {
  const { data, loading } = useQuery<{
    serviceLevelEvents: ServiceLevelEvent[];
  }>(GET_SERVICE_LEVEL_EVENTS, {
    variables: { serviceLevelId: sla.id },
    fetchPolicy: 'cache-and-network',
  });

  const events = useMemo(() => {
    const list = data?.serviceLevelEvents ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Histórico de SLA</h2>
            <p className="text-xs text-slate-500">{sla.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-auto">
          {loading && events.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-6">
              Nenhum evento registrado
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Valor medido</th>
                  <th className="px-3 py-2 font-medium">Resultado</th>
                  <th className="px-3 py-2 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                      {fmtDateTime(ev.occurredAt)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {ev.measuredValue} {sla.unit ?? ''}
                    </td>
                    <td className="px-3 py-2">
                      {ev.met ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          Cumprido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 text-xs">
                          <XCircle className="w-4 h-4" />
                          Não cumprido
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {ev.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [addingSla, setAddingSla] = useState(false);
  const [editingSla, setEditingSla] = useState<ServiceLevel | null>(null);
  const [recordingSla, setRecordingSla] = useState<ServiceLevel | null>(null);
  const [historySla, setHistorySla] = useState<ServiceLevel | null>(null);

  const { data, loading, error, refetch } = useQuery<{
    contract: Contract;
  }>(GET_CONTRACT, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: eventsData,
    loading: eventsLoading,
  } = useQuery<{ contractEvents: ContractEvent[] }>(GET_CONTRACT_EVENTS, {
    variables: { contractId: id ?? '' },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const [activateContract] = useMutation(ACTIVATE_CONTRACT);
  const [suspendContract] = useMutation(SUSPEND_CONTRACT);
  const [resumeContract] = useMutation(RESUME_CONTRACT);
  const [terminateContract] = useMutation(TERMINATE_CONTRACT);
  const [renewContract] = useMutation(RENEW_CONTRACT);
  const [deleteContract] = useMutation(DELETE_CONTRACT);
  const [deleteSla] = useMutation(DELETE_SERVICE_LEVEL);

  const contract = data?.contract;

  const sortedEvents = useMemo(() => {
    const list = eventsData?.contractEvents ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }, [eventsData]);

  const refreshAll = async () => {
    await refetch();
  };

  const handleActivate = async () => {
    if (!contract) return;
    await activateContract({ variables: { id: contract.id } });
    await refreshAll();
  };

  const handleSuspend = async () => {
    if (!contract) return;
    const reason = window.prompt('Motivo da suspensão:') ?? '';
    await suspendContract({
      variables: { id: contract.id, reason: reason.trim() || null },
    });
    await refreshAll();
  };

  const handleResume = async () => {
    if (!contract) return;
    await resumeContract({ variables: { id: contract.id } });
    await refreshAll();
  };

  const handleTerminate = async () => {
    if (!contract) return;
    const reason = window.prompt('Motivo do encerramento:') ?? '';
    if (!window.confirm('Confirma encerrar o contrato?')) return;
    await terminateContract({
      variables: { id: contract.id, reason: reason.trim() || null },
    });
    await refreshAll();
  };

  const handleRenew = async () => {
    if (!contract) return;
    const input = window.prompt(
      'Nova data de fim (YYYY-MM-DD):',
      contract.endDate ? contract.endDate.slice(0, 10) : '',
    );
    if (!input) return;
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      alert('Data inválida.');
      return;
    }
    await renewContract({
      variables: { id: contract.id, newEndDate: parsed.toISOString() },
    });
    await refreshAll();
  };

  const handleDelete = async () => {
    if (!contract) return;
    if (!window.confirm('Excluir contrato? Esta ação é definitiva.')) return;
    await deleteContract({ variables: { id: contract.id } });
    navigate(-1);
  };

  const handleDeleteSla = async (sla: ServiceLevel) => {
    if (!window.confirm(`Excluir SLA "${sla.name}"?`)) return;
    await deleteSla({ variables: { id: sla.id } });
    await refreshAll();
  };

  if (loading && !contract) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
        Erro ao carregar contrato: {error.message}
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-white border rounded-lg p-6 text-sm text-slate-600">
        Contrato não encontrado.
      </div>
    );
  }

  const status = contract.status;
  const readOnly = status === 'TERMINATED' || status === 'EXPIRED';

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-2 py-1 text-sm border rounded hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-['Rajdhani'] font-bold leading-tight">
                {contract.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-slate-500">
                  {contract.number}
                </span>
                <span
                  className={`inline-block px-3 py-1 text-sm rounded border font-medium ${STATUS_COLOR[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {status === 'DRAFT' && (
            <>
              <button
                onClick={handleActivate}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                <Play className="w-4 h-4" />
                Ativar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-rose-200 text-rose-700 rounded hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </>
          )}
          {status === 'ACTIVE' && (
            <>
              <button
                onClick={handleSuspend}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                <Pause className="w-4 h-4" />
                Suspender
              </button>
              <button
                onClick={handleRenew}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <RefreshCcw className="w-4 h-4" />
                Renovar
              </button>
              <button
                onClick={handleTerminate}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-rose-600 text-white rounded hover:bg-rose-700"
              >
                <StopCircle className="w-4 h-4" />
                Encerrar
              </button>
            </>
          )}
          {status === 'SUSPENDED' && (
            <>
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                <Play className="w-4 h-4" />
                Reativar
              </button>
              <button
                onClick={handleTerminate}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-rose-600 text-white rounded hover:bg-rose-700"
              >
                <StopCircle className="w-4 h-4" />
                Encerrar
              </button>
            </>
          )}
        </div>
      </header>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Informações</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">Cliente (ID)</div>
            <div className="font-mono">{contract.customerId}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Número</div>
            <div className="font-mono">{contract.number}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Valor</div>
            <div className="font-semibold">{fmtBRL(contract.value)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Ciclo</div>
            <div>{CYCLE_LABEL[contract.billingCycle]}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Vigência</div>
            <div>
              {fmtDate(contract.startDate)} — {fmtDate(contract.endDate)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Auto-renovação</div>
            <div>
              {contract.autoRenew ? (
                <span className="text-emerald-600">Sim</span>
              ) : (
                <span className="text-slate-500">Não</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Vendedor (ID)</div>
            <div className="font-mono text-xs">
              {contract.sellerId ?? '—'}
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="text-xs text-slate-500">Descrição</div>
            <div className="whitespace-pre-wrap">
              {contract.description ?? (
                <span className="text-slate-400">—</span>
              )}
            </div>
          </div>
          {contract.terms && (
            <div className="md:col-span-3">
              <div className="text-xs text-slate-500">Termos</div>
              <div className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 border rounded p-3">
                {contract.terms}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">SLAs</h2>
          {!readOnly && (
            <button
              onClick={() => setAddingSla(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar SLA
            </button>
          )}
        </div>

        {contract.serviceLevels.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-4">
            Nenhum SLA cadastrado
          </div>
        ) : (
          <ul className="space-y-2">
            {contract.serviceLevels.map((sla) => (
              <li
                key={sla.id}
                className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded border ${SLA_KIND_COLOR[sla.kind]}`}
                    >
                      {SLA_KIND_LABEL[sla.kind]}
                    </span>
                    {!sla.active && (
                      <span className="inline-block px-2 py-0.5 text-xs rounded border bg-slate-100 text-slate-500 border-slate-200">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-sm mt-1">{sla.name}</div>
                  {sla.description && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {sla.description}
                    </p>
                  )}
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                    <span>
                      Alvo:{' '}
                      <span className="text-slate-700">
                        {sla.targetValue} {sla.unit ?? ''}
                      </span>
                    </span>
                    <span>
                      Penalidade:{' '}
                      <span className="text-slate-700">
                        {sla.penaltyPercent}%
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!readOnly && (
                    <button
                      onClick={() => setRecordingSla(sla)}
                      className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-slate-50"
                    >
                      <ActivityIcon className="w-3.5 h-3.5" />
                      Registrar evento
                    </button>
                  )}
                  <button
                    onClick={() => setHistorySla(sla)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-slate-50"
                  >
                    <History className="w-3.5 h-3.5" />
                    Histórico
                  </button>
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => setEditingSla(sla)}
                        className="px-2 py-1 text-xs border rounded hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSla(sla)}
                        className="p-1.5 text-rose-500 border border-rose-200 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Eventos do contrato</h2>
        {eventsLoading && sortedEvents.length === 0 ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-4">
            Nenhum evento registrado
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedEvents.map((ev) => (
              <li
                key={ev.id}
                className="border rounded p-3 flex items-start gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded border ${EVENT_TYPE_COLOR[ev.type]}`}
                    >
                      {EVENT_TYPE_LABEL[ev.type]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {fmtDateTime(ev.occurredAt)}
                    </span>
                  </div>
                  {ev.notes && (
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                      {ev.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {addingSla && (
        <AddSlaModal
          contractId={contract.id}
          onClose={() => setAddingSla(false)}
          onCreated={() => refreshAll()}
        />
      )}
      {editingSla && (
        <EditSlaModal
          sla={editingSla}
          onClose={() => setEditingSla(null)}
          onSaved={() => refreshAll()}
        />
      )}
      {recordingSla && (
        <RecordEventModal
          sla={recordingSla}
          onClose={() => setRecordingSla(null)}
          onSaved={() => refreshAll()}
        />
      )}
      {historySla && (
        <SlaHistoryModal
          sla={historySla}
          onClose={() => setHistorySla(null)}
        />
      )}
    </div>
  );
}
