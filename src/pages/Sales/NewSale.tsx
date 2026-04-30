import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    CreditCard,
    Minus,
    Package,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    User,
    UserPlus,
    X,
} from 'lucide-react';
import { LIST_PRODUCTS_WITH_IMAGES } from '../../graphql/mutations/product-with-images';
import { GET_CUSTOMERS_LIST } from '../../graphql/queries/accounts';
import { CREATE_CUSTOMER_BASIC } from '../../graphql/mutations/accounts';
import { CREATE_ORDER } from '../../graphql/queries/orders';
import { GET_SELLERS } from '../../graphql/queries/sellers';
import { ProductImage } from '../../components/ProductImage';

type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'TRANSFER' | 'OTHER';

interface ProductOption {
    id: string;
    nameProduct: string;
    sku: string | null;
    quantity: number;
    minStock: number;
    unit: string;
    salePrice: number;
    images: { id: string; url: string; isPrimary: boolean; order: number }[];
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
    nameProduct: string;
    sku: string | null;
    unit: string;
    unitPrice: number;
    quantity: number;
    discount: number;
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
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', document: '', email: '', phone: '' });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [orderDiscount, setOrderDiscount] = useState<string>('0');
    const [notes, setNotes] = useState('');
    const [sellerId, setSellerId] = useState<string>('');
    const [commissionPercent, setCommissionPercent] = useState<string>('');

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

    const products = productsData?.products ?? [];
    const customers = customersData?.customers ?? [];
    const sellers = sellersData?.sellers ?? [];
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const selectedSeller = sellers.find((s) => s.id === sellerId);
    const effectiveCommissionPercent =
        commissionPercent !== '' ? Number(commissionPercent) : selectedSeller?.commissionPercent ?? 0;

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products.filter((p) => {
            if (p.quantity <= 0) return false; // só mostra com estoque
            if (!term) return true;
            return (
                p.nameProduct.toLowerCase().includes(term) ||
                (p.sku ?? '').toLowerCase().includes(term)
            );
        });
    }, [products, search]);

    const subtotal = useMemo(
        () => cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity - i.discount), 0),
        [cart],
    );
    const discountValue = Math.max(0, parseFloat(orderDiscount.replace(',', '.')) || 0);
    const total = Math.max(0, subtotal - discountValue);
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

    function addToCart(product: ProductOption) {
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                if (existing.quantity + 1 > product.quantity) {
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
                    nameProduct: product.nameProduct,
                    sku: product.sku,
                    unit: product.unit,
                    unitPrice: product.salePrice,
                    quantity: 1,
                    discount: 0,
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
                const next = Math.max(1, Math.min(qty, i.stockAvailable));
                return { ...i, quantity: next };
            }),
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

    async function handleCreateCustomer() {
        if (!newCustomer.name) {
            toast.error('Informe o nome do cliente');
            return;
        }
        try {
            const res = await createCustomer({
                variables: {
                    input: {
                        name: newCustomer.name,
                        document: newCustomer.document || undefined,
                        email: newCustomer.email || undefined,
                        phone: newCustomer.phone || undefined,
                    },
                },
            });
            const created = res.data?.createCustomer;
            if (created) {
                toast.success('Cliente criado');
                await refetchCustomers();
                setCustomerId(created.id);
                setShowNewCustomer(false);
                setNewCustomer({ name: '', document: '', email: '', phone: '' });
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar cliente');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error('Adicione pelo menos um produto à venda');
            return;
        }
        try {
            const res = await createOrder({
                variables: {
                    input: {
                        customerId: customerId || undefined,
                        customerName: customerId ? undefined : customerName || undefined,
                        sellerId: sellerId || undefined,
                        commissionPercent:
                            sellerId && commissionPercent !== ''
                                ? Number(commissionPercent)
                                : undefined,
                        status: 'CONFIRMED',
                        paymentMethod,
                        discount: discountValue,
                        notes: notes || undefined,
                        items: cart.map((i) => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            discount: i.discount,
                        })),
                    },
                },
            });
            const order = res.data?.createOrder;
            toast.success(`Venda #${order?.number ?? ''} registrada com sucesso!`, {
                description: `Total: ${formatBRL(order?.total ?? total)}`,
            });
            navigate('/vendas');
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar venda');
        }
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA ESQUERDA — PRODUTOS */}
                <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Package className="w-4 h-4 text-violet-500" /> Catálogo
                        </h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Clique no produto para adicionar ao carrinho
                        </p>
                    </header>

                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome ou SKU…"
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
                                    const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                                    const inCart = cart.find((i) => i.productId === p.id);
                                    const isLow = p.quantity <= p.minStock;
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
                                                    <p className="text-[13.5px] font-medium text-slate-900 dark:text-white truncate">
                                                        {p.nameProduct}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                                                        {p.sku && <span className="font-mono">{p.sku}</span>}
                                                        {p.sku && <span>·</span>}
                                                        <span className={isLow ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                                                            {p.quantity} {p.unit} disponível
                                                        </span>
                                                        {isLow && <AlertTriangle className="w-3 h-3 text-amber-500" />}
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

                        {!customerId && !showNewCustomer && (
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Ou digite um nome temporário..."
                                className="w-full mt-2 p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                            />
                        )}

                        {showNewCustomer && (
                            <div className="mt-3 p-3 border border-dashed border-slate-300 dark:border-white/15 rounded space-y-2">
                                <input
                                    placeholder="Nome *"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        placeholder="CPF/CNPJ"
                                        value={newCustomer.document}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })}
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                    <input
                                        placeholder="Telefone"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                    />
                                </div>
                                <input
                                    placeholder="E-mail"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-[13px]"
                                />
                                <div className="flex gap-2">
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
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[360px] overflow-y-auto">
                                {cart.map((item) => {
                                    const lineTotal = item.unitPrice * item.quantity - item.discount;
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
                                                    <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">
                                                        {item.nameProduct}
                                                    </p>
                                                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                                        {formatBRL(item.unitPrice)} / {item.unit}
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

                                            <div className="mt-2 grid grid-cols-3 gap-1.5">
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
                                                        max={item.stockAvailable}
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

                                            <div className="mt-1 flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    {item.quantity} × {formatBRL(item.unitPrice)}
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

                        <button
                            type="submit"
                            disabled={cart.length === 0 || creatingOrder}
                            className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {creatingOrder ? 'Processando...' : 'Finalizar venda'}
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
        </div>
    );
}
