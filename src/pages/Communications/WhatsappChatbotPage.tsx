import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Bot,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Power,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  CREATE_WHATSAPP_CHATBOT_RULE,
  DELETE_WHATSAPP_CHATBOT_RULE,
  GET_WHATSAPP_CHATBOT_RULES,
  UPDATE_WHATSAPP_CHATBOT_RULE,
} from '../../graphql/queries/whatsapp-session';

type Trigger = 'keyword' | 'regex' | 'first_message' | 'out_of_hours';

interface Rule {
  id: string;
  name: string;
  trigger: Trigger;
  pattern: string | null;
  responseBody: string;
  priority: number;
  enabled: boolean;
  applyTags: string[];
  businessHoursOnly: boolean;
  businessHoursStart: string | null;
  businessHoursEnd: string | null;
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
}

const triggerLabels: Record<Trigger, string> = {
  keyword: 'Palavra-chave',
  regex: 'Regex',
  first_message: 'Primeira mensagem',
  out_of_hours: 'Fora do horário',
};

const triggerDescriptions: Record<Trigger, string> = {
  keyword: 'Dispara quando a mensagem contém um termo (case-insensitive).',
  regex: 'Dispara quando a mensagem casa com a expressão regular.',
  first_message: 'Dispara apenas na primeira mensagem do contato.',
  out_of_hours: 'Dispara quando a mensagem chega fora do horário comercial.',
};

interface FormState {
  id: string | null;
  name: string;
  trigger: Trigger;
  pattern: string;
  responseBody: string;
  priority: number;
  enabled: boolean;
  applyTagsRaw: string;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  cooldownMinutes: number;
}

const blankForm: FormState = {
  id: null,
  name: '',
  trigger: 'keyword',
  pattern: '',
  responseBody: '',
  priority: 100,
  enabled: true,
  applyTagsRaw: '',
  businessHoursOnly: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  cooldownMinutes: 60,
};

function ruleToForm(r: Rule): FormState {
  return {
    id: r.id,
    name: r.name,
    trigger: r.trigger,
    pattern: r.pattern ?? '',
    responseBody: r.responseBody,
    priority: r.priority,
    enabled: r.enabled,
    applyTagsRaw: r.applyTags.join(', '),
    businessHoursOnly: r.businessHoursOnly,
    businessHoursStart: r.businessHoursStart ?? '09:00',
    businessHoursEnd: r.businessHoursEnd ?? '18:00',
    cooldownMinutes: r.cooldownMinutes,
  };
}

