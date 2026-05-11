import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Warehouse,
    ShoppingBag, Percent, Receipt,
} from 'lucide-react';
import { DASHBOARD_OVERVIEW } from '../../graphql/queries/dashboard';

interface Overview {
    daily: { sales: number; profit: number; cost: number; ordersCount: number };
    monthly: { sales: number; profit: number; expenses: number; cost: number };
    margin: number;
    sales30Days: Array<{ date: string; sales: number; orders: number }>;
    revenueVsExpenses6m: Array<{ month: string; revenue: number; expenses: number }>;
    expensesByCategory: Array<{ category: string; amount: number }>;
    topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
    topCategoriesByRevenue: Array<{ categoryId: string | null; name: string; revenue: number }>;
    inventory: {
        totalProducts: number;
        totalStockValue: number;
        lowStockCount: number;
        lowStockItems: Array<{ id: string; name: string; quantity: number; minStock: number }>;
    };
}

function brl(v: number, compact = false) {
    return v.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: compact ? 0 : 2,
    });
}

const PIE_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#06b6d4', '#84cc16', '#ec4899'];

export function DashboardOverview() {
    const { data, loading } = useQuery<{ dashboardOverview: Overview }>(DASHBOARD_OVERVIEW, {
        fetchPolicy: 'cache-and-network',
        pollInterval: 60000,
    });

    const ov = data?.dashboardOverview;

    const sales30Chart = useMemo(
        () => ov?.sales30Days.map((d) => ({
            d: d.date.slice(5),
            Vendas: Math.round(d.sales),
            Pedidos: d.orders,
        })) ?? [],
        [ov],
    );

    if (loading && !ov) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center text-slate-500">
                Carregando visão geral…
            </div>
        );
    }
    if (!ov) return null;

    return (
        <div className="space-y-5">
            {/* KPIs principais — Dia */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi
                    icon={DollarSign}
                    label="Vendas hoje"
                    value={brl(ov.daily.sales)}
                    sub={`${ov.daily.ordersCount} pedido(s)`}
                    color="emerald"
                />
                <Kpi
                    icon={TrendingUp}
                    label="Lucro hoje"
                    value={brl(ov.daily.profit)}
                    sub={ov.daily.profit >= 0 ? 'positivo' : 'negativo'}
                    color={ov.daily.profit >= 0 ? 'violet' : 'rose'}
                />
                <Kpi
                    icon={Percent}
                    label="Margem (mês)"
                    value={`${ov.margin.toFixed(1)}%`}
                    sub="lucro / receita"
                    color={ov.margin >= 0 ? 'blue' : 'rose'}
                />
                <Kpi
                    icon={Receipt}
                    label="Despesas (mês)"
                    value={brl(ov.monthly.expenses, true)}
                    sub={`Receita: ${brl(ov.monthly.sales, true)}`}
                    color="amber"
                />
            </div>

            {/* KPIs Estoque */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Kpi
                    icon={Package}
                    label="Produtos cadastrados"
                    value={ov.inventory.totalProducts.toLocaleString('pt-BR')}
                    color="blue"
                />
                <Kpi
                    icon={Warehouse}
                    label="Custo do estoque"
                    value={brl(ov.inventory.totalStockValue, true)}
                    sub="qtd × custo médio"
                    color="violet"
                />
                <Kpi
                    icon={AlertTriangle}
                    label="Itens em alerta"
                    value={ov.inventory.lowStockCount.toString()}
                    sub="estoque ≤ mínimo"
                    color={ov.inventory.lowStockCount > 0 ? 'rose' : 'emerald'}
                />
            </div>

            {/* Vendas últimos 30 dias */}
            <Section title="📈 Vendas — últimos 30 dias">
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={sales30Chart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="d" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brl(v, true)} />
                        <Tooltip formatter={(v: any) => brl(Number(v))} />
                        <Line type="monotone" dataKey="Vendas" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Section>

            {/* Receitas vs Despesas (6 meses) + Despesas por categoria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="💸 Receitas × Despesas (6 meses)">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={ov.revenueVsExpenses6m.map((m) => ({ mes: m.month, Receita: m.revenue, Despesa: m.expenses }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => brl(v, true)} />
                            <Tooltip formatter={(v: any) => brl(Number(v))} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="Receita" fill="#10b981" />
                            <Bar dataKey="Despesa" fill="#f43f5e" />
                        </BarChart>
                    </ResponsiveContainer>
                </Section>

                <Section title="📊 Despesas por categoria (mês)">
                    {ov.expensesByCategory.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-12">Sem despesas no mês.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={ov.expensesByCategory.map((c) => ({ name: c.category, value: c.amount }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={(p: any) => `${p.name} ${(p.percent * 100).toFixed(0)}%`}
                                    fontSize={10}
                                >
                                    {ov.expensesByCategory.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => brl(Number(v))} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Section>
            </div>

            {/* Top produtos + Top categorias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="🏆 Top 5 produtos (mês)" subtitle="Por receita">
                    {ov.topProducts.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6">Sem vendas no mês.</p>
                    ) : (
                        <ol className="space-y-2">
                            {ov.topProducts.map((p, i) => (
                                <li key={p.productId} className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 grid place-items-center text-[10px] font-bold shrink-0">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                                    </span>
                                    <span className="text-sm font-semibold tabular-nums text-violet-700 shrink-0">{brl(p.revenue)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>

                <Section title="🏷️ Top categorias por receita" subtitle="Mês">
                    {ov.topCategoriesByRevenue.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6">Sem categorias com receita.</p>
                    ) : (
                        <ol className="space-y-2">
                            {ov.topCategoriesByRevenue.map((c, i) => {
                                const max = Math.max(...ov.topCategoriesByRevenue.map((x) => x.revenue));
                                const pct = max > 0 ? (c.revenue / max) * 100 : 0;
                                return (
                                    <li key={i}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
                                            <span className="font-semibold tabular-nums text-emerald-700">{brl(c.revenue)}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded mt-1 overflow-hidden">
                                            <div className="h-1.5 bg-emerald-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </Section>
            </div>

            {/* Itens em alerta */}
            {ov.inventory.lowStockItems.length > 0 && (
                <Section title="⚠️ Estoque em alerta">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10.5px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-white/10">
                                <th className="py-1.5">Produto</th>
                                <th className="text-right">Atual</th>
                                <th className="text-right">Mínimo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ov.inventory.lowStockItems.map((it) => (
                                <tr key={it.id} className="border-b border-slate-100 dark:border-white/5">
                                    <td className="py-1.5 text-slate-700 dark:text-slate-300">{it.name}</td>
                                    <td className="text-right tabular-nums text-rose-600 font-semibold">{it.quantity}</td>
                                    <td className="text-right tabular-nums text-slate-500">{it.minStock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Section>
            )}
        </div>
    );
}

function Kpi({
    icon: Icon, label, value, sub, color,
}: {
    icon: any;
    label: string;
    value: string;
    sub?: string;
    color: 'emerald' | 'violet' | 'blue' | 'rose' | 'amber';
}) {
    const colors: Record<string, string> = {
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
        violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
        blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
        rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
        amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    };
    return (
        <div className={`border rounded-xl p-3 ${colors[color]}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span className="text-[10.5px] uppercase tracking-wider opacity-90">{label}</span>
            </div>
            <div className="text-lg font-bold tabular-nums leading-tight">{value}</div>
            {sub && <div className="text-[10.5px] opacity-70 mt-0.5">{sub}</div>}
        </div>
    );
}

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
            </div>
            {children}
        </div>
    );
}
