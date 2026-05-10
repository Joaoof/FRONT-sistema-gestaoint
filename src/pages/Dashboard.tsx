import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { InventoryData } from '../hooks/useInventory';
import { useAuth } from '../contexts/AuthContext';
import {
  Package, BarChart3, ShoppingCart, DollarSign, TrendingUp, Wallet,
  ArrowRight, User, Percent, AlertTriangle, Trophy, Layers,
  ArrowLeftRight, Receipt, Settings, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { LowStockAlert } from '../components/LowStockAlert';
import { RecentActivityWidget } from '../components/RecentActivityWidget';
import { DashboardCharts } from '../components/DashboardCharts';
import { RevenueHeroCard } from '../components/RevenueHeroCard';
import { InsightCard } from '../components/insights/InsightCard';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

type Period = '7d' | '30d' | '90d' | 'year' | 'all';

const PERIOD_LABEL: Record<Period, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  year: 'Ano',
  all: 'Tudo',
};

const PERIOD_DAYS: Record<Period, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  year: 365,
  all: null,
};

// Função utilitária DRY para calcular dados mensais
const getMonthlyData = (
  entries: InventoryData['entries'],
  key: 'sellingPrice' | 'costPrice'
) => {
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date;
  });

  return last12Months.map((date) =>
    entries
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      })
      .reduce((sum, e) => sum + e[key] * e.quantity, 0)
  );
};

