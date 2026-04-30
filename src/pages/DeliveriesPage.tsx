// pages/DeliveriesPage.tsx
import { MetricCard } from './MetricCard';
import { PieChart } from './PieChart';
import { Delivery } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
    Truck,
    Calendar,
    MapPin,
    User,
    Plus,
    BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDeliveries, subscribeDeliveries, updateDeliveryStatus } from '../lib/deliveries-store';

// Função utilitária: entregas por mês
const getMonthlyDeliveries = (deliveries: Delivery[], status: Delivery['status']) => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return date;
    });

    return last12Months.map((month) =>
        deliveries.filter((d) => {
            const deliveryDate = new Date(d.status === 'entregue' ? d.deliveryDate! : d.scheduledDate);
            return (
                deliveryDate.getMonth() === month.getMonth() &&
                deliveryDate.getFullYear() === month.getFullYear() &&
                d.status === status
            );
        }).length
    );
};

export function DeliveriesPage() {
    const { user, logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [deliveries, setDeliveries] = useState<Delivery[]>(() => listDeliveries());
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
        const unsub = subscribeDeliveries(() => setDeliveries(listDeliveries()));
        return unsub;
    }, []);

    // Métricas
    const deliveredCount = deliveries.filter((d) => d.status === 'entregue').length;
    const delayedCount = deliveries.filter((d) => d.status === 'atrasado').length;
    const onRouteCount = deliveries.filter((d) => d.status === 'em rota').length;
    const pendingCount = deliveries.filter((d) => d.status === 'pendente').length;

    // Dados para gráfico de linha: entregas por mês
    const deliveredData = getMonthlyDeliveries(deliveries, 'entregue');
    const delayedData = getMonthlyDeliveries(deliveries, 'atrasado');

    // Dados para gráfico de pizza: por categoria
    const categoryDistribution = deliveries.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(categoryDistribution).map(([category, count]) => ({
        name: category,
        value: count,
    }));

    const isEmpty = deliveredData.every(v => v === 0) && delayedData.every(v => v === 0);

    return (
        <div className="space-y-8 px-4 lg:px-8 py-6 w-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Entregas</h1>
                        <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativo
                        </span>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">Logística e rastreamento de pedidos em tempo real</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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

            {/* Cards de Métricas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1"
            >
                <MetricCard
                    title="ENTREGAS HOJE"
                    value={deliveries.filter(d => new Date(d.scheduledDate).toDateString() === new Date().toDateString()).length}
                    color="blue"
                    icon="🚚"
                    isCount={true}
                />
                <MetricCard
                    title="EM ROTA"
                    value={onRouteCount}
                    color="orange"
                    icon="📍"
                    isCount={true}
                />
                <MetricCard
                    title="ATRASADAS"
                    value={delayedCount}
                    color="red"
                    icon="⚠️"
                    isCount={true}
                />
                <MetricCard
                    title="TOTAL ENTREGUES"
                    value={deliveredCount}
                    color="green"
                    icon="✅"
                    isCount={true}
                />
            </motion.div>

            {/* Atalhos */}
            {/* Atalhos */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4 px-1"
            >
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ações Rápidas</h2>
                    <button
                        onClick={() => navigate('/entregas/cadastrar')}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nova Entrega</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nova Entrega */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/entregas/cadastrar')}
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Nova Entrega</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Registrar saída de produto</p>
                    </motion.div>

                    {/* Agendar Rota */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/entregas/agendar')}
                    >
                        <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Agendar Rota</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Planeje entregas futuras</p>
                    </motion.div>

                    {/* Relatório de Rotas */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/entregas/relatorios')}
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-green-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Relatório de Rotas</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Eficiência e atrasos</p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Gráficos */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-1"
            >
                {/* Gráfico de Linha: Entregas vs Atrasos */}
                <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm h-full">
                        <div className="border-b pb-3 mb-4">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Entregas vs Atrasos</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Últimos 12 meses</p>
                        </div>
                        {isEmpty ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <Truck className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm">Sem dados de entregas</p>
                            </div>
                        ) : (
                            <div className="h-64">
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de Pizza e Card de Suporte */}
                <div className="space-y-6">
                    {/* Card de Suporte */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-all duration-200"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h4 className="text-sm font-medium">Precisa de ajuda com rotas?</h4>
                                <p className="text-xs mt-1 opacity-90">Otimize com nossos especialistas em logística.</p>
                                <button className="mt-2 px-3 py-1 bg-white dark:bg-slate-900 bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition">
                                    Falar com logística
                                </button>
                            </div>
                            <MapPin className="w-8 h-8 bg-white dark:bg-slate-900 bg-opacity-20 rounded-full p-1" />
                        </div>
                    </motion.div>

                    {/* Gráfico de Pizza: por categoria */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                        <div className="border-b pb-3 mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Entregas por Categoria</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Distribuição de carga</p>
                        </div>
                        {pieData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <Truck className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs">Sem dados ainda</p>
                            </div>
                        ) : (
                            <PieChart data={pieData} />
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Gráfico de Status de Entregas */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm px-1"
            >
                <div className="border-b pb-3 mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Entregas registradas</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            {deliveries.length} entregas · {pendingCount} pendentes · {onRouteCount} em rota
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/entregas/cadastrar')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nova
                    </button>
                </div>
                {deliveries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Truck className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma entrega cadastrada ainda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                                    <th className="py-2 pr-3">Pedido</th>
                                    <th className="py-2 pr-3">Motorista</th>
                                    <th className="py-2 pr-3">Destino</th>
                                    <th className="py-2 pr-3">Saída</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2 pr-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.slice(0, 10).map((d) => (
                                    <tr key={d.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                                        <td className="py-2.5 pr-3 font-mono text-[12px] text-slate-700 dark:text-slate-300">{d.orderId}</td>
                                        <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-300">{d.driver}</td>
                                        <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{d.destination}</td>
                                        <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400 tabular-nums">
                                            {new Date(d.scheduledDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="py-2.5 pr-3">
                                            <StatusBadge status={d.status} />
                                        </td>
                                        <td className="py-2.5 pr-0 text-right">
                                            <select
                                                value={d.status}
                                                onChange={(e) => updateDeliveryStatus(d.id, e.target.value as Delivery['status'])}
                                                className="h-7 px-2 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[11.5px] text-slate-700 dark:text-slate-200"
                                            >
                                                <option value="pendente">pendente</option>
                                                <option value="em rota">em rota</option>
                                                <option value="entregue">entregue</option>
                                                <option value="atrasado">atrasado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function StatusBadge({ status }: { status: Delivery['status'] }) {
    const map: Record<Delivery['status'], string> = {
        'pendente': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        'em rota': 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
        'entregue': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
        'atrasado': 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${map[status]}`}>
            {status}
        </span>
    );
}