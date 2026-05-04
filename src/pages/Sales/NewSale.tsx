import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Box,
    CalendarClock,
    CheckCircle,
    CreditCard,
    Loader2,
    MapPin,
    Minus,
    Package,
    Plus,
    Printer,
    Search,
    ShoppingCart,
    Sparkles,
    Trash2,
    Truck,
    User,
    UserPlus,
    Wrench,
    X,
} from 'lucide-react';
import { CREATE_PRODUCT_WITH_IMAGES, LIST_PRODUCTS_WITH_IMAGES } from '../../graphql/mutations/product-with-images';
import { GET_CUSTOMERS_LIST } from '../../graphql/queries/accounts';
import { CREATE_CUSTOMER_BASIC } from '../../graphql/mutations/accounts';
import { CREATE_ORDER } from '../../graphql/queries/orders';
import { GET_SELLERS } from '../../graphql/queries/sellers';
import { getCurrentPosition, lookupCep, reverseGeocode } from '../../utils/location';
import { useNotificationsCenter } from '../../contexts/NotificationsCenterContext';
import { ProductImage } from '../../components/ProductImage';

type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'TRANSFER' | 'OTHER';
type OrderType = 'STANDARD' | 'CUSTOM_ORDER';
type ProductKind = 'PRODUCT' | 'SERVICE' | 'LABOR';

interface ProductOption {
    id: string;
    kind: ProductKind;
    nameProduct: string;
    sku: string | null;
    quantity: number;
    minStock: number;
    unit: string;
    salePrice: number;
    images: { id: string; url: string; isPrimary: boolean; order: number }[];
}

const KIND_LABEL: Record<ProductKind, string> = {
    PRODUCT: 'Produto',
    SERVICE: 'Serviço',
    LABOR: 'Mão de obra',
};

const KIND_ICON: Record<ProductKind, React.ComponentType<{ className?: string }>> = {
    PRODUCT: Box,
    SERVICE: Sparkles,
    LABOR: Wrench,
};

function isStocklessKind(kind: ProductKind | undefined): boolean {
    return kind === 'SERVICE' || kind === 'LABOR';
}

interface CustomerOption {
    id: string;
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
}

interface CartItem {
    productId: string;
    kind: ProductKind;
    nameProduct: string;
    sku: string | null;
    unit: string;
    unitPrice: number;
    quantity: number;
    discount: number;
    description: string;
    stockAvailable: number;
    coverUrl?: string;
}

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'CASH', label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
    { value: 'PIX', label: 'PIX', icon: <Banknote className="w-4 h-4" /> },
    { value: 'CREDIT_CARD', label: 'Cartão crédito', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'DEBIT_CARD', label: 'Cartão débito', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'BOLETO', label: 'Boleto', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'TRANSFER', label: 'Transferência', icon: <CreditCard className="w-4 h-4" /> },
];

