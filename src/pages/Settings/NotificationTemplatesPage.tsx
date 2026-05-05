import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Edit3,
  Eye,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareDashed,
  Mic,
  MoreVertical,
  Phone,
  Plus,
  Save,
  Send,
  Smartphone,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import {
  CREATE_NOTIFICATION_TEMPLATE,
  DELETE_NOTIFICATION_TEMPLATE,
  GET_NOTIFICATION_TEMPLATES,
  UPDATE_NOTIFICATION_TEMPLATE,
} from '../../graphql/queries/notification-templates';
import { GET_COMPANY_SETTINGS } from '../../graphql/queries/system-settings';

type NotificationChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH';

interface NotificationTemplate {
  id: string;
  companyId: string;
  key: string;
  channel: NotificationChannel;
  name: string;
  subject: string | null;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanySettings {
  id: string;
  companyId: string;
  companyWhatsappName: string | null;
  companyWhatsappNumber: string | null;
}

interface FormState {
  key: string;
  channel: NotificationChannel;
  name: string;
  subject: string;
  body: string;
  active: boolean;
}

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  IN_APP: 'In-app',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  PUSH: 'Push',
};

const CHANNEL_COLOR: Record<NotificationChannel, string> = {
  IN_APP: 'bg-slate-100 text-slate-700 border-slate-200',
  EMAIL: 'bg-blue-50 text-blue-700 border-blue-200',
  WHATSAPP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SMS: 'bg-amber-50 text-amber-700 border-amber-200',
  PUSH: 'bg-violet-50 text-violet-700 border-violet-200',
};

const CHANNEL_ICON: Record<
  NotificationChannel,
  React.ComponentType<{ className?: string }>
> = {
  IN_APP: Bell,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: MessageSquare,
  PUSH: Smartphone,
};

const CHANNELS: NotificationChannel[] = [
  'IN_APP',
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'PUSH',
];

const SUPPORTED_VARS: { token: string; label: string }[] = [
  { token: '{{customer.name}}', label: 'Nome cliente' },
  { token: '{{customer.phone}}', label: 'Tel. cliente' },
  { token: '{{order.number}}', label: 'Nº pedido' },
  { token: '{{order.total}}', label: 'Total pedido' },
  { token: '{{date}}', label: 'Data' },
  { token: '{{company.name}}', label: 'Empresa' },
];

const emptyForm: FormState = {
  key: '',
  channel: 'WHATSAPP',
  name: '',
  subject: '',
  body: '',
  active: true,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PreviewVars {
  customer: { name: string; phone: string };
  order: { number: number; total: string };
  date: string;
  company: { name: string };
}

function renderText(text: string, vars: PreviewVars): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const parts = path.split('.');
    if (parts.length === 1) {
      if (parts[0] === 'date') return vars.date;
      return `{{${path}}}`;
    }
    if (parts.length === 2) {
      const [root, key] = parts;
      const obj = (vars as unknown as Record<string, Record<string, unknown>>)[
        root
      ];
      if (!obj) return `{{${path}}}`;
      const value = obj[key];
      if (value === undefined) return `{{${path}}}`;
      return String(value);
    }
    return `{{${path}}}`;
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Convert WhatsApp markdown subset to safe HTML
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function whatsappMarkdownToHtml(raw: string): string {
  const escaped = escapeHtml(raw);
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>');
}

interface PhonePreviewProps {
  channel: NotificationChannel;
  body: string;
  subject: string;
  fromName: string;
  vars: PreviewVars;
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-white text-[10px] text-slate-700 font-semibold">
      <span>14:32</span>
      <div className="flex items-center gap-1">
        <span className="text-[8px]">●●●●</span>
        <span>5G</span>
        <div className="w-5 h-2.5 border border-slate-700 rounded-sm relative">
          <div className="absolute inset-0.5 bg-slate-700 rounded-[1px]" />
        </div>
      </div>
    </div>
  );
}

