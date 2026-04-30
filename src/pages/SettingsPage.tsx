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
        <div className="space-y-6 w-full">
            {/* Header SaaS */}
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Configurações</h1>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Gerencie seu perfil, empresa e segurança</p>
            </div>

            {/* Toast notification */}
            {notification && (
                <div
                    role="status"
                    className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-[13px] flex items-center gap-2.5 shadow-soft-lg border animate-fade-in-up ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                    }`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                    ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Perfil do Usuário */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <span className="w-8 h-8 rounded-md bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    <div>
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Perfil do usuário</h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Atualize suas informações pessoais</p>
                    </div>
                </div>
                <div className="p-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Nome</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">E-mail</label>
                        <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Telefone</label>
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="(99) 99999-9999"
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Função</label>
                        <input
                            type="text"
                            value={profile.role}
                            disabled
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                        onClick={handleSaveProfile}
                        className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                    >
                        <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Salvar alterações
                    </button>
                </div>
                </div>
            </div>

            {/* Dados da Empresa */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <span className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16M9 7h.01M9 11h.01M9 15h.01M13 7h.01M13 11h.01M13 15h.01M3 21h18" />
                        </svg>
                    </span>
                    <div>
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Dados da empresa</h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Atualize as informações da empresa</p>
                    </div>
                </div>
                <div className="p-5">

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Nome da Empresa</label>
                        <input
                            type="text"
                            value={companyData.name}
                            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">CNPJ</label>
                            <input
                                type="text"
                                value={companyData.cnpj}
                                onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                                placeholder="00.000.000/0000-00"
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Endereço</label>
                            <input
                                type="text"
                                value={companyData.address}
                                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                placeholder="Rua, número, bairro, cidade"
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                        onClick={handleSaveCompany}
                        className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                    >
                        <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        Salvar empresa
                    </button>
                </div>
                </div>
            </div>

            {/* Plano e Módulos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <span className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </span>
                    <div>
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Plano e módulos</h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Gerencie seu plano atual e módulos ativos</p>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div>
                            <p className="text-[11.5px] uppercase tracking-[0.04em] font-medium text-slate-500 dark:text-slate-400">Plano atual</p>
                            <p className="text-[15px] font-semibold text-slate-900 dark:text-white mt-0.5">{user?.plan?.name || 'Grátis'}</p>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                        </span>
                    </div>
                    <div>
                        <p className="text-[11.5px] uppercase tracking-[0.04em] font-medium text-slate-500 dark:text-slate-400 mb-2">Módulos ativos</p>
                        <div className="flex flex-wrap gap-1.5">
                            {user?.plan?.modules?.map((module) => (
                                <span
                                    key={module.module_key}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                        module.isActive
                                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20'
                                            : 'bg-slate-50 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/[0.06] line-through'
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <span className="w-8 h-8 rounded-md bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </span>
                    <div>
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Segurança</h2>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Altere sua senha e mantenha sua conta segura</p>
                    </div>
                </div>
                <div className="p-5">

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Senha Atual</label>
                        <input
                            type="password"
                            value={password.current}
                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-red-500"
                            disabled={loadingPassword}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Nova Senha</label>
                            <input
                                type="password"
                                value={password.new}
                                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-red-500"
                                disabled={loadingPassword}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={password.confirm}
                                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-red-500"
                                disabled={loadingPassword}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-5 mt-5 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                        onClick={handleChangePassword}
                        className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loadingPassword}
                    >
                        {loadingPassword ? (
                            <>
                                <div className="w-3.5 h-3.5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />
                                Alterando…
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                                Alterar senha
                            </>
                        )}
                    </button>
                </div>
                </div>
            </div>

            {/* Logout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5">
                <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 h-8 px-3 text-[12.5px] font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Sair da conta</span>
                </button>
            </div>
        </div>
    );
}
