import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    Banknote,
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    AlertCircle,
    Activity,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { BankProviderIcon } from '../../components/banks/BankProviderIcon';
import { BANK_INTEGRATIONS_STATUS } from '../../graphql/queries/bank-integrations';

interface CredentialItem {
    key: string;
    label: string;
    filled: boolean;
}
interface WebhookEvent {
    id: string;
    provider: string;
    event: string;
    processed: boolean;
    errorMsg: string | null;
    refType: string | null;
    refId: string | null;
    createdAt: string;
}
interface IntegrationStatus {
    provider: 'ITAU' | 'BB';
    label: string;
    configured: boolean;
    environment: string;
    pixWebhookUrl: string;
    boletoWebhookUrl: string;
    lastWebhookAt: string | null;
    lastErrorAt: string | null;
    lastErrorMsg: string | null;
    totalWebhooks: number;
    processedWebhooks: number;
    credentials: CredentialItem[];
    recentEvents: WebhookEvent[];
}

export function BankIntegrationsPage() {
    const { data, loading, refetch } = useQuery<{ bankIntegrationsStatus: IntegrationStatus[] }>(
        BANK_INTEGRATIONS_STATUS,
        { fetchPolicy: 'cache-and-network', pollInterval: 30000 },
    );

    const integrations = data?.bankIntegrationsStatus ?? [];

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="pb-4 border-b border-slate-200 dark:border-white/[0.06] flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-cyan-500" />
                        Integrações Bancárias
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Conecte o sistema diretamente com Itaú e Banco do Brasil para receber pagamentos em tempo real.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="text-[12px] text-slate-500 hover:text-slate-700"
                >
                    Atualizar
                </button>
            </div>

            {loading && integrations.length === 0 && (
                <div className="text-center py-12 text-slate-500">Carregando…</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {integrations.map((it) => (
                    <IntegrationCard key={it.provider} status={it} />
                ))}
            </div>
        </div>
    );
}

function IntegrationCard({ status }: { status: IntegrationStatus }) {
    const [expanded, setExpanded] = useState(false);

    const statusBadge = status.configured
        ? { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckCircle2, label: 'Conectado' }
        : { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertCircle, label: 'Aguardando configuração' };

    const StatusIcon = statusBadge.icon;
    const filledCount = status.credentials.filter((c) => c.filled).length;
    const matchRate = status.totalWebhooks > 0
        ? Math.round((status.processedWebhooks / status.totalWebhooks) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            {/* Header com logo */}
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white rounded-lg ring-1 ring-slate-200 dark:ring-white/10 grid place-items-center p-1">
                        <BankProviderIcon provider={status.provider} size={48} />
                    </div>
                    <div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">{status.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wider">
                            Ambiente:{' '}
                            <span className={status.environment === 'production' ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                {status.environment}
                            </span>
                        </div>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full border ${statusBadge.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusBadge.label}
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/[0.06] text-center">
                <div className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Credenciais</div>
                    <div className="text-base font-semibold mt-0.5">
                        {filledCount}/{status.credentials.length}
                    </div>
                </div>
                <div className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Webhooks</div>
                    <div className="text-base font-semibold mt-0.5">{status.totalWebhooks}</div>
                </div>
                <div className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Processados</div>
                    <div className="text-base font-semibold mt-0.5">
                        {matchRate}<span className="text-xs">%</span>
                    </div>
                </div>
            </div>

            {/* URLs de webhook */}
            <div className="p-5 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300">
                    URLs de webhook (cadastre no painel do banco)
                </div>
                <WebhookUrlRow label="PIX recebido" url={status.pixWebhookUrl} />
                <WebhookUrlRow label="Boleto pago" url={status.boletoWebhookUrl} />
            </div>

            {/* Erro recente */}
            {status.lastErrorMsg && (
                <div className="px-5 py-3 bg-rose-50 dark:bg-rose-950/30 border-t border-rose-200 dark:border-rose-900/40">
                    <div className="flex items-start gap-2 text-[12px]">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <div className="font-semibold text-rose-700 dark:text-rose-400">Último erro</div>
                            <div className="text-rose-600 dark:text-rose-300 text-[11px] mt-0.5">{status.lastErrorMsg}</div>
                            {status.lastErrorAt && (
                                <div className="text-[10px] text-rose-500 mt-0.5">
                                    {new Date(status.lastErrorAt).toLocaleString('pt-BR')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle pra expandir */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full px-5 py-2.5 text-[12px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between"
            >
                <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {expanded ? 'Ocultar detalhes' : 'Ver credenciais & últimos eventos'}
                </span>
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {expanded && (
                <div className="px-5 py-4 border-t border-slate-100 dark:border-white/[0.06] space-y-4">
                    {/* Credenciais */}
                    <div>
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Credenciais necessárias (.env)
                        </div>
                        <ul className="space-y-1.5">
                            {status.credentials.map((c) => (
                                <li key={c.key} className="flex items-center gap-2 text-[12px]">
                                    {c.filled ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    ) : (
                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                                    )}
                                    <code className="font-mono text-[10.5px] text-slate-500">{c.key}</code>
                                    <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                                </li>
                            ))}
                        </ul>
                        {!status.configured && (
                            <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded p-2.5 text-[11.5px] text-blue-800 dark:text-blue-300">
                                <b>Pra ativar:</b> preencha as variáveis acima no <code className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900/40 px-1 rounded">.env</code> da API e reinicie o servidor. Não esqueça de cadastrar as URLs de webhook acima no painel do banco.
                            </div>
                        )}
                    </div>

                    {/* Eventos recentes */}
                    <div>
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Últimos eventos recebidos
                        </div>
                        {status.recentEvents.length === 0 ? (
                            <p className="text-[12px] text-slate-500 italic text-center py-3">
                                Nenhum webhook recebido ainda.
                                {!status.configured && ' Configure as credenciais e cadastre o webhook no banco pra começar.'}
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] text-[12px]">
                                {status.recentEvents.map((e) => (
                                    <li key={e.id} className="py-1.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {e.processed ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                            )}
                                            <span className="font-mono text-[10.5px] text-slate-500 uppercase shrink-0">{e.event}</span>
                                            {e.refType && (
                                                <span className="text-[10px] text-slate-400 truncate">
                                                    {e.refType} {e.refId?.slice(0, 8)}…
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10.5px] text-slate-400 shrink-0">
                                            {new Date(e.createdAt).toLocaleString('pt-BR')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Link pra dev portal */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                        <a
                            href={
                                status.provider === 'ITAU'
                                    ? 'https://devportal.itau.com.br'
                                    : 'https://developers.bb.com.br'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] text-cyan-700 dark:text-cyan-400 hover:underline"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir portal de desenvolvedor {status.label}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

function WebhookUrlRow({ label, url }: { label: string; url: string }) {
    const copy = async () => {
        await navigator.clipboard.writeText(url);
        toast.success('URL copiada.');
    };
    return (
        <div className="flex items-center gap-2">
            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-24 shrink-0">{label}</div>
            <code className="flex-1 text-[10.5px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded truncate">
                {url}
            </code>
            <button
                onClick={copy}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Copiar"
            >
                <Copy className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
