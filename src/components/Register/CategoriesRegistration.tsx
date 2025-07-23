import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { useInventoryGraphQL } from '../../hooks/useInventoryGraphQL';
import { useToast } from '../../hooks/useToast';
import { CreateCategoryInput, UpdateCategoryInput } from '../../graphql/types';

export function CategoriesRegistration() {
<<<<<<< HEAD
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    active: true
  });

  const { categories, loading, mutations } = useInventoryGraphQL();
  const { success, error } = useToast();

  const coresPredefinidas = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const filteredCategorias = categories.filter(categoria =>
    categoria.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
=======
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        active: true
    });

    const { categories, loading, mutations } = useInventoryGraphQL();
    const { success, error } = useToast();
>>>>>>> 1e228c1 (fix: fix dashboard login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

<<<<<<< HEAD
    try {
      if (editingCategory) {
        const result = await mutations.updateCategory.mutate({
          id: editingCategory.id,
          input: formData as UpdateCategoryInput
        });
        
        if (result) {
          success('Categoria atualizada com sucesso!');
        }
      } else {
        const result = await mutations.createCategory.mutate({
          input: formData as CreateCategoryInput
        });
        
        if (result) {
          success('Categoria criada com sucesso!');
        }
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        active: true
      });
    } catch (err) {
      error('Erro ao salvar categoria');
    }
  };

  const handleEdit = (categoria: any) => {
    setEditingCategory(categoria);
    setFormData({
      name: categoria.name,
      description: categoria.description || '',
      color: categoria.color,
      active: categoria.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        const result = await mutations.deleteCategory.mutate({ id });
        if (result) {
          success('Categoria excluída com sucesso!');
        }
      } catch (err) {
        error('Erro ao excluir categoria');
      }
    }
  };
=======
    const filteredCategorias = categories.filter((categoria: { name: string; }) =>
        categoria.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                const result = await mutations.updateCategory.mutate({
                    id: editingCategory.id,
                    input: formData as UpdateCategoryInput
                });

                if (result) {
                    success('Categoria atualizada com sucesso!');
                }
            } else {
                const result = await mutations.createCategory.mutate({
                    input: formData as CreateCategoryInput
                });

                if (result) {
                    success('Categoria criada com sucesso!');
                }
            }

            setShowForm(false);
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                color: '#3B82F6',
                active: true
            });
        } catch (err) {
            error('Erro ao salvar categoria');
        }
    };

    const handleEdit = (categoria: any) => {
        setEditingCategory(categoria);
        setFormData({
            name: categoria.name,
            description: categoria.description || '',
            color: categoria.color,
            active: categoria.active
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
            try {
                const result = await mutations.deleteCategory.mutate({ id });
                if (result) {
                    success('Categoria excluída com sucesso!');
                }
            } catch (err) {
                error('Erro ao excluir categoria');
            }
        }
    };
>>>>>>> 1e228c1 (fix: fix dashboard login)

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar categorias..."
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
                    Nova Categoria
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
<<<<<<< HEAD
                                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                                </h3>
                                <button
                                    onClick={() => {
                                      setShowForm(false);
                                      setEditingCategory(null);
=======
                                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingCategory(null);
>>>>>>> 1e228c1 (fix: fix dashboard login)
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nome da categoria"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Descrição da categoria"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cor
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                        />
                                        <div className="flex space-x-1">
                                            {coresPredefinidas.map(cor => (
                                                <button
                                                    key={cor}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color: cor })}
                                                    className={`w-8 h-8 rounded-lg border-2 ${formData.color === cor ? 'border-gray-400' : 'border-gray-200'
                                                        }`}
                                                    style={{ backgroundColor: cor }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="ativo"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                                        Categoria ativa
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
<<<<<<< HEAD
                                          setShowForm(false);
                                          setEditingCategory(null);
=======
                                            setShowForm(false);
                                            setEditingCategory(null);
>>>>>>> 1e228c1 (fix: fix dashboard login)
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={mutations.createCategory.loading || mutations.updateCategory.loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingCategory ? 'Atualizar' : 'Salvar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            {loading.categories ? (
<<<<<<< HEAD
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategorias.map((categoria) => (
                    <div key={categoria.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                                    style={{ backgroundColor: categoria.color }}
                                >
                                    <Tag className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{categoria.name}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoria.active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {categoria.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => handleEdit(categoria)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(categoria.id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        {categoria.description && (
                            <p className="text-sm text-gray-600">{categoria.description}</p>
                        )}
                    </div>
                ))}
              </div>
=======
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCategorias.map((categoria: any) => (
                        <div key={categoria.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                                        style={{ backgroundColor: categoria.color }}
                                    >
                                        <Tag className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{categoria.name}</h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoria.active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {categoria.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleEdit(categoria)}
                                        className="text-blue-600 hover:text-blue-900 p-1"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(categoria.id)}
                                        className="text-red-600 hover:text-red-900 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {categoria.description && (
                                <p className="text-sm text-gray-600">{categoria.description}</p>
                            )}
                        </div>
                    ))}
                </div>
>>>>>>> 1e228c1 (fix: fix dashboard login)
            )}
        </div>
    );
}