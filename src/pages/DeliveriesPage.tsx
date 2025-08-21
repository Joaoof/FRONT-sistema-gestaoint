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

const mockDeliveries: Delivery[] = [
    { id: '1', orderId: 'ENT-1001', driver: 'Carlos Silva', vehicle: 'Caminhão 123', route: 'Rota A', category: 'Produtos Acabados', status: 'entregue', scheduledDate: '2025-03-01', deliveryDate: '2025-03-01', origin: 'Fábrica Central', destination: 'Distribuidor SP', distanceKm: 120, estimatedTimeHours: 2 },
    { id: '2', orderId: 'ENT-1002', driver: 'Ana Souza', vehicle: 'Van 456', route: 'Rota B', category: 'Materiais Brutos', status: 'em rota', scheduledDate: '2025-03-02', origin: 'Porto Santos', destination: 'Fábrica Central', distanceKm: 80, estimatedTimeHours: 1.5 },
    { id: '3', orderId: 'ENT-1003', driver: 'João Lima', vehicle: 'Caminhão 789', route: 'Rota C', category: 'Produtos Acabados', status: 'atrasado', scheduledDate: '2025-03-01', origin: 'Fábrica Central', destination: 'Distribuidor RJ', distanceKm: 400, estimatedTimeHours: 6 },
    { id: '4', orderId: 'ENT-1004', driver: 'Maria Oliveira', vehicle: 'Van 101', route: 'Rota A', category: 'Alimentos', status: 'pendente', scheduledDate: '2025-03-03', origin: 'Fábrica Central', destination: 'Supermercado BH', distanceKm: 600, estimatedTimeHours: 8 },
    { id: '5', orderId: 'ENT-1005', driver: 'Pedro Costa', vehicle: 'Caminhão 123', route: 'Rota D', category: 'Produtos Acabados', status: 'entregue', scheduledDate: '2025-03-02', deliveryDate: '2025-03-02', origin: 'Fábrica Central', destination: 'Atacado Curitiba', distanceKm: 180, estimatedTimeHours: 3 },
];

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
    const navigate = useNavigate();// Dados simulados (você pode substituir por API)

    useEffect(() => {
        setMounted(true);
    }, []);

    // Métricas
    const deliveredCount = mockDeliveries.filter((d) => d.status === 'entregue').length;
    const delayedCount = mockDeliveries.filter((d) => d.status === 'atrasado').length;
    const onRouteCount = mockDeliveries.filter((d) => d.status === 'em rota').length;

    // Dados para gráfico de linha: entregas por mês
    const deliveredData = getMonthlyDeliveries(mockDeliveries, 'entregue');
    const delayedData = getMonthlyDeliveries(mockDeliveries, 'atrasado');

    // Dados para gráfico de pizza: por categoria
    const categoryDistribution = mockDeliveries.reduce((acc, d) => {
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
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white border-b border-gray-200 px-6 py-5 rounded-xl shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-['Rubik']">
                            Controle de Entregas
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1"
            >
                <MetricCard
                    title="ENTREGAS HOJE"
                    value={mockDeliveries.filter(d => new Date(d.scheduledDate).toDateString() === new Date().toDateString()).length}
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
                    <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
                    <button
                        onClick={() => navigate('/entregas/cadastrar')}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition"
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
                        className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/entregas/cadastrar')}
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <Truck className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Nova Entrega</h3>
                        <p className="text-sm text-gray-500">Registrar saída de produto</p>
                    </motion.div>

                    {/* Agendar Rota */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/entregas/agendar')}
                    >
                        <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Agendar Rota</h3>
                        <p className="text-sm text-gray-500">Planeje entregas futuras</p>
                    </motion.div>

                    {/* Relatório de Rotas */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/entregas/relatorios')}
                    >
                        <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Relatório de Rotas</h3>
                        <p className="text-sm text-gray-500">Eficiência e atrasos</p>
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
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
                        <div className="border-b pb-3 mb-4">
                            <h3 className="text-base font-semibold text-gray-900">Entregas vs Atrasos</h3>
                            <p className="text-sm text-gray-500">Últimos 12 meses</p>
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
                                <button className="mt-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition">
                                    Falar com logística
                                </button>
                            </div>
                            <MapPin className="w-8 h-8 bg-white bg-opacity-20 rounded-full p-1" />
                        </div>
                    </motion.div>

                    {/* Gráfico de Pizza: por categoria */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="border-b pb-3 mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Entregas por Categoria</h3>
                            <p className="text-xs text-gray-500">Distribuição de carga</p>
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
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm px-1"
            >
                <div className="border-b pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Status das Entregas</h3>
                    <p className="text-sm text-gray-500">Distribuição atual de todas as entregas</p>
                </div>
                <div className="h-40">

                </div>
            </motion.div>
        </div>
    );
}