import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  CREATE_NOTIFICATION_TEMPLATE,
  DELETE_NOTIFICATION_TEMPLATE,
  GET_NOTIFICATION_TEMPLATES,
  UPDATE_NOTIFICATION_TEMPLATE,
} from '../../graphql/queries/notification-templates';

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

const CHANNELS: NotificationChannel[] = [
  'IN_APP',
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'PUSH',
];

const EXAMPLE_VARS: Record<string, Record<string, string | number>> = {
  customer: { name: 'João Silva' },
  order: { total: 'R$ 250,00', number: 1234 },
};

const EXAMPLE_DATE = new Date().toLocaleDateString('pt-BR');

const emptyForm: FormState = {
  key: '',
  channel: 'EMAIL',
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

function renderPreview(text: string): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const parts = path.split('.');
    if (parts.length === 1) {
      if (parts[0] === 'date') return EXAMPLE_DATE;
      const direct = (EXAMPLE_VARS as Record<string, unknown>)[parts[0]];
      if (typeof direct === 'string' || typeof direct === 'number') {
        return String(direct);
      }
      return `{{${path}}}`;
    }
    const [root, key] = parts;
    const obj = EXAMPLE_VARS[root];
    if (!obj) return `{{${path}}}`;
    const value = obj[key];
    if (value === undefined) return `{{${path}}}`;
    return String(value);
  });
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
      const msg = err instanceof Error ? err.message : 'Erro ao salvar template';
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

  const previewSubject =
    form.channel === 'EMAIL' ? renderPreview(form.subject) : '';
  const previewBody = renderPreview(form.body);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold">
              Templates de Notificação
            </h1>
            <p className="text-xs text-slate-500">
              Modelos reutilizáveis para envios via e-mail, WhatsApp, SMS, push
              e in-app.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Novo template
        </button>
      </header>

      <section className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Canal</span>
            <select
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as '' | NotificationChannel)
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm pt-5">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Apenas ativos
          </label>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar templates: {error.message}
        </div>
      )}

      {showForm && (
        <section className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="w-4 h-4 text-blue-600" />
                  Editar template
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-blue-600" />
                  Novo template
                </>
              )}
            </h2>
            <button
              onClick={closeForm}
              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-xs">
                <span className="block mb-1 text-slate-600">
                  Key (slug, único por canal)
                </span>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, key: e.target.value }))
                  }
                  placeholder="ex.: low_stock"
                  className="w-full border rounded px-2 py-1.5 text-sm font-mono"
                  required
                />
              </label>
              <label className="text-xs">
                <span className="block mb-1 text-slate-600">Canal</span>
                <select
                  value={form.channel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      channel: e.target.value as NotificationChannel,
                    }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {CHANNEL_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="block mb-1 text-slate-600">
                  Nome (label exibível)
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="ex.: Alerta de estoque baixo"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                  required
                />
              </label>
            </div>

            {form.channel === 'EMAIL' && (
              <label className="text-xs block">
                <span className="block mb-1 text-slate-600">
                  Assunto (somente para e-mail)
                </span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="ex.: Estoque baixo no produto {{product.name}}"
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </label>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs block">
                  <span className="block mb-1 text-slate-600">
                    Corpo da mensagem
                  </span>
                  <textarea
                    value={form.body}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, body: e.target.value }))
                    }
                    rows={10}
                    className="w-full border rounded px-2 py-1.5 text-sm font-mono"
                    placeholder={'Olá {{customer.name}}, seu pedido #{{order.number}} no valor de {{order.total}} foi processado em {{date}}.'}
                    required
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Variáveis suportadas:{' '}
                  <code className="font-mono">{'{{customer.name}}'}</code>,{' '}
                  <code className="font-mono">{'{{order.total}}'}</code>,{' '}
                  <code className="font-mono">{'{{order.number}}'}</code>,{' '}
                  <code className="font-mono">{'{{date}}'}</code>.
                </p>
              </div>

              <div>
                <span className="block mb-1 text-xs text-slate-600">
                  Pré-visualização
                </span>
                <div className="border rounded bg-slate-50 p-3 text-sm space-y-2 min-h-[220px]">
                  {form.channel === 'EMAIL' && (
                    <div className="text-xs text-slate-500">
                      <strong className="text-slate-700">Assunto:</strong>{' '}
                      {previewSubject || (
                        <span className="text-slate-400">(vazio)</span>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-slate-800">
                    {previewBody || (
                      <span className="text-slate-400">
                        Comece a digitar o corpo para ver a pré-visualização...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Ativo
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border rounded text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Salvar alterações' : 'Criar template'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b text-sm">
          <span className="text-slate-600">
            {loading
              ? 'Carregando...'
              : `${templates.length} template(s)`}
          </span>
        </div>

        {loading && templates.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum template cadastrado.
          </div>
        ) : (
          <ul>
            {templates.map((tpl) => (
              <li
                key={tpl.id}
                className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{tpl.name}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${CHANNEL_COLOR[tpl.channel]}`}
                    >
                      {CHANNEL_LABEL[tpl.channel]}
                    </span>
                    {!tpl.active && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    {tpl.key}
                  </div>
                  {tpl.subject && (
                    <div className="text-xs text-slate-600 mt-1 truncate">
                      <strong>Assunto:</strong> {tpl.subject}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                    {tpl.body}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Atualizado em {formatDate(tpl.updatedAt)}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(tpl)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-slate-50"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(tpl)}
                    disabled={deleting}
                    className="flex items-center gap-1 px-2 py-1 text-xs border rounded text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
