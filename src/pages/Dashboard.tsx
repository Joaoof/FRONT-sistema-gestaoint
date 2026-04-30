import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { InventoryData } from '../hooks/useInventory';
import { useAuth } from '../contexts/AuthContext';
import { Package, BarChart3, ShoppingCart, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { StatCard } from '../components/ui/StatCard';

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
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Para ativar animações ao carregar
  }, []);

  // Dados para gráficos
  const revenueData = getMonthlyData(entries, 'sellingPrice');
  const spendingData = getMonthlyData(entries, 'costPrice');

  // Dados para gráfico de pizza
  const categorySpending = entries.reduce((acc, entry) => {
    const spending = entry.costPrice * entry.quantity;
    acc[entry.category] = (acc[entry.category] || 0) + spending;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categorySpending).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Últimos 12 meses (para eixo X)
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date;
  });

  // Placeholder animado para gráficos vazios
  const isEmptyData = revenueData.every(v => v === 0) && spendingData.every(v => v === 0);

  // Calcula deltas e séries mensais para os KPIs
  const totalCost = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const last3 = revenueData.slice(-3);
  const prev3 = revenueData.slice(-6, -3);
  const sumLast = last3.reduce((a, b) => a + b, 0);
  const sumPrev = prev3.reduce((a, b) => a + b, 0);
  const revenueDelta = sumPrev > 0 ? ((sumLast - sumPrev) / sumPrev) * 100 : 0;
  const profitDelta = dailyProfit && dailyRevenue ? (dailyProfit / Math.max(dailyRevenue, 1)) * 100 : 0;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Visão geral do negócio · atualizado{' '}
            <time className="font-medium text-slate-700 dark:text-slate-300">agora</time>
            {user?.role && (
              <>
                {' '}·{' '}
                <span className="capitalize text-slate-600 dark:text-slate-400">{user.role}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors">
            Últimos 30 dias
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-md transition-colors">
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard
          label="Vendas do dia"
          value={dailyRevenue}
          format="currency"
          delta={revenueDelta}
          trend={revenueData}
          hint="vs trimestre anterior"
          icon={<DollarSign className="w-3.5 h-3.5" strokeWidth={1.75} />}
        />
        <StatCard
          label="Produtos em estoque"
          value={products.length}
          format="number"
          hint={`${products.filter(p => p.stock > 0).length} ativos`}
          icon={<Package className="w-3.5 h-3.5" strokeWidth={1.75} />}
        />
        <StatCard
          label="Custo do estoque"
          value={totalCost}
          format="currency"
          trend={spendingData}
          hint="valor imobilizado"
          icon={<Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />}
        />
        <StatCard
          label="Lucro do dia"
          value={dailyProfit}
          format="currency"
          delta={profitDelta}
          hint="margem sobre vendas"
          icon={<TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />}
        />
      </motion.div>

      {/* Seção Atalhos — design quiet, sem ilustrações genéricas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Atalhos</h2>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Acesso rápido às ações mais comuns</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/15 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-medium text-slate-900 dark:text-white">Cadastrar produto</h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Adicione ao estoque</p>
              </div>
            </div>
          </button>

          <button className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/15 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-medium text-slate-900 dark:text-white">Gerar relatório</h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Análises detalhadas</p>
              </div>
            </div>
          </button>

          <button className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/15 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-medium text-slate-900 dark:text-white">Registrar venda</h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Saídas e operações</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Receita vs Despesas */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <div>
              <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Receita vs Despesas</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Últimos 12 meses</p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-slate-500 dark:text-slate-400">
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

        {/* Despesas por categoria */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Despesas por categoria</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Últimos 12 meses</p>
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

      {/* Vendas vs Compras */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Vendas vs Compras</h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Comparativo mensal — últimos 12 meses</p>
        </div>
        <div className="p-4">
          {isEmptyData ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-600">
              <BarChart3 className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
              <p className="text-[12.5px]">Sem dados ainda</p>
            </div>
          ) : (
            <div className="h-40">
              <LineChart
                data={last12Months.map((date, index) => ({
                  name: date.toLocaleDateString('pt-BR', { month: 'short' }),
                  receita: revenueData[index] * 0.7,
                  despesas: spendingData[index] * 0.9,
                }))}
                height={160}
                colors={{ receita: '#10B981', despesas: '#8B5CF6' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}