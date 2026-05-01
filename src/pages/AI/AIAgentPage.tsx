import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    Bot,
    Camera,
    Check,
    Clock,
    Globe,
    Languages,
    Loader2,
    MessageSquare,
    Power,
    RotateCcw,
    Save,
    Sparkles,
    Thermometer,
    Users,
    Zap,
} from 'lucide-react';
import { useAIAgent } from '../../contexts/AIAgentContext';
import { uploadProductImage, UploadError, validateImage } from '../../lib/r2-upload';

const TONES = [
    { value: 'amigavel', label: 'Amigável 😊', desc: 'Caloroso, próximo, conversa fluida' },
    { value: 'profissional', label: 'Profissional 💼', desc: 'Educado, conciso, objetivo' },
    { value: 'formal', label: 'Formal 🎩', desc: 'Tratamento "senhor/senhora", reverência' },
    { value: 'casual', label: 'Casual 🤙', desc: 'Descontraído, gírias, emojis' },
] as const;

const MODELS = [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', tag: 'Rápido', enabled: true },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', tag: 'Em breve', enabled: false },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini', tag: 'Em breve', enabled: false },
    { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', tag: 'Em breve', enabled: false },
];

const LANGUAGES = [
    { value: 'pt-BR', label: 'Português (BR) 🇧🇷' },
    { value: 'en-US', label: 'English (US) 🇺🇸' },
    { value: 'es-ES', label: 'Español 🇪🇸' },
];

