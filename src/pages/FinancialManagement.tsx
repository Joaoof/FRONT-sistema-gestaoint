// src/pages/FinancialManagement.tsx
import React, { useState } from 'react';
import { DollarSign, FileText, CheckCircle, Clock, AlertTriangle, Search, Filter, Download } from 'lucide-react';

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
    // Dados mockados (falsos)
    const [receivables] = useState<Receivable[]>([
        { id: '1', clientName: 'João Silva', description: 'Venda de produtos', value: 1500, dueDate: '2025-04-10', status: 'pendente' },
        { id: '2', clientName: 'Maria Oliveira', description: 'Serviço prestado', value: 800, dueDate: '2025-04-05', status: 'vencido' },
        { id: '3', clientName: 'Carlos Souza', description: 'Consultoria', value: 2500, dueDate: '2025-04-15', status: 'pendente' },
        { id: '4', clientName: 'Ana Lima', description: 'Venda online', value: 600, dueDate: '2025-04-01', status: 'pago' },
    ]);

    const [payables] = useState<Payable[]>([
        { id: '1', supplierName: 'Fornecedor A', description: 'Compra de insumos', value: 3000, dueDate: '2025-04-12', status: 'pendente' },
        { id: '2', supplierName: 'Fornecedor B', description: 'Aluguel', value: 1200, dueDate: '2025-04-05', status: 'vencido' },
        { id: '3', supplierName: 'Fornecedor C', description: 'Energia', value: 450, dueDate: '2025-04-10', status: 'pendente' },
        { id: '4', supplierName: 'Fornecedor D', description: 'Internet', value: 200, dueDate: '2025-04-01', status: 'pago' },
    ]);

    // Estados de filtro
    const [filterReceivable, setFilterReceivable] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');
    const [filterPayable, setFilterPayable] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Função para formatar data
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    // Filtrar contas a receber
    const filteredReceivables = receivables
        .filter(r => filterReceivable === 'all' || r.status === filterReceivable)
        .filter(r =>
            r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Filtrar contas a pagar
    const filteredPayables = payables
        .filter(p => filterPayable === 'all' || p.status === filterPayable)
        .filter(p =>
            p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Calcular totais
    const totalReceber = filteredReceivables.reduce((sum, r) => sum + r.value, 0);
    const totalPagar = filteredPayables.reduce((sum, p) => sum + p.value, 0);
    const saldo = totalReceber - totalPagar;

    // ✅ Função para exportar em CSV
    const exportToCSV = (data: any[], filename: string, type: 'receber' | 'pagar') => {
        const headers = type === 'receber'
            ? ['Cliente', 'Descrição', 'Valor', 'Vencimento', 'Status']
            : ['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status'];

        const rows = data.map(item => [
            type === 'receber' ? item.clientName : item.supplierName,
            item.description,
            `R$ ${item.value.toFixed(2)}`,
            formatDate(item.dueDate),
            item.status === 'pago' ? 'Pago' : item.status === 'pendente' ? 'Pendente' : 'Vencido'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ✅ Função para exportar em PDF (com jspdf e jspdf-autotable)
    const exportToPDF = (data: any[], filename: string, type: 'receber' | 'pagar') => {
        import('jspdf').then(jsPDF => {
            import('jspdf-autotable').then(() => {
                const doc = new jsPDF.default();
                const title = type === 'receber' ? 'Contas a Receber' : 'Contas a Pagar';
                const headers = type === 'receber'
                    ? [['Cliente', 'Descrição', 'Valor', 'Vencimento', 'Status']]
                    : [['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status']];

                const rows = data.map(item => [
                    type === 'receber' ? item.clientName : item.supplierName,
                    item.description,
                    `R$ ${item.value.toFixed(2)}`,
                    formatDate(item.dueDate),
                    item.status === 'pago' ? 'Pago' : item.status === 'pendente' ? 'Pendente' : 'Vencido'
                ]);

                doc.setFontSize(18);
                doc.text(title, 14, 20);
                (doc as any).autoTable({
                    head: headers,
                    body: rows,
                    startY: 30,
                });
                doc.save(`${filename}.pdf`);
            });
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Gestão Financeira</h1>
                <p className="text-gray-600">Controle de contas a receber e a pagar</p>
            </div>

            {/* Botões de Exportação */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => exportToCSV(filteredReceivables, 'contas_a_receber', 'receber')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Exportar contas a receber (CSV)
                </button>
                <button
                    onClick={() => exportToPDF(filteredReceivables, 'contas_a_receber', 'receber')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium font-['Manrope']"
                >
                    <Download className="w-5 h-5" />
                    Exportar contas a receber (PDF)
                </button>
                <button
                    onClick={() => exportToCSV(filteredPayables, 'contas_a_pagar', 'pagar')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Exportar contas a pagar (CSV)
                </button>
                <button
                    onClick={() => exportToPDF(filteredPayables, 'contas_a_pagar', 'pagar')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Exportar contas a pagar (PDF)
                </button>
            </div>

            {/* Barra de busca */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar cliente ou fornecedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300"
                    />
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800">A Receber</p>
                    <p className="text-2xl font-bold font-['Rajdhani'] text-blue-600">R$ {totalReceber.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <FileText className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">A Pagar</p>
                    <p className="text-2xl font-bold font-['Rajdhani'] text-red-900">R$ {totalPagar.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800">Saldo Final</p>
                    <p className={`text-2xl font-bold font-['Rajdhani'] ${saldo >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        R$ {saldo.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Tabela: Contas a Receber */}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredReceivables.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma conta encontrada.</td>
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabela: Contas a Pagar */}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredPayables.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma conta encontrada.</td>
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