// src/pages/Fiscal/AccountsPayable/List.tsx
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { SearchInput } from '../../../components/ui/Input';
import { FilterSelect } from '../../../components/ui/Select';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PayableRow } from '../../../components/ui/PayableRow';
import { PayableCard } from '../../../components/ui/PayableCard';

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
    { id: '2', supplierName: 'Fornecedor B', description: 'Aluguel', value: 1200, dueDate: '2024-04-05T00:00', status: 'vencido' },
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Contas a Pagar</h1>
                    <p className="text-gray-600">Lista completa de despesas</p>
                </div>
                <button
                    onClick={() => navigate('/app/fiscal/payables/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    Nova Conta
                </button>
            </div>

            {/* Filtros */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar fornecedor..."
                    />
                    <FilterSelect
                        value={filterStatus}
                        onChange={(value) => setFilterStatus(value as any)}
                        options={[
                            { value: 'all', label: 'Todos' },
                            { value: 'pendente', label: 'Pendentes' },
                            { value: 'pago', label: 'Pagos' },
                            { value: 'vencido', label: 'Vencidos' },
                        ]}
                    />
                </div>
            </Card>

            {/* Tabela Desktop */}
            <div className="hidden md:block">
                <Card>
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
                                        <td colSpan={5}>
                                            <EmptyState />
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((p) => (
                                        <PayableRow
                                            key={p.id}
                                            payable={p}
                                            onClick={() => navigate(`/app/fiscal/payables/${p.id}`)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Cards Mobile */}
            <div className="md:hidden">
                <Card>
                    {filtered.length === 0 ? (
                        <EmptyState />
                    ) : (
                        filtered.map((p) => (
                            <PayableCard
                                key={p.id}
                                payable={p}
                                onClick={() => navigate(`/app/fiscal/payables/${p.id}`)}
                            />
                        ))
                    )}
                </Card>
            </div>
        </div>
    );
}