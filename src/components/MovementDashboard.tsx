import { useState } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    Download,
    AlertTriangle,
    Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Recharts
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    AreaChart,
    Area,
    ResponsiveContainer,
} from 'recharts';

// Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

type Movement = {
    id: string;
    value: number;
    description: string;
    type: 'venda' | 'troco' | 'outros' | 'despesa' | 'retirada' | 'pagamento';
    date: string;
};

// Dados mockados
const mockMovements: Movement[] = [
    { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', date: '2025-04-05T10:30' },
    { id: '2', value: 50, description: 'Troco de cliente', type: 'troco', date: '2025-04-05T11:15' },
    { id: '3', value: 200, description: 'Pagamento de energia', type: 'despesa', date: '2025-04-05T09:00' },
    { id: '4', value: 300, description: 'Retirada de sócio', type: 'retirada', date: '2025-04-04T17:00' },
    { id: '5', value: 80, description: 'Compra de insumos', type: 'despesa', date: '2025-04-04T14:20' },
    { id: '6', value: 700, description: 'Venda no almoço', type: 'venda', date: '2025-04-04T12:30' },
    { id: '7', value: 100, description: 'Despesa com transporte', type: 'despesa', date: '2025-04-03T10:00' },
    { id: '8', value: 400, description: 'Venda final de semana', type: 'venda', date: '2025-04-06T16:00' },
    { id: '9', value: 1200, description: 'Venda de eletrônicos', type: 'venda', date: '2025-04-05T15:45' },
    { id: '10', value: 90, description: 'Material de escritório', type: 'despesa', date: '2025-04-03T16:00' },
];

// Dados mensais (simulação: últimos 7 dias)
const monthlyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toISOString().split('T')[0];

    const dayMovements = mockMovements.filter((m) => m.date.startsWith(dayStr));
    const entradasDia = dayMovements
        .filter((m) => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);
    const saidasDia = dayMovements
        .filter((m) => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    return {
        day: i + 1,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo: entradasDia - saidasDia,
    };
});

// Paleta de cores
const COLORS = {
    entrada: '#22c55e',
    saida: '#ef4444',
    venda: '#6366f1',
    despesa: '#f97316',
    troco: '#10b981',
    retirada: '#ec4899',
    outros: '#8b5cf6',
};

