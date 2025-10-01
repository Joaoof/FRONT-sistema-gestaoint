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
    <div className="space-y-8 px-4 lg:px-8 py-6 w-full">
      {/* Header com Avatar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-200 px-6 py-5 rounded-xl shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-['Rubik']">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1.5">
              Olá,{' '}
              <span className="font-semibold text-gray-800">{user?.name}</span>!
              {user?.role && (
                <span className="ml-1 capitalize font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                  {user.role}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-5 h-5 text-gray-500" />
              <span>{user?.email}</span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </motion.div>

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

      {/* Seção Atalhos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Atalhos Rápidos</h2>
            <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition">
              <img src="/icons/plus.png" alt="Novo Produto" className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/1949/1949617.png" alt="Cadastrar Produto" className="w-8 h-8 object-contain" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Cadastrar Produto</h3>
              <p className="text-sm text-gray-500">Adicione ao seu estoque</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <img src="https://cdn-icons-png.freepik.com/512/4041/4041233.png" alt="Gerar Relatório" className="w-8 h-8 object-contain" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Gerar Relatório</h3>
              <p className="text-sm text-gray-500">Relatórios detalhados</p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer">
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <img src="https://cdn-icons-png.freepik.com/256/6573/6573825.png?semt=ais_white_label" alt="Registrar Venda" className="w-8 h-8 object-contain" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Registrar Venda</h3>
              <p className="text-sm text-gray-500">Registre saídas e vendas</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Gráficos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-1"
      >
        {/* Gráfico de Linha - Receita x Despesas */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
            <div className="border-b pb-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900">Receita vs Despesas</h3>
              <p className="text-sm text-gray-500">Últimos 12 meses</p>
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
                <button className="mt-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition">
                  Entrar em contato
                </button>
              </div>
              <Headphones className="w-8 h-8 bg-white bg-opacity-20 rounded-full p-1" />
            </div>
          </motion.div>

          {/* Gráfico de Pizza */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="border-b pb-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Despesas por Categoria</h3>
              <p className="text-xs text-gray-500">Últimos 12 meses</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm px-1">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-base font-semibold text-gray-900">Vendas vs Compras</h3>
            <p className="text-sm text-gray-500">Comparativo mensal (últimos 12 meses)</p>
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