function RuleCard({
  rule,
  onEdit,
  onToggle,
  onDelete,
}: {
  rule: Rule;
  onEdit: (r: Rule) => void;
  onToggle: (r: Rule) => void;
  onDelete: (r: Rule) => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        rule.enabled
          ? 'bg-white border-slate-200'
          : 'bg-slate-50 border-slate-200 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 truncate">
              {rule.name}
            </h3>
            <span
              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                rule.trigger === 'keyword'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : rule.trigger === 'regex'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : rule.trigger === 'first_message'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {triggerLabels[rule.trigger]}
            </span>
            {rule.businessHoursOnly && (
              <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {rule.businessHoursStart}–{rule.businessHoursEnd}
              </span>
            )}
            <span className="text-[10px] text-slate-500">
              prioridade {rule.priority}
            </span>
          </div>
          {rule.pattern && (
            <code className="block text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 mt-2 truncate">
              {rule.pattern}
            </code>
          )}
          <p className="text-sm text-slate-700 mt-2 line-clamp-2">
            ↳ {rule.responseBody}
          </p>
          {rule.applyTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {rule.applyTags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onToggle(rule)}
            title={rule.enabled ? 'Desativar' : 'Ativar'}
            className={`p-1.5 rounded transition-colors ${
              rule.enabled
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(rule)}
            title="Editar"
            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(rule)}
            title="Apagar"
            className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhatsappChatbotPage() {
  const { data, loading, refetch } = useQuery<{ whatsappChatbotRules: Rule[] }>(
    GET_WHATSAPP_CHATBOT_RULES,
    { fetchPolicy: 'cache-and-network' },
  );
  const [createMut, { loading: creating }] = useMutation(
    CREATE_WHATSAPP_CHATBOT_RULE,
  );
  const [updateMut, { loading: updating }] = useMutation(
    UPDATE_WHATSAPP_CHATBOT_RULE,
  );
  const [deleteMut] = useMutation(DELETE_WHATSAPP_CHATBOT_RULE);

  const [form, setForm] = useState<FormState | null>(null);

  const rules = data?.whatsappChatbotRules ?? [];
  const stats = useMemo(
    () => ({
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
      keyword: rules.filter((r) => r.trigger === 'keyword').length,
      first: rules.filter((r) => r.trigger === 'first_message').length,
    }),
    [rules],
  );

  const submit = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.responseBody.trim()) {
      alert('Nome e resposta são obrigatórios.');
      return;
    }
    if (
      (form.trigger === 'keyword' || form.trigger === 'regex') &&
      !form.pattern.trim()
    ) {
      alert('Pattern obrigatório para triggers keyword/regex.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      trigger: form.trigger,
      pattern: form.pattern.trim() || null,
      responseBody: form.responseBody,
      priority: form.priority,
      enabled: form.enabled,
      applyTags: form.applyTagsRaw
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
      businessHoursOnly: form.businessHoursOnly,
      businessHoursStart: form.businessHoursOnly
        ? form.businessHoursStart
        : null,
      businessHoursEnd: form.businessHoursOnly
        ? form.businessHoursEnd
        : null,
      cooldownMinutes: form.cooldownMinutes,
    };
    try {
      if (form.id) {
        await updateMut({ variables: { id: form.id, patch: payload } });
      } else {
        await createMut({ variables: { input: payload } });
      }
      setForm(null);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const toggleRule = async (r: Rule) => {
    await updateMut({
      variables: { id: r.id, patch: { enabled: !r.enabled } },
    });
    await refetch();
  };

  const deleteRule = async (r: Rule) => {
    if (!window.confirm(`Apagar a regra "${r.name}"?`)) return;
    await deleteMut({ variables: { id: r.id } });
    await refetch();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">
            Chatbot WhatsApp
          </h1>
          <p className="text-sm text-slate-500">
            Configure auto-respostas, mensagens de boas-vindas e ações fora do
            horário comercial.
          </p>
        </div>
        <button
          onClick={() => setForm(blankForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova regra
        </button>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-4 gap-3 bg-white border-b border-slate-200">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Total
          </div>
          <div className="text-xl font-bold text-slate-800">{stats.total}</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <div className="text-[10px] uppercase tracking-wide text-emerald-600">
            Ativas
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {stats.enabled}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-[10px] uppercase tracking-wide text-blue-600">
            Por palavra-chave
          </div>
          <div className="text-xl font-bold text-blue-700">
            {stats.keyword}
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="text-[10px] uppercase tracking-wide text-amber-600">
            Boas-vindas
          </div>
          <div className="text-xl font-bold text-amber-700">{stats.first}</div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-3">
        {loading && rules.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando regras…
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Sparkles className="w-12 h-12 mx-auto opacity-30 mb-3 text-slate-400" />
            <p className="text-sm text-slate-600 mb-1">
              Nenhuma regra criada ainda.
            </p>
            <p className="text-xs text-slate-500">
              Comece com uma mensagem de boas-vindas pra novos contatos.
            </p>
            <button
              onClick={() => setForm(blankForm)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Criar primeira regra
            </button>
          </div>
        ) : (
          rules.map((r) => (
            <RuleCard
              key={r.id}
              rule={r}
              onEdit={(rr) => setForm(ruleToForm(rr))}
              onToggle={toggleRule}
              onDelete={deleteRule}
            />
          ))
        )}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-600" />
                {form.id ? 'Editar regra' : 'Nova regra'}
              </h3>
              <button
                onClick={() => setForm(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Nome interno
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Boas-vindas / Cardápio / Fora do expediente"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Quando disparar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(triggerLabels) as Trigger[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, trigger: t })}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                        form.trigger === t
                          ? 'bg-brand-50 border-brand-500 text-brand-800'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{triggerLabels[t]}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {triggerDescriptions[t]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {(form.trigger === 'keyword' || form.trigger === 'regex') && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    {form.trigger === 'regex' ? 'Regex' : 'Palavra-chave'}
                  </label>
                  <input
                    value={form.pattern}
                    onChange={(e) =>
                      setForm({ ...form, pattern: e.target.value })
                    }
                    placeholder={
                      form.trigger === 'regex' ? '^(oi|olá|bom dia)' : 'cardápio'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Resposta automática
                </label>
                <textarea
                  value={form.responseBody}
                  onChange={(e) =>
                    setForm({ ...form, responseBody: e.target.value })
                  }
                  rows={4}
                  placeholder="Olá! 👋 Estamos disponíveis das 9h às 18h. Em breve um atendente responderá!"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Formatação WhatsApp: *negrito*, _itálico_, ~tachado~, ```mono```
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Tags aplicadas (opcional, separadas por vírgula)
                </label>
                <input
                  value={form.applyTagsRaw}
                  onChange={(e) =>
                    setForm({ ...form, applyTagsRaw: e.target.value })
                  }
                  placeholder="lead, novo-cliente, aguardando-cardapio"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Prioridade (menor = primeiro)
                  </label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Cooldown (minutos)
                  </label>
                  <input
                    type="number"
                    value={form.cooldownMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cooldownMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.businessHoursOnly}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        businessHoursOnly: e.target.checked,
                      })
                    }
                  />
                  Aplicar apenas no horário comercial
                </label>
                {form.businessHoursOnly && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="time"
                      value={form.businessHoursStart}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          businessHoursStart: e.target.value,
                        })
                      }
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      value={form.businessHoursEnd}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          businessHoursEnd: e.target.value,
                        })
                      }
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  Para o trigger "Fora do horário", a regra dispara{' '}
                  <strong>fora</strong> da janela definida.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) =>
                      setForm({ ...form, enabled: e.target.checked })
                    }
                  />
                  Regra ativada
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setForm(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={creating || updating}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm font-medium"
              >
                {creating || updating ? 'Salvando…' : 'Salvar regra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
