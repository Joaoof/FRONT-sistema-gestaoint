import { useState } from 'react';
import {
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apolloClient } from '../lib/apollo-client'; // Importa o cliente Apollo
import { CHANGE_PASSWORD_MUTATION } from '../graphql/mutations/mutations'; // Importa a mutação
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage'; // Importa o utilitário de erro

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

    // Estado de Loading
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Notificação
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

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

    const handleChangePassword = async () => {
        setLoadingPassword(true);
        setNotification(null);

        try {
            const input = {
                currentPassword: password.current,
                newPassword: password.new,
                confirmPassword: password.confirm,
            };

            const response = await apolloClient.mutate({
                mutation: CHANGE_PASSWORD_MUTATION,
                variables: { input },
            });

            console.log('MEU RESPONSE SENHA KAKAKAAAA', response);


            // Tratamento de sucesso (a mutação retorna uma string)
            if (response.data?.changePassword) {
                setNotification({ type: 'success', message: response.data.changePassword });

                // Limpar formulário e deslogar, forçando o re-login com a nova senha
                setPassword({ current: '', new: '', confirm: '' });

                // IMPORTANTE: Desloga o usuário após um pequeno delay para garantir que a mensagem de sucesso seja lida
                setTimeout(() => logout(), 2000);

            } else {
                throw new Error('Resposta inválida do servidor.');
            }

        } catch (err: any) {
            // Tratamento de Erros da API (E.g., Senha atual inválida)
            const msgs = getGraphQLErrorMessages(err);
            setNotification({ type: 'error', message: msgs[0] || 'Erro desconhecido ao alterar senha.' });
        } finally {
            setLoadingPassword(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Configurações</h1>
                <p className="text-gray-600">Gerencie seu perfil, empresa e segurança</p>
            </div>

            {/* Notificação Fixa no Canto (Toast) - Opcional */}
            {notification && (
                <div
                    className={`fixed top-6 right-6 z-50 p-4 rounded-lg text-sm flex items-center gap-2 shadow-lg border-l-4 animate-fade-in ${notification.type === 'success'
                        ? 'bg-green-50 text-green-800 border-green-500'
                        : 'bg-red-50 text-red-800 border-red-500'
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
            <div className="bg-white rounded-2xl shadow-md border border-white p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white text-white rounded-full">
                        <img src="https://icons.veryicon.com/png/o/miscellaneous/two-color-icon-library/user-286.png" alt="Usuário" className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-sans text-gray-900">Perfil do Usuário</h2>
                        <p className="text-sm font-serif text-gray-500">Atualize suas informações pessoais</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="(99) 99999-9999"
                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                        <input
                            type="text"
                            value={profile.role}
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                    <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all"
                    >
                        <img src="https://images.icon-icons.com/3863/PNG/512/save_icon_241135.png" alt="Usuário" className="w-6 h-6" />
                        Salvar Alterações
                    </button>
                </div>
            </div>

            {/* Dados da Empresa */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full">
                        <img src="https://images.icon-icons.com/3578/PNG/512/enterprise_building_icon_225731.png" alt="Empresa" className="w-6 h-6" />                    </div>
                    <div>
                        <h2 className="text-xl font-sans text-gray-900">Dados da Empresa</h2>
                        <p className="text-sm font-serif text-gray-500">Atualize as informações da sua empresa</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                        <input
                            type="text"
                            value={companyData.name}
                            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                            <input
                                type="text"
                                value={companyData.address}
                                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                placeholder="Rua, número, bairro, cidade"
                                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                    <button
                        onClick={handleSaveCompany}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-md transition-all"
                    >
                        <img src="https://images.icon-icons.com/3863/PNG/512/save_icon_241135.png" alt="Usuário" className="w-6 h-6" />
                        Salvar Empresa
                    </button>
                </div>
            </div>

            {/* Plano e Módulos */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                        <img src="https://icones.pro/wp-content/uploads/2021/07/icone-d-entreprise-violet.png" alt="Empresa" className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-sans text-gray-900">Plano e Módulos</h2>
                        <p className="text-sm font-serif text-gray-500">Gerencie seu plano atual e módulos ativos</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-mono text-gray-700">
                            <strong>Plano Atual:</strong> {user?.plan?.name || 'Grátis'}
                        </p>
                        <p className="text-sm font-mono text-gray-700 mt-1">
                            <strong>Status:</strong>{' '}
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium font-serif rounded-full">
                                Ativo
                            </span>
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
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 text-red-600 rounded-full">
                        <img src="https://cdn-icons-png.flaticon.com/512/1746/1746650.png" alt="Segurança" className="w-6 h-6" />                       </div>
                    <div>
                        <h2 className="text-xl font-sans text-gray-900">Segurança</h2>
                        <p className="text-sm font-serif text-gray-500">Altere sua senha e mantenha sua conta segura</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                        <input
                            type="password"
                            value={password.current}
                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            disabled={loadingPassword}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                            <input
                                type="password"
                                value={password.new}
                                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                disabled={loadingPassword}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={password.confirm}
                                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                disabled={loadingPassword}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                    <button
                        onClick={handleChangePassword}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={loadingPassword}
                    >
                        {loadingPassword ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Alterando...
                            </>
                        ) : (
                            <>
                                <img src="https://cdn-icons-png.flaticon.com/512/1804/1804429.png" alt="Alterar Senha" className="w-6 h-6" />                                   Alterar Senha
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Logout */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                    <img src="https://cdn-icons-png.flaticon.com/512/4400/4400828.png" alt="Sair da Conta" className="w-6 h-6" />                       <span>Sair da Conta</span>
                </button>
            </div>
        </div>
    );
}
