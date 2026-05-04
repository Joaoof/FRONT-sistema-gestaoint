import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Scissors } from 'lucide-react';
import { GET_ORDER } from '../../graphql/queries/orders';
import { useCompany } from '../../contexts/CompanyContext';

type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'TRANSFER' | 'OTHER';
type OrderType = 'STANDARD' | 'CUSTOM_ORDER';
type ProductKind = 'PRODUCT' | 'SERVICE' | 'LABOR';

interface OrderItem {
    id: string;
    productId?: string | null;
    productName: string;
    itemKind?: ProductKind | null;
    itemUnit?: string | null;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    discount?: number | null;
    total: number;
}

interface OrderDetail {
    id: string;
    number: number;
    customerId?: string | null;
    customerName?: string | null;
    customerDocument?: string | null;
    customerPhone?: string | null;
    sellerId?: string | null;
    sellerName?: string | null;
    commissionPercent?: number | null;
    commissionAmount?: number | null;
    status: OrderStatus;
    paymentMethod?: PaymentMethod | null;
    orderType?: OrderType | null;
    expectedDeliveryDate?: string | null;
    depositAmount?: number | null;
    subtotal?: number | null;
    discount?: number | null;
    total: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: string;
        name: string;
        document?: string | null;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
        bairro?: string | null;
        cep?: string | null;
    } | null;
    items: OrderItem[];
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
    STANDARD: 'Pronta-entrega',
    CUSTOM_ORDER: 'Encomenda',
};

const ITEM_KIND_LABEL: Record<ProductKind, string> = {
    PRODUCT: 'Produto',
    SERVICE: 'Serviço',
    LABOR: 'Mão de obra',
};

const ITEM_KIND_SHORT: Record<ProductKind, string> = {
    PRODUCT: 'PROD',
    SERVICE: 'SERV',
    LABOR: 'M.OB',
};

interface CompanyLite {
    name?: string | null;
    nomeFantasia?: string | null;
    razaoSocial?: string | null;
    inscricaoEstadual?: string | null;
    cnpj?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    logoUrl?: string | null;
}

function buildCompanyAddressLine(c: CompanyLite | null | undefined): string | null {
    if (!c) return null;
    const parts: string[] = [];
    if (c.address) parts.push(c.address);
    if (c.bairro) parts.push(c.bairro);
    if (c.cidade) parts.push(`${c.cidade}${c.estado ? `/${c.estado}` : ''}`);
    return parts.length > 0 ? parts.join(' - ') : null;
}

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const STATUS_LABEL: Record<OrderStatus, string> = {
    DRAFT: 'Rascunho',
    CONFIRMED: 'Confirmado',
    PAID: 'Pago',
    CANCELED: 'Cancelado',
    REFUNDED: 'Reembolsado',
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
    CASH: 'Dinheiro',
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão crédito',
    DEBIT_CARD: 'Cartão débito',
    BOLETO: 'Boleto',
    TRANSFER: 'Transferência',
    OTHER: 'Outro',
};

interface ReceiptProps {
    order: OrderDetail;
    company: CompanyLite | null | undefined;
    via: 'empresa' | 'cliente';
}

function CompanyRow({
    label,
    value,
    bold,
    mono,
}: {
    label: string;
    value?: string | null;
    bold?: boolean;
    mono?: boolean;
}) {
    if (!value) return null;
    return (
        <div className="flex gap-1 min-w-0">
            <dt className="shrink-0 font-semibold">{label}:</dt>
            <dd
                className={`truncate min-w-0 ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono' : ''}`}
            >
                {value}
            </dd>
        </div>
    );
}

