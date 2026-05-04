import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
    AlertCircle,
    Building2,
    CheckCircle,
    CreditCard,
    Edit3,
    Landmark,
    Loader2,
    Plus,
    Search,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import {
    CREATE_BANK,
    DELETE_BANK,
    GET_BANKS,
    UPDATE_BANK,
} from '../../graphql/queries/banks';
import { getGraphQLErrorMessages } from '../../utils/getGraphQLErrorMessage';

type BankAccountType = 'CHECKING' | 'SAVINGS' | 'WALLET' | 'INVESTMENT' | 'OTHER';

interface Bank {
    id: string;
    name: string;
    tipo: BankAccountType;
    agencia: string | null;
    conta: string | null;
    digito: string | null;
    titular: string | null;
    documento: string | null;
    pixKey: string | null;
    saldoInicial: number;
    corHex: string;
    ativo: boolean;
    observacoes: string | null;
    user_id: string;
    createdAt: string;
    updatedAt: string;
}

interface BankFormState {
    name: string;
    tipo: BankAccountType;
    agencia: string;
    conta: string;
    digito: string;
    titular: string;
    documento: string;
    pixKey: string;
    saldoInicial: string;
    corHex: string;
    ativo: boolean;
    observacoes: string;
}

const emptyForm: BankFormState = {
    name: '',
    tipo: 'CHECKING',
    agencia: '',
    conta: '',
    digito: '',
    titular: '',
    documento: '',
    pixKey: '',
    saldoInicial: '0',
    corHex: '#3B82F6',
    ativo: true,
    observacoes: '',
};

const BANK_TYPE_LABEL: Record<BankAccountType, string> = {
    CHECKING: 'Conta corrente',
    SAVINGS: 'Poupança',
    WALLET: 'Carteira / Dinheiro',
    INVESTMENT: 'Investimento',
    OTHER: 'Outro',
};

const BANK_TYPE_ICON: Record<BankAccountType, React.ComponentType<{ className?: string }>> = {
    CHECKING: Landmark,
    SAVINGS: Building2,
    WALLET: Wallet,
    INVESTMENT: CreditCard,
    OTHER: Landmark,
};

