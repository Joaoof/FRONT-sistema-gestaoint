import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
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
import { GET_ORDERS } from '../../graphql/queries/orders';
import { LIST_PRODUCTS_WITH_IMAGES } from '../../graphql/mutations/product-with-images';
import { GET_ACTIVE_CATEGORIES } from '../../graphql/queries/categories';

type Period = '7d' | '30d' | '90d' | 'ytd' | 'custom';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  ytd: 'Este ano',
  custom: 'Tudo',
};

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  ytd: 365,
  custom: 9999,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
const formatNumber = (n: number) =>
  new Intl.NumberFormat('pt-BR').format(n);

interface OrderRow {
  id: string;
  number: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
  subtotal?: number | null;
  discount?: number | null;
  total: number;
  createdAt: string;
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> | null;
}

interface ProductRow {
  id: string;
  sku: string | null;
  nameProduct: string;
  costPrice: number;
  salePrice: number;
}

interface CategoryRow {
  id: string;
  name: string;
  color: string;
}

const PIE_COLORS = ['#8b5cf6', '#10b981', '#0ea5e9', '#f59e0b', '#94a3b8', '#ec4899', '#22d3ee'];

function startOfPeriod(period: Period): Date {
  const now = new Date();
  if (period === 'ytd') return new Date(now.getFullYear(), 0, 1);
  if (period === 'custom') return new Date(2000, 0, 1);
  const d = new Date(now);
  d.setDate(d.getDate() - PERIOD_DAYS[period] + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function previousRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  if (period === 'ytd') {
    return {
      start: new Date(now.getFullYear() - 1, 0, 1),
      end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
    };
  }
  const days = PERIOD_DAYS[period];
  const end = startOfPeriod(period);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start, end };
}

