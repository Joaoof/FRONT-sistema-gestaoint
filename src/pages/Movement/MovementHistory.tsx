import { useState } from 'react';
import {
    Search,
    Filter,
    DollarSign,
    Banknote,
    Download,
    Plus,
    Edit,
    X,
    Check,
} from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import {
    GET_CASH_MOVEMENTS,
    CREATE_CASH_MOVEMENT,
    UPDATE_CASH_MOVEMENT,
} from '../../graphql/queries/queries';
import { generateMovementsPdf } from '../../utils/generatePDF';
import { Movement } from '../../types';
import { RotateCcw } from 'lucide-react';

// Recharts
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';

// Radix UI
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// Animations & UI
import CountUp from 'react-countup';
import toast, { Toaster } from 'react-hot-toast';

type FilterType =
    | 'ALL'
    | 'ENTRY'
    | 'EXIT'
    | 'SALE'
    | 'CHANGE'
    | 'OTHER_IN'
    | 'EXPENSE'
    | 'WITHDRAWAL'
    | 'PAYMENT';

type Subtype =
    | 'SALE'
    | 'CHANGE'
    | 'OTHER_IN'
    | 'EXPENSE'
    | 'WITHDRAWAL'
    | 'PAYMENT';

const mapCategoryToSubtype = (category: string): Subtype => {
    const map: Record<string, Subtype> = {
        'VENDA': 'SALE',
        'TROCO': 'CHANGE',
        'OUTROS_ENTRADA': 'OTHER_IN',
        'DESPESA': 'EXPENSE',
        'SAQUE': 'WITHDRAWAL',
        'PAGAMENTO': 'PAYMENT',
        'SALE': 'SALE',
        'CHANGE': 'CHANGE',
        'OTHER_IN': 'OTHER_IN',
        'EXPENSE': 'EXPENSE',
        'WITHDRAWAL': 'WITHDRAWAL',
        'PAYMENT': 'PAYMENT',
    };
    const normalizedCategory = category.toUpperCase().trim();
    return map[normalizedCategory] || 'EXPENSE';
};

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Sem data';
    const date = new Date(dateString);
    return isNaN(date.getTime())
        ? 'Data inválida'
        : date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
};

const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime())
        ? ''
        : date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
};

