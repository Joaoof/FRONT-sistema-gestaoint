import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Send,
  StickyNote,
  Trash2,
  Trophy,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  ADD_OPPORTUNITY_ACTIVITY,
  DELETE_OPPORTUNITY,
  DELETE_OPPORTUNITY_ACTIVITY,
  GET_OPPORTUNITY,
  GET_OPPORTUNITY_ACTIVITIES,
  MOVE_OPPORTUNITY_STAGE,
  UPDATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY_ACTIVITY,
} from '../../graphql/queries/opportunities';
import {
  BUILD_WHATSAPP_LINK,
  MARK_WHATSAPP_LINK_OPENED,
} from '../../graphql/queries/whatsapp';
import { GET_NOTIFICATION_TEMPLATES } from '../../graphql/queries/notification-templates';

type Stage =
  | 'NEW'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK';
type ActivityStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';

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
  sellerId: string | null;
  notes: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  opportunityId: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
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

const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  CALL: 'Ligação',
  EMAIL: 'E-mail',
  MEETING: 'Reunião',
  NOTE: 'Nota',
  TASK: 'Tarefa',
};

const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
};

const ACTIVITY_STATUS_COLOR: Record<ActivityStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELED: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
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

function ActivityIcon({ type, className }: { type: ActivityType; className?: string }) {
  const cls = className ?? 'w-4 h-4';
  if (type === 'CALL') return <Phone className={cls} />;
  if (type === 'EMAIL') return <Mail className={cls} />;
  if (type === 'MEETING') return <Users className={cls} />;
  if (type === 'NOTE') return <StickyNote className={cls} />;
  return <CheckSquare className={cls} />;
}

