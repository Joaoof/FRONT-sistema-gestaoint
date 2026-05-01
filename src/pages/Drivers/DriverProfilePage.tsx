import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    MapPin,
    Phone,
    Truck,
    User,
} from 'lucide-react';
import { GET_DRIVER } from '../../graphql/queries/drivers';
import { GET_DELIVERIES } from '../../graphql/queries/deliveries';

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

interface DeliveryRow {
    id: string;
    driverId: string | null;
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELED';
    destination: string | null;
    scheduledDate: string | null;
    deliveredAt: string | null;
    createdAt: string;
    order?: {
        id: string;
        number: number;
        customerName: string | null;
        total: number;
    } | null;
}

const STATUS_LABEL: Record<DeliveryRow['status'], string> = {
    PENDING: 'Pendente',
    IN_TRANSIT: 'Em rota',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelada',
};

const STATUS_TONE: Record<DeliveryRow['status'], string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    IN_TRANSIT: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
    DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    CANCELED: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function initials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('') || '?';
}

export function DriverProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, loading } = useQuery<{ driver: Driver }>(GET_DRIVER, {
        variables: { id },
        skip: !id,
        fetchPolicy: 'cache-and-network',
    });

    const { data: deliveriesData } = useQuery<{ deliveries: DeliveryRow[] }>(GET_DELIVERIES, {
        fetchPolicy: 'cache-and-network',
    });

    const driver = data?.driver;
    const allDeliveries = deliveriesData?.deliveries ?? [];

    const myDeliveries = useMemo(
        () => allDeliveries.filter((d) => d.driverId === id),
        [allDeliveries, id],
    );

    const stats = useMemo(() => {
        const delivered = myDeliveries.filter((d) => d.status === 'DELIVERED').length;
        const inTransit = myDeliveries.filter((d) => d.status === 'IN_TRANSIT').length;
        const pending = myDeliveries.filter((d) => d.status === 'PENDING').length;
        const totalRevenue = myDeliveries
            .filter((d) => d.status === 'DELIVERED')
            .reduce((s, d) => s + Number(d.order?.total ?? 0), 0);
        return { delivered, inTransit, pending, totalRevenue };
    }, [myDeliveries]);

    if (loading && !driver) {
        return <div className="p-12 text-center text-slate-500">Carregando…</div>;
    }
    if (!driver) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-700 dark:text-slate-300 mb-2">Motorista não encontrado.</p>
                <button onClick={() => navigate('/motoristas')} className="text-violet-600 hover:underline text-sm">
                    ← Voltar para a lista
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[13px]"
            >
                <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {/* Hero */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 h-24" />
                <div className="px-6 pb-5 -mt-12 flex flex-col sm:flex-row gap-4 sm:items-end">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white text-3xl font-bold overflow-hidden ring-4 ring-white dark:ring-slate-900 shrink-0">
                        {driver.photoUrl ? (
                            <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                            <span>{initials(driver.name)}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 sm:pb-1">
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">{driver.name}</h1>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    driver.active
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.06]'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${driver.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {driver.active ? 'Disponível' : 'Inativo'}
                            </span>
                            {driver.cnhCategory && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
                                    CNH {driver.cnhCategory}
                                </span>
                            )}
                            {driver.phone && (
                                <a
                                    href={`tel:${driver.phone.replace(/\D/g, '')}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 hover:bg-sky-100 tabular-nums"
                                >
                                    <Phone className="w-3 h-3" /> {driver.phone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Total de entregas" value={String(driver.totalDeliveries)} icon={<Truck className="w-4 h-4" />} tone="violet" />
                <Stat label="Concluídas" value={String(stats.delivered)} icon={<CheckCircle2 className="w-4 h-4" />} tone="emerald" />
                <Stat label="Em rota" value={String(stats.inTransit)} icon={<Truck className="w-4 h-4" />} tone="sky" />
                <Stat label="Receita transportada" value={formatBRL(stats.totalRevenue)} icon={<MapPin className="w-4 h-4" />} tone="amber" />
            </div>

            {/* Dados pessoais + veículo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5">
                    <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-violet-500" /> Dados pessoais
                    </h2>
                    <dl className="text-[12.5px] space-y-1.5">
                        <Row label="Nome" value={driver.name} />
                        <Row label="CPF" value={driver.document} mono />
                        <Row label="Telefone" value={driver.phone} mono />
                        <Row label="CNH" value={driver.cnh} mono />
                        <Row label="Categoria CNH" value={driver.cnhCategory} />
                        <Row label="Cadastrado em" value={new Date(driver.createdAt).toLocaleDateString('pt-BR')} />
                    </dl>
                </section>
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5">
                    <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-violet-500" /> Veículo
                    </h2>
                    <dl className="text-[12.5px] space-y-1.5">
                        <Row label="Modelo" value={driver.vehicle} />
                        <Row label="Placa" value={driver.vehiclePlate} mono />
                    </dl>
                    {driver.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Observações</p>
                            <p className="text-[12.5px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{driver.notes}</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Histórico de entregas */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                        Entregas vinculadas
                    </h2>
                    <span className="ml-auto text-[11.5px] text-slate-500 tabular-nums">
                        {myDeliveries.length} no total
                    </span>
                </header>
                {myDeliveries.length === 0 ? (
                    <div className="px-5 py-12 text-center text-[13px] text-slate-500">
                        Nenhuma entrega vinculada a este motorista.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 dark:bg-white/[0.02]">
                                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="px-4 py-2.5 font-medium">Pedido</th>
                                    <th className="px-4 py-2.5 font-medium">Cliente</th>
                                    <th className="px-4 py-2.5 font-medium">Destino</th>
                                    <th className="px-4 py-2.5 font-medium">Status</th>
                                    <th className="px-4 py-2.5 font-medium">Criada</th>
                                    <th className="px-4 py-2.5 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myDeliveries.slice(0, 30).map((d) => (
                                    <tr key={d.id} className="border-t border-slate-100 dark:border-white/[0.04]">
                                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-700 dark:text-slate-200">
                                            #{d.order?.number ?? '?'}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                                            {d.order?.customerName ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[260px]">
                                            {d.destination ?? '—'}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_TONE[d.status]}`}>
                                                {STATUS_LABEL[d.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500 tabular-nums whitespace-nowrap">
                                            {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                                            {d.order?.total != null ? formatBRL(Number(d.order.total)) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div className="flex gap-3">
            <dt className="text-slate-500 dark:text-slate-400 w-32 shrink-0">{label}</dt>
            <dd className={`text-slate-900 dark:text-white truncate ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</dd>
        </div>
    );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'violet' | 'emerald' | 'sky' | 'amber' }) {
    const toneClasses = {
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    } as const;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 flex items-center gap-3">
            <span className={`w-9 h-9 rounded-md grid place-items-center ${toneClasses[tone]}`}>{icon}</span>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">{label}</p>
                <p className="text-[16px] font-semibold text-slate-900 dark:text-white tabular-nums truncate">{value}</p>
            </div>
        </div>
    );
}
