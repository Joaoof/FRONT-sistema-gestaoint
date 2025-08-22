import React, { useState } from 'react';
import { DollarSign, FileText, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ReceivableForm {
    value: number;
    description: string;
    dueDate: string;
    clientName: string;
    status: 'pendente' | 'pago' | 'vencido';
}

interface PayableForm {
    value: number;
    description: string;
    dueDate: string;
    supplierName: string;
    status: 'pendente' | 'pago' | 'vencido';
}

export function FiscalPage() {
    const { user } = useAuth();

    const [receivable, setReceivable] = useState<ReceivableForm>({
        value: 0,
        description: '',
        dueDate: new Date().toISOString().slice(0, 16),
        clientName: '',
        status: 'pendente',
    });

    const [payable, setPayable] = useState<PayableForm>({
        value: 0,
        description: '',
        dueDate: new Date().toISOString().slice(0, 16),
        supplierName: '',
        status: 'pendente',
    });

    const [loadingReceivable, setLoadingReceivable] = useState(false);
    const [loadingPayable, setLoadingPayable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReceivableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReceivable((prev) => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value,
        }));
    };

    const handlePayableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPayable((prev) => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleReceivableSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoadingReceivable(true);

        try {
            if (!receivable.value || !receivable.description.trim() || !receivable.clientName || !user?.id) {
                throw new Error('Preencha todos os campos obrigatórios');
            }

            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('Faça login primeiro');
                return;
            }

            const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
            if (!endpoint) {
                toast.error("env nullo. Contactar o desenvolvedo");
                return;
            }

            // Simulando requisição GraphQL
            const res = await fetch(endpoint ?? '', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
            mutation CreateReceivable($input: CreateReceivableInput!) {
              createReceivable(input: $input) {
                id
                value
                description
                dueDate
                clientName
                status
              }
            }
          `,
                    variables: {
                        input: {
                            ...receivable,
                            userId: user.id,
                        },
                    },
                }),
            });

            const json = await res.json();
            if (json.errors) {
                throw new Error(json.errors[0].message);
            }

            // Resetar formulário
            setReceivable({
                value: 0,
                description: '',
                dueDate: new Date().toISOString().slice(0, 16),
                clientName: '',
                status: 'pendente',
            });

            alert('Conta a receber registrada com sucesso!');
        } catch (err: any) {
            setError(err.message || 'Erro ao registrar conta a receber');
        } finally {
            setLoadingReceivable(false);
        }
    };

    const handlePayableSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoadingPayable(true);

        try {
            if (!payable.value || !payable.description.trim() || !payable.supplierName || !user?.id) {
                throw new Error('Preencha todos os campos obrigatórios');
            }

            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('Faça login primeiro');
                return;
            }

            const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
            if (!endpoint) {
                toast.error("env nullo. Contactar o desenvolvedo");
                return;
            }

            const res = await fetch(endpoint ?? '', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
            mutation CreatePayable($input: CreatePayableInput!) {
              createPayable(input: $input) {
                id
                value
                description
                dueDate
                supplierName
                status
              }
            }
          `,
                    variables: {
                        input: {
                            ...payable,
                            userId: user.id,
                        },
                    },
                }),
            });

            const json = await res.json();
            if (json.errors) {
                throw new Error(json.errors[0].message);
            }

            setPayable({
                value: 0,
                description: '',
                dueDate: new Date().toISOString().slice(0, 16),
                supplierName: '',
                status: 'pendente',
            });

            alert('Conta a pagar registrada com sucesso!');
        } catch (err: any) {
            setError(err.message || 'Erro ao registrar conta a pagar');
        } finally {
            setLoadingPayable(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Gestão Fiscal</h1>
                <p className="text-gray-600 font-light">Registre contas a receber e a pagar</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Contas a Receber */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                        <DollarSign className="w-6 h-6 text-blue-600 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900">Contas a Receber</h2>
                    </div>

                    <form onSubmit={handleReceivableSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                                Cliente *
                            </label>
                            <input
                                type="text"
                                id="clientName"
                                name="clientName"
                                value={receivable.clientName}
                                onChange={handleReceivableChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nome do cliente"
                            />
                        </div>

                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                                Valor *
                            </label>
                            <input
                                type="number"
                                id="value"
                                name="value"
                                min="0.01"
                                step="0.01"
                                value={receivable.value}
                                onChange={handleReceivableChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0,00"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={receivable.description}
                                onChange={handleReceivableChange}
                                required
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Venda de produtos, serviço prestado..."
                            />
                        </div>

                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Data de Vencimento *
                            </label>
                            <input
                                type="datetime-local"
                                id="dueDate"
                                name="dueDate"
                                value={receivable.dueDate}
                                onChange={handleReceivableChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={receivable.status}
                                onChange={handleReceivableChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="pendente">Pendente</option>
                                <option value="pago">Pago</option>
                                <option value="vencido">Vencido</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-500">* Campos obrigatórios</div>
                            <button
                                type="submit"
                                disabled={loadingReceivable}
                                className={`flex items-center px-6 py-3 text-white rounded-lg transition-all duration-200 ${loadingReceivable
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    }`}
                            >
                                {loadingReceivable ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5 mr-2" />
                                        Registrar Conta
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Contas a Pagar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center mb-6">
                        <FileText className="w-6 h-6 text-red-600 mr-3" />
                        <h2 className="text-xl font-serif text-gray-900">Contas a Pagar</h2>
                    </div>

                    <form onSubmit={handlePayableSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-2">
                                Fornecedor *
                            </label>
                            <input
                                type="text"
                                id="supplierName"
                                name="supplierName"
                                value={payable.supplierName}
                                onChange={handlePayableChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Nome do fornecedor"
                            />
                        </div>

                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                                Valor *
                            </label>
                            <input
                                type="number"
                                id="value"
                                name="value"
                                min="0.01"
                                step="0.01"
                                value={payable.value}
                                onChange={handlePayableChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="0,00"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Descrição *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={payable.description}
                                onChange={handlePayableChange}
                                required
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Ex: Compra de insumos, aluguel, energia..."
                            />
                        </div>

                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Data de Vencimento *
                            </label>
                            <input
                                type="datetime-local"
                                id="dueDate"
                                name="dueDate"
                                value={payable.dueDate}
                                onChange={handlePayableChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={payable.status}
                                onChange={handlePayableChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="pendente">Pendente</option>
                                <option value="pago">Pago</option>
                                <option value="vencido">Vencido</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-500">* Campos obrigatórios</div>
                            <button
                                type="submit"
                                disabled={loadingPayable}
                                className={`flex items-center px-6 py-3 text-white rounded-lg transition-all duration-200 ${loadingPayable
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                    }`}
                            >
                                {loadingPayable ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-5 h-5 mr-2" />
                                        Registrar Conta
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}