import { MetricCard } from './MetricCard';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { InventoryData } from '../hooks/useInventory';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard({
  entries,
  products,
  getDailyRevenue,
  getDailyProfit,
}: InventoryData) {
  const dailyRevenue = getDailyRevenue();
  const dailyProfit = getDailyProfit();
  const { user, logout } = useAuth()

  // Dados para gráfico de linha (últimos 12 meses)
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date;
  });

  const revenueData = last12Months.map((date) => {
    const monthEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    return monthEntries.reduce(
      (sum, entry) => sum + entry.sellingPrice * entry.quantity,
      0
    );
  });

  const spendingData = last12Months.map((date) => {
    const monthEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    return monthEntries.reduce(
      (sum, entry) => sum + entry.costPrice * entry.quantity,
      0
    );
  });

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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header com boas-vindas */}
      <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 lg:px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold font-['Rubik'] text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1.5">
              Olá, <span className="font-semibold text-gray-800">{user?.name}</span>!
              {user?.role && (
                <> Você está logado como{' '}
                  <span className="capitalize font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                    {user.role}
                  </span>.
                </>
              )}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm"
          >
            Sair
          </button>
        </div>
      </div>

      


      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard
          title="VENDAS DO DIA"
          value={dailyRevenue}
          color="orange"
          icon="⚠"
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
          icon="💰"
        />
        <MetricCard
          title="LUCRO DO DIA"
          value={dailyProfit}
          color="red"
          icon="📈"
        />
      </div>

      {/* Seção Atalhos */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Atalhos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Cadastrar um novo produto</h3>
            <p className="text-sm text-gray-500">Adicione produtos ao seu estoque</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Gerar um novo relatório de vendas</h3>
            <p className="text-sm text-gray-500">Visualize relatórios detalhados</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Registrar uma nova venda</h3>
            <p className="text-sm text-gray-500">Registre vendas e saídas</p>
          </div>
        </div>
      </div>

      {/* Gráficos - Layout responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de Receita x Despesas */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <div>
                <h3 className="text-sm lg:text-base font-medium text-gray-900">
                  Receita x Despesas
                </h3>
                <p className="text-xs text-gray-500">(2021-2023)</p>
              </div>
              <div className="flex items-center space-x-4 text-xs mt-2 sm:mt-0">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-1"></div>
                  <span>2021</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
                  <span>2022</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
                  <span>2023</span>
                </div>
              </div>
            </div>
            <div className="h-48 lg:h-64">
              <LineChart
                data={last12Months.map((date, index) => ({
                  name: date.toLocaleDateString('pt-BR', { month: 'short' }),
                  receita: revenueData[index],
                  despesas: spendingData[index],
                }))}
              />
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Card de Ajuda */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium leading-tight">
                  Precisa de Ajuda? Fale com os nossos consultores →
                </h4>
                <p className="text-xs mt-2 opacity-90">☎ (55) 63.99102-1043</p>
              </div>
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center ml-2">
                <span className="text-lg">🎯</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Pizza */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Despesas por Categoria
              </h3>
              <p className="text-xs text-gray-500">(RECEITAS E DESPESAS)</p>
            </div>
            <PieChart data={pieData} />
          </div>
        </div>
      </div>

      {/* Gráfico de Vendas x Compras */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <h3 className="text-sm lg:text-base font-medium text-gray-900">
            Vendas x Compras (2021-2023)
          </h3>
          <div className="flex items-center space-x-4 text-xs mt-2 sm:mt-0">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-1"></div>
              <span>2021</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
              <span>2022</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
              <span>2023</span>
            </div>
          </div>
        </div>
        <div className="h-32 lg:h-40">
          <LineChart
            data={last12Months.map((date, index) => ({
              name: date.toLocaleDateString('pt-BR', { month: 'short' }),
              receita: revenueData[index] * 0.7,
              despesas: spendingData[index] * 0.9,
            }))}
            height={120}
          />
        </div>
      </div>
    </div >
  );
}