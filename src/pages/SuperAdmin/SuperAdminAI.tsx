import { useState } from 'react';
import {
    Coins, MessageSquare, CheckCircle2, XCircle, Clock,
    ArrowDownToLine, Settings as SettingsIcon, Edit3, Save, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, Badge, Avatar, SectionTitle,
} from './_ui';
import { gql, useQuery, timeAgo, formatBRL, formatNumber } from './_api';

type AiOverview = {
    kpis: { revenue30d: number; creditsSold30d: number; conversationsToday: number; pendingPurchases: number };
    topConsumers: { companyId: string; companyName: string; consumed30d: number; balance: number }[];
};
type Purchase = {
    id: string; companyId: string; companyName: string | null;
    userId: string | null; userName: string | null;
    packageBrl: number; creditsTotal: number; pixTxid: string;
    status: 'PENDING' | 'PAID' | 'CANCELED' | 'EXPIRED';
    paidAt: string | null; createdAt: string; expiresAt: string;
};
type Transaction = {
    id: string; companyId: string; companyName: string | null;
    kind: string; amount: number; balanceAfter: number; description: string; createdAt: string;
};

const Q_OVERVIEW = `
  query AiOverview {
    superAdminAiOverview {
      kpis { revenue30d creditsSold30d conversationsToday pendingPurchases }
      topConsumers { companyId companyName consumed30d balance }
    }
  }
`;

const Q_PURCHASES = `
  query AiPurchases($status: String, $take: Int) {
    superAdminAiPurchases(status: $status, take: $take) {
      id companyId companyName userId userName
      packageBrl creditsTotal pixTxid status paidAt createdAt expiresAt
    }
  }
`;

const Q_TX = `
  query AiTransactions($take: Int) {
    superAdminAiTransactions(take: $take) {
      id companyId companyName kind amount balanceAfter description createdAt
    }
  }
`;

const M_CONFIRM = `mutation ConfirmPurchase($purchaseId: ID!) { superAdminConfirmAiPurchase(purchaseId: $purchaseId) }`;

const PACKS = [
    { credits: 500,  price: 50  },
    { credits: 800,  price: 70, popular: true },
    { credits: 1500, price: 100 },
];

export function SuperAdminAI() {
    const [tab, setTab] = useState<'overview' | 'purchases' | 'transactions' | 'packs'>('overview');

    const { data: ovData, loading: ovLoading } = useQuery<{ superAdminAiOverview: AiOverview }>(Q_OVERVIEW);
    const ov = ovData?.superAdminAiOverview;

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="IA & créditos"
                description="Gestão de pacotes via PIX, consumo dos modelos e configuração do assistente."
                actions={<Button variant="secondary" icon={SettingsIcon}>Configurar modelos</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Receita 30d" value={ovLoading ? '…' : formatBRL(ov?.kpis.revenue30d ?? 0)} icon={Coins} accent="amber" />
                <KPI label="Créditos vendidos" value={ovLoading ? '…' : formatNumber(ov?.kpis.creditsSold30d ?? 0)} icon={ArrowDownToLine} accent="emerald" />
                <KPI label="Conversas hoje" value={ovLoading ? '…' : ov?.kpis.conversationsToday ?? 0} icon={MessageSquare} accent="violet" />
                <KPI label="Compras pendentes" value={ovLoading ? '…' : ov?.kpis.pendingPurchases ?? 0} icon={Clock} accent={ov && ov.kpis.pendingPurchases > 0 ? 'rose' : 'emerald'} />
            </div>

            <Tabs
                options={[
                    { value: 'overview', label: 'Visão geral' },
                    { value: 'purchases', label: 'Compras PIX' },
                    { value: 'transactions', label: 'Transações' },
                    { value: 'packs', label: 'Pacotes' },
                ]}
                value={tab}
                onChange={setTab}
            />

            {tab === 'overview' && <OverviewTab data={ov} loading={ovLoading} />}
            {tab === 'purchases' && <PurchasesTab />}
            {tab === 'transactions' && <TransactionsTab />}
            {tab === 'packs' && <PacksTab />}
        </div>
    );
}

