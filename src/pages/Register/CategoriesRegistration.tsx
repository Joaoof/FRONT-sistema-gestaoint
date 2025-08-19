import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Layers, CheckCircle, XCircle } from 'lucide-react';
import { useInventoryGraphQL } from '../../hooks/useInventoryGraphQL';
import { useToast } from '../../hooks/useToast';
import { CreateCategoryInput, UpdateCategoryInput } from '../../graphql/types';

export function CategoriesRegistration() {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        active: true,
    });

    const { categories, loading, mutations } = useInventoryGraphQL();
    const { success, error } = useToast();

    const coresPredefinidas = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    const filteredCategorias = useMemo(() => {
        return categories.filter((categoria: any) =>
            categoria.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const stats = {
        total: categories.length,
        ativas: categories.filter((c: any) => c.active).length,
        inativas: categories.filter((c: any) => !c.active).length,
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const result = await mutations.updateCategory.mutate({
                    id: editingCategory.id,
                    input: formData as UpdateCategoryInput,
                });
                if (result) success('Categoria atualizada com sucesso!');
            } else {
                const result = await mutations.createCategory.mutate({
                    input: formData as CreateCategoryInput,
                });
                if (result) success('Categoria criada com sucesso!');
            }
            setShowForm(false);
            resetForm();
        } catch (err) {
            error('Erro ao salvar categoria');
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            color: '#3B82F6',
            active: true,
        });
    };

    const handleEdit = (categoria: any) => {
        setEditingCategory(categoria);
        setFormData({
            name: categoria.name,
            description: categoria.description || '',
            color: categoria.color,
            active: categoria.active,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            try {
                const result = await mutations.deleteCategory.mutate({ id });
                if (result) success('Categoria excluída com sucesso!');
            } catch (err) {
                error('Erro ao excluir categoria');
            }
        }
    };

    return (
        <div className="w-full space-y-6 px-4 py-6 bg-gray-50 min-h-screen text-gray-800">
            {/* 🔹 Header com Estatísticas + Ícones decorativos */}
            <div className="mt-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Categorias</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <Layers className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Total</h4>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <CheckCircle className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Ativas</h4>
                        <p className="text-3xl font-bold">{stats.ativas}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <XCircle className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Inativas</h4>
                        <p className="text-3xl font-bold">{stats.inativas}</p>
                    </div>
                </div>
            </div>

            {/* 🔹 Barra de Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar categorias..."
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
                    Nova Categoria
                </button>
            </div>

            {/* 🔹 Grid de Categorias */}
            {loading.categories ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredCategorias.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                    <Tag className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma categoria encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 auto-rows-fr">
                    {filteredCategorias.map((categoria: any) => (
                        <div
                            key={categoria.id}
                            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
                        >
                            {/* 🔹 Barra superior colorida */}
                            <div
                                className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl"
                                style={{ backgroundColor: categoria.color }}
                            ></div>

                            <div className="flex justify-between items-start mb-4 pt-2">
                                <div className="flex items-center">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
                                        style={{ backgroundColor: categoria.color }}
                                    >
                                        <Tag className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{categoria.name}</h3>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoria.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {categoria.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(categoria)}
                                        className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                        title="Editar categoria"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(categoria.id)}
                                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                                        title="Excluir categoria"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {categoria.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{categoria.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 🔹 Modal Aprimorado */}
            {showForm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
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
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                    placeholder="Ex: Eletrônicos"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                    placeholder="Detalhes da categoria..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cor</label>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                                    />
                                    <div className="flex gap-2">
                                        {coresPredefinidas.map((cor) => (
                                            <button
                                                key={cor}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: cor })}
                                                className={`w-8 h-8 rounded-lg border-2 transition-transform ${formData.color === cor
                                                        ? 'border-gray-600 scale-110 ring-2 ring-gray-400 ring-opacity-50'
                                                        : 'border-gray-300 hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: cor }}
                                                aria-label={`Selecionar cor ${cor}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="ativo"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                                    Categoria ativa
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
                                    disabled={mutations.createCategory.loading || mutations.updateCategory.loading}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md font-medium"
                                >
                                    {mutations.createCategory.loading || mutations.updateCategory.loading
                                        ? 'Salvando...'
                                        : editingCategory
                                            ? 'Atualizar'
                                            : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🔹 FAB com bounce e sombra destacada */}
            <button
                onClick={() => setShowForm(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-95 transition-transform animate-bounce z-40 flex items-center justify-center"
                title="Adicionar nova categoria"
            >
                <Plus className="h-6 w-6" />
            </button>
        </div>
    );
}