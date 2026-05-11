import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    AlertTriangle, ArrowRight, Banknote, Check, CheckCircle2,
    Copy, ExternalLink, FileText, Mail, Phone, Sparkles, X,
    KeyRound, Building2, ShieldCheck,
} from 'lucide-react';
import { BankProviderIcon } from '../../components/banks/BankProviderIcon';
import { BANK_INTEGRATIONS_STATUS } from '../../graphql/queries/bank-integrations';

interface CredentialItem { key: string; label: string; filled: boolean }
interface WebhookEvent {
    id: string; provider: string; event: string; processed: boolean;
    errorMsg: string | null; refType: string | null; refId: string | null; createdAt: string;
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

// Conteúdo de ajuda específico por banco
const HELP_CONTENT: Record<'ITAU' | 'BB', {
    portalUrl: string;
    portalName: string;
    contactSteps: { title: string; desc: string }[];
    apiName: string;
    requirements: string[];
}> = {
    ITAU: {
        portalUrl: 'https://devportal.itau.com.br',
        portalName: 'Portal de Desenvolvedores Itaú',
        apiName: 'API Cobrança v2 (Boleto + PIX)',
        contactSteps: [
            {
                title: '1. Fale com seu gerente PJ',
                desc: 'Solicite a habilitação da API Cobrança v2 e o convênio bancário. Esse pedido é registrado no sistema interno do banco — geralmente leva 5 a 10 dias úteis.',
            },
            {
                title: '2. Solicite o certificado digital A1',
                desc: 'Certificado ICP-Brasil vinculado ao CNPJ. Compre em uma AC (Certisign, Serasa, Valid). Custo: R$ 200-400/ano.',
            },
            {
                title: '3. Crie a aplicação no devportal',
                desc: 'Acesse devportal.itau.com.br, crie uma App, vincule a API Cobrança v2 e gere o client_id/client_secret.',
            },
            {
                title: '4. Configure o webhook',
                desc: 'No painel da App, cadastre as URLs de webhook (copie do card acima). Comece em sandbox.',
            },
        ],
        requirements: [
            'Conta empresarial Itaú PJ',
            'iToken Pro (gerado pelo gerente)',
            'CNPJ ativo na Receita Federal',
            'Certificado digital A1 ICP-Brasil',
        ],
    },
    BB: {
        portalUrl: 'https://developers.bb.com.br',
        portalName: 'Portal de Desenvolvedores BB',
        apiName: 'API Cobrança v2',
        contactSteps: [
            {
                title: '1. Solicite convênio de cobrança no BB',
                desc: 'Vá até a agência do BB e peça abertura do convênio de cobrança bancária (registrado). Necessário antes de qualquer API.',
            },
            {
                title: '2. Cadastre-se em developers.bb.com.br',
                desc: 'Crie conta usando CPF (não precisa ser CNPJ). Acesso é mais rápido que o Itaú — sem aprovação manual pra sandbox.',
            },
            {
                title: '3. Crie uma App e vincule APIs',
                desc: 'No portal, "Minhas Aplicações" → criar App → adicionar "Cobranças v2". Vai gerar client_id, client_secret e developer_application_key (gw-dev-app-key).',
            },
            {
                title: '4. Solicite migração pra produção',
                desc: 'Depois de testar em sandbox, abra um chamado no portal pedindo promoção da App pra produção (1-3 dias úteis).',
            },
        ],
        requirements: [
            'Conta empresarial BB com Convênio de Cobrança',
            'Acesso ao portal developers.bb.com.br',
            'CNPJ ativo',
        ],
    },
};

export function WebhookCenterPage() {
    const { data, loading, refetch } = useQuery<{ bankIntegrationsStatus: IntegrationStatus[] }>(
        BANK_INTEGRATIONS_STATUS,
        { fetchPolicy: 'cache-and-network', pollInterval: 30000 },
    );
    const [helpFor, setHelpFor] = useState<'ITAU' | 'BB' | null>(null);

    const integrations = data?.bankIntegrationsStatus ?? [];

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Hero */}
            <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[11px] uppercase tracking-wider font-bold opacity-90">Central de Webhooks</span>
                </div>
                <h1 className="text-2xl font-bold leading-tight mb-2">Receba do banco em tempo real</h1>
                <p className="text-white/90 text-[13.5px] max-w-2xl">
                    Quando alguém pagar um boleto seu ou enviar um PIX, o banco avisa o sistema na hora.
                    Sem precisar baixar OFX manualmente.
                </p>
            </div>

            {loading && integrations.length === 0 && (
                <div className="text-center py-12 text-slate-500">Carregando status…</div>
            )}

