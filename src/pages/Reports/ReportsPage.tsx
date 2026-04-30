import { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/ui/StatCard';

type Period = '7d' | '30d' | '90d' | 'ytd' | 'custom';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  ytd: 'Este ano',
  custom: 'Personalizado',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
const formatNumber = (n: number) =>
  new Intl.NumberFormat('pt-BR').format(n);

// Gera dados mockados estáveis a partir do período (substituir por GraphQL)
function generateMockData(period: Period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const series = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const base = 4500 + Math.sin(i / 3) * 1200 + Math.cos(i / 5) * 800;
    const venda = Math.round(base + Math.random() * 800);
    const compra = Math.round(base * 0.62 + Math.random() * 400);
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 30) - i - 1));
    return {
      name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      vendas: venda,
      compras: compra,
      lucro: venda - compra,
    };
  });

  const categories = [
    { name: 'Eletrônicos', value: 45200 },
    { name: 'Vestuário', value: 28900 },
    { name: 'Alimentação', value: 19400 },
    { name: 'Móveis', value: 14800 },
    { name: 'Outros', value: 9200 },
  ];

  const topProducts = [
    { name: 'Notebook Dell Inspiron 15', sku: 'PROD-0001', sales: 142, revenue: 419800 },
    { name: 'Mouse Gamer Logitech G502', sku: 'PROD-0023', sales: 318, revenue: 89160 },
    { name: 'Teclado Mecânico Keychron', sku: 'PROD-0045', sales: 256, revenue: 71680 },
    { name: 'Monitor 27" 4K', sku: 'PROD-0008', sales: 87, revenue: 226200 },
    { name: 'Cadeira Gamer DXRacer', sku: 'PROD-0012', sales: 64, revenue: 191360 },
  ];

  return { series, categories, topProducts };
}

const PIE_COLORS = ['#8b5cf6', '#10b981', '#0ea5e9', '#f59e0b', '#94a3b8'];

export function ReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const data = useMemo(() => generateMockData(period), [period]);

  const totalSales = data.series.reduce((s, d) => s + d.vendas, 0);
  const totalPurchases = data.series.reduce((s, d) => s + d.compras, 0);
  const totalProfit = totalSales - totalPurchases;
  const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  // Comparação com período anterior (mock: 18% de crescimento)
  const salesDelta = 18.4;
  const profitDelta = 22.1;
  const ordersDelta = -3.2;

  function refresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="space-y-8 px-4 lg:px-8 py-6 w-full">
      {/* Header SaaS */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Relatórios</h1>
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-medium text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded">
              <BarChart3 className="w-2.5 h-2.5" strokeWidth={2.5} />
              Analytics
            </span>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Análise consolidada de vendas, estoque e desempenho
            {user?.name && <> · {user.name.split(' ')[0]}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            Atualizar
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors">
            <FileText className="w-3.5 h-3.5" strokeWidth={2} />
            PDF
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11.5px] text-slate-500 dark:text-slate-400">
          <Filter className="w-3 h-3" strokeWidth={2} />
          Período
        </span>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`h-7 px-2.5 text-[12px] font-medium rounded-md transition-colors ${
              period === p
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/15'
            }`}
          >
            {p === 'custom' && <Calendar className="w-3 h-3 inline mr-1" strokeWidth={2} />}
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          tone="emerald"
          label="Receita total"
          value={totalSales}
          format="currency"
          delta={salesDelta}
          trend={data.series.map(d => d.vendas)}
          hint={`vs período anterior`}
          icon={<DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="violet"
          label="Lucro líquido"
          value={totalProfit}
          format="currency"
          delta={profitDelta}
          trend={data.series.map(d => d.lucro)}
          hint={`margem ${margin.toFixed(1)}%`}
          icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="sky"
          label="Pedidos"
          value={data.series.length * 47}
          format="number"
          delta={ordersDelta}
          hint="ticket médio R$ 287"
          icon={<ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="amber"
          label="Custo total"
          value={totalPurchases}
          format="currency"
          trend={data.series.map(d => d.compras)}
          hint={`${((totalPurchases / totalSales) * 100).toFixed(1)}% da receita`}
          icon={<Package className="w-3.5 h-3.5" strokeWidth={2} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Vendas vs Compras (área) */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Receita vs Custo</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{PERIOD_LABELS[period]}</p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Vendas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Compras
              </span>
            </div>
          </div>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="vendasFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="comprasFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'rgb(15 23 42)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 8, fontSize: 12, color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={1.75} fill="url(#vendasFill)" />
                <Area type="monotone" dataKey="compras" stroke="#f59e0b" strokeWidth={1.75} fill="url(#comprasFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categorias (donut) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Vendas por categoria</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Distribuição da receita</p>
          </div>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categories}
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {data.categories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgb(15 23 42)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 8, fontSize: 12, color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: 'rgb(100 116 139)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top produtos + Lucro */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Top produtos */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Top produtos</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Maior volume de receita no período</p>
            </div>
            <button className="text-[11.5px] font-medium text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300">
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-white/[0.02]">
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  <th className="text-left text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400 px-5 py-2.5">Produto</th>
                  <th className="text-left text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400 px-5 py-2.5">SKU</th>
                  <th className="text-right text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400 px-5 py-2.5">Qtd</th>
                  <th className="text-right text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400 px-5 py-2.5">Receita</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={p.sku} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-white/[0.06] text-[11px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {i + 1}
                        </span>
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-slate-500 dark:text-slate-400 font-mono">{p.sku}</td>
                    <td className="px-5 py-3 text-[12.5px] text-right text-slate-700 dark:text-slate-200 tabular-nums">{formatNumber(p.sales)}</td>
                    <td className="px-5 py-3 text-[12.5px] text-right font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lucro por dia (bars) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Lucro diário</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Tendência no período</p>
          </div>
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series.slice(-14)} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'rgb(15 23 42)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 8, fontSize: 12, color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="lucro" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Insights do período</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Destaques automáticos baseados em desvios significativos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/[0.06]">
          <Insight
            tone="emerald"
            icon={<ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.25} />}
            title="Receita em alta"
            value="+18.4%"
            text="Vendas cresceram em relação ao período anterior. Categoria Eletrônicos liderou com 36% do total."
          />
          <Insight
            tone="amber"
            icon={<Package className="w-3.5 h-3.5" strokeWidth={2.25} />}
            title="Atenção ao estoque"
            value="3 SKUs"
            text="Produtos com estoque abaixo do mínimo. Notebook Dell e Mouse Gamer requerem reposição."
          />
          <Insight
            tone="rose"
            icon={<ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.25} />}
            title="Pedidos em queda"
            value="−3.2%"
            text="Pequena redução no volume de pedidos, mas ticket médio compensou. Avaliar campanhas."
          />
        </div>
      </div>
    </div>
  );
}

function Insight({
  tone,
  icon,
  title,
  value,
  text,
}: {
  tone: 'emerald' | 'amber' | 'rose';
  icon: React.ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    amber:   'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    rose:    'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
  } as const;
  const valueTones = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber:   'text-amber-700 dark:text-amber-400',
    rose:    'text-rose-700 dark:text-rose-400',
  } as const;

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-7 h-7 rounded-md ring-1 flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-[12.5px] font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className={`ml-auto text-[12.5px] font-semibold tabular-nums ${valueTones[tone]}`}>{value}</span>
      </div>
      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}
