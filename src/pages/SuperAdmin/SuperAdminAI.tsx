import { useState } from 'react';
import {
    Coins, MessageSquare, CheckCircle2, XCircle, Clock,
    ArrowDownToLine, Settings as SettingsIcon, Edit3, Save, AlertCircle,
} from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, EmptyState, Badge, Avatar, SectionTitle, Modal, Field, inputCls,
} from './_ui';

type Pack = { id: string; credits: number; price: number; popular?: boolean };
type Purchase = {
    id: string;
    company: string;
    user: string;
    pack: string;
    amount: number;
    status: 'PENDING' | 'CONFIRMED' | 'EXPIRED';
    txid: string;
    createdAt: string;
};
type Transaction = {
    id: string;
    company: string;
    type: 'credit' | 'debit';
    amount: number;
    reason: string;
    balanceAfter: number;
    at: string;
};

const PACKS: Pack[] = [
    { id: '1', credits: 500,  price: 50  },
    { id: '2', credits: 800,  price: 70, popular: true },
    { id: '3', credits: 1500, price: 100 },
];

const MOCK_PURCHASES: Purchase[] = [
    { id: '1', company: 'Norteshop', user: 'Maria Souza',  pack: 'R$ 70', amount: 70, status: 'PENDING', txid: 'GI20260511A1', createdAt: '5 min' },
    { id: '2', company: 'Padaria BP', user: 'Ana Lima',   pack: 'R$ 50', amount: 50, status: 'CONFIRMED', txid: 'GI20260511B2', createdAt: '1 h' },
    { id: '3', company: 'Tech SA',   user: 'Carlos M.',   pack: 'R$ 100', amount: 100, status: 'CONFIRMED', txid: 'GI20260511C3', createdAt: '2 h' },
    { id: '4', company: 'Tech SA',   user: 'Carlos M.',   pack: 'R$ 70', amount: 70, status: 'EXPIRED',  txid: 'GI20260510D4', createdAt: '14 h' },
];

const MOCK_TX: Transaction[] = [
    { id: '1', company: 'Norteshop', type: 'debit',  amount: 12, reason: 'Conversa IA — vendas',     balanceAfter: 488, at: '2 min' },
    { id: '2', company: 'Tech SA',   type: 'credit', amount: 1500, reason: 'Compra pacote R$ 100',  balanceAfter: 2840, at: '2 h' },
    { id: '3', company: 'Padaria BP', type: 'debit', amount: 8,  reason: 'Insight diário',          balanceAfter: 492, at: '3 h' },
    { id: '4', company: 'Tech SA',   type: 'debit',  amount: 22, reason: 'Conversa agente IA',     balanceAfter: 1340, at: '4 h' },
];

