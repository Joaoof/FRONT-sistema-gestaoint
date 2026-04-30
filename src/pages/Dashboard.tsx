import { MetricCard } from './MetricCard';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { InventoryData } from '../hooks/useInventory';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, BarChart3, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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

  return (
    <div className="space-y-7 w-full">
      {/* Header SaaS — sem card, hierarquia via tipografia */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Bem-vindo de volta, {user?.name}
            {user?.role && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] rounded">
                {user.role}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] rounded-md">
            <User className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="truncate max-w-[180px]">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
          <MetricCard
            title="VENDAS DO DIA"
            value={dailyRevenue}
            color="orange"
            icon="💰"
            isCount={false}
          />
          <MetricCard
            title="PRODUTOS EM ESTOQUE"
            value={products.length}
            color="blue"
            icon="📦"
            isCount={true}
          />
          <MetricCard
            title="CUSTO TOTAL DO ESTOQUE"
            value={products.reduce((sum, p) => sum + p.costPrice * p.stock, 0)}
            color="green"
            icon="💸"
            isCount={false}
          />
          <MetricCard
            title="LUCRO DO DIA"
            value={dailyProfit}
            color="red"
            icon="📈"
            isCount={false}
          />
        </div>
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
                <Headphones className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-medium text-slate-900 dark:text-white">Registrar venda</h3>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Saídas e operações</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-1"
      >
        {/* Gráfico de Linha - Receita x Despesas */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm h-full">
            <div className="border-b pb-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Receita vs Despesas</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">Últimos 12 meses</p>
            </div>
            {isEmptyData ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Sem dados ainda</p>
              </div>
            ) : (
              <div className="h-64">
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
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          {/* Card de Ajuda */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium">Precisa de ajuda?</h4>
                <p className="text-xs mt-1 opacity-90">Fale com nossos consultores especializados.</p>
                <button className="mt-2 px-3 py-1 bg-white dark:bg-slate-900 bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition">
                  Entrar em contato
                </button>
              </div>
              <Headphones className="w-8 h-8 bg-white dark:bg-slate-900 bg-opacity-20 rounded-full p-1" />
            </div>
          </motion.div>

          {/* Gráfico de Pizza */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
            <div className="border-b pb-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Despesas por Categoria</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Últimos 12 meses</p>
            </div>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Sem dados ainda</p>
              </div>
            ) : (
              <PieChart data={pieData} />
            )}
          </div>
        </div>
      </motion.div>

      {/* Gráfico de Vendas x Compras */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm px-1">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Vendas vs Compras</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Comparativo mensal (últimos 12 meses)</p>
          </div>
          {isEmptyData ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Sem dados ainda</p>
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
      </motion.div>
    </div>
  );
}