import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X, Check, AlertTriangle } from 'lucide-react';
import { gql, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { useAIAgent } from '../contexts/AIAgentContext';

const CHAT_WITH_AI = gql`
  mutation ChatWithAi($message: String!, $conversationId: String, $model: String) {
    chatWithAi(message: $message, conversationId: $conversationId, model: $model) {
      conversationId
      assistantMessage { id content createdAt }
      pendingActions { id tool description paramsJson }
    }
  }
`;

const EXECUTE_AI_ACTION = gql`
  mutation ExecuteAiAction($actionId: String!) {
    executeAiAction(actionId: $actionId) { ok resultJson }
  }
`;

const CANCEL_AI_ACTION = gql`
  mutation CancelAiAction($actionId: String!) {
    cancelAiAction(actionId: $actionId)
  }
`;

interface PendingAction {
    id: string;
    tool: string;
    description: string;
    paramsJson: string;
    status: 'pending' | 'executing' | 'done' | 'canceled' | 'failed';
    error?: string;
}

interface ChatMsg {
    id: string;
    role: 'user' | 'agent';
    text: string;
    at: Date;
    actions?: PendingAction[];
}

export function AIAgentWidget() {
    const { config } = useAIAgent();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [typing, setTyping] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [chatMutation] = useMutation(CHAT_WITH_AI);
    const [executeMutation] = useMutation(EXECUTE_AI_ACTION);
    const [cancelMutation] = useMutation(CANCEL_AI_ACTION);

    useEffect(() => {
        if (open && !hasGreeted) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'agent',
                    text: config.welcomeMessage || `Oi! Sou o ${config.name}. Posso te dar resumos do dia, alertas, ou criar contas e marcar pagamentos pra você (com confirmação).`,
                    at: new Date(),
                },
            ]);
            setHasGreeted(true);
        }
    }, [open, hasGreeted, config.welcomeMessage, config.name]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typing]);

    const hideRoutes = ['/', '/login'];
    const isPrint = /\/imprimir(\/|$)/.test(location.pathname);
    if (isPrint || hideRoutes.includes(location.pathname)) return null;
    if (!config.showWidget) return null;

    async function send() {
        if (!input.trim() || typing) return;
        const text = input.trim();
        setInput('');
        const userMsg: ChatMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            text,
            at: new Date(),
        };
        setMessages((p) => [...p, userMsg]);
        setTyping(true);

        try {
            const model = localStorage.getItem('ai-default-model') ?? undefined;
            const { data } = await chatMutation({
                variables: { message: text, conversationId, model },
            });
            const r = data?.chatWithAi;
            if (r?.conversationId) setConversationId(r.conversationId);

            const actions: PendingAction[] = (r?.pendingActions ?? []).map((p: any) => ({
                id: p.id,
                tool: p.tool,
                description: p.description,
                paramsJson: p.paramsJson,
                status: 'pending',
            }));

            setMessages((p) => [
                ...p,
                {
                    id: `a-${Date.now()}`,
                    role: 'agent',
                    text: r?.assistantMessage?.content ?? '(sem resposta)',
                    at: new Date(),
                    actions: actions.length > 0 ? actions : undefined,
                },
            ]);
        } catch (e: any) {
            setMessages((p) => [
                ...p,
                {
                    id: `err-${Date.now()}`,
                    role: 'agent',
                    text: `❌ ${e.message ?? 'Falha na chamada da IA. Verifique se a OPENAI_API_KEY está configurada.'}`,
                    at: new Date(),
                },
            ]);
        } finally {
            setTyping(false);
        }
    }

    async function confirmAction(msgId: string, actionId: string) {
        setMessages((prev) =>
            prev.map((m) =>
                m.id === msgId
                    ? {
                          ...m,
                          actions: m.actions?.map((a) =>
                              a.id === actionId ? { ...a, status: 'executing' } : a,
                          ),
                      }
                    : m,
            ),
        );
        try {
            await executeMutation({ variables: { actionId } });
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId
                        ? {
                              ...m,
                              actions: m.actions?.map((a) =>
                                  a.id === actionId ? { ...a, status: 'done' } : a,
                              ),
                          }
                        : m,
                ),
            );
            toast.success('Ação executada.');
        } catch (e: any) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId
                        ? {
                              ...m,
                              actions: m.actions?.map((a) =>
                                  a.id === actionId
                                      ? { ...a, status: 'failed', error: e.message }
                                      : a,
                              ),
                          }
                        : m,
                ),
            );
            toast.error(e.message);
        }
    }

    async function cancelAction(msgId: string, actionId: string) {
        try {
            await cancelMutation({ variables: { actionId } });
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId
                        ? {
                              ...m,
                              actions: m.actions?.map((a) =>
                                  a.id === actionId ? { ...a, status: 'canceled' } : a,
                              ),
                          }
                        : m,
                ),
            );
        } catch (e: any) {
            toast.error(e.message);
        }
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

            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] max-h-[75vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur grid place-items-center overflow-hidden ring-2 ring-white/30 shrink-0">
                            <img src={config.avatarUrl} alt="" className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold truncate leading-tight">{config.name}</p>
                            <p className="text-[10.5px] text-white/80 leading-tight flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                {typing ? 'pensando…' : 'OpenAI conectado'}
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

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50 dark:bg-slate-950/40 min-h-[200px]">
                        {messages.map((m) => (
                            <div key={m.id}>
                                <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug whitespace-pre-wrap ${
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
                                {m.actions && m.actions.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {m.actions.map((a) => (
                                            <ActionCard
                                                key={a.id}
                                                action={a}
                                                onConfirm={() => confirmAction(m.id, a.id)}
                                                onCancel={() => cancelAction(m.id, a.id)}
                                            />
                                        ))}
                                    </div>
                                )}
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
                        IA tem acesso aos dados do sistema · Ações de escrita pedem confirmação
                    </p>
                </div>
            )}

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
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900">
                    <span className="ai-widget-dot block w-full h-full rounded-full bg-emerald-400 opacity-70" />
                </span>
            </button>
        </>
    );
}

function ActionCard({
    action,
    onConfirm,
    onCancel,
}: {
    action: PendingAction;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const isPending = action.status === 'pending';
    const isDone = action.status === 'done';
    const isCanceled = action.status === 'canceled';
    const isFailed = action.status === 'failed';
    const isExecuting = action.status === 'executing';

    return (
        <div className="border border-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-[12px] max-w-[85%]">
            <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <div className="font-semibold text-amber-900 dark:text-amber-200">
                        Confirmação necessária
                    </div>
                    <div className="text-amber-800 dark:text-amber-100/90 mt-0.5">
                        {action.description}
                    </div>
                    <div className="text-[10px] text-amber-700/70 dark:text-amber-300/60 mt-1">
                        Ferramenta: <code>{action.tool}</code>
                    </div>
                </div>
            </div>

            {isDone && (
                <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px]">
                    <Check className="w-3.5 h-3.5" /> Executado
                </div>
            )}
            {isCanceled && (
                <div className="text-slate-500 text-[11px]">Cancelado pelo usuário.</div>
            )}
            {isFailed && (
                <div className="text-rose-700 dark:text-rose-400 text-[11px]">
                    Falhou: {action.error}
                </div>
            )}

            {isPending && (
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11.5px] font-medium"
                    >
                        Confirmar e executar
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[11.5px]"
                    >
                        Cancelar
                    </button>
                </div>
            )}
            {isExecuting && (
                <div className="text-amber-700 text-[11px]">Executando…</div>
            )}
        </div>
    );
}
