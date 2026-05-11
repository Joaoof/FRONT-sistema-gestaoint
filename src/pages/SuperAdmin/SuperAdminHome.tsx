import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, Mail, Users, Boxes, Sparkles, Webhook,
    Activity, TrendingUp, AlertTriangle, ArrowUpRight,
} from 'lucide-react';

type Stats = {
    companies: number;
    users: number;
    pendingInvites: number;
    activePlans: number;
    aiCreditsThisMonth: number;
    webhooksFailing: number;
};

const QUICK_CARDS = [
    { to: '/super-admin/empresas', label: 'Empresas', icon: Building2, color: 'from-blue-500 to-cyan-500', desc: 'Gerenciar tenants' },
    { to: '/super-admin/convites', label: 'Convites', icon: Mail, color: 'from-rose-500 to-orange-500', desc: 'Enviar e listar' },
    { to: '/super-admin/usuarios', label: 'Usuários', icon: Users, color: 'from-violet-500 to-purple-500', desc: 'Todos os usuários' },
    { to: '/super-admin/planos', label: 'Planos & Módulos', icon: Boxes, color: 'from-emerald-500 to-teal-500', desc: 'Permissões por plano' },
    { to: '/super-admin/ia', label: 'IA & Créditos', icon: Sparkles, color: 'from-amber-500 to-yellow-500', desc: 'PIX, pacotes, uso' },
    { to: '/super-admin/webhooks', label: 'Webhooks', icon: Webhook, color: 'from-fuchsia-500 to-pink-500', desc: 'Bancos e logs' },
];

export function SuperAdminHome() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: substituir por query real
        const t = setTimeout(() => {
            setStats({
                companies: 0,
                users: 0,
                pendingInvites: 0,
                activePlans: 0,
                aiCreditsThisMonth: 0,
                webhooksFailing: 0,
            });
            setLoading(false);
        }, 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Painel Global
                </h1>
                <p className="text-[13px] text-slate-400 mt-1">
                    Você está no modo super administrador — visualize e gerencie todas as empresas do GestãoInt.
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Empresas ativas"
                    value={stats?.companies}
                    loading={loading}
                    icon={Building2}
                    trend="+0 este mês"
                />
                <StatCard
                    label="Usuários totais"
                    value={stats?.users}
                    loading={loading}
                    icon={Users}
                    trend="+0 este mês"
                />
                <StatCard
                    label="Convites pendentes"
                    value={stats?.pendingInvites}
                    loading={loading}
                    icon={Mail}
                    highlight={(stats?.pendingInvites ?? 0) > 0}
                />
                <StatCard
                    label="Webhooks com falha"
                    value={stats?.webhooksFailing}
                    loading={loading}
                    icon={AlertTriangle}
                    danger={(stats?.webhooksFailing ?? 0) > 0}
                />
            </div>

            {/* Quick cards */}
            <div>
                <h2 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Acesso rápido
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {QUICK_CARDS.map((card) => (
                        <Link
                            key={card.to}
                            to={card.to}
                            className="group relative overflow-hidden rounded-xl bg-[#181b25] border border-white/5 p-5 hover:border-white/10 transition-all"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                            <div className="relative flex items-start justify-between">
                                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                    <card.icon className="w-5 h-5 text-white" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                            <div className="relative mt-4">
                                <div className="text-[15px] font-semibold text-white">{card.label}</div>
                                <div className="text-[12px] text-slate-400 mt-0.5">{card.desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent activity placeholder */}
            <div className="rounded-xl bg-[#181b25] border border-white/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <h2 className="text-[13.5px] font-semibold text-slate-200">Atividade recente</h2>
                </div>
                <div className="text-center py-10 text-slate-500 text-[13px]">
                    Sem eventos ainda. Quando empresas começarem a usar, eles aparecem aqui.
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label, value, loading, icon: Icon, trend, highlight, danger,
}: {
    label: string;
    value: number | undefined;
    loading: boolean;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    highlight?: boolean;
    danger?: boolean;
}) {
    return (
        <div className={`rounded-xl bg-[#181b25] border p-4 ${
            danger ? 'border-rose-500/30' : highlight ? 'border-amber-500/30' : 'border-white/5'
        }`}>
            <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-medium text-slate-400 uppercase tracking-wider">
                    {label}
                </span>
                <Icon className={`w-4 h-4 ${
                    danger ? 'text-rose-400' : highlight ? 'text-amber-400' : 'text-slate-500'
                }`} />
            </div>
            <div className="mt-3">
                {loading ? (
                    <div className="h-8 w-16 bg-white/5 rounded animate-pulse" />
                ) : (
                    <div className={`text-2xl font-bold ${
                        danger ? 'text-rose-300' : highlight ? 'text-amber-300' : 'text-white'
                    }`}>
                        {value ?? 0}
                    </div>
                )}
            </div>
            {trend && !loading && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                </div>
            )}
        </div>
    );
}
