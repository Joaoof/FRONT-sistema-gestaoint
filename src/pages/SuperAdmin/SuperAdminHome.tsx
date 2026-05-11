import { Link } from 'react-router-dom';
import {
    Building2, Mail, Users, Boxes, Sparkles, Webhook,
    Activity, ArrowUpRight, AlertTriangle, Zap,
    Coins, CreditCard, Database, Shield as ShieldIcon,
} from 'lucide-react';
import { Card, KPI, PageHeader, SectionTitle, Avatar, Badge } from './_ui';
import { useQuery, timeAgo, formatBRL } from './_api';

type HealthItem = { service: string; status: 'ok' | 'warn' | 'down'; detail?: string };
type ActivityRow = { id: string; who: string; action: string; target?: string; at: string; companyName?: string };
type GrowthPoint = { label: string; companies: number; users: number };

type Overview = {
    kpis: {
        companies: number; companiesNewThisMonth: number;
        users: number; usersNewThisMonth: number;
        pendingInvites: number; activePlans: number;
        aiCreditsRevenue30d: number;
        webhooksFailing: number; eventsToday: number;
    };
    health: HealthItem[];
    recentActivity: ActivityRow[];
    growth30d: GrowthPoint[];
};

const Q_OVERVIEW = `
  query SuperAdminOverview {
    superAdminOverview {
      kpis {
        companies companiesNewThisMonth
        users usersNewThisMonth
        pendingInvites activePlans
        aiCreditsRevenue30d
        webhooksFailing eventsToday
      }
      health { service status detail }
      recentActivity { id who action target at companyName }
      growth30d { label companies users }
    }
  }
`;

const QUICK_CARDS = [
    { to: '/super-admin/empresas', label: 'Empresas', icon: Building2, color: 'from-sky-500 to-cyan-400', desc: 'Gerencie tenants e seus planos' },
    { to: '/super-admin/convites', label: 'Convites', icon: Mail, color: 'from-rose-500 to-orange-400', desc: 'Envie acessos por e-mail' },
    { to: '/super-admin/planos', label: 'Planos & módulos', icon: Boxes, color: 'from-emerald-500 to-teal-400', desc: 'Configure permissões READ/WRITE' },
    { to: '/super-admin/ia', label: 'IA & créditos', icon: Sparkles, color: 'from-amber-500 to-yellow-400', desc: 'Pacotes PIX e consumo' },
    { to: '/super-admin/webhooks', label: 'Webhooks', icon: Webhook, color: 'from-violet-500 to-purple-400', desc: 'Conexões bancárias por empresa' },
    { to: '/super-admin/logs', label: 'Logs master', icon: Activity, color: 'from-fuchsia-500 to-pink-400', desc: 'Auditoria global' },
];

const SERVICE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
    database:       { icon: Database, label: 'Banco de dados' },
    email:          { icon: Mail, label: 'E-mail (Resend)' },
    openai:         { icon: Sparkles, label: 'OpenAI' },
    'itau-webhook': { icon: Webhook, label: 'Itaú webhook' },
    'bb-webhook':   { icon: Webhook, label: 'BB webhook' },
    pix:            { icon: CreditCard, label: 'PIX' },
};

