import { useState } from 'react';
import {
    Webhook, CheckCircle2, AlertCircle, Clock, Activity, RefreshCw, ExternalLink,
    ArrowDownRight, Plug,
} from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, Badge, SectionTitle, EmptyState,
} from './_ui';

type WebhookStatus = 'CONNECTED' | 'AUTH_FAIL' | 'DISABLED';

type Connection = {
    id: string;
    bank: 'ITAU' | 'BB';
    company: string;
    type: 'PIX' | 'BOLETO';
    status: WebhookStatus;
    lastEvent: string;
    eventsToday: number;
    errorMsg?: string;
};

type Event = {
    id: string;
    bank: 'ITAU' | 'BB';
    company: string;
    kind: 'PIX_IN' | 'BOLETO_PAID' | 'AUTH_ERROR';
    amount?: number;
    description: string;
    at: string;
};

const BANKS = {
    ITAU: { name: 'Itaú', logo: 'https://cdn.cookielaw.org/logos/0a8c4571-a3ed-4322-aa07-72a8923cf4f6/01957572-cb6a-7f3b-86dd-d35d3d51b16b/d70d9f47-d34b-451d-8e84-23ef89f49006/itau-logo-0.png' },
    BB: { name: 'Banco do Brasil', logo: 'https://play-lh.googleusercontent.com/SwIQ8r-y6Eqfsh_vQjT70GZuFKwGtPwM_Z0kWX1xfRkmIDe2gPVPiqdMR-VPCNK0Erc=s256-rw' },
};

const MOCK_CONNECTIONS: Connection[] = [
    { id: '1', bank: 'ITAU', company: 'Norteshop Distribuidora', type: 'PIX', status: 'CONNECTED', lastEvent: '2 min', eventsToday: 14 },
    { id: '2', bank: 'ITAU', company: 'Norteshop Distribuidora', type: 'BOLETO', status: 'CONNECTED', lastEvent: '1 h', eventsToday: 3 },
    { id: '3', bank: 'BB', company: 'Tech Solutions SA', type: 'PIX', status: 'CONNECTED', lastEvent: '5 min', eventsToday: 28 },
    { id: '4', bank: 'BB', company: 'Padaria Bom Pão', type: 'PIX', status: 'AUTH_FAIL', lastEvent: '12 h', eventsToday: 0, errorMsg: 'Token expirado — renove no devportal' },
    { id: '5', bank: 'ITAU', company: 'Construtora Horizonte', type: 'BOLETO', status: 'DISABLED', lastEvent: '5 dias', eventsToday: 0 },
];

const MOCK_EVENTS: Event[] = [
    { id: '1', bank: 'ITAU', company: 'Norteshop', kind: 'PIX_IN', amount: 1240.50, description: 'PIX recebido de João Silva', at: '2 min' },
    { id: '2', bank: 'BB', company: 'Tech SA', kind: 'PIX_IN', amount: 5800, description: 'PIX recebido — fatura #2841', at: '5 min' },
    { id: '3', bank: 'ITAU', company: 'Norteshop', kind: 'BOLETO_PAID', amount: 2100, description: 'Boleto pago — nosso número 12345678', at: '14 min' },
    { id: '4', bank: 'BB', company: 'Padaria BP', kind: 'AUTH_ERROR', description: 'Falha ao renovar token (HTTP 401)', at: '12 h' },
    { id: '5', bank: 'BB', company: 'Tech SA', kind: 'PIX_IN', amount: 320, description: 'PIX recebido — cliente Maria', at: '38 min' },
];

const STATUS_META: Record<WebhookStatus, { tone: 'emerald' | 'rose' | 'slate'; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    CONNECTED: { tone: 'emerald', label: 'Conectado', icon: CheckCircle2 },
    AUTH_FAIL: { tone: 'rose', label: 'Auth falhou', icon: AlertCircle },
    DISABLED:  { tone: 'slate', label: 'Desabilitado', icon: Clock },
};