export function NewSale() {
    const navigate = useNavigate();
    const { push: pushNotification } = useNotificationsCenter();
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [customerDocument, setCustomerDocument] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        razaoSocial: '',
        nomeFantasia: '',
        document: '',
        phone: '',
        cep: '',
        address: '',
        bairro: '',
        cidade: '',
        estado: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const [cepLoading, setCepLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [orderType, setOrderType] = useState<OrderType>('STANDARD');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
    const [depositAmount, setDepositAmount] = useState<string>('0');
    const [orderDiscount, setOrderDiscount] = useState<string>('0');
    const [notes, setNotes] = useState('');
    const [sellerId, setSellerId] = useState<string>('');
    const [commissionPercent, setCommissionPercent] = useState<string>('');
    const [printPrompt, setPrintPrompt] = useState<{ id: string; number: number; total: number } | null>(null);

    const isCustomOrder = orderType === 'CUSTOM_ORDER';

    // Sugere data de entrega 7 dias à frente quando vira encomenda
    useEffect(() => {
        if (!isCustomOrder || expectedDeliveryDate) return;
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const tz = d.getTimezoneOffset() * 60000;
        setExpectedDeliveryDate(new Date(d.getTime() - tz).toISOString().slice(0, 10));
    }, [isCustomOrder, expectedDeliveryDate]);

    const { data: productsData, loading: loadingProducts } = useQuery<{ products: ProductOption[] }>(
        LIST_PRODUCTS_WITH_IMAGES,
        { variables: { take: 200, skip: 0 }, fetchPolicy: 'cache-and-network' },
    );
    const { data: customersData, refetch: refetchCustomers } = useQuery<{ customers: CustomerOption[] }>(
        GET_CUSTOMERS_LIST,
    );
    const { data: sellersData } = useQuery<{
        sellers: { id: string; name: string; commissionPercent: number; active: boolean }[];
    }>(GET_SELLERS, { variables: { activeOnly: true }, fetchPolicy: 'cache-and-network' });

    const [createOrder, { loading: creatingOrder }] = useMutation(CREATE_ORDER);
    const [createCustomer, { loading: creatingCustomer }] = useMutation(CREATE_CUSTOMER_BASIC);
    const [createProduct, { loading: creatingProduct }] = useMutation(
        CREATE_PRODUCT_WITH_IMAGES,
        { refetchQueries: [{ query: LIST_PRODUCTS_WITH_IMAGES, variables: { take: 200, skip: 0 } }] },
    );

    // Formulário de adição rápida de Mão de obra / Serviço
    const [showLaborForm, setShowLaborForm] = useState(false);
    const [laborForm, setLaborForm] = useState({
        kind: 'LABOR' as 'LABOR' | 'SERVICE',
        name: '',
        unit: 'HORA',
        salePrice: '',
        description: '',
    });

    function resetLaborForm() {
        setLaborForm({
            kind: 'LABOR',
            name: '',
            unit: 'HORA',
            salePrice: '',
            description: '',
        });
    }

    async function handleAddLabor() {
        const name = laborForm.name.trim();
        const price = parseFloat(laborForm.salePrice.replace(',', '.'));
        if (!name) {
            toast.error('Informe a descrição da mão de obra.');
            return;
        }
        if (!Number.isFinite(price) || price <= 0) {
            toast.error('Informe o valor da mão de obra.');
            return;
        }
        try {
            const res = await createProduct({
                variables: {
                    input: {
                        kind: laborForm.kind,
                        nameProduct: name,
                        unit: laborForm.unit || (laborForm.kind === 'LABOR' ? 'HORA' : 'SERV'),
                        costPrice: 0,
                        salePrice: price,
                        quantity: 0,
                        minStock: 0,
                        active: true,
                        description: laborForm.description.trim() || undefined,
                        images: [],
                    },
                },
            });
            const created = res.data?.createProductMutation;
            if (!created) {
                toast.error('Não foi possível cadastrar.');
                return;
            }
            // Adiciona direto ao carrinho (qtd fixa = 1, com a descrição como detalhe da linha)
            setCart((prev) => [
                ...prev,
                {
                    productId: created.id,
                    kind: laborForm.kind,
                    nameProduct: created.nameProduct,
                    sku: created.sku ?? null,
                    unit: created.unit,
                    unitPrice: Number(created.salePrice),
                    quantity: 1,
                    discount: 0,
                    description: laborForm.description.trim(),
                    stockAvailable: 0,
                    coverUrl: undefined,
                },
            ]);
            toast.success(
                laborForm.kind === 'LABOR'
                    ? 'Mão de obra adicionada ao pedido.'
                    : 'Serviço adicionado ao pedido.',
            );
            resetLaborForm();
            setShowLaborForm(false);
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao cadastrar mão de obra');
        }
    }

    const products = productsData?.products ?? [];
    const customers = customersData?.customers ?? [];
    const sellers = sellersData?.sellers ?? [];
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const selectedSeller = sellers.find((s) => s.id === sellerId);

    // Auto-preenche CPF/telefone ao escolher um cliente cadastrado
    useEffect(() => {
        if (selectedCustomer) {
            setCustomerDocument(selectedCustomer.document ?? '');
            setCustomerPhone(selectedCustomer.phone ?? '');
        }
    }, [selectedCustomer?.id]);
    const effectiveCommissionPercent =
        commissionPercent !== '' ? Number(commissionPercent) : selectedSeller?.commissionPercent ?? 0;

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter((p) => {
            const stockless = isStocklessKind(p.kind);
            // Em pronta-entrega só mostra produto físico com estoque OU itens stockless.
            // Em encomenda, todos os tipos aparecem (estoque será consumido depois).
            if (!isCustomOrder && !stockless && p.quantity <= 0) return false;
            if (!term) return true;
            return (
                p.nameProduct.toLowerCase().includes(term) ||
                (p.sku ?? '').toLowerCase().includes(term)
            );
        });
    }, [products, search, isCustomOrder]);

    const subtotal = useMemo(
        () =>
            cart.reduce(
                (sum, i) =>
                    sum + (i.unitPrice * (isStocklessKind(i.kind) ? 1 : i.quantity) - i.discount),
                0,
            ),
        [cart],
    );
    const discountValue = Math.max(0, parseFloat(orderDiscount.replace(',', '.')) || 0);
    const total = Math.max(0, subtotal - discountValue);
    const totalItems = cart.reduce(
        (sum, i) => sum + (isStocklessKind(i.kind) ? 1 : i.quantity),
        0,
    );
    const depositValue = isCustomOrder ? Math.max(0, parseFloat(depositAmount.replace(',', '.')) || 0) : 0;
    const remainingBalance = Math.max(0, total - depositValue);

    function addToCart(product: ProductOption) {
        const stockless = isStocklessKind(product.kind);
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                // Mão de obra / serviço fica fixo em 1 — não incrementa.
                if (stockless) {
                    toast.info('Este item já foi adicionado (qtd. fixa = 1).');
                    return prev;
                }
                // Pronta-entrega: respeita o estoque. Encomenda: ignora.
                if (!isCustomOrder && existing.quantity + 1 > product.quantity) {
                    toast.error(`Estoque máximo: ${product.quantity} ${product.unit}`);
                    return prev;
                }
                return prev.map((i) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    kind: product.kind ?? 'PRODUCT',
                    nameProduct: product.nameProduct,
                    sku: product.sku,
                    unit: product.unit,
                    unitPrice: product.salePrice,
                    quantity: 1,
                    discount: 0,
                    description: '',
                    stockAvailable: product.quantity,
                    coverUrl: product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url,
                },
            ];
        });
    }

    function updateQty(productId: string, qty: number) {
        setCart((prev) =>
            prev.map((i) => {
                if (i.productId !== productId) return i;
                if (isStocklessKind(i.kind)) return i; // qty fixa = 1
                const cap = isCustomOrder ? Number.MAX_SAFE_INTEGER : i.stockAvailable;
                const next = Math.max(1, Math.min(qty, cap));
                return { ...i, quantity: next };
            }),
        );
    }

    function updateDescription(productId: string, description: string) {
        setCart((prev) =>
            prev.map((i) => (i.productId === productId ? { ...i, description } : i)),
        );
    }

    function updatePrice(productId: string, price: number) {
        setCart((prev) =>
            prev.map((i) => (i.productId === productId ? { ...i, unitPrice: Math.max(0, price) } : i)),
        );
    }

    function updateItemDiscount(productId: string, discount: number) {
        setCart((prev) =>
            prev.map((i) =>
                i.productId === productId
                    ? { ...i, discount: Math.max(0, Math.min(discount, i.unitPrice * i.quantity)) }
                    : i,
            ),
        );
    }

    function removeFromCart(productId: string) {
        setCart((prev) => prev.filter((i) => i.productId !== productId));
    }

    async function handleCepLookup() {
        const raw = newCustomer.cep.replace(/\D/g, '');
        if (raw.length !== 8) {
            toast.error('CEP inválido. Digite os 8 números.');
            return;
        }
        setCepLoading(true);
        try {
            const result = await lookupCep(raw);
            if (!result) {
                toast.error('CEP não encontrado.');
                return;
            }
            setNewCustomer((p) => ({
                ...p,
                cep: result.cep ?? p.cep,
                address: result.address ?? p.address,
                bairro: result.bairro ?? p.bairro,
                cidade: result.cidade ?? p.cidade,
                estado: result.estado ?? p.estado,
            }));
            toast.success('Endereço preenchido a partir do CEP.');
        } finally {
            setCepLoading(false);
        }
    }

    async function handleCaptureLocation() {
        setGpsLoading(true);
        try {
            const coords = await getCurrentPosition();
            setNewCustomer((p) => ({
                ...p,
                latitude: coords.latitude,
                longitude: coords.longitude,
            }));
            // Tenta enriquecer endereço a partir das coords
            const addr = await reverseGeocode(coords.latitude, coords.longitude);
            if (addr) {
                setNewCustomer((p) => ({
                    ...p,
                    address: addr.address ?? p.address,
                    bairro: addr.bairro ?? p.bairro,
                    cidade: addr.cidade ?? p.cidade,
                    estado: addr.estado ?? p.estado,
                    cep: addr.cep ?? p.cep,
                }));
                toast.success('Localização capturada e endereço preenchido.');
            } else {
                toast.success(`Localização capturada (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}).`);
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao obter localização.');
        } finally {
            setGpsLoading(false);
        }
    }

    async function handleCreateCustomer() {
        const displayName = newCustomer.nomeFantasia.trim() || newCustomer.razaoSocial.trim();
        if (!displayName) {
            toast.error('Informe a razão social ou o nome fantasia.');
            return;
        }
        try {
            const res = await createCustomer({
                variables: {
                    input: {
                        name: displayName,
                        nomeFantasia: newCustomer.nomeFantasia.trim() || undefined,
                        razaoSocial: newCustomer.razaoSocial.trim() || undefined,
                        document: newCustomer.document.trim() || undefined,
                        phone: newCustomer.phone.trim() || undefined,
                        cep: newCustomer.cep.trim() || undefined,
                        address: newCustomer.address.trim() || undefined,
                        bairro: newCustomer.bairro.trim() || undefined,
                        cidade: newCustomer.cidade.trim() || undefined,
                        estado: newCustomer.estado.trim() || undefined,
                        latitude: newCustomer.latitude ?? undefined,
                        longitude: newCustomer.longitude ?? undefined,
                    },
                },
            });
            const created = res.data?.createCustomer;
            if (created) {
                toast.success('Cliente criado');
                await refetchCustomers();
                setCustomerId(created.id);
                setShowNewCustomer(false);
                setNewCustomer({
                    razaoSocial: '',
                    nomeFantasia: '',
                    document: '',
                    phone: '',
                    cep: '',
                    address: '',
                    bairro: '',
                    cidade: '',
                    estado: '',
                    latitude: null,
                    longitude: null,
                });
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar cliente');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error('Adicione pelo menos um item à venda');
            return;
        }
        if (isCustomOrder) {
            const effectiveCustomerName = customerId
                ? selectedCustomer?.name
                : customerName.trim();
            if (!effectiveCustomerName) {
                toast.error('Encomendas exigem identificação do cliente.');
                return;
            }
            if (!expectedDeliveryDate) {
                toast.error('Defina a data de entrega prevista da encomenda.');
                return;
            }
            if (depositValue > total) {
                toast.error('O sinal não pode ser maior que o total.');
                return;
            }
        }
        try {
            const res = await createOrder({
                variables: {
                    input: {
                        customerId: customerId || undefined,
                        customerName: customerId ? undefined : customerName || undefined,
                        customerDocument: customerDocument.trim() || undefined,
                        customerPhone: customerPhone.trim() || undefined,
                        sellerId: sellerId || undefined,
                        commissionPercent:
                            sellerId && commissionPercent !== ''
                                ? Number(commissionPercent)
                                : undefined,
                        status: 'CONFIRMED',
                        paymentMethod,
                        orderType,
                        expectedDeliveryDate: isCustomOrder
                            ? new Date(`${expectedDeliveryDate}T12:00:00`).toISOString()
                            : undefined,
                        depositAmount: isCustomOrder ? depositValue : 0,
                        discount: discountValue,
                        notes: notes || undefined,
                        items: cart.map((i) => ({
                            productId: i.productId,
                            quantity: isStocklessKind(i.kind) ? 1 : i.quantity,
                            unitPrice: i.unitPrice,
                            discount: i.discount,
                            description: i.description.trim() || undefined,
                        })),
                    },
                },
            });
            const order = res.data?.createOrder;
            toast.success(`Venda #${order?.number ?? ''} registrada com sucesso!`, {
                description: `Total: ${formatBRL(order?.total ?? total)}`,
            });
            if (order?.id) {
                pushNotification({
                    type: 'order',
                    title: `Pedido #${order.number} criado`,
                    message: `Cliente: ${selectedCustomer?.name ?? customerName ?? 'Avulso'} · Total: ${formatBRL(Number(order.total ?? total))}`,
                    href: `/pedidos/${order.id}/imprimir`,
                });
                setPrintPrompt({
                    id: order.id,
                    number: Number(order.number ?? 0),
                    total: Number(order.total ?? total),
                });
            } else {
                navigate('/pedidos');
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar venda');
        }
    }

    function handlePrintNow() {
        if (!printPrompt) return;
        // Abre a impressão numa nova aba e volta pra lista de pedidos
        window.open(`/pedidos/${printPrompt.id}/imprimir`, '_blank');
        setPrintPrompt(null);
        navigate('/pedidos');
    }

    function handleSkipPrint() {
        setPrintPrompt(null);
        navigate('/pedidos');
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                            Nova venda
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Selecione produtos do catálogo, defina cliente e forma de pagamento
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatBRL(total)}
                    </span>
                </div>
            </div>

            {/* TIPO DO PEDIDO — pronta-entrega vs encomenda */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                            Tipo do pedido
                        </h2>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Define se baixa estoque agora ou se será preparado/buscado depois.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setOrderType('STANDARD')}
                        aria-pressed={orderType === 'STANDARD'}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                            orderType === 'STANDARD'
                                ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300 dark:border-emerald-500/60 dark:bg-emerald-500/[0.08] dark:ring-emerald-500/30'
                                : 'border-slate-200 hover:border-slate-300 dark:border-white/[0.10] dark:hover:border-white/15'
                        }`}
                    >
                        <span className={`shrink-0 w-9 h-9 rounded-md grid place-items-center ${
                            orderType === 'STANDARD'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400'
                        }`}>
                            <Truck className="w-4.5 h-4.5" />
                        </span>
                        <div>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                Pronta-entrega
                            </p>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                Cliente leva agora · estoque é baixado imediatamente.
                            </p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setOrderType('CUSTOM_ORDER')}
                        aria-pressed={orderType === 'CUSTOM_ORDER'}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                            orderType === 'CUSTOM_ORDER'
                                ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300 dark:border-indigo-500/60 dark:bg-indigo-500/[0.08] dark:ring-indigo-500/30'
                                : 'border-slate-200 hover:border-slate-300 dark:border-white/[0.10] dark:hover:border-white/15'
                        }`}
                    >
                        <span className={`shrink-0 w-9 h-9 rounded-md grid place-items-center ${
                            orderType === 'CUSTOM_ORDER'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400'
                        }`}>
                            <CalendarClock className="w-4.5 h-4.5" />
                        </span>
                        <div>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                Encomenda
                            </p>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                Item será preparado/buscado · entrega prevista e sinal opcional.
                            </p>
                        </div>
                    </button>
                </div>

                {isCustomOrder && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div>
                            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Entrega prevista *
                            </label>
                            <input
                                type="date"
                                value={expectedDeliveryDate}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                            />
                        </div>
                        <div>
                            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Sinal / entrada (R$)
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                                placeholder="0,00"
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                            />
                        </div>
                    </div>
                )}
            </section>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA ESQUERDA — PRODUTOS */}
                <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="w-4 h-4 text-violet-500" /> Catálogo
                            </h2>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Clique no item para adicionar ao carrinho
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLaborForm((v) => !v)}
                            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-md transition-colors
                                       border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100
                                       dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                            title="Adicionar mão de obra ao pedido"
                        >
                            <Wrench className="w-3.5 h-3.5" />
                            {showLaborForm ? 'Fechar' : 'Adicionar mão de obra'}
                        </button>
                    </header>

                    {/* Formulário inline de Mão de obra / Serviço */}
                    {showLaborForm && (
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-amber-50/40 dark:bg-amber-500/[0.04]">
                            <div className="flex items-center gap-2 mb-3">
                                <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <h3 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">
                                    {laborForm.kind === 'LABOR' ? 'Nova mão de obra' : 'Novo serviço'}
                                </h3>
                                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                    será cadastrada no catálogo e adicionada ao pedido
                                </span>
                            </div>

                            <div className="inline-flex items-center p-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/15 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setLaborForm((p) => ({ ...p, kind: 'LABOR', unit: p.unit === 'SERV' ? 'HORA' : p.unit }))}
                                    className={`px-2.5 py-1 text-[11.5px] rounded ${laborForm.kind === 'LABOR' ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                    <Wrench className="w-3 h-3 inline mr-1" /> Mão de obra
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLaborForm((p) => ({ ...p, kind: 'SERVICE', unit: p.unit === 'HORA' ? 'SERV' : p.unit }))}
                                    className={`px-2.5 py-1 text-[11.5px] rounded ${laborForm.kind === 'SERVICE' ? 'bg-indigo-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                    <Sparkles className="w-3 h-3 inline mr-1" /> Serviço
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px] gap-2">
                                <div>
                                    <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                                        Descrição *
                                    </label>
                                    <input
                                        type="text"
                                        value={laborForm.name}
                                        onChange={(e) => setLaborForm((p) => ({ ...p, name: e.target.value }))}
                                        placeholder={laborForm.kind === 'LABOR' ? 'Ex.: Hora técnica eletricista' : 'Ex.: Limpeza pós-obra'}
                                        maxLength={160}
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                                        Unidade
                                    </label>
                                    <input
                                        type="text"
                                        value={laborForm.unit}
                                        onChange={(e) => setLaborForm((p) => ({ ...p, unit: e.target.value.toUpperCase().slice(0, 10) }))}
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                                        Valor (R$) *
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={laborForm.salePrice}
                                        onChange={(e) => setLaborForm((p) => ({ ...p, salePrice: e.target.value.replace(/[^\d.,]/g, '') }))}
                                        placeholder="0,00"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="mt-2">
                                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                                    Detalhe do que será executado (constará na nota)
                                </label>
                                <textarea
                                    value={laborForm.description}
                                    onChange={(e) => setLaborForm((p) => ({ ...p, description: e.target.value }))}
                                    rows={2}
                                    placeholder={
                                        laborForm.kind === 'LABOR'
                                            ? 'Ex.: Instalação de 4 tomadas no apartamento 302, troca do disjuntor e revisão do quadro de força.'
                                            : 'Ex.: Limpeza completa pós-obra de 3 cômodos, incluindo vidros e remoção de resíduos.'
                                    }
                                    maxLength={500}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[12.5px] resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => { resetLaborForm(); setShowLaborForm(false); }}
                                    disabled={creatingProduct}
                                    className="h-8 px-3 text-[12px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddLabor}
                                    disabled={creatingProduct}
                                    className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold text-white rounded-md disabled:opacity-50 ${
                                        laborForm.kind === 'LABOR'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                    {creatingProduct ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adicionando…</>
                                    ) : (
                                        <><Plus className="w-3.5 h-3.5" /> Adicionar ao pedido</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar produto, serviço ou mão de obra…"
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            />
                        </div>
                    </div>

                    <div className="max-h-[520px] overflow-y-auto">
                        {loadingProducts && filteredProducts.length === 0 ? (
                            <div className="px-5 py-12 text-center text-[13px] text-slate-500">Carregando produtos...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <Package className="w-10 h-10 mx-auto text-slate-300" />
                                <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                                    {search ? `Nenhum produto encontrado para "${search}".` : 'Nenhum produto disponível.'}
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                                {filteredProducts.map((p) => {
                                    const kind = p.kind ?? 'PRODUCT';
                                    const stockless = isStocklessKind(kind);
                                    const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                                    const inCart = cart.find((i) => i.productId === p.id);
                                    const isLow = !stockless && p.quantity <= p.minStock;
                                    const KindIcon = KIND_ICON[kind];
                                    return (
                                        <li key={p.id}>
                                            <button
                                                type="button"
                                                onClick={() => addToCart(p)}
                                                className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-violet-50 dark:hover:bg-violet-500/[0.04] transition-colors group"
                                            >
                                                <ProductImage
                                                    src={cover}
                                                    alt={p.nameProduct}
                                                    className="w-12 h-12 rounded-md object-cover shrink-0"
                                                    fallbackClassName="w-12 h-12 rounded-md shrink-0"
                                                    iconSize={20}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-[13.5px] font-medium text-slate-900 dark:text-white truncate">
                                                            {p.nameProduct}
                                                        </p>
                                                        {kind !== 'PRODUCT' && (
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ring-inset ${
                                                                kind === 'SERVICE'
                                                                    ? 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30'
                                                                    : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30'
                                                            }`}>
                                                                <KindIcon className="w-2.5 h-2.5" />
                                                                {KIND_LABEL[kind]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                                                        {p.sku && <span className="font-mono">{p.sku}</span>}
                                                        {p.sku && <span>·</span>}
                                                        {stockless ? (
                                                            <span>por {p.unit}</span>
                                                        ) : (
                                                            <>
                                                                <span className={isLow ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                                                                    {p.quantity} {p.unit} disponível
                                                                </span>
                                                                {isLow && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                        {formatBRL(p.salePrice)}
                                                    </p>
                                                    {inCart ? (
                                                        <p className="text-[10.5px] text-violet-600 dark:text-violet-400 mt-0.5">
                                                            {inCart.quantity} no carrinho
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10.5px] text-slate-400 group-hover:text-violet-500 mt-0.5">
                                                            <Plus className="w-3 h-3 inline" /> adicionar
                                                        </p>
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

                {/* COLUNA DIREITA — CHECKOUT */}
                <aside className="space-y-4">
                    {/* Cliente */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
                        <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-sky-500" /> Cliente
                        </h2>

                        <div className="flex gap-2">
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="flex-1 p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                            >
                                <option value="">— Cliente avulso —</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}{c.document ? ` (${c.document})` : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowNewCustomer((v) => !v)}
                                className="p-2 border border-slate-200 dark:border-white/15 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                                title="Novo cliente"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        </div>

                        {!showNewCustomer && (
                            <div className="mt-2 space-y-2">
                                {!customerId && (
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Nome do cliente (avulso)"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={customerDocument}
                                        onChange={(e) => setCustomerDocument(e.target.value)}
                                        placeholder="CPF / CNPJ"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                    />
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Telefone"
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                    />
                                </div>
                                {customerId && (
                                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                        Os campos foram preenchidos a partir do cadastro. Você pode editá-los só para este pedido.
                                    </p>
                                )}
                            </div>
                        )}

                        {showNewCustomer && (
                            <div className="mt-3 p-3 border border-dashed border-slate-300 dark:border-white/15 rounded space-y-2">
                                <FieldLabel>RAZÃO SOCIAL *</FieldLabel>
                                <input
                                    placeholder="Empresa Ltda"
                                    value={newCustomer.razaoSocial}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, razaoSocial: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                />
                                <FieldLabel>FANTASIA</FieldLabel>
                                <input
                                    placeholder="Como é conhecido"
                                    value={newCustomer.nomeFantasia}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, nomeFantasia: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <FieldLabel>FONE</FieldLabel>
                                        <input
                                            placeholder="(63) 99999-9999"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                            className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel>CNPJ/CPF</FieldLabel>
                                        <input
                                            placeholder="000.000.000-00"
                                            value={newCustomer.document}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })}
                                            className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                        />
                                    </div>
                                </div>
                                <FieldLabel>CEP</FieldLabel>
                                <div className="flex gap-1.5">
                                    <input
                                        placeholder="00000-000"
                                        value={newCustomer.cep}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, cep: e.target.value })}
                                        onBlur={() => newCustomer.cep.replace(/\D/g, '').length === 8 && handleCepLookup()}
                                        className="flex-1 p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCepLookup}
                                        disabled={cepLoading}
                                        title="Buscar endereço pelo CEP"
                                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-[12px] font-medium disabled:opacity-50"
                                    >
                                        {cepLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                                    </button>
                                </div>
                                <FieldLabel>ENDEREÇO</FieldLabel>
                                <input
                                    placeholder="Rua, número, complemento"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <FieldLabel>BAIRRO</FieldLabel>
                                        <input
                                            value={newCustomer.bairro}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, bairro: e.target.value })}
                                            className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <FieldLabel>CIDADE</FieldLabel>
                                        <input
                                            value={newCustomer.cidade}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, cidade: e.target.value })}
                                            className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <FieldLabel>UF</FieldLabel>
                                        <input
                                            maxLength={2}
                                            value={newCustomer.estado}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, estado: e.target.value.toUpperCase().slice(0, 2) })}
                                            className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] uppercase font-mono"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCaptureLocation}
                                    disabled={gpsLoading}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 mt-1 border border-dashed border-emerald-400 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded text-[12px] font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-50"
                                >
                                    {gpsLoading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Capturando…
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="w-3.5 h-3.5" /> Usar minha localização
                                        </>
                                    )}
                                </button>
                                {newCustomer.latitude !== null && newCustomer.longitude !== null && (
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 tabular-nums text-center">
                                        📍 {newCustomer.latitude.toFixed(5)}, {newCustomer.longitude.toFixed(5)} (registrado para entrega)
                                    </p>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCustomer(false)}
                                        className="flex-1 px-3 py-1.5 text-[12px] bg-slate-100 dark:bg-slate-800 rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateCustomer}
                                        disabled={creatingCustomer}
                                        className="flex-1 px-3 py-1.5 text-[12px] bg-sky-600 text-white rounded disabled:opacity-50"
                                    >
                                        {creatingCustomer ? 'Salvando...' : 'Criar cliente'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedCustomer && (
                            <div className="mt-3 p-2.5 bg-sky-50 dark:bg-sky-500/10 rounded text-[11.5px] space-y-0.5">
                                {selectedCustomer.document && (
                                    <p className="text-sky-800 dark:text-sky-300">
                                        <span className="font-medium">Doc:</span> {selectedCustomer.document}
                                    </p>
                                )}
                                {selectedCustomer.email && (
                                    <p className="text-sky-800 dark:text-sky-300 truncate">
                                        <span className="font-medium">Email:</span> {selectedCustomer.email}
                                    </p>
                                )}
                                {selectedCustomer.phone && (
                                    <p className="text-sky-800 dark:text-sky-300">
                                        <span className="font-medium">Tel:</span> {selectedCustomer.phone}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Carrinho */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-violet-500" /> Carrinho
                            </h2>
                            {cart.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCart([])}
                                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
                                >
                                    Limpar
                                </button>
                            )}
                        </header>

                        {cart.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                                <p className="mt-3 text-[12.5px] text-slate-500 dark:text-slate-400">
                                    Selecione produtos no catálogo
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[420px] overflow-y-auto">
                                {cart.map((item) => {
                                    const stockless = isStocklessKind(item.kind);
                                    const effectiveQty = stockless ? 1 : item.quantity;
                                    const lineTotal = item.unitPrice * effectiveQty - item.discount;
                                    const KindIcon = KIND_ICON[item.kind];
                                    return (
                                        <li key={item.productId} className="px-4 py-3">
                                            <div className="flex items-start gap-2">
                                                <ProductImage
                                                    src={item.coverUrl}
                                                    alt={item.nameProduct}
                                                    className="w-10 h-10 rounded object-cover shrink-0"
                                                    fallbackClassName="w-10 h-10 rounded shrink-0"
                                                    iconSize={16}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">
                                                            {item.nameProduct}
                                                        </p>
                                                        {item.kind !== 'PRODUCT' && (
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium ring-1 ring-inset ${
                                                                item.kind === 'SERVICE'
                                                                    ? 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30'
                                                                    : 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30'
                                                            }`}>
                                                                <KindIcon className="w-2.5 h-2.5" />
                                                                {KIND_LABEL[item.kind]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                                        {formatBRL(item.unitPrice)} / {item.unit}
                                                        {stockless && ' · qtd. fixa = 1'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.productId)}
                                                    className="p-1 text-slate-400 hover:text-rose-500"
                                                    title="Remover"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className={`mt-2 grid gap-1.5 ${stockless ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                {!stockless && (
                                                    <div className="flex items-center border border-slate-200 dark:border-white/15 rounded">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                                                            className="px-1.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={isCustomOrder ? undefined : item.stockAvailable}
                                                            value={item.quantity}
                                                            onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)}
                                                            className="w-full text-center text-[12px] py-1 bg-transparent dark:text-white outline-none tabular-nums"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                                                            className="px-1.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                                                    placeholder="Preço"
                                                    className="px-2 py-1 text-[11.5px] tabular-nums border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.discount}
                                                    onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                                                    placeholder="Desc."
                                                    className="px-2 py-1 text-[11.5px] tabular-nums border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                                />
                                            </div>

                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateDescription(item.productId, e.target.value)}
                                                placeholder={
                                                    item.kind === 'LABOR'
                                                        ? 'Detalhe do serviço (ex.: instalação no apto. 302)'
                                                        : item.kind === 'SERVICE'
                                                            ? 'Especificação do serviço'
                                                            : 'Observação do item (cor, modelo, etc.)'
                                                }
                                                maxLength={500}
                                                className="w-full mt-1.5 px-2 py-1 text-[11.5px] border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded placeholder:text-slate-400"
                                            />

                                            <div className="mt-1 flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {effectiveQty} × {formatBRL(item.unitPrice)}
                                                    {item.discount > 0 && ` − ${formatBRL(item.discount)}`}
                                                </span>
                                                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                                                    {formatBRL(lineTotal)}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* Vendedor */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
                        <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-500" /> Vendedor
                        </h2>
                        <select
                            value={sellerId}
                            onChange={(e) => {
                                setSellerId(e.target.value);
                                setCommissionPercent('');
                            }}
                            className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                        >
                            <option value="">— Sem vendedor vinculado —</option>
                            {sellers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} {Number(s.commissionPercent) > 0 ? `(${Number(s.commissionPercent).toFixed(1)}% padrão)` : ''}
                                </option>
                            ))}
                        </select>
                        {sellers.length === 0 && (
                            <p className="mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">
                                Nenhum vendedor cadastrado. <a href="/vendedores" className="text-violet-600 dark:text-violet-400 underline">Cadastre um agora</a>.
                            </p>
                        )}
                        {sellerId && (
                            <div className="mt-3">
                                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Comissão (%) — opcional, sobrescreve o padrão
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={commissionPercent}
                                    onChange={(e) => setCommissionPercent(e.target.value)}
                                    placeholder={String(selectedSeller?.commissionPercent ?? 0)}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                />
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                    Comissão estimada: {formatBRL((total * effectiveCommissionPercent) / 100)} ({effectiveCommissionPercent.toFixed(2)}% de {formatBRL(total)})
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Pagamento */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
                        <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white mb-3">
                            Pagamento
                        </h2>
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                            {PAYMENT_METHODS.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setPaymentMethod(m.value)}
                                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded border text-[11.5px] font-medium transition-colors ${
                                        paymentMethod === m.value
                                            ? 'bg-violet-600 text-white border-violet-600'
                                            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-violet-300'
                                    }`}
                                >
                                    {m.icon}
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Desconto adicional (R$)
                            </label>
                            <input
                                type="text"
                                value={orderDiscount}
                                onChange={(e) => setOrderDiscount(e.target.value)}
                                className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px] tabular-nums"
                                placeholder="0,00"
                            />
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Observações..."
                            className="w-full mt-3 p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[12.5px]"
                        />
                    </section>

                    {/* Totais */}
                    <section className="bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-4 space-y-2">
                        {isCustomOrder && (
                            <div className="-mx-4 -mt-4 mb-2 px-4 py-2 bg-indigo-500/15 border-b border-indigo-500/20 text-[10.5px] uppercase tracking-wider font-semibold text-indigo-200 inline-flex items-center gap-1.5">
                                <CalendarClock className="w-3 h-3" /> Encomenda
                                {expectedDeliveryDate && (
                                    <span className="text-indigo-100/80 font-normal normal-case ml-2">
                                        · entrega {new Date(expectedDeliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="flex items-center justify-between text-[12.5px] text-slate-300">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatBRL(subtotal)}</span>
                        </div>
                        {discountValue > 0 && (
                            <div className="flex items-center justify-between text-[12.5px] text-rose-400">
                                <span>Desconto</span>
                                <span className="tabular-nums">− {formatBRL(discountValue)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-[12.5px] text-slate-400">Total</span>
                            <span className="text-[20px] font-bold tabular-nums">{formatBRL(total)}</span>
                        </div>

                        {isCustomOrder && (
                            <>
                                <div className="flex items-center justify-between text-[12.5px] text-emerald-300">
                                    <span>Sinal / entrada</span>
                                    <span className="tabular-nums">
                                        {depositValue > 0 ? `− ${formatBRL(depositValue)}` : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <span className="text-[12.5px] text-slate-400">Saldo a pagar</span>
                                    <span className="text-[16px] font-bold tabular-nums text-amber-300">
                                        {formatBRL(remainingBalance)}
                                    </span>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={cart.length === 0 || creatingOrder}
                            className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {creatingOrder
                                ? 'Processando...'
                                : isCustomOrder
                                    ? 'Registrar encomenda'
                                    : 'Finalizar venda'}
                        </button>

                        {cart.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCart([]);
                                    setOrderDiscount('0');
                                    setNotes('');
                                }}
                                className="w-full text-[11.5px] text-slate-400 hover:text-white py-1"
                            >
                                <Trash2 className="w-3 h-3 inline mr-1" />
                                Descartar venda
                            </button>
                        )}
                    </section>
                </aside>
            </form>

            {/* Modal: imprimir agora? */}
            {printPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg w-full max-w-md shadow-xl">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-start gap-3">
                            <span className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 grid place-items-center shrink-0">
                                <CheckCircle className="w-5 h-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                                    Pedido #{printPrompt.number} criado
                                </h3>
                                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                    Total: {formatBRL(printPrompt.total)}
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-4 text-[13.5px] text-slate-700 dark:text-slate-200">
                            Você deseja <strong>imprimir direto</strong> agora?
                        </div>
                        <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-lg">
                            <button
                                type="button"
                                onClick={handleSkipPrint}
                                className="flex-1 h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.04] rounded-md"
                            >
                                Não, depois
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintNow}
                                autoFocus
                                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Sim, imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 mt-1">
            {children}
        </label>
    );
}