export function SuperAdminHome() {
    const { data, loading } = useQuery<{ superAdminOverview: Overview }>(Q_OVERVIEW);
    const ov = data?.superAdminOverview;

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
                    value={loading ? '…' : ov?.kpis.companies ?? 0}
                    icon={Building2}
                    accent="sky"
                    trend={ov ? { value: ov.kpis.companiesNewThisMonth, label: 'novas este mês', direction: 'up' } : undefined}
                />
                <KPI
                    label="Usuários totais"
                    value={loading ? '…' : ov?.kpis.users ?? 0}
                    icon={Users}
                    accent="violet"
                    trend={ov ? { value: ov.kpis.usersNewThisMonth, label: 'novos este mês', direction: 'up' } : undefined}
                />
                <KPI
                    label="Receita IA (30d)"
                    value={loading ? '…' : formatBRL(ov?.kpis.aiCreditsRevenue30d ?? 0)}
                    icon={Coins}
                    accent="amber"
                    hint="pacotes PIX confirmados"
                />
                <KPI
                    label="Webhooks com falha"
                    value={loading ? '…' : ov?.kpis.webhooksFailing ?? 0}
                    icon={AlertTriangle}
                    accent={ov && ov.kpis.webhooksFailing > 0 ? 'rose' : 'emerald'}
                    hint={ov && ov.kpis.webhooksFailing > 0 ? 'requer atenção' : 'tudo ok'}
                />
            </div>

            {/* Hero + Health */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <Card className="relative overflow-hidden p-7">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
                        <div className="relative">
                            <Badge tone="rose" icon={Zap}>NOVO</Badge>
                            <h2 className="font-display text-2xl font-bold text-white tracking-tight mt-4">
                                {ov && ov.kpis.pendingInvites > 0
                                    ? `${ov.kpis.pendingInvites} convite${ov.kpis.pendingInvites > 1 ? 's' : ''} aguardando aceite`
                                    : 'Acelere o onboarding com convites em massa'}
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
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-7 bg-white/[0.04] rounded animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div>
                            {ov?.health.map((h) => {
                                const meta = SERVICE_META[h.service] ?? { icon: Activity, label: h.service };
                                const Icon = meta.icon;
                                return <HealthRow key={h.service} icon={Icon} label={meta.label} status={h.status} detail={h.detail} />;
                            })}
                        </div>
                    )}
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

            {/* Activity + Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card padding={false}>
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <SectionTitle title="Atividade recente" description="Últimos eventos da plataforma" />
                    </div>
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-10 bg-white/[0.04] rounded animate-pulse" />
                            ))}
                        </div>
                    ) : !ov || ov.recentActivity.length === 0 ? (
                        <div className="px-5 py-10 text-center text-slate-500 text-[13px]">
                            Sem eventos ainda. Quando empresas começarem a usar, eles aparecem aqui.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {ov.recentActivity.slice(0, 8).map((a) => (
                                <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                                    <Avatar name={a.who} size={32} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] text-slate-200">
                                            <span className="font-semibold text-white">{a.who}</span>
                                            <span className="text-slate-400"> {a.action} </span>
                                            {a.target && <span className="font-semibold text-slate-200">{a.target}</span>}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            há {timeAgo(a.at)} {a.companyName && `· ${a.companyName}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card padding={false}>
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <SectionTitle title="Crescimento (30 dias)" description="Empresas e usuários criados por janela" />
                    </div>
                    <div className="p-5">
                        {loading ? (
                            <div className="h-32 bg-white/[0.04] rounded animate-pulse" />
                        ) : (
                            <BarChart points={ov?.growth30d ?? []} />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function HealthRow({
    icon: Icon, label, status, detail,
}: { icon: React.ComponentType<{ className?: string }>; label: string; status: 'ok' | 'warn' | 'down'; detail?: string }) {
    const dot = { ok: 'bg-emerald-400', warn: 'bg-amber-400', down: 'bg-rose-400' }[status];
    const text = { ok: 'text-emerald-300', warn: 'text-amber-300', down: 'text-rose-300' }[status];
    const label2 = { ok: 'OK', warn: 'Atenção', down: 'Fora do ar' }[status];
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                    <div className="text-[13px] text-slate-300 truncate">{label}</div>
                    {detail && <div className="text-[10.5px] text-slate-500 truncate">{detail}</div>}
                </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
                <span className={`text-[11.5px] font-semibold ${text}`}>{label2}</span>
            </div>
        </div>
    );
}

function BarChart({ points }: { points: GrowthPoint[] }) {
    const data = points.length > 0 ? points : [...Array(12)].map(() => ({ label: '', companies: 0, users: 0 }));
    const max = Math.max(1, ...data.map((d) => d.companies + d.users));
    return (
        <div className="flex items-end gap-1.5 h-32">
            {data.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1.5 group cursor-default" title={`${p.label}: ${p.companies} empresa(s), ${p.users} usuário(s)`}>
                    <div
                        className="w-full rounded-t bg-gradient-to-t from-rose-500/40 to-rose-400/60 group-hover:from-rose-500 group-hover:to-orange-400 transition-all"
                        style={{ height: `${((p.companies + p.users) / max) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[9.5px] font-mono-num text-slate-600">{p.label || (i + 1)}</span>
                </div>
            ))}
        </div>
    );
}