function PhonePreview({
  channel,
  body,
  subject,
  fromName,
  vars,
}: PhonePreviewProps) {
  const renderedBody = renderText(body, vars);
  const renderedSubject = renderText(subject, vars);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5" />
        Pré-visualização ·{' '}
        <span className="font-semibold text-slate-700">
          {CHANNEL_LABEL[channel]}
        </span>
      </div>
      <div className="relative w-[280px] h-[560px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl mx-auto">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="bg-white h-full rounded-[2rem] overflow-hidden flex flex-col">
          <StatusBar />

          {channel === 'WHATSAPP' && (
            <WhatsAppView
              body={renderedBody}
              fromName={fromName}
            />
          )}
          {channel === 'SMS' && (
            <SmsView body={renderedBody} fromName={fromName} />
          )}
          {channel === 'EMAIL' && (
            <EmailView
              body={renderedBody}
              subject={renderedSubject}
              fromName={fromName}
            />
          )}
          {channel === 'IN_APP' && (
            <InAppView
              body={renderedBody}
              subject={renderedSubject}
              fromName={fromName}
            />
          )}
          {channel === 'PUSH' && (
            <PushView
              body={renderedBody}
              subject={renderedSubject}
              fromName={fromName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function WhatsAppView({ body, fromName }: { body: string; fromName: string }) {
  const html = whatsappMarkdownToHtml(body).replace(/\n/g, '<br/>');
  // SVG bg pattern for "wallpaper" feel
  const bgUrl = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='20' cy='20' r='1' fill='%23d4cabe' opacity='0.4'/></svg>")`;

  return (
    <>
      <div className="bg-emerald-600 text-white p-3 flex items-center gap-3">
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <div className="bg-emerald-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
          {getInitials(fromName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{fromName}</div>
          <div className="text-[10px] text-emerald-100">online</div>
        </div>
        <Phone className="w-4 h-4 shrink-0" />
        <MoreVertical className="w-4 h-4 shrink-0" />
      </div>
      <div
        className="flex-1 overflow-y-auto bg-[#e5ddd5]"
        style={{ backgroundImage: bgUrl }}
      >
        <div className="py-3 flex justify-center">
          <span className="bg-[#dbe5f1] text-[#5d8db4] text-[10px] px-2 py-0.5 rounded-md shadow-sm">
            HOJE
          </span>
        </div>
        <div className="bg-white rounded-lg p-2 max-w-[85%] mx-2 my-2 shadow-sm relative">
          <div
            className="absolute -left-1.5 top-0 w-3 h-3 bg-white"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          />
          <div
            className="text-xs text-slate-800 whitespace-pre-wrap break-words leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: html || '<span class="text-slate-400">Mensagem...</span>',
            }}
          />
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[9px] text-slate-400">14:32</span>
            <CheckCheck className="w-3 h-3 text-emerald-500" />
          </div>
        </div>
      </div>
      <div className="bg-[#f0f0f0] p-2 flex items-center gap-2 border-t border-slate-200">
        <Smile className="w-4 h-4 text-slate-500" />
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400">
          Mensagem
        </div>
        <div className="bg-emerald-600 w-7 h-7 rounded-full flex items-center justify-center">
          <Mic className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </>
  );
}

function SmsView({ body, fromName }: { body: string; fromName: string }) {
  return (
    <>
      <div className="bg-slate-100 border-b text-center py-2 text-sm font-semibold text-slate-800">
        {fromName}
      </div>
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="py-3 flex justify-center">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">
            Hoje · 14:32
          </span>
        </div>
        <div className="bg-slate-200 rounded-2xl rounded-tl-sm p-2.5 max-w-[85%] m-3 text-sm text-slate-800 whitespace-pre-wrap break-words">
          {body || (
            <span className="text-slate-400 text-xs">Mensagem...</span>
          )}
        </div>
      </div>
      <div className="bg-slate-50 p-2 flex items-center gap-2 border-t">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400 border">
          Mensagem de texto
        </div>
        <div className="bg-blue-500 w-7 h-7 rounded-full flex items-center justify-center">
          <Send className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </>
  );
}

function EmailView({
  body,
  subject,
  fromName,
}: {
  body: string;
  subject: string;
  fromName: string;
}) {
  return (
    <>
      <div className="bg-slate-50 border-b p-3 text-[11px] space-y-0.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Mail className="w-3 h-3" />
          <span className="font-semibold text-slate-700">Caixa de entrada</span>
        </div>
        <div className="text-slate-600">
          <span className="text-slate-400">De:</span>{' '}
          <span className="font-medium text-slate-800">{fromName}</span>
        </div>
        <div className="text-slate-600">
          <span className="text-slate-400">Para:</span>{' '}
          <span>cliente@exemplo.com</span>
        </div>
        <div className="text-slate-800 font-semibold mt-1 text-xs truncate">
          {subject || (
            <span className="text-slate-400 font-normal">
              (Assunto)
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-800 whitespace-pre-wrap break-words bg-white">
        {body || (
          <span className="text-slate-400 text-xs">Corpo do e-mail...</span>
        )}
      </div>
      <div className="bg-white border-t p-2 grid grid-cols-3 gap-1">
        <button className="text-[10px] py-1.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100">
          Responder
        </button>
        <button className="text-[10px] py-1.5 rounded bg-slate-50 text-slate-700 font-medium border border-slate-200">
          Encaminhar
        </button>
        <button className="text-[10px] py-1.5 rounded bg-rose-50 text-rose-700 font-medium border border-rose-100">
          Excluir
        </button>
      </div>
    </>
  );
}

function InAppView({
  body,
  subject,
  fromName,
}: {
  body: string;
  subject: string;
  fromName: string;
}) {
  return (
    <div className="flex-1 bg-slate-50 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-700">
          Notificações
        </span>
        <span className="text-[10px] text-slate-400">{fromName}</span>
      </div>
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex items-start gap-3">
        <div className="bg-gradient-to-br from-violet-500 to-blue-600 p-2 rounded-lg">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs text-slate-800 truncate">
            {subject || 'Notificação'}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-wrap break-words">
            {body || (
              <span className="text-slate-400">Texto da notificação...</span>
            )}
          </div>
          <div className="text-[9px] text-slate-400 mt-1">agora há pouco</div>
        </div>
      </div>
    </div>
  );
}

function PushView({
  body,
  subject,
  fromName,
}: {
  body: string;
  subject: string;
  fromName: string;
}) {
  return (
    <div
      className="flex-1 relative"
      style={{
        background:
          'linear-gradient(160deg, #1e293b 0%, #334155 50%, #475569 100%)',
      }}
    >
      <div className="bg-white/95 backdrop-blur rounded-xl p-3 m-3 shadow-md flex items-start gap-2">
        <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-1.5 rounded-md shrink-0">
          <Smartphone className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-700 uppercase truncate">
              {fromName}
            </span>
            <span className="text-[9px] text-slate-400 shrink-0">agora</span>
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate mt-0.5">
            {subject || 'Notificação push'}
          </div>
          <div className="text-[11px] text-slate-700 mt-0.5 whitespace-pre-wrap break-words line-clamp-3">
            {body || (
              <span className="text-slate-400">Conteúdo da notificação...</span>
            )}
          </div>
        </div>
        <button className="text-[10px] font-medium text-blue-600 shrink-0 self-start">
          Ver
        </button>
      </div>
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <div className="text-white text-3xl font-light">14:32</div>
        <div className="text-white/80 text-xs mt-1">terça-feira, 5 de maio</div>
      </div>
    </div>
  );
}

export function NotificationTemplatesPage() {
  const [channelFilter, setChannelFilter] = useState<'' | NotificationChannel>(
    '',
  );
  const [activeOnly, setActiveOnly] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const variables = useMemo(
    () => ({
      ...(channelFilter ? { channel: channelFilter } : {}),
      ...(activeOnly ? { activeOnly: true } : {}),
    }),
    [channelFilter, activeOnly],
  );

  const { data, loading, error, refetch } = useQuery<{
    notificationTemplates: NotificationTemplate[];
  }>(GET_NOTIFICATION_TEMPLATES, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const { data: settingsData } = useQuery<{
    companySettings: CompanySettings | null;
  }>(GET_COMPANY_SETTINGS, {
    fetchPolicy: 'cache-and-network',
  });

  const [createTemplate, { loading: creating }] = useMutation(
    CREATE_NOTIFICATION_TEMPLATE,
  );
  const [updateTemplate, { loading: updating }] = useMutation(
    UPDATE_NOTIFICATION_TEMPLATE,
  );
  const [deleteTemplate, { loading: deleting }] = useMutation(
    DELETE_NOTIFICATION_TEMPLATE,
  );

  const templates = data?.notificationTemplates ?? [];
  const saving = creating || updating;
  const companyName =
    settingsData?.companySettings?.companyWhatsappName ?? 'Sua Empresa';

  const previewVars: PreviewVars = useMemo(
    () => ({
      customer: { name: 'Maria Silva', phone: '+55 71 99999-8888' },
      order: { number: 1234, total: 'R$ 250,00' },
      date: new Date().toLocaleDateString('pt-BR'),
      company: { name: companyName },
    }),
    [companyName],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (tpl: NotificationTemplate) => {
    setEditingId(tpl.id);
    setForm({
      key: tpl.key,
      channel: tpl.channel,
      name: tpl.name,
      subject: tpl.subject ?? '',
      body: tpl.body,
      active: tpl.active,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.key.trim() || !form.name.trim() || !form.body.trim()) {
      setFormError('Preencha key, nome e corpo da mensagem.');
      return;
    }
    const input = {
      key: form.key.trim(),
      channel: form.channel,
      name: form.name.trim(),
      subject:
        form.channel === 'EMAIL' && form.subject.trim()
          ? form.subject.trim()
          : null,
      body: form.body,
      active: form.active,
    };
    try {
      if (editingId) {
        await updateTemplate({ variables: { id: editingId, input } });
      } else {
        await createTemplate({ variables: { input } });
      }
      await refetch();
      closeForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao salvar template';
      setFormError(msg);
    }
  };

  const handleDelete = async (tpl: NotificationTemplate) => {
    const ok = window.confirm(
      `Excluir template "${tpl.name}" (${tpl.key})? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    try {
      await deleteTemplate({ variables: { id: tpl.id } });
      await refetch();
      if (editingId === tpl.id) closeForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Erro ao excluir template: ' + msg);
    }
  };

  const insertVariable = (token: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setForm((f) => ({ ...f, body: f.body + token }));
      return;
    }
    const start = textarea.selectionStart ?? form.body.length;
    const end = textarea.selectionEnd ?? form.body.length;
    const next = form.body.slice(0, start) + token + form.body.slice(end);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + token.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const totals = useMemo(() => {
    const counts: Record<NotificationChannel, number> = {
      IN_APP: 0,
      EMAIL: 0,
      WHATSAPP: 0,
      SMS: 0,
      PUSH: 0,
    };
    for (const tpl of templates) counts[tpl.channel] += 1;
    return counts;
  }, [templates]);

  // Inactive count for header summary
  const inactiveCount = templates.filter((t) => !t.active).length;

  // When the form is closed, show a placeholder body in preview to demo
  const previewChannel: NotificationChannel = showForm
    ? form.channel
    : 'WHATSAPP';
  const previewBody = showForm
    ? form.body
    : 'Olá *{{customer.name}}*, seu pedido #{{order.number}} no valor de {{order.total}} foi confirmado em _{{date}}_.\n\nObrigado por escolher {{company.name}}!';
  const previewSubject = showForm
    ? form.subject
    : 'Confirmação do pedido #{{order.number}}';

  // Auto-update form's subject visible only when EMAIL
  useEffect(() => {
    if (form.channel !== 'EMAIL') {
      setForm((f) => (f.subject ? { ...f, subject: f.subject } : f));
    }
  }, [form.channel]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-2.5 rounded-xl shadow-md shadow-blue-500/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-['Rajdhani'] font-bold text-slate-900">
              Templates de Notificação
            </h1>
            <p className="text-sm text-slate-500">
              Modelos reutilizáveis para envios via e-mail, WhatsApp, SMS, push
              e in-app.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 shadow-md shadow-blue-500/25 font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo template
        </button>
      </header>

      {/* Channel summary */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CHANNELS.map((c) => {
          const Icon = CHANNEL_ICON[c];
          return (
            <div
              key={c}
              className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-sm"
            >
              <div
                className={`p-2 rounded-lg ${CHANNEL_COLOR[c]} border flex items-center justify-center`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
                  {CHANNEL_LABEL[c]}
                </div>
                <div className="text-lg font-bold text-slate-800 leading-none">
                  {totals[c]}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="text-xs">
            <span className="block mb-1 font-medium text-slate-700">
              Canal
            </span>
            <div className="relative">
              <select
                value={channelFilter}
                onChange={(e) =>
                  setChannelFilter(e.target.value as '' | NotificationChannel)
                }
                className="w-full appearance-none border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">Todos os canais</option>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </label>
          <label className="flex items-center gap-2 text-sm select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-slate-700 font-medium">
              Apenas ativos
            </span>
          </label>
          <div className="text-xs text-slate-500 md:text-right">
            {templates.length} template(s){' '}
            {inactiveCount > 0 && (
              <span className="text-slate-400">
                · {inactiveCount} inativo(s)
              </span>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-lg">
          Erro ao carregar templates: {error.message}
        </div>
      )}

      {/* 3-col layout: list / form / preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Column 1: list */}
        <section className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">
              Templates
            </span>
            <span className="text-xs text-slate-500">
              {loading ? 'carregando…' : `${templates.length} item(s)`}
            </span>
          </div>
          {loading && templates.length === 0 ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <MessageSquareDashed className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Nenhum template cadastrado.
            </div>
          ) : (
            <ul className="max-h-[640px] overflow-y-auto">
              {templates.map((tpl) => {
                const Icon = CHANNEL_ICON[tpl.channel];
                const selected = editingId === tpl.id;
                return (
                  <li
                    key={tpl.id}
                    onClick={() => openEdit(tpl)}
                    className={`flex items-start gap-2 px-3 py-3 border-b last:border-b-0 cursor-pointer transition ${
                      selected
                        ? 'bg-blue-50/50 border-l-4 border-l-blue-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md ${CHANNEL_COLOR[tpl.channel]} border shrink-0`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {tpl.name}
                        </span>
                        {!tpl.active && (
                          <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                        {tpl.key}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                        {tpl.body}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {formatDate(tpl.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tpl);
                      }}
                      disabled={deleting}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded shrink-0"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Column 2: form */}
        <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {showForm ? (
            <>
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 text-white flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  {editingId ? (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Editar template
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Novo template
                    </>
                  )}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-1 hover:bg-white/20 rounded"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-lg">
                    {formError}
                  </div>
                )}

                <label className="text-xs block">
                  <span className="block mb-1 font-medium text-slate-700">
                    Nome (label exibível)
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="ex.: Confirmação de pedido"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs">
                    <span className="block mb-1 font-medium text-slate-700">
                      Key (slug)
                    </span>
                    <input
                      type="text"
                      value={form.key}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, key: e.target.value }))
                      }
                      placeholder="ex.: order_confirmation"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </label>
                  <label className="text-xs">
                    <span className="block mb-1 font-medium text-slate-700">
                      Canal
                    </span>
                    <div className="relative">
                      <select
                        value={form.channel}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            channel: e.target.value as NotificationChannel,
                          }))
                        }
                        className="w-full appearance-none border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {CHANNELS.map((c) => (
                          <option key={c} value={c}>
                            {CHANNEL_LABEL[c]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </label>
                </div>

                {/* Channel chips for visualization */}
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map((c) => {
                    const Icon = CHANNEL_ICON[c];
                    const active = form.channel === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, channel: c }))
                        }
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                          active
                            ? `${CHANNEL_COLOR[c]} border-current shadow-sm`
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {CHANNEL_LABEL[c]}
                      </button>
                    );
                  })}
                </div>

                {(form.channel === 'EMAIL' ||
                  form.channel === 'IN_APP' ||
                  form.channel === 'PUSH') && (
                  <label className="text-xs block">
                    <span className="block mb-1 font-medium text-slate-700">
                      {form.channel === 'EMAIL'
                        ? 'Assunto do e-mail'
                        : 'Título da notificação'}
                    </span>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, subject: e.target.value }))
                      }
                      placeholder={
                        form.channel === 'EMAIL'
                          ? 'ex.: Pedido #{{order.number}} confirmado'
                          : 'ex.: Pedido confirmado'
                      }
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </label>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">
                      Corpo da mensagem
                    </span>
                  </div>
                  <textarea
                    ref={bodyRef}
                    value={form.body}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, body: e.target.value }))
                    }
                    rows={8}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={
                      'Olá *{{customer.name}}*, seu pedido #{{order.number}} no valor de {{order.total}} foi processado em {{date}}.'
                    }
                    required
                  />
                  <div className="mt-2">
                    <div className="text-[10px] text-slate-500 mb-1.5 font-medium">
                      Inserir variável:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SUPPORTED_VARS.map((v) => (
                        <button
                          key={v.token}
                          type="button"
                          onClick={() => insertVariable(v.token)}
                          className="text-[10px] font-mono bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 px-2 py-1 rounded border border-slate-200 transition"
                          title={v.label}
                        >
                          {v.token}
                        </button>
                      ))}
                    </div>
                    {form.channel === 'WHATSAPP' && (
                      <div className="text-[10px] text-slate-400 mt-2">
                        Dica: use <code className="font-mono">*texto*</code>{' '}
                        para negrito e <code className="font-mono">_texto_</code>{' '}
                        para itálico.
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm select-none">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, active: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  <span className="text-slate-700">Ativo</span>
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 shadow-md shadow-blue-500/25"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingId ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-slate-50 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3">
                <Edit3 className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                Selecione um template para editar
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Ou crie um novo modelo do zero. À direita, veja a
                pré-visualização ao vivo de como a mensagem aparece no
                dispositivo do cliente.
              </p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-violet-700 shadow-md shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
                Novo template
              </button>
              <div className="mt-6 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Check className="w-3 h-3" />
                Mostrando preview de exemplo →
              </div>
            </div>
          )}
        </section>

        {/* Column 3: phone preview */}
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-xl shadow-sm p-6 lg:sticky lg:top-4">
          <PhonePreview
            channel={previewChannel}
            body={previewBody}
            subject={previewSubject}
            fromName={companyName}
            vars={previewVars}
          />
        </section>
      </div>
    </div>
  );
}
