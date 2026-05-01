import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X } from 'lucide-react';
import { useAIAgent } from '../contexts/AIAgentContext';

interface ChatMsg {
    id: string;
    role: 'user' | 'agent';
    text: string;
    at: Date;
}

function generateMockReply(input: string, agentName: string, tone: string): string {
    const lower = input.toLowerCase();
    const hi = tone === 'formal' ? 'Olá!' : tone === 'casual' ? 'Eai!' : 'Oi!';
    if (lower.includes('preço') || lower.includes('valor') || lower.includes('quanto'))
        return `${hi} Posso te ajudar com valores. Qual produto você gostaria de saber?`;
    if (lower.includes('entrega') || lower.includes('frete'))
        return `${hi} A taxa de entrega depende da distância. Me passa seu CEP que calculo aqui pra você.`;
    if (lower.includes('horário') || lower.includes('aberto'))
        return `${hi} Estamos abertos de seg a sex, das 8h às 18h. E aos sábados pela manhã!`;
    if (lower.includes('pagamento') || lower.includes('pix') || lower.includes('cartão'))
        return `${hi} Aceitamos PIX (com 5% off), cartão até 6x e boleto. Qual você prefere?`;
    if (lower.match(/\b(oi|olá|ola|bom dia|boa tarde|boa noite)\b/))
        return `${hi} Eu sou ${agentName}. Como posso te ajudar hoje?`;
    return `${hi} Recebi sua mensagem. Posso te ajudar com pedidos, produtos, entregas e formas de pagamento. O que você precisa?`;
}

export function AIAgentWidget() {
    const { config } = useAIAgent();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [typing, setTyping] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Inicializa com mensagem de boas-vindas quando abre pela primeira vez
    useEffect(() => {
        if (open && !hasGreeted && config.welcomeMessage) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'agent',
                    text: config.welcomeMessage,
                    at: new Date(),
                },
            ]);
            setHasGreeted(true);
        }
    }, [open, hasGreeted, config.welcomeMessage]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typing]);

    // Não mostra na tela de impressão nem no login
    const hideRoutes = ['/', '/login'];
    const isPrint = /\/imprimir(\/|$)/.test(location.pathname);
    if (isPrint || hideRoutes.includes(location.pathname)) return null;
    if (!config.showWidget) return null;

    function send() {
        if (!input.trim()) return;
        const userMsg: ChatMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            text: input.trim(),
            at: new Date(),
        };
        setMessages((p) => [...p, userMsg]);
        const text = input.trim();
        setInput('');
        setTyping(true);
        setTimeout(() => {
            setMessages((p) => [
                ...p,
                {
                    id: `a-${Date.now()}`,
                    role: 'agent',
                    text: generateMockReply(text, config.name, config.tone),
                    at: new Date(),
                },
            ]);
            setTyping(false);
        }, 700 + Math.random() * 600);
    }

    return (
        <>
            <style>{`
                @keyframes ai-blink {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.55), 0 0 0 0 rgba(139, 92, 246, 0); }
                    50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0), 0 8px 24px -4px rgba(139, 92, 246, 0.4); }
                }
                @keyframes ai-pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.8; }
                }
                .ai-widget-trigger { animation: ai-blink 2s ease-in-out infinite; }
                .ai-widget-dot { animation: ai-pulse-dot 1.4s ease-in-out infinite; }
            `}</style>

            {/* Painel de chat */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] max-h-[70vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur grid place-items-center overflow-hidden ring-2 ring-white/30 shrink-0">
                            <img src={config.avatarUrl} alt="" className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold truncate leading-tight">{config.name}</p>
                            <p className="text-[10.5px] text-white/80 leading-tight flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                {typing ? 'digitando…' : config.role}
                            </p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
                            aria-label="Fechar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mensagens */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50 dark:bg-slate-950/40 min-h-[200px]">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${
                                        m.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-white/[0.06] rounded-bl-sm'
                                    }`}
                                >
                                    {m.text}
                                    <p className={`text-[9.5px] mt-1 tabular-nums ${m.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                                        {m.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-slate-100 dark:border-white/[0.06] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="px-3 py-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-slate-900">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            placeholder={`Pergunte algo para ${config.name}…`}
                            disabled={typing}
                            className="flex-1 px-3 py-2 rounded-full border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white text-[12.5px] focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        />
                        <button
                            onClick={send}
                            disabled={!input.trim() || typing}
                            className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 text-white grid place-items-center disabled:opacity-50 shrink-0"
                            aria-label="Enviar"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="px-3 py-1.5 text-[9.5px] text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40">
                        Modo simulação · respostas geradas localmente
                    </p>
                </div>
            )}

            {/* Trigger flutuante */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title={open ? 'Fechar' : `Conversar com ${config.name}`}
                className="ai-widget-trigger fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 grid place-items-center shadow-lg hover:scale-105 active:scale-95 transition-transform overflow-hidden ring-2 ring-white dark:ring-slate-900"
            >
                <img
                    src={config.avatarUrl}
                    alt={config.name}
                    className="w-10 h-10 object-contain"
                    draggable={false}
                />
                {/* Indicador online */}
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900">
                    <span className="ai-widget-dot block w-full h-full rounded-full bg-emerald-400 opacity-70" />
                </span>
            </button>
        </>
    );
}
