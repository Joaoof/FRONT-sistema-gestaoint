import { useState } from 'react';
import { Search, Filter, DollarSign, Banknote, Download } from 'lucide-react';
import { Movement } from '../../types';
import { generateMovementsPdf } from '../../utils/generatePDF';

// Tipos
type FilterType = 'todos' | 'entrada' | 'saida' | 'venda' | 'troco' | 'outros_entrada' | 'despesa' | 'saque' | 'pagamento';
type Subtype = 'venda' | 'troco' | 'outros_entrada' | 'despesa' | 'saque' | 'pagamento';

export function MovementHistory() {
    const [movements] = useState<Movement[]>([
        { id: '1', value: 1500, description: 'Venda de produtos no PDV', type: 'venda', subtype: 'venda', date: '2025-04-05T10:30', createdAt: '2025-04-05T10:30' },
        { id: '2', value: 200, description: 'Pagamento de energia elétrica', type: 'despesa', subtype: 'despesa', date: '2025-04-05T09:15', createdAt: '2025-04-05T09:15' },
        { id: '3', value: 50, description: 'Troco de cliente após venda', type: 'troco', subtype: 'troco', date: '2025-04-04T16:20', createdAt: '2025-04-04T16:20' },
        { id: '4', value: 300, description: 'Retirada para despesas pessoais', type: 'venda', subtype: 'saque', date: '2025-04-04T14:10', createdAt: '2025-04-04T14:10' },
        { id: '5', value: 80, description: 'Compra de materiais de escritório', type: 'despesa', subtype: 'despesa', date: '2025-03-15T11:00', createdAt: '2025-03-15T11:00' },
        { id: '6', value: 120, description: 'Doação recebida', type: 'despesa', subtype: 'outros_entrada', date: '2025-02-10T09:45', createdAt: '2025-02-10T09:45' },
    ]);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('todos');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [valueMin, setValueMin] = useState('');
    const [valueMax, setValueMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [periodFilter] = useState<'all' | 'month' | 'year'>('all');
    const [selectedMonth] = useState('');
    const [selectedYear] = useState('');

    // Mapeamento de tipos
    const typeLabels: Record<Subtype, string> = {
        venda: 'Venda',
        troco: 'Troco',
        outros_entrada: 'Outros (Entrada)',
        despesa: 'Despesa',
        saque: 'Saque',
        pagamento: 'Pagamento',
    };

    const isEntry = (type: Subtype) => ['venda', 'troco', 'outros_entrada'].includes(type);

    // Filtro principal
    const filtered = movements.filter(m => {
        const matchesSearch = m.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'todos'
            || (filter === 'entrada' && isEntry(m.type as Subtype))
            || (filter === 'saida' && !isEntry(m.type as Subtype))
            || m.type === filter;

        const date = new Date(m.date);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        const matchesDate = (!from || date >= from) && (!to || date <= to);

        const min = valueMin ? parseFloat(valueMin) : 0;
        const max = valueMax ? parseFloat(valueMax) : Infinity;
        const matchesValue = m.value >= min && m.value <= max;

        let matchesPeriod = true;
        if (periodFilter === 'month' && selectedMonth) {
            matchesPeriod = m.date.startsWith(selectedMonth);
        }
        if (periodFilter === 'year' && selectedYear) {
            matchesPeriod = m.date.startsWith(selectedYear);
        }

        return matchesSearch && matchesFilter && matchesDate && matchesValue && matchesPeriod;
    });

    // Totais
    const totalEntries = filtered.filter(m => isEntry(m.type as Subtype)).reduce((sum, m) => sum + m.value, 0);
    const totalExits = filtered.filter(m => !isEntry(m.type as Subtype)).reduce((sum, m) => sum + m.value, 0);
    const balance = totalEntries - totalExits;

    return (
        <div className="space-y-8 px-6 py-6 bg-gray-50 min-h-screen w-full">
            {/* Cabeçalho */}
            <div className="w-full">
                <h1 className="text-4xl font-serif text-gray-900 mb-2">📋 Histórico de Movimentações</h1>
                <p className="text-gray-600">Controle completo das entradas e saídas do caixa.</p>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Entradas</p>
                            <p className="text-2xl font-bold text-green-900">R$ {totalEntries.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-200 rounded-full text-green-700">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-800">Saídas</p>
                            <p className="text-2xl font-bold text-red-900">R$ {totalExits.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-red-200 rounded-full text-red-700">
                            <Banknote className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Saldo</p>
                            <p className="text-2xl font-bold text-blue-900">R$ {balance.toFixed(2)}</p>
                        </div>
                        <div className={`p-3 rounded-full text-white ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                            {balance >= 0 ? '↑' : '↓'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full">
                {/* Busca e Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar por descrição..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition text-gray-700 font-medium"
                    >
                        <Filter className="w-5 h-5" />
                        {showFilters ? 'Ocultar' : 'Filtros'}
                    </button>
                </div>

                {/* Filtros Avançados */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as FilterType)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                            >
                                <option value="todos">Todos</option>
                                <option value="entrada">Entradas</option>
                                <option value="saida">Saídas</option>
                                <option value="venda">Vendas</option>
                                <option value="troco">Troco</option>
                                <option value="outros_entrada">Outros (Entrada)</option>
                                <option value="despesa">Despesas</option>
                                <option value="saque">Saques</option>
                                <option value="pagamento">Pagamentos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mín.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valueMin}
                                    onChange={(e) => setValueMin(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Máx.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valueMax}
                                    onChange={(e) => setValueMax(e.target.value)}
                                    placeholder="9999"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-indigo-600" />
                        Exportar Relatório PDF
                    </h3>
                    <div className="relative max-w-md">
                        <select
                            value=""
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'all') {
                                    generateMovementsPdf(movements, 'all');
                                } else if (value.startsWith('month-')) {
                                    const monthYear = value.replace('month-', '');
                                    generateMovementsPdf(movements, 'month', monthYear);
                                } else if (value.startsWith('year-')) {
                                    const year = value.replace('year-', '');
                                    generateMovementsPdf(movements, 'year', undefined, year);
                                }
                                e.target.value = ""; // Reseta visualmente
                            }}
                            className="w-full p-3 pl-4 pr-12 border border-gray-300 rounded-xl bg-white text-gray-700 
                focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 
                appearance-none cursor-pointer shadow-sm hover:border-gray-400 transition-all"
                        >
                            <option value="" disabled selected>
                                Selecione uma opção de exportação...
                            </option>
                            <option value="all">📥 Exportar tudo (histórico completo)</option>

                            {/* Geração dinâmica de anos e meses */}
                            {(() => {
                                // Extrair e organizar dados
                                const yearsMap = new Map<string, Set<string>>();
                                const yearsSet = new Set<string>();

                                movements.forEach((m) => {
                                    const date = new Date(m.date);
                                    const year = date.getFullYear().toString();
                                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                    const monthYear = `${year}-${month}`;

                                    yearsSet.add(year);
                                    if (!yearsMap.has(year)) yearsMap.set(year, new Set());
                                    yearsMap.get(year)!.add(monthYear);
                                });

                                // Ordenar anos em ordem decrescente
                                const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));

                                return sortedYears.flatMap((year) => {
                                    const months = Array.from(yearsMap.get(year)!).sort().reverse();
                                    const monthOptions = months.map((monthYear) => {
                                        const [y, m] = monthYear.split('-');
                                        const monthName = new Date(parseInt(y), parseInt(m) - 1, 1)
                                            .toLocaleDateString('pt-BR', { month: 'long' });
                                        return (
                                            <option key={monthYear} value={`month-${monthYear}`}>
                                                📆 {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {y}
                                            </option>
                                        );
                                    });

                                    return [
                                        <option key={`divider-${year}`} disabled>
                                            ──────────────────
                                        </option>,
                                        <option key={`year-${year}`} value={`year-${year}`}>
                                            📅 Ano {year}
                                        </option>,
                                        ...monthOptions,
                                    ];
                                });
                            })()}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto mt-8 bg-gray-50 rounded-xl border border-gray-200 w-full">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            <p className="text-lg">🔍 Nenhuma movimentação encontrada.</p>
                            <p className="text-sm mt-1">Tente ajustar os filtros.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Data</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Descrição</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filtered.map(m => (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {new Date(m.date).toLocaleDateString('pt-BR')}
                                            <br />
                                            <span className="text-xs text-gray-500">
                                                {new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.description}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isEntry(m.type as Subtype)
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {typeLabels[m.type as Subtype]}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-semibold text-right ${isEntry(m.type as Subtype) ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {isEntry(m.type as Subtype) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}