import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Package, Tag, TrendingUp, AlertTriangle } from 'lucide-react';

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
            precoCompra: 10.5,
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
            precoCompra: 8.3,
            precoVenda: 12.9,
            estoque: 5,
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

    // 🔍 Filtragem otimizada
    const filteredProdutos = useMemo(() => {
        return produtos.filter(produto =>
            produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [produtos, searchTerm]);

    // 🔹 Estatísticas
    const stats = {
        total: produtos.length,
        ativos: produtos.filter(p => p.ativo).length,
        baixoEstoque: produtos.filter(p => p.estoque <= p.estoqueMinimo && p.estoqueMinimo > 0).length
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Salvando produto:', formData);
        setShowForm(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingProduct(null);
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

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            console.log('Produto excluído:', id);
        }
    };

    return (
        <div className="w-full space-y-6 px-4 py-6 bg-gray-50 min-h-screen text-gray-800">
            {/* 🔹 Header com Estatísticas */}
            <div className="mt-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Produtos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <Package className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Total</h4>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <TrendingUp className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Ativos</h4>
                        <p className="text-3xl font-bold">{stats.ativos}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <AlertTriangle className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Estoque Baixo</h4>
                        <p className="text-3xl font-bold">{stats.baixoEstoque}</p>
                    </div>
                </div>
            </div>

            {/* 🔹 Barra de Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm placeholder-gray-400"
                    />
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg font-medium"
                >
                    <Plus className="h-5 w-5" />
                    Novo Produto
                </button>
            </div>

            {/* 🔹 Grid de Produtos */}
            {filteredProdutos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                    <Package className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">Nenhum produto encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                    {filteredProdutos.map((produto) => {
                        const baixoEstoque = produto.estoque <= produto.estoqueMinimo && produto.estoqueMinimo > 0;
                        const statusColor = produto.ativo
                            ? (baixoEstoque ? '#F59E0B' : '#10B981')
                            : '#EF4444';

                        return (
                            <div
                                key={produto.id}
                                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
                            >
                                <div
                                    className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl"
                                    style={{ backgroundColor: statusColor }}
                                ></div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Package className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{produto.nome}</h3>
                                        <p className="text-sm text-gray-500">Cód: {produto.codigo}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(produto)}
                                            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                            title="Editar produto"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(produto.id)}
                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                                            title="Excluir produto"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Categoria:</span>
                                        <span className="text-gray-800">{produto.categoria}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Unidade:</span>
                                        <span>{produto.unidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Compra:</span>
                                        <span>R$ {parseFloat(produto.precoCompra.toString()).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Venda:</span>
                                        <span className="font-semibold text-gray-900">
                                            R$ {parseFloat(produto.precoVenda.toString()).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="font-medium">Estoque:</span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${baixoEstoque
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}
                                        >
                                            {produto.estoque} {produto.unidade}
                                            {baixoEstoque && ' ⚠'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Status:</span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${produto.ativo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {produto.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 🔹 Modal de Formulário */}
            {showForm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Código *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Ex: PROD001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nome *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Ex: Sabonete líquido"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Categoria *
                                        </label>
                                        <select
                                            required
                                            value={formData.categoria}
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Selecione uma categoria</option>
                                            {categorias.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Unidade *
                                        </label>
                                        <select
                                            required
                                            value={formData.unidade}
                                            onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
                                        >
                                            {unidades.map(unidade => (
                                                <option key={unidade} value={unidade}>{unidade}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Preço de Compra *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.precoCompra}
                                            onChange={(e) => setFormData({ ...formData, precoCompra: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Preço de Venda *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.precoVenda}
                                            onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Estoque Atual
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.estoque}
                                            onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Estoque Mínimo
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.estoqueMinimo}
                                            onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="ativo"
                                        checked={formData.ativo}
                                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                                        Produto ativo
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md font-medium"
                                    >
                                        {editingProduct ? 'Atualizar' : 'Salvar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 FAB Mobile com bounce */}
            <button
                onClick={() => setShowForm(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-95 transition-transform animate-bounce z-40 flex items-center justify-center"
                title="Adicionar novo produto"
            >
                <Plus className="h-6 w-6" />
            </button>
        </div>
    );
}