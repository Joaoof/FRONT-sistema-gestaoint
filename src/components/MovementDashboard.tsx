// src/pages/Movement/MovementDashboard.tsx
import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Movement = {
    id: string;
    value: number;
    description: string;
    type: 'venda' | 'troco' | 'outros' | 'despesa' | 'retirada' | 'pagamento';
    date: string;
};

// Dados mockados (substitua com GraphQL depois)
const mockMovements: Movement[] = [
    { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', date: '2025-04-05T10:30' },
    { id: '2', value: 50, description: 'Troco de cliente', type: 'troco', date: '2025-04-05T11:15' },
    { id: '3', value: 200, description: 'Pagamento de energia', type: 'despesa', date: '2025-04-05T09:00' },
    { id: '4', value: 300, description: 'Retirada de sócio', type: 'retirada', date: '2025-04-04T17:00' },
    { id: '5', value: 80, description: 'Compra de insumos', type: 'despesa', date: '2025-04-04T14:20' },
];

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);

    // Filtra movimentações pela data
    const filteredMovements = mockMovements.filter(m => m.date.startsWith(filterDate));

    // Calcula resumo
    const entradas = filteredMovements
        .filter(m => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saidas = filteredMovements
        .filter(m => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saldo = entradas - saidas;

    // Simulação: total do mês (deverá vir do backend)
    const totalMes = 15000;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Dashboard de Movimentações</h1>
                <p className="text-gray-600 font-light">Controle completo de entradas e saídas do caixa</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/movimentacoes')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Nova Entrada
                </button>
                <button
                    onClick={() => navigate('/app/movimentacoes-saida')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                    <ArrowDownCircle className="w-5 h-5" />
                    Nova Saída
                </button>
            </div>

            {/* Filtro de data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por data:</label>
                    <div className="relative flex-1 max-w-md">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Entradas do Dia</p>
                            <p className="text-xl font-bold text-green-900">R$ {entradas.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600 opacity-70" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-800">Saídas do Dia</p>
                            <p className="text-xl font-bold text-red-900">R$ {saidas.toFixed(2)}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600 opacity-70" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Saldo do Dia</p>
                            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                                R$ {saldo.toFixed(2)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-600 opacity-70" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-800">Total do Mês</p>
                            <p className="text-xl font-bold text-purple-900">R$ {totalMes.toFixed(2)}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-600 opacity-70" />
                    </div>
                </div>
            </div>

            {/* Histórico de movimentações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredMovements.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Nenhuma movimentação registrada nesta data.</div>
                    ) : (
                        filteredMovements.map((m) => (
                            <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <span
                                        className={`w-3 h-3 rounded-full ${['venda', 'troco', 'outros'].includes(m.type) ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    ></span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{m.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(m.date).toLocaleTimeString('pt-BR')}</p>
                                    </div>
                                </div>
                                <p
                                    className={`text-sm font-semibold ${['venda', 'troco', 'outros'].includes(m.type) ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {['venda', 'troco', 'outros'].includes(m.type) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                    <button
                        onClick={() => navigate('/historico')}
                        className="text-blue-600 hover:underline text-sm font-medium"
                    >
                        Ver todo histórico
                    </button>
                </div>
            </div>
        </div>
    );
}