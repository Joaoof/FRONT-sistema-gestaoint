import { useState } from 'react';
import {
    Search,
    Filter,
    DollarSign,
    Banknote,
    Download,
    Edit,
    X,
    Check,
    Trash2,
    MoreVertical, // Adicionado para o menu de 3 pontos
    Eye, // Adicionado para Visualizar
} from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import {
    GET_CASH_MOVEMENTS,
    CREATE_CASH_MOVEMENT,
    UPDATE_CASH_MOVEMENT,
} from '../../graphql/queries/queries';
import { generateMovementsPdf } from '../../utils/generatePDF';
import { CategoryType, Movement, MovementType } from '../../types';
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
import { toast } from 'sonner';
import { DELETE_CASH_MOVEMENT } from '../../graphql/mutations/mutations'; // Mantendo a importação do delete daqui

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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(value);
};


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
const toDateInputString = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Usa os componentes da hora local (do navegador)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toTimeInputString = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Usa os componentes da hora local (do navegador)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

const combineDateTime = (datePart: string, timePart: string): string => {
    if (!datePart) return '';
    const isoString = `${datePart}T${timePart || '00:00'}:00.000Z`;

    return isoString;
};


export function MovementHistory() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [valueMin, setValueMin] = useState('');
    const [valueMax, setValueMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Estados para os Modais de Ação
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [viewingMovement, setViewingMovement] = useState<Movement | null>(null);
    const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const { data, loading, error, refetch } = useQuery(GET_CASH_MOVEMENTS, {
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: true,
    });

    const [createMovement] = useMutation(CREATE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS],
    });
    const [updateMovement] = useMutation(UPDATE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS],
        onCompleted: () => toast.success('Movimentação atualizada!'),
        onError: (err) => toast.error('Erro ao atualizar: ' + err.message),
    });

    const [deleteMovement, { loading: isDeleting }] = useMutation(DELETE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS, 'dashboardStats'],
        onCompleted: () => {
            // A mensagem de sucesso agora é tratada em confirmDelete
        },
        onError: (err) => toast.error('Erro ao deletar: ' + err.message),
    });

    // Funções para controle dos modais
    const openViewModal = (movement: Movement) => setViewingMovement(movement);
    const openEditModal = (movement: Movement) => setEditingMovement(movement);
    const openDeleteModal = (movement: Movement) => setDeletingMovement(movement);

    const confirmDelete = async () => {
        if (!deletingMovement) return;

        setDeletingId(deletingMovement.id);
        const description = deletingMovement.description;
        try {
            // A mutação do DELETE_CASH_MOVEMENT em mutations.ts espera `movementId`
            await deleteMovement({ variables: { movementId: deletingMovement.id } });
            toast.success(`Movimento "${description}" deletado com sucesso!`);
        } catch (e: any) {
            // Erro já tratado no onError do useMutation
        } finally {
            setDeletingId(null);
            setDeletingMovement(null);
        }
    };
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
            (['SALE', 'CHANGE', 'OTHER_IN', 'EXPENSE', 'WITHDRAWAL', 'PAYMENT'].includes(filter as string) && mapCategoryToSubtype(m.category as string) === filter);

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

    const saveEdit = async () => {
        if (!editingMovement) return;

        // CORRIGIDO: Adicionando 'type' e 'category' que são campos obrigatórios
        await updateMovement({
            variables: {
                movementId: editingMovement.id,
                movementUpdateCash: {
                    description: editingMovement.description,
                    value: Math.abs(editingMovement.value),
                    type: editingMovement.type, // <-- ADICIONADO
                    category: editingMovement.category, // <-- ADICIONADO
                    date: editingMovement.date,
                },
            },
        });
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
                        decimal=","
                        decimals={2}
                        separator="."
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
                                    <CountUp
                                        end={balance}
                                        decimal=","
                                        decimals={2}
                                        prefix="R$ "
                                        separator='.'
                                    />
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
                                        { name: "Entradas", value: totalEntries, color: "#10b981" },
                                        { name: "Saídas", value: totalExits, color: "#ef4444" },
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
                                        { name: "Entradas", value: totalEntries, color: "#10b981" },
                                        { name: "Saídas", value: totalExits, color: "#ef4444" },
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend
                                    formatter={(value: string, entry: any) =>
                                        `${value}: ${formatCurrency(entry.payload.value)}`
                                    }
                                />
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
                                        <th className="px-6 py-4 text-center text-sm font-semibold">Ações</th>
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
                                                className="px-6 py-4 text-sm font-medium text-gray-900"
                                            >
                                                {m.description}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                                                            ${m.type === 'ENTRY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {typeLabels[mapCategoryToSubtype(m.category)]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 ${m.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                >
                                                    {m.type === 'ENTRY' ? '+' : '-'} R$ {formatCurrency(m.value)}
                                                </span>
                                            </td>
                                            {/* NOVO: Coluna de Ações com Dropdown de 3 pontos */}
                                            <td className="px-6 py-4 text-sm text-center">
                                                <ActionsDropdown
                                                    movement={m}
                                                    onView={openViewModal}
                                                    onEdit={openEditModal}
                                                    onDelete={openDeleteModal}
                                                    isDeleting={deletingId === m.id}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Modais */}
            <EditModal
                movement={editingMovement}
                setMovement={setEditingMovement} // Passando o setter para dentro do modal
                onSave={saveEdit}
                onClose={() => setEditingMovement(null)}
            />
            <ViewModal
                movement={viewingMovement}
                onClose={() => setViewingMovement(null)}
            />
            <DeleteConfirmationModal
                movement={deletingMovement}
                onConfirm={confirmDelete}
                onClose={() => setDeletingMovement(null)}
                isDeleting={isDeleting || deletingId === deletingMovement?.id}
            />
        </>
    );
}