function OverviewTab({ data, loading }: { data?: AiOverview; loading: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
                <SectionTitle title="Consumo por empresa (30 dias)" description="Top 5 — empresas com maior uso" />
                {loading ? (
                    <div className="space-y-3 mt-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/[0.04] rounded animate-pulse" />)}
                    </div>
                ) : !data || data.topConsumers.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-[13px]">Nenhum consumo registrado ainda.</div>
                ) : (
                    <div className="space-y-3 mt-4">
                        {data.topConsumers.map((c) => {
                            const max = Math.max(...data.topConsumers.map((x) => x.consumed30d), 1);
                            return (
                                <div key={c.companyId}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={c.companyName} size={28} />
                                            <span className="text-[13px] font-semibold text-slate-200">{c.companyName}</span>
                                        </div>
                                        <span className="text-[12px] font-mono-num text-slate-400">
                                            <span className="text-white font-bold">{formatNumber(c.consumed30d)}</span> consumidos · saldo {formatNumber(c.balance)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${(c.consumed30d / max) * 100}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Card>
                <SectionTitle title="Configuração" description="Variáveis de ambiente" />
                <div className="space-y-2 mt-4 text-[12.5px]">
                    <Row label="Provider" value={<Badge tone="emerald">OpenAI</Badge>} />
                    <Row label="Conversas" value={<span className="font-mono-num">gpt-4o-mini</span>} />
                    <Row label="Insights" value={<span className="font-mono-num">gpt-4o-mini</span>} />
                    <Row label="Status da chave" value={<Badge tone="emerald" icon={CheckCircle2}>Conectada</Badge>} />
                </div>
            </Card>
        </div>
    );
}

function PurchasesTab() {
    const { data, loading, refetch } = useQuery<{ superAdminAiPurchases: Purchase[] }>(Q_PURCHASES, { take: 50 });
    const items = data?.superAdminAiPurchases ?? [];

    const confirm = async (p: Purchase) => {
        if (!window.confirm(`Confirmar manualmente o pagamento de R$ ${p.packageBrl} de ${p.companyName ?? p.companyId}?`)) return;
        try {
            await gql(M_CONFIRM, { purchaseId: p.id });
            toast.success(`Compra confirmada — ${p.creditsTotal} créditos creditados`);
            void refetch();
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <Card padding={false}>
            <Table>
                <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                    <tr>
                        <Th>TXID</Th>
                        <Th>Empresa</Th>
                        <Th>Solicitante</Th>
                        <Th>Pacote</Th>
                        <Th align="right">Valor</Th>
                        <Th>Status</Th>
                        <Th>Criado</Th>
                        <Th align="right">Ações</Th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                    ) : items.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-16 text-slate-500 text-[13px]">Nenhuma compra registrada ainda.</td></tr>
                    ) : items.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02]">
                            <Td className="font-mono-num text-[11.5px] text-slate-400">{p.pixTxid}</Td>
                            <Td className="text-[13px] font-semibold text-white">{p.companyName ?? p.companyId.slice(0, 8)}</Td>
                            <Td className="text-[12.5px] text-slate-300">{p.userName ?? '—'}</Td>
                            <Td><Badge tone="amber">{p.creditsTotal} créd.</Badge></Td>
                            <Td align="right" className="font-mono-num font-bold text-white">R$ {p.packageBrl}</Td>
                            <Td>
                                {p.status === 'PENDING' && <Badge tone="amber" icon={Clock}>Aguardando PIX</Badge>}
                                {p.status === 'PAID' && <Badge tone="emerald" icon={CheckCircle2}>Confirmado</Badge>}
                                {p.status === 'EXPIRED' && <Badge tone="slate" icon={XCircle}>Expirado</Badge>}
                                {p.status === 'CANCELED' && <Badge tone="rose" icon={XCircle}>Cancelado</Badge>}
                            </Td>
                            <Td className="text-[11.5px] text-slate-400">há {timeAgo(p.createdAt)}</Td>
                            <Td align="right">
                                {p.status === 'PENDING' && <Button size="sm" variant="primary" onClick={() => confirm(p)}>Confirmar</Button>}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card>
    );
}

function TransactionsTab() {
    const { data, loading } = useQuery<{ superAdminAiTransactions: Transaction[] }>(Q_TX, { take: 100 });
    const items = data?.superAdminAiTransactions ?? [];

    return (
        <Card padding={false}>
            <Table>
                <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                    <tr>
                        <Th>Empresa</Th>
                        <Th>Tipo</Th>
                        <Th align="right">Quantidade</Th>
                        <Th>Motivo</Th>
                        <Th align="right">Saldo após</Th>
                        <Th>Quando</Th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                    ) : items.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-16 text-slate-500 text-[13px]">Nenhuma transação registrada.</td></tr>
                    ) : items.map((t) => {
                        const isCredit = t.amount > 0 || t.kind === 'PURCHASE' || t.kind === 'BONUS';
                        return (
                            <tr key={t.id} className="hover:bg-white/[0.02]">
                                <Td className="text-[13px] font-semibold text-white">{t.companyName ?? t.companyId.slice(0, 8)}</Td>
                                <Td>
                                    {isCredit ? <Badge tone="emerald">{t.kind.toLowerCase()}</Badge> : <Badge tone="rose">{t.kind.toLowerCase()}</Badge>}
                                </Td>
                                <Td align="right" className={`font-mono-num font-bold ${isCredit ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {t.amount > 0 ? '+' : ''}{t.amount}
                                </Td>
                                <Td className="text-[12.5px] text-slate-300 max-w-md truncate">{t.description}</Td>
                                <Td align="right" className="font-mono-num text-slate-400">{t.balanceAfter}</Td>
                                <Td className="text-[11.5px] text-slate-500">há {timeAgo(t.createdAt)}</Td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Card>
    );
}

function PacksTab() {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <SectionTitle title="Pacotes disponíveis" description="O que aparece pra empresa comprar" />
                <Button size="sm" variant="secondary" icon={Edit3}>Editar pacotes</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACKS.map((p) => (
                    <Card key={p.price} className={`relative ${p.popular ? 'border-rose-500/40' : ''}`}>
                        {p.popular && <Badge tone="rose">MAIS POPULAR</Badge>}
                        <div className="mt-3">
                            <div className="font-display text-[28px] font-bold text-white font-mono-num">R$ {p.price}</div>
                            <div className="text-[12px] text-slate-500 mt-1">único pagamento via PIX</div>
                        </div>
                        <div className="mt-5 py-4 border-y border-white/[0.06]">
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display font-bold text-[20px] text-rose-300 font-mono-num">{formatNumber(p.credits)}</span>
                                <span className="text-[12px] text-slate-400">créditos</span>
                            </div>
                            <div className="text-[11.5px] text-slate-500 mt-0.5">~{Math.round(p.credits / 8)} conversas</div>
                        </div>
                        <div className="mt-4 text-[11.5px] font-mono-num text-slate-500">R$ {(p.price / p.credits).toFixed(3)} por crédito</div>
                    </Card>
                ))}
            </div>
            <Card className="mt-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[12.5px] text-slate-400 leading-relaxed">
                        <strong className="text-slate-200">Chave PIX configurada:</strong> <span className="font-mono-num">63991021043</span><br />
                        Pagamentos PIX são confirmados automaticamente via webhook do banco quando configurado.
                        Empresas em planos sem webhook precisam de confirmação manual aqui na tela "Compras PIX".
                    </div>
                </div>
            </Card>
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
            <span className="text-slate-400">{label}</span>{value}
        </div>
    );
}
