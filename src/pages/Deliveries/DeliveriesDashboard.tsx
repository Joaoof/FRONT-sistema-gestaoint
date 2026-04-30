import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    Map as MapIcon,
    Package,
    PackageCheck,
    PackageX,
    Plus,
    Search,
    Truck,
    User,
    XCircle,
} from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import {
    distanceKm,
    fetchDrivingRoute,
    formatKm,
    formatMinutes,
    googleMapsRouteUrl,
    type DrivingRoute,
} from '../../utils/location';
import {
    CANCEL_DELIVERY,
    COMPLETE_DELIVERY,
    GET_DELIVERIES,
    GET_DELIVERIES_SUMMARY,
    UPDATE_DELIVERY,
} from '../../graphql/queries/deliveries';

type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELED';

interface Delivery {
    id: string;
    orderId: string;
    driver?: string | null;
    vehicle?: string | null;
    destination?: string | null;
    scheduledDate?: string | null;
    startedAt?: string | null;
    deliveredAt?: string | null;
    status: DeliveryStatus;
    notes?: string | null;
    createdAt: string;
    order?: {
        id: string;
        number: number;
        customerName?: string | null;
        total: number;
        customer?: {
            id: string;
            name: string;
            phone?: string | null;
            document?: string | null;
            address?: string | null;
            bairro?: string | null;
            cidade?: string | null;
            estado?: string | null;
            cep?: string | null;
            latitude?: number | null;
            longitude?: number | null;
        } | null;
        items?: { productName: string; quantity: number }[];
    } | null;
}

interface Summary {
    pending: number;
    inTransit: number;
    delivered: number;
    canceled: number;
    todayDelivered: number;
}

const STATUS_LABEL: Record<DeliveryStatus, string> = {
    PENDING: 'Pendente',
    IN_TRANSIT: 'Em rota',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelada',
};

