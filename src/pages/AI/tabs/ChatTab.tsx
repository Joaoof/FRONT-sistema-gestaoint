import { useEffect, useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Send, Sparkles, AlertTriangle, Check, RefreshCw } from 'lucide-react';

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

interface Msg {
    id: string;
    role: 'user' | 'agent';
    text: string;
    at: Date;
    actions?: PendingAction[];
}

const SUGGESTIONS = [
    'Como foi o dia hoje?',
    'Quem está devendo?',
    'Quais produtos com estoque baixo?',
    'Vendas da semana',
    'Resumo financeiro de ontem',
];

export function ChatTab() {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Msg[]>([
        {
            id: 'welcome',
            role: 'agent',
            text: 'Oi! Posso consultar seus dados em tempo real (vendas, contas, estoque) e até criar contas e marcar pagamentos — sempre pedindo sua confirmação. O que quer ver?',
            at: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [chatMutation] = useMutation(CHAT_WITH_AI);
    const [executeMutation] = useMutation(EXECUTE_AI_ACTION);
    const [cancelMutation] = useMutation(CANCEL_AI_ACTION);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typing]);

    async function sendText(text: string) {
        if (!text.trim() || typing) return;
        const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text, at: new Date() };
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
                    text: `❌ ${e.message ?? 'Falha na chamada.'}`,
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
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            Assistente do GestãoInt
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Conectado · OpenAI
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setConversationId(null);
                        setMessages([
                            {
                                id: 'reset',
                                role: 'agent',
                                text: 'Conversa reiniciada. O que quer ver?',
                                at: new Date(),
                            },
                        ]);
                    }}
                    className="text-[11.5px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/5"
                    title="Limpar e começar nova conversa"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Nova conversa
                </button>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50 dark:bg-slate-950/40">
                {messages.map((m) => (
                    <div key={m.id}>
                        <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug whitespace-pre-wrap ${
                                    m.role === 'user'
                                        ? 'bg-violet-600 text-white rounded-br-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-white/[0.06] rounded-bl-sm'
                                }`}
                            >
                                {m.text}
                                <p className={`text-[10px] mt-1 tabular-nums ${m.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                                    {m.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        {m.actions && m.actions.length > 0 && (
                            <div className="mt-2 space-y-2 max-w-[75%]">
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
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm border border-slate-100 dark:border-white/[0.06] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Sugestões */}
            {messages.length <= 2 && (
                <div className="px-5 py-2 flex gap-2 flex-wrap border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => sendText(s)}
                            className="text-[12px] px-3 py-1.5 rounded-full bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-slate-900">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendText(input);
                            setInput('');
                        }
                    }}
                    placeholder="Pergunte algo ao assistente…"
                    disabled={typing}
                    className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                />
                <button
                    onClick={() => {
                        sendText(input);
                        setInput('');
                    }}
                    disabled={!input.trim() || typing}
                    className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-700 text-white grid place-items-center disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
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
        <div className="border border-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-[12.5px]">
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
            {isCanceled && <div className="text-slate-500 text-[11px]">Cancelado.</div>}
            {isFailed && <div className="text-rose-700 dark:text-rose-400 text-[11px]">Falhou: {action.error}</div>}

            {isPending && (
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[12px] font-medium"
                    >
                        Confirmar e executar
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[12px]"
                    >
                        Cancelar
                    </button>
                </div>
            )}
            {isExecuting && <div className="text-amber-700 text-[11px]">Executando…</div>}
        </div>
    );
}
