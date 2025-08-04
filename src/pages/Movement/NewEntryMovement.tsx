import React, { useState } from 'react';
import { ArrowUpCircle, DollarSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NewEntryMovement() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        value: 0,
        description: '',
        type: 'venda' as 'venda' | 'troco' | 'outros',
        date: new Date().toISOString().slice(0, 16),
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!formData.value || !formData.description.trim()) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        // Aqui você envia para GraphQL
        setTimeout(() => {
            console.log('Nova entrada:', formData);
            alert('Entrada registrada com sucesso!');
            setLoading(false);
            navigate('/movimentacoes');
        }, 1000);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button
                    onClick={() => navigate('/movimentacoes')}
                    className="mr-4 p-2 hover:bg-gray-100 rounded"
                >
                    <X className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-serif font-bold text-gray-900">Nova Entrada</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entrada *</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: 'venda', label: 'Venda', icon: '💰' },
                                { value: 'troco', label: 'Troco', icon: '🔄' },
                                { value: 'outros', label: 'Outros', icon: '➕' },
                            ].map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t.value as any })}
                                    className={`p-4 border-2 rounded-lg text-center transition-all ${formData.type === t.value
                                        ? 'border-green-500 bg-green-50 text-green-900'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{t.icon}</div>
                                    <div className="text-sm font-medium">{t.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                id="value"
                                step="0.01"
                                min="0.01"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                required
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Ex: Venda no PDV, troco de cliente..."
                        />
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                            Data e Hora
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Registrar Entrada'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}