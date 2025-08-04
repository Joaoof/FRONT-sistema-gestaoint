import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, Upload } from 'lucide-react';

interface Produto {
    id: string;
    codigo: string;
    nome: string;
    categoria: string;
    unidade: string;
    precoCompra: number;
    precoVenda: number;
    estoque: number;
    estoqueMinimo: number;
    ativo: boolean;
}

export function ProductsRegistration() {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

    const [produtos] = useState<Produto[]>([
        {
            id: '1',
            codigo: 'PROD001',
            nome: 'Produto Exemplo 1',
            categoria: 'Alimentação',
            unidade: 'UN',
            precoCompra: 10.50,
            precoVenda: 15.75,
            estoque: 100,
            estoqueMinimo: 20,
            ativo: true
        },
        {
            id: '2',
            codigo: 'PROD002',
            nome: 'Produto Exemplo 2',
            categoria: 'Limpeza',
            unidade: 'LT',
            precoCompra: 8.30,
            precoVenda: 12.90,
            estoque: 50,
            estoqueMinimo: 10,
            ativo: true
        }
    ]);

    const [formData, setFormData] = useState({
        codigo: '',
        nome: '',
        categoria: '',
        unidade: 'UN',
        precoCompra: '',
        precoVenda: '',
        estoque: '',
        estoqueMinimo: '',
        ativo: true
    });

    const categorias = ['Alimentação', 'Limpeza', 'Higiene', 'Bebidas', 'Outros'];
    const unidades = ['UN', 'KG', 'LT', 'MT', 'CX', 'PC'];

    const filteredProdutos = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui você implementaria a lógica de salvar
        console.log('Salvando produto:', formData);
        setShowForm(false);
        setFormData({
            codigo: '',
            nome: '',
            categoria: '',
            unidade: 'UN',
            precoCompra: '',
            precoVenda: '',
            estoque: '',
            estoqueMinimo: '',
            ativo: true
        });
    };

    const handleEdit = (produto: Produto) => {
        setEditingProduct(produto);
        setFormData({
            codigo: produto.codigo,
            nome: produto.nome,
            categoria: produto.categoria,
            unidade: produto.unidade,
            precoCompra: produto.precoCompra.toString(),
            precoVenda: produto.precoVenda.toString(),
            estoque: produto.estoque.toString(),
            estoqueMinimo: produto.estoqueMinimo.toString(),
            ativo: produto.ativo
        });
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Produto
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingProduct(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Código *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: PROD001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nome do produto"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Categoria *
                                        </label>
                                        <select
                                            required
                                            value={formData.categoria}
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Selecione uma categoria</option>
                                            {categorias.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Unidade *
                                        </label>
                                        <select
                                            required
                                            value={formData.unidade}
                                            onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {unidades.map(unidade => (
                                                <option key={unidade} value={unidade}>{unidade}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço de Compra *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.precoCompra}
                                            onChange={(e) => setFormData({ ...formData, precoCompra: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Preço de Venda *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.precoVenda}
                                            onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estoque Atual
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.estoque}
                                            onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estoque Mínimo
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.estoqueMinimo}
                                            onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="ativo"
                                        checked={formData.ativo}
                                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                                        Produto ativo
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setEditingProduct(null);
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingProduct ? 'Atualizar' : 'Salvar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Preços
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estoque
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProdutos.map((produto) => (
                                <tr key={produto.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-gray-500" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                                                <div className="text-sm text-gray-500">{produto.codigo}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {produto.categoria}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>Compra: R$ {produto.precoCompra.toFixed(2)}</div>
                                        <div>Venda: R$ {produto.precoVenda.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${produto.estoque <= produto.estoqueMinimo
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {produto.estoque} {produto.unidade}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Mín: {produto.estoqueMinimo}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${produto.ativo
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {produto.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleEdit(produto)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
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