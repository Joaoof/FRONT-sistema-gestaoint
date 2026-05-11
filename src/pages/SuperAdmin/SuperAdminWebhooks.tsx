import { useState } from 'react';
import {
    Webhook, CheckCircle2, AlertCircle, Clock, Activity, RefreshCw, ExternalLink,
    ArrowDownRight, Plug,
} from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, Badge, SectionTitle, EmptyState,
} from './_ui';
import { useQuery, timeAgo, formatBRL } from './_api';

type WebhooksOverview = { connected: number; failing: number; eventsToday: number; pixInLast24h: number };

type Connection = {
    id: string;
    provider: string;
    bankId: string | null;
    companyId: string;
    companyName: string | null;
    status: string;
    lastSyncAt: string | null;
    lastErrorAt: string | null;
    lastErrorMsg: string | null;
    eventsToday: number;
    createdAt: string;
};

type WebhookEvent = {
    id: string;
    provider: string;
    event: string;
    processed: boolean;
    errorMsg: string | null;
    refType: string | null;
    refId: string | null;
    payloadJson: string | null;
    createdAt: string;
};

const Q_OVERVIEW = `query WhOverview { superAdminWebhooksOverview { connected failing eventsToday pixInLast24h } }`;
const Q_CONNECTIONS = `
  query WhConns {
    superAdminWebhookConnections {
      id provider bankId companyId companyName status
      lastSyncAt lastErrorAt lastErrorMsg eventsToday createdAt
    }
  }
`;
const Q_EVENTS = `
  query WhEvents($provider: String, $take: Int) {
    superAdminWebhookEvents(provider: $provider, take: $take) {
      id provider event processed errorMsg refType refId payloadJson createdAt
    }
  }
`;

const BANK_META: Record<string, { name: string; logo?: string }> = {
    DIRECT_ITAU: { name: 'Itaú', logo: 'https://cdn.cookielaw.org/logos/0a8c4571-a3ed-4322-aa07-72a8923cf4f6/01957572-cb6a-7f3b-86dd-d35d3d51b16b/d70d9f47-d34b-451d-8e84-23ef89f49006/itau-logo-0.png' },
    DIRECT_BB:   { name: 'Banco do Brasil', logo: 'https://play-lh.googleusercontent.com/SwIQ8r-y6Eqfsh_vQjT70GZuFKwGtPwM_Z0kWX1xfRkmIDe2gPVPiqdMR-VPCNK0Erc=s256-rw' },
    ITAU: { name: 'Itaú' },
    BB: { name: 'Banco do Brasil' },
    PLUGGY: { name: 'Pluggy' },
    BELVO:  { name: 'Belvo' },
    MOCK:   { name: 'Mock' },
};

function bankMeta(provider: string) {
    return BANK_META[provider] ?? { name: provider };
}

const STATUS_META: Record<string, { tone: 'emerald' | 'rose' | 'slate' | 'amber'; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    CONNECTED: { tone: 'emerald', label: 'Conectado', icon: CheckCircle2 },
    AUTH_FAIL: { tone: 'rose',    label: 'Auth falhou', icon: AlertCircle },
    DISABLED:  { tone: 'slate',   label: 'Desabilitado', icon: Clock },
    PENDING:   { tone: 'amber',   label: 'Pendente', icon: Clock },
};

export function SuperAdminWebhooks() {
    const [tab, setTab] = useState<'connections' | 'events'>('connections');

    const { data: ovData, loading: ovLoading, refetch: refetchOv } = useQuery<{ superAdminWebhooksOverview: WebhooksOverview }>(Q_OVERVIEW);
    const ov = ovData?.superAdminWebhooksOverview;

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Webhooks"
                description="Conexões bancárias por empresa, eventos em tempo real e logs de erro."
                actions={<Button variant="secondary" icon={RefreshCw} onClick={() => refetchOv()}>Atualizar</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Conexões ativas" value={ovLoading ? '…' : ov?.connected ?? 0} icon={Plug} accent="emerald" />
                <KPI label="Com falha" value={ovLoading ? '…' : ov?.failing ?? 0} icon={AlertCircle} accent={ov && ov.failing > 0 ? 'rose' : 'emerald'} />
                <KPI label="Eventos hoje" value={ovLoading ? '…' : ov?.eventsToday ?? 0} icon={Activity} accent="violet" />
                <KPI label="PIX recebido (24h)" value={ovLoading ? '…' : formatBRL(ov?.pixInLast24h ?? 0)} accent="amber" icon={ArrowDownRight} />
            </div>

            <Tabs
                options={[{ value: 'connections', label: 'Conexões' }, { value: 'events', label: 'Eventos' }]}
                value={tab}
                onChange={setTab}
            />

            {tab === 'connections' && <ConnectionsTab />}
            {tab === 'events' && <EventsTab />}
        </div>
    );
}