// Produtos simulados (para ranking)
const mockProducts = [
    { name: 'Produto A', revenue: 1500 },
    { name: 'Produto B', revenue: 1200 },
    { name: 'Produto C', revenue: 700 },
    { name: 'Produto D', revenue: 400 },
];

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);

    // Filtra movimentações pela data
    const filteredMovements = mockMovements.filter((m) => m.date.startsWith(filterDate));
    const allVendas = mockMovements.filter((m) => m.type === 'venda');

    // Calcula resumo do dia
    const entradas = filteredMovements
        .filter((m) => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saidas = filteredMovements
        .filter((m) => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saldo = entradas - saidas;

    const totalMes = 15000;
    const [metaMensal, setMetaMensal] = useState<number>(20000); // Meta inicial
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(metaMensal.toFixed(2));

    // Função para iniciar edição
    const handleEdit = () => {
        setInputValue(metaMensal.toFixed(2));
        setIsEditing(true);
    };

    // Função para salvar
    const handleSave = () => {
        const value = parseFloat(inputValue);
        if (!isNaN(value) && value > 0) {
            setMetaMensal(value);
        } else {
            setInputValue(metaMensal.toFixed(2)); // Reverte se inválido
        }
        setIsEditing(false);
    };

    // ===== 1️⃣ KPIs de Performance =====
    const margemLucro = entradas > 0 ? ((saldo / entradas) * 100).toFixed(1) : '0.0';
    const ticketMedio = allVendas.length > 0 ? (allVendas.reduce((sum, v) => sum + v.value, 0) / allVendas.length).toFixed(2) : '0.00';

    // Crescimento diário (simulado)
    const crescimentoDiario = '+12.5%';

    // ===== 2️⃣ Previsão de Caixa =====
    const forecastData = Array.from({ length: 14 }, (_, i) => ({
        day: i + 1,
        saldo: Math.max(0, 1000 + i * 50 + (Math.random() - 0.5) * 150),
    }));

    // ===== 3️⃣ Heatmap por Hora (simulado) =====
    const heatmapData = Array.from({ length: 24 }, (_, hour) => {
        const base = 50;
        const picoAlmoco = hour >= 12 && hour <= 14 ? 100 : 0;
        const picoTarde = hour >= 17 && hour <= 19 ? 80 : 0;
        return {
            hour,
            value: base + picoAlmoco + picoTarde + Math.random() * 30,
        };
    });

    // ===== 4️⃣ Ranking de Produtos =====
    const topProducts = mockProducts.slice(0, 3).map(p => ({
        name: p.name,
        value: p.revenue,
    }));

    // ===== 5️⃣ Alertas =====
    const hasAlert = saldo < 0;

    // ===== 8️⃣ Insights Inteligentes =====
    const insights = [
        "Despesa com transporte subiu 45% esta semana.",
        "Ticket médio aumentou 12% vs semana passada.",
        "Horário de pico: 12h-14h e 17h-19h.",
    ];

    // Função de exportação
    const handleExport = () => {
        const csv = [
            ['Data', 'Descrição', 'Tipo', 'Valor'],
            ...filteredMovements.map(m => [m.date, m.description, m.type, m.value]),
        ]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${filterDate}.csv`;
        a.click();
    };

    // Variantes de animação
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    const chartVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    };

    const buttonVariants = {
        hover: { scale: 1.03 },
        tap: { scale: 0.98 },
    };

    return (
        <motion.div
            className="space-y-8 p-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Título */}
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Dashboard de Movimentações</h1>
                <p className="text-gray-600 font-light">Controle completo de entradas e saídas do caixa</p>
            </motion.div>

            {/* Ações rápidas */}
            <motion.div className="flex flex-wrap gap-4" variants={containerVariants} initial="hidden" animate="show">
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => navigate('/formulario-movimentacao')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Nova Entrada
                </motion.button>
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => navigate('/historico-movimentacao')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                    <ArrowDownCircle className="w-5 h-5" />
                    Histórico de Saídas
                </motion.button>
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-sm"
                >
                    <Download className="w-5 h-5" />
                    Exportar CSV
                </motion.button>
            </motion.div>

            {/* Filtro */}
            <motion.div variants={itemVariants}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por </label>
                        <div className="relative flex-1 max-w-md">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KPIs */}
            <motion.div className="grid grid-cols-1 md:grid-cols-5 gap-6" variants={containerVariants} initial="hidden" animate="show">
                {[
                    { label: 'Margem de Lucro', value: `${margemLucro}%`, icon: TrendingUp, color: 'green' },
                    { label: 'Ticket Médio', value: `R$ ${ticketMedio}`, icon: DollarSign, color: 'blue' },
                    { label: 'Crescimento Diário', value: crescimentoDiario, icon: TrendingUp, color: 'purple' },
                    { label: 'Total Vendas', value: allVendas.length, icon: Calendar, color: 'orange' },
                    { label: 'Alertas', value: hasAlert ? '1' : '0', icon: AlertTriangle, color: 'red' },
                ].map((kpi, i) => (
                    <motion.div key={i} variants={itemVariants} className={`bg-white border-l-4 border-${kpi.color}-500 rounded-lg p-6 shadow-sm`}>
                        <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                        <kpi.icon className={`w-5 h-5 inline mt-1 text-${kpi.color}-600`} />
                        {kpi.label !== 'Alertas' && <span className="text-sm text-green-600 ml-1">+3.2%</span>}
                    </motion.div>
                ))}
            </motion.div>

            {/* Resumo */}
            <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="show">
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Entradas do Dia</p>
                            <p className="text-xl font-bold text-green-900">R$ {entradas.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600 opacity-70" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-800">Saídas do Dia</p>
                            <p className="text-xl font-bold text-red-900">R$ {saidas.toFixed(2)}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600 opacity-70" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Saldo do Dia</p>
                            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                                R$ {saldo.toFixed(2)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-600 opacity-70" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-800">Total do Mês</p>
                            <p className="text-xl font-bold text-purple-900">R$ {totalMes.toFixed(2)}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-600 opacity-70" />
                    </div>
                </motion.div>
            </motion.div>

            {/* Painel de Meta Editável */}
            <motion.div variants={itemVariants}>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Meta de Faturamento Mensal</h3>
                        </div>
                        {!isEditing ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleEdit}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Editar
                            </motion.button>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        {isEditing ? (
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    step="100"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onBlur={handleSave}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                                    autoFocus
                                    className="px-3 py-1 border border-blue-300 rounded text-sm w-32 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">R$/mês</span>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-gray-900">
                                R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: totalMes / metaMensal > 0 ? 1 : 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ originX: 0 }}
                        className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden inline-block"
                    >
                        <div
                            className={`h-2.5 rounded-full ${totalMes >= metaMensal
                                ? 'bg-green-500'
                                : totalMes / metaMensal >= 0.7
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${Math.min((totalMes / metaMensal) * 100, 100)}%` }}
                        ></div>
                    </motion.div>
                    <p className="text-sm text-gray-600">
                        R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de{' '}
                        R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                        ({((totalMes / metaMensal) * 100).toFixed(1)}%)
                    </p>
                </div>
            </motion.div>

            {/* Gráficos */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={containerVariants} initial="hidden" animate="show">
                <motion.div variants={chartVariants}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previsão de Caixa (14 dias)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Area type="monotone" dataKey="saldo" stroke="#8b5cf6" fill="url(#colorForecast)" />
                                <defs>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div variants={chartVariants}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Heatmap de Vendas por Hora</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={heatmapData}>
                                <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}h`} />
                                <YAxis hide />
                                <Tooltip formatter={(value: number) => [`${value} vendas`, 'Volume']} />
                                <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} background={{ fill: '#f3f4f6' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div variants={chartVariants}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produtos</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={topProducts} margin={{ left: 80 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Insights Inteligentes</h3>
                        <ul className="space-y-3 text-sm text-blue-800">
                            {insights.map((text, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 mt-0.5 text-blue-600" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </motion.div>

            {/* Gráficos menores */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={containerVariants} initial="hidden" animate="show">
                <motion.div variants={chartVariants}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Entradas vs Saídas</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Hoje', entradas, saidas }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="entradas" fill={COLORS.entrada} name="Entradas" />
                                <Bar dataKey="saidas" fill={COLORS.saida} name="Saídas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div variants={chartVariants}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução Diária</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                                <Line type="monotone" dataKey="entradas" stroke={COLORS.entrada} name="Entradas" />
                                <Line type="monotone" dataKey="saidas" stroke={COLORS.saida} name="Saídas" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </motion.div>

            {/* Histórico */}
            <motion.div variants={itemVariants}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {filteredMovements.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Nenhuma movimentação registrada nesta data.</div>
                        ) : (
                            filteredMovements.map((m) => (
                                <motion.div
                                    key={m.id}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span
                                            className={`w-3 h-3 rounded-full ${['venda', 'troco', 'outros'].includes(m.type) ? 'bg-green-500' : 'bg-red-500'}`}
                                        ></span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{m.description}</p>
                                            <p className="text-xs text-gray-500">{new Date(m.date).toLocaleTimeString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <p
                                        className={`text-sm font-semibold ${['venda', 'troco', 'outros'].includes(m.type) ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {['venda', 'troco', 'outros'].includes(m.type) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                    </p>
                                </motion.div>
                            ))
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/historico')}
                            className="text-blue-600 hover:underline text-sm font-medium"
                        >
                            Ver todo histórico
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}