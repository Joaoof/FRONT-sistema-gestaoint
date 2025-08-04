// src/pages/Fiscal/AccountsPayable/Create.tsx
import React, { useState } from 'react';
import { FileText, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PayableForm {
    value: number;
    description: string;
    dueDate: string;
    supplierName: string;
    status: 'pendente' | 'pago' | 'vencido';
}

export function CreatePayable() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<PayableForm>({
        value: 0,
        description: '',
        dueDate: new Date().toISOString().slice(0, 16),
        supplierName: '',
        status: 'pendente',
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Conta a pagar criada:', formData);
        alert('Conta a pagar registrada com sucesso!');
        navigate('/app/fiscal/payables');
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 text-blue-600">← Voltar</button>
                <h1 className="text-3xl font-serif font-bold text-gray-900">Nova Conta a Pagar</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-2">
                            Fornecedor *
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                id="supplierName"
                                name="supplierName"
                                value={formData.supplierName}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder="Nome do fornecedor"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor *
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                id="value"
                                name="value"
                                min="0.01"
                                step="0.01"
                                value={formData.value}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            placeholder="Ex: Compra de insumos, aluguel..."
                        />
                    </div>

                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Vencimento *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="datetime-local"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Registrar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}