            {/* Cards de cada banco */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {integrations.map((it) => (
                    <BankCard key={it.provider} status={it} onAskHelp={() => setHelpFor(it.provider as any)} />
                ))}
            </div>

            {/* Como funciona */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
                    Como funciona
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Step n={1} icon={KeyRound} title="Obtenha credenciais" desc="Cadastre-se no portal do banco e gere client_id + client_secret." />
                    <Step n={2} icon={Building2} title="Configure o .env" desc="Preencha as variáveis no arquivo .env da API e reinicie o servidor." />
                    <Step n={3} icon={ExternalLink} title="Aponte o webhook" desc="Copie a URL do card acima e cadastre no painel do banco." />
                    <Step n={4} icon={ShieldCheck} title="Pronto" desc="Pagamentos chegam automaticamente e marcam contas como pagas." />
                </div>
            </div>

            {/* Modal de ajuda */}
            {helpFor && (
                <HelpModal provider={helpFor} onClose={() => setHelpFor(null)} />
            )}
        </div>
    );
}

function BankCard({ status, onAskHelp }: { status: IntegrationStatus; onAskHelp: () => void }) {
    const isConfigured = status.configured;
    const hasError = !!status.lastErrorMsg;
    const isAuthError = status.lastErrorMsg && /OAuth|401|unauthor|credencial/i.test(status.lastErrorMsg);

    return (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-slate-300 transition-all">
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/40 dark:to-slate-900 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-xl ring-1 ring-slate-200 dark:ring-white/10 grid place-items-center p-1.5 shadow-sm">
                        <BankProviderIcon provider={status.provider} size={56} />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{status.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                            {status.environment === 'production' ? '🟢 Produção' : status.environment === 'sandbox' ? '🟡 Sandbox' : '⚪ Não configurado'}
                        </div>
                    </div>
                </div>
                <StatusBadge configured={isConfigured} hasError={hasError} />
            </div>

            {/* Alerta de erro de autenticação */}
            {isAuthError && (
                <div className="m-5 mb-0 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 grid place-items-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
                                Falha na autenticação com o banco
                            </div>
                            <p className="text-[12px] text-rose-700 dark:text-rose-300 mt-1">
                                Suas credenciais estão inválidas ou expiraram. Você precisa pedir
                                <b> novo acesso à API</b> no portal de desenvolvedores do banco.
                            </p>
                            <code className="block mt-2 text-[10.5px] font-mono bg-rose-100 dark:bg-rose-900/40 p-1.5 rounded text-rose-800 dark:text-rose-300 truncate">
                                {status.lastErrorMsg}
                            </code>
                            <button
                                onClick={onAskHelp}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-medium rounded-lg"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                Como pedir acesso à API
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerta de não configurado */}
            {!isConfigured && !isAuthError && (
                <div className="m-5 mb-0 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 grid place-items-center shrink-0">
                            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                                Aguardando configuração
                            </div>
                            <p className="text-[12px] text-amber-700 dark:text-amber-300 mt-1">
                                Você precisa obter credenciais com o banco e cadastrar no <code>.env</code>.
                            </p>
                            <button
                                onClick={onAskHelp}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-medium rounded-lg"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Ver passo a passo
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/[0.06] text-center px-5 py-4 mt-5 border-t border-slate-100 dark:border-white/[0.06]">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Eventos</div>
                    <div className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">{status.totalWebhooks}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Processados</div>
                    <div className="text-xl font-bold mt-0.5 text-emerald-700">{status.processedWebhooks}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Último</div>
                    <div className="text-[11px] font-medium mt-0.5 text-slate-700 dark:text-slate-300">
                        {status.lastWebhookAt ? new Date(status.lastWebhookAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                </div>
            </div>

            {/* URLs webhook */}
            <div className="px-5 pb-5 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mt-2">
                    🔗 URLs pra cadastrar no painel do banco
                </div>
                <WebhookUrlRow label="PIX recebido" url={status.pixWebhookUrl} />
                <WebhookUrlRow label="Boleto pago" url={status.boletoWebhookUrl} />
            </div>

            {/* Footer com ações */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[12px]">
                <button onClick={onAskHelp} className="text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Como pedir acesso
                </button>
                {isConfigured && status.recentEvents.length > 0 && (
                    <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recebendo eventos
                    </span>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ configured, hasError }: { configured: boolean; hasError: boolean }) {
    if (hasError) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Erro
            </span>
        );
    }
    if (configured) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Conectado
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300 rounded-full">
            <KeyRound className="w-3 h-3" /> Aguardando
        </span>
    );
}

function WebhookUrlRow({ label, url }: { label: string; url: string }) {
    const copy = async () => {
        await navigator.clipboard.writeText(url);
        toast.success('URL copiada para a área de transferência.');
    };
    return (
        <div className="flex items-center gap-2">
            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-28 shrink-0">{label}</div>
            <code className="flex-1 text-[10.5px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded truncate">
                {url}
            </code>
            <button onClick={copy} className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="Copiar">
                <Copy className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function Step({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center mx-auto mb-2 shadow-sm">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Passo {n}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{title}</div>
            <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">{desc}</p>
        </div>
    );
}

function HelpModal({ provider, onClose }: { provider: 'ITAU' | 'BB'; onClose: () => void }) {
    const content = HELP_CONTENT[provider];
    const label = provider === 'ITAU' ? 'Itaú' : 'Banco do Brasil';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-xl ring-1 ring-slate-200 grid place-items-center p-1">
                            <BankProviderIcon provider={provider} size={48} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">Como conectar ao {label}</div>
                            <div className="text-[12px] text-slate-500">{content.apiName}</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Requisitos */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4 mb-5">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> O que você precisa ter
                    </div>
                    <ul className="space-y-1">
                        {content.requirements.map((r) => (
                            <li key={r} className="text-[12.5px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Passo a passo */}
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Passo a passo
                </div>
                <ol className="space-y-3 mb-5">
                    {content.contactSteps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 grid place-items-center font-bold text-sm shrink-0">
                                {i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-sm text-slate-900 dark:text-white">{step.title}</div>
                                <p className="text-[12.5px] text-slate-600 dark:text-slate-400 mt-0.5">{step.desc}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                {/* Ações */}
                <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                    <a
                        href={content.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Abrir {content.portalName}
                    </a>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                        Fechar
                    </button>
                </div>

                <p className="text-[10.5px] text-slate-500 text-center mt-4">
                    💡 Dica: comece sempre em ambiente <b>sandbox</b> antes de ativar produção.
                </p>
            </div>
        </div>
    );
}
