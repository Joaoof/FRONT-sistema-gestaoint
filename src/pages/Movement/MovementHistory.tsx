import { useState } from 'react';
import { Search } from 'lucide-react';
import { Movement } from '../../types';

export function MovementHistory() {
    const [movements] = useState<Movement[]>([
        { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', subtype: 'venda', date: '2025-04-05T10:30', createdAt: '2025-04-05T10:30' },
        { id: '2', value: 200, description: 'Pagamento de energia', type: 'despesa', subtype: 'despesa', date: '2025-04-05T09:15', createdAt: '2025-04-05T09:15' },
        { id: '3', value: 50, description: 'Troco de cliente', type: 'troco', subtype: 'troco', date: '2025-04-04T16:20', createdAt: '2025-04-04T16:20' },
    ]);

    const [filter, setFilter] = useState<string>('todos');
    const [search, setSearch] = useState('');

    const filtered = movements.filter(m => {
        const matchesSearch = m.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'todos' || m.type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Histórico de Movimentações</h1>
                <p className="text-gray-600">Visualize todas as entradas e saídas</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por descrição..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg"
                    >
                        <option value="todos">Todos</option>
                        <option value="venda">Vendas</option>
                        <option value="troco">Troco</option>
                        <option value="outros">Outros</option>
                        <option value="despesa">Despesas</option>
                        <option value="retirada">Retiradas</option>
                        <option value="pagamento">Pagamentos</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Data</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Descrição</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filtered.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {new Date(m.date).toLocaleDateString('pt-BR')}<br />
                                        <span className="text-xs text-gray-500">{new Date(m.date).toLocaleTimeString('pt-BR')}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{m.description}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs ${['venda', 'troco', 'outros'].includes(m.type) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {m.type === 'venda' ? 'Venda' : m.type === 'troco' ? 'Troco' : m.type}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-medium text-right ${['venda', 'troco', 'outros'].includes(m.type) ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {['venda', 'troco', 'outros'].includes(m.type) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}