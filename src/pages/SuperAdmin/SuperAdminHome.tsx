import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, Mail, Users, Boxes, Sparkles, Webhook,
    Activity, ArrowUpRight, TrendingUp, AlertTriangle, Zap,
    Coins, CreditCard, Database, Shield as ShieldIcon,
} from 'lucide-react';
import { Card, KPI, PageHeader, SectionTitle, Avatar, Badge } from './_ui';

type Stats = {
    companies: number; companiesGrowth: number;
    users: number; usersGrowth: number;
    pendingInvites: number;
    activePlans: number;
    aiCreditsRevenue: number;
    webhooksFailing: number;
    eventsToday: number;
};

const QUICK_CARDS = [
    { to: '/super-admin/empresas', label: 'Empresas', icon: Building2, color: 'from-sky-500 to-cyan-400', desc: 'Gerencie tenants e seus planos' },
    { to: '/super-admin/convites', label: 'Convites', icon: Mail, color: 'from-rose-500 to-orange-400', desc: 'Envie acessos por e-mail' },
    { to: '/super-admin/planos', label: 'Planos & módulos', icon: Boxes, color: 'from-emerald-500 to-teal-400', desc: 'Configure permissões READ/WRITE' },
    { to: '/super-admin/ia', label: 'IA & créditos', icon: Sparkles, color: 'from-amber-500 to-yellow-400', desc: 'Pacotes PIX e consumo' },
    { to: '/super-admin/webhooks', label: 'Webhooks', icon: Webhook, color: 'from-violet-500 to-purple-400', desc: 'Conexões bancárias por empresa' },
    { to: '/super-admin/logs', label: 'Logs master', icon: Activity, color: 'from-fuchsia-500 to-pink-400', desc: 'Auditoria global' },
];

const MOCK_ACTIVITY = [
    { id: '1', who: 'Maria Souza', action: 'aceitou convite', target: 'GestãoInt - Norteshop', t: '2 min', tone: 'emerald' as const },
    { id: '2', who: 'João Pereira', action: 'comprou crédito IA', target: 'Pacote R$70', t: '14 min', tone: 'amber' as const },
    { id: '3', who: 'Sistema', action: 'webhook falhou', target: 'Itaú PIX (Empresa #2)', t: '32 min', tone: 'rose' as const },
    { id: '4', who: 'Ana Lima', action: 'criou empresa', target: 'Padaria Bom Pão', t: '1 h', tone: 'sky' as const },
    { id: '5', who: 'Sistema', action: 'gerou insight diário', target: 'Empresa Tech LTDA', t: '2 h', tone: 'violet' as const },
];