export function MovementHistory() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [valueMin, setValueMin] = useState('');
    const [valueMax, setValueMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

    const { data, loading, error, refetch } = useQuery(GET_CASH_MOVEMENTS, {
        pollInterval: 10000,
    });

    const [createMovement] = useMutation(CREATE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS],
    });
    const [updateMovement] = useMutation(UPDATE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS],
    });

    const movements: Movement[] = (data?.cashMovements || []).map((m: Movement) => ({
        id: m.id,
        value: Number(m.value),
        description: m.description,
        type: m.type,
        category: mapCategoryToSubtype(m.category),
        date: m.date,
    }));

    const filtered = movements.filter((m) => {
        const matchesSearch = m.description.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'ALL' ||
            (filter === 'ENTRY' && m.type === 'ENTRY') ||
            (filter === 'EXIT' && m.type === 'EXIT') ||
            m.category === filter;

        const date = m.date ? new Date(m.date) : null;
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;

        const matchesDate = !from && !to
            ? true
            : date && (!from || date >= from) && (!to || date <= to);

        const min = valueMin ? parseFloat(valueMin) : -Infinity;
        const max = valueMax ? parseFloat(valueMax) : Infinity;
        const matchesValue = m.value >= min && m.value <= max;

        return matchesSearch && matchesFilter && matchesDate && matchesValue;
    });

    const totalEntries = filtered
        .filter((m) => m.type === 'ENTRY')
        .reduce((sum, m) => sum + m.value, 0);

    const totalExits = filtered
        .filter((m) => m.type === 'EXIT')
        .reduce((sum, m) => sum + m.value, 0);

    const balance = totalEntries - totalExits;

    const typeLabels = {
        SALE: 'Venda',
        CHANGE: 'Troco',
        OTHER_IN: 'Outros (Entrada)',
        EXPENSE: 'Despesa',
        WITHDRAWAL: 'Saque',
        PAYMENT: 'Pagamento',
    };

    const handleAdjustment = (type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT') => {
        const rawValue = prompt(`Informe o valor do ajuste:`);
        const value = parseFloat(rawValue || '');
        if (isNaN(value)) return toast.error('Valor inválido.');

        const description = prompt('Descrição (opcional):') || 'Ajuste';

        const absValue = Math.abs(value);
        const movementType = value >= 0 ? 'ENTRY' : 'EXIT';
        const category = (() => {
            if (type === 'ADJUSTMENT') return value >= 0 ? 'OTHER_IN' : 'EXPENSE';
            return type === 'ENTRY' ? 'OTHER_IN' : 'EXPENSE';
        })();

        createMovement({
            variables: {
                input: {
                    value: absValue,
                    description,
                    type: movementType,
                    category,
                    date: new Date().toISOString(),
                },
            },
        }).then(
            () => toast.success('Ajuste realizado!'),
            (err) => toast.error('Erro: ' + err.message)
        );
    };

    const openEditModal = (movement: Movement) => {
        setEditingMovement(movement);
    };

    const saveEdit = async () => {
        if (!editingMovement) return;
        await updateMovement({
            variables: {
                id: editingMovement.id,
                input: {
                    description: editingMovement.description,
                    value: Math.abs(editingMovement.value),
                    type: editingMovement.value >= 0 ? 'ENTRY' : 'EXIT',
                },
            },
        });
        toast.success('Movimentação atualizada!');
        setEditingMovement(null);
    };

    if (loading) return <LoadingSkeleton />;

    if (error) return (
        <div className="p-8 text-center text-red-600">
            Erro: {error.message}
        </div>
    );

    return (
        <>
            <Toaster position="top-right" />

            <div className="space-y-8 px-6 py-6 bg-gray-50 min-h-screen w-full">
                {/* Cabeçalho */}
                <div className="w-full relative pb-10">
                    <h1 className="text-4xl font-serif text-gray-900 mb-2">
                        📋 Histórico de Movimentações
                    </h1>
                    <p className="text-gray-600">Controle completo das entradas e saídas do caixa.</p>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={loading}
                        className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm disabled:opacity-60 rounded-xl text-gray-700 text-sm font-medium transition-all duration-200 group"
                        aria-label="Atualizar dados"
                    >
                        <RotateCcw
                            className={`h-5 w-5 transition-transform duration-300 ${loading ? 'animate-spin text-indigo-600' : 'group-hover:rotate-12 text-gray-600'
                                }`}
                        />
                        <span className="font-medium">{loading ? 'Atualizando...' : 'Atualizar'}</span>
                    </button>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard
                        title="Entradas"
                        value={totalEntries}
                        icon={<DollarSign className="w-6 h-6" />}
                        bg="from-green-100 to-green-50"
                        text="text-green-900"
                        onClick={() => handleAdjustment('ENTRY')}
                    />
                    <SummaryCard
                        title="Saídas"
                        value={totalExits}
                        icon={<Banknote className="w-6 h-6" />}
                        bg="from-red-100 to-red-50"
                        text="text-red-900"
                        onClick={() => handleAdjustment('EXIT')}
                    />
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-800">Saldo</p>
                                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    <CountUp end={balance} decimal="," decimals={2} prefix="R$ " />
                                </p>
                            </div>
                            <div className={`p-3 ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full text-white`}>
                                {balance >= 0 ? (
                                    <span className="animate-bounce-up text-lg">↑</span>
                                ) : (
                                    <span className="animate-bounce-down text-lg">↓</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => handleAdjustment('ADJUSTMENT')}
                            className="absolute top-2 right-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mini gráfico */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo Financeiro</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Entradas', value: totalEntries, color: '#10b981' },
                                        { name: 'Saídas', value: totalExits, color: '#ef4444' },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {[
                                        { name: 'Entradas', value: totalEntries, color: '#10b981' },
                                        { name: 'Saídas', value: totalExits, color: '#ef4444' },
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                        >
                            <Filter className="w-5 h-5" />
                            {showFilters ? 'Ocultar' : 'Filtros'}
                        </button>
                    </div>

                    {/* Filtros rápidos em pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { value: 'ALL', label: 'Todos', icon: '💸' },
                            { value: 'ENTRY', label: 'Entradas', icon: '➕' },
                            { value: 'EXIT', label: 'Saídas', icon: '➖' },
                            { value: 'SALE', label: 'Vendas', icon: '💰' },
                            { value: 'EXPENSE', label: 'Despesas', icon: '🧾' },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value as FilterType)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${filter === f.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {f.icon} {f.label}
                            </button>
                        ))}
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as FilterType)}
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="ENTRY">➕ Entradas</option>
                                    <option value="EXIT">➖ Saídas</option>
                                    <option value="SALE">💰 Vendas</option>
                                    <option value="CHANGE">💱 Troco</option>
                                    <option value="OTHER_IN">📦 Outros (Entrada)</option>
                                    <option value="EXPENSE">🧾 Despesas</option>
                                    <option value="WITHDRAWAL">🏧 Saques</option>
                                    <option value="PAYMENT">💳 Pagamentos</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Valor Mín." value={valueMin} onChange={setValueMin} />
                                <Input label="Valor Máx." value={valueMax} onChange={setValueMax} />
                            </div>
                        </div>
                    )}

                    <ExportPdfDropdown movements={movements} />

                    {/* Tabela */}
                    <div className="overflow-x-auto mt-8 bg-gray-50 rounded-xl border border-gray-200">
                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <p className="text-lg">🔍 Nenhuma movimentação encontrada.</p>
                                <p className="text-sm mt-1">Ajuste os filtros.</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Data</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Descrição</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filtered.map((m) => (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-gray-50 odd:bg-gray-50 transition-opacity duration-200"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(m.date)}
                                                {m.date && <><br /><span className="text-xs text-gray-500">{formatTime(m.date)}</span></>}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                                                onClick={() => openEditModal(m)}
                                            >
                                                {m.description}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                                                        ${m.type === 'ENTRY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {typeLabels[m.category]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 ${m.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                >
                                                    {m.type === 'ENTRY' ? '+' : '-'} R$ {m.value.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Edição */}
            <EditModal
                movement={editingMovement}
                onSave={saveEdit}
                onClose={() => setEditingMovement(null)}
            />
        </>
    );
}

// === COMPONENTES ===

function SummaryCard({ title, value, icon, bg, text, onClick }: any) {
    return (
        <div
            className={`bg-gradient-to-br ${bg} rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform relative`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    <p className={`text-2xl font-bold ${text}`}>
                        <CountUp end={value} decimal="," decimals={2} prefix="R$ " />
                    </p>
                </div>
                <div className={`${text.replace('text-', 'bg-')}200 p-3 rounded-full ${text}`}>
                    {icon}
                </div>
            </div>
            <button className="absolute top-2 right-2 p-1 text-gray-600 hover:bg-gray-100 rounded">
                <Edit className="w-5 h-5" />
            </button>
        </div>
    );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label.includes('Mín') ? '0' : '9999'}
                className="w-full p-3 border border-gray-300 rounded-xl"
            />
        </div>
    );
}

function ExportPdfDropdown({ movements }: { movements: Movement[] }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 mt-8 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                    <Download className="w-5 h-5" />
                    Exportar PDF
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                <DropdownMenu.Item
                    onClick={() => generateMovementsPdf(movements, 'all')}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer rounded"
                >
                    📥 Exportar tudo
                </DropdownMenu.Item>

                {(() => {
                    const yearsMap = new Map<string, Set<string>>();
                    movements.forEach((m) => {
                        if (!m.date) return;
                        const d = new Date(m.date);
                        const year = d.getFullYear().toString();
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        if (!yearsMap.has(year)) yearsMap.set(year, new Set());
                        yearsMap.get(year)!.add(`${year}-${month}`);
                    });

                    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => +b - +a);

                    return sortedYears.flatMap((year) => {
                        const months = Array.from(yearsMap.get(year)!).sort().reverse();
                        const monthOptions = months.map((ym) => {
                            const [y, m] = ym.split('-');
                            const monthName = new Date(+y, +m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
                            return (
                                <DropdownMenu.Item
                                    key={ym}
                                    onClick={() => generateMovementsPdf(movements, 'month', ym)}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer rounded"
                                >
                                    📆 {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {y}
                                </DropdownMenu.Item>
                            );
                        });

                        return [
                            <DropdownMenu.Separator key={`sep-${year}`} className="my-1 border-t border-gray-200" />,
                            <DropdownMenu.Item
                                key={`y-${year}`}
                                onClick={() => generateMovementsPdf(movements, 'year', undefined, year)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer rounded font-medium"
                            >
                                📅 Ano {year}
                            </DropdownMenu.Item>,
                            ...monthOptions,
                        ];
                    });
                })()}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

function EditModal({ movement, onSave, onClose }: any) {
    if (!movement) return null;

    function setEditingMovement(arg0: any): void {
        throw new Error('Function not implemented.');
    }

    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                        Editar Movimentação
                    </Dialog.Title>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Descrição</label>
                            <input
                                type="text"
                                value={movement.description}
                                onChange={(e) => setEditingMovement({ ...movement, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={movement.value}
                                onChange={(e) => setEditingMovement({ ...movement, value: parseFloat(e.target.value) || 0 })}
                                className="w-full p-3 border border-gray-300 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Check className="w-5 h-5" /> Salvar
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 px-6 py-6">
            <div className="animate-pulse">
                <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
                <div className="h-12 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
    );
}

// Animações
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce-up { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes bounce-down { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
    .animate-bounce-up { animation: bounce-up 1s ease-in-out infinite; }
    .animate-bounce-down { animation: bounce-down 1s ease-in-out infinite; }
`;
document.head.appendChild(style);