import { FileText, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// ==============================
// Tipos
// ==============================
interface SummaryCardProps {
    label: string;
    value: number;
    color: 'red' | 'yellow' | 'green';
    progress?: number;
}

interface Payable {
    id: string;
    supplier: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
    category: string;
}

// ==============================
// Componente: SummaryCard (compartilhado)
// ==============================
function SummaryCard({ label, value, color, progress }: SummaryCardProps) {
    const colorClasses = {
        red: 'bg-red-50 border-red-200 text-red-800 text-red-900',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 text-yellow-900',
        green: 'bg-green-50 border-green-200 text-green-800 text-green-900',
    };

    const [border, text, valueText] = colorClasses[color].split(' ');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`border ${border} rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-default`}
        >
            <p className={`text-sm ${text} font-medium`}>{label}</p>
            <p className={`text-2xl font-bold ${valueText} mt-1`}>
                {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                }).format(value)}
            </p>

            {progress !== undefined && (
                <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className={`text-xs mt-1 ${text}`}>{progress}% pagos</p>
                </div>
            )}
        </motion.div>
    );
}

// ==============================
// Componente: ActionButton (compartilhado)
// ==============================
function ActionButton({
    icon: Icon,
    label,
    variant = 'primary',
    onClick,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    variant?: 'primary' | 'secondary';
    onClick: () => void;
}) {
    const baseClasses = 'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200';
    const variants = {
        primary: 'bg-red-600 hover:bg-red-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} hover:shadow-md`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );
}

// ==============================
// Componente: RecentPayablesTable
// ==============================
function RecentPayablesTable() {
    const mockData: Payable[] = [
        { id: '1', supplier: 'Fornecedor Tech', amount: 1800, dueDate: '2025-04-10', status: 'pending', category: 'TI' },
        { id: '2', supplier: 'Energia Elétrica S/A', amount: 950, dueDate: '2024-04-05', status: 'overdue', category: 'Energia' },
        { id: '3', supplier: 'Aluguel Imobiliária', amount: 3200, dueDate: '2025-04-01', status: 'paid', category: 'Aluguel' },
        { id: '4', supplier: 'Internet Fibra Ltda', amount: 420, dueDate: '2025-04-12', status: 'pending', category: 'Internet' },
        { id: '5', supplier: 'Contabilidade ABC', amount: 1200, dueDate: '2025-04-08', status: 'paid', category: 'Serviços' },
    ];

    const getStatusLabel = (status: Payable['status']) => ({
        pending: 'Pendente',
        paid: 'Pago',
        overdue: 'Atrasado',
    })[status];

    const getStatusColor = (status: Payable['status']) => ({
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
    })[status];

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && status !== 'paid';

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fornecedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoria
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vencimento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {mockData.map((item) => (
                        <tr
                            key={item.id}
                            className={`hover:bg-gray-50 transition-colors ${isOverdue(item.dueDate) ? 'bg-red-50' : ''}`}
                        >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.supplier}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(item.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                                >
                                    {getStatusLabel(item.status)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==============================
// Dashboard Principal
// ==============================
export function AccountsPayableDashboard() {
    const navigate = useNavigate();

    const [data] = useState({
        total: 7800,
        pending: 5200,
        paid: 2600,
    });

    const [loading] = useState(false);

    useEffect(() => {
        // Futuramente: fetch('/api/payables/summary')
    }, []);

    const paidPercentage = data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Título */}
            <div>
                <h1 className="text-3xl font-bold font-['Rajdhani'] text-gray-900 mb-2">Contas a Pagar</h1>
                <p className="text-gray-600">Gestão de fornecedores, despesas e pagamentos</p>
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-wrap gap-4">
                <ActionButton
                    icon={FileText}
                    label="Nova Conta a Pagar"
                    onClick={() => navigate('/app/fiscal/payables/create')}
                />
                <ActionButton
                    icon={TrendingDown}
                    label="Ver Todas"
                    variant="secondary"
                    onClick={() => navigate('/app/fiscal/payables/list')}
                />
            </div>

            {/* Resumo com animação */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: { staggerChildren: 0.1 },
                    },
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <SummaryCard
                    label="Total a Pagar"
                    value={data.total}
                    color="red"
                />
                <SummaryCard
                    label="Pendentes"
                    value={data.pending}
                    color="yellow"
                    progress={100 - paidPercentage}
                />
                <SummaryCard
                    label="Pagos"
                    value={data.paid}
                    color="green"
                    progress={paidPercentage}
                />
            </motion.div>

            {/* Últimas Contas a Pagar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Contas a Pagar</h2>
                <RecentPayablesTable />
            </div>
        </div>
    );
}