export function ReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');

  const { data: ordersData, loading: loadingOrders, refetch: refetchOrders } = useQuery<{ orders: OrderRow[] }>(
    GET_ORDERS,
    { fetchPolicy: 'cache-and-network' },
  );
  const { data: productsData } = useQuery<{ products: ProductRow[] }>(LIST_PRODUCTS_WITH_IMAGES, {
    variables: { take: 500, skip: 0 },
    fetchPolicy: 'cache-first',
  });
  const { data: categoriesData } = useQuery<{ activeCategories: CategoryRow[] }>(GET_ACTIVE_CATEGORIES, {
    fetchPolicy: 'cache-first',
  });

  const allOrders = ordersData?.orders ?? [];
  const products = productsData?.products ?? [];
  const categories = categoriesData?.activeCategories ?? [];

  // Filtra pedidos não cancelados/reembolsados (consideram-se vendas válidas)
  const validOrders = useMemo(
    () => allOrders.filter((o) => o.status !== 'CANCELED' && o.status !== 'REFUNDED'),
    [allOrders],
  );

  const periodStart = useMemo(() => startOfPeriod(period), [period]);
  const periodOrders = useMemo(
    () => validOrders.filter((o) => new Date(o.createdAt) >= periodStart),
    [validOrders, periodStart],
  );

  // Mapa productId → costPrice
  const costMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.id, Number(p.costPrice));
    return m;
  }, [products]);

  // Série diária (vendas, custo estimado, lucro estimado)
  const series = useMemo(() => {
    const days = period === 'ytd' ? 365 : PERIOD_DAYS[period];
    const buckets: Record<string, { vendas: number; compras: number }> = {};
    const labels: string[] = [];
    const slots = Math.min(days, 30);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bucketiza últimos N dias (ou no caso "ytd"/"custom" agrega por mês)
    const groupByMonth = period === 'ytd' || period === 'custom';

    if (groupByMonth) {
      // 12 meses do ano corrente
      for (let m = 0; m < 12; m++) {
        const key = `${today.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
        buckets[key] = { vendas: 0, compras: 0 };
        labels.push(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m]);
      }
      for (const o of periodOrders) {
        const d = new Date(o.createdAt);
        if (d.getFullYear() !== today.getFullYear()) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!buckets[key]) continue;
        buckets[key].vendas += Number(o.total);
        // Custo estimado: somatório de cost * qty dos itens
        for (const it of o.items ?? []) {
          buckets[key].compras += (costMap.get(it.productId) ?? 0) * Number(it.quantity);
        }
      }
      return Object.keys(buckets).map((key, i) => ({
        name: labels[i],
        vendas: Math.round(buckets[key].vendas),
        compras: Math.round(buckets[key].compras),
        lucro: Math.round(buckets[key].vendas - buckets[key].compras),
      }));
    }

    // Diário: últimos `slots` dias
    for (let i = slots - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { vendas: 0, compras: 0 };
      labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
    }

    for (const o of periodOrders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!buckets[key]) continue;
      buckets[key].vendas += Number(o.total);
      for (const it of o.items ?? []) {
        buckets[key].compras += (costMap.get(it.productId) ?? 0) * Number(it.quantity);
      }
    }

    return Object.keys(buckets).map((key, i) => ({
      name: labels[i],
      vendas: Math.round(buckets[key].vendas),
      compras: Math.round(buckets[key].compras),
      lucro: Math.round(buckets[key].vendas - buckets[key].compras),
    }));
  }, [periodOrders, period, costMap]);

  // KPIs
  const totalSales = useMemo(() => periodOrders.reduce((s, o) => s + Number(o.total), 0), [periodOrders]);
  const totalCost = useMemo(() => series.reduce((s, d) => s + d.compras, 0), [series]);
  const totalProfit = totalSales - totalCost;
  const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const orderCount = periodOrders.length;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

  // Comparação com período anterior
  const prevRange = useMemo(() => previousRange(period), [period]);
  const prevOrders = useMemo(
    () =>
      validOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= prevRange.start && d < prevRange.end;
      }),
    [validOrders, prevRange],
  );
  const prevSales = prevOrders.reduce((s, o) => s + Number(o.total), 0);
  const prevCount = prevOrders.length;
  const salesDelta = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;
  const ordersDelta = prevCount > 0 ? ((orderCount - prevCount) / prevCount) * 100 : 0;
  const profitDelta = salesDelta; // proxy razoável quando não temos custo histórico

  // Categorias (mapeia produtos do pedido → categoria via product → categoryId? products query não traz categoryId)
  // Como `LIST_PRODUCTS_WITH_IMAGES` não inclui categoryId, agrupamos por **produto** mais vendido como proxy de "categoria"
  const productSales = useMemo(() => {
    const m = new Map<string, { name: string; sku: string | null; sales: number; revenue: number }>();
    for (const o of periodOrders) {
      for (const it of o.items ?? []) {
        const p = products.find((pp) => pp.id === it.productId);
        const key = it.productId;
        const entry = m.get(key) ?? {
          name: it.productName,
          sku: p?.sku ?? null,
          sales: 0,
          revenue: 0,
        };
        entry.sales += Number(it.quantity);
        entry.revenue += Number(it.total);
        m.set(key, entry);
      }
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [periodOrders, products]);

  const topProducts = productSales.slice(0, 5);

  // Distribuição de receita por nome do produto (top 5 + Outros)
  const revenueDistribution = useMemo(() => {
    if (productSales.length === 0) return [];
    const top = productSales.slice(0, 5).map((p) => ({ name: p.name, value: Math.round(p.revenue) }));
    const othersTotal = productSales.slice(5).reduce((s, p) => s + p.revenue, 0);
    if (othersTotal > 0) top.push({ name: 'Outros', value: Math.round(othersTotal) });
    return top;
  }, [productSales]);

  // Insights dinâmicos
  const insights = useMemo(() => {
    const arr: { tone: 'emerald' | 'amber' | 'rose'; title: string; value: string; text: string; icon: 'up' | 'down' | 'pkg' }[] = [];
    if (salesDelta > 0) {
      arr.push({
        tone: 'emerald',
        title: 'Receita em alta',
        value: `+${salesDelta.toFixed(1)}%`,
        text: `Vendas cresceram em relação ao período anterior. Total: ${formatCurrency(totalSales)}.`,
        icon: 'up',
      });
    } else if (salesDelta < 0) {
      arr.push({
        tone: 'rose',
        title: 'Receita em queda',
        value: `${salesDelta.toFixed(1)}%`,
        text: `Vendas reduziram em relação ao período anterior. Avalie campanhas e reposição.`,
        icon: 'down',
      });
    }
    if (topProducts[0]) {
      const share = totalSales > 0 ? (topProducts[0].revenue / totalSales) * 100 : 0;
      arr.push({
        tone: 'emerald',
        title: 'Produto destaque',
        value: `${share.toFixed(0)}%`,
        text: `${topProducts[0].name} responde por ${share.toFixed(1)}% da receita do período.`,
        icon: 'up',
      });
    }
    const lowStock = products.filter((p) => Number((p as any).quantity ?? 0) < 5);
    if (lowStock.length > 0) {
      arr.push({
        tone: 'amber',
        title: 'Atenção ao estoque',
        value: `${lowStock.length} SKUs`,
        text: `Produtos com estoque crítico. Verifique a página de alertas para reposição.`,
        icon: 'pkg',
      });
    }
    return arr.slice(0, 3);
  }, [salesDelta, topProducts, totalSales, products]);

  function exportCSV() {
    const headers = ['#', 'Pedido', 'Data', 'Status', 'Total'];
    const rows = periodOrders.map((o) => [
      o.id,
      `#${o.number}`,
      new Date(o.createdAt).toLocaleString('pt-BR'),
      o.status,
      Number(o.total).toFixed(2).replace('.', ','),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${PERIOD_LABELS[period].toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 px-4 lg:px-8 py-6 w-full">
      {/* Header */}
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
            onClick={() => refetchOrders()}
            disabled={loadingOrders}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} strokeWidth={2} />
            Atualizar
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Exportar CSV
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
          trend={series.map((d) => d.vendas)}
          hint="vs período anterior"
          icon={<DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="violet"
          label="Lucro estimado"
          value={totalProfit}
          format="currency"
          delta={profitDelta}
          trend={series.map((d) => d.lucro)}
          hint={`margem ${margin.toFixed(1)}%`}
          icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="sky"
          label="Pedidos"
          value={orderCount}
          format="number"
          delta={ordersDelta}
          hint={orderCount > 0 ? `ticket médio ${formatCurrency(avgTicket)}` : 'sem pedidos'}
          icon={<ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="amber"
          label="Custo (CMV)"
          value={totalCost}
          format="currency"
          trend={series.map((d) => d.compras)}
          hint={totalSales > 0 ? `${((totalCost / totalSales) * 100).toFixed(1)}% da receita` : '—'}
          icon={<Package className="w-3.5 h-3.5" strokeWidth={2} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Receita vs Custo */}
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
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Custo
              </span>
            </div>
          </div>
          <div className="h-72 p-4">
            {series.length === 0 || totalSales === 0 ? (
              <EmptyChart hint="Sem dados de vendas no período selecionado" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
            )}
          </div>
        </div>

        {/* Distribuição de receita por produto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Receita por produto</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Top 5 + outros</p>
          </div>
          <div className="h-72 p-4">
            {revenueDistribution.length === 0 ? (
              <EmptyChart hint="Sem dados" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueDistribution} innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" nameKey="name" stroke="none">
                    {revenueDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgb(15 23 42)', border: '1px solid rgb(255 255 255 / 0.1)', borderRadius: 8, fontSize: 12, color: 'white' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'rgb(100 116 139)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top produtos + Lucro diário */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Top produtos</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Maior volume de receita no período</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="px-5 py-12 text-center text-[13px] text-slate-500">
                Nenhuma venda no período selecionado.
              </div>
            ) : (
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
                  {topProducts.map((p, i) => (
                    <tr key={p.sku ?? p.name} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-white/[0.06] text-[11px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            {i + 1}
                          </span>
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-slate-500 dark:text-slate-400 font-mono">{p.sku ?? '—'}</td>
                      <td className="px-5 py-3 text-[12.5px] text-right text-slate-700 dark:text-slate-200 tabular-nums">{formatNumber(p.sales)}</td>
                      <td className="px-5 py-3 text-[12.5px] text-right font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Lucro {period === 'ytd' || period === 'custom' ? 'mensal' : 'diário'}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Tendência no período</p>
          </div>
          <div className="h-72 p-4">
            {series.length === 0 || totalSales === 0 ? (
              <EmptyChart hint="Sem dados" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series.slice(-14)} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Insights do período</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Destaques calculados automaticamente</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/[0.06]">
            {insights.map((i, idx) => (
              <Insight
                key={idx}
                tone={i.tone}
                icon={
                  i.icon === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.25} /> :
                  i.icon === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.25} /> :
                  <Package className="w-3.5 h-3.5" strokeWidth={2.25} />
                }
                title={i.title}
                value={i.value}
                text={i.text}
              />
            ))}
          </div>
        </div>
      )}

      {/* Aviso se carregando ou sem categorias */}
      {categories.length === 0 && !loadingOrders && (
        <p className="text-[11.5px] text-slate-400 dark:text-slate-500 text-center">
          Cadastre categorias em <span className="text-violet-600">/categorias</span> para enriquecer a análise.
        </p>
      )}
    </div>
  );
}

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
      <FileText className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-[12px]">{hint}</p>
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
    amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
  } as const;
  const valueTones = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
    rose: 'text-rose-700 dark:text-rose-400',
  } as const;

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-7 h-7 rounded-md ring-1 flex items-center justify-center ${tones[tone]}`}>{icon}</span>
        <span className="text-[12.5px] font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className={`ml-auto text-[12.5px] font-semibold tabular-nums ${valueTones[tone]}`}>{value}</span>
      </div>
      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{text}</p>
    </div>
  );
}
