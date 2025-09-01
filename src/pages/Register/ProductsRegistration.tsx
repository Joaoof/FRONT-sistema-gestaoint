import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin, AlertCircle, Users } from 'lucide-react';

interface Supplier {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
}

export function SupplierRegistration() {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const [suppliers] = useState<Supplier[]>([
        {
            id: '1',
            name: 'Distribuidora Alpha',
            email: 'contato@alpha.com.br',
            phone: '(11) 98765-4321',
            address: 'Av. Paulista, 1000 - São Paulo, SP',
            createdAt: '2024-01-15T10:00:00Z'
        },
        {
            id: '2',
            name: 'Comercial Beta Ltda',
            email: 'vendas@betacomer.com',
            phone: '(21) 91234-5678',
            address: 'Rua das Flores, 200 - Rio de Janeiro, RJ',
            createdAt: '2024-02-20T14:30:00Z'
        },
        {
            id: '3',
            name: 'Fornecimento Gamma',
            email: null,
            phone: '(31) 99999-1111',
            address: 'Praça Central, 50 - Belo Horizonte, MG',
            createdAt: '2024-03-05T09:15:00Z'
        }
    ]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    // 🔍 Filtragem otimizada
    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (supplier.phone?.includes(searchTerm.replace(/\D/g, '')) ?? false)
        );
    }, [suppliers, searchTerm]);

    // 🔹 Estatísticas
    const stats = {
        total: suppliers.length,
        comEmail: suppliers.filter(s => s.email).length,
        semContato: suppliers.filter(s => !s.phone && !s.email).length
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Salvando fornecedor:', formData);
        setShowForm(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: ''
        });
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || ''
        });
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
            console.log('Fornecedor excluído:', id);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    return (
        <div className="w-full space-y-6 px-4 py-6 bg-gray-50 min-h-screen text-gray-800">
            {/* 🔹 Header com Estatísticas */}
            <div className="mt-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Fornecedores</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <Users className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Total</h4>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <Mail className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Com E-mail</h4>
                        <p className="text-3xl font-bold">{stats.comEmail}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <AlertCircle className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Sem Contato</h4>
                        <p className="text-3xl font-bold">{stats.semContato}</p>
                    </div>
                </div>
            </div>

            {/* 🔹 Barra de Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar fornecedores..."
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
                    Novo Fornecedor
                </button>
            </div>

            {/* 🔹 Grid de Fornecedores */}
            {filteredSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                    <Building2 className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">Nenhum fornecedor encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                    {filteredSuppliers.map((supplier) => {
                        const semContato = !supplier.email && !supplier.phone;

                        return (
                            <div
                                key={supplier.id}
                                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
                            >
                                <div
                                    className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl"
                                    style={{
                                        backgroundColor: semContato ? '#F59E0B' : '#10B981'
                                    }}
                                ></div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{supplier.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            Cadastrado em: {formatDate(supplier.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(supplier)}
                                            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                            title="Editar fornecedor"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier.id)}
                                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                                            title="Excluir fornecedor"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    {supplier.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-xs text-gray-500 truncate">{supplier.address}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-2 mt-1 border-t border-gray-100">
                                        <span className="text-xs font-medium text-gray-500">Status:</span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${semContato
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}
                                        >
                                            {semContato ? 'Sem contato' : 'Completo'}
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
                                    {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nome da Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Ex: Distribuidora Alfa"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            E-mail
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="contato@empresa.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Telefone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="(11) 98765-4321"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Endereço
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Av. Paulista, 1000 - São Paulo, SP"
                                        />
                                    </div>
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
                                        {editingSupplier ? 'Atualizar' : 'Salvar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 FAB Mobile */}
            <button
                onClick={() => setShowForm(true)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 active:scale-95 transition-transform animate-bounce z-40 flex items-center justify-center"
                title="Adicionar novo fornecedor"
            >
                <Plus className="h-6 w-6" />
            </button>
        </div>
    );
}