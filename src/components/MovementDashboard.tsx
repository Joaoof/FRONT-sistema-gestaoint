import { useState } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    Download,
    AlertTriangle,
    Target,
    Box,
    GrabIcon,
    GraduationCap,
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
import { motion } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../graphql/queries/dashboard';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatCurrency } from '../utils/formatValue';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);
    const [metaMensal, setMetaMensal] = useState<number>(20000);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(metaMensal.toFixed(2));


    const token = localStorage.getItem("accessToken");

    const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
        variables: { input: { date: filterDate } },
        pollInterval: 30000, // Atualiza a cada 30s
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    console.log("GraphQL endpoint:", import.meta.env.VITE_GRAPHQL_ENDPOINT);

    const errorMessage = error ? getGraphQLErrorMessages(error) : null;


    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-center text-red-600">Erro: {error.message}</div>;

    const entries = data?.dashboardStats.todayEntries || [];
    const exits = Array.isArray(data?.dashboardStats.todayExits)
        ? data.dashboardStats.todayExits
        : [];
    const balance = data?.dashboardStats.todayBalance || 0;
    const totalMes = data?.dashboardStats.monthlyTotal || 0;

    const monthlyData = Array.from({ length: 7 }, (_, i) => {
        const base = Math.random() > 0.5 ? 1 : -1;
        return {
            day: i + 1,
            entradas: Number((Math.random() * 1000).toFixed(2)),
            saidas: Number((Math.random() * 600).toFixed(2)),
            saldo: Number((Math.random() * 800 * base).toFixed(2)),
        };
    });

    const heatmapData = Array.from({ length: 24 }, (_, hour) => {
        const base = 50;
        const picoAlmoco = hour >= 12 && hour <= 14 ? 100 : 0;
        const picoTarde = hour >= 17 && hour <= 19 ? 80 : 0;
        return {
            hour,
            value: base + picoAlmoco + picoTarde + Math.random() * 30,
        };
    });

    const topProducts = [
        { name: 'Produto A', value: 4200 },
        { name: 'Produto B', value: 3100 },
        { name: 'Produto C', value: 2200 },
    ];
    const hasAlert = balance < 0;

    const margemLucro = entries > 0 ? ((balance / entries) * 100).toFixed(1) : '0.0';
    const totalMovimentos = data?.dashboardStats.totalMovements || 1;
    // Somar por categoria (caso tenha várias entradas da mesma categoria)
    const entradasPorCategoria = {
        Venda: 2850,
        Troco: 320,
        Outros: 130,
    };
    const categoriaData = Object.entries(entradasPorCategoria).map(([nome, valor]) => ({
        nome,
        valor: Number(valor)
    }));

    console.log('Entradas por categoria:', categoriaData);

    // Transformar em array e ordenar do maior para o menor
    type EntradaCategoria = { categoria: string; valor: number };

    const top3Entradas = Object.entries(entradasPorCategoria)
        .map(([categoria, valor]) => ({ categoria, valor: Number(valor) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);


    const crescimentoDiario = monthlyData.length > 1
        ? (() => {
            const entradasAtual = monthlyData[monthlyData.length - 1].entradas;
            const entradasAnterior = monthlyData[monthlyData.length - 2].entradas;

            if (entradasAnterior === 0) return '0.0%'; // evita Infinity
            return `${(((entradasAtual - entradasAnterior) / entradasAnterior) * 100).toFixed(1)}%`;
        })()
        : '0.0%';

    console.log(crescimentoDiario);


    const forecastData = Array.from({ length: 14 }, (_, i) => ({
        day: i + 1,
        saldo: Math.max(0, 1000 + i * 50 + (Math.random() - 0.5) * 150),
    }));

    const insights = [
        "Despesa com transporte subiu 45% esta semana.",
        "Ticket médio aumentou 12% vs semana passada.",
        "Horário de pico: 12h-14h e 17h-19h.",
    ];

    const handleExport = () => {
        const csv = [
            ['Data', 'Hora', 'Descrição', 'Tipo', 'Valor'],
            ['Hoje', '10:30', 'Venda de produtos', 'Entrada', 'R$ 1500,00'],
            ['Hoje', '11:15', 'Troco', 'Saída', 'R$ 50,00'],
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

    const handleEdit = () => {
        setInputValue(metaMensal.toFixed(2));
        setIsEditing(true);
    };

    const handleSave = () => {
        const value = parseFloat(inputValue);
        if (!isNaN(value) && value > 0) {
            setMetaMensal(value);
        } else {
            setInputValue(metaMensal.toFixed(2));
        }
        setIsEditing(false);
    };

    // Variants de animação
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.15 },
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
        hover: { scale: 1.03, boxShadow: "0px 8px 24px rgba(0,0,0,0.1)" },
        tap: { scale: 0.98 },
    };

    return (
        <motion.div
            className="space-y-8 p-6 bg-gray-50 min-h-screen"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Título */}
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-serif tracking-tight text-gray-900 mb-2">Dashboard de Movimentações</h1>
                <p className="text-gray-600 text-sm">Controle completo de entradas e saídas do caixa</p>
            </motion.div>

            {/* Ações rápidas */}
            <motion.div className="flex flex-wrap gap-6" variants={containerVariants}>
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => navigate('/formulario-movimentacao')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Registrar Movimentações
                </motion.button>
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                    <Download className="w-5 h-5" />
                    Exportar CSV
                </motion.button>
            </motion.div>

            {/* Filtro */}
            <motion.div variants={itemVariants}>
                <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por </label>
                        <div className="relative flex-1 max-w-md">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KPIs com ícones em badge e tipografia refinada */}
            {/* KPIs com barra lateral decorativa */}
            {/* KPIs com barra lateral decorativa à esquerda */}
            <motion.div className="grid grid-cols-1 md:grid-cols-5 gap-6" variants={containerVariants}>
                {[
                    {
                        label: 'Quantidade Movimentações',
                        value: `${margemLucro}%`,
                        icon: TrendingUp,
                        color: 'green',
                        borderColor: 'border-green-900',
                        bgColor: 'bg-green-700',
                    },
                    {
                        label: 'Total de Lançamentos',
                        value: totalMovimentos,
                        icon: DollarSign,
                        color: 'blue',
                        borderColor: 'border-blue-900',
                        bgColor: 'bg-blue-700',
                    },
                    {
                        label: 'Top Categoria',
                        value: top3Entradas,
                        icon: GraduationCap, // Ícone de gráfico no canto
                        color: 'purple',
                        borderColor: 'border-purple-900',
                        bgColor: 'bg-purple-700',
                    },
                    {
                        label: 'Registros de Caixa (Qtd)',
                        value: '24',
                        icon: Box,
                        color: 'orange',
                        borderColor: 'border-orange-900',
                        bgColor: 'bg-orange-500',
                    },
                    {
                        label: 'Operações Financeiras Registradas',
                        value: hasAlert ? '1' : '0',
                        icon: AlertTriangle,
                        color: 'red',
                        borderColor: 'border-red-900',
                        bgColor: 'bg-red-700',
                    },
                ].map((kpi, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ scale: 1.03 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-white to-purple-50/20 border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48 flex flex-col justify-between relative overflow-hidden"
                    >
                        {/* Borda lateral com glow suave */}
                        <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${kpi.bgColor} rounded-r-lg shadow-lg shadow-purple-500/30`}
                        ></div>

                        {/* Ícone de gráfico no canto superior direito */}
                        <div className="absolute top-4 right-4">
                            <div className="p-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow">
                                <kpi.icon className="w-4 h-4 text-purple-700" />
                            </div>
                        </div>

                        <div className="">
                            <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.label}</p>

                            {/* Renderização especial para Top Categoria */}
                            {kpi.label === 'Top Categoria' ? (
                                <div className="mt-3 space-y-2">
                                    {Array.isArray(kpi.value) && kpi.value.length > 0 ? (
                                        kpi.value.map((item, idx) => {
                                            const isVenda = item.categoria === 'Venda';
                                            return (
                                                <div key={idx} className="group">
                                                    {/* Separador sutil */}
                                                    {idx > 0 && (
                                                        <div className="w-full h-px bg-gray-200/60 my-1"></div>
                                                    )}

                                                    <div className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-white/50 transition-colors">
                                                        {/* Ícone + Categoria */}
                                                        <div className="flex items-center gap-2">
                                                            {isVenda && <span className="text-sm">💰</span>}
                                                            {item.categoria === 'Troco' && <span className="text-sm">🔄</span>}
                                                            {item.categoria === 'Outros' && <span className="text-sm">📦</span>}
                                                            <span
                                                                className={`text-sm font-medium ${isVenda ? 'text-purple-800' : 'text-gray-600'
                                                                    }`}
                                                            >
                                                                {item.categoria}
                                                            </span>
                                                        </div>

                                                        {/* Valor */}
                                                        <span
                                                            className={`font-extrabold tabular-nums text-sm ${isVenda ? 'text-purple-900' : 'text-gray-900'
                                                                }`}
                                                        >
                                                            {formatCurrency(item.valor)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span className="text-gray-400 text-sm">—</span>
                                    )}
                                </div>
                            ) : (
                                /* Outros cards */
                                <p className="text-3xl font-extrabold text-gray-900 tabular-nums mt-2">
                                    {typeof kpi.value === 'number' ? kpi.value : kpi.value}
                                </p>
                            )}
                        </div>

                        {/* Badge de crescimento ou ícone */}
                        <div className="flex items-center justify-between mt-3">
                            <div className={`p-2 rounded-full bg-${kpi.color}-100 text-${kpi.color}-600`}>
                                <kpi.icon className="w-5 h-5 opacity-0" /> {/* Espaço reservado */}
                            </div>
                            {kpi.label !== 'Alertas' && (
                                <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full shadow-sm">
                                    +3.2%
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Resumo com gradientes vibrantes e badges */}
            <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" variants={containerVariants}>
                {[
                    {
                        label: 'Entradas do Dia',
                        value: formatCurrency(entries),
                        icon: TrendingUp,
                        color: 'green',
                        gradient: 'from-green-400/20 to-emerald-200/40',
                    },
                    {
                        label: 'Saídas do Dia',
                        value: formatCurrency(exits),
                        icon: TrendingDown,
                        color: 'red',
                        gradient: 'from-red-400/20 to-rose-200/40',
                    },
                    {
                        label: 'Saldo do Dia',
                        value: formatCurrency(balance),
                        icon: DollarSign,
                        color: balance >= 0 ? 'blue' : 'red',
                        gradient: balance >= 0 ? 'from-blue-400/20 to-sky-200/40' : 'from-red-400/20 to-pink-200/40',
                    },
                    {
                        label: 'Total do Mês',
                        value: formatCurrency(totalMes),
                        icon: Calendar,
                        color: 'purple',
                        gradient: 'from-purple-400/20 to-violet-200/40',
                    },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-gradient-to-br ${item.gradient} border border-${item.color}-200/40 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all min-h-48 flex flex-col justify-between`}
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            <p className={`text-3xl tabular-nums font-extrabold text-${item.color}-900 tabular-nums mt-1`}>
                                {item.value}
                            </p>
                        </div>
                        <div className={`p-2 rounded-full bg-${item.color}-100 text-${item.color}-600 w-fit`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Meta Editável com efeito premium */}
            <motion.div variants={itemVariants}>
                <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow min-h-48">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-extrabold tracking-tight text-gray-900">Meta de Faturamento Mensal</h3>
                        </div>
                        {!isEditing && (
                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleEdit}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                ✏️ Editar
                            </motion.button>
                        )}
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
                                    className="px-3 py-1 border border-blue-300 rounded-lg text-sm w-32 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">R$/mês</span>
                            </div>
                        ) : (
                            <p className="text-3xl font-extrabold text-gray-900 tabular-nums">
                                R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-1 overflow-hidden ring-1 ring-white/40">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((totalMes / metaMensal) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${totalMes >= metaMensal
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : totalMes / metaMensal >= 0.7
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                    : 'bg-gradient-to-r from-red-500 to-pink-600'
                                }`}
                        ></motion.div>
                    </div>
                    <p className="text-sm text-gray-600">
                        {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /{' '}
                        {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                        ({((totalMes / metaMensal) * 100).toFixed(1)}%)
                    </p>
                </div>
            </motion.div>

            {/* Gráficos com hover suave */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={containerVariants}>
                <motion.div variants={chartVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48"
                    >
                        <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4">Previsão de Caixa (14 dias)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Saldo']} />
                                <Area type="monotone" dataKey="saldo" stroke="#8b5cf6" fill="url(#colorForecast)" />
                                <defs>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>

                <motion.div variants={chartVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48"
                    >
                        <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4">Heatmap de Vendas por Hora</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={heatmapData}>
                                <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}h`} />
                                <YAxis hide />
                                <Tooltip formatter={(value: number) => [`${value} vendas`, 'Volume']} />
                                <Bar dataKey="value" fill="url(#heatGradient)" radius={[4, 4, 0, 0]} background={{ fill: '#f3f4f6' }} />
                                <defs>
                                    <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#059669" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>

                <motion.div variants={chartVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48"
                    >
                        <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4">Top Produtos</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart layout="vertical" data={topProducts} margin={{ left: 80 }}>
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <XAxis hide />
                                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']} />
                                <Bar dataKey="value" fill="url(#productGradient)" radius={[0, 4, 4, 0]} />
                                <defs>
                                    <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6 shadow-lg min-h-48"
                    >
                        <h3 className="text-lg font-extrabold tracking-tight text-blue-900 mb-4">💡 Insights Inteligentes</h3>
                        <ul className="space-y-3 text-sm text-blue-800">
                            {insights.map((text, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 mt-0.5 text-blue-600" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Gráficos menores */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={containerVariants}>
                <motion.div variants={chartVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48"
                    >
                        <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4">Entradas vs Saídas</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={[{ name: 'Hoje', entries, exits }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="entradas" fill="url(#entryGradient)" name="Entradas" />
                                <Bar dataKey="saidas" fill="url(#exitGradient)" name="Saídas" />
                                <defs>
                                    <linearGradient id="entryGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                                    </linearGradient>
                                    <linearGradient id="exitGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>

                <motion.div variants={chartVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48"
                    >
                        <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4">Evolução Diária</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                                <Line type="monotone" dataKey="entradas" stroke="url(#lineEntry)" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="saidas" stroke="url(#lineExit)" strokeWidth={3} dot={false} />
                                <defs>
                                    <linearGradient id="lineEntry" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="lineExit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Histórico */}
            <motion.div variants={itemVariants}>
                <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transition-shadow min-h-48">
                    <div className="p-6 border-b border-white/20">
                        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                            Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}
                        </h2>
                    </div>
                    <div className="p-8 text-center text-gray-500">
                        <p>Este painel exibe apenas métricas gerais.</p>
                        <p className="text-sm mt-1">Para ver movimentações detalhadas, vá ao histórico.</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/historico')}
                            className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                        >
                            Ver histórico completo
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}