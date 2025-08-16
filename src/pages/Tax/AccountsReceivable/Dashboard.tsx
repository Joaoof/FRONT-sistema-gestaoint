import { DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { EditReceivableModal } from './EditReceivableModal';
import { Receivable } from '../../../types';

// ==============================
// Tipos
// ==============================
interface SummaryCardProps {
    label: string;
    value: number;
    color: 'blue' | 'yellow' | 'green';
    progress?: number; // opcional: para mostrar % (ex: nos pendentes)
}


// ==============================
// Componente: SummaryCard
// ==============================
function SummaryCard({ label, value, color, progress }: SummaryCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-800 text-blue-900',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 text-yellow-900',
        green: 'bg-green-50 border-green-200 text-green-800 text-green-900',
    };

    const [border, text, valueText] = colorClasses[color].split(' ');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`border ${border} rounded-lg p-6 text-center cursor-default hover:shadow-md transition-shadow`}
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
                    <p className={`text-xs mt-1 ${text}`}>{progress}% recebido</p>
                </div>
            )}
        </motion.div>
    );
}

// ==============================
// Componente: ActionButton
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
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
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

function RecentReceivablesTable() {
    const [data, setData] = useState<Receivable[]>([
        { id: '1', client: 'Maria Silva', amount: 1200, dueDate: '2025-04-10', status: 'pending', interestRate: 0.033 },
        { id: '2', client: 'Empresa Tech Ltda', amount: 4500, dueDate: '2024-04-05', status: 'overdue', interestRate: 0.05 },
        { id: '3', client: 'João Oliveira', amount: 2300, dueDate: '2025-04-15', status: 'paid' },
        { id: '4', client: 'Clínica Saúde+', amount: 3100, dueDate: '2025-04-12', status: 'pending', interestRate: 0.033 },
        { id: '5', client: 'Luiza Mendes', amount: 1400, dueDate: '2025-04-08', status: 'paid' },
    ]);

    const [editing, setEditing] = useState<Receivable | null>(null);

    const handleSave = (updated: Receivable) => {
        setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setEditing(null);
    };

    const getStatusLabel = (status: Receivable['status']) => ({
        pending: 'Pendente',
        paid: 'Pago',
        overdue: 'Atrasado',
    })[status];

    const getStatusColor = (status: Receivable['status']) => ({
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
    })[status];

    // Função: calcular juros compostos por dia de atraso
    const calculateOverdueAmount = (amount: number, dueDate: string, interestRate = 0.033) => {
        const today = new Date();
        const due = new Date(dueDate);
        const daysLate = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

        if (daysLate === 0) return amount;

        // Juros compostos: valor * (1 + taxa)^dias
        return amount * Math.pow(1 + interestRate / 100, daysLate);
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor Original
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vencimento
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor com Juros
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item) => {
                            const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'paid';
                            const finalAmount = isOverdue
                                ? calculateOverdueAmount(item.amount, item.dueDate, item.interestRate)
                                : item.amount;

                            return (
                                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.client}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.dueDate)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {finalAmount !== item.amount ? (
                                            <span className="text-red-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount)}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                                        >
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            onClick={() => setEditing(item)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Edição */}
            {editing && (
                <EditReceivableModal
                    receivable={editing}
                    onSave={handleSave}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

// ==============================
// Dashboard Principal
// ==============================
export function AccountsReceivableDashboard() {
    const navigate = useNavigate();

    // Dados dinâmicos (futuramente virão do backend)
    const [data] = useState({
        total: 12500,
        pending: 8200,
        paid: 4300,
    });

    // Simulação de carregamento (opcional)
    const [loading] = useState(false);

    useEffect(() => {
        // Aqui você faria: fetch('/api/receivables/summary')
        // setData(response.data);
    }, []);

    const paidPercentage = data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Título */}
            <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Contas a Receber</h1>
                <p className="text-gray-600">Gestão de recebíveis: clientes, vencimentos e pagamentos</p>
            </div>

            {/* Ações Rápidas */}
            <div className="flex flex-wrap gap-4">
                <ActionButton
                    icon={DollarSign}
                    label="Nova Conta a Receber"
                    onClick={() => navigate('/app/fiscal/receivables/create')}
                />
                <ActionButton
                    icon={TrendingUp}
                    label="Ver Todas"
                    variant="secondary"
                    onClick={() => navigate('/app/fiscal/receivables/list')}
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
                    label="Total a Receber"
                    value={data.total}
                    color="blue"
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

            {/* Últimas Contas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Contas Cadastradas</h2>
                <RecentReceivablesTable />
            </div>
        </div>
    );
}