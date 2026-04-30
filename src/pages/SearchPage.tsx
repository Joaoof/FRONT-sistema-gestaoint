// src/pages/ConsultasPage.tsx
import React, { useState, useMemo } from 'react';
import { Search, Download, Database, TrendingUp, Package, DollarSign } from 'lucide-react';
import { CSVLink } from 'react-csv';
import toast, { Toaster } from 'react-hot-toast';

// Gráficos
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';

// Tipos
type ConsultaType = 'produtos' | 'vendas' | 'compras' | 'movimentacoes' | 'clientes' | 'fiscal';

// Dados simulados
const mockResults = [
    { id: 1, nome: 'Notebook Dell', categoria: 'Eletrônicos', estoque: 15, preco: 3500, vendas: 23 },
    { id: 2, nome: 'Mouse Gamer', categoria: 'Acessórios', estoque: 45, preco: 120, vendas: 67 },
    { id: 3, nome: 'Teclado Mecânico', categoria: 'Acessórios', estoque: 30, preco: 280, vendas: 41 },
    { id: 4, nome: 'Monitor 24"', categoria: 'Eletrônicos', estoque: 8, preco: 1200, vendas: 12 },
    { id: 5, nome: 'Cadeira Gamer', categoria: 'Móveis', estoque: 12, preco: 850, vendas: 9 },
    { id: 6, nome: 'Webcam HD', categoria: 'Acessórios', estoque: 22, preco: 220, vendas: 18 },
];

// Formatação
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Simulação de vendas mensais
const monthlySales = [
    { month: 'Jan', vendas: 12000 },
    { month: 'Fev', vendas: 14500 },
    { month: 'Mar', vendas: 13200 },
    { month: 'Abr', vendas: 16800 },
    { month: 'Mai', vendas: 18900 },
    { month: 'Jun', vendas: 21000 },
];

