import React, { useState } from 'react';
import { FileText, Users, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { CREATE_ACCOUNT_PAYABLE } from '../../../graphql/mutations/accounts';
import { LIST_PRODUCTS_WITH_IMAGES } from '../../../graphql/mutations/product-with-images';
import { AccountStatus } from '../../../types/accounts';

interface PayableForm {
    supplierName: string;
    productId: string;
    value: number;
    description: string;
    dueDate: string;
    interestRate: number;
    status: AccountStatus;
    notes: string;
}

interface ProductOption {
    id: string;
    nameProduct: string;
}

export function CreatePayable() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PayableForm>({
        supplierName: '',
        productId: '',
        value: 0,
        description: '',
        dueDate: new Date().toISOString().slice(0, 10),
        interestRate: 0.033,
        status: 'PENDING',
        notes: '',
    });

    const { data: productsData } = useQuery<{ products: ProductOption[] }>(LIST_PRODUCTS_WITH_IMAGES, {
        variables: { take: 200, skip: 0 },
    });
    const [createPayable, { loading }] = useMutation(CREATE_ACCOUNT_PAYABLE);

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
        try {
            await createPayable({
                variables: {
                    input: {
                        supplierName: formData.supplierName,
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
            toast.success('Conta a pagar registrada com sucesso!');
            navigate('/listar-contas-pagas');
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao criar conta');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 text-blue-600 dark:text-blue-400">← Voltar</button>
                <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white">Nova Conta a Pagar</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Fornecedor *</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                id="supplierName"
                                name="supplierName"
                                value={formData.supplierName}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder="Nome do fornecedor"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Produto vinculado</label>
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
                            placeholder="Ex: Compra de insumos, aluguel..."
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
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            <FileText className="w-4 h-4" />
                            {loading ? 'Salvando...' : 'Registrar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