function Receipt({ order, company, via }: ReceiptProps) {
    const subtotal = Number(
        order.subtotal ??
            order.items.reduce((acc, it) => {
                const stockless = it.itemKind === 'SERVICE' || it.itemKind === 'LABOR';
                const q = stockless ? 1 : Number(it.quantity);
                return acc + Number(it.unitPrice) * q;
            }, 0),
    );
    const discount = Number(order.discount ?? 0);
    const total = Number(order.total ?? subtotal - discount);
    const deposit = Number(order.depositAmount ?? 0);
    const remaining = Math.max(0, total - deposit);
    // "Itens físicos" para mostrar quantidade no rodapé.
    const totalQtyPhysical = order.items
        .filter((it) => (it.itemKind ?? 'PRODUCT') === 'PRODUCT')
        .reduce((acc, it) => acc + Number(it.quantity), 0);
    const issuedAt = new Date(order.createdAt);
    const orderType = (order.orderType ?? 'STANDARD') as OrderType;
    const isCustomOrder = orderType === 'CUSTOM_ORDER';
    const expected = order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : null;
    // Mostra coluna Qt apenas se houver itens com quantidade relevante.
    const showQtyColumn = order.items.some(
        (it) => (it.itemKind ?? 'PRODUCT') === 'PRODUCT',
    );

    const viaLabel = via === 'empresa' ? 'VIA DA EMPRESA' : 'VIA DO CLIENTE';

    return (
        <section className="receipt p-4 text-[10.5px] leading-tight text-black">
            {/* Topo: identificação da via + número + tipo do pedido */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold tracking-[0.15em] uppercase">
                        {viaLabel}
                    </span>
                    {isCustomOrder && (
                        <span className="text-[8.5px] font-bold tracking-[0.15em] uppercase border border-black px-1 py-[1px]">
                            ENCOMENDA
                        </span>
                    )}
                </div>
                <span className="text-[14px] font-bold tabular-nums">
                    PEDIDO #{String(order.number).padStart(4, '0')}
                </span>
            </div>

            {/* Cabeçalho: só logo + dados da empresa, sem fundo colorido */}
            <header className="flex items-start justify-between gap-3 pb-2 border-b border-black">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                    {company?.logoUrl && (
                        <img
                            src={company.logoUrl}
                            alt=""
                            className="w-12 h-12 object-contain shrink-0"
                            style={{ filter: 'grayscale(100%)' }}
                        />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold uppercase leading-tight">
                            {company?.nomeFantasia ?? company?.name ?? 'Empresa'}
                        </p>
                        {buildCompanyAddressLine(company) && (
                            <p className="text-[9.5px] leading-tight uppercase">
                                {buildCompanyAddressLine(company)}
                            </p>
                        )}
                        <dl className="mt-0.5 grid grid-cols-2 gap-x-3 gap-y-0 text-[9.5px] leading-tight">
                            <CompanyRow label="CEP" value={company?.cep} mono />
                            <CompanyRow label="Fone" value={company?.phone} />
                            <CompanyRow label="Insc. Est" value={company?.inscricaoEstadual} mono />
                            <CompanyRow label="CNPJ" value={company?.cnpj} mono />
                            {company?.razaoSocial && company?.razaoSocial !== company?.nomeFantasia && (
                                <CompanyRow label="Razão" value={company.razaoSocial} />
                            )}
                        </dl>
                    </div>
                </div>
                <div className="text-right shrink-0 text-[9.5px] tabular-nums">
                    <p>
                        {issuedAt.toLocaleDateString('pt-BR')}{' '}
                        {issuedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5">
                        {STATUS_LABEL[order.status]}
                    </p>
                </div>
            </header>

            {/* Bloco do cliente */}
            <div className="mt-2 pb-2 border-b border-black/40">
                <p className="text-[8.5px] uppercase tracking-[0.15em] font-semibold mb-1">
                    Dados do cliente
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-0 text-[9.5px] leading-tight">
                    <CompanyRow
                        label="CLIENTE"
                        value={order.customer?.name ?? order.customerName ?? 'Consumidor'}
                        bold
                    />
                    <CompanyRow
                        label="CPF/CNPJ"
                        value={order.customer?.document ?? order.customerDocument}
                        mono
                    />
                    <CompanyRow
                        label="FONE"
                        value={order.customer?.phone ?? order.customerPhone}
                    />
                    <CompanyRow label="EMAIL" value={order.customer?.email} />
                    <CompanyRow label="ENDEREÇO" value={order.customer?.address} />
                    <CompanyRow label="BAIRRO" value={order.customer?.bairro} />
                    <CompanyRow label="CEP" value={order.customer?.cep} mono />
                </dl>
            </div>

            {/* Linha vendedor + pagamento + (encomenda) entrega */}
            <div className="grid grid-cols-2 gap-3 mt-2 text-[10px]">
                <div className="min-w-0">
                    <p className="text-[8.5px] uppercase tracking-wider">Vendedor</p>
                    <p className="font-semibold truncate">{order.sellerName ?? '—'}</p>
                    {order.sellerName && Number(order.commissionPercent ?? 0) > 0 && via === 'empresa' && (
                        <p className="tabular-nums">
                            Comissão: {Number(order.commissionPercent).toFixed(2)}% · {formatBRL(Number(order.commissionAmount ?? 0))}
                        </p>
                    )}
                    <p className="text-[8.5px] uppercase tracking-wider mt-1">Tipo do pedido</p>
                    <p className="font-semibold">{ORDER_TYPE_LABEL[orderType]}</p>
                </div>
                <div className="min-w-0 text-right">
                    <p className="text-[8.5px] uppercase tracking-wider">Pagamento</p>
                    <p className="font-semibold">
                        {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : '—'}
                    </p>
                    <p className="tabular-nums">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        {totalQtyPhysical > 0 && ` · ${totalQtyPhysical}un`}
                    </p>
                    {isCustomOrder && expected && (
                        <>
                            <p className="text-[8.5px] uppercase tracking-wider mt-1">
                                Entrega prevista
                            </p>
                            <p className="font-semibold tabular-nums">
                                {expected.toLocaleDateString('pt-BR')}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Itens */}
            <table className="w-full mt-2 text-[10px]">
                <thead>
                    <tr className="text-left border-y border-black">
                        <th className="py-1 pr-1 font-semibold w-6">#</th>
                        <th className="py-1 px-1 font-semibold w-12">Tipo</th>
                        <th className="py-1 px-1 font-semibold">Descrição</th>
                        {showQtyColumn && (
                            <th className="py-1 px-1 font-semibold text-right tabular-nums w-9">Qt</th>
                        )}
                        <th className="py-1 px-1 font-semibold text-right tabular-nums w-16">Unit.</th>
                        <th className="py-1 pl-1 font-semibold text-right tabular-nums w-20">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((it, idx) => {
                        const kind = (it.itemKind ?? 'PRODUCT') as ProductKind;
                        const showQty = kind === 'PRODUCT';
                        return (
                            <tr key={it.id} className="border-b border-black/20 align-top">
                                <td className="py-0.5 pr-1 tabular-nums">{idx + 1}</td>
                                <td className="py-0.5 px-1 text-[8.5px] font-bold uppercase tracking-wider">
                                    {ITEM_KIND_SHORT[kind]}
                                </td>
                                <td className="py-0.5 px-1">
                                    <div className="font-semibold truncate">{it.productName}</div>
                                    {it.description && (
                                        <div className="text-[9px] leading-tight">
                                            {it.description}
                                        </div>
                                    )}
                                    <div className="text-[8.5px] leading-tight uppercase tracking-wider">
                                        {ITEM_KIND_LABEL[kind]}
                                        {Number(it.discount ?? 0) > 0 && (
                                            <span> · desc. {formatBRL(Number(it.discount))}</span>
                                        )}
                                    </div>
                                </td>
                                {showQtyColumn && (
                                    <td className="py-0.5 px-1 text-right tabular-nums">
                                        {showQty
                                            ? `${Number(it.quantity).toLocaleString('pt-BR')} ${it.itemUnit ?? ''}`.trim()
                                            : '—'}
                                    </td>
                                )}
                                <td className="py-0.5 px-1 text-right tabular-nums">
                                    {formatBRL(Number(it.unitPrice))}
                                    {!showQty && (
                                        <span className="block text-[8.5px] text-black/60">
                                            / {it.itemUnit ?? 'un'}
                                        </span>
                                    )}
                                </td>
                                <td className="py-0.5 pl-1 text-right font-semibold tabular-nums">
                                    {formatBRL(Number(it.total))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Totais */}
            <div className="mt-2 flex justify-end">
                <div className="min-w-[160px] text-[10px]">
                    <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatBRL(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex items-center justify-between">
                            <span>Desconto</span>
                            <span className="tabular-nums">−{formatBRL(discount)}</span>
                        </div>
                    )}
                    <div className="border-t border-black mt-1 pt-1 flex items-center justify-between font-bold text-[12px]">
                        <span>TOTAL</span>
                        <span className="tabular-nums">{formatBRL(total)}</span>
                    </div>
                    {isCustomOrder && (
                        <>
                            <div className="flex items-center justify-between mt-1">
                                <span>Entrada/sinal</span>
                                <span className="tabular-nums">
                                    {deposit > 0 ? `−${formatBRL(deposit)}` : '—'}
                                </span>
                            </div>
                            <div className="border-t border-black mt-1 pt-1 flex items-center justify-between font-bold text-[12px]">
                                <span>SALDO A PAGAR</span>
                                <span className="tabular-nums">{formatBRL(remaining)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Observações */}
            {order.notes && (
                <div className="mt-2 pt-1 border-t border-black/30 text-[9.5px]">
                    <span className="text-[8.5px] uppercase tracking-wider font-semibold">Obs:</span>{' '}
                    {order.notes}
                </div>
            )}

            {/* AVISO — compacto, em uma única linha quando possível */}
            <div className="mt-3 border border-black px-2 py-1 text-center">
                <p className="text-[9.5px] font-bold uppercase tracking-wide leading-tight">
                    Conferir mercadoria no ato da entrega · não aceitamos reclamações posteriores.
                </p>
            </div>

            {/* Assinatura — altura real para o cliente escrever ACIMA da linha */}
            <div className="mt-4 grid grid-cols-2 gap-6 text-[9.5px]">
                <div className="text-center">
                    {/* área para o traço da assinatura (cliente escreve aqui) */}
                    <div className="h-12" aria-hidden="true" />
                    <div className="border-t border-black pt-0.5">
                        Assinatura do cliente
                    </div>
                </div>
                <div className="text-center">
                    <div className="h-12" aria-hidden="true" />
                    <div className="border-t border-black pt-0.5">
                        {company?.nomeFantasia ?? company?.name ?? 'Empresa'}
                    </div>
                </div>
            </div>

            {/* Rodapé minimalista */}
            <p className="mt-1.5 text-center text-[8.5px]">
                {viaLabel} · #{String(order.number).padStart(4, '0')} ·{' '}
                <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span> · não substitui documento fiscal
            </p>
        </section>
    );
}

export function PrintableOrder() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { company } = useCompany();

    const { data, loading, error } = useQuery<{ order: OrderDetail }>(GET_ORDER, {
        variables: { id },
        fetchPolicy: 'cache-and-network',
        skip: !id,
    });

    const order = data?.order;

    useEffect(() => {
        document.title = order ? `Pedido #${order.number} (2 vias)` : 'Pedido';
    }, [order]);

    if (loading && !order) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-100 dark:bg-slate-950">
                <p className="text-slate-500">Carregando pedido…</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-100 dark:bg-slate-950">
                <div className="text-center">
                    <p className="text-slate-700 dark:text-slate-300 mb-3">Pedido não encontrado.</p>
                    <button
                        onClick={() => navigate('/pedidos')}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        ← Voltar para a lista
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-950 print:bg-white">
            <style>{`
                @page { size: A4; margin: 10mm; }
                @media print {
                    body { background: #fff !important; }
                    .no-print { display: none !important; }
                    .print-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; border: 0 !important; }
                    .receipt { page-break-inside: avoid; }
                }
            `}</style>

            {/* Toolbar */}
            <div className="no-print sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shadow-sm">
                <div className="max-w-[210mm] mx-auto flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <div className="text-center">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">Pré-visualização</p>
                        <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                            Pedido #{order.number} · 2 vias
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir 2 vias
                    </button>
                </div>
            </div>

            {/* A4 com 2 vias */}
            <div className="py-6 print:py-0 px-3">
                <article
                    className="print-page mx-auto bg-white text-slate-900 shadow-xl print:shadow-none rounded-md print:rounded-none border border-slate-200 print:border-0"
                    style={{ maxWidth: '210mm', minHeight: '297mm' }}
                >
                    {/* Via 1: Empresa */}
                    <Receipt order={order} company={company} via="empresa" />

                    {/* Linha de corte */}
                    <div className="px-4 py-2 flex items-center gap-2 text-black">
                        <Scissors className="w-3 h-3 shrink-0 -scale-x-100" />
                        <div className="flex-1 border-t border-dashed border-black" />
                        <span className="text-[8.5px] uppercase tracking-wider">corte aqui</span>
                        <div className="flex-1 border-t border-dashed border-black" />
                    </div>

                    {/* Via 2: Cliente */}
                    <Receipt order={order} company={company} via="cliente" />
                </article>
            </div>
        </div>
    );
}
