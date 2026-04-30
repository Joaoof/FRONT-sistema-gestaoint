import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Calendar,
    Car,
    Check,
    ExternalLink,
    Loader2,
    MapPin,
    Navigation,
    Package,
    Receipt,
    Route as RouteIcon,
    Search,
    Truck,
    User,
} from 'lucide-react';
import {
    CREATE_DELIVERY,
    GET_DELIVERABLE_ORDERS,
} from '../../graphql/queries/deliveries';
import { useCompany } from '../../contexts/CompanyContext';
import {
    distanceKm,
    fetchDrivingRoute,
    formatKm,
    formatMinutes,
    googleMapsRouteUrl,
    type DrivingRoute,
} from '../../utils/location';

interface DeliverableOrder {
    id: string;
    number: number;
    customerName?: string | null;
    total: number;
    createdAt: string;
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
}

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function buildAddressString(c: NonNullable<DeliverableOrder['customer']>): string {
    const parts = [c.address, c.bairro, c.cidade && `${c.cidade}${c.estado ? `/${c.estado}` : ''}`, c.cep]
        .filter(Boolean);
    return parts.join(' - ');
}

export function NewDeliveryFromOrder() {
    const navigate = useNavigate();
    const { company } = useCompany();
    const [search, setSearch] = useState('');
    const [orderId, setOrderId] = useState<string>('');
    const [driver, setDriver] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [destination, setDestination] = useState('');
    const [destinationManuallyEdited, setDestinationManuallyEdited] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [notes, setNotes] = useState('');

    const [drivingRoute, setDrivingRoute] = useState<DrivingRoute | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    const { data, loading, refetch } = useQuery<{ deliverableOrders: DeliverableOrder[] }>(
        GET_DELIVERABLE_ORDERS,
        { fetchPolicy: 'cache-and-network' },
    );
    const [createDelivery, { loading: creating }] = useMutation(CREATE_DELIVERY);

    const orders = data?.deliverableOrders ?? [];
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (!term) return true;
            return (
                String(o.number).includes(term) ||
                (o.customerName ?? '').toLowerCase().includes(term)
            );
        });
    }, [orders, search]);

    const selected = orders.find((o) => o.id === orderId);
    const customer = selected?.customer ?? null;

    // Distância em linha reta (calculada na hora, sem rede)
    const straightKm = useMemo(() => {
        if (
            company?.latitude == null ||
            company?.longitude == null ||
            customer?.latitude == null ||
            customer?.longitude == null
        )
            return null;
        return distanceKm(
            { latitude: company.latitude, longitude: company.longitude },
            { latitude: customer.latitude, longitude: customer.longitude },
        );
    }, [company?.latitude, company?.longitude, customer?.latitude, customer?.longitude]);

    // Auto-preenche destino sempre que muda o pedido selecionado (a menos que usuário tenha editado manualmente)
    useEffect(() => {
        if (!customer) return;
        if (destinationManuallyEdited) return;
        const addr = buildAddressString(customer);
        if (addr) setDestination(addr);
    }, [customer?.id, destinationManuallyEdited]);

    // Quando o usuário troca de pedido, libera o autofill de novo
    useEffect(() => {
        setDestinationManuallyEdited(false);
        setDrivingRoute(null);
    }, [orderId]);

    // Busca rota real (OSRM) sempre que tivermos coords da empresa + cliente
    useEffect(() => {
        if (
            company?.latitude == null ||
            company?.longitude == null ||
            customer?.latitude == null ||
            customer?.longitude == null
        ) {
            setDrivingRoute(null);
            return;
        }
        let cancelled = false;
        setLoadingRoute(true);
        fetchDrivingRoute(
            { latitude: company.latitude, longitude: company.longitude },
            { latitude: customer.latitude, longitude: customer.longitude },
        )
            .then((r) => {
                if (!cancelled) setDrivingRoute(r);
            })
            .finally(() => {
                if (!cancelled) setLoadingRoute(false);
            });
        return () => {
            cancelled = true;
        };
    }, [company?.latitude, company?.longitude, customer?.latitude, customer?.longitude]);

    const routeUrl = useMemo(() => {
        if (!customer) return null;
        const dest =
            customer.latitude != null && customer.longitude != null
                ? { latitude: customer.latitude, longitude: customer.longitude }
                : buildAddressString(customer) || null;
        if (!dest) return null;
        const origin =
            company?.latitude != null && company?.longitude != null
                ? { latitude: company.latitude, longitude: company.longitude }
                : [company?.address, company?.bairro, company?.cidade, company?.estado]
                      .filter(Boolean)
                      .join(', ') || null;
        return googleMapsRouteUrl(origin, dest);
    }, [customer, company]);

    const detourPercent = useMemo(() => {
        if (!drivingRoute || !straightKm || straightKm <= 0) return null;
        return ((drivingRoute.distanceKm - straightKm) / straightKm) * 100;
    }, [drivingRoute, straightKm]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!orderId) {
            toast.error('Selecione um pedido para criar a entrega');
            return;
        }
        try {
            const res = await createDelivery({
                variables: {
                    input: {
                        orderId,
                        driver: driver || undefined,
                        vehicle: vehicle || undefined,
                        destination: destination || undefined,
                        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
                        notes: notes || undefined,
                    },
                },
            });
            const created = res.data?.createDelivery;
            toast.success(`Entrega criada para o pedido #${selected?.number}`, {
                description: created?.id ? `ID ${created.id.slice(0, 8)}` : undefined,
            });
            navigate('/entregas');
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar entrega');
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Truck className="w-5 h-5 text-violet-500" />
                        Nova entrega
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">
                        Selecione um pedido confirmado e atribua motorista, veículo e destino
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de pedidos disponíveis */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-sky-500" />
                            Pedidos disponíveis
                        </h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {orders.length === 0
                                ? 'Nenhum pedido confirmado/pago sem entrega'
                                : `${orders.length} pedido${orders.length === 1 ? '' : 's'} pronto${orders.length === 1 ? '' : 's'} para entrega`}
                        </p>
                    </header>

                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por número ou cliente…"
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                        </div>
                    </div>

                    <div className="max-h-[480px] overflow-y-auto">
                        {loading && filtered.length === 0 ? (
                            <div className="px-5 py-12 text-center text-[13px] text-slate-500">Carregando…</div>
                        ) : filtered.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <Package className="w-10 h-10 mx-auto text-slate-300" />
                                <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                                    {search
                                        ? 'Nenhum pedido encontrado com esse filtro'
                                        : 'Todos os pedidos já têm entrega vinculada'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="mt-3 text-[12px] text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                    Atualizar lista
                                </button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                                {filtered.map((o) => {
                                    const isSelected = orderId === o.id;
                                    const hasGeo = o.customer?.latitude != null && o.customer?.longitude != null;
                                    return (
                                        <li key={o.id}>
                                            <button
                                                type="button"
                                                onClick={() => setOrderId(o.id)}
                                                className={`w-full text-left flex items-center gap-3 px-5 py-3 transition-colors ${
                                                    isSelected
                                                        ? 'bg-violet-50 dark:bg-violet-500/10'
                                                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                                }`}
                                            >
                                                <span
                                                    className={`w-9 h-9 rounded-md grid place-items-center font-bold text-[12px] tabular-nums shrink-0 ${
                                                        isSelected
                                                            ? 'bg-violet-600 text-white'
                                                            : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300'
                                                    }`}
                                                >
                                                    #{o.number}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                                        {o.customerName ?? 'Cliente avulso'}
                                                        {hasGeo && (
                                                            <span title="Cliente com localização cadastrada">
                                                                <Navigation className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                                                        {new Date(o.createdAt).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        {formatBRL(o.total)}
                                                    </p>
                                                    {isSelected && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10.5px] text-violet-600 dark:text-violet-400 mt-0.5">
                                                            <Check className="w-3 h-3" />
                                                            Selecionado
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Detalhes da entrega */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Truck className="w-4 h-4 text-violet-500" />
                            Dados da entrega
                        </h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {selected
                                ? `Para o pedido #${selected.number} (${selected.customerName ?? 'cliente avulso'})`
                                : 'Escolha um pedido na lista ao lado'}
                        </p>
                    </header>

                    <div className="p-5 space-y-4">
                        {/* Card de distância — só aparece com pedido selecionado */}
                        {customer && (
                            <div
                                className={`rounded-md border p-3.5 ${
                                    drivingRoute || straightKm
                                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20'
                                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                                }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <RouteIcon
                                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                                            drivingRoute || straightKm
                                                ? 'text-violet-600 dark:text-violet-400'
                                                : 'text-amber-600 dark:text-amber-400'
                                        }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold text-slate-900 dark:text-white">
                                            Rota da empresa até o cliente
                                        </p>
                                        {company?.latitude == null || company?.longitude == null ? (
                                            <p className="text-[11.5px] text-slate-700 dark:text-slate-300 mt-1">
                                                A localização da empresa não está cadastrada. Vá em{' '}
                                                <a href="/empresa" className="font-semibold underline">/empresa</a>{' '}
                                                e clique em “Usar minha localização” para registrar.
                                            </p>
                                        ) : customer.latitude == null || customer.longitude == null ? (
                                            <p className="text-[11.5px] text-slate-700 dark:text-slate-300 mt-1">
                                                Este cliente não tem coordenadas registradas. Edite o cadastro e use o botão{' '}
                                                <strong>Usar minha localização</strong> ou capture pelo CEP.
                                            </p>
                                        ) : loadingRoute ? (
                                            <p className="text-[11.5px] text-slate-700 dark:text-slate-300 mt-1 inline-flex items-center gap-1.5">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Calculando rota real…
                                            </p>
                                        ) : (
                                            <div className="mt-1.5 grid grid-cols-3 gap-3">
                                                <DistanceMetric
                                                    label="Linha reta"
                                                    value={straightKm != null ? formatKm(straightKm) : '—'}
                                                    hint="Haversine"
                                                />
                                                <DistanceMetric
                                                    label="Estrada"
                                                    value={
                                                        drivingRoute
                                                            ? formatKm(drivingRoute.distanceKm)
                                                            : 'indisponível'
                                                    }
                                                    hint="OSRM (real)"
                                                    highlight
                                                />
                                                <DistanceMetric
                                                    label="Tempo estimado"
                                                    value={drivingRoute ? formatMinutes(drivingRoute.durationMin) : '—'}
                                                    hint={
                                                        detourPercent != null
                                                            ? `+${detourPercent.toFixed(0)}% vs reta`
                                                            : 'dirigindo'
                                                    }
                                                />
                                            </div>
                                        )}

                                        {routeUrl && (
                                            <a
                                                href={routeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-violet-700 dark:text-violet-300 hover:underline"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Abrir rota no Google Maps
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Field icon={<User className="w-4 h-4" />} label="Motorista">
                            <input
                                value={driver}
                                onChange={(e) => setDriver(e.target.value)}
                                placeholder="Nome do entregador"
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                        </Field>

                        <Field icon={<Car className="w-4 h-4" />} label="Veículo">
                            <input
                                value={vehicle}
                                onChange={(e) => setVehicle(e.target.value)}
                                placeholder="Ex: Moto Honda CG (placa ABC-1234)"
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                        </Field>

                        <Field
                            icon={<MapPin className="w-4 h-4" />}
                            label={
                                <span className="flex items-center gap-1.5">
                                    Destino
                                    {customer && !destinationManuallyEdited && destination && (
                                        <span className="text-[10.5px] font-normal text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-0.5">
                                            <Check className="w-3 h-3" /> preenchido pelo cadastro
                                        </span>
                                    )}
                                </span>
                            }
                        >
                            <input
                                value={destination}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                    setDestinationManuallyEdited(true);
                                }}
                                placeholder="Endereço completo do destino"
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                            {customer && destinationManuallyEdited && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDestination(buildAddressString(customer));
                                        setDestinationManuallyEdited(false);
                                    }}
                                    className="mt-1 text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                    ↻ restaurar endereço do cadastro
                                </button>
                            )}
                        </Field>

                        <Field icon={<Calendar className="w-4 h-4" />} label="Data agendada">
                            <input
                                type="datetime-local"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                        </Field>

                        <Field label="Observações">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Informações adicionais para o entregador…"
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                        </Field>
                    </div>

                    <div className="flex items-center gap-2 px-5 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.04] rounded-md text-[13px]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!orderId || creating}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Truck className="w-4 h-4" />
                            {creating ? 'Criando…' : 'Criar entrega'}
                        </button>
                    </div>
                </section>
            </form>
        </div>
    );
}

function Field({
    label,
    icon,
    children,
}: {
    label: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {icon && <span className="text-slate-400">{icon}</span>}
                {label}
            </label>
            {children}
        </div>
    );
}

function DistanceMetric({
    label,
    value,
    hint,
    highlight,
}: {
    label: string;
    value: string;
    hint?: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={`p-2 rounded ${
                highlight
                    ? 'bg-white dark:bg-slate-900 ring-1 ring-violet-300 dark:ring-violet-500/40'
                    : 'bg-white/60 dark:bg-slate-900/40'
            }`}
        >
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
            <p
                className={`text-[14px] font-bold tabular-nums leading-tight ${
                    highlight ? 'text-violet-700 dark:text-violet-300' : 'text-slate-900 dark:text-white'
                }`}
            >
                {value}
            </p>
            {hint && <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5">{hint}</p>}
        </div>
    );
}
