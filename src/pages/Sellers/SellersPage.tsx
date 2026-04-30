import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
    AlertCircle,
    CheckCircle,
    DollarSign,
    Edit3,
    Loader2,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import {
    CREATE_SELLER,
    DELETE_SELLER,
    GET_SELLERS,
    UPDATE_SELLER,
} from '../../graphql/queries/sellers';
import { getGraphQLErrorMessages } from '../../utils/getGraphQLErrorMessage';

interface Seller {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
    commissionPercent: number;
    active: boolean;
    totalCommission: number;
    createdAt: string;
    updatedAt: string;
}

interface SellerFormState {
    name: string;
    email: string;
    phone: string;
    document: string;
    commissionPercent: string;
    active: boolean;
}

const emptyForm: SellerFormState = {
    name: '',
    email: '',
    phone: '',
    document: '',
    commissionPercent: '0',
    active: true,
};

const currency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export function SellersPage() {
    const [search, setSearch] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const [editing, setEditing] = useState<Seller | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<SellerFormState>(emptyForm);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3500);
    };

    const { data, loading, refetch } = useQuery<{ sellers: Seller[] }>(GET_SELLERS, {
        variables: { search: search || undefined, activeOnly: activeOnly || undefined },
        fetchPolicy: 'cache-and-network',
    });

    const [createSeller, { loading: creatingLoading }] = useMutation(CREATE_SELLER);
    const [updateSeller, { loading: updatingLoading }] = useMutation(UPDATE_SELLER);
    const [deleteSeller] = useMutation(DELETE_SELLER);

    const sellers = data?.sellers ?? [];

    const totals = useMemo(() => {
        const activeCount = sellers.filter((s) => s.active).length;
        const sumCommission = sellers.reduce((acc, s) => acc + Number(s.totalCommission), 0);
        const avgPercent =
            sellers.length > 0
                ? sellers.reduce((acc, s) => acc + Number(s.commissionPercent), 0) / sellers.length
                : 0;
        return { activeCount, sumCommission, avgPercent };
    }, [sellers]);

    const openCreate = () => {
        setForm(emptyForm);
        setEditing(null);
        setCreating(true);
    };

    const openEdit = (s: Seller) => {
        setForm({
            name: s.name,
            email: s.email ?? '',
            phone: s.phone ?? '',
            document: s.document ?? '',
            commissionPercent: String(s.commissionPercent),
            active: s.active,
        });
        setEditing(s);
        setCreating(false);
    };

    const closeModal = () => {
        setEditing(null);
        setCreating(false);
        setForm(emptyForm);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.name.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            document: form.document.trim() || null,
            commissionPercent: Number(form.commissionPercent || 0),
            active: form.active,
        };
        if (!payload.name) {
            showNotification('error', 'Nome é obrigatório.');
            return;
        }
        if (payload.commissionPercent < 0 || payload.commissionPercent > 100) {
            showNotification('error', 'Comissão deve estar entre 0 e 100%.');
            return;
        }

        try {
            if (editing) {
                await updateSeller({ variables: { id: editing.id, input: payload } });
                showNotification('success', 'Vendedor atualizado.');
            } else {
                await createSeller({ variables: { input: payload } });
                showNotification('success', 'Vendedor cadastrado.');
            }
            closeModal();
            refetch();
        } catch (err) {
            const msgs = getGraphQLErrorMessages(err);
            showNotification('error', msgs[0] || 'Erro ao salvar vendedor.');
        }
    };

    const handleDelete = async (s: Seller) => {
        const confirmed = window.confirm(
            `Excluir vendedor "${s.name}"? Se houver pedidos vinculados, ele será apenas desativado.`,
        );
        if (!confirmed) return;
        try {
            await deleteSeller({ variables: { id: s.id } });
            showNotification('success', 'Vendedor removido.');
            refetch();
        } catch (err) {
            const msgs = getGraphQLErrorMessages(err);
            showNotification('error', msgs[0] || 'Erro ao remover vendedor.');
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Vendedores</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Cadastre vendedores e configure comissões</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Novo vendedor
                </button>
            </div>

            {notification && (
                <div
                    role="status"
                    className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-[13px] flex items-center gap-2.5 shadow-soft-lg border ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                    }`}
                >
                    {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-md bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                    </span>
                    <div>
                        <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Vendedores</p>
                        <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{sellers.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                    </span>
                    <div>
                        <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Ativos</p>
                        <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{totals.activeCount}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                    </span>
                    <div>
                        <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Comissões acumuladas</p>
                        <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{currency(totals.sumCommission)}</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome, e-mail ou documento…"
                        className="w-full pl-10 pr-4 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
                <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[12.5px] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={activeOnly}
                        onChange={(e) => setActiveOnly(e.target.checked)}
                        className="w-4 h-4 accent-violet-600"
                    />
                    Apenas ativos
                </label>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                {loading && sellers.length === 0 ? (
                    <div className="p-8 flex items-center justify-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
                    </div>
                ) : sellers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-[13px]">
                        Nenhum vendedor cadastrado ainda.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium">Nome</th>
                                    <th className="text-left px-4 py-2.5 font-medium">E-mail</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Telefone</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Comissão</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Acumulado</th>
                                    <th className="text-center px-4 py-2.5 font-medium">Status</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sellers.map((s) => (
                                    <tr key={s.id} className="border-t border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.email ?? '—'}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.phone ?? '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                                            {Number(s.commissionPercent).toFixed(2)}%
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                                            {currency(Number(s.totalCommission))}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                    s.active
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                                                        : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06]'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {s.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    onClick={() => openEdit(s)}
                                                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                                                    title="Editar"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s)}
                                                    className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {(creating || editing) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                {editing ? 'Editar vendedor' : 'Novo vendedor'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">Nome *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">E-mail</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">Telefone</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">CPF/CNPJ</label>
                                    <input
                                        type="text"
                                        value={form.document}
                                        onChange={(e) => setForm({ ...form, document: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">Comissão (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={form.commissionPercent}
                                        onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    className="w-4 h-4 accent-violet-600"
                                />
                                Vendedor ativo (aparece na lista de seleção em pedidos)
                            </label>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-md"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingLoading || updatingLoading}
                                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {(creatingLoading || updatingLoading) ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Salvando…
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {editing ? 'Salvar alterações' : 'Cadastrar'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
