// src/pages/FinancialManagement.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, FileText, CheckCircle, Clock, AlertTriangle, Search, Download } from 'lucide-react';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPDF } from '../utils/exportPDF';

// Tipos
type Receivable = {
    id: string;
    clientName: string;
    description: string;
    value: number;
    dueDate: string;
    status: 'pendente' | 'pago' | 'vencido';
};

type Payable = {
    id: string;
    supplierName: string;
    description: string;
    value: number;
    dueDate: string;
    status: 'pendente' | 'pago' | 'vencido';
};

export function FinancialManagement() {
    const { user } = useAuth();
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [payables, setPayables] = useState<Payable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [filterReceivable, setFilterReceivable] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');
    const [filterPayable, setFilterPayable] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchFinancialData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) throw new Error('Sem token de autenticação');

                const res = await fetch('http://localhost:3000/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        query: `
              query GetFinancialData {
                receivables {
                  id
                  clientName
                  description
                  value
                  dueDate
                  status
                }
                payables {
                  id
                  supplierName
                  description
                  value
                  dueDate
                  status
                }
              }
            `,
                    }),
                });

                const json = await res.json();
                if (json.errors) throw new Error(json.errors[0].message);

                setReceivables(json.data.receivables);
                setPayables(json.data.payables);
            } catch (err: any) {
                setError(err.message || 'Erro ao carregar dados financeiros');
            } finally {
                setLoading(false);
            }
        };

        fetchFinancialData();
    }, []);

    // Função para atualizar status (ex: marcar como pago)
    const handleMarkAsPaid = async (type: 'receivable' | 'payable', id: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const res = await fetch('http://localhost:3000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
            mutation UpdateStatus($id: String!, $type: String!) {
              updateFinancialStatus(id: $id, type: $type) {
                id
                status
              }
            }
          `,
                    variables: { id, type },
                }),
            });

            const json = await res.json();
            if (json.errors) throw new Error(json.errors[0].message);

            // Atualiza localmente
            if (type === 'receivable') {
                setReceivables((prev) =>
                    prev.map((r) => (r.id === id ? { ...r, status: 'pago' } : r))
                );
            } else {
                setPayables((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, status: 'pago' } : p))
                );
            }

            alert('Status atualizado com sucesso!');
        } catch (err: any) {
            alert('Erro ao atualizar status');
        }
    };

    // Filtra os dados com base nos filtros
    const filteredReceivables = receivables
        .filter((r) => filterReceivable === 'all' || r.status === filterReceivable)
        .filter(
            (r) =>
                r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const filteredPayables = payables
        .filter((p) => filterPayable === 'all' || p.status === filterPayable)
        .filter(
            (p) =>
                p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Formata data
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    // Calcula totais
    const totalReceber = filteredReceivables.reduce((sum, r) => sum + r.value, 0);
    const totalPagar = filteredPayables.reduce((sum, p) => sum + p.value, 0);
    const saldo = totalReceber - totalPagar;

    if (loading) return <div className="p-8 text-center">Carregando dados financeiros...</div>;
    if (error) return <div className="p-4 bg-red-50 text-red-700 rounded mb-4">{error}</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Gestão Financeira</h1>
                <p className="text-gray-600">Controle suas contas a receber e a pagar</p>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => exportToExcel(filteredReceivables, filteredPayables)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                </button>
                <button
                    onClick={() => exportToPDF(filteredReceivables, filteredPayables)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    <Download className="w-4 h-4" />
                    Exportar PDF
                </button>
            </div>


            {/* Barra de busca e filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-blue-900">A Receber</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">R$ {totalReceber.toFixed(2)}</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center mb-2">
                        <FileText className="w-5 h-5 text-red-600 mr-2" />
                        <h3 className="font-semibold text-red-900">A Pagar</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-900">R$ {totalPagar.toFixed(2)}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-green-900">Saldo</h3>
                    </div>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        R$ {saldo.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Tabela de Contas a Receber */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Contas a Receber</h2>
                    <div className="mt-4 sm:mt-0">
                        <select
                            value={filterReceivable}
                            onChange={(e) => setFilterReceivable(e.target.value as any)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="all">Todos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="pago">Pagos</option>
                            <option value="vencido">Vencidos</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReceivables.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhuma conta encontrada</td>
                                </tr>
                            ) : (
                                filteredReceivables.map((r) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {r.status !== 'pago' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid('receivable', r.id)}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Marcar como pago
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabela de Contas a Pagar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Contas a Pagar</h2>
                    <div className="mt-4 sm:mt-0">
                        <select
                            value={filterPayable}
                            onChange={(e) => setFilterPayable(e.target.value as any)}
                            className="p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="all">Todos</option>
                            <option value="pendente">Pendentes</option>
                            <option value="pago">Pagos</option>
                            <option value="vencido">Vencidos</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayables.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhuma conta encontrada</td>
                                </tr>
                            ) : (
                                filteredPayables.map((p) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {p.status !== 'pago' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid('payable', p.id)}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Marcar como pago
                                                </button>
                                            )}
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