export function SuperAdminWebhooks() {
    const [tab, setTab] = useState<'connections' | 'events'>('connections');

    const connected = MOCK_CONNECTIONS.filter((c) => c.status === 'CONNECTED').length;
    const failing = MOCK_CONNECTIONS.filter((c) => c.status === 'AUTH_FAIL').length;
    const totalToday = MOCK_CONNECTIONS.reduce((s, c) => s + c.eventsToday, 0);
    const pixIn = MOCK_EVENTS.filter((e) => e.kind === 'PIX_IN').reduce((s, e) => s + (e.amount ?? 0), 0);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Webhooks"
                description="Conexões bancárias por empresa, eventos em tempo real e logs de erro."
                actions={<Button variant="secondary" icon={RefreshCw}>Forçar resync</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Conexões ativas" value={connected} icon={Plug} accent="emerald" />
                <KPI label="Com falha" value={failing} icon={AlertCircle} accent={failing > 0 ? 'rose' : 'emerald'} />
                <KPI label="Eventos hoje" value={totalToday} icon={Activity} accent="violet" trend={{ value: 12, label: 'vs ontem' }} />
                <KPI label="PIX recebido (24h)" value={`R$ ${pixIn.toLocaleString('pt-BR')}`} accent="amber" icon={ArrowDownRight} />
            </div>

            <Tabs
                options={[{ value: 'connections', label: 'Conexões' }, { value: 'events', label: 'Eventos' }]}
                value={tab}
                onChange={setTab}
                counts={{ connections: MOCK_CONNECTIONS.length, events: MOCK_EVENTS.length }}
            />

            {tab === 'connections' && (
                <Card padding={false}>
                    <Table>
                        <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                            <tr>
                                <Th>Banco</Th>
                                <Th>Empresa</Th>
                                <Th>Tipo</Th>
                                <Th>Status</Th>
                                <Th>Último evento</Th>
                                <Th align="right">Eventos hoje</Th>
                                <Th align="right">Ações</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {MOCK_CONNECTIONS.map((c) => {
                                const status = STATUS_META[c.status];
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={c.id} className="hover:bg-white/[0.02]">
                                        <Td>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center overflow-hidden p-1">
                                                    <img src={BANKS[c.bank].logo} alt={BANKS[c.bank].name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <span className="text-[13px] font-semibold text-white">{BANKS[c.bank].name}</span>
                                            </div>
                                        </Td>
                                        <Td className="text-[12.5px] text-slate-300">{c.company}</Td>
                                        <Td><Badge tone={c.type === 'PIX' ? 'sky' : 'violet'}>{c.type}</Badge></Td>
                                        <Td>
                                            <Badge tone={status.tone} icon={StatusIcon}>{status.label}</Badge>
                                            {c.errorMsg && (
                                                <div className="text-[10.5px] text-rose-400 mt-1 truncate max-w-[200px]" title={c.errorMsg}>
                                                    {c.errorMsg}
                                                </div>
                                            )}
                                        </Td>
                                        <Td className="text-[11.5px] text-slate-400">há {c.lastEvent}</Td>
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
            )}

            {tab === 'events' && (
                <Card padding={false}>
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <SectionTitle title="Eventos recentes" description="Stream em tempo real dos webhooks bancários" />
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {MOCK_EVENTS.length === 0 ? (
                            <EmptyState icon={Webhook} title="Nenhum evento recente" />
                        ) : MOCK_EVENTS.map((e) => (
                            <div key={e.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.01]">
                                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1.5 shrink-0">
                                    <img src={BANKS[e.bank].logo} alt={BANKS[e.bank].name} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <EventBadge kind={e.kind} />
                                        <span className="text-[12.5px] font-semibold text-white">{e.company}</span>
                                    </div>
                                    <div className="text-[12px] text-slate-400 mt-0.5">{e.description}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    {e.amount !== undefined && (
                                        <div className="font-mono-num font-bold text-[14px] text-emerald-300">
                                            +R$ {e.amount.toLocaleString('pt-BR')}
                                        </div>
                                    )}
                                    <div className="text-[10.5px] text-slate-500 mt-0.5">há {e.at}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

function EventBadge({ kind }: { kind: Event['kind'] }) {
    if (kind === 'PIX_IN') return <Badge tone="emerald" icon={ArrowDownRight}>PIX recebido</Badge>;
    if (kind === 'BOLETO_PAID') return <Badge tone="sky" icon={CheckCircle2}>Boleto pago</Badge>;
    return <Badge tone="rose" icon={AlertCircle}>Erro auth</Badge>;
}
