import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Tipos
type MovementType = 'venda' | 'troco' | 'outros' | 'despesa' | 'retirada' | 'pagamento';

export type Movement = {
    id: string;
    value: number;
    description: string;
    type: MovementType;
    date: string;
};

// Dados mockados (substitua com GraphQL depois)
const mockMovements: Movement[] = [
    { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', date: '2025-04-05T10:30' },
    { id: '2', value: 50, description: 'Troco de cliente', type: 'troco', date: '2025-04-05T11:15' },
    { id: '3', value: 200, description: 'Pagamento de energia', type: 'despesa', date: '2025-04-05T09:00' },
    { id: '4', value: 300, description: 'Retirada de sócio', type: 'retirada', date: '2025-04-04T17:00' },
];

export function HomeMovement() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    // Filtro por data
    const [filterDate, setFilterDate] = useState<string>(today);

    // Filtra movimentações pela data
    const filteredMovements = mockMovements.filter(m =>
        m.date.startsWith(filterDate)
    );

    // Calcula resumo
    const entradas = filteredMovements
        .filter(m => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saidas = filteredMovements
        .filter(m => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saldo = entradas - saidas;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Controle de Caixa</h1>
                <p className="text-gray-700 font-light">Sistema de movimentações financeiras</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/movimentacoes')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Nova Entrada
                </button>
                <button
                    onClick={() => navigate('/movimentacoes-saida')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <ArrowDownCircle className="w-5 h-5" />
                    Nova Saída
                </button>
            </div>

            {/* Resumo do dia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800">Entradas do dia</p>
                    <p className="text-2xl font-bold text-green-900">R$ {entradas.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <DollarSign className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">Saídas do dia</p>
                    <p className="text-2xl font-bold text-red-900">R$ {saidas.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800">Saldo Final</p>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                        R$ {saldo.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Filtro de data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <label className="text-sm font-medium text-gray-700">Filtrar por data</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Lista de movimentações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredMovements.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Nenhuma movimentação encontrada para esta data.</div>
                    ) : (
                        filteredMovements.map((m) => (
                            <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center space-x-3">
                                    <span className={`w-2 h-2 rounded-full ${['venda', 'troco', 'outros'].includes(m.type) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{m.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(m.date).toLocaleTimeString('pt-BR')}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-semibold ${['venda', 'troco', 'outros'].includes(m.type) ? 'text-green-600' : 'text-red-600'}`}>
                                    {['venda', 'troco', 'outros'].includes(m.type) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}