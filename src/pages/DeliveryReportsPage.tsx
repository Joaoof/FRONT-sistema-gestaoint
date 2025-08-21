// src/pages/DeliveryReportsPage.tsx
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    BarChart3,
    Truck,
    CheckCircle,
    AlertTriangle,
    Clock,
    Download,
    RefreshCw,
    Calendar,
    MapPin,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ✅ Importe direto do Recharts (funciona no Vite)
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart as RechartsBarChart,
    Bar,
} from 'recharts';

// Tipos
type DeliveryData = { name: string; value: number; change?: number; history?: number[] };
type KPI = { value: string; label: string; icon: React.ReactNode; trend?: 'up' | 'down'; color: string };

export function DeliveryReportsPage() {
    const [mounted, setMounted] = useState(false);
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
    const [loading, setLoading] = useState(true);
    const [criticalAlert, setCriticalAlert] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Simula carregamento de dados
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    // Dados simulados
    const monthlyDeliveries = Array.from({ length: 12 }, (_, i) => ({
        month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
        deliveries: [12, 15, 10, 18, 14, 20, 16, 13, 19, 22, 17, 24][i],
        previous: [10, 14, 12, 15, 13, 18, 15, 14, 17, 20, 16, 22][i],
    }));

    const deliveryStatus = [
        { name: 'Entregues', value: 85 },
        { name: 'Em Rota', value: 10 },
        { name: 'Atrasadas', value: 5 },
    ];

    const topDestinations: DeliveryData[] = [
        { name: 'SP', value: 40, change: 2.1, history: [38, 39, 41, 40] },
        { name: 'RJ', value: 25, change: -1.5, history: [26, 27, 24, 25] },
        { name: 'MG', value: 15, change: 0.8, history: [14, 15, 16, 15] },
        { name: 'PR', value: 12, change: 0, history: [12, 11, 12, 13] },
        { name: 'RS', value: 8, change: -0.3, history: [8, 9, 8, 7] },
    ];

    // KPIs
    const kpis: KPI[] = [
        { value: '142', label: 'Entregas no mês', icon: <Truck className="w-5 h-5" />, trend: 'up', color: 'text-blue-600' },
        { value: '92%', label: 'Pontualidade', icon: <CheckCircle className="w-5 h-5" />, trend: 'up', color: 'text-green-600' },
        { value: '8', label: 'Atrasos', icon: <AlertTriangle className="w-5 h-5" />, trend: 'down', color: 'text-orange-600' },
        { value: '2.4h', label: 'Tempo médio', icon: <Clock className="w-5 h-5" />, trend: 'up', color: 'text-purple-600' },
    ];

    // Insights
    const insights = [
        { type: 'success', text: '🚚 SP é o destino mais frequente (40%)' },
        { type: 'info', text: '⏱️ Tempo médio caiu 0.3h vs mês passado' },
        { type: 'warning', text: '⚠️ Atrasos concentrados em RJ (5 ocorrências)' },
    ];

    // Simulação de alerta crítico
    useEffect(() => {
        if (topDestinations.find(d => d.name === 'RJ' && d.value > 20)) {
            setCriticalAlert(true);
            const timer = setTimeout(() => setCriticalAlert(false), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Cores
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Background dinâmico (nodes & linhas) */}
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `
            radial-gradient(circle at 20% 30%, #3B82F6 1px, transparent 1px),
            radial-gradient(circle at 80% 10%, #10B981 1px, transparent 1px),
            radial-gradient(circle at 40% 70%, #F59E0B 1px, transparent 1px),
            radial-gradient(circle at 90% 60%, #EF4444 1px, transparent 1px),
            linear-gradient(45deg, transparent 98%, #6B7280 99%)
          `,
                    backgroundSize: '200px 200px',
                }}
            />

            <div className="relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white border-b border-gray-200 px-6 py-5 rounded-xl shadow-sm mx-4 lg:mx-8 mb-6"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-['Rubik']">
                                Relatórios de Entregas
                            </h1>
                            <div className="flex items-center mt-1.5 space-x-1 text-sm text-gray-600">
                                <Home className="w-4 h-4" />
                                <span>/</span>
                                <span className="hover:text-blue-600 hover:underline cursor-pointer">Dashboard</span>
                                <span>/</span>
                                <span className="text-blue-600 font-medium">Relatórios</span>
                                <span>/</span>
                                <span className="text-gray-900 font-medium">Entregas</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setLoading(true)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                <span>Atualizar</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                                <Download className="w-4 h-4" />
                                <span>Exportar</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Filtros */}
                <div className="mx-4 lg:mx-8 mb-6 flex flex-wrap gap-3">
                    {(['today', 'week', 'month', 'year', 'custom'] as const).map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setPeriod(preset)}
                            className={`px-4 py-2 text-sm rounded-lg transition capitalize ${period === preset
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {preset === 'today' && 'Hoje'}
                            {preset === 'week' && '7 dias'}
                            {preset === 'month' && 'Mês'}
                            {preset === 'year' && 'Ano'}
                            {preset === 'custom' && <Calendar className="w-4 h-4 inline" />}
                        </button>
                    ))}
                </div>

                {/* Skeleton ou conteúdo */}
                {loading ? (
                    <div className="space-y-6 mx-4 lg:mx-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white h-24 rounded-2xl animate-pulse border border-gray-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-4 lg:mx-8 mb-6">
                            {kpis.map((kpi, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                                >
                                    <div className={`inline-flex p-2 rounded-xl mb-2 ${kpi.color.replace('text-', 'bg-').replace('600', '100')}`}>
                                        {kpi.icon}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        <CountUp start={0} end={parseFloat(kpi.value)} duration={1.5} suffix={kpi.value.includes('h') ? 'h' : ''} />
                                    </p>
                                    <p className="text-sm text-gray-600">{kpi.label}</p>
                                    {kpi.trend && (
                                        <span className={`inline-flex items-center text-xs mt-1 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                            {kpi.trend === 'up' ? '↑' : '↓'} {kpi.trend === 'up' ? '0.8%' : '1.2%'}
                                        </span>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Insights */}
                        <div className="mx-4 lg:mx-8 mb-6 space-y-2">
                            <AnimatePresence>
                                {insights.map((insight, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.2 }}
                                        className={`p-3 rounded-lg text-sm font-medium ${insight.type === 'success'
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : insight.type === 'warning'
                                                ? 'bg-orange-50 text-orange-800 border border-orange-200 animate-pulse'
                                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                                            }`}
                                    >
                                        {insight.text}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-4 lg:mx-8 mb-6">
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="text-base font-semibold mb-4 flex items-center">
                                    <Truck className="w-5 h-5 mr-2 text-blue-600" />
                                    Entregas por Mês
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyDeliveries}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => [value, 'Entregas']}
                                            labelFormatter={(label) => `Mês: ${label}`}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="deliveries" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} name="2025" />
                                        <Line type="monotone" dataKey="previous" stroke="#9CA3AF" strokeDasharray="5 5" dot={false} name="2024" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="text-base font-semibold mb-4 flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                    Status das Entregas
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={deliveryStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            nameKey="name"
                                            animationDuration={1200}
                                        >
                                            {deliveryStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
                                <h3 className="text-base font-semibold mb-4 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                                    Principais Destinos
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsBarChart data={topDestinations} layout="vertical" margin={{ left: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number) => [value + '%', 'Participação']}
                                            content={({ payload }) => {
                                                if (payload && payload[0]) {
                                                    const data = payload[0].payload as DeliveryData;
                                                    return (
                                                        <div className="bg-white p-3 rounded-lg shadow-lg border">
                                                            <p><strong>{data.name}</strong>: {data.value}%</p>
                                                            <p className="text-sm text-gray-600">Histórico: {data.history?.join(', ')}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                                            {topDestinations.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.name === 'RJ' ? '#EF4444' : '#8B5CF6'}
                                                    className="hover:cursor-pointer"
                                                />
                                            ))}
                                        </Bar>
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* Alerta flutuante */}
                <AnimatePresence>
                    {criticalAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse z-50"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            <span>Alerta: Atrasos críticos em RJ!</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Componente CountUp (mesmo código)
function CountUp({ start, end, duration = 2, suffix = '' }) {
    const [count, setCount] = useState(start);

    useEffect(() => {
        let startTime: number | null = null;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const value = start + (end - start) * easeOutCubic(progress);
            setCount(parseFloat(value.toFixed(2)));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [start, end, duration]);

    return <>{count}{suffix}</>;
}

function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}