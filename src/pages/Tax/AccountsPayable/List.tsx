// src/pages/Fiscal/AccountsPayable/List.tsx
import { useState } from 'react';
import { FileText, Search, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Payable = {
    id: string;
    supplierName: string;
    description: string;
    value: number;
    dueDate: string;
    status: 'pendente' | 'pago' | 'vencido';
};

const mockPayables: Payable[] = [
    { id: '1', supplierName: 'Fornecedor A', description: 'Compra de insumos', value: 3000, dueDate: '2025-04-12T00:00', status: 'pendente' },
    { id: '2', supplierName: 'Fornecedor B', description: 'Aluguel', value: 1200, dueDate: '2025-04-05T00:00', status: 'vencido' },
    { id: '3', supplierName: 'Fornecedor C', description: 'Energia', value: 450, dueDate: '2025-04-10T00:00', status: 'pendente' },
    { id: '4', supplierName: 'Fornecedor D', description: 'Internet', value: 200, dueDate: '2025-04-01T00:00', status: 'pago' },
];

export function PayablesList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');

    const filtered = mockPayables
        .filter(p => p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(p => filterStatus === 'all' || p.status === filterStatus);

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Contas a Pagar</h1>
                    <p className="text-gray-600">Lista completa de despesas</p>
                </div>
                <button
                    onClick={() => navigate('/app/fiscal/payables/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <FileText className="w-4 h-4" />
                    Nova Conta
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar fornecedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="p-3 border border-gray-300 rounded-lg"
                    >
                        <option value="all">Todos</option>
                        <option value="pendente">Pendentes</option>
                        <option value="pago">Pagos</option>
                        <option value="vencido">Vencidos</option>
                    </select>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma conta encontrada.</td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.supplierName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{p.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                                            R$ {p.value.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(p.dueDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'pago'
                                                    ? 'bg-green-100 text-green-800'
                                                    : p.status === 'vencido'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {p.status === 'pago' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {p.status === 'pendente' && <Clock className="w-3 h-3 mr-1" />}
                                                {p.status === 'vencido' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {p.status === 'pago' ? 'Pago' : p.status === 'pendente' ? 'Pendente' : 'Vencido'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}