export function SuperAdminHome() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setStats({
                companies: 0, companiesGrowth: 0,
                users: 0, usersGrowth: 0,
                pendingInvites: 0,
                activePlans: 0,
                aiCreditsRevenue: 0,
                webhooksFailing: 0,
                eventsToday: 0,
            });
            setLoading(false);
        }, 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="space-y-8 max-w-[1400px]">
            <PageHeader
                title="Bem-vindo de volta"
                description="Painel global do GestãoInt — métricas e ações sobre todas as empresas conectadas."
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI
                    label="Empresas ativas"
                    value={loading ? '…' : stats?.companies ?? 0}
                    icon={Building2}
                    accent="sky"
                    trend={loading ? undefined : { value: stats?.companiesGrowth ?? 0, label: 'este mês' }}
                />
                <KPI
                    label="Usuários totais"
                    value={loading ? '…' : stats?.users ?? 0}
                    icon={Users}
                    accent="violet"
                    trend={loading ? undefined : { value: stats?.usersGrowth ?? 0, label: 'este mês' }}
                />
                <KPI
                    label="Receita IA"
                    value={loading ? '…' : `R$ ${(stats?.aiCreditsRevenue ?? 0).toLocaleString('pt-BR')}`}
                    icon={Coins}
                    accent="amber"
                    hint="últimos 30 dias"
                />
                <KPI
                    label="Webhooks com falha"
                    value={loading ? '…' : stats?.webhooksFailing ?? 0}
                    icon={AlertTriangle}
                    accent={stats && stats.webhooksFailing > 0 ? 'rose' : 'emerald'}
                    hint={stats && stats.webhooksFailing > 0 ? 'requer atenção' : 'tudo ok'}
                />
            </div>

            {/* Hero card + side */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <Card className="relative overflow-hidden p-7">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
                        <div className="relative">
                            <Badge tone="rose" icon={Zap}>NOVO</Badge>
                            <h2 className="font-display text-2xl font-bold text-white tracking-tight mt-4">
                                Acelere o onboarding com convites em massa
                            </h2>
                            <p className="text-[13.5px] text-slate-400 mt-2 max-w-md leading-relaxed">
                                Envie convites com função e plano pré-definidos. O usuário recebe um e-mail
                                personalizado e cria a senha em segundos.
                            </p>
                            <div className="flex items-center gap-2 mt-5">
                                <Link
                                    to="/super-admin/convites"
                                    className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-white text-slate-900 text-[13px] font-bold hover:bg-slate-100 transition-colors"
                                >
                                    Enviar convite <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                                <Link
                                    to="/super-admin/planos"
                                    className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg text-slate-300 hover:bg-white/[0.04] text-[13px] font-semibold"
                                >
                                    Configurar planos antes
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldIcon className="w-4 h-4 text-emerald-400" />
                        <SectionTitle title="Saúde do sistema" />
                    </div>
                    <HealthRow icon={Database} label="Banco de dados" value="OK" tone="emerald" />
                    <HealthRow icon={Webhook} label="Itaú webhook" value="OK" tone="emerald" />
                    <HealthRow icon={Webhook} label="BB webhook" value="OK" tone="emerald" />
                    <HealthRow icon={Mail} label="E-mail (Resend)" value="Configurar" tone="amber" />
                    <HealthRow icon={CreditCard} label="PIX" value="OK" tone="emerald" />
                </Card>
            </div>

            {/* Quick access */}
            <div>
                <SectionTitle
                    title="Acesso rápido"
                    description="Atalhos para as áreas mais utilizadas do painel global"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {QUICK_CARDS.map((card) => (
                        <Link
                            key={card.to}
                            to={card.to}
                            className="group relative overflow-hidden rounded-xl bg-[#13161e] border border-white/[0.06] p-5 hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${card.color} opacity-50`} />
                            <div className="flex items-start justify-between">
                                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                                    <card.icon className="w-5 h-5 text-white" strokeWidth={2} />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:rotate-12 transition-all" />
                            </div>
                            <div className="mt-5">
                                <div className="font-display text-[15px] font-bold text-white">{card.label}</div>
                                <div className="text-[12.5px] text-slate-400 mt-1 leading-relaxed">{card.desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card padding={false}>
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                        <SectionTitle title="Atividade recente" description="Últimos eventos da plataforma" />
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {MOCK_ACTIVITY.map((a) => (
                            <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                                <Avatar name={a.who} size={32} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] text-slate-200">
                                        <span className="font-semibold text-white">{a.who}</span>
                                        <span className="text-slate-400"> {a.action} </span>
                                        <span className="font-semibold text-slate-200">{a.target}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">há {a.t}</div>
                                </div>
                                <Badge tone={a.tone}>{a.action.split(' ')[0]}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card padding={false}>
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <SectionTitle title="Crescimento (30 dias)" description="Empresas e usuários ativos" />
                    </div>
                    <div className="p-5">
                        <BarChart />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function HealthRow({
    icon: Icon, label, value, tone,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'emerald' | 'amber' | 'rose' }) {
    const dot = { emerald: 'bg-emerald-400', amber: 'bg-amber-400', rose: 'bg-rose-400' }[tone];
    const text = { emerald: 'text-emerald-300', amber: 'text-amber-300', rose: 'text-rose-300' }[tone];
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
            <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="text-[13px] text-slate-300">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
                <span className={`text-[11.5px] font-semibold ${text}`}>{value}</span>
            </div>
        </div>
    );
}

function BarChart() {
    const data = [12, 19, 14, 22, 18, 25, 28, 24, 30, 27, 33, 36];
    const max = Math.max(...data);
    return (
        <div className="flex items-end gap-1.5 h-32">
            {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1.5 group cursor-default">
                    <div
                        className="w-full rounded-t bg-gradient-to-t from-rose-500/40 to-rose-400/60 group-hover:from-rose-500 group-hover:to-orange-400 transition-all"
                        style={{ height: `${(v / max) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[9.5px] font-mono-num text-slate-600">{i + 1}</span>
                </div>
            ))}
        </div>
    );
}
