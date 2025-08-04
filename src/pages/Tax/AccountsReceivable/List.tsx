import { useState } from 'react';
import { DollarSign, Search, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Receivable = {
    id: string;
    clientName: string;
    description: string;
    value: number;
    dueDate: string;
    status: 'pendente' | 'pago' | 'vencido';
};

// Dados mockados (substitua com GraphQL depois)
const mockReceivables: Receivable[] = [
    { id: '1', clientName: 'João Silva', description: 'Venda de produtos', value: 1500, dueDate: '2025-04-10T00:00', status: 'pendente' },
    { id: '2', clientName: 'Maria Oliveira', description: 'Serviço prestado', value: 800, dueDate: '2025-04-05T00:00', status: 'vencido' },
    { id: '3', clientName: 'Carlos Souza', description: 'Consultoria', value: 2500, dueDate: '2025-04-15T00:00', status: 'pendente' },
    { id: '4', clientName: 'Ana Lima', description: 'Venda online', value: 600, dueDate: '2025-04-01T00:00', status: 'pago' },
];

export function ReceivablesList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');

    const filtered = mockReceivables
        .filter(r => r.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(r => filterStatus === 'all' || r.status === filterStatus);

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Contas a Receber</h1>
                    <p className="text-gray-600">Lista completa de recebíveis</p>
                </div>
                <button
                    onClick={() => navigate('/app/fiscal/receivables/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <DollarSign className="w-4 h-4" />
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
                            placeholder="Buscar cliente..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
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
                                filtered.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.clientName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{r.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                            R$ {r.value.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(r.dueDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === 'pago'
                                                    ? 'bg-green-100 text-green-800'
                                                    : r.status === 'vencido'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {r.status === 'pago' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {r.status === 'pendente' && <Clock className="w-3 h-3 mr-1" />}
                                                {r.status === 'vencido' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {r.status === 'pago' ? 'Pago' : r.status === 'pendente' ? 'Pendente' : 'Vencido'}
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