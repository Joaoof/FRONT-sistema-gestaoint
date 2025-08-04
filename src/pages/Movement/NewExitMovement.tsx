// src/pages/Movimentacoes/NovaSaida.tsx
import React, { useState } from 'react';
import { ArrowDownCircle, FileText, Users, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NewExitMovement() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        value: 0,
        description: '',
        type: 'despesa' as 'despesa' | 'retirada' | 'pagamento',
        date: new Date().toISOString().slice(0, 16),
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.value || !formData.description.trim()) {
            alert('Preencha todos os campos');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            console.log('Nova saída:', formData);
            alert('Saída registrada com sucesso!');
            setLoading(false);
            navigate('/movimentacoes');
        }, 1000);
    };

    const icons = {
        despesa: <FileText className="w-5 h-5" />,
        retirada: <Users className="w-5 h-5" />,
        pagamento: <CreditCard className="w-5 h-5" />,
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
                <h1 className="text-3xl font-serif font-bold text-gray-900">Nova Saída</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Saída *</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: 'despesa', label: 'Despesa', icon: '📝' },
                                { value: 'retirada', label: 'Retirada', icon: '👤' },
                                { value: 'pagamento', label: 'Pagamento', icon: '💳' },
                            ].map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t.value as any })}
                                    className={`p-4 border-2 rounded-lg text-center transition-all ${formData.type === t.value
                                        ? 'border-red-500 bg-red-50 text-red-900'
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
                        <input
                            type="number"
                            id="value"
                            step="0.01"
                            min="0.01"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            placeholder="Ex: Aluguel, retirada do sócio, pagamento de fornecedor..."
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Registrar Saída'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}