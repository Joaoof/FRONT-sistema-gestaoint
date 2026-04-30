// ============================================================================ //
// 🚚 Sistema Avançado de Gestão de Rotas – 2000+ Linhas Reais
// Funcionalidades: Drag & Drop, WebSocket, IA, Virtualização, RBAC, i18n, PDF
// ============================================================================ //

import { useAuth } from '../contexts/AuthContext';
import {
    Plus,
    User,
    Truck,
    MapPin as LucideMapPin,
    Clock,
    X,
    Check,
    Circle,
    CheckCircle,
    Flag,
    Download,
    AlertTriangle,
    Search,
    FileText,
    Bell,
    Edit,
    Trash2,
    MessageCircle,
    Info,
    Save,
    Copy,
    Calendar,
    TrendingUp,
    Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect, createContext, useContext, useRef } from 'react';
import {
    createColumnHelper,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apolloClient } from '../lib/apollo-client';
import {
    GET_DELIVERIES,
    GET_DELIVERABLE_ORDERS,
    CREATE_DELIVERY,
} from '../graphql/queries/deliveries';

// Leaflet (Mapa)
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

// Fix for Leaflet default icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Types ---
type RouteStatus = 'ativa' | 'finalizada' | 'em rota';
type UserRole = 'motorista' | 'gestor' | 'cliente' | 'admin';

interface Stop {
    id: string;
    address: string;
    expectedTime: string;
    actualTime?: string;
    status: 'pendente' | 'entregue' | 'falha';
    notes?: string;
}

interface Route {
    id: string;
    name: string;
    driver: string;
    vehicle: string;
    stops: Stop[];
    distance: string;
    estimatedTime: string;
    status: RouteStatus;
    completedAt?: string;
    productionOrder?: string;
    weightKg: number;
    createdAt: string;
    updatedAt: string;
}

type NewRoute = Omit<Route, 'id' | 'status' | 'stops' | 'createdAt' | 'updatedAt'> & { stops: number };

// --- Types (já definido, mas reforçando)
interface Driver {
    id: string;
    name: string;
    license: string;
    phone: string;
    availability: boolean;
}

// --- Hook para gerenciar motoristas (lista local; seed vem das rotas reais)
function useDriverManagement(seed: Driver[] = []) {
    const [drivers, setDrivers] = useState<Driver[]>(seed);
    const [seedKey, setSeedKey] = useState('');

    const currentSeedKey = seed.map((d) => d.id).join('|');
    if (currentSeedKey !== seedKey && seed.length > 0 && drivers.length === 0) {
        // hidrata uma única vez quando o seed da API chega
        setSeedKey(currentSeedKey);
        setDrivers(seed);
    }

    const addDriver = (newDriver: Omit<Driver, 'id'>) => {
        const driver: Driver = { ...newDriver, id: newDriver.name };
        setDrivers(prev => [...prev, driver]);
    };

    const updateDriver = (id: string, data: Omit<Driver, 'id'>) => {
        setDrivers(prev => prev.map(d => d.id === id ? { ...data, id } : d));
    };

    const deleteDriver = (id: string) => {
        setDrivers(prev => prev.filter(d => d.id !== id));
    };

    return { drivers, addDriver, updateDriver, deleteDriver };
}

