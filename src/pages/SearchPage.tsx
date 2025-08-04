// src/pages/ConsultasPage.tsx
import React, { useState } from 'react';
import { Search, Download, BarChart2, Database } from 'lucide-react';

// Tipos
type ConsultaType = 'produtos' | 'vendas' | 'compras' | 'movimentacoes' | 'clientes' | 'fiscal';

export function SearchPage() {
    const [consulta, setConsulta] = useState<ConsultaType>('produtos');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Simulação de dados (substitua com GraphQL)
    const results = [
        { id: 1, nome: 'Notebook Dell', estoque: 15, preco: 3500 },
        { id: 2, nome: 'Mouse Gamer', estoque: 45, preco: 120 },
        { id: 3, nome: 'Teclado Mecânico', estoque: 30, preco: 280 },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Pesquisando:', { consulta, searchTerm, dateRange });
        // Aqui você faria uma chamada à API
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Centro de Consultas</h1>
                <p className="text-gray-600">Busque, analise e exporte dados do seu negócio</p>
            </div>

            {/* Tipo de Consulta */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Consulta</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                        { id: 'produtos', label: 'Produtos', icon: '📦' },
                        { id: 'vendas', label: 'Vendas', icon: '💰' },
                        { id: 'compras', label: 'Compras', icon: '🛒' },
                        { id: 'movimentacoes', label: 'Movimentações', icon: '📊' },
                        { id: 'clientes', label: 'Clientes', icon: '👥' },
                        { id: 'fiscal', label: 'Fiscal', icon: '📑' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setConsulta(item.id as ConsultaType)}
                            className={`p-3 text-sm text-center rounded-lg transition-all ${consulta === item.id
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="text-lg mb-1">{item.icon}</div>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtros */}
            <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pesquisar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nome, ID, descrição..."
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">De</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="p-3 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Até</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="p-3 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </form>

            {/* Resultados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Resultados da Consulta</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>

                {results.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhum resultado encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {results.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.estoque}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                            R$ {item.preco.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Gráfico (exemplo opcional) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                    <BarChart2 className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Gráfico de Produtos em Estoque</h3>
                </div>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                    [Gráfico aqui - use recharts ou chart.js]
                </div>
            </div>
        </div>
    );
}