export function AIAgentPage() {
    const { config, updateConfig, resetConfig } = useAIAgent();
    const [draft, setDraft] = useState(config);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const dirty = JSON.stringify(draft) !== JSON.stringify(config);

    function update<K extends keyof typeof draft>(key: K, value: typeof draft[K]) {
        setDraft((p) => ({ ...p, [key]: value }));
    }

    async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            validateImage(file);
        } catch (err) {
            toast.error(err instanceof UploadError ? err.message : 'Imagem inválida.');
            e.target.value = '';
            return;
        }
        setUploading(true);
        try {
            const asset = await uploadProductImage(file, 'ai-agents');
            setDraft((p) => ({ ...p, avatarUrl: asset.url }));
            toast.success('Foto carregada.');
        } catch (err) {
            toast.error(err instanceof UploadError ? err.message : 'Erro ao subir foto.');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    }

    function handleSave() {
        if (!draft.name.trim()) {
            toast.error('O agente precisa de um nome.');
            return;
        }
        updateConfig(draft);
        toast.success(`Configuração de "${draft.name}" salva.`);
    }

    function handleReset() {
        if (!window.confirm('Restaurar configuração padrão?')) return;
        resetConfig();
        setDraft({ ...config });
        toast.success('Configuração restaurada.');
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center shadow-sm shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                    </span>
                    <div>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            Agente de IA
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded">
                                Beta · simulado
                            </span>
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Configure a personalidade, modelo, integrações e comportamento do seu agente
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrão
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty}
                        className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm disabled:opacity-50"
                    >
                        <Save className="w-3.5 h-3.5" /> {dirty ? 'Salvar alterações' : 'Salvo'}
                    </button>
                </div>
            </div>

            {/* Toggle global on/off */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5 flex items-center gap-4">
                <span className={`w-10 h-10 rounded-full grid place-items-center ${draft.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04]'}`}>
                    <Power className="w-4 h-4" />
                </span>
                <div className="flex-1">
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white">
                        Agente {draft.enabled ? 'ativo' : 'desativado'}
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        {draft.enabled
                            ? 'Está respondendo automaticamente nas integrações habilitadas'
                            : 'Mensagens recebidas vão direto para a fila humana'}
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={draft.enabled}
                        onChange={(e) => update('enabled', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-checked:bg-emerald-500 rounded-full transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-6" />
                </label>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Identidade */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Identidade</h2>
                    </header>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white ring-2 ring-slate-200 dark:ring-white/10">
                                    <img src={draft.avatarUrl} alt="" className="w-full h-full object-contain" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 text-white grid place-items-center shadow ring-2 ring-white dark:ring-slate-900"
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <Field label="Nome do agente">
                                    <input
                                        value={draft.name}
                                        onChange={(e) => update('name', e.target.value)}
                                        placeholder="Ex: Sofia, Carlos, Atena…"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] font-semibold"
                                    />
                                </Field>
                                <Field label="Cargo / função">
                                    <input
                                        value={draft.role}
                                        onChange={(e) => update('role', e.target.value)}
                                        placeholder="Ex: Atendente virtual"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                </Field>
                            </div>
                        </div>
                        <Field label="Mensagem de boas-vindas">
                            <textarea
                                value={draft.welcomeMessage}
                                onChange={(e) => update('welcomeMessage', e.target.value)}
                                rows={3}
                                placeholder="Primeira mensagem que o cliente recebe…"
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                            />
                        </Field>
                        <Field label="Personalidade (em poucas palavras)">
                            <input
                                value={draft.personality}
                                onChange={(e) => update('personality', e.target.value)}
                                placeholder="Ex: Calma, paciente, gosta de exemplos"
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                            />
                        </Field>
                    </div>
                </section>

                {/* Modelo + Tom + Idioma */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                        <Bot className="w-4 h-4 text-violet-500" />
                        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Modelo &amp; comportamento</h2>
                    </header>
                    <div className="p-5 space-y-4">
                        <Field label="Modelo de IA">
                            <select
                                value={draft.model}
                                onChange={(e) => update('model', e.target.value)}
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                            >
                                {MODELS.map((m) => (
                                    <option key={m.value} value={m.value} disabled={!m.enabled}>
                                        {m.label} — {m.tag}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Tom de voz">
                            <div className="grid grid-cols-2 gap-1.5">
                                {TONES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => update('tone', t.value)}
                                        className={`text-left px-3 py-2 rounded border transition-colors ${
                                            draft.tone === t.value
                                                ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-400 dark:border-violet-500/40'
                                                : 'border-slate-200 dark:border-white/10 hover:border-violet-300'
                                        }`}
                                    >
                                        <p className="text-[12px] font-semibold text-slate-900 dark:text-white">{t.label}</p>
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">{t.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Field label="Idioma" icon={<Languages className="w-3 h-3" />}>
                            <select
                                value={draft.language}
                                onChange={(e) => update('language', e.target.value as any)}
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                            >
                                {LANGUAGES.map((l) => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field
                                label={
                                    <span className="flex items-center gap-1">
                                        <Thermometer className="w-3 h-3" /> Temperatura
                                        <span className="ml-auto font-mono text-violet-700 dark:text-violet-400">{draft.temperature.toFixed(2)}</span>
                                    </span>
                                }
                            >
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={draft.temperature}
                                    onChange={(e) => update('temperature', Number(e.target.value))}
                                    className="w-full accent-violet-600"
                                />
                            </Field>
                            <Field
                                label={
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> Máx. tokens
                                        <span className="ml-auto font-mono text-violet-700 dark:text-violet-400">{draft.maxTokens}</span>
                                    </span>
                                }
                            >
                                <input
                                    type="range"
                                    min={64}
                                    max={2048}
                                    step={64}
                                    value={draft.maxTokens}
                                    onChange={(e) => update('maxTokens', Number(e.target.value))}
                                    className="w-full accent-violet-600"
                                />
                            </Field>
                        </div>
                    </div>
                </section>

                {/* Horário de atendimento */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-500" />
                        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Horário de atendimento</h2>
                    </header>
                    <div className="p-5 space-y-4">
                        <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={draft.workingHours.enabled}
                                onChange={(e) =>
                                    update('workingHours', { ...draft.workingHours, enabled: e.target.checked })
                                }
                                className="w-4 h-4 accent-violet-600"
                            />
                            Restringir a um horário específico
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Início">
                                <input
                                    type="time"
                                    value={draft.workingHours.start}
                                    disabled={!draft.workingHours.enabled}
                                    onChange={(e) =>
                                        update('workingHours', { ...draft.workingHours, start: e.target.value })
                                    }
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] disabled:opacity-50"
                                />
                            </Field>
                            <Field label="Fim">
                                <input
                                    type="time"
                                    value={draft.workingHours.end}
                                    disabled={!draft.workingHours.enabled}
                                    onChange={(e) =>
                                        update('workingHours', { ...draft.workingHours, end: e.target.value })
                                    }
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] disabled:opacity-50"
                                />
                            </Field>
                        </div>
                        <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={draft.workingHours.weekendsOff}
                                disabled={!draft.workingHours.enabled}
                                onChange={(e) =>
                                    update('workingHours', { ...draft.workingHours, weekendsOff: e.target.checked })
                                }
                                className="w-4 h-4 accent-violet-600 disabled:opacity-50"
                            />
                            Não responder aos fins de semana
                        </label>
                    </div>
                </section>

                {/* Integrações */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-violet-500" />
                        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Canais de atendimento</h2>
                    </header>
                    <div className="p-5 space-y-2">
                        {[
                            { key: 'whatsapp', label: 'WhatsApp Business', icon: '💬' },
                            { key: 'instagram', label: 'Instagram Direct', icon: '📷' },
                            { key: 'site', label: 'Widget no site', icon: '🌐' },
                            { key: 'email', label: 'E-mail', icon: '✉️' },
                        ].map((ch) => (
                            <label
                                key={ch.key}
                                className="flex items-center gap-3 p-2.5 border border-slate-200 dark:border-white/10 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                            >
                                <span className="text-xl">{ch.icon}</span>
                                <span className="flex-1 text-[13px] font-medium text-slate-900 dark:text-white">{ch.label}</span>
                                <input
                                    type="checkbox"
                                    checked={(draft.integrations as any)[ch.key]}
                                    onChange={(e) =>
                                        update('integrations', { ...draft.integrations, [ch.key]: e.target.checked })
                                    }
                                    className="w-4 h-4 accent-violet-600"
                                />
                            </label>
                        ))}
                        <label className="flex items-center gap-3 p-2.5 border border-dashed border-slate-200 dark:border-white/10 rounded cursor-pointer mt-3">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="flex-1 text-[12.5px] text-slate-700 dark:text-slate-200">
                                Encaminhar para humano quando IA não souber responder
                            </span>
                            <input
                                type="checkbox"
                                checked={draft.handoffToHuman}
                                onChange={(e) => update('handoffToHuman', e.target.checked)}
                                className="w-4 h-4 accent-violet-600"
                            />
                        </label>
                    </div>
                </section>
            </div>

            {/* Base de conhecimento */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-500" />
                    <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Base de conhecimento</h2>
                </header>
                <div className="p-5">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2">
                        Cole informações importantes sobre sua empresa, produtos, políticas, perguntas frequentes — o agente vai usar isso pra responder com precisão.
                    </p>
                    <textarea
                        value={draft.knowledgeBase}
                        onChange={(e) => update('knowledgeBase', e.target.value)}
                        rows={8}
                        placeholder={`Ex:\nNosso horário é seg-sex 8h-18h.\nFazemos entrega em Araguaína e região (taxa R$ 10).\nFormas de pagamento: PIX (5% off), cartão até 6x, boleto.\n…`}
                        className="w-full p-3 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] font-mono resize-none"
                    />
                    <p className="mt-2 text-[11px] text-slate-400 tabular-nums">{draft.knowledgeBase.length} caracteres</p>
                </div>
            </section>

            {/* Widget config */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5 flex items-center gap-4">
                <img
                    src={draft.avatarUrl}
                    alt=""
                    className="w-12 h-12 rounded-full ring-2 ring-violet-200 dark:ring-violet-500/30"
                />
                <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Widget flutuante</p>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                        Mostrar o ícone do agente no canto inferior direito de todas as páginas
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={draft.showWidget}
                        onChange={(e) => update('showWidget', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-checked:bg-violet-500 rounded-full transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-6" />
                </label>
            </section>

            {/* Aviso simulação */}
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[12px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                    <strong>Modo simulação:</strong> as configurações são salvas no seu navegador. A integração real com o Gemini e os canais será habilitada na próxima etapa.
                </span>
            </div>
        </div>
    );
}

function Field({ label, icon, children }: { label: React.ReactNode; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {icon}
                {label}
            </label>
            {children}
        </div>
    );
}