export function SuperAdminAI() {
    const [tab, setTab] = useState<'overview' | 'purchases' | 'transactions' | 'packs'>('overview');
    const [editingPacks, setEditingPacks] = useState(false);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="IA & créditos"
                description="Gestão de pacotes via PIX, consumo dos modelos e configuração do assistente."
                actions={<Button variant="secondary" icon={SettingsIcon}>Configurar modelos</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Receita 30d" value="R$ 220" icon={Coins} accent="amber" trend={{ value: 12, label: 'vs mês anterior' }} />
                <KPI label="Créditos vendidos" value="4 800" icon={ArrowDownToLine} accent="emerald" />
                <KPI label="Conversas hoje" value="142" icon={MessageSquare} accent="violet" />
                <KPI label="Compras pendentes" value={MOCK_PURCHASES.filter((p) => p.status === 'PENDING').length} icon={Clock} accent="rose" />
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

            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2">
                        <SectionTitle title="Consumo por empresa (30 dias)" description="Quem está usando mais a IA" />
                        <div className="space-y-3 mt-4">
                            {[
                                { name: 'Tech Solutions SA', used: 3840, max: 5000 },
                                { name: 'Norteshop Distribuidora', used: 1290, max: 2000 },
                                { name: 'Padaria Bom Pão', used: 408, max: 1000 },
                            ].map((c) => (
                                <div key={c.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={c.name} size={28} />
                                            <span className="text-[13px] font-semibold text-slate-200">{c.name}</span>
                                        </div>
                                        <span className="text-[12px] font-mono-num text-slate-400">
                                            <span className="text-white font-bold">{c.used.toLocaleString('pt-BR')}</span> / {c.max.toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-orange-400"
                                            style={{ width: `${Math.min(100, (c.used / c.max) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <SectionTitle title="Modelo padrão" description="Configurado via env" />
                        <div className="space-y-2 mt-4 text-[12.5px]">
                            <Row label="Provider" value={<Badge tone="emerald">OpenAI</Badge>} />
                            <Row label="Conversas" value={<span className="font-mono-num">gpt-4o-mini</span>} />
                            <Row label="Insights" value={<span className="font-mono-num">gpt-4o-mini</span>} />
                            <Row label="Status da chave" value={<Badge tone="emerald" icon={CheckCircle2}>Conectada</Badge>} />
                        </div>
                        <Button variant="secondary" size="sm" icon={SettingsIcon} className="mt-4 w-full">Editar modelos</Button>
                    </Card>
                </div>
            )}

            {tab === 'purchases' && (
                <Card padding={false}>
                    <Table>
                        <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                            <tr>
                                <Th>TXID</Th>
                                <Th>Empresa</Th>
                                <Th>Usuário</Th>
                                <Th>Pacote</Th>
                                <Th align="right">Valor</Th>
                                <Th>Status</Th>
                                <Th>Criado</Th>
                                <Th align="right">Ações</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {MOCK_PURCHASES.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02]">
                                    <Td className="font-mono-num text-[11.5px] text-slate-400">{p.txid}</Td>
                                    <Td className="text-[13px] font-semibold text-white">{p.company}</Td>
                                    <Td className="text-[12.5px] text-slate-300">{p.user}</Td>
                                    <Td><Badge tone="amber">{p.pack}</Badge></Td>
                                    <Td align="right" className="font-mono-num font-bold text-white">R$ {p.amount}</Td>
                                    <Td>
                                        {p.status === 'PENDING' && <Badge tone="amber" icon={Clock}>Aguardando PIX</Badge>}
                                        {p.status === 'CONFIRMED' && <Badge tone="emerald" icon={CheckCircle2}>Confirmado</Badge>}
                                        {p.status === 'EXPIRED' && <Badge tone="slate" icon={XCircle}>Expirado</Badge>}
                                    </Td>
                                    <Td className="text-[11.5px] text-slate-400">há {p.createdAt}</Td>
                                    <Td align="right">
                                        {p.status === 'PENDING' && (
                                            <Button size="sm" variant="primary">Confirmar manualmente</Button>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            {tab === 'transactions' && (
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
                            {MOCK_TX.map((t) => (
                                <tr key={t.id} className="hover:bg-white/[0.02]">
                                    <Td className="text-[13px] font-semibold text-white">{t.company}</Td>
                                    <Td>
                                        {t.type === 'credit'
                                            ? <Badge tone="emerald">crédito</Badge>
                                            : <Badge tone="rose">débito</Badge>}
                                    </Td>
                                    <Td align="right" className={`font-mono-num font-bold ${t.type === 'credit' ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {t.type === 'credit' ? '+' : '−'}{t.amount}
                                    </Td>
                                    <Td className="text-[12.5px] text-slate-300">{t.reason}</Td>
                                    <Td align="right" className="font-mono-num text-slate-400">{t.balanceAfter}</Td>
                                    <Td className="text-[11.5px] text-slate-500">há {t.at}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}

            {tab === 'packs' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <SectionTitle title="Pacotes disponíveis" description="O que aparece pra empresa comprar" />
                        <Button size="sm" variant="secondary" icon={editingPacks ? Save : Edit3} onClick={() => setEditingPacks(!editingPacks)}>
                            {editingPacks ? 'Salvar' : 'Editar pacotes'}
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PACKS.map((p) => (
                            <Card key={p.id} className={`relative ${p.popular ? 'border-rose-500/40' : ''}`}>
                                {p.popular && (
                                    <Badge tone="rose">MAIS POPULAR</Badge>
                                )}
                                <div className="mt-3">
                                    <div className="font-display text-[28px] font-bold text-white font-mono-num">
                                        R$ {p.price}
                                    </div>
                                    <div className="text-[12px] text-slate-500 mt-1">único pagamento via PIX</div>
                                </div>
                                <div className="mt-5 py-4 border-y border-white/[0.06]">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-display font-bold text-[20px] text-rose-300 font-mono-num">
                                            {p.credits.toLocaleString('pt-BR')}
                                        </span>
                                        <span className="text-[12px] text-slate-400">créditos</span>
                                    </div>
                                    <div className="text-[11.5px] text-slate-500 mt-0.5">
                                        ~{Math.round(p.credits / 8)} conversas
                                    </div>
                                </div>
                                <div className="mt-4 text-[11.5px] font-mono-num text-slate-500">
                                    R$ {(p.price / p.credits).toFixed(3)} por crédito
                                </div>
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
            )}
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
            <span className="text-slate-400">{label}</span>
            {value}
        </div>
    );
}
