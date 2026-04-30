import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { GET_ORDER } from '../../graphql/queries/orders';
import { useCompany } from '../../contexts/CompanyContext';

type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'TRANSFER' | 'OTHER';

interface OrderItem {
    id: string;
    productId?: string | null;
    productName: string;
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
    status: OrderStatus;
    paymentMethod?: PaymentMethod | null;
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
    } | null;
    items: OrderItem[];
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
    CREDIT_CARD: 'Cartão de crédito',
    DEBIT_CARD: 'Cartão de débito',
    BOLETO: 'Boleto bancário',
    TRANSFER: 'Transferência',
    OTHER: 'Outro',
};

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

    // Atalho Ctrl/Cmd+P chama print nativo (já é o default, mas garantimos foco).
    useEffect(() => {
        document.title = order ? `Pedido #${order.number}` : 'Pedido';
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

    const subtotal = Number(
        order.subtotal ??
            order.items.reduce((acc, it) => acc + Number(it.unitPrice) * Number(it.quantity), 0),
    );
    const discount = Number(order.discount ?? 0);
    const total = Number(order.total ?? subtotal - discount);
    const totalQty = order.items.reduce((acc, it) => acc + Number(it.quantity), 0);

    const issuedAt = new Date(order.createdAt);

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-950 print:bg-white">
            {/* Print styles */}
            <style>{`
                @page { size: A4; margin: 14mm; }
                @media print {
                    body { background: #fff !important; }
                    .no-print { display: none !important; }
                    .print-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; border: 0 !important; }
                }
            `}</style>

            {/* Toolbar (escondida na impressão) */}
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
                            Pedido #{order.number}
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                </div>
            </div>

            {/* A4 */}
            <div className="py-8 print:py-0 px-3">
                <article
                    className="print-page mx-auto bg-white text-slate-900 shadow-xl print:shadow-none rounded-md print:rounded-none border border-slate-200 print:border-0"
                    style={{ maxWidth: '210mm', minHeight: '297mm' }}
                >
                    <div className="p-10 print:p-0">
                        {/* Cabeçalho */}
                        <header className="flex items-start justify-between gap-6 pb-5 border-b-2 border-slate-900">
                            <div className="flex items-center gap-4 min-w-0">
                                {company?.logoUrl ? (
                                    <img
                                        src={company.logoUrl}
                                        alt=""
                                        className="w-14 h-14 rounded-md object-cover ring-1 ring-slate-200"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center text-white font-bold text-lg">
                                        {(company?.name ?? 'EM').slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h1 className="text-[18px] font-bold tracking-tight truncate">
                                        {company?.name ?? 'Sua empresa'}
                                    </h1>
                                    {company?.cnpj && (
                                        <p className="text-[11.5px] text-slate-600">CNPJ {company.cnpj}</p>
                                    )}
                                    {company?.address && (
                                        <p className="text-[11.5px] text-slate-600 truncate">{company.address}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10.5px] uppercase tracking-[0.2em] text-slate-500">Pedido</p>
                                <p className="text-[28px] font-bold tabular-nums leading-none">
                                    #{String(order.number).padStart(4, '0')}
                                </p>
                                <p className="text-[11.5px] text-slate-600 mt-1 tabular-nums">
                                    Emitido em {issuedAt.toLocaleDateString('pt-BR')} às{' '}
                                    {issuedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <span
                                    className={`inline-block mt-2 px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                        order.status === 'PAID'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : order.status === 'CANCELED' || order.status === 'REFUNDED'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-sky-100 text-sky-800'
                                    }`}
                                >
                                    {STATUS_LABEL[order.status]}
                                </span>
                            </div>
                        </header>

                        {/* Cliente + Pagamento */}
                        <section className="grid grid-cols-2 gap-6 mt-6">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1.5">
                                    Cliente
                                </p>
                                <p className="text-[14px] font-semibold text-slate-900">
                                    {order.customer?.name ?? order.customerName ?? 'Consumidor'}
                                </p>
                                {order.customer?.document && (
                                    <p className="text-[11.5px] text-slate-600 mt-0.5">
                                        Documento: {order.customer.document}
                                    </p>
                                )}
                                {order.customer?.email && (
                                    <p className="text-[11.5px] text-slate-600 mt-0.5">
                                        {order.customer.email}
                                    </p>
                                )}
                                {order.customer?.phone && (
                                    <p className="text-[11.5px] text-slate-600 mt-0.5">
                                        {order.customer.phone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1.5">
                                    Pagamento
                                </p>
                                <p className="text-[14px] font-semibold text-slate-900">
                                    {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : '—'}
                                </p>
                                <p className="text-[11.5px] text-slate-600 mt-0.5">
                                    {order.items.length} item{order.items.length === 1 ? '' : 's'} · {totalQty} unidade{totalQty === 1 ? '' : 's'}
                                </p>
                            </div>
                        </section>

                        {/* Itens */}
                        <section className="mt-7">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Itens</p>
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="text-left border-b-2 border-slate-300">
                                        <th className="py-2 pr-2 font-semibold text-slate-700 w-8">#</th>
                                        <th className="py-2 px-2 font-semibold text-slate-700">Descrição</th>
                                        <th className="py-2 px-2 font-semibold text-slate-700 text-right tabular-nums w-16">Qtd</th>
                                        <th className="py-2 px-2 font-semibold text-slate-700 text-right tabular-nums w-28">Unitário</th>
                                        <th className="py-2 px-2 font-semibold text-slate-700 text-right tabular-nums w-24">Desc.</th>
                                        <th className="py-2 pl-2 font-semibold text-slate-700 text-right tabular-nums w-32">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((it, idx) => (
                                        <tr key={it.id} className="border-b border-slate-200 align-top">
                                            <td className="py-2 pr-2 text-slate-500 tabular-nums">{String(idx + 1).padStart(2, '0')}</td>
                                            <td className="py-2 px-2 text-slate-800">{it.productName}</td>
                                            <td className="py-2 px-2 text-right text-slate-800 tabular-nums">
                                                {Number(it.quantity).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-800 tabular-nums">
                                                {formatBRL(Number(it.unitPrice))}
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-600 tabular-nums">
                                                {Number(it.discount ?? 0) > 0 ? `−${formatBRL(Number(it.discount))}` : '—'}
                                            </td>
                                            <td className="py-2 pl-2 text-right text-slate-900 font-semibold tabular-nums">
                                                {formatBRL(Number(it.total))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* Totais */}
                        <section className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs">
                                <dl className="text-[12.5px] space-y-1.5">
                                    <div className="flex items-center justify-between text-slate-600">
                                        <dt>Subtotal</dt>
                                        <dd className="tabular-nums">{formatBRL(subtotal)}</dd>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex items-center justify-between text-slate-600">
                                            <dt>Descontos</dt>
                                            <dd className="tabular-nums">−{formatBRL(discount)}</dd>
                                        </div>
                                    )}
                                    <div className="border-t-2 border-slate-900 mt-2 pt-2 flex items-center justify-between font-bold text-[15px] text-slate-900">
                                        <dt>Total</dt>
                                        <dd className="tabular-nums">{formatBRL(total)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </section>

                        {/* Observações */}
                        {order.notes && (
                            <section className="mt-7 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                                    Observações
                                </p>
                                <p className="text-[12.5px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {order.notes}
                                </p>
                            </section>
                        )}

                        {/* Assinaturas */}
                        <section className="mt-12 grid grid-cols-2 gap-10">
                            <div>
                                <div className="border-t border-slate-400 pt-1.5">
                                    <p className="text-[11px] text-slate-600 text-center">Assinatura do cliente</p>
                                </div>
                            </div>
                            <div>
                                <div className="border-t border-slate-400 pt-1.5">
                                    <p className="text-[11px] text-slate-600 text-center">
                                        {company?.name ?? 'Vendedor'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Rodapé */}
                        <footer className="mt-10 pt-4 border-t border-slate-200 text-center">
                            <p className="text-[10.5px] text-slate-500">
                                Documento gerado eletronicamente em{' '}
                                {new Date().toLocaleString('pt-BR')} ·{' '}
                                <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
                            </p>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">
                                Não substitui documento fiscal. Conserve este comprovante.
                            </p>
                        </footer>
                    </div>
                </article>
            </div>
        </div>
    );
}