interface EditModalProps {
  opportunity: Opportunity;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ opportunity, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    title: opportunity.title,
    customerName: opportunity.customerName ?? '',
    customerPhone: opportunity.customerPhone ?? '',
    customerEmail: opportunity.customerEmail ?? '',
    source: opportunity.source ?? '',
    stage: opportunity.stage,
    value: String(opportunity.value ?? 0),
    probability: String(opportunity.probability ?? 0),
    expectedCloseDate: opportunity.expectedCloseDate
      ? opportunity.expectedCloseDate.slice(0, 10)
      : '',
    notes: opportunity.notes ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [updateOpp, { loading }] = useMutation(UPDATE_OPPORTUNITY);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateOpp({
        variables: {
          id: opportunity.id,
          input: {
            title: form.title.trim(),
            customerName: form.customerName.trim() || null,
            customerPhone: form.customerPhone.trim() || null,
            customerEmail: form.customerEmail.trim() || null,
            source: form.source.trim() || null,
            stage: form.stage,
            value: Number(form.value) || 0,
            probability: Number(form.probability) || 0,
            expectedCloseDate: form.expectedCloseDate
              ? new Date(form.expectedCloseDate).toISOString()
              : null,
            notes: form.notes.trim() || null,
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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Editar oportunidade</h2>
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
            <span className="block mb-1 text-slate-600">Probabilidade (%)</span>
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
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

interface NewActivityFormProps {
  opportunityId: string;
  onClose: () => void;
  onCreated: () => void;
}

function NewActivityForm({
  opportunityId,
  onClose,
  onCreated,
}: NewActivityFormProps) {
  const [form, setForm] = useState({
    type: 'TASK' as ActivityType,
    title: '',
    description: '',
    dueDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [addActivity, { loading }] = useMutation(ADD_OPPORTUNITY_ACTIVITY);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addActivity({
        variables: {
          opportunityId,
          input: {
            type: form.type,
            title: form.title.trim(),
            description: form.description.trim() || null,
            dueDate: form.dueDate
              ? new Date(form.dueDate).toISOString()
              : null,
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
    <form
      onSubmit={submit}
      className="bg-slate-50 border rounded p-3 space-y-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <label className="text-xs">
          <span className="block mb-1 text-slate-600">Tipo</span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((p) => ({ ...p, type: e.target.value as ActivityType }))
            }
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            {(Object.keys(ACTIVITY_TYPE_LABEL) as ActivityType[]).map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-slate-600">Vence em</span>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, dueDate: e.target.value }))
            }
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <label className="text-xs block">
        <span className="block mb-1 text-slate-600">Título *</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs block">
        <span className="block mb-1 text-slate-600">Descrição</span>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          className="w-full border rounded px-2 py-1.5 text-sm"
        />
      </label>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 border rounded text-xs hover:bg-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !form.title}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Criar atividade
        </button>
      </div>
    </form>
  );
}

interface NotificationTemplate {
  id: string;
  key: string;
  channel: 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH';
  name: string;
  subject: string | null;
  body: string;
  active: boolean;
}

interface WhatsappModalProps {
  opportunity: {
    id: string;
    title: string;
    customerId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    value: number;
  };
  onClose: () => void;
}

function interpolate(s: string, vars: Record<string, unknown>): string {
  return s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const v = path
      .split('.')
      .reduce<unknown>(
        (acc, p) =>
          acc && typeof acc === 'object'
            ? (acc as Record<string, unknown>)[p]
            : undefined,
        vars,
      );
    return v === null || v === undefined ? '' : String(v);
  });
}

function applyWhatsappFormatting(escaped: string): string {
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function WhatsappModal({ opportunity, onClose }: WhatsappModalProps) {
  const [phone, setPhone] = useState(opportunity.customerPhone ?? '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [body, setBody] = useState(
    `Olá ${opportunity.customerName ?? ''}, tudo bem?\n\nFalando aqui sobre *${opportunity.title}*.`,
  );
  const [error, setError] = useState<string | null>(null);

  const { data: templatesData } = useQuery<{
    notificationTemplates: NotificationTemplate[];
  }>(GET_NOTIFICATION_TEMPLATES, {
    variables: { channel: 'WHATSAPP', activeOnly: true },
    fetchPolicy: 'cache-and-network',
  });

  const [buildLink, { loading }] = useMutation(BUILD_WHATSAPP_LINK);
  const [markOpened] = useMutation(MARK_WHATSAPP_LINK_OPENED);

  const templates = templatesData?.notificationTemplates ?? [];

  const previewVars: Record<string, unknown> = {
    customer: {
      name: opportunity.customerName ?? '—',
      phone: opportunity.customerPhone ?? '',
      email: opportunity.customerEmail ?? '',
    },
    opportunity: {
      title: opportunity.title,
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(opportunity.value || 0),
    },
    date: new Date().toLocaleDateString('pt-BR'),
  };

  const renderedPreview = interpolate(body, previewVars);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setBody(tpl.body);
  };

  const sanitize = (raw: string) => raw.replace(/\D+/g, '');

  const submit = async () => {
    setError(null);
    const digits = sanitize(phone);
    if (digits.length < 10) {
      setError('Telefone inválido — precisa do DDI+DDD+número.');
      return;
    }
    try {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      const res = await buildLink({
        variables: {
          input: {
            toPhone: digits,
            customerId: opportunity.customerId,
            body: tpl ? undefined : body,
            templateKey: tpl?.key,
            varsJson: tpl ? JSON.stringify(previewVars) : undefined,
            log: true,
          },
        },
      });
      const link = res.data?.buildWhatsappLink;
      if (!link?.url) {
        setError('Falha ao construir o link.');
        return;
      }
      window.open(link.url, '_blank', 'noopener,noreferrer');
      if (link.messageLogId) {
        await markOpened({ variables: { messageLogId: link.messageLogId } });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Enviar WhatsApp</h2>
              <p className="text-xs text-emerald-50">
                Mensagem é gerada e o WhatsApp Web/app abre para você confirmar o envio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto">
            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">
                Telefone (com DDI)
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="55 71 99999-8888"
                className="w-full border rounded-lg px-3 py-2 font-mono"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Apenas dígitos serão usados. Será sanitizado.
              </span>
            </label>

            {templates.length > 0 && (
              <label className="block text-sm">
                <span className="block mb-1 text-slate-600">
                  Template (opcional)
                </span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">— mensagem livre —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.key})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-sm">
              <span className="block mb-1 text-slate-600">Mensagem</span>
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setSelectedTemplateId('');
                }}
                rows={10}
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Suporta *negrito* _itálico_ e variáveis{' '}
                <code className="text-emerald-600">{'{{customer.name}}'}</code>,{' '}
                <code className="text-emerald-600">{'{{opportunity.title}}'}</code>,{' '}
                <code className="text-emerald-600">{'{{opportunity.value}}'}</code>,{' '}
                <code className="text-emerald-600">{'{{date}}'}</code>.
              </span>
            </label>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-slate-50 p-6 flex flex-col items-center justify-center border-l">
            <div className="w-[260px] h-[480px] bg-slate-900 rounded-[2.2rem] p-2 shadow-2xl">
              <div className="bg-white h-full rounded-[1.8rem] overflow-hidden flex flex-col">
                <div className="bg-emerald-600 text-white px-3 py-2 flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs font-semibold">
                    {(opportunity.customerName ?? 'C')
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {opportunity.customerName ?? 'Cliente'}
                    </div>
                    <div className="text-[10px] text-emerald-100">online</div>
                  </div>
                  <Phone className="w-4 h-4" />
                </div>
                <div
                  className="flex-1 p-2 overflow-auto"
                  style={{ backgroundColor: '#e5ddd5' }}
                >
                  <div className="bg-white rounded-lg rounded-tl-none p-2 max-w-[85%] shadow-sm relative">
                    <div
                      className="text-xs text-slate-800"
                      dangerouslySetInnerHTML={{
                        __html: applyWhatsappFormatting(
                          escapeHtml(renderedPreview),
                        ),
                      }}
                    />
                    <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-0.5">
                      {new Date().toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <CheckCheck className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-100 p-2 flex items-center gap-2 text-slate-400 text-xs">
                  <span className="flex-1 bg-white rounded-full px-3 py-1.5 text-slate-300">
                    Mensagem
                  </span>
                  <Send className="w-4 h-4" />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 max-w-[260px] text-center">
              Pré-visualização. Ao confirmar, o WhatsApp Web/app abre com a mensagem pronta.
            </p>
          </div>
        </div>

        <div className="border-t bg-slate-50 px-6 py-3 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Uma cópia será gravada na Central de Mensagens.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-white"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={loading || !phone || !body.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-emerald-700 disabled:opacity-50 shadow"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Abrir WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const { data, loading, error, refetch } = useQuery<{
    opportunity: Opportunity;
  }>(GET_OPPORTUNITY, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: actData,
    loading: actLoading,
    refetch: refetchActivities,
  } = useQuery<{ opportunityActivities: Activity[] }>(
    GET_OPPORTUNITY_ACTIVITIES,
    {
      variables: { opportunityId: id ?? '' },
      skip: !id,
      fetchPolicy: 'cache-and-network',
    },
  );

  const [updateOpp] = useMutation(UPDATE_OPPORTUNITY);
  const [deleteOpp] = useMutation(DELETE_OPPORTUNITY);
  const [moveStage] = useMutation(MOVE_OPPORTUNITY_STAGE);
  const [updateActivity] = useMutation(UPDATE_OPPORTUNITY_ACTIVITY);
  const [deleteActivity] = useMutation(DELETE_OPPORTUNITY_ACTIVITY);

  const opp = data?.opportunity;

  useEffect(() => {
    if (opp) setNotesDraft(opp.notes ?? '');
  }, [opp?.id, opp?.notes]);

  const sortedActivities = useMemo(() => {
    const list = actData?.opportunityActivities ?? [];
    const order: Record<ActivityStatus, number> = {
      PENDING: 0,
      COMPLETED: 1,
      CANCELED: 2,
    };
    return [...list].sort((a, b) => {
      if (order[a.status] !== order[b.status])
        return order[a.status] - order[b.status];
      const ad = a.dueDate
        ? new Date(a.dueDate).getTime()
        : new Date(a.createdAt).getTime();
      const bd = b.dueDate
        ? new Date(b.dueDate).getTime()
        : new Date(b.createdAt).getTime();
      return bd - ad;
    });
  }, [actData]);

  const weighted = opp ? (opp.value * opp.probability) / 100 : 0;

  const saveNotes = async () => {
    if (!opp) return;
    setNotesSaving(true);
    try {
      await updateOpp({
        variables: {
          id: opp.id,
          input: { notes: notesDraft.trim() || null },
        },
      });
      await refetch();
    } finally {
      setNotesSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!opp) return;
    if (!window.confirm('Excluir esta oportunidade? Esta ação é definitiva.'))
      return;
    await deleteOpp({ variables: { id: opp.id } });
    navigate(-1);
  };

  const handleMarkWon = async () => {
    if (!opp) return;
    await moveStage({ variables: { id: opp.id, stage: 'WON' } });
    await refetch();
  };

  const handleMarkLost = async () => {
    if (!opp) return;
    const reason = window.prompt('Motivo da perda (opcional):') ?? '';
    await updateOpp({
      variables: {
        id: opp.id,
        input: { stage: 'LOST', lostReason: reason.trim() || null },
      },
    });
    await refetch();
  };

  const handleActivityComplete = async (activity: Activity) => {
    await updateActivity({
      variables: {
        id: activity.id,
        input: { status: 'COMPLETED', completedAt: new Date().toISOString() },
      },
    });
    await refetchActivities();
  };

  const handleActivityCancel = async (activity: Activity) => {
    await updateActivity({
      variables: { id: activity.id, input: { status: 'CANCELED' } },
    });
    await refetchActivities();
  };

  const handleActivityDelete = async (activity: Activity) => {
    if (!window.confirm('Excluir esta atividade?')) return;
    await deleteActivity({ variables: { id: activity.id } });
    await refetchActivities();
  };

  if (loading && !opp) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
        Erro ao carregar oportunidade: {error.message}
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="bg-white border rounded-lg p-6 text-sm text-slate-600">
        Oportunidade não encontrada.
      </div>
    );
  }

  const isFinal = opp.stage === 'WON' || opp.stage === 'LOST';
  const now = Date.now();

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
            <Briefcase className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-['Rajdhani'] font-bold leading-tight">
                {opp.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded border ${STAGE_COLOR[opp.stage]}`}
                >
                  {STAGE_LABEL[opp.stage]}
                </span>
                <span className="text-xs text-slate-500">
                  Atualizado em {fmtDateTime(opp.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setWhatsappOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded hover:from-emerald-700 shadow-sm"
            title="Enviar mensagem WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          {!isFinal && (
            <>
              <button
                onClick={handleMarkWon}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                <Trophy className="w-4 h-4" />
                Marcar como Ganha
              </button>
              <button
                onClick={handleMarkLost}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-rose-600 text-white rounded hover:bg-rose-700"
              >
                <XCircle className="w-4 h-4" />
                Marcar como Perdida
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-rose-200 text-rose-700 rounded hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <section className="bg-white border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Cliente</h2>
            <div className="space-y-2 text-sm">
              <div className="text-slate-700 font-medium">
                {opp.customerName ?? (
                  <span className="text-slate-400">Sem nome</span>
                )}
              </div>
              {opp.customerPhone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {opp.customerPhone}
                </div>
              )}
              {opp.customerEmail && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {opp.customerEmail}
                </div>
              )}
              <div className="text-xs text-slate-500">
                Origem:{' '}
                <span className="text-slate-700">
                  {opp.source ?? '—'}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Valores</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Valor</div>
                <div className="text-lg font-semibold">{fmtBRL(opp.value)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Probabilidade</div>
                <div className="text-lg font-semibold">{opp.probability}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Valor ponderado</div>
                <div className="text-lg font-semibold text-blue-700">
                  {fmtBRL(weighted)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Previsão</div>
                <div className="text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {fmtDate(opp.expectedCloseDate)}
                </div>
              </div>
              {opp.closedAt && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Fechado em</div>
                  <div className="text-sm">{fmtDateTime(opp.closedAt)}</div>
                </div>
              )}
              {opp.lostReason && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Motivo da perda</div>
                  <div className="text-sm text-rose-700">{opp.lostReason}</div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Notas</h2>
            <textarea
              rows={5}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Anotações sobre a oportunidade..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <div className="flex justify-end">
              <button
                onClick={saveNotes}
                disabled={notesSaving || notesDraft === (opp.notes ?? '')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {notesSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar notas
              </button>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Detalhes</h2>
            <div className="text-xs text-slate-500 space-y-1">
              <div>Criado em {fmtDateTime(opp.createdAt)}</div>
              <div>Atualizado em {fmtDateTime(opp.updatedAt)}</div>
              <div className="font-mono">ID: {opp.id}</div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bg-white border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Atividades</h2>
              <button
                onClick={() => setCreatingActivity((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Nova atividade
              </button>
            </div>

            {creatingActivity && (
              <NewActivityForm
                opportunityId={opp.id}
                onClose={() => setCreatingActivity(false)}
                onCreated={() => refetchActivities()}
              />
            )}

            {actLoading && sortedActivities.length === 0 ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : sortedActivities.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-6">
                Nenhuma atividade registrada
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedActivities.map((act) => {
                  const overdue =
                    act.status === 'PENDING' &&
                    act.dueDate &&
                    new Date(act.dueDate).getTime() < now;
                  return (
                    <li
                      key={act.id}
                      className="border rounded p-3 flex items-start gap-3"
                    >
                      <div className="mt-0.5 text-slate-500">
                        <ActivityIcon type={act.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs uppercase tracking-wide text-slate-500">
                            {ACTIVITY_TYPE_LABEL[act.type]}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded border ${ACTIVITY_STATUS_COLOR[act.status]}`}
                          >
                            {ACTIVITY_STATUS_LABEL[act.status]}
                          </span>
                        </div>
                        <div className="font-medium text-sm mt-0.5">
                          {act.title}
                        </div>
                        {act.description && (
                          <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">
                            {act.description}
                          </p>
                        )}
                        {act.dueDate && (
                          <div
                            className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-rose-600 font-medium' : 'text-slate-500'}`}
                          >
                            <Calendar className="w-3 h-3" />
                            Vence em {fmtDateTime(act.dueDate)}
                          </div>
                        )}
                        {act.completedAt && (
                          <div className="text-xs text-emerald-600 mt-1">
                            Concluída em {fmtDateTime(act.completedAt)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {act.status === 'PENDING' && (
                          <>
                            <button
                              title="Marcar como concluída"
                              onClick={() => handleActivityComplete(act)}
                              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              title="Cancelar"
                              onClick={() => handleActivityCancel(act)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          title="Excluir"
                          onClick={() => handleActivityDelete(act)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {editing && (
        <EditModal
          opportunity={opp}
          onClose={() => setEditing(false)}
          onSaved={() => refetch()}
        />
      )}

      {whatsappOpen && (
        <WhatsappModal
          opportunity={{
            id: opp.id,
            title: opp.title,
            customerId: opp.customerId,
            customerName: opp.customerName,
            customerPhone: opp.customerPhone,
            customerEmail: opp.customerEmail,
            value: opp.value,
          }}
          onClose={() => setWhatsappOpen(false)}
        />
      )}
    </div>
  );
}
