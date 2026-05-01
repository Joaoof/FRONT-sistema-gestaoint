import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    Camera,
    CheckCircle,
    Edit3,
    ExternalLink,
    CreditCard,
    Loader2,
    Plus,
    Search,
    Trash2,
    Truck,
    User as UserIcon,
    Users,
    X,
} from 'lucide-react';
import {
    CREATE_DRIVER,
    DELETE_DRIVER,
    GET_DRIVERS,
    UPDATE_DRIVER,
} from '../../graphql/queries/drivers';
import { uploadProductImage, UploadError, validateImage } from '../../lib/r2-upload';
import { getGraphQLErrorMessages } from '../../utils/getGraphQLErrorMessage';

interface Driver {
    id: string;
    name: string;
    photoUrl: string | null;
    cnh: string | null;
    cnhCategory: string | null;
    phone: string | null;
    document: string | null;
    vehicle: string | null;
    vehiclePlate: string | null;
    active: boolean;
    totalDeliveries: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

interface FormState {
    name: string;
    photoUrl: string;
    cnh: string;
    cnhCategory: string;
    phone: string;
    document: string;
    vehicle: string;
    vehiclePlate: string;
    active: boolean;
    notes: string;
}

const empty: FormState = {
    name: '',
    photoUrl: '',
    cnh: '',
    cnhCategory: '',
    phone: '',
    document: '',
    vehicle: '',
    vehiclePlate: '',
    active: true,
    notes: '',
};

const CNH_CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E', 'ACC'];

function initials(name: string) {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((n) => n[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}

export function DriversPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const [editing, setEditing] = useState<Driver | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<FormState>(empty);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, loading, refetch } = useQuery<{ drivers: Driver[] }>(GET_DRIVERS, {
        variables: { search: search || undefined, activeOnly: activeOnly || undefined },
        fetchPolicy: 'cache-and-network',
    });
    const [createDriver, { loading: creatingLoading }] = useMutation(CREATE_DRIVER);
    const [updateDriver, { loading: updatingLoading }] = useMutation(UPDATE_DRIVER);
    const [deleteDriver] = useMutation(DELETE_DRIVER);

    const drivers = data?.drivers ?? [];

    const stats = useMemo(() => {
        const activeCount = drivers.filter((d) => d.active).length;
        const totalDeliveries = drivers.reduce((s, d) => s + d.totalDeliveries, 0);
        return { activeCount, totalDeliveries };
    }, [drivers]);

    function open(d?: Driver) {
        if (d) {
            setEditing(d);
            setCreating(false);
            setForm({
                name: d.name,
                photoUrl: d.photoUrl ?? '',
                cnh: d.cnh ?? '',
                cnhCategory: d.cnhCategory ?? '',
                phone: d.phone ?? '',
                document: d.document ?? '',
                vehicle: d.vehicle ?? '',
                vehiclePlate: d.vehiclePlate ?? '',
                active: d.active,
                notes: d.notes ?? '',
            });
        } else {
            setEditing(null);
            setCreating(true);
            setForm(empty);
        }
    }

    function close() {
        setEditing(null);
        setCreating(false);
        setForm(empty);
    }

    async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            validateImage(file);
        } catch (err) {
            toast.error(err instanceof UploadError ? err.message : 'Imagem inválida.');
            e.target.value = '';
            return;
        }
        setUploading(true);
        try {
            const asset = await uploadProductImage(file, 'drivers');
            setForm((p) => ({ ...p, photoUrl: asset.url }));
            toast.success('Foto carregada.');
        } catch (err) {
            toast.error(err instanceof UploadError ? err.message : 'Erro ao enviar foto.');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Nome é obrigatório.');
            return;
        }
        const payload = {
            name: form.name.trim(),
            photoUrl: form.photoUrl.trim() || null,
            cnh: form.cnh.trim() || null,
            cnhCategory: form.cnhCategory.trim() || null,
            phone: form.phone.trim() || null,
            document: form.document.trim() || null,
            vehicle: form.vehicle.trim() || null,
            vehiclePlate: form.vehiclePlate.trim() || null,
            active: form.active,
            notes: form.notes.trim() || null,
        };
        try {
            if (editing) {
                await updateDriver({ variables: { id: editing.id, input: payload } });
                toast.success('Motorista atualizado.');
            } else {
                await createDriver({ variables: { input: payload } });
                toast.success('Motorista cadastrado.');
            }
            close();
            refetch();
        } catch (err) {
            const msgs = getGraphQLErrorMessages(err);
            toast.error(msgs[0] || 'Erro ao salvar motorista.');
        }
    }

    async function handleDelete(d: Driver) {
        if (!window.confirm(`Excluir motorista "${d.name}"? Se houver entregas vinculadas, será apenas inativado.`)) {
            return;
        }
        try {
            await deleteDriver({ variables: { id: d.id } });
            toast.success('Motorista removido.');
            refetch();
        } catch (err) {
            const msgs = getGraphQLErrorMessages(err);
            toast.error(msgs[0] || 'Erro ao remover motorista.');
        }
    }

    return (
        <div className="space-y-6 w-full">
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Truck className="w-5 h-5 text-violet-500" />
                        Motoristas
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Cadastre seus entregadores com foto, CNH e veículo
                    </p>
                </div>
                <button
                    onClick={() => open()}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Novo motorista
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Kpi label="Motoristas" value={String(drivers.length)} icon={<Users className="w-4 h-4" />} tone="violet" />
                <Kpi label="Ativos" value={String(stats.activeCount)} icon={<CheckCircle className="w-4 h-4" />} tone="emerald" />
                <Kpi label="Entregas realizadas" value={String(stats.totalDeliveries)} icon={<Truck className="w-4 h-4" />} tone="sky" />
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome, CNH, telefone ou placa…"
                        className="w-full pl-10 pr-4 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[13px]"
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

            {/* Grid de motoristas */}
            {loading && drivers.length === 0 ? (
                <div className="p-12 text-center text-slate-500"><Loader2 className="inline w-5 h-5 animate-spin mr-2" /> Carregando…</div>
            ) : drivers.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
                    <Truck className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="mt-3 text-[13px] text-slate-500">Nenhum motorista cadastrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {drivers.map((d) => (
                        <article
                            key={d.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex gap-3"
                        >
                            <div
                                className="w-16 h-16 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white text-lg font-bold overflow-hidden shrink-0 cursor-pointer ring-1 ring-slate-200 dark:ring-white/10"
                                onClick={() => navigate(`/motoristas/${d.id}`)}
                                title="Ver perfil"
                            >
                                {d.photoUrl ? (
                                    <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{initials(d.name)}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <button
                                    onClick={() => navigate(`/motoristas/${d.id}`)}
                                    className="text-[14px] font-semibold text-slate-900 dark:text-white truncate text-left hover:underline flex items-center gap-1"
                                >
                                    {d.name} <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                            d.active
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.06]'
                                        }`}
                                    >
                                        <span className={`w-1 h-1 rounded-full ${d.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {d.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                    {d.cnhCategory && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                                            CNH {d.cnhCategory}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1 truncate tabular-nums">
                                    {d.phone ?? '—'}
                                </p>
                                {d.vehicle && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate">
                                        🛵 {d.vehicle}
                                        {d.vehiclePlate && <span className="font-mono ml-1">({d.vehiclePlate})</span>}
                                    </p>
                                )}
                                <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                                    {d.totalDeliveries} entrega{d.totalDeliveries === 1 ? '' : 's'}
                                </p>
                                <div className="mt-2 flex items-center gap-1">
                                    <button
                                        onClick={() => open(d)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                                    >
                                        <Edit3 className="w-3 h-3" /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(d)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                                    >
                                        <Trash2 className="w-3 h-3" /> Excluir
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* Modal CRUD */}
            {(creating || editing) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
                            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                {editing ? 'Editar motorista' : 'Novo motorista'}
                            </h2>
                            <button onClick={close} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-3">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-slate-200 dark:ring-white/10">
                                        {form.photoUrl ? (
                                            <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-7 h-7" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 text-white grid place-items-center shadow ring-2 ring-white dark:ring-slate-900 disabled:opacity-60"
                                    >
                                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <FieldLabel>Nome *</FieldLabel>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        autoFocus
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FieldLabel>Telefone</FieldLabel>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="(63) 99999-9999"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>CPF</FieldLabel>
                                    <input
                                        value={form.document}
                                        onChange={(e) => setForm({ ...form, document: e.target.value })}
                                        placeholder="000.000.000-00"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <FieldLabel>CNH (número)</FieldLabel>
                                    <input
                                        value={form.cnh}
                                        onChange={(e) => setForm({ ...form, cnh: e.target.value })}
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] font-mono"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Categoria</FieldLabel>
                                    <select
                                        value={form.cnhCategory}
                                        onChange={(e) => setForm({ ...form, cnhCategory: e.target.value })}
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    >
                                        <option value="">—</option>
                                        {CNH_CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <FieldLabel>Veículo</FieldLabel>
                                    <input
                                        value={form.vehicle}
                                        onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                                        placeholder="Ex: Honda CG 160"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Placa</FieldLabel>
                                    <input
                                        value={form.vehiclePlate}
                                        onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                                        placeholder="ABC-1234"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div>
                                <FieldLabel>Observações</FieldLabel>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={2}
                                    placeholder="Algo importante sobre o motorista…"
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    className="w-4 h-4 accent-violet-600"
                                />
                                Motorista ativo (pode ser selecionado em entregas)
                            </label>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={close}
                                    className="h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-md"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingLoading || updatingLoading}
                                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm disabled:opacity-50"
                                >
                                    {(creatingLoading || updatingLoading) ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando…
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-3.5 h-3.5" /> {editing ? 'Salvar' : 'Cadastrar'}
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

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
            {children}
        </label>
    );
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'violet' | 'emerald' | 'sky' }) {
    const toneClasses = {
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    } as const;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex items-center gap-3">
            <span className={`w-9 h-9 rounded-md grid place-items-center ${toneClasses[tone]}`}>{icon}</span>
            <div>
                <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-[18px] font-semibold text-slate-900 dark:text-white tabular-nums">{value}</p>
            </div>
        </div>
    );
}
