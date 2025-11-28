import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Search,
    Download,
    LayoutList,
    AlignLeft,
    ArrowUpRight,
    CheckCircle,
    Clock,
    DollarSign,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_TAX_EXPENSES } from '../../../graphql/queries/suppliers';
import { useAuth } from '../../../contexts/AuthContext';

const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
    
    .font-poppins { font-family: 'Poppins', sans-serif; }
    .font-open_sans { font-family: 'Open Sans', sans-serif; }
    
    .timeline-line {
      position: absolute;
      left: 24px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e2e8f0;
      z-index: 0;
    }
  `}</style>
);

// ==============================
// TYPES
// ==============================

export enum PayableStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
}

export interface TaxExpense {
    id: string;
    supplier: string;
    value: number;
    description: string;
    dueDate: string;
    status: PayableStatus;
}

// ==============================
// UTILS
// ==============================

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const getStatusColor = (status: PayableStatus) => {
    switch (status) {
        case PayableStatus.PAID: return 'text-green-600 bg-green-50 border-green-200';
        case PayableStatus.OVERDUE: return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
};

const getMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

// ==============================
// COMPONENTES DE UI
// ==============================

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-2xl border bg-white flex items-center justify-between shadow-sm`}
    >
        <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-800 font-poppins">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
    </motion.div>
);

const TimelineItem = ({ item }: { item: TaxExpense, isLast: boolean }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative pl-16 py-4 group"
    >
        {/* Dot on Timeline */}
        <div className={`absolute left-[19px] top-6 w-3 h-3 rounded-full border-2 bg-white z-10 transition-colors duration-300
      ${item.status === PayableStatus.PAID ? 'border-green-500 group-hover:bg-green-500' : 'border-gray-300'}
    `} />

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group-hover:border-gray-200">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === PayableStatus.PAID ? 'bg-green-500' : 'bg-yellow-400'
                }`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 font-poppins">{item.supplier}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(item.status)}`}>
                            {item.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 font-open_sans">{item.description}</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium uppercase">Vencimento</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 font-medium">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.dueDate)}
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium uppercase">Valor</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(item.value)}</p>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

export default function AccountsPayableHistory() {
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const { data, loading, refetch } = useQuery(GET_TAX_EXPENSES, {
        fetchPolicy: 'cache-and-network',
        skip: authLoading || !isAuthenticated || !user?.id,
        variables: { input: {} }
    });

    const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
    const [filterText, setFilterText] = useState('');

    const taxExpenses = useMemo(() => data?.taxExpenses || [], [data]);

    // Filtragem no cliente (pode ser movida para o back-end via variables se preferir)
    const filteredData = useMemo(() => {
        return taxExpenses.filter((item: TaxExpense) =>
            item.supplier.toLowerCase().includes(filterText.toLowerCase()) ||
            item.description.toLowerCase().includes(filterText.toLowerCase())
        );
    }, [taxExpenses, filterText]);

    // Agrupamento por mês para Timeline
    const groupedData = useMemo(() => {
        const groups: { [key: string]: TaxExpense[] } = {};

        // Ordenar por data decrescente antes de agrupar
        const sortedData = [...filteredData].sort((a, b) =>
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        );

        sortedData.forEach(item => {
            const month = getMonthLabel(item.dueDate);
            if (!groups[month]) groups[month] = [];
            groups[month].push(item);
        });
        return groups;
    }, [filteredData]);

    const totalSpent = useMemo(() => filteredData.reduce((acc: number, curr: TaxExpense) => acc + curr.value, 0), [filteredData]);
    const totalPaid = useMemo(() => filteredData.filter((i: TaxExpense) => i.status === PayableStatus.PAID).length, [filteredData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-poppins">
                <div className="text-center">
                    <div className="inline-block w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Carregando histórico...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-open_sans">
            <GlobalStyles />

            <div className="w-full space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-2"
                        >
                            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                                Financeiro
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                Histórico
                            </span>
                        </motion.div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-poppins">
                            Histórico de Despesas
                        </h1>
                        <p className="text-gray-500 mt-1 max-w-lg">
                            Visualize todas as transações passadas, audite pagamentos e analise o fluxo de caixa histórico.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg text-sm font-medium text-white hover:bg-gray-800 shadow-md transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Registrado"
                        value={formatCurrency(totalSpent)}
                        icon={DollarSign}
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        label="Transações Pagas"
                        value={totalPaid}
                        icon={CheckCircle}
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        label="Média por Despesa"
                        value={formatCurrency(filteredData.length ? totalSpent / filteredData.length : 0)}
                        icon={ArrowUpRight}
                        color="bg-purple-100 text-purple-600"
                    />
                </div>

                {/* Controls Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por fornecedor ou descrição..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm"
                        />
                    </div>

                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <AlignLeft className="w-4 h-4" />
                            Linha do Tempo
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <LayoutList className="w-4 h-4" />
                            Tabela
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {viewMode === 'timeline' ? (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative"
                        >
                            <div className="timeline-line"></div>

                            {Object.keys(groupedData).map((month) => (
                                <div key={month} className="mb-8 relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center shadow-sm z-10">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-700 capitalize font-poppins bg-gray-50 px-2 rounded">
                                            {month}
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        {groupedData[month].map((item, idx) => (
                                            <TimelineItem
                                                key={item.id}
                                                item={item}
                                                isLast={idx === groupedData[month].length - 1}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {filteredData.length === 0 && (
                                <div className="text-center py-20 pl-8">
                                    <p className="text-gray-400">Nenhum registro encontrado para este período.</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                        >
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fornecedor</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vencimento</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredData.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-800">{item.supplier}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.dueDate)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length === 0 && (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-400">Nenhum registro encontrado.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}