import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, FileSpreadsheet, Wallet } from 'lucide-react';
import { CASH_FLOW_PROJECTION, DRE_REPORT } from '../../graphql/queries/financials';

interface CashFlowDay {
    date: string;
    expectedIn: number;
    expectedOut: number;
    netForDay: number;
    cumulativeBalance: number;
}
interface CashFlowResp {
    cashFlowProjection: {
        startBalance: number;
        days: CashFlowDay[];
        totalIn: number;
        totalOut: number;
        finalBalance: number;
    };
}

interface DREMonth {
    month: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    netIncome: number;
}
interface DREResp {
    dreReport: {
        from: string;
        to: string;
        months: DREMonth[];
        totals: { revenue: number; cogs: number; grossProfit: number; expenses: number; netIncome: number };
    };
}

function brl(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
function brlFull(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Tab = 'projection' | 'dre';

export function FinancialReportsPage() {
    const [tab, setTab] = useState<Tab>('projection');
    const [days, setDays] = useState(90);

    const { data: cfData, loading: cfLoading } = useQuery<CashFlowResp>(CASH_FLOW_PROJECTION, {
        variables: { days },
        fetchPolicy: 'cache-and-network',
    });
    const { data: dreData, loading: dreLoading } = useQuery<DREResp>(DRE_REPORT, {
        fetchPolicy: 'cache-and-network',
    });

    const cf = cfData?.cashFlowProjection;
    const dre = dreData?.dreReport;

    const chartData = useMemo(
        () => cf?.days.map((d) => ({
            date: d.date.slice(5),
            'Saldo projetado': Math.round(d.cumulativeBalance),
            Entradas: Math.round(d.expectedIn),
            Saídas: Math.round(d.expectedOut),
        })) ?? [],
        [cf],
    );

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    Relatórios financeiros
                </h1>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                    Fluxo de caixa projetado e Demonstrativo de Resultados (DRE) gerencial.
                </p>
            </div>

            <div className="flex gap-1 border-b border-slate-200 dark:border-white/[0.06] -mb-px">
                <button
                    onClick={() => setTab('projection')}
                    className={`px-4 py-2.5 text-[13px] font-medium border-b-2 ${tab === 'projection' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                >
                    📈 Fluxo projetado
                </button>
                <button
                    onClick={() => setTab('dre')}
                    className={`px-4 py-2.5 text-[13px] font-medium border-b-2 ${tab === 'dre' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                >
                    📊 DRE mensal
                </button>
            </div>

            {tab === 'projection' && (
                <div className="space-y-4">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Kpi label="Saldo atual" value={brl(cf?.startBalance ?? 0)} color="blue" />
                        <Kpi label="Entradas esperadas" value={brl(cf?.totalIn ?? 0)} color="emerald" />
                        <Kpi label="Saídas esperadas" value={brl(cf?.totalOut ?? 0)} color="rose" />
                        <Kpi label="Saldo final" value={brl(cf?.finalBalance ?? 0)} color="violet" />
                    </div>

                    {/* Seletor de janela */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Horizonte:</span>
                        {[30, 60, 90, 180].map((d) => (
                            <button key={d}
                                onClick={() => setDays(d)}
                                className={`px-3 py-1 text-[12px] rounded ${days === d ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                                {d} dias
                            </button>
                        ))}
                    </div>

                    {/* Gráfico */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                        {cfLoading && !cf ? (
                            <div className="text-center py-12 text-slate-500">Carregando projeção…</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => brl(v)} />
                                    <Tooltip formatter={(v: any) => brlFull(Number(v))} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Saldo projetado" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={1} dot={false} />
                                    <Line type="monotone" dataKey="Saídas" stroke="#f43f5e" strokeWidth={1} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Tabela detalhada (próximos 14 dias) */}
                    {cf && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 text-sm font-semibold">Próximos 14 dias</div>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Data</th>
                                        <th className="text-right">Entradas</th>
                                        <th className="text-right">Saídas</th>
                                        <th className="text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cf.days.slice(0, 14).map((d) => (
                                        <tr key={d.date} className="border-b border-slate-100 dark:border-white/5">
                                            <td className="px-4 py-1.5">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="text-right tabular-nums text-emerald-700">{brl(d.expectedIn)}</td>
                                            <td className="text-right tabular-nums text-rose-600">{brl(d.expectedOut)}</td>
                                            <td className="text-right tabular-nums font-semibold">{brl(d.cumulativeBalance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'dre' && (
                <div className="space-y-4">
                    {dreLoading && !dre ? (
                        <div className="text-center py-12 text-slate-500">Carregando DRE…</div>
                    ) : dre ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <Kpi label="Receita" value={brl(dre.totals.revenue)} color="emerald" />
                                <Kpi label="CMV" value={brl(dre.totals.cogs)} color="amber" />
                                <Kpi label="Lucro Bruto" value={brl(dre.totals.grossProfit)} color="blue" />
                                <Kpi label="Despesas" value={brl(dre.totals.expenses)} color="rose" />
                                <Kpi label="Lucro Líquido" value={brl(dre.totals.netIncome)} color="violet" highlight={dre.totals.netIncome < 0} />
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dre.months.map((m) => ({ ...m, mes: m.month }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={brl} />
                                        <Tooltip formatter={(v: any) => brlFull(Number(v))} />
                                        <Legend />
                                        <Bar dataKey="revenue" name="Receita" fill="#10b981" />
                                        <Bar dataKey="cogs" name="CMV" fill="#f59e0b" />
                                        <Bar dataKey="expenses" name="Despesas" fill="#f43f5e" />
                                        <Bar dataKey="netIncome" name="Lucro Líquido" fill="#8b5cf6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Mês</th>
                                            <th className="text-right">Receita</th>
                                            <th className="text-right">CMV</th>
                                            <th className="text-right">Lucro Bruto</th>
                                            <th className="text-right">Despesas</th>
                                            <th className="text-right pr-4">Lucro Líquido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dre.months.map((m) => (
                                            <tr key={m.month} className="border-b border-slate-100 dark:border-white/5">
                                                <td className="px-4 py-1.5 font-medium">{m.month}</td>
                                                <td className="text-right tabular-nums text-emerald-700">{brlFull(m.revenue)}</td>
                                                <td className="text-right tabular-nums text-amber-700">{brlFull(m.cogs)}</td>
                                                <td className="text-right tabular-nums">{brlFull(m.grossProfit)}</td>
                                                <td className="text-right tabular-nums text-rose-600">{brlFull(m.expenses)}</td>
                                                <td className={`text-right tabular-nums pr-4 font-semibold ${m.netIncome < 0 ? 'text-rose-600' : 'text-violet-700'}`}>{brlFull(m.netIncome)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 dark:bg-slate-950/60 font-bold">
                                        <tr>
                                            <td className="px-4 py-2">Total</td>
                                            <td className="text-right tabular-nums">{brlFull(dre.totals.revenue)}</td>
                                            <td className="text-right tabular-nums">{brlFull(dre.totals.cogs)}</td>
                                            <td className="text-right tabular-nums">{brlFull(dre.totals.grossProfit)}</td>
                                            <td className="text-right tabular-nums">{brlFull(dre.totals.expenses)}</td>
                                            <td className={`text-right tabular-nums pr-4 ${dre.totals.netIncome < 0 ? 'text-rose-600' : 'text-violet-700'}`}>{brlFull(dre.totals.netIncome)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function Kpi({ label, value, color, highlight }: { label: string; value: string; color: 'blue' | 'emerald' | 'rose' | 'violet' | 'amber'; highlight?: boolean }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300',
        rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300',
        violet: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300',
        amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300',
    };
    return (
        <div className={`border rounded-xl p-3 ${colors[color]} ${highlight ? 'ring-2 ring-rose-400' : ''}`}>
            <div className="text-[10.5px] uppercase tracking-wider opacity-80">{label}</div>
            <div className="text-lg font-bold tabular-nums mt-0.5">{value}</div>
        </div>
    );
}
