import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, User, Users, CheckCircle, XCircle } from 'lucide-react';

interface Cliente {
    id: string;
    nome: string;
    documento: string;
    tipo: 'PF' | 'PJ';
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    ativo: boolean;
}

export function CustomersRegistration() {
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [clientes] = useState<Cliente[]>([
        {
            id: '1',
            nome: 'João Silva',
            documento: '123.456.789-00',
            tipo: 'PF',
            email: 'joao@email.com',
            telefone: '(11) 99999-9999',
            endereco: 'Rua A, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            ativo: true
        },
        {
            id: '2',
            nome: 'Empresa ABC Ltda',
            documento: '12.345.678/0001-90',
            tipo: 'PJ',
            email: 'contato@empresaabc.com',
            telefone: '(11) 88888-8888',
            endereco: 'Av. B, 456',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '09876-543',
            ativo: true
        }
    ]);

    const [formData, setFormData] = useState({
        nome: '',
        documento: '',
        tipo: 'PF' as 'PF' | 'PJ',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        ativo: true
    });

    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // 🔍 Filtragem com debounce opcional (usando useMemo)
    const filteredClientes = useMemo(() => {
        return clientes.filter(cliente =>
            cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.documento.includes(searchTerm.replace(/\D/g, ''))
        );
    }, [clientes, searchTerm]);

    const stats = {
        total: clientes.length,
        ativos: clientes.filter(c => c.ativo).length,
        inativos: clientes.filter(c => !c.ativo).length,
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Salvando cliente:', formData);
        setShowForm(false);
        setFormData({
            nome: '',
            documento: '',
            tipo: 'PF',
            email: '',
            telefone: '',
            endereco: '',
            cidade: '',
            estado: '',
            cep: '',
            ativo: true
        });
    };

    const handleEdit = (cliente: Cliente) => {
        setFormData({
            nome: cliente.nome,
            documento: cliente.documento,
            tipo: cliente.tipo,
            email: cliente.email,
            telefone: cliente.telefone,
            endereco: cliente.endereco,
            cidade: cliente.cidade,
            estado: cliente.estado,
            cep: cliente.cep,
            ativo: cliente.ativo,
        });
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            console.log('Cliente excluído:', id);
        }
    };

    return (
        <div className="w-full space-y-6 px-4 py-6 bg-gray-50 min-h-screen text-gray-800">
            {/* 🔹 Header com Estatísticas */}
            <div className="mt-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Clientes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <Users className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Total</h4>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <CheckCircle className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Ativos</h4>
                        <p className="text-3xl font-bold">{stats.ativos}</p>
                    </div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden">
                        <XCircle className="absolute right-3 bottom-3 h-12 w-12 opacity-20" />
                        <h4 className="text-sm font-medium opacity-90">Inativos</h4>
                        <p className="text-3xl font-bold">{stats.inativos}</p>
                    </div>
                </div>
            </div>

            {/* 🔹 Barra de Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Buscar clientes..."
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
                    Novo Cliente
                </button>
            </div>

            {/* 🔹 Grid de Clientes (substitui tabela) */}
            {filteredClientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                    <User className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">Nenhum cliente encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                    {filteredClientes.map((cliente) => (
                        <div
                            key={cliente.id}
                            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
                        >
                            <div
                                className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl"
                                style={{ backgroundColor: cliente.ativo ? '#10B981' : '#EF4444' }}
                            ></div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{cliente.nome}</h3>
                                    <p className="text-sm text-gray-500">{cliente.documento}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(cliente)}
                                        className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                        title="Editar cliente"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cliente.id)}
                                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                                        title="Excluir cliente"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span className="font-medium">Email:</span>
                                    <span>{cliente.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Telefone:</span>
                                    <span>{cliente.telefone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Cidade:</span>
                                    <span>{cliente.cidade}, {cliente.estado}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Tipo:</span>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cliente.tipo === 'PF'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}
                                    >
                                        {cliente.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="font-medium">Status:</span>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cliente.ativo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🔹 Modal de Formulário */}
            {showForm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Novo Cliente</h3>
                                <button
                                    onClick={() => setShowForm(false)}
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
                                            Nome/Razão Social *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tipo *
                                        </label>
                                        <select
                                            required
                                            value={formData.tipo}
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'PF' | 'PJ' })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="PF">Pessoa Física</option>
                                            <option value="PJ">Pessoa Jurídica</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {formData.tipo === 'PF' ? 'CPF' : 'CNPJ'} *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.documento}
                                            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder={formData.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Telefone
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.telefone}
                                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            E-mail
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="cliente@email.com"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Endereço
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.endereco}
                                            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="Rua, número, bairro"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Cidade
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cidade}
                                            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="São Paulo"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Estado
                                        </label>
                                        <select
                                            value={formData.estado}
                                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Selecione</option>
                                            {estados.map(estado => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            CEP
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cep}
                                            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                                            placeholder="00000-000"
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
                                        Cliente ativo
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md font-medium"
                                    >
                                        Salvar
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
                title="Adicionar novo cliente"
            >
                <Plus className="h-6 w-6" />
            </button>
        </div>
    );
}