// === COMPONENTES NOVOS E MODIFICADOS ===

// Componente para o menu de 3 pontos
function ActionsDropdown({ movement, onView, onEdit, onDelete, isDeleting }: {
    movement: Movement;
    onView: (m: Movement) => void;
    onEdit: (m: Movement) => void;
    onDelete: (m: Movement) => void;
    isDeleting: boolean;
}) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <RotateCcw className="h-5 w-5 animate-spin text-red-500" />
                    ) : (
                        <MoreVertical className="w-5 h-5" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-32 bg-white rounded-lg shadow-xl border border-gray-200 p-1 z-50">
                <DropdownMenu.Item
                    onClick={() => onView(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer rounded"
                >
                    <Eye className="w-4 h-4 text-indigo-600" /> Visualizar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onClick={() => onEdit(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer rounded"
                >
                    <Edit className="w-4 h-4 text-blue-600" /> Editar
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 border-t border-gray-100" />
                <DropdownMenu.Item
                    onClick={() => onDelete(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded"
                >
                    <Trash2 className="w-4 h-4" /> Deletar
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

// Modal de Visualização (Novo)
function ViewModal({ movement, onClose }: { movement: Movement | null; onClose: () => void }) {
    if (!movement) return null;

    const typeLabels = {
        SALE: 'Venda',
        CHANGE: 'Troco',
        OTHER_IN: 'Outros (Entrada)',
        EXPENSE: 'Despesa',
        WITHDRAWAL: 'Saque',
        PAYMENT: 'Pagamento',
    };

    const categoryLabel = typeLabels[mapCategoryToSubtype(movement.category)];

    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-50">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Eye className="w-6 h-6 text-indigo-600" /> Detalhes da Movimentação
                    </Dialog.Title>
                    <div className="space-y-4 text-gray-700">
                        <InfoItem label="ID da Movimentação" value={movement.id} />
                        <InfoItem label="Descrição" value={movement.description} />
                        <InfoItem label="Valor" value={formatCurrency(movement.value)}
                            color={movement.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'}
                        />
                        <InfoItem label="Tipo" value={movement.type === 'ENTRY' ? 'Entrada (➕)' : 'Saída (➖)'}
                            color={movement.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'}
                        />
                        <InfoItem label="Categoria" value={categoryLabel} />
                        <InfoItem label="Data" value={`${formatDate(movement.date)} às ${formatTime(movement.date)}`} />
                    </div>
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <Check className="w-5 h-5" /> Fechar
                        </button>
                    </div>
                    <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function InfoItem({ label, value, color = 'text-gray-700' }: { label: string, value: string, color?: string }) {
    return (
        <div className="border-b border-gray-100 pb-2">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-base font-semibold ${color}`}>{value}</p>
        </div>
    );
}

function DeleteConfirmationModal({ movement, onConfirm, onClose, isDeleting }: {
    movement: Movement | null;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting: boolean;
}) {
    if (!movement) return null;

    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-50">
                    <Dialog.Title className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
                        <Trash2 className="w-6 h-6" /> Confirmar Deleção
                    </Dialog.Title>
                    <p className="text-gray-700 mb-6">
                        Você tem certeza que deseja deletar a movimentação:
                        <span className="font-bold text-gray-900 block mt-1">
                            {movement.description} ({formatCurrency(movement.value)})?
                        </span>
                        Esta ação é <span className="font-semibold text-red-600">irreversível</span>.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition"
                        >
                            {isDeleting ? (
                                <RotateCcw className="w-5 h-5 animate-spin" />
                            ) : (
                                <Trash2 className="w-5 h-5" />
                            )}
                            {isDeleting ? 'Deletando...' : 'Deletar'}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

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
                        <CountUp
                            end={value}
                            decimal=","
                            decimals={2}
                            prefix="R$ "
                            separator="." // ← isso é o thousandsSeparator
                        />
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
                                    onClick={() => generateMovementsPdf(movements, ym)}
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
                                onClick={() => generateMovementsPdf(movements, year)}
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

// O EditModal foi modificado para receber 'setMovement' e corrigir o erro de estado
function EditModal({ movement, onSave, onClose, setMovement }: { movement: Movement | null; onSave: () => void; onClose: () => void; setMovement: (m: Movement | null) => void; }) {
    if (!movement) return null;

    const categoryOptions: { value: CategoryType; label: string }[] = [
        { value: 'SALE', label: 'Venda' },
        { value: 'CHANGE', label: 'Troco' },
        { value: 'OTHER_IN', label: 'Outros (Entrada)' },
        { value: 'EXPENSE', label: 'Despesa' },
        { value: 'WITHDRAWAL', label: 'Saque' },
        { value: 'PAYMENT', label: 'Pagamento' },
    ];

    const handleCategoryChange = (newCategory: CategoryType) => {
        const newType: MovementType = ['SALE', 'CHANGE', 'OTHER_IN'].includes(newCategory)
            ? 'ENTRY'
            : 'EXIT';

        setMovement({
            ...movement,
            category: newCategory,
            type: newType,
        });
    };



    const handleDateChange = (dateInput: string) => {
        const datePart = dateInput;

        if (!datePart) {
            setMovement({ ...movement, date: '' });
            return;
        }

        const timePart = toTimeInputString(movement.date);

        // Combina a nova data e a hora
        const newISOString = combineDateTime(datePart, timePart);

        setMovement({ ...movement, date: newISOString });
    }

    const handleTimeChange = (timeInput: string) => {
        const datePart = toDateInputString(movement.date);

        if (!datePart) {
            return;
        }

        const newISOString = combineDateTime(datePart, timeInput);

        setMovement({ ...movement, date: newISOString });
    }


    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-50">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Edit className="w-6 h-6 text-blue-600" /> Editar Movimentação
                    </Dialog.Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Tipo (Exibição apenas, muda com a Categoria) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimento</label>
                            <div className={`p-3 rounded-xl border font-semibold ${movement.type === 'ENTRY' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'
                                }`}>
                                {movement.type === 'ENTRY' ? 'Entrada (➕)' : 'Saída (➖)'}
                            </div>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                            <select
                                value={movement.category}
                                onChange={(e) => handleCategoryChange(e.target.value as Subtype)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {categoryOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Descrição */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                            <input
                                type="text"
                                value={movement.description}
                                onChange={(e) => setMovement({ ...movement, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                // O valor exibido é o valor absoluto, pois a mutação espera isso
                                value={Math.abs(movement.value)}
                                onChange={(e) => setMovement({ ...movement, value: parseFloat(e.target.value) || 0 })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Data e Hora */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                                <input
                                    type="date"
                                    // Convertendo a data ISO para o formato YYYY-MM-DD para o input[type=date]
                                    value={toDateInputString(movement.date)}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                                <input
                                    type="time"
                                    // Convertendo a data ISO para o formato HH:MM para o input[type=time]
                                    value={toTimeInputString(movement.date)}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-8 border-t pt-4 border-gray-100">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Check className="w-5 h-5" /> Salvar Alterações
                        </button>
                    </div>
                    <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </Dialog.Close>
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