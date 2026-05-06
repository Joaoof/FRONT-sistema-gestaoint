import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    FileText,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react';
import { GET_ORDER, GET_ORDERS } from '../../graphql/queries/orders';
import { ISSUE_INVOICE } from '../../graphql/queries/invoices';
import { GET_FISCAL_CONFIG } from '../../graphql/queries/fiscal-config';
import { getGraphQLErrorMessages } from '../../utils/getGraphQLErrorMessage';

type InvoiceType = 'NFE' | 'NFCE' | 'NFSE';

interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    itemKind: string;
    itemUnit: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    description: string | null;
}

interface OrderLite {
    id: string;
    number: number;
    customerName: string | null;
    customerDocument: string | null;
    total: number;
    status: string;
    items: OrderItem[];
    customer: {
        id: string;
        name: string;
        document: string | null;
        email: string | null;
        address: string | null;
        bairro: string | null;
        cep: string | null;
    } | null;
}

interface FormItem {
    id: string;
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: string;
    valorUnitario: string;
    valorDesconto: string;
    productId: string | null;
}

interface FormState {
    type: InvoiceType;
    orderId: string;
    naturezaOperacao: string;
    paymentMethod: string;
    recipientName: string;
    recipientDocument: string;
    recipientEmail: string;
    recipientAddress: string;
    recipientCity: string;
    recipientUf: string;
    recipientZip: string;
    valorDesconto: string;
    valorFrete: string;
    observacoes: string;
    items: FormItem[];
}

const emptyItem = (): FormItem => ({
    id: Math.random().toString(36).slice(2),
    codigo: '',
    descricao: '',
    ncm: '',
    cfop: '5102',
    unidade: 'UN',
    quantidade: '1',
    valorUnitario: '0',
    valorDesconto: '0',
    productId: null,
});

const emptyForm = (): FormState => ({
    type: 'NFE',
    orderId: '',
    naturezaOperacao: 'Venda de mercadoria',
    paymentMethod: '',
    recipientName: '',
    recipientDocument: '',
    recipientEmail: '',
    recipientAddress: '',
    recipientCity: '',
    recipientUf: '',
    recipientZip: '',
    valorDesconto: '0',
    valorFrete: '0',
    observacoes: '',
    items: [emptyItem()],
});