export function Dashboard({
  entries,
  products,
  getDailyRevenue,
  getDailyProfit,
}: InventoryData) {
  const dailyRevenue = getDailyRevenue();
  const dailyProfit = getDailyProfit();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dados para gráficos
  const revenueData = getMonthlyData(entries, 'sellingPrice');
  const spendingData = getMonthlyData(entries, 'costPrice');

  // Dados para gráfico de pizza (despesas por categoria)
  const categorySpending = entries.reduce((acc, entry) => {
    const spending = entry.costPrice * entry.quantity;
    acc[entry.category] = (acc[entry.category] || 0) + spending;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categorySpending).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date;
  });

  const isEmptyData = revenueData.every((v) => v === 0) && spendingData.every((v) => v === 0);

  // Filtrar entries pelo período selecionado
  const filteredEntries = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (days === null) return entries;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter((e) => new Date(e.date) >= cutoff);
  }, [entries, period]);

  // Métricas do período
  const periodRevenue = filteredEntries.reduce((s, e) => s + e.sellingPrice * e.quantity, 0);
  const periodCost = filteredEntries.reduce((s, e) => s + e.costPrice * e.quantity, 0);
  const periodProfit = periodRevenue - periodCost;
  const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;
  const periodItems = filteredEntries.reduce((s, e) => s + e.quantity, 0);

  // KPIs
  const totalCost = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const last3 = revenueData.slice(-3);
  const prev3 = revenueData.slice(-6, -3);
  const sumLast = last3.reduce((a, b) => a + b, 0);
  const sumPrev = prev3.reduce((a, b) => a + b, 0);
  const revenueDelta = sumPrev > 0 ? ((sumLast - sumPrev) / sumPrev) * 100 : 0;
  const profitDelta = dailyProfit && dailyRevenue ? (dailyProfit / Math.max(dailyRevenue, 1)) * 100 : 0;

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalStockUnits = products.reduce((s, p) => s + p.stock, 0);
  const activeCategories = new Set(products.map((p) => p.category)).size;

  const overallMargin = useMemo(() => {
    const totalRev = entries.reduce((s, e) => s + e.sellingPrice * e.quantity, 0);
    const totalCst = entries.reduce((s, e) => s + e.costPrice * e.quantity, 0);
    return totalRev > 0 ? ((totalRev - totalCst) / totalRev) * 100 : 0;
  }, [entries]);

  // Top produtos do período (por receita)
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; category: string; revenue: number; qty: number }>();
    for (const e of filteredEntries) {
      const cur = map.get(e.name) ?? { name: e.name, category: e.category, revenue: 0, qty: 0 };
      cur.revenue += e.sellingPrice * e.quantity;
      cur.qty += e.quantity;
      map.set(e.name, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredEntries]);

  // Top categorias do período
  const topCategories = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number }>();
    for (const e of filteredEntries) {
      const cur = map.get(e.category) ?? { revenue: 0, cost: 0 };
      cur.revenue += e.sellingPrice * e.quantity;
      cur.cost += e.costPrice * e.quantity;
      map.set(e.category, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        revenue: v.revenue,
        cost: v.cost,
        margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredEntries]);

  const maxProductRevenue = topProducts[0]?.revenue || 1;

  return (
    <div className="space-y-6 px-4 lg:px-8 py-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06] flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ativo
            </span>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Visão geral do negócio em tempo real</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Period selector */}
          <div className="inline-flex rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 p-0.5">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 h-7 rounded text-[11.5px] font-medium transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] rounded-md">
            <User className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="truncate max-w-[180px]">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* CARD HERO AZUL — INTOCADO */}
      <RevenueHeroCard />

      <InsightCard />

      {/* Resumo inline (mini-stats do período) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 dark:bg-white/[0.06] rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08]">
        <div className="px-4 py-3 bg-white dark:bg-slate-900">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Receita · {PERIOD_LABEL[period]}
          </p>
          <p className="text-[15px] font-mono font-semibold tabular-nums mt-1 text-slate-900 dark:text-white">
            {formatBRL(periodRevenue)}
          </p>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-slate-900">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Lucro · {PERIOD_LABEL[period]}
          </p>
          <p className={`text-[15px] font-mono font-semibold tabular-nums mt-1 ${periodProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatBRL(periodProfit)}
          </p>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-slate-900">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Itens vendidos
          </p>
          <p className="text-[15px] font-mono font-semibold tabular-nums mt-1 text-slate-900 dark:text-white">
            {periodItems.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-slate-900">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            Margem média
          </p>
          <p className={`text-[15px] font-mono font-semibold tabular-nums mt-1 ${periodMargin >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {periodMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* KPIs (6 cards) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        <StatCard
          tone="emerald"
          label="Vendas do dia"
          value={dailyRevenue}
          format="currency"
          delta={revenueDelta}
          trend={revenueData}
          hint="vs trimestre anterior"
          icon={<DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="violet"
          label="Lucro do dia"
          value={dailyProfit}
          format="currency"
          delta={profitDelta}
          hint="margem sobre vendas"
          icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="sky"
          label="Margem geral"
          value={overallMargin}
          format="number"
          hint="lucro / receita total"
          icon={<Percent className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="sky"
          label="Produtos cadastrados"
          value={products.length}
          format="number"
          hint={`${totalStockUnits.toLocaleString('pt-BR')} unidades · ${activeCategories} cat.`}
          icon={<Package className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="amber"
          label="Custo do estoque"
          value={totalCost}
          format="currency"
          trend={spendingData}
          hint="valor imobilizado"
          icon={<Wallet className="w-3.5 h-3.5" strokeWidth={2} />}
        />
        <StatCard
          tone="amber"
          label="Itens em alerta"
          value={lowStockCount + outOfStockCount}
          format="number"
          hint={`${outOfStockCount} zerado(s) · ${lowStockCount} baixo`}
          icon={<AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />}
        />
      </motion.div>

      {/* Alerta de estoque baixo (componente existente) */}
      <LowStockAlert />

      {/* Charts grid: Receita vs Despesas + Despesas por categoria */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
          <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Receita vs Despesas</h3>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Últimos 12 meses</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Receita
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Despesas
              </span>
            </div>
          </div>
          {isEmptyData ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-600">
              <Package className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
              <p className="text-[12.5px]">Sem dados ainda</p>
            </div>
          ) : (
            <div className="h-64 p-4">
              <LineChart
                data={last12Months.map((date, index) => ({
                  name: date.toLocaleDateString('pt-BR', { month: 'short' }),
                  receita: revenueData[index],
                  despesas: spendingData[index],
                }))}
                colors={{ receita: '#3B82F6', despesas: '#EF4444' }}
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Despesas por categoria</h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Últimos 12 meses</p>
          </div>
          <div className="p-4">
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-600">
                <BarChart3 className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
                <p className="text-[12.5px]">Sem dados ainda</p>
              </div>
            ) : (
              <PieChart data={pieData} />
            )}
          </div>
        </div>
      </div>

      {/* Top produtos + Top categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top produtos */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Top produtos</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Maiores receitas · {PERIOD_LABEL[period]}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">{topProducts.length}</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-slate-400">
              Sem vendas no período
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {topProducts.map((p, idx) => {
                const pct = (p.revenue / maxProductRevenue) * 100;
                return (
                  <li key={p.name} className="px-5 py-2.5 flex items-center gap-3">
                    <span className="flex items-center justify-center w-5 text-[11px] font-mono tabular-nums shrink-0 text-slate-400">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{p.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0">
                          {p.category} · {p.qty}un
                        </span>
                        <div className="flex-1 h-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-[12.5px] font-mono font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                      {formatBRL(p.revenue)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Top categorias */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Categorias por receita</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Margem · {PERIOD_LABEL[period]}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">{topCategories.length}</span>
          </div>
          {topCategories.length === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-slate-400">
              Sem dados no período
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {topCategories.map((c, idx) => {
                const max = topCategories[0]?.revenue || 1;
                const pct = (c.revenue / max) * 100;
                return (
                  <li key={c.name} className="px-5 py-2.5">
                    <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <span className="flex items-center justify-center w-5 text-[11px] font-mono tabular-nums text-slate-400">
                          {idx + 1}
                        </span>
                        {c.name}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                        {formatBRL(c.revenue)}
                      </span>
                    </div>
                    <div className="ml-7 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="h-full bg-slate-700 dark:bg-slate-300"
                        />
                      </div>
                      <span className={`text-[10.5px] font-mono tabular-nums shrink-0 ${c.margin >= 30 ? 'text-emerald-600 dark:text-emerald-400' : c.margin >= 0 ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {c.margin.toFixed(0)}% margem
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Gráficos analíticos completos (componente existente) */}
      <DashboardCharts />

      {/* Atividade recente */}
      <RecentActivityWidget />

      {/* Atalhos (6 cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Atalhos</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Acesso rápido às ações mais comuns</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ShortcutCard
            icon={<Package className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="sky"
            title="Cadastrar produto"
            desc="Adicione novos itens ao seu estoque"
            onClick={() => navigate('/produtos/cadastrar')}
          />
          <ShortcutCard
            icon={<ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="emerald"
            title="Registrar venda"
            desc="Saídas e operações de venda"
            onClick={() => navigate('/vendas')}
          />
          <ShortcutCard
            icon={<ArrowLeftRight className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="violet"
            title="Movimentações"
            desc="Entradas, saídas e ajustes de caixa"
            onClick={() => navigate('/movimentacoes')}
          />
          <ShortcutCard
            icon={<Receipt className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="amber"
            title="Contas a receber"
            desc="Recebíveis e cobranças"
            onClick={() => navigate('/contas-a-receber')}
          />
          <ShortcutCard
            icon={<BarChart3 className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="violet"
            title="Gerar relatório"
            desc="Análises detalhadas do período"
            onClick={() => navigate('/relatorios')}
          />
          <ShortcutCard
            icon={<Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="emerald"
            title="Agente de IA"
            desc="Automatize tarefas e insights"
            onClick={() => navigate('/agente-ia')}
          />
          <ShortcutCard
            icon={<Settings className="w-[18px] h-[18px]" strokeWidth={2} />}
            tone="slate"
            title="Configurações"
            desc="Empresa, usuários e preferências"
            onClick={() => navigate('/configuracoes')}
          />
        </div>
      </div>
    </div>
  );
}

type ShortcutTone = 'sky' | 'emerald' | 'violet' | 'amber' | 'slate';

const SHORTCUT_TONES: Record<ShortcutTone, string> = {
  sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/[0.08]',
};

function ShortcutCard({
  icon,
  tone,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  tone: ShortcutTone;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/15 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-md ring-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${SHORTCUT_TONES[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-medium text-slate-900 dark:text-white">{title}</h3>
            <ArrowRight
              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all"
              strokeWidth={2}
            />
          </div>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
    </button>
  );
}