const currency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export function BanksPage() {
    const [search, setSearch] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const [editing, setEditing] = useState<Bank | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<BankFormState>(emptyForm);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3500);
    };

    const { data, loading, refetch } = useQuery<{ banks: Bank[] }>(GET_BANKS, {
        variables: { search: search || undefined, activeOnly: activeOnly || undefined },
        fetchPolicy: 'cache-and-network',
    });

    const [createBank, { loading: creatingLoading }] = useMutation(CREATE_BANK);
    const [updateBank, { loading: updatingLoading }] = useMutation(UPDATE_BANK);
    const [deleteBank] = useMutation(DELETE_BANK);

    const banks = data?.banks ?? [];

    const totals = useMemo(() => {
        const activeCount = banks.filter((b) => b.ativo).length;
        const sumSaldo = banks.reduce((acc, b) => acc + Number(b.saldoInicial || 0), 0);
        return { activeCount, sumSaldo };
    }, [banks]);

    const openCreate = () => {
        setForm(emptyForm);
        setEditing(null);
        setCreating(true);
    };

    const openEdit = (b: Bank) => {
        setForm({
            name: b.name,
            tipo: b.tipo,
            agencia: b.agencia ?? '',
            conta: b.conta ?? '',
            digito: b.digito ?? '',
            titular: b.titular ?? '',
            documento: b.documento ?? '',
            pixKey: b.pixKey ?? '',
            saldoInicial: String(b.saldoInicial ?? 0),
            corHex: b.corHex || '#3B82F6',
            ativo: b.ativo,
            observacoes: b.observacoes ?? '',
        });
        setEditing(b);
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
            tipo: form.tipo,
            agencia: form.agencia.trim() || null,
            conta: form.conta.trim() || null,
            digito: form.digito.trim() || null,
            titular: form.titular.trim() || null,
            documento: form.documento.trim() || null,
            pixKey: form.pixKey.trim() || null,
            saldoInicial: Number(form.saldoInicial || 0),
            corHex: form.corHex || '#3B82F6',
            ativo: form.ativo,
            observacoes: form.observacoes.trim() || null,
        };
        if (!payload.name) {
            showNotification('error', 'Nome do banco é obrigatório.');
            return;
        }
        if (Number.isNaN(payload.saldoInicial) || payload.saldoInicial < 0) {
            showNotification('error', 'Saldo inicial inválido.');
            return;
        }

        try {
            if (editing) {
                await updateBank({ variables: { id: editing.id, input: payload } });
                showNotification('success', 'Banco atualizado.');
            } else {
                await createBank({ variables: { input: payload } });
                showNotification('success', 'Banco cadastrado.');
            }
            closeModal();
            refetch();
        } catch (err) {
            const msgs = getGraphQLErrorMessages(err);
            showNotification('error', msgs[0] || 'Erro ao salvar banco.');
        }
    };

    const handleDelete = async (b: Bank) => {
        const confirmed = window.confirm(
            `Excluir o banco "${b.name}"? Se já houver movimentações vinculadas, ele será apenas desativado.`,
        );
        if (!confirmed) return;
        try {
            await deleteBank({ variables: { id: b.id } });
            showNotification('success', 'Banco removido.');
            refetch();
        } catch (err) {
            const msgs = getGraphQLErrorMessages(err);
            showNotification('error', msgs[0] || 'Erro ao remover banco.');
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Bancos</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Cadastre quantas contas bancárias quiser e use nas movimentações financeiras
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-md shadow-sm transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                    Novo banco
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center">
                        <Landmark className="w-4 h-4" />
                    </span>
                    <div>
                        <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Bancos</p>
                        <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{banks.length}</p>
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
                        <Wallet className="w-4 h-4" />
                    </span>
                    <div>
                        <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Saldo inicial total</p>
                        <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{currency(totals.sumSaldo)}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome, titular, conta ou chave PIX…"
                        className="w-full pl-10 pr-4 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <label className="inline-flex items-center gap-2 px-3 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[12.5px] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={activeOnly}
                        onChange={(e) => setActiveOnly(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600"
                    />
                    Apenas ativos
                </label>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                {loading && banks.length === 0 ? (
                    <div className="p-8 flex items-center justify-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
                    </div>
                ) : banks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-[13px]">
                        Nenhum banco cadastrado ainda. Clique em <strong>Novo banco</strong> para começar.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium">Banco</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Agência / Conta</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Titular</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Saldo inicial</th>
                                    <th className="text-center px-4 py-2.5 font-medium">Status</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {banks.map((b) => {
                                    const Icon = BANK_TYPE_ICON[b.tipo];
                                    return (
                                        <tr
                                            key={b.id}
                                            className="border-t border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
                                                        style={{ backgroundColor: b.corHex }}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </span>
                                                    <div>
                                                        <div className="font-medium text-slate-900 dark:text-white">{b.name}</div>
                                                        {b.pixKey && (
                                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                PIX: {b.pixKey}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{BANK_TYPE_LABEL[b.tipo]}</td>
                                            <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                                                {b.agencia || b.conta
                                                    ? `${b.agencia ?? '—'} / ${b.conta ?? '—'}${b.digito ? `-${b.digito}` : ''}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.titular ?? '—'}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                                                {currency(Number(b.saldoInicial))}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                        b.ativo
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                                                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06]'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${b.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {b.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEdit(b)}
                                                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                                                        title="Editar"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(b)}
                                                        className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {(creating || editing) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sticky top-0 bg-white dark:bg-slate-900">
                            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                {editing ? 'Editar banco' : 'Novo banco'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Nome do banco *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ex: Nubank, Itaú PJ, Caixa…"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Cor de identificação
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={form.corHex}
                                            onChange={(e) => setForm({ ...form, corHex: e.target.value })}
                                            className="h-10 w-12 border border-slate-200 dark:border-white/15 rounded-md cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={form.corHex}
                                            onChange={(e) => setForm({ ...form, corHex: e.target.value })}
                                            className="flex-1 p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                    Tipo de conta *
                                </label>
                                <select
                                    value={form.tipo}
                                    onChange={(e) => setForm({ ...form, tipo: e.target.value as BankAccountType })}
                                    className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {(Object.keys(BANK_TYPE_LABEL) as BankAccountType[]).map((t) => (
                                        <option key={t} value={t}>
                                            {BANK_TYPE_LABEL[t]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Agência
                                    </label>
                                    <input
                                        type="text"
                                        value={form.agencia}
                                        onChange={(e) => setForm({ ...form, agencia: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Conta
                                    </label>
                                    <input
                                        type="text"
                                        value={form.conta}
                                        onChange={(e) => setForm({ ...form, conta: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Dígito
                                    </label>
                                    <input
                                        type="text"
                                        value={form.digito}
                                        onChange={(e) => setForm({ ...form, digito: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Titular da conta
                                    </label>
                                    <input
                                        type="text"
                                        value={form.titular}
                                        onChange={(e) => setForm({ ...form, titular: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        CPF/CNPJ do titular
                                    </label>
                                    <input
                                        type="text"
                                        value={form.documento}
                                        onChange={(e) => setForm({ ...form, documento: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Chave PIX
                                    </label>
                                    <input
                                        type="text"
                                        value={form.pixKey}
                                        onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                        Saldo inicial
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.saldoInicial}
                                        onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                    Observações
                                </label>
                                <textarea
                                    value={form.observacoes}
                                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                                    rows={3}
                                    className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={form.ativo}
                                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                                    className="w-4 h-4 accent-indigo-600"
                                />
                                Banco ativo (aparece na seleção das movimentações)
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
                                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-md shadow-sm disabled:opacity-50"
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
