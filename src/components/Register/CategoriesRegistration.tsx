import { Edit, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryService } from "../../services/api";

// Defina a interface Categoria conforme os campos utilizados no componente
interface Categoria {
    id: string;
    nome: string;
    descricao?: string;
    cor: string;
    ativo: boolean;
}

export function CategoriesRegistration() {

    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        cor: '#3B82F6',
        ativo: true
    });

    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success' as 'success' | 'error'
    });

    const categoryService = new CategoryService(); // Instância do serviço

    const coresPredefinidas = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    const filteredCategorias = categorias.filter((categoria: { nome: string; }) =>
        categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const loadCategories = async () => {
        try {
            const response = await categoryService.getAll();
            if (response.success && response.data?.items) {
                setCategorias(
                    response.data.items.map((item: any) => ({
                        id: item.id,
                        nome: item.nome ?? '',
                        descricao: item.descricao ?? '',
                        cor: item.cor ?? '#3B82F6',
                        ativo: item.ativo === 'ACTIVE' || item.ativo === true,
                    }))
                );
            }
        } catch (error) {
            console.error('Erro ao carregar categorias');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        const response = await categoryService.create({
            name: formData.nome,
            description: formData.descricao,
            cor: formData.cor,
            status: formData.ativo ? 'ACTIVE' : 'INACTIVE'
        });
    
        console.log(response);
    
    
        if (response.success) {
            setNotification({
                show: true,
                message: 'Categoria criada com sucesso!',
                type: 'success'
            });
    
            setShowForm(false);
            setFormData({
                nome: '',
                descricao: '',
                cor: '#3B82F6',
                ativo: true
            });
    
            // Recarrega categorias da API
            loadCategories();
        }
    
        // Ocultar notificação após 5 segundos
        setTimeout(() => {
            setNotification((prev: any) => ({ ...prev, show: false }));
        }, 5000);
    };

    // Carregar categorias ao montar o componente
    useEffect(() => {
        loadCategories();
    }, []);

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

            {/* Notificação */}
            {notification.show && (
                <div
                    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                >
                    <p>{notification.message}</p>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Nova Categoria</h3>
                                <button
                                    onClick={() => setShowForm(false)}
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
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nome da categoria"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
                                            value={formData.cor}
                                            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                        />
                                        <div className="flex space-x-1">
                                            {coresPredefinidas.map(cor => (
                                                <button
                                                    key={cor}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, cor })}
                                                    className={`w-8 h-8 rounded-lg border-2 ${formData.cor === cor ? 'border-gray-400' : 'border-gray-200'
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
                                        checked={formData.ativo}
                                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                                        Categoria ativa
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategorias.map((categoria: any) => (
                    <div key={categoria.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                                    style={{ backgroundColor: categoria.cor }}
                                >
                                    <Tag className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{categoria.nome}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoria.ativo
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {categoria.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button className="text-blue-600 hover:text-blue-900 p-1">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900 p-1">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        {categoria.descricao && (
                            <p className="text-sm text-gray-600">{categoria.descricao}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}