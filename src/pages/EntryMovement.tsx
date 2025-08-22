import React, { useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// interface EntryMovementProps {
//     onAddEntry: (entry: Omit<EntryMovement, 'id'>) => void;
// }

interface EntryMovement {
    value: number;
    description: string;
    date: string;
    type: 'venda' | 'troco' | 'outros';
}

export function EntryMovement() {
    const { user } = useAuth();
    const [formData, setFormData] = useState<EntryMovement>({
        value: 0,
        description: '',
        date: new Date().toISOString().slice(0, 16), // formato "YYYY-MM-DDTHH:mm"
        type: 'venda',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.value || !formData.description.trim() || !user?.id) {
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
            mutation CreateEntryMovement($input: CreateEntryMovementInput!) {
              createEntryMovement(input: $input) {
                id
                value
                description
                date
                type
              }
            }
          `,
                    variables: {
                        input: {
                            value: formData.value,
                            description: formData.description,
                            date: formData.date,
                            type: formData.type,
                            userId: user.id,
                        },
                    },
                }),
            });

            const json = await res.json();

            if (json.errors) {
                throw new Error(json.errors[0].message);
            }

            // onAddEntry({
            //     value: formData.value,
            //     description: formData.description,
            //     date: formData.date,
            //     type: formData.type,
            // });

            setFormData({
                value: 0,
                description: '',
                date: new Date().toISOString().slice(0, 16),
                type: 'venda',
            });

            alert('Entrada registrada com sucesso!');
        } catch (err: any) {
            setError(err.message || 'Erro ao registrar entrada');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Registrar Entrada</h1>
                <p className="text-gray-600">Registre a entrada de valores no caixa</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                    <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Nova Entrada</h2>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            value={formData.value}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="Descreva a origem da entrada"
                        />
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                            Data e Hora
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Entrada
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="venda">Venda</option>
                            <option value="troco">Troco Recebido</option>
                            <option value="outros">Outros</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                            * Campos obrigatórios
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center px-6 py-3 text-white rounded-lg transition-all duration-200 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Registrar Entrada
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