const STATUS_BADGE: Record<DeliveryStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    IN_TRANSIT: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
    DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    CANCELED: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export function DeliveriesDashboard() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [completeNotes, setCompleteNotes] = useState('');

    const { data, loading, refetch } = useQuery<{ deliveries: Delivery[] }>(GET_DELIVERIES, {
        variables: {
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
        },
        fetchPolicy: 'cache-and-network',
        pollInterval: 30_000,
    });
    const { data: summaryData } = useQuery<{ deliveriesSummary: Summary }>(GET_DELIVERIES_SUMMARY, {
        fetchPolicy: 'cache-and-network',
        pollInterval: 30_000,
    });

    const [updateDelivery] = useMutation(UPDATE_DELIVERY);
    const [completeDelivery, { loading: completing }] = useMutation(COMPLETE_DELIVERY);
    const [cancelDelivery] = useMutation(CANCEL_DELIVERY);

    const deliveries = data?.deliveries ?? [];
    const summary = summaryData?.deliveriesSummary ?? {
        pending: 0,
        inTransit: 0,
        delivered: 0,
        canceled: 0,
        todayDelivered: 0,
    };

    const open = useMemo(
        () => deliveries.filter((d) => d.status === 'PENDING' || d.status === 'IN_TRANSIT'),
        [deliveries],
    );
    const closed = useMemo(
        () => deliveries.filter((d) => d.status === 'DELIVERED' || d.status === 'CANCELED'),
        [deliveries],
    );

    async function handleStartTransit(id: string) {
        try {
            await updateDelivery({
                variables: { input: { id, status: 'IN_TRANSIT' } },
            });
            toast.success('Entrega marcada como em rota');
            refetch();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao atualizar');
        }
    }

    async function handleComplete(id: string) {
        try {
            await completeDelivery({
                variables: { id, notes: completeNotes || undefined },
            });
            toast.success('Entrega concluída! 🎉');
            setCompletingId(null);
            setCompleteNotes('');
            refetch();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao concluir');
        }
    }

    async function handleCancel(id: string) {
        if (!window.confirm('Cancelar esta entrega?')) return;
        try {
            await cancelDelivery({ variables: { id } });
            toast.success('Entrega cancelada');
            refetch();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao cancelar');
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Truck className="w-5 h-5 text-violet-500" />
                        Entregas
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Vinculadas a pedidos do sistema · {summary.pending + summary.inTransit} em aberto
                    </p>
                </div>
                <button
                    onClick={() => navigate('/entregas/cadastrar')}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nova entrega
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryCard
                    label="Pendentes"
                    value={summary.pending}
                    icon={<Clock className="w-3.5 h-3.5" />}
                    accent="amber"
                />
                <SummaryCard
                    label="Em rota"
                    value={summary.inTransit}
                    icon={<Truck className="w-3.5 h-3.5" />}
                    accent="sky"
                />
                <SummaryCard
                    label="Entregues hoje"
                    value={summary.todayDelivered}
                    icon={<PackageCheck className="w-3.5 h-3.5" />}
                    accent="emerald"
                />
                <SummaryCard
                    label="Total entregues"
                    value={summary.delivered}
                    icon={<BadgeCheck className="w-3.5 h-3.5" />}
                    accent="emerald"
                />
                <SummaryCard
                    label="Canceladas"
                    value={summary.canceled}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                    accent="rose"
                />
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por motorista, cliente ou destino…"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[12.5px]"
                    >
                        <option value="all">Todos os status</option>
                        <option value="PENDING">Pendentes</option>
                        <option value="IN_TRANSIT">Em rota</option>
                        <option value="DELIVERED">Entregues</option>
                        <option value="CANCELED">Canceladas</option>
                    </select>
                </div>
            </div>

            {/* Em aberto */}
            <Section
                title="Em aberto"
                subtitle={`${open.length} entrega${open.length === 1 ? '' : 's'} pendente${open.length === 1 ? '' : 's'} de conclusão`}
                empty={!loading && open.length === 0}
                emptyIcon={<BadgeCheck className="w-10 h-10 text-emerald-300" />}
                emptyText="Nenhuma entrega em aberto. Tudo entregue!"
            >
                <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {open.map((d) => (
                        <DeliveryRow
                            key={d.id}
                            delivery={d}
                            onStartTransit={() => handleStartTransit(d.id)}
                            onComplete={() => {
                                setCompletingId(d.id);
                                setCompleteNotes('');
                            }}
                            onCancel={() => handleCancel(d.id)}
                        />
                    ))}
                </ul>
            </Section>

            {/* Concluídas / canceladas */}
            <Section
                title="Histórico"
                subtitle={`${closed.length} entrega${closed.length === 1 ? '' : 's'} fechada${closed.length === 1 ? '' : 's'}`}
                empty={closed.length === 0}
                emptyIcon={<Package className="w-10 h-10 text-slate-300" />}
                emptyText="Nenhuma entrega concluída ainda"
            >
                <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {closed.slice(0, 20).map((d) => (
                        <DeliveryRow key={d.id} delivery={d} compact />
                    ))}
                </ul>
            </Section>

            {/* Modal de conclusão */}
            {completingId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-5">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                                <PackageCheck className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                    Confirmar entrega
                                </h3>
                                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    A entrega vai sair do painel de "em aberto" e ser marcada como concluída agora.
                                </p>
                            </div>
                        </div>

                        <textarea
                            value={completeNotes}
                            onChange={(e) => setCompleteNotes(e.target.value)}
                            rows={3}
                            placeholder="Observações finais (opcional) — ex: entregue ao porteiro João, caixa intacta..."
                            className="w-full mt-4 p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                        />

                        <div className="flex items-center gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setCompletingId(null);
                                    setCompleteNotes('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-[13px] font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleComplete(completingId)}
                                disabled={completing}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[13px] font-semibold disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {completing ? 'Confirmando...' : 'Confirmar entrega'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    accent: 'amber' | 'sky' | 'emerald' | 'rose';
}) {
    const palette = {
        amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
        emerald:
            'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        rose: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    };
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-md ring-1 flex items-center justify-center ${palette[accent]}`}>
                    {icon}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
                    {label}
                </span>
            </div>
            <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums">
                {value}
            </p>
        </div>
    );
}

function Section({
    title,
    subtitle,
    children,
    empty,
    emptyIcon,
    emptyText,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    empty: boolean;
    emptyIcon?: React.ReactNode;
    emptyText: string;
}) {
    return (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </header>
            {empty ? (
                <div className="p-12 text-center">
                    {emptyIcon}
                    <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">{emptyText}</p>
                </div>
            ) : (
                children
            )}
        </section>
    );
}

function DeliveryRow({
    delivery,
    compact,
    onStartTransit,
    onComplete,
    onCancel,
}: {
    delivery: Delivery;
    compact?: boolean;
    onStartTransit?: () => void;
    onComplete?: () => void;
    onCancel?: () => void;
}) {
    const customer = delivery.order?.customer?.name ?? delivery.order?.customerName ?? 'Cliente avulso';
    const itemsText =
        delivery.order?.items?.map((i) => `${i.quantity}× ${i.productName}`).slice(0, 2).join(' · ') ?? '';

    const { company } = useCompany();
    const customerObj = delivery.order?.customer;
    const haveCoords =
        company?.latitude != null &&
        company?.longitude != null &&
        customerObj?.latitude != null &&
        customerObj?.longitude != null;
    const straightDistance = haveCoords
        ? distanceKm(
              { latitude: company!.latitude!, longitude: company!.longitude! },
              { latitude: customerObj!.latitude!, longitude: customerObj!.longitude! },
          )
        : null;
    const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
    useEffect(() => {
        if (!haveCoords) {
            setDrivingRoute(null);
            return;
        }
        let cancelled = false;
        fetchDrivingRoute(
            { latitude: company!.latitude!, longitude: company!.longitude! },
            { latitude: customerObj!.latitude!, longitude: customerObj!.longitude! },
        ).then((r) => {
            if (!cancelled) setDrivingRoute(r);
        });
        return () => {
            cancelled = true;
        };
    }, [haveCoords, company?.latitude, company?.longitude, customerObj?.latitude, customerObj?.longitude]);
    // distância exibida: prefere a real (OSRM), fallback pra linha reta
    const distance = drivingRoute?.distanceKm ?? straightDistance;
    const isRealRoute = drivingRoute != null;
    const routeUrl = (() => {
        if (!customerObj) {
            if (delivery.destination) return googleMapsRouteUrl(null, delivery.destination);
            return null;
        }
        const dest =
            customerObj.latitude != null && customerObj.longitude != null
                ? { latitude: customerObj.latitude, longitude: customerObj.longitude }
                : [customerObj.address, customerObj.bairro, customerObj.cidade, customerObj.estado]
                      .filter(Boolean)
                      .join(', ') || delivery.destination || null;
        if (!dest) return null;
        const origin =
            company?.latitude != null && company?.longitude != null
                ? { latitude: company.latitude, longitude: company.longitude }
                : [company?.address, company?.bairro, company?.cidade, company?.estado]
                      .filter(Boolean)
                      .join(', ') || null;
        return googleMapsRouteUrl(origin, dest);
    })();

    return (
        <li className={compact ? 'px-5 py-3' : 'px-5 py-4'}>
            <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-md bg-slate-100 dark:bg-white/[0.05] grid place-items-center shrink-0 font-bold text-[12px] text-slate-600 dark:text-slate-300 tabular-nums">
                    #{delivery.order?.number ?? '?'}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                            {customer}
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${STATUS_BADGE[delivery.status]}`}>
                            {STATUS_LABEL[delivery.status]}
                        </span>
                        {delivery.order?.total != null && (
                            <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                                {formatBRL(Number(delivery.order.total))}
                            </span>
                        )}
                    </div>

                    {!compact && itemsText && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-1 truncate">{itemsText}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                        {delivery.driver && (
                            <span className="inline-flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {delivery.driver}
                                {delivery.vehicle && ` · ${delivery.vehicle}`}
                            </span>
                        )}
                        {delivery.destination && (
                            <span className="truncate max-w-xs">📍 {delivery.destination}</span>
                        )}
                        {distance !== null && (
                            <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                                    isRealRoute
                                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-400'
                                }`}
                                title={
                                    isRealRoute
                                        ? `Distância real de estrada (OSRM)`
                                        : `Distância em linha reta — calculando rota real…`
                                }
                            >
                                <MapIcon className="w-3 h-3" /> {formatKm(distance)}
                                {isRealRoute && drivingRoute && (
                                    <span className="ml-1 text-[9.5px] text-violet-600/80 dark:text-violet-300/80">
                                        · {formatMinutes(drivingRoute.durationMin)}
                                    </span>
                                )}
                            </span>
                        )}
                        {routeUrl && (
                            <a
                                href={routeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Abrir rota no Google Maps"
                            >
                                <ExternalLink className="w-3 h-3" /> Abrir rota
                            </a>
                        )}
                        {delivery.scheduledDate && (
                            <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(delivery.scheduledDate).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
                        {delivery.deliveredAt && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Entregue em{' '}
                                {new Date(delivery.deliveredAt).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                </div>

                {!compact && (
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {delivery.status === 'PENDING' && onStartTransit && (
                            <button
                                onClick={onStartTransit}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/15 rounded"
                            >
                                <Truck className="w-3 h-3" />
                                Em rota
                            </button>
                        )}
                        {(delivery.status === 'PENDING' || delivery.status === 'IN_TRANSIT') && onComplete && (
                            <button
                                onClick={onComplete}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                Concluir
                            </button>
                        )}
                        {(delivery.status === 'PENDING' || delivery.status === 'IN_TRANSIT') && onCancel && (
                            <button
                                onClick={onCancel}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded"
                            >
                                <XCircle className="w-3 h-3" />
                                Cancelar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}
