import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, Warehouse, Star, ArrowRightLeft, Edit2, Power } from 'lucide-react';
import {
    CREATE_WAREHOUSE,
    DEACTIVATE_WAREHOUSE,
    INVENTORY_TRANSFER,
    UPDATE_WAREHOUSE,
    WAREHOUSES,
} from '../../graphql/queries/warehouses';

interface WarehouseEntity {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    isMain: boolean;
    active: boolean;
    notes: string | null;
    createdAt: string;
}

export function WarehousesPage() {
    const { data, refetch, loading } = useQuery<{ warehouses: WarehouseEntity[] }>(WAREHOUSES, {
        fetchPolicy: 'cache-and-network',
    });
    const [createWh] = useMutation(CREATE_WAREHOUSE);
    const [updateWh] = useMutation(UPDATE_WAREHOUSE);
    const [deactivateWh] = useMutation(DEACTIVATE_WAREHOUSE);

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<WarehouseEntity | null>(null);
    const [showTransfer, setShowTransfer] = useState(false);

    const warehouses = data?.warehouses ?? [];

    const handleSetMain = async (wh: WarehouseEntity) => {
        if (wh.isMain) return;
        try {
            await updateWh({ variables: { input: { id: wh.id, isMain: true } } });
            toast.success(`${wh.name} agora é o depósito principal.`);
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDeactivate = async (wh: WarehouseEntity) => {
        if (!confirm(`Desativar o depósito "${wh.name}"?`)) return;
        try {
            await deactivateWh({ variables: { id: wh.id } });
            toast.success('Desativado.');
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-blue-500" />
                        Depósitos
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Gerencie os locais de armazenamento da sua empresa. O depósito <b>Principal</b> recebe entradas/saídas por padrão.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTransfer(true)}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-slate-700 bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-white/15 hover:bg-slate-50 rounded-md"
                    >
                        <ArrowRightLeft className="w-4 h-4" /> Transferir
                    </button>
                    <button
                        onClick={() => { setEditing(null); setShowForm(true); }}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                        <Plus className="w-4 h-4" /> Novo depósito
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                {loading && warehouses.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500 text-center">Carregando...</div>
                ) : warehouses.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500 text-center">Nenhum depósito ainda. Clique em "Novo depósito".</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40">
                                <th className="px-4 py-3">Nome</th>
                                <th>Código</th>
                                <th>Endereço</th>
                                <th>Status</th>
                                <th className="text-right pr-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.map((w) => (
                                <tr key={w.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {w.isMain && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                            <span className="font-medium text-slate-900 dark:text-white">{w.name}</span>
                                        </div>
                                    </td>
                                    <td className="font-mono text-[12px] text-slate-500">{w.code ?? '—'}</td>
                                    <td className="text-slate-600 dark:text-slate-400 text-[12px]">{w.address ?? '—'}</td>
                                    <td>
                                        {w.active ? (
                                            <span className="text-[10.5px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">Ativo</span>
                                        ) : (
                                            <span className="text-[10.5px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded">Inativo</span>
                                        )}
                                    </td>
                                    <td className="text-right pr-4">
                                        <div className="inline-flex gap-2">
                                            {!w.isMain && w.active && (
                                                <button onClick={() => handleSetMain(w)} className="text-[12px] text-violet-600 hover:underline">
                                                    Tornar principal
                                                </button>
                                            )}
                                            <button onClick={() => { setEditing(w); setShowForm(true); }} className="text-[12px] text-slate-600 hover:text-slate-900 flex items-center gap-0.5">
                                                <Edit2 className="w-3 h-3" /> Editar
                                            </button>
                                            {!w.isMain && w.active && (
                                                <button onClick={() => handleDeactivate(w)} className="text-[12px] text-rose-600 hover:underline flex items-center gap-0.5">
                                                    <Power className="w-3 h-3" /> Desativar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <WarehouseForm
                    initial={editing}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                    onSaved={() => { setShowForm(false); setEditing(null); refetch(); }}
                    createWh={createWh}
                    updateWh={updateWh}
                />
            )}

            {showTransfer && (
                <TransferModal
                    warehouses={warehouses.filter((w) => w.active)}
                    onClose={() => setShowTransfer(false)}
                    onDone={() => { setShowTransfer(false); toast.success('Transferência concluída.'); }}
                />
            )}
        </div>
    );
}

function WarehouseForm({
    initial, onClose, onSaved, createWh, updateWh,
}: {
    initial: WarehouseEntity | null;
    onClose: () => void;
    onSaved: () => void;
    createWh: any;
    updateWh: any;
}) {
    const [form, setForm] = useState({
        name: initial?.name ?? '',
        code: initial?.code ?? '',
        address: initial?.address ?? '',
        isMain: initial?.isMain ?? false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Nome é obrigatório.');
        try {
            if (initial) {
                await updateWh({
                    variables: {
                        input: {
                            id: initial.id,
                            name: form.name,
                            code: form.code || null,
                            address: form.address || null,
                            isMain: form.isMain,
                        },
                    },
                });
                toast.success('Depósito atualizado.');
            } else {
                await createWh({
                    variables: {
                        input: {
                            name: form.name,
                            code: form.code || undefined,
                            address: form.address || undefined,
                            isMain: form.isMain,
                        },
                    },
                });
                toast.success('Depósito criado.');
            }
            onSaved();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold mb-4">{initial ? 'Editar' : 'Novo'} depósito</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome *</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Código</label>
                        <input value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Endereço</label>
                        <input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} />
                        Tornar depósito principal
                    </label>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TransferModal({
    warehouses, onClose, onDone,
}: {
    warehouses: WarehouseEntity[];
    onClose: () => void;
    onDone: () => void;
}) {
    const [form, setForm] = useState({
        productId: '',
        fromWarehouseId: warehouses[0]?.id ?? '',
        toWarehouseId: warehouses[1]?.id ?? '',
        quantity: '',
        reason: '',
    });
    const [transfer, { loading }] = useMutation(INVENTORY_TRANSFER);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.productId.trim()) return toast.error('Informe o ID do produto.');
        if (form.fromWarehouseId === form.toWarehouseId) return toast.error('Origem e destino diferentes.');
        try {
            await transfer({
                variables: {
                    input: {
                        productId: form.productId.trim(),
                        fromWarehouseId: form.fromWarehouseId,
                        toWarehouseId: form.toWarehouseId,
                        quantity: parseInt(form.quantity, 10) || 0,
                        reason: form.reason || undefined,
                    },
                },
            });
            onDone();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-blue-500" /> Transferir produto entre depósitos
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">ID do produto *</label>
                        <input required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                            placeholder="Cole o ID (UUID) do produto"
                            className="w-full p-2 font-mono text-xs border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                        <p className="text-[11px] text-slate-500 mt-1">Pegue na página de Produtos ou pelo Console de Admin.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium mb-1">De</label>
                            <select value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded">
                                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Para</label>
                            <select value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded">
                                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Quantidade *</label>
                        <input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
                        <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50">
                            {loading ? 'Transferindo…' : 'Transferir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