export function IssueInvoicePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderIdFromQuery = searchParams.get('orderId');
    const [form, setForm] = useState<FormState>(emptyForm());
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const { data: configData, loading: configLoading } = useQuery(GET_FISCAL_CONFIG, {
        fetchPolicy: 'cache-and-network',
    });
    const config = configData?.companyFiscalConfig as
        | { ambiente: string; providerName: string | null; ativo: boolean }
        | null
        | undefined;

    const { data: ordersData, loading: ordersLoading } = useQuery<{ orders: OrderLite[] }>(GET_ORDERS, {
        variables: { take: 1000 },
        fetchPolicy: 'cache-and-network',
    });

    const { data: orderData } = useQuery<{ order: OrderLite }>(GET_ORDER, {
        variables: { id: form.orderId },
        skip: !form.orderId,
    });

    const [issueInvoice, { loading: issuing }] = useMutation(ISSUE_INVOICE);

    useEffect(() => {
        if (orderIdFromQuery && !form.orderId) {
            setForm((prev) => ({ ...prev, orderId: orderIdFromQuery }));
        }
    }, [orderIdFromQuery, form.orderId]);

    useEffect(() => {
        if (orderData?.order) {
            const o = orderData.order;
            setForm((prev) => ({
                ...prev,
                recipientName: o.customer?.name ?? o.customerName ?? prev.recipientName,
                recipientDocument: o.customer?.document ?? o.customerDocument ?? prev.recipientDocument,
                recipientEmail: o.customer?.email ?? prev.recipientEmail,
                recipientAddress: o.customer?.address ?? prev.recipientAddress,
                items: (o.items ?? []).map((item) => ({
                    id: item.id,
                    codigo: item.productId.slice(0, 12),
                    descricao: item.productName,
                    ncm: '',
                    cfop: '5102',
                    unidade: item.itemUnit || 'UN',
                    quantidade: String(item.quantity),
                    valorUnitario: String(item.unitPrice),
                    valorDesconto: String(item.discount ?? 0),
                    productId: item.productId,
                })) || [emptyItem()],
            }));
        }
    }, [orderData]);

    const totals = useMemo(() => {
        const valorProdutos = form.items.reduce((acc, item) => {
            const qtd = Number(item.quantidade) || 0;
            const unit = Number(item.valorUnitario) || 0;
            const desc = Number(item.valorDesconto) || 0;
            return acc + qtd * unit - desc;
        }, 0);
        const total = valorProdutos - (Number(form.valorDesconto) || 0) + (Number(form.valorFrete) || 0);
        return { valorProdutos, total };
    }, [form]);

    const updateItem = (id: string, patch: Partial<FormItem>) =>
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        }));

    const removeItem = (id: string) =>
        setForm((prev) => ({
            ...prev,
            items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
        }));

    const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (!config) {
            setFeedback({
                type: 'error',
                message: 'Empresa sem configuração fiscal. Cadastre antes de emitir.',
            });
            return;
        }
        if (!config.ativo) {
            setFeedback({ type: 'error', message: 'Emissão fiscal desativada.' });
            return;
        }
        if (!form.recipientName.trim()) {
            setFeedback({ type: 'error', message: 'Informe o nome do destinatário.' });
            return;
        }
        if (form.items.some((it) => !it.descricao.trim() || !it.codigo.trim())) {
            setFeedback({ type: 'error', message: 'Todos os itens precisam de código e descrição.' });
            return;
        }

        const itemsPayload = form.items.map((item, idx) => {
            const qtd = Number(item.quantidade) || 0;
            const unit = Number(item.valorUnitario) || 0;
            const desc = Number(item.valorDesconto) || 0;
            return {
                ordem: idx,
                codigo: item.codigo.trim(),
                descricao: item.descricao.trim(),
                ncm: item.ncm.trim() || null,
                cfop: item.cfop.trim() || null,
                unidade: item.unidade.trim() || 'UN',
                quantidade: qtd,
                valorUnitario: unit,
                valorDesconto: desc,
                valorTotal: Math.max(0, qtd * unit - desc),
                productId: item.productId,
            };
        });

        try {
            const { data } = await issueInvoice({
                variables: {
                    input: {
                        type: form.type,
                        orderId: form.orderId || undefined,
                        naturezaOperacao: form.naturezaOperacao,
                        paymentMethod: form.paymentMethod || undefined,
                        recipientName: form.recipientName.trim(),
                        recipientDocument: form.recipientDocument.replace(/\D/g, '') || undefined,
                        recipientEmail: form.recipientEmail.trim() || undefined,
                        recipientAddress: form.recipientAddress.trim() || undefined,
                        recipientCity: form.recipientCity.trim() || undefined,
                        recipientUf: form.recipientUf.toUpperCase() || undefined,
                        recipientZip: form.recipientZip.replace(/\D/g, '') || undefined,
                        valorDesconto: Number(form.valorDesconto) || 0,
                        valorFrete: Number(form.valorFrete) || 0,
                        observacoes: form.observacoes.trim() || undefined,
                        items: itemsPayload,
                    },
                },
            });
            const id = data?.issueInvoice?.id;
            if (id) {
                navigate(`/notas/${id}`);
            }
        } catch (err) {
            setFeedback({
                type: 'error',
                message: getGraphQLErrorMessages(err)[0] ?? 'Erro ao emitir nota.',
            });
        }
    };

    if (configLoading) {
        return (
            <div className="p-8 flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando configuração fiscal…
            </div>
        );
    }

    if (!config) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
                <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">
                    Configuração fiscal não cadastrada
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    Antes de emitir notas, é preciso cadastrar CNPJ, IE, regime tributário, certificado e provedor de NFe.
                </p>
                <button
                    onClick={() => navigate('/configuracoes/fiscal')}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                    Ir para configuração fiscal
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-5xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-300"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">Emitir nota fiscal</h1>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                        Ambiente: {config.ambiente === 'HOMOLOG' ? 'Homologação (teste)' : 'Produção'}
                        {config.providerName ? ` · provedor ${config.providerName}` : ' · provedor não definido'}
                    </p>
                </div>
            </div>

            {feedback && (
                <div
                    className={`p-3 rounded-md border text-[12.5px] ${feedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5 space-y-4">
                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Cabeçalho</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Tipo de documento
                        </label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value as InvoiceType })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                        >
                            <option value="NFE">NFe (mercadoria)</option>
                            <option value="NFCE">NFCe (varejo)</option>
                            <option value="NFSE">NFSe (serviço)</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Pedido vinculado (opcional)
                        </label>
                        <select
                            value={form.orderId}
                            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                            disabled={ordersLoading}
                        >
                            <option value="">— Sem pedido vinculado —</option>
                            {(ordersData?.orders ?? []).map((o) => (
                                <option key={o.id} value={o.id}>
                                    Pedido #{o.number} — {o.customerName ?? 'Sem cliente'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Natureza da operação
                        </label>
                        <input
                            type="text"
                            value={form.naturezaOperacao}
                            onChange={(e) => setForm({ ...form, naturezaOperacao: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Forma de pagamento
                        </label>
                        <input
                            type="text"
                            value={form.paymentMethod}
                            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                            placeholder="PIX, Cartão, Boleto…"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5 space-y-4">
                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Destinatário</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Nome / Razão social *
                        </label>
                        <input
                            type="text"
                            value={form.recipientName}
                            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            CPF/CNPJ
                        </label>
                        <input
                            type="text"
                            value={form.recipientDocument}
                            onChange={(e) => setForm({ ...form, recipientDocument: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                            placeholder="00000000000 ou 00000000000000"
                        />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            E-mail
                        </label>
                        <input
                            type="email"
                            value={form.recipientEmail}
                            onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Endereço
                        </label>
                        <input
                            type="text"
                            value={form.recipientAddress}
                            onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                        />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Cidade
                        </label>
                        <input
                            type="text"
                            value={form.recipientCity}
                            onChange={(e) => setForm({ ...form, recipientCity: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                UF
                            </label>
                            <input
                                type="text"
                                maxLength={2}
                                value={form.recipientUf}
                                onChange={(e) => setForm({ ...form, recipientUf: e.target.value.toUpperCase() })}
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                                CEP
                            </label>
                            <input
                                type="text"
                                value={form.recipientZip}
                                onChange={(e) => setForm({ ...form, recipientZip: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Itens</h2>
                    <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar item
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    {form.items.map((item, idx) => (
                        <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 items-end pb-3 border-b border-slate-100 dark:border-white/[0.04] last:border-0"
                        >
                            <div className="col-span-2">
                                <label className="block text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    value={item.codigo}
                                    onChange={(e) => updateItem(item.id, { codigo: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[12.5px] font-mono"
                                    required
                                />
                            </div>
                            <div className="col-span-4">
                                <label className="block text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Descrição *
                                </label>
                                <input
                                    type="text"
                                    value={item.descricao}
                                    onChange={(e) => updateItem(item.id, { descricao: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[12.5px]"
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">NCM</label>
                                <input
                                    type="text"
                                    value={item.ncm}
                                    onChange={(e) => updateItem(item.id, { ncm: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[12.5px] font-mono"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">CFOP</label>
                                <input
                                    type="text"
                                    value={item.cfop}
                                    onChange={(e) => updateItem(item.id, { cfop: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[12.5px] font-mono"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">Qtd</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={item.quantidade}
                                    onChange={(e) => updateItem(item.id, { quantidade: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[12.5px] font-mono"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Vlr unit
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.valorUnitario}
                                    onChange={(e) => updateItem(item.id, { valorUnitario: e.target.value })}
                                    className="w-full p-2 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[12.5px] font-mono"
                                />
                            </div>
                            <div className="col-span-1 grid place-items-end">
                                {form.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="w-9 h-9 grid place-items-center rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                                        title="Remover item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="col-span-12 text-[11.5px] text-slate-500 dark:text-slate-400 -mt-1">
                                Item {idx + 1} · subtotal: {(Number(item.quantidade) * Number(item.valorUnitario) - Number(item.valorDesconto || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5 space-y-4">
                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Totais e observações</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Desconto da nota
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.valorDesconto}
                            onChange={(e) => setForm({ ...form, valorDesconto: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                            Frete
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.valorFrete}
                            onChange={(e) => setForm({ ...form, valorFrete: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] font-mono"
                        />
                    </div>
                    <div className="grid place-items-end">
                        <div className="text-right">
                            <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Total da nota
                            </p>
                            <p className="text-[20px] font-semibold text-slate-900 dark:text-white tabular-nums">
                                {totals.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        Observações / informações complementares
                    </label>
                    <textarea
                        rows={3}
                        value={form.observacoes}
                        onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px]"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                <button
                    type="button"
                    onClick={() => navigate('/notas')}
                    className="h-10 px-5 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-md"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={issuing}
                    className="inline-flex items-center gap-1.5 h-10 px-5 text-[13px] font-medium text-white bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-md shadow-sm disabled:opacity-50"
                >
                    {issuing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Emitindo…
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <FileText className="w-4 h-4" />
                            Emitir nota
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