export function SearchPage() {
    const [consulta, setConsulta] = useState<ConsultaType>('produtos');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [filterCategoria, setFilterCategoria] = useState<string[]>([]);

    // Filtros
    const results = useMemo(() => {
        return mockResults
            .filter(item =>
                item.nome.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (filterCategoria.length === 0 || filterCategoria.includes(item.categoria))
            );
    }, [searchTerm, filterCategoria]);

    // KPIs
    const totalEstoque = useMemo(() => results.reduce((sum, r) => sum + r.estoque, 0), [results]);
    const valorTotal = useMemo(() => results.reduce((sum, r) => sum + (r.preco * r.estoque), 0), [results]);
    const ticketMedio = useMemo(() => valorTotal / totalEstoque || 0, [valorTotal, totalEstoque]);

    // Dados para gráfico de pizza
    const pieData = results.map(item => ({
        name: item.nome,
        value: item.preco * item.estoque,
    }));

    // Ordenação
    const sortedResults = useMemo(() => {
        if (!sortConfig) return results;
        return [...results].sort((a, b) => {
            let aValue = a[sortConfig.key as keyof typeof a];
            let bValue = b[sortConfig.key as keyof typeof b];
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [results, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Pesquisando:', { consulta, searchTerm, dateRange, filterCategoria });
    };

    // Exportação para PDF
    const exportToPDF = async () => {
        const loading = toast.loading('Gerando PDF...');
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Relatório de Produtos', 14, 20);
            (doc as any).autoTable({
                head: [['Nome', 'Categoria', 'Estoque', 'Preço']],
                body: results.map(r => [r.nome, r.categoria, r.estoque, formatCurrency(r.preco)]),
                startY: 30,
            });
            doc.save('relatorio-produtos.pdf');
            toast.success('PDF exportado com sucesso!');
        } catch (err) {
            toast.error('Erro ao gerar PDF.');
        } finally {
            toast.dismiss(loading);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="space-y-8 px-4 py-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
            <Toaster position="top-right" />

            <div>
                <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white mb-2">Centro de Consultas</h1>
                <p className="text-gray-600 dark:text-slate-300">Análise avançada de dados com visualização em tempo real.</p>
            </div>

            {/* Tipo de Consulta */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-3">Tipo de Consulta</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                        { id: 'produtos', label: 'Produtos', icon: '📦' },
                        { id: 'vendas', label: 'Vendas', icon: '💰' },
                        { id: 'compras', label: 'Compras', icon: '🛒' },
                        { id: 'movimentacoes', label: 'Movimentações', icon: '📊' },
                        { id: 'clientes', label: 'Clientes', icon: '👥' },
                        { id: 'fiscal', label: 'Fiscal', icon: '📑' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setConsulta(item.id as ConsultaType)}
                            className={`p-3 text-sm text-center rounded-lg transition-all ${consulta === item.id
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-50 dark:bg-slate-950 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="text-lg mb-1">{item.icon}</div>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtros */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Pesquisar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nome, ID, descrição..."
                                className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">De</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="p-3 border border-gray-300 dark:border-white/15 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Até</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="p-3 border border-gray-300 dark:border-white/15 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>

                {/* Filtros por Categoria */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(new Set(mockResults.map(r => r.categoria))).map(cat => (
                        <label key={cat} className="inline-flex items-center text-sm">
                            <input
                                type="checkbox"
                                checked={filterCategoria.includes(cat)}
                                onChange={() => {
                                    setFilterCategoria(prev =>
                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                    );
                                }}
                                className="mr-1"
                            />
                            <span>{cat}</span>
                        </label>
                    ))}
                </div>
            </form>

            {/* KPIs com tones SaaS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-sky-500 opacity-70" aria-hidden />
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">Total em estoque</span>
                    </div>
                    <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">{totalEstoque}</p>
                </div>
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-emerald-500 opacity-70" aria-hidden />
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">Valor em estoque</span>
                    </div>
                    <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(valorTotal)}</p>
                </div>
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-violet-500 opacity-70" aria-hidden />
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">Ticket médio</span>
                    </div>
                    <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">{formatCurrency(ticketMedio)}</p>
                </div>
            </div>

            {/* Resultados */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resultados da Consulta</h2>
                    <div className="flex gap-2">
                        <CSVLink
                            data={results.map(r => ({ Nome: r.nome, Categoria: r.categoria, Estoque: r.estoque, Preço: r.preco }))}
                            filename="produtos.csv"
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Download className="w-4 h-4" /> CSV
                        </CSVLink>
                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <Download className="w-4 h-4" /> PDF
                        </button>
                    </div>
                </div>

                {sortedResults.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-slate-400">
                        <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhum resultado encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-950">
                                <tr>
                                    <th onClick={() => requestSort('nome')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                                        Nome {sortConfig?.key === 'nome' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                    </th>
                                    <th onClick={() => requestSort('categoria')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                                        Categoria
                                    </th>
                                    <th onClick={() => requestSort('estoque')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                                        Estoque {sortConfig?.key === 'estoque' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                    </th>
                                    <th onClick={() => requestSort('preco')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800">
                                        Preço {sortConfig?.key === 'preco' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sortedResults.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">{item.categoria}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">{item.estoque}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-emerald-400 font-semibold">
                                            {formatCurrency(item.preco)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Gráficos Avançados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras: Estoque vs Preço */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estoque e Preço por Produto</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sortedResults} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nome" interval={0} tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" orientation="left" />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
                            <Tooltip formatter={(value: number, name) => name === 'preco' ? formatCurrency(value) : value} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="estoque" fill="#3B82F6" name="Estoque" />
                            <Bar yAxisId="right" dataKey="preco" fill="#10B981" name="Preço" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Pizza: Valor por Produto */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição de Valor em Estoque</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
                            >
                                {pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Linha: Tendência de Vendas */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tendência de Vendas Mensais</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={formatCurrency} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="vendas" stroke="#8884d8" name="Vendas" strokeWidth={3} dot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}