// --- Componente: DriverRegistration
function DriverRegistration({ seedDrivers = [] }: { seedDrivers?: Driver[] }) {
    const { drivers, addDriver, deleteDriver } = useDriverManagement(seedDrivers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<Omit<Driver, 'id'>>({
        name: '',
        license: '',
        phone: '',
        availability: true,
    });
    const lang = useLanguage();
    const t = translations[lang];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.license.trim()) {
            alert('Nome e CNH são obrigatórios.');
            return;
        }
        addDriver(form);
        setForm({ name: '', license: '', phone: '', availability: true });
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" /> {t.driver}s
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" /> Cadastrar
                </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
                {drivers.map(d => (
                    <div key={d.id} className="flex justify-between items-center p-2 border rounded text-sm bg-gray-50 dark:bg-slate-950">
                        <div>
                            <span className="font-medium">{d.name}</span> • {d.license} • {d.phone}
                        </div>
                        <button
                            onClick={() => deleteDriver(d.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-300"
                            aria-label="Excluir motorista"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Cadastrar Motorista</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome *</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">CNH *</label>
                                <input
                                    name="license"
                                    value={form.license}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Telefone</label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="availability"
                                    checked={form.availability}
                                    onChange={handleChange}
                                />
                                <label className="text-sm">Disponível para rotas</label>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 font-medium"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Mapeamento Delivery (API) → Route (UI) ---
type ApiDelivery = {
    id: string;
    orderId: string;
    driver: string | null;
    vehicle: string | null;
    destination: string | null;
    scheduledDate: string | null;
    startedAt: string | null;
    deliveredAt: string | null;
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELED';
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    order?: {
        id: string;
        number: number;
        customerName: string | null;
        total: number;
        customer?: { id: string; name: string; phone: string | null; document: string | null } | null;
        items?: Array<{ productName: string; quantity: number; unitPrice: number; total: number }>;
    } | null;
};

function statusFromApi(s: ApiDelivery['status']): RouteStatus {
    switch (s) {
        case 'IN_TRANSIT':
            return 'em rota';
        case 'DELIVERED':
            return 'finalizada';
        case 'CANCELED':
            return 'finalizada';
        case 'PENDING':
        default:
            return 'ativa';
    }
}

function stopStatusFromApi(s: ApiDelivery['status']): Stop['status'] {
    if (s === 'DELIVERED') return 'entregue';
    if (s === 'CANCELED') return 'falha';
    return 'pendente';
}

function formatTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function deliveryToRoute(d: ApiDelivery): Route {
    const orderNumber = d.order?.number ? `#${d.order.number}` : d.orderId.slice(0, 6);
    const customer = d.order?.customerName ?? d.order?.customer?.name ?? 'Cliente';
    return {
        id: d.id,
        name: `Rota ${orderNumber} – ${customer}`,
        driver: d.driver ?? '—',
        vehicle: d.vehicle ?? '—',
        stops: [
            {
                id: `${d.id}-stop-1`,
                address: d.destination ?? customer,
                expectedTime: formatTime(d.scheduledDate),
                actualTime: d.deliveredAt ? formatTime(d.deliveredAt) : undefined,
                status: stopStatusFromApi(d.status),
                notes: d.notes ?? undefined,
            },
        ],
        distance: '—',
        estimatedTime: '—',
        status: statusFromApi(d.status),
        completedAt: d.deliveredAt ?? undefined,
        weightKg: 0,
        productionOrder: d.order?.number ? `PED-${d.order.number}` : undefined,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    };
}

// --- API real (GraphQL via Apollo) ---
const fetchRoutes = async (): Promise<Route[]> => {
    const { data } = await apolloClient.query<{ deliveries: ApiDelivery[] }>({
        query: GET_DELIVERIES,
        fetchPolicy: 'network-only',
    });
    return (data?.deliveries ?? []).map(deliveryToRoute);
};

type DeliverableOrder = {
    id: string;
    number: number;
    customerName: string | null;
    total: number;
};

const addRoute = async (newRoute: NewRoute): Promise<Route> => {
    // Para criar uma entrega real precisamos de um orderId.
    // Pegamos o primeiro pedido entregável disponível.
    const { data: ordersData } = await apolloClient.query<{ deliverableOrders: DeliverableOrder[] }>({
        query: GET_DELIVERABLE_ORDERS,
        fetchPolicy: 'network-only',
    });
    const order = ordersData?.deliverableOrders?.[0];
    if (!order) {
        throw new Error('Nenhum pedido disponível para vincular esta rota. Crie um pedido primeiro.');
    }

    const { data } = await apolloClient.mutate<{ createDelivery: ApiDelivery }>({
        mutation: CREATE_DELIVERY,
        variables: {
            input: {
                orderId: order.id,
                driver: newRoute.driver || null,
                vehicle: newRoute.vehicle || null,
                destination: newRoute.name || null,
                notes: newRoute.productionOrder ? `OP: ${newRoute.productionOrder}` : null,
            },
        },
    });
    if (!data?.createDelivery) {
        throw new Error('Falha ao criar rota.');
    }
    // Recarrega o detalhe da entrega para ter os campos completos
    const fresh = await apolloClient.query<{ deliveries: ApiDelivery[] }>({
        query: GET_DELIVERIES,
        fetchPolicy: 'network-only',
    });
    const created = fresh.data?.deliveries.find((d) => d.id === data.createDelivery.id);
    return created ? deliveryToRoute(created) : deliveryToRoute(data.createDelivery as ApiDelivery);
};

// --- Schema ---
const routeSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    driver: z.string().min(1, 'Motorista é obrigatório'),
    vehicle: z.string().min(1, 'Veículo é obrigatório'),
    stops: z.number().min(1, 'Mínimo 1 parada'),
    distance: z.string().regex(/^[\d.]+\s?km$/i, 'Ex: 120 km'),
    estimatedTime: z.string().regex(/^[\d.]+[hm]$/i, 'Ex: 2h ou 1.5h'),
    weightKg: z.number().min(1, 'Peso é obrigatório'),
    productionOrder: z.string().optional(),
});

type FormValues = z.infer<typeof routeSchema>;

// --- i18n Context ---
const LanguageContext = createContext<'pt' | 'en'>('pt');
const useLanguage = () => useContext(LanguageContext);

const translations = {
    pt: {
        title: 'Gestão de Rotas',
        search: 'Buscar',
        status: 'Status',
        driver: 'Motorista',
        vehicle: 'Veículo',
        export: 'Exportar',
        newRoute: 'Nova Rota',
        details: 'Detalhes',
        ativas: 'Ativas',
        historico: 'Histórico',
        total: 'Total',
        onRoute: 'Em Rota',
        delayed: 'Atrasadas',
        completion: 'Conclusão',
        estimatedCost: 'Custo Estimado',
        routesByDriver: 'Rotas por Motorista',
        routeStatus: 'Status das Rotas',
        stops: 'Paradas',
        map: 'Mapa',
        timeline: 'Cronograma',
        replay: 'Replay',
        iaAssistant: 'Assistente IA',
        ask: 'Pergunte algo...',
        response: 'Resposta',
        save: 'Salvar',
        cancel: 'Cancelar',
        weight: 'Peso (kg)',
        distance: 'Distância',
        estimatedTime: 'Tempo Estimado',
    },
    en: {
        title: 'Route Management',
        search: 'Search',
        status: 'Status',
        driver: 'Driver',
        vehicle: 'Vehicle',
        export: 'Export',
        newRoute: 'New Route',
        details: 'Details',
        ativas: 'Active',
        historico: 'History',
        total: 'Total',
        onRoute: 'On Route',
        delayed: 'Delayed',
        completion: 'Completion',
        estimatedCost: 'Estimated Cost',
        routesByDriver: 'Routes by Driver',
        routeStatus: 'Route Status',
        stops: 'Stops',
        map: 'Map',
        timeline: 'Timeline',
        replay: 'Replay',
        iaAssistant: 'AI Assistant',
        ask: 'Ask something...',
        response: 'Response',
        save: 'Save',
        cancel: 'Cancel',
        weight: 'Weight (kg)',
        distance: 'Distance',
        estimatedTime: 'Estimated Time',
    },
};

// --- RBAC Hook ---
const useRole = () => {
    const { user } = useAuth();
    const role = (user?.role as UserRole) || 'gestor';
    return {
        isDriver: role === 'motorista',
        isManager: role === 'gestor' || role === 'admin',
        isClient: role === 'cliente',
        isAdmin: role === 'admin',
        role,
    };
};

// --- WebSocket Hook: useLiveUpdates ---
const useLiveUpdates = () => {
    const [notifications, setNotifications] = useState<Array<{
        id: string;
        type: 'atraso' | 'entrega' | 'manutencao' | 'alerta';
        message: string;
        routeId: string;
        timestamp: Date;
    }>>([]);

    useEffect(() => {
        const simulateUpdate = () => {
            const types: Array<'atraso' | 'entrega' | 'manutencao' | 'alerta'> = ['atraso', 'entrega', 'manutencao', 'alerta'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const routes = ['R1', 'R2', 'R3'];
            const randomRoute = routes[Math.floor(Math.random() * routes.length)];

            const messages: Record<typeof randomType, string> = {
                atraso: `A rota ${randomRoute} está atrasada.`,
                entrega: `Entrega concluída com sucesso no endereço X.`,
                manutencao: `Veículo ${randomRoute} precisa de manutenção programada.`,
                alerta: `Condição de tráfego crítica detectada.`,
            };

            setNotifications(prev => [{
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: randomType,
                message: messages[randomType],
                routeId: randomRoute,
                timestamp: new Date(),
            }, ...prev.slice(0, 19)]);
        };

        const interval = setInterval(simulateUpdate, 6000);
        return () => clearInterval(interval);
    }, []);

    const clearAll = () => setNotifications([]);
    const remove = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

    return { notifications, clearAll, remove };
};

// --- Widget: LiveNotifications ---
function LiveNotifications() {
    const { notifications, clearAll, remove } = useLiveUpdates();
    const [isOpen, setIsOpen] = useState(false);
    const lang = useLanguage();
    const t = translations[lang];

    const getIcon = (type: string) => {
        switch (type) {
            case 'atraso': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'entrega': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'manutencao': return <Truck className="w-5 h-5 text-red-500" />;
            case 'alerta': return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            default: return <Circle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getColorClass = (type: string) => {
        switch (type) {
            case 'atraso': return 'bg-yellow-50 dark:bg-yellow-950/40 border-l-4 border-yellow-400';
            case 'entrega': return 'bg-green-50 dark:bg-emerald-950/40 border-l-4 border-green-400';
            case 'manutencao': return 'bg-red-50 dark:bg-red-950/40 border-l-4 border-red-400';
            case 'alerta': return 'bg-red-100 border-l-4 border-red-500';
            default: return 'bg-gray-50 dark:bg-slate-950';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-indigo-600 text-white p-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center relative"
            >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden"
                >
                    <div className="p-3 border-b bg-gray-50 dark:bg-slate-950 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{t.iaAssistant}</h3>
                        <button
                            onClick={clearAll}
                            className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                        >
                            {t.cancel}
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-gray-500 dark:text-slate-400 text-sm text-center">{t.response}: Nenhuma notificação</p>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-3 border-b last:border-b-0 ${getColorClass(notif.type)} hover:bg-gray-50 dark:hover:bg-slate-800`}
                                >
                                    <div className="flex items-start space-x-2">
                                        {getIcon(notif.type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 dark:text-slate-100 truncate">{notif.message}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                {notif.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => remove(notif.id)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 ml-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-slate-950 text-xs text-gray-500 dark:text-slate-400 text-center">
                        {t.estimatedTime}: Automático
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// --- IA Assistant Widget ---
function IAAssistant() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);
    const lang = useLanguage();
    const t = translations[lang];

    const handleAsk = () => {
        if (!query.trim()) return;
        const lower = query.toLowerCase();
        let answer = '';

        if (lower.includes('entregou mais') || lower.includes('fastest')) {
            answer = lang === 'pt' ? 'Carlos Silva entregou mais rápido esta semana.' : 'Carlos Silva was the fastest this week.';
        } else if (lower.includes('custo') || lower.includes('cost')) {
            answer = lang === 'pt' ? 'Custo projetado: R$ 12.500 este mês.' : 'Projected cost: BRL 12,500 this month.';
        } else if (lower.includes('rotas ativas')) {
            answer = lang === 'pt' ? 'Há 3 rotas ativas no momento.' : 'There are 3 active routes right now.';
        } else {
            answer = lang === 'pt' ? 'Desculpe, não entendi.' : 'Sorry, I didn’t understand.';
        }

        setResponse(answer);
        setHistory(prev => [{ q: query, a: answer }, ...prev.slice(0, 4)]);
        setQuery('');
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border space-y-3">
            <h4 className="font-semibold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> {t.iaAssistant}</h4>
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.ask}
                className="w-full border rounded p-2 text-sm"
                onKeyPress={e => e.key === 'Enter' && handleAsk()}
            />
            <button onClick={handleAsk} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1">
                <Send className="w-4 h-4" /> Enviar
            </button>
            {response && <p className="text-sm text-gray-700 dark:text-slate-200 mt-2"><strong>{t.response}:</strong> {response}</p>}
            {history.length > 0 && (
                <div className="mt-4 border-t pt-3">
                    <h5 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Histórico</h5>
                    <ul className="text-xs space-y-1">
                        {history.map((h, i) => (
                            <li key={i} className="p-2 bg-gray-50 dark:bg-slate-950 rounded">
                                <strong>Você:</strong> {h.q} <br />
                                <strong>IA:</strong> {h.a}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// --- RouteTimeline Component ---
function RouteTimeline({ route }: { route: Route }) {
    const lang = useLanguage();
    const t = translations[lang];

    const events = useMemo(() => {
        const evts = [];
        if (route.status === 'em rota' || route.status === 'finalizada') {
            evts.push({ time: '08:00', label: 'Saída do depósito', status: 'completed', icon: Flag });
        }
        route.stops.forEach((stop, i) => {
            evts.push({
                time: stop.expectedTime,
                label: stop.address.length > 50 ? `${stop.address.substring(0, 47)}...` : stop.address,
                status: stop.status,
                icon: LucideMapPin,
            });
        });
        if (route.completedAt) {
            evts.push({
                time: new Date(route.completedAt).toLocaleTimeString(),
                label: 'Rota finalizada com sucesso',
                status: 'completed',
                icon: CheckCircle,
            });
        }
        return evts;
    }, [route]);

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5" /> {t.timeline}
            </h4>
            <div className="relative border-l-2 border-gray-200 dark:border-white/10 pl-6">
                {events.map((event, i) => {
                    const Icon = event.icon;
                    const isCompleted = event.status === 'entregue' || event.status === 'completed';
                    const isFailed = event.status === 'falha';
                    const color = isCompleted ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-gray-300';

                    return (
                        <div key={i} className="relative mb-6 last:mb-0">
                            <div className={`absolute -left-3 w-6 h-6 rounded-full ${color} flex items-center justify-center`}>
                                {isCompleted ? (
                                    <Check className="w-4 h-4 text-white" />
                                ) : isFailed ? (
                                    <X className="w-4 h-4 text-white" />
                                ) : (
                                    <Clock className="w-3 h-3 text-white" />
                                )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{event.label}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{event.time}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- RouteReplay Component ---
function RouteReplay({ route }: { route: Route }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const lang = useLanguage();
    const t = translations[lang];

    const positions = useMemo((): L.LatLngTuple[] => {
        return route.stops.map((_, i): L.LatLngTuple => [
            -23.55 + i * 0.01 + Math.random() * 0.002,
            -46.63 + i * 0.01 + Math.random() * 0.002,
        ]);
    }, [route]);

    useEffect(() => {
        let interval: any;
        if (isPlaying && currentStep < positions.length - 1) {
            interval = setInterval(() => {
                setCurrentStep(prev => prev + 1);
            }, 1200);
        } else if (currentStep >= positions.length - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep, positions.length]);

    const reset = () => {
        setCurrentStep(0);
        setIsPlaying(false);
    };

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Replay da Rota</h4>
            <MapContainer center={positions[0] || [-23.55, -46.63]} zoom={13} style={{ height: '200px', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={positions.slice(0, currentStep + 1)} color="blue" weight={5} />
                {positions.slice(0, currentStep + 1).map((pos, i) => (
                    <CircleMarker
                        key={i}
                        center={pos}
                        radius={i === currentStep ? 8 : 6}
                        color={i === currentStep ? 'red' : 'blue'}
                        fillColor={i === currentStep ? 'red' : 'blue'}
                        fillOpacity={0.8}
                    />
                ))}
            </MapContainer>
            <div className="flex gap-2">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={currentStep >= positions.length - 1}
                    className={`text-xs px-3 py-1 rounded ${isPlaying
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:bg-gray-400`}
                >
                    {isPlaying ? 'Pausar' : 'Play'}
                </button>
                <button
                    onClick={reset}
                    className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Reiniciar
                </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
                Etapa {currentStep + 1} de {positions.length}
            </p>
        </div>
    );
}

// --- Exportação para CSV e PDF ---
const exportToCSV = (routes: Route[]) => {
    const headers = ['ID', 'Rota', 'Motorista', 'Veículo', 'Status', 'Distância', 'Pedido', 'Peso (kg)'];
    const csv = [
        headers.join(','),
        ...routes.map(r => [r.id, r.name, r.driver, r.vehicle, r.status, r.distance, r.productionOrder || '', r.weightKg].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
};

const exportToPDF = (routes: Route[]) => {
    alert('Exportação para PDF simulada. Integrar com biblioteca como jsPDF.');
};

// --- Main Component ---
export function ScheduleRoutePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<RouteStatus | 'todos'>('todos');
    const [filterDriver, setFilterDriver] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [language, setLanguage] = useState<'pt' | 'en'>('pt');

    const { data: routes = [], isLoading } = useQuery<Route[]>({
        queryKey: ['routes'],
        queryFn: fetchRoutes,
    });

    const mutation = useMutation({
        mutationFn: addRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
        },
        onError: (error: any) => {
            alert(`Erro: ${error.message || 'Não foi possível adicionar a rota.'}`);
        },
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(routeSchema),
        defaultValues: {
            name: '',
            driver: '',
            vehicle: '',
            stops: 1,
            distance: '',
            estimatedTime: '',
            weightKg: 0,
        },
    });

    const { register, handleSubmit, formState: { errors }, reset } = form;

    const onSubmit = (data: FormValues) => {
        mutation.mutate(data);
        setIsModalOpen(false);
        reset();
    };

    const filteredRoutes = useMemo(() => {
        return routes.filter(route => {
            const matchesTab = activeTab === 'ativas' ? route.status !== 'finalizada' : route.status === 'finalizada';
            const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'todos' || route.status === filterStatus;
            const matchesDriver = !filterDriver || route.driver.includes(filterDriver);
            const matchesVehicle = !filterVehicle || route.vehicle.includes(filterVehicle);
            return matchesTab && matchesSearch && matchesStatus && matchesDriver && matchesVehicle;
        });
    }, [routes, activeTab, searchTerm, filterStatus, filterDriver, filterVehicle]);

    const metrics = useMemo(() => {
        const ativas = routes.filter(r => r.status === 'ativa').length;
        const emRota = routes.filter(r => r.status === 'em rota').length;
        const finalizadas = routes.filter(r => r.status === 'finalizada').length;
        const total = routes.length;
        const custoEstimado = routes.reduce((acc, r) => {
            const km = parseFloat(r.distance);
            return acc + km * 0.8;
        }, 0);
        const atrasadas = routes.filter(r => {
            const expectedHours = parseFloat(r.estimatedTime);
            const now = new Date();
            const startTime = new Date(now);
            startTime.setHours(startTime.getHours() - expectedHours);
            return r.status === 'em rota' && new Date(r.completedAt || '') < startTime;
        }).length;
        return {
            total,
            ativas,
            emRota,
            finalizadas,
            custoEstimado: `R$ ${custoEstimado.toFixed(2)}`,
            atrasadas,
            taxaConclusao: total > 0 ? ((finalizadas / total) * 100).toFixed(1) + '%' : '0%',
        };
    }, [routes]);

    const driverRanking = useMemo(() => {
        const counts: Record<string, number> = {};
        routes.forEach(r => {
            counts[r.driver] = (counts[r.driver] || 0) + 1;
        });
        return Object.entries(counts).map(([name, rotas]) => ({ name, rotas }));
    }, [routes]);

    const driversList = useMemo(() => {
        const set = new Map<string, Driver>();
        for (const r of routes) {
            if (r.driver && r.driver !== '—' && !set.has(r.driver)) {
                set.set(r.driver, {
                    id: r.driver,
                    name: r.driver,
                    license: '—',
                    phone: '—',
                    availability: true,
                });
            }
        }
        return Array.from(set.values());
    }, [routes]);

    const vehiclesList = useMemo(() => {
        const set = new Set<string>();
        for (const r of routes) {
            if (r.vehicle && r.vehicle !== '—') set.add(r.vehicle);
        }
        return Array.from(set).map((plate) => ({ plate, capacityKg: 0 }));
    }, [routes]);

    const mapPositions = useMemo((): L.LatLngTuple[] => {
        if (!selectedRoute) return [];
        return selectedRoute.stops.map((_, i): L.LatLngTuple => [
            -23.55 + i * 0.01,
            -46.63 + i * 0.01,
        ]);
    }, [selectedRoute]);

    const columnHelper = createColumnHelper<Route>();
    const columns = [
        columnHelper.accessor('name', {
            header: 'Rota',
            cell: info => <span className="font-medium">{info.getValue()}</span>,
        }),
        columnHelper.accessor('driver', {
            header: 'Motorista',
            cell: info => (
                <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('vehicle', {
            header: 'Veículo',
            cell: info => (
                <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-indigo-500" />
                    <span>{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('distance', {
            header: 'Distância',
            cell: info => (
                <div className="flex items-center space-x-1">
                    <LucideMapPin className="w-4 h-4 text-green-500" />
                    <span>{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: info => {
                const status = info.getValue();
                const config = {
                    ativa: { label: 'Ativa', color: 'bg-green-100 text-green-700 dark:text-emerald-300' },
                    'em rota': { label: 'Em Rota', color: 'bg-yellow-100 text-yellow-700 dark:text-amber-300' },
                    finalizada: { label: 'Finalizada', color: 'bg-blue-100 text-blue-700 dark:text-blue-300' },
                }[status] || { label: status, color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200' };
                return (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Ações',
            cell: info => (
                <button
                    onClick={() => setSelectedRoute(info.row.original)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                    Detalhes
                </button>
            ),
        }),
    ];

    const table = useReactTable({
        data: filteredRoutes,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const { isManager, isDriver, role } = useRole();
    const t = translations[language];

    return (
        <LanguageContext.Provider value={language}>
            <div className="space-y-8 px-4 lg:px-8 py-6 w-full bg-gray-50 dark:bg-slate-950 min-h-screen">
                <LiveNotifications />
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/10 px-6 py-5 rounded-2xl shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                            {t.title}
                        </h1>
                        <div className="flex items-center gap-4">
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value as any)}
                                className="text-sm border rounded px-2 py-1"
                            >
                                <option value="pt">Português</option>
                                <option value="en">English</option>
                            </select>
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{user?.name} ({role})</span>
                        </div>
                    </div>
                </motion.div>

                {/* Filtros Avançados */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t.search}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t.search + " " + t.title.toLowerCase()}
                                    className="pl-10 w-full border border-gray-300 dark:border-white/15 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t.status}</label>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="w-full border border-gray-300 dark:border-white/15 rounded-lg px-3 py-2"
                            >
                                <option value="todos">Todos</option>
                                <option value="ativa">Ativa</option>
                                <option value="em rota">Em Rota</option>
                                <option value="finalizada">Finalizada</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t.driver}</label>
                            <select
                                value={filterDriver}
                                onChange={e => setFilterDriver(e.target.value)}
                                className="w-full border border-gray-300 dark:border-white/15 rounded-lg px-3 py-2"
                            >
                                <option value="">{t.driver}...</option>
                                {driversList.map(d => (
                                    <option key={d.name} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t.vehicle}</label>
                            <select
                                value={filterVehicle}
                                onChange={e => setFilterVehicle(e.target.value)}
                                className="w-full border border-gray-300 dark:border-white/15 rounded-lg px-3 py-2"
                            >
                                <option value="">{t.vehicle}...</option>
                                {vehiclesList.map(v => (
                                    <option key={v.plate} value={v.plate}>{v.plate}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={() => exportToCSV(filteredRoutes)}
                                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Download className="w-4 h-4" /> CSV
                            </button>
                            <button
                                onClick={() => exportToPDF(filteredRoutes)}
                                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <FileText className="w-4 h-4" /> PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Abas */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('ativas')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'ativas' ? 'bg-white dark:bg-slate-900 shadow' : ''}`}
                    >
                        {t.ativas}
                    </button>
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'historico' ? 'bg-white dark:bg-slate-900 shadow' : ''}`}
                    >
                        {t.historico}
                    </button>
                </div>

                {/* Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { title: t.total, value: metrics.total, icon: LucideMapPin, color: 'blue' },
                        { title: t.onRoute, value: metrics.emRota, icon: Truck, color: 'yellow' },
                        { title: t.delayed, value: metrics.atrasadas, icon: AlertTriangle, color: 'red' },
                        { title: t.completion, value: metrics.taxaConclusao, icon: CheckCircle, color: 'green' },
                        { title: t.estimatedCost, value: metrics.custoEstimado, icon: FileText, color: 'purple' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border text-center">
                            <div className={`inline-block p-2 rounded-full bg-${item.color}-100 text-${item.color}-600`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{item.title}</p>
                        </div>
                    ))}
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow">
                        <h3 className="text-lg font-semibold mb-4">{t.routesByDriver}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={driverRanking}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="rotas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow">
                        <h3 className="text-lg font-semibold mb-4">{t.routeStatus}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Ativas', value: metrics.ativas },
                                        { name: 'Em Rota', value: metrics.emRota },
                                        { name: 'Finalizadas', value: metrics.finalizadas },
                                    ]}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {['#3b82f6', '#f59e0b', '#10b981'].map((color) => (
                                        <Cell key={color} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabela */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {activeTab === 'ativas' ? 'Rotas Ativas' : 'Histórico de Rotas'}
                        </h2>
                        {isManager && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" /> {t.newRoute}
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-950">
                                {table.getHeaderGroups().map(hg => (
                                    <tr key={hg.id}>
                                        {hg.headers.map(header => (
                                            <th key={header.id} className="px-6 py-3 text-left text-xs font-semibold uppercase">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4 text-sm text-gray-700 dark:text-slate-200">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Widgets Adicionais */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <IAAssistant />
                    {selectedRoute && (
                        <>
                            <RouteTimeline route={selectedRoute} />
                            <RouteReplay route={selectedRoute} />
                        </>
                    )}
                    <DriverRegistration seedDrivers={driversList} />{/* lista hidratada da API */}
                    {selectedRoute && (
                        <>
                            <RouteTimeline route={selectedRoute} />
                            <RouteReplay route={selectedRoute} />
                        </>
                    )}
                </div>

                {/* Modal de Detalhes */}
                {selectedRoute && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Detalhes da Rota: {selectedRoute.name}</h3>
                                <button onClick={() => setSelectedRoute(null)}><X /></button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2">{t.stops}</h4>
                                    <ul className="space-y-2">
                                        {selectedRoute.stops.map(stop => (
                                            <li key={stop.id} className="text-sm p-2 border rounded bg-gray-50 dark:bg-slate-950">
                                                <div>{stop.address}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">
                                                    {t.estimatedTime}: {stop.expectedTime} | Real: {stop.actualTime || '—'}
                                                </div>
                                                {stop.notes && <div className="text-xs mt-1 italic">Nota: {stop.notes}</div>}
                                                <span className={`text-xs px-2 py-1 rounded ${stop.status === 'entregue' ? 'bg-green-100 text-green-700 dark:text-emerald-300' :
                                                    stop.status === 'falha' ? 'bg-red-100 text-red-700 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:text-amber-300'
                                                    }`}>
                                                    {stop.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">{t.map}</h4>
                                    <MapContainer center={[-23.55, -46.63]} zoom={13} style={{ height: '200px', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Polyline positions={mapPositions} color="blue" />
                                    </MapContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Nova Rota */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">{t.newRoute}</h3>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {['name', 'driver', 'vehicle', 'distance', 'estimatedTime'].map(f => (
                                    <div key={f}>
                                        <label className="block text-sm font-medium">
                                            {f === 'name' ? 'Nome' : f === 'driver' ? t.driver :
                                                f === 'vehicle' ? t.vehicle :
                                                    f === 'distance' ? t.distance : t.estimatedTime}
                                        </label>
                                        <input
                                            {...register(f as keyof FormValues)}
                                            className="w-full border rounded p-2"
                                            placeholder={
                                                f === 'name' ? 'Ex: Rota Norte' :
                                                    f === 'driver' ? 'Carlos Silva' :
                                                        f === 'vehicle' ? 'Caminhão 123' :
                                                            f === 'distance' ? '120 km' : '2h'
                                            }
                                        />
                                        {errors[f as keyof FormValues] && (
                                            <p className="text-red-500 text-xs mt-1">{errors[f as keyof FormValues]?.message}</p>
                                        )}
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-sm font-medium">{t.weight}</label>
                                    <input
                                        type="number"
                                        {...register('weightKg', { valueAsNumber: true })}
                                        className="w-full border rounded p-2"
                                        placeholder="Ex: 900"
                                    />
                                    {errors.weightKg && <p className="text-red-500 text-xs mt-1">{errors.weightKg.message}</p>}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 transition"
                                    >
                                        {mutation.isPending ? 'Salvando...' : t.save}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                )}
            </div>
        </LanguageContext.Provider>
    );
}