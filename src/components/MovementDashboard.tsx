import { useState } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    Target,
    Box,
    GraduationCap,
    LogOut,
    AlertTriangle,
    Info,
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
    ResponsiveContainer,
} from 'recharts';

// Framer Motion
import { motion, Variants } from 'framer-motion'; // Importamos 'Variants' explicitamente
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../graphql/queries/dashboard';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatCurrency } from '../utils/formatValue';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);
    const [metaMensal, setMetaMensal] = useState<number>(20000);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(metaMensal.toFixed(2));
    const { notifyError } = useNotification();

    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const userId = user?.id; // Obtém o ID do usuário

    const token = localStorage.getItem("accessToken");
    const shouldSkip = !userId || isAuthLoading;

    const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
        variables: {
            input: { date: filterDate, userId }
        },
        skip: shouldSkip,
        pollInterval: 30000,
        context: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    const handleLogout = async () => {
        await logout();
    };

    console.log("GraphQL endpoint:", import.meta.env.VITE_GRAPHQL_ENDPOINT);

    if (isAuthLoading) return <LoadingSpinner />;

    if (loading) return <LoadingSpinner />;

    if (error) {
        const errorMessage = getGraphQLErrorMessages(error);
        notifyError(errorMessage as any);
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 border border-red-300 rounded-xl m-8">
                <p className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Ops, Ocorreu um Erro!</p>
                <p className="text-red-600 dark:text-red-400">Não foi possível carregar os dados do painel. Detalhes: {errorMessage}</p>
                <p className="text-sm text-red-500 mt-2">Por favor, tente recarregar a página. Se o erro persistir, verifique a conexão com o servidor.</p>
            </div>
        );
    }

    const dashboardStats = data?.dashboardStats;

    const entries = dashboardStats?.todayEntries || 0;
    const exits = dashboardStats?.todayExits || 0;
    const balance = dashboardStats?.todayBalance || 0;
    const totalMes = dashboardStats?.monthlyTotal || 0;
    const totalMovements = dashboardStats?.totalMovements || 0;

    const monthlyData = Array.from({ length: 7 }, (_, i) => {
        const base = Math.random() > 0.5 ? 1 : -1;
        return {
            day: i + 1,
            entradas: Number((Math.random() * 1000).toFixed(2)),
            saidas: Number((Math.random() * 600).toFixed(2)),
            saldo: Number((Math.random() * 800 * base).toFixed(2)),
        };
    });

    const entriesPerCategory = dashboardStats?.entriesPerCategory || {};

    type EntradaCategoria = { categoria: string; valor: number };

    const top3Entradas: EntradaCategoria[] = Object.entries(entriesPerCategory)
        .map(([categoria, valor]) => ({ categoria, valor: Number(valor) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);

    const margemLucroValue = entries > 0 ? ((balance / entries) * 100) : 0;
    const isMargemPositiva = margemLucroValue >= 0;
    const margemLucroDisplay = `${margemLucroValue.toFixed(1)}%`;
    const mockModuleKpis = [
        {
            label: 'Margem de Lucro',
            value: margemLucroDisplay,
            icon: TrendingUp,
            color: isMargemPositiva ? 'green' : 'red',
            borderColor: isMargemPositiva ? 'border-green-900' : 'border-red-900',
            bgColor: isMargemPositiva ? 'bg-green-700' : 'bg-red-700',
            isModuleReady: true,
            valueClass: isMargemPositiva ? 'text-green-900' : 'text-red-900',
            subText: 'Atualizado para o período selecionado',
            badgeText: isMargemPositiva ? 'Positiva' : 'Atenção'
        },
        {
            label: 'Total de Lançamentos',
            value: totalMovements.toLocaleString('pt-BR'),
            icon: DollarSign,
            color: 'blue',
            borderColor: 'border-blue-900',
            bgColor: 'bg-blue-700',
            isModuleReady: true,
            valueClass: 'text-blue-900',
            subText: 'Contagem de entradas e saídas',
            badgeText: 'Contagem'
        },
        {
            label: 'Top Categoria (Entradas)',
            value: top3Entradas,
            icon: GraduationCap,
            color: 'purple',
            borderColor: 'border-purple-900',
            bgColor: 'bg-purple-700',
            isModuleReady: true,
            valueClass: 'text-purple-900',
            subText: top3Entradas.length > 0 ? formatCurrency(top3Entradas[0].valor) : 'N/A',
            badgeText: top3Entradas.length > 0 ? top3Entradas[0].categoria : 'Sem dados'
        },
        {
            label: 'Controle de Estoque',
            value: 'EM BREVE',
            icon: Box,
            color: 'gray', // Cor neutra
            borderColor: 'border-gray-500',
            bgColor: 'bg-gray-200 dark:bg-slate-700', // Fundo mais sutil para a borda lateral
            isModuleReady: false, // Módulo não pronto
            valueClass: 'text-gray-500 dark:text-slate-400',
            subText: 'Gerenciamento e alertas de inventário.',
            badgeText: 'Módulo'
        },
        {
            label: 'Contas a Pagar/Receber',
            value: 'EM BREVE',
            icon: AlertTriangle,
            color: 'gray', // Cor neutra
            borderColor: 'border-gray-500',
            bgColor: 'bg-gray-200 dark:bg-slate-700', // Fundo mais sutil para a borda lateral
            isModuleReady: false, // Módulo não pronto
            valueClass: 'text-gray-500 dark:text-slate-400',
            subText: 'Gestão financeira avançada.',
            badgeText: 'Módulo'
        },
    ];
    const handleSave = () => {
        const value = parseFloat(inputValue);
        if (!isNaN(value) && value > 0) {
            setMetaMensal(value);
        } else {
            setInputValue(metaMensal.toFixed(2));
        }
        setIsEditing(false);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        show: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.08, delayChildren: 0.15 },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10, scale: 0.99 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 } },
    };

    const chartVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.7 } },
    };

    const buttonVariants = {
        hover: { scale: 1.03, boxShadow: "0px 8px 24px rgba(0,0,0,0.1)" },
        tap: { scale: 0.98 },
    };

    return (
        <motion.div
            className="space-y-8 p-6 bg-gray-50 dark:bg-slate-950 min-h-screen"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header SaaS */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Movimentações</h1>
                        <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">Controle completo de entradas e saídas do caixa</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-8 pl-8 pr-2.5 text-[12.5px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-md focus:outline-none focus:ring-[3px] focus:ring-violet-500/15 focus:border-violet-500 hover:border-slate-300 dark:hover:border-white/15"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/formulario-movimentacao')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                    >
                        <ArrowUpCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Nova movimentação
                    </button>
                    <button
                        onClick={handleLogout}
                        className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Sair
                    </button>
                </div>
            </div>

            {/* KPIs - Módulos */}
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 font-poppins" variants={containerVariants}>
                {mockModuleKpis.map((kpi, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        // Hover menos agressivo para módulos não prontos
                        whileHover={{ scale: kpi.isModuleReady ? 1.03 : 1.01 }}
                        // Aplica classes de cinza/opacidade se não estiver pronto
                        className={`backdrop-blur-xl bg-gradient-to-br border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48 flex flex-col justify-between relative overflow-hidden 
                            ${kpi.isModuleReady
                                ? 'from-white to-purple-50/20 border-white/30'
                                : 'from-gray-50 to-gray-200/50 border-gray-200 dark:border-white/10/50 grayscale opacity-70 hover:opacity-100 cursor-not-allowed'
                            }
                        `}
                    >
                        {/* Borda lateral com glow suave */}
                        <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${kpi.isModuleReady ? kpi.bgColor : 'bg-gray-300'} rounded-r-lg shadow-lg ${kpi.isModuleReady ? 'shadow-purple-500/30' : 'shadow-gray-400/30'}`}
                        ></div>

                        {/* Ícone no canto superior direito */}
                        <div className="absolute top-4 right-4">
                            <div className="p-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow">
                                {/* Cor do ícone no canto com fallback para cinza */}
                                <kpi.icon className={`w-4 h-4 ${kpi.isModuleReady ? `text-${kpi.color}-700` : 'text-gray-500 dark:text-slate-400'}`} />
                            </div>
                        </div>

                        <div className="">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">{kpi.label}</p>

                            {/* Conteúdo dinâmico */}
                            {kpi.isModuleReady ? (
                                kpi.label.includes('Top Categoria') && Array.isArray(kpi.value) ? (
                                    <div className="mt-3 space-y-2">
                                        {kpi.value.length > 0 ? (
                                            kpi.value.map((item, idx) => {
                                                const isVenda = item.categoria === 'Venda' || item.categoria === 'SALE';
                                                return (
                                                    <div key={idx} className="group">
                                                        {idx > 0 && (
                                                            <div className="w-full h-px bg-gray-200 dark:bg-slate-700/60 my-1"></div>
                                                        )}
                                                        <div className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-white/50 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                {isVenda && <span className="text-sm">💰</span>}
                                                                {item.categoria === 'Troco' && <span className="text-sm">🔄</span>}
                                                                <span
                                                                    className={`text-sm font-medium ${isVenda ? 'text-purple-800' : 'text-gray-600 dark:text-slate-300'
                                                                        }`}
                                                                >
                                                                    {item.categoria}
                                                                </span>
                                                            </div>
                                                            <span
                                                                className={`font-extrabold tabular-nums text-sm ${isVenda ? 'text-purple-900' : 'text-gray-900 dark:text-white'
                                                                    }`}
                                                            >
                                                                {formatCurrency(item.valor)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-gray-400 text-sm">— Sem dados —</span>
                                        )}
                                    </div>
                                ) : (
                                    /* Outros cards prontos (Margem, Lançamentos) */
                                    <p className={`text-3xl font-extrabold tabular-nums mt-2 ${kpi.valueClass}`}>
                                        {kpi.value}
                                    </p>
                                )
                            ) : (
                                /* Módulos em breve - NOVO LAYOUT COM ÍCONE CENTRAL */
                                <motion.div
                                    className="flex flex-col items-center justify-center h-28 w-full transition-opacity duration-300"
                                    title="Módulo em breve" // Tooltip nativo
                                >
                                    <Info className="w-10 h-10 text-gray-500 dark:text-slate-400 mb-2" />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 text-center">{kpi.subText}</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Badge de Status/Crescimento (posição e estilo mantidos) */}
                        <div className="flex items-center justify-between mt-3">
                            <div className={`p-2 rounded-full bg-${kpi.color}-100 text-${kpi.color}-600`}>
                                <kpi.icon className="w-5 h-5 opacity-0" /> {/* Espaço reservado */}
                            </div>
                            <span className={`px-2.5 py-1 ${kpi.isModuleReady ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'} text-xs font-medium rounded-full shadow-sm`}>
                                {kpi.isModuleReady ? kpi.badgeText : 'Em Desenvolvimento'}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Resumo com gradientes vibrantes e badges (Mantido) */}
            <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-poppins" variants={containerVariants}>
                {[
                    {
                        label: 'Entradas do Dia',
                        value: formatCurrency(entries),
                        // Ícone Lucide TrendindUp substituído por Imagem
                        image: 'https://cdn-icons-png.flaticon.com/512/2916/2916115.png',
                        color: 'green',
                        gradient: 'from-green-900 to-emerald-900',
                    },
                    {
                        label: 'Saídas do Dia',
                        value: formatCurrency(exits),
                        // Ícone Lucide TrendindDown substituído por Imagem
                        image: 'https://cdn-icons-png.flaticon.com/512/2331/2331668.png',
                        color: 'red',
                        gradient: 'from-red-700 to-rose-700',
                    },
                    {
                        label: 'Saldo do Dia',
                        value: formatCurrency(balance),
                        // Ícone Lucide DollarSign substituído por Imagem
                        image: balance >= 0
                            ? 'https://png.pngtree.com/png-clipart/20230805/original/pngtree-payment-icon-circle-balance-commerce-vector-picture-image_9731293.png'
                            : 'https://cdn-icons-png.flaticon.com/512/334/334047.png',
                        color: balance >= 0 ? 'blue' : 'red',
                        gradient: balance >= 0 ? 'from-blue-700 to-sky-700' : 'from-red-700 to-pink-700',
                    },
                    {
                        label: 'Total do Mês',
                        value: formatCurrency(totalMes),
                        // Ícone Lucide Calendar substituído por Imagem
                        image: 'https://cdn-icons-png.flaticon.com/512/13/13530.png',
                        color: 'purple',
                        gradient: 'from-purple-400 to-violet-400',
                    },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        // Adicionado 'text-white' ao card para garantir que o texto seja visível no gradiente escuro
                        className={`bg-gradient-to-br ${item.gradient} border border-${item.color}-200/40 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all min-h-48 flex flex-col justify-between text-white`}
                    >
                        <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            {/* Cor do valor ajustada para usar a cor base do card (white) já que os fundos são escuros */}
                            <p className={`text-3xl tabular-nums font-extrabold text-white mt-1`}>
                                {item.value}
                            </p>
                        </div>
                        {/* Bloco do Ícone: Agora usa a tag <img> */}
                        <div className={`p-2 rounded-full bg-white/20 w-fit`}>
                            <img src={item.image} alt={item.label} className="w-6 h-6 invert" />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Meta Editável com efeito premium (Mantido) */}
            <motion.div variants={itemVariants}>
                <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow min-h-48">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:text-purple-400">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3
                                className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins"
                            >
                                Meta de Faturamento Mensal
                            </h3>
                        </div>

                        {/* Bloco substituído pelo novo texto "Módulo em breve" */}
                        <span className="text-sm font-open_sans text-gray-500 dark:text-slate-400 italic">
                            Módulo em breve
                        </span>

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
                                    className="px-3 py-1 border border-blue-300 rounded-lg text-sm w-32 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 font-open_sans"
                                />
                                <span className="text-gray-500 dark:text-slate-400">R$/mês</span>
                            </div>
                        ) : (
                            <p className="text-3xl font-extrabold font-open_sans text-gray-900 dark:text-white tabular-nums">
                                R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-1 overflow-hidden ring-1 ring-white/40">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((totalMes / metaMensal) * 100, 100)}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${totalMes >= metaMensal
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : totalMes / metaMensal >= 0.7
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                    : 'bg-gradient-to-r from-red-500 to-pink-600'
                                }`}
                        ></motion.div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /{' '}
                        {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                        ({((totalMes / metaMensal) * 100).toFixed(1)}%)
                    </p>
                </div>
            </motion.div>

            {/* Gráficos de Módulos Futuros (Mantidos) */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-open_sans" variants={containerVariants}>
                {[
                    {
                        title: "Previsão de Caixa",
                        icon: TrendingUp,
                        color: "from-green-400 to-emerald-500",
                    },
                    {
                        title: "Heatmap de Vendas",
                        icon: Calendar,
                        color: "from-orange-400 to-red-500",
                    },
                    {
                        title: "Top Produtos",
                        icon: Box,
                        color: "from-purple-400 to-violet-500",
                    },
                    {
                        title: "Insights Inteligentes",
                        icon: GraduationCap,
                        color: "from-blue-400 to-cyan-500",
                    },
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        className={`backdrop-blur-xl bg-gradient-to-br ${card.color}/20 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48 flex flex-col items-center justify-center text-center`}
                    >
                        <div className={`p-3 rounded-full bg-${card.color.split(" ")[0].replace("from-", "")}/10 mb-4`}>
                            <card.icon className="w-8 h-8 text-gray-700 dark:text-slate-200" />
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">{card.title}</h3>
                        <p className="text-gray-600 dark:text-slate-300 text-sm font-poppins">Módulo em breve!</p>
                        <div className="mt-4 w-16 h-1 bg-gradient-to-r from-current to-transparent rounded-full opacity-30"></div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Gráficos Menores (Mantidos) */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" variants={containerVariants}>
                <motion.div variants={chartVariants}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all min-h-48"
                    >
                        <h3 className="text-lg font-poppins tracking-tight text-gray-900 dark:text-white mb-4">Entradas vs Saídas</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={[{ name: 'Hoje', entries, exits }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="entries" fill="url(#entryGradient)" name="Entradas" />
                                <Bar dataKey="exits" fill="url(#exitGradient)" name="Saídas" />
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
                        <h3 className="text-lg font-poppins tracking-tight text-gray-900 dark:text-white mb-4">Evolução Diária</h3>
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

            {/* Histórico (Mantido) */}
            <motion.div variants={itemVariants}>
                <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transition-shadow min-h-48">
                    <div className="p-6 border-b border-white/20">
                        <h2 className="text-xl font-poppins tracking-tight text-gray-900 dark:text-white">
                            Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}
                        </h2>
                    </div>
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                        <p>Este painel exibe apenas métricas gerais.</p>
                        <p className="text-sm mt-1">Para ver movimentações detalhadas, vá ao histórico.</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/historico')}
                            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                            Ver histórico completo
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}