function ConnectionsTab() {
    const { data, loading } = useQuery<{ superAdminWebhookConnections: Connection[] }>(Q_CONNECTIONS);
    const items = data?.superAdminWebhookConnections ?? [];

    return (
        <Card padding={false}>
            <Table>
                <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                    <tr>
                        <Th>Banco</Th>
                        <Th>Empresa</Th>
                        <Th>Status</Th>
                        <Th>Última sincronização</Th>
                        <Th align="right">Eventos hoje</Th>
                        <Th align="right">Ações</Th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                    ) : items.length === 0 ? (
                        <tr><td colSpan={6}><EmptyState icon={Webhook} title="Nenhuma conexão bancária" description="Quando uma empresa configurar Itaú ou BB, aparece aqui." /></td></tr>
                    ) : items.map((c) => {
                        const meta = bankMeta(c.provider);
                        const status = STATUS_META[c.status] ?? { tone: 'slate' as const, label: c.status, icon: Clock };
                        const SIcon = status.icon;
                        return (
                            <tr key={c.id} className="hover:bg-white/[0.02]">
                                <Td>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center overflow-hidden p-1">
                                            {meta.logo
                                                ? <img src={meta.logo} alt={meta.name} className="max-w-full max-h-full object-contain" />
                                                : <Webhook className="w-4 h-4 text-slate-700" />}
                                        </div>
                                        <span className="text-[13px] font-semibold text-white">{meta.name}</span>
                                    </div>
                                </Td>
                                <Td className="text-[12.5px] text-slate-300">{c.companyName ?? c.companyId.slice(0, 8)}</Td>
                                <Td>
                                    <Badge tone={status.tone} icon={SIcon}>{status.label}</Badge>
                                    {c.lastErrorMsg && (
                                        <div className="text-[10.5px] text-rose-400 mt-1 truncate max-w-[240px]" title={c.lastErrorMsg}>
                                            {c.lastErrorMsg}
                                        </div>
                                    )}
                                </Td>
                                <Td className="text-[11.5px] text-slate-400">
                                    {c.lastSyncAt ? `há ${timeAgo(c.lastSyncAt)}` : '—'}
                                </Td>
                                <Td align="right" className="font-mono-num font-bold text-slate-200">{c.eventsToday}</Td>
                                <Td align="right">
                                    {c.status === 'AUTH_FAIL' && <Button size="sm" variant="danger" icon={RefreshCw}>Renovar token</Button>}
                                    {c.status === 'CONNECTED' && <Button size="sm" variant="ghost" icon={ExternalLink}>Detalhes</Button>}
                                </Td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Card>
    );
}

function EventsTab() {
    const { data, loading } = useQuery<{ superAdminWebhookEvents: WebhookEvent[] }>(Q_EVENTS, { take: 100 });
    const items = data?.superAdminWebhookEvents ?? [];

    return (
        <Card padding={false}>
            <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionTitle title="Eventos recentes" description="Stream dos webhooks bancários" />
            </div>
            <div className="divide-y divide-white/[0.04]">
                {loading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/[0.04] rounded animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState icon={Webhook} title="Nenhum evento recente" />
                ) : items.map((e) => {
                    const meta = bankMeta(e.provider);
                    const amount = extractAmount(e.payloadJson);
                    return (
                        <div key={e.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.01]">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1.5 shrink-0">
                                {meta.logo
                                    ? <img src={meta.logo} alt={meta.name} className="max-w-full max-h-full object-contain" />
                                    : <Webhook className="w-4 h-4 text-slate-700" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <EventBadge event={e.event} processed={e.processed} />
                                    <span className="text-[12.5px] font-semibold text-white">{meta.name}</span>
                                    {e.refType && <span className="text-[11px] text-slate-500">· {e.refType}</span>}
                                </div>
                                <div className="text-[12px] text-slate-400 mt-0.5 truncate max-w-2xl">
                                    {e.errorMsg ?? (e.refId ? `ref ${e.refId}` : 'processado')}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                {amount !== null && amount > 0 && (
                                    <div className="font-mono-num font-bold text-[14px] text-emerald-300">+{formatBRL(amount)}</div>
                                )}
                                <div className="text-[10.5px] text-slate-500 mt-0.5">há {timeAgo(e.createdAt)}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function EventBadge({ event, processed }: { event: string; processed: boolean }) {
    if (!processed) return <Badge tone="rose" icon={AlertCircle}>Falha</Badge>;
    if (event === 'PIX_IN') return <Badge tone="emerald" icon={ArrowDownRight}>PIX recebido</Badge>;
    if (event === 'BOLETO_PAID') return <Badge tone="sky" icon={CheckCircle2}>Boleto pago</Badge>;
    return <Badge tone="violet">{event}</Badge>;
}

function extractAmount(payloadJson: string | null): number | null {
    if (!payloadJson) return null;
    try {
        const p = JSON.parse(payloadJson);
        const v = Number(p?.valor ?? p?.amount ?? p?.value ?? 0);
        return Number.isFinite(v) ? v : null;
    } catch { return null; }
}
