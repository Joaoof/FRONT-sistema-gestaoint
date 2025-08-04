import { useState } from 'react';
import { User, Building, Shield, CreditCard, LogOut, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
    const { user, company, logout } = useAuth();

    // Dados do perfil
    const [profile, setProfile] = useState({
        name: user?.name || 'Usuário',
        email: user?.email || 'usuario@empresa.com',
        phone: '(99) 99999-9999',
        role: user?.role || 'Administrador',
    });

    // Dados da empresa
    const [companyData, setCompanyData] = useState({
        name: company?.name || 'Minha Empresa',
        cnpj: company?.cnpj || '00.000.000/0000-00',
        address: company?.address || 'Rua Exemplo, 123 - Cidade, UF',
    });

    // Senha
    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    // Notificação
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSaveProfile = () => {
        console.log('Perfil salvo:', profile);
        setNotification({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveCompany = () => {
        console.log('Empresa salva:', companyData);
        setNotification({ type: 'success', message: 'Dados da empresa atualizados!' });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleChangePassword = () => {
        if (password.new !== password.confirm) {
            setNotification({ type: 'error', message: 'As senhas não coincidem.' });
        } else if (password.new.length < 6) {
            setNotification({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
        } else {
            console.log('Senha alterada');
            setNotification({ type: 'success', message: 'Senha alterada com sucesso!' });
            setPassword({ current: '', new: '', confirm: '' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    return (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Configurações</h1>
                <p className="text-gray-600">Gerencie seu perfil, empresa e segurança</p>
            </div>

            {/* Notificação */}
            {notification && (
                <div
                    className={`p-4 rounded-lg text-sm flex items-center gap-2 mb-6 ${notification.type === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Perfil do Usuário */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                    <User className="w-6 h-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Perfil do Usuário</h2>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="(99) 99999-9999"
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                            <input
                                type="text"
                                value={profile.role}
                                disabled
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSaveProfile}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Search className="w-5 h-5" />
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>

            {/* Dados da Empresa */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                    <Building className="w-6 h-6 text-green-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                        <input
                            type="text"
                            value={companyData.name}
                            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                            <input
                                type="text"
                                value={companyData.cnpj}
                                onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                                placeholder="00.000.000/0000-00"
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                            <input
                                type="text"
                                value={companyData.address}
                                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                placeholder="Rua, número, bairro, cidade"
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSaveCompany}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Search className="w-5 h-5" />
                            Salvar Empresa
                        </button>
                    </div>
                </div>
            </div>

            {/* Plano e Módulos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                    <CreditCard className="w-6 h-6 text-purple-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Plano e Módulos</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-700">
                            <strong>Plano Atual:</strong> {user?.plan?.name || 'Grátis'}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                            <strong>Status:</strong>{' '}
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Ativo</span>
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Módulos Ativos</h3>
                        <div className="flex flex-wrap gap-2">
                            {user?.plan?.modules?.map((module) => (
                                <span
                                    key={module.module_key}
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${module.isActive
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-500 line-through'
                                        }`}
                                >
                                    {module.module_key}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Segurança */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                    <Shield className="w-6 h-6 text-red-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                        <input
                            type="password"
                            value={password.current}
                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                            <input
                                type="password"
                                value={password.new}
                                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={password.confirm}
                                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                            onClick={handleChangePassword}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <Search className="w-5 h-5" />
                            Alterar Senha
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 text-red-600 hover:text-red-800 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair da Conta</span>
                </button>
            </div>
        </div>
    );
}