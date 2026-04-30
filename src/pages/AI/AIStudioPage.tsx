import { useEffect, useRef, useState } from 'react';
import {
    Bot,
    CheckCheck,
    ChevronDown,
    Copy,
    Loader2,
    Mic,
    Paperclip,
    Phone,
    Plus,
    RotateCcw,
    Save,
    Send,
    Settings,
    Signal,
    Sparkles,
    Thermometer,
    Trash2,
    Video,
    Wifi,
    Zap,
} from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    status?: 'sent' | 'delivered' | 'read';
}

interface ModelOption {
    id: string;
    name: string;
    provider: string;
    badge: string;
    badgeTone: string;
    description: string;
    available: boolean;
}

const MODELS: ModelOption[] = [
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'Google',
        badge: 'Rápido',
        badgeTone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
        description: 'Modelo multimodal otimizado para latência baixa. Ideal para atendimento via WhatsApp.',
        available: true,
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        badge: 'Em breve',
        badgeTone: 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-500 border-slate-200 dark:border-white/[0.06]',
        description: 'Mais capacidade, maior contexto. Não disponível ainda.',
        available: false,
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o mini',
        provider: 'OpenAI',
        badge: 'Em breve',
        badgeTone: 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-500 border-slate-200 dark:border-white/[0.06]',
        description: 'Não disponível ainda.',
        available: false,
    },
    {
        id: 'claude-haiku-4.5',
        name: 'Claude Haiku 4.5',
        provider: 'Anthropic',
        badge: 'Em breve',
        badgeTone: 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-500 border-slate-200 dark:border-white/[0.06]',
        description: 'Não disponível ainda.',
        available: false,
    },
];

const PRESET_PROMPTS: { label: string; prompt: string }[] = [
    {
        label: 'Atendente de loja',
        prompt:
            'Você é um atendente cordial e objetivo de uma loja. Responda dúvidas sobre produtos, formas de pagamento, prazos de entrega e estoque. Use sempre português do Brasil, frases curtas e tom amigável.',
    },
    {
        label: 'SDR de vendas',
        prompt:
            'Você é um SDR (pré-venda). Faça perguntas qualificadoras (BANT), descubra necessidade do cliente e ofereça o produto certo. Encerre sempre com call-to-action.',
    },
    {
        label: 'Cobrança educada',
        prompt:
            'Você é um agente de cobrança. Tom profissional, sem agressividade. Lembre o cliente do vencimento, ofereça opções de pagamento (PIX/boleto) e marque um compromisso.',
    },
    {
        label: 'Suporte técnico',
        prompt:
            'Você é um analista de suporte. Solicite informações claras (modelo, sistema, mensagem de erro) antes de propor solução. Use checklists numeradas.',
    },
];

function nowTimeBR() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function generateMockReply(userMsg: string, model: string, sysPrompt: string, temperature: number): string {
    const persona = sysPrompt.match(/atendente|sdr|cobran|suporte/i)?.[0]?.toLowerCase() ?? 'assistente';
    const intro =
        temperature > 0.8
            ? 'Eba! 👋 Que legal ter você por aqui!'
            : temperature > 0.4
              ? 'Olá! Tudo bem?'
              : 'Olá. Recebi sua mensagem.';

    const lower = userMsg.toLowerCase();
    if (lower.includes('preço') || lower.includes('quanto') || lower.includes('valor')) {
        return `${intro} Posso te passar valores agora mesmo. Para qual produto exatamente você gostaria de saber? Se quiser, me manda o nome ou código.`;
    }
    if (lower.includes('entrega') || lower.includes('prazo') || lower.includes('frete')) {
        return `${intro} A entrega depende do CEP. Se você puder me informar, eu já te dou o prazo estimado e o valor do frete.`;
    }
    if (lower.includes('estoque') || lower.includes('disponível') || lower.includes('tem')) {
        return `${intro} Vou verificar o estoque pra você. Pode me dizer o nome ou SKU do produto?`;
    }
    if (lower.includes('pagamento') || lower.includes('pix') || lower.includes('cartão')) {
        return `${intro} Aceitamos PIX (com 5% de desconto), cartão de crédito em até 12x e boleto. Qual prefere?`;
    }
    if (lower.includes('oi') || lower.includes('olá') || lower.includes('bom dia') || lower.includes('boa tarde') || lower.includes('boa noite')) {
        return `${intro} Como posso ajudar você hoje?`;
    }
    return `${intro} Entendi sua mensagem ("${userMsg.slice(0, 40)}${userMsg.length > 40 ? '…' : ''}"). Como ${persona}, vou te ajudar com isso. Me dá só mais um detalhe pra eu responder com precisão?`;
}

export function AIStudioPage() {
    const [model, setModel] = useState(MODELS[0].id);
    const [systemPrompt, setSystemPrompt] = useState(PRESET_PROMPTS[0].prompt);
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(512);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'intro',
            role: 'assistant',
            content: 'Olá! Sou a assistente da loja. Em que posso ajudar?',
            timestamp: new Date(Date.now() - 60000),
            status: 'read',
        },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [contactName, setContactName] = useState('Cliente teste');
    const [contactPhone, setContactPhone] = useState('+55 11 99999-9999');
    const [showModelMenu, setShowModelMenu] = useState(false);

    const phoneScrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (phoneScrollRef.current) {
            phoneScrollRef.current.scrollTop = phoneScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const selectedModel = MODELS.find((m) => m.id === model) ?? MODELS[0];

    async function send() {
        if (!input.trim() || sending) return;
        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
            status: 'sent',
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSending(true);

        // Atualiza status do user pra "delivered" depois "read"
        setTimeout(() => {
            setMessages((prev) =>
                prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'delivered' } : m)),
            );
        }, 350);
        setTimeout(() => {
            setMessages((prev) =>
                prev.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' } : m)),
            );
        }, 800);

        // Gera resposta mock após delay simulando latência do modelo
        const latency = 700 + Math.random() * 800;
        setTimeout(() => {
            const reply: ChatMessage = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: generateMockReply(userMsg.content, model, systemPrompt, temperature),
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, reply]);
            setSending(false);
        }, latency);
    }

    function reset() {
        setMessages([
            {
                id: 'intro',
                role: 'assistant',
                content: 'Olá! Sou a assistente da loja. Em que posso ajudar?',
                timestamp: new Date(),
                status: 'read',
            },
        ]);
        setInput('');
    }

    function applyPreset(p: typeof PRESET_PROMPTS[number]) {
        setSystemPrompt(p.prompt);
        reset();
    }

    return (
        <div className="space-y-6 w-full">
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center shadow-sm shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </span>
                    <div>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            IA Studio
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded">
                                Beta · simulado
                            </span>
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Configure persona, escolha modelo e teste no preview de WhatsApp antes de conectar à API real
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        disabled
                        title="Disponível quando integrarmos com a API do Gemini"
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-500 border border-slate-200 dark:border-white/10 rounded-md disabled:cursor-not-allowed"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Publicar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* COLUNA ESQUERDA — Configuração */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Seletor de modelo */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                            <Bot className="w-4 h-4 text-violet-500" />
                            <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Modelo</h2>
                        </div>
                        <div className="p-3">
                            <button
                                onClick={() => setShowModelMenu((v) => !v)}
                                className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200 dark:border-white/15 hover:border-violet-400 transition-colors"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white text-[10px] font-bold">
                                        {selectedModel.provider.slice(0, 2).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 text-left">
                                        <p className="text-[12.5px] font-semibold text-slate-900 dark:text-white truncate">
                                            {selectedModel.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {selectedModel.provider}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
                            </button>
                            {showModelMenu && (
                                <div className="mt-2 border border-slate-200 dark:border-white/10 rounded-md overflow-hidden">
                                    {MODELS.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                if (m.available) {
                                                    setModel(m.id);
                                                    setShowModelMenu(false);
                                                }
                                            }}
                                            disabled={!m.available}
                                            className={`w-full px-3 py-2.5 text-left flex items-start gap-2.5 border-b border-slate-100 dark:border-white/[0.04] last:border-0 transition-colors ${
                                                m.available
                                                    ? 'hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer'
                                                    : 'opacity-60 cursor-not-allowed'
                                            } ${m.id === model ? 'bg-violet-50/60 dark:bg-violet-500/10' : ''}`}
                                        >
                                            <span className="w-7 h-7 rounded bg-slate-100 dark:bg-white/[0.06] grid place-items-center text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                                                {m.provider.slice(0, 2).toUpperCase()}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className="text-[12.5px] font-semibold text-slate-900 dark:text-white truncate">{m.name}</p>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${m.badgeTone}`}>
                                                        {m.badge}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                                    {m.description}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="mt-2 text-[10.5px] text-slate-400 dark:text-slate-500">
                                Modelos marcados como “Em breve” serão habilitados quando a integração com cada provedor for ativada.
                            </p>
                        </div>
                    </section>

                    {/* Persona / system prompt */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-violet-500" />
                                <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Persona</h2>
                            </div>
                            <span className="text-[11px] text-slate-400 tabular-nums">{systemPrompt.length} chars</span>
                        </div>
                        <div className="p-3 space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_PROMPTS.map((p) => (
                                    <button
                                        key={p.label}
                                        onClick={() => applyPreset(p)}
                                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:text-violet-700 transition-colors"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                rows={6}
                                placeholder="Você é um assistente útil…"
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[12.5px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </section>

                    {/* Parâmetros */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-violet-500" />
                            <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Parâmetros</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Thermometer className="w-3 h-3" /> Temperatura
                                    </label>
                                    <span className="text-[11.5px] font-mono tabular-nums text-violet-700 dark:text-violet-400">
                                        {temperature.toFixed(2)}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={temperature}
                                    onChange={(e) => setTemperature(Number(e.target.value))}
                                    className="w-full accent-violet-600"
                                />
                                <p className="text-[10.5px] text-slate-400 mt-1">
                                    Valores baixos = respostas mais previsíveis. Altos = mais criativos.
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300">
                                        Máx. tokens
                                    </label>
                                    <span className="text-[11.5px] font-mono tabular-nums text-violet-700 dark:text-violet-400">
                                        {maxTokens}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={64}
                                    max={2048}
                                    step={64}
                                    value={maxTokens}
                                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                                    className="w-full accent-violet-600"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* COLUNA DIREITA — Preview do telefone */}
                <div className="lg:col-span-8">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 lg:p-10 flex items-center justify-center">
                        {/* Telefone */}
                        <div className="relative w-full max-w-[360px] aspect-[9/19] bg-black rounded-[2.5rem] p-2.5 shadow-2xl">
                            {/* Notch */}
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                                <span className="w-12 h-1.5 bg-slate-700 rounded-full" />
                            </div>
                            <div className="w-full h-full bg-[#075E54] rounded-[2rem] overflow-hidden flex flex-col">
                                {/* Status bar */}
                                <div className="h-7 px-5 flex items-center justify-between text-white text-[10px] font-semibold tabular-nums shrink-0">
                                    <span>{nowTimeBR()}</span>
                                    <div className="flex items-center gap-1">
                                        <Signal className="w-2.5 h-2.5" />
                                        <Wifi className="w-2.5 h-2.5" />
                                        <span className="ml-1">76%</span>
                                    </div>
                                </div>

                                {/* Topo do chat */}
                                <div className="h-14 px-3 flex items-center gap-2.5 bg-[#075E54] text-white shrink-0 border-b border-black/20">
                                    <button className="w-7 h-7 grid place-items-center" aria-label="Voltar">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                                    </button>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white font-semibold text-[12px] shrink-0">
                                        IA
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold truncate leading-tight">
                                            {contactName}
                                        </p>
                                        <p className="text-[10.5px] text-emerald-300 leading-tight flex items-center gap-1">
                                            {sending ? 'digitando…' : 'online'}
                                        </p>
                                    </div>
                                    <button className="w-7 h-7 grid place-items-center" aria-label="Vídeo"><Video className="w-4 h-4" /></button>
                                    <button className="w-7 h-7 grid place-items-center" aria-label="Ligar"><Phone className="w-4 h-4" /></button>
                                </div>

                                {/* Mensagens */}
                                <div
                                    ref={phoneScrollRef}
                                    className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#ECE5DD]"
                                    style={{
                                        backgroundImage:
                                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23d4cab8' fill-opacity='0.25'%3E%3Cpath d='M0 0h40v40H0zM40 40h40v40H40z'/%3E%3C/g%3E%3C/svg%3E\")",
                                    }}
                                >
                                    {messages.map((m) => {
                                        const isUser = m.role === 'user';
                                        return (
                                            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[78%] rounded-lg px-2.5 py-1.5 shadow-sm relative ${
                                                        isUser ? 'bg-[#DCF8C6] text-slate-900' : 'bg-white text-slate-900'
                                                    }`}
                                                >
                                                    <p className="text-[12.5px] leading-snug whitespace-pre-wrap break-words">
                                                        {m.content}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                                        <span className="text-[9.5px] text-slate-500 tabular-nums">
                                                            {m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isUser && m.status && (
                                                            <CheckCheck
                                                                className={`w-3 h-3 ${m.status === 'read' ? 'text-sky-500' : 'text-slate-500'}`}
                                                                strokeWidth={2.2}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {sending && (
                                        <div className="flex justify-start">
                                            <div className="bg-white text-slate-900 rounded-lg px-3 py-2 shadow-sm flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input do chat */}
                                <div className="bg-[#F0F0F0] px-2 py-2 flex items-center gap-1.5 shrink-0">
                                    <button className="w-8 h-8 grid place-items-center text-slate-500" aria-label="Plus"><Plus className="w-5 h-5" /></button>
                                    <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    send();
                                                }
                                            }}
                                            placeholder="Digite uma mensagem"
                                            disabled={sending}
                                            className="flex-1 bg-transparent text-[12.5px] text-slate-900 placeholder:text-slate-400 outline-none disabled:opacity-50"
                                        />
                                        <button className="text-slate-500 shrink-0" aria-label="Anexar"><Paperclip className="w-4 h-4" /></button>
                                    </div>
                                    {input.trim() ? (
                                        <button
                                            onClick={send}
                                            disabled={sending}
                                            className="w-9 h-9 rounded-full bg-[#075E54] text-white grid place-items-center disabled:opacity-50"
                                            aria-label="Enviar"
                                        >
                                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    ) : (
                                        <button className="w-9 h-9 rounded-full bg-[#075E54] text-white grid place-items-center" aria-label="Áudio">
                                            <Mic className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Painel inferior: contato + ações */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Contato (preview)
                                </label>
                                <input
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[12.5px]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Telefone (preview)
                                </label>
                                <input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[12.5px] tabular-nums"
                                />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex flex-col gap-2">
                            <button
                                onClick={reset}
                                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded text-[12px] font-medium border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar conversa
                            </button>
                            <button
                                onClick={() => {
                                    const txt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
                                    navigator.clipboard.writeText(txt);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded text-[12px] font-medium border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copiar transcrição
                            </button>
                            <button
                                onClick={() => setMessages([])}
                                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
                            </button>
                        </div>
                    </div>

                    {/* Aviso de mock */}
                    <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[12px] text-amber-800 dark:text-amber-300">
                        <strong>Modo simulação:</strong> as respostas são geradas localmente para teste do fluxo (modelo selecionado: <span className="font-mono">{selectedModel.name}</span>). A integração real com a API do Gemini será habilitada na próxima etapa.
                    </div>
                </div>
            </div>
        </div>
    );
}
