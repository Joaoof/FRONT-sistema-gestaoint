import React, { useState } from 'react';
import { DollarSign, User, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { GET_CUSTOMERS_LIST } from '../../../graphql/queries/accounts';
import {
    CREATE_ACCOUNT_RECEIVABLE,
    CREATE_CUSTOMER_BASIC,
} from '../../../graphql/mutations/accounts';
import { LIST_PRODUCTS_WITH_IMAGES } from '../../../graphql/mutations/product-with-images';
import { AccountStatus } from '../../../types/accounts';

interface ReceivableForm {
    customerId: string;
    productId: string;
    value: number;
    description: string;
    dueDate: string;
    interestRate: number;
    status: AccountStatus;
    notes: string;
}

interface CustomerOption {
    id: string;
    name: string;
    document?: string | null;
}

interface ProductOption {
    id: string;
    nameProduct: string;
}

export function CreateReceivable() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ReceivableForm>({
        customerId: '',
        productId: '',
        value: 0,
        description: '',
        dueDate: new Date().toISOString().slice(0, 10),
        interestRate: 0.033,
        status: 'PENDING',
        notes: '',
    });

    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', document: '', email: '', phone: '' });

    const { data: customersData, refetch: refetchCustomers } = useQuery<{ customers: CustomerOption[] }>(GET_CUSTOMERS_LIST);
    const { data: productsData } = useQuery<{ products: ProductOption[] }>(LIST_PRODUCTS_WITH_IMAGES, {
        variables: { take: 200, skip: 0 },
    });

    const [createReceivable, { loading }] = useMutation(CREATE_ACCOUNT_RECEIVABLE);
    const [createCustomer, { loading: creatingCustomer }] = useMutation(CREATE_CUSTOMER_BASIC);

    const customers = customersData?.customers ?? [];
    const products = productsData?.products ?? [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'value' || name === 'interestRate' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId) {
            toast.error('Selecione um cliente');
            return;
        }
        try {
            await createReceivable({
                variables: {
                    input: {
                        customerId: formData.customerId,
                        productId: formData.productId || undefined,
                        description: formData.description,
                        amount: formData.value,
                        interestRate: formData.interestRate,
                        dueDate: new Date(formData.dueDate).toISOString(),
                        status: formData.status,
                        notes: formData.notes || undefined,
                    },
                },
            });
            toast.success('Conta a receber registrada com sucesso!');
            navigate('/listar-contas-receber');
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar conta');
        }
    };

    const handleCreateCustomer = async () => {
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
                setFormData((prev) => ({ ...prev, customerId: created.id }));
                setShowNewCustomer(false);
                setNewCustomer({ name: '', document: '', email: '', phone: '' });
            }
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar cliente');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 text-blue-600 dark:text-blue-400">← Voltar</button>
                <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white">Nova Conta a Receber</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Cliente *
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <select
                                    id="customerId"
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.document ? ` — ${c.document}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNewCustomer(!showNewCustomer)}
                                className="inline-flex items-center gap-1 px-3 border border-gray-300 dark:border-white/15 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <Plus className="w-4 h-4" /> Novo
                            </button>
                        </div>

                        {showNewCustomer && (
                            <div className="mt-3 p-4 border border-dashed border-slate-300 dark:border-white/15 rounded-lg space-y-3">
                                <input className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" placeholder="Nome *" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" placeholder="CPF/CNPJ" value={newCustomer.document} onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })} />
                                    <input className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" placeholder="Telefone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                </div>
                                <input className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" placeholder="E-mail" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                                <button type="button" onClick={handleCreateCustomer} disabled={creatingCustomer} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 text-sm">
                                    {creatingCustomer ? 'Criando...' : 'Criar Cliente'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Produto vinculado
                        </label>
                        <select
                            id="productId"
                            name="productId"
                            value={formData.productId}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                        >
                            <option value="">— Sem produto vinculado —</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.nameProduct}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Valor *</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    id="value"
                                    name="value"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.value || ''}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Juros diário</label>
                            <input
                                type="number"
                                id="interestRate"
                                name="interestRate"
                                min="0"
                                step="0.0001"
                                value={formData.interestRate}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                placeholder="0.033"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">0.033 ≈ 1% ao mês (juros compostos)</p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Descrição *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                            placeholder="Ex: Venda de produtos, serviço prestado..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Vencimento *</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    id="dueDate"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="PAID">Pago</option>
                                <option value="OVERDUE">Vencido</option>
                                <option value="CANCELED">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Observações</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={2}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-white/10">
                        <div className="text-sm text-gray-500 dark:text-slate-400">* Campos obrigatórios</div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Registrar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
