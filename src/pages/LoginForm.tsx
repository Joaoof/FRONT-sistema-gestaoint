import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, ArrowLeft } from "lucide-react"

export const LoginForm = () => {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false); // Controle da tela
    const [email, setEmail] = useState<string>("")
    const [password_hash, setPassword] = useState<string>("")
    // Incluímos 'isAuthenticated' aqui para reagir ao login, mas a navegação principal é externa.
    const { login, isLoading, isAuthenticated } = useAuth()
    const [message, setMessage] = useState<string>("");
    const [recoveryEmail, setRecoveryEmail] = useState<string>(""); // Para recuperação
    const [error, setError] = useState<string>("");

    const navigate = useNavigate();

    // Use um useEffect para reagir APENAS quando o estado global de autenticação mudar.
    useEffect(() => {
        if (isAuthenticated) {
            // Navega após o AuthContext confirmar que o usuário está autenticado
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Limpa erro anterior

        try {
            await login(email, password_hash);
            // ❌ REMOVIDO: navigate('/dashboard', { replace: true });
            // Deixamos o useEffect acima lidar com a navegação após a conclusão do login.
        } catch (err) {
            // O AuthContext já trata erros e desliga o loading/define o erro
            console.error("Erro na submissão do login:", err);
            // Se houver um erro, o AuthContext deve definir um estado de erro
        }
    }

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        // Validação simples de e-mail
        if (!recoveryEmail || !recoveryEmail.includes("@")) {
            setError("Por favor, insira um e-mail válido.");
            return;
        }

        // Simulação de envio (substitua pela sua API real)
        try {
            // Ex: await api.post('/auth/recover', { email: recoveryEmail })
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setMessage("Um link de recuperação foi enviado para seu e-mail.");
            setRecoveryEmail(""); // Limpa campo
        } catch {
            setError("Falha ao enviar e-mail. Tente novamente.");
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* aurora suave de fundo (só visual, não interativo) */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-brand-300/40 dark:bg-brand-700/30 blur-3xl" />
                <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-300/30 dark:bg-indigo-700/20 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-fuchsia-200/30 dark:bg-fuchsia-700/15 blur-3xl" />
            </div>

            <div className="relative max-w-md w-full animate-fade-in-up">
                <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/10 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-soft-xl rounded-2xl p-8 sm:p-10 space-y-7">
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-44 h-28 flex items-center justify-center">
                            <img src="images/logo.png" alt="Logo da empresa" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                {isRecoveryMode ? "Recuperar acesso" : "Bem-vindo de volta"}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {isRecoveryMode
                                    ? "Informe seu e-mail para receber o link"
                                    : "Entre com suas credenciais para continuar"}
                            </p>
                        </div>
                    </div>

                    {/* Formulário de Login */}
                    {!isRecoveryMode && (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div role="alert" className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                                    <span className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Campo de E-mail */}
                                <div>
                                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                                        E-MAIL
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600/60 hover:border-slate-300 dark:hover:border-white/20"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Campo de Senha */}
                                <div>
                                    <label htmlFor="password_hash" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                                        SENHA
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                        </div>
                                        <input
                                            id="password_hash"
                                            name="password_hash"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600/60 hover:border-slate-300 dark:hover:border-white/20"
                                            placeholder="••••••••"
                                            value={password_hash}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botão Entrar */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 shadow-soft-md hover:shadow-soft-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-soft-md transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Entrando…
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </button>

                            {/* Link para recuperação */}
                            <div className="text-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsRecoveryMode(true)}
                                    className="text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 font-medium text-sm"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </form>
                    )}

                    {isRecoveryMode && (
                        <form className="space-y-5" onSubmit={handleRecoverySubmit}>
                            {error && (
                                <div role="alert" className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                                    <span className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {message && (
                                <div role="status" className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                                    <span className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>{message}</span>
                                </div>
                            )}

                            <div>
                                <label htmlFor="recovery-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide">
                                    E-MAIL
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                    </div>
                                    <input
                                        id="recovery-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600/60 hover:border-slate-300 dark:hover:border-white/20"
                                        placeholder="seu@email.com"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 shadow-soft-md hover:shadow-soft-lg transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Enviar link de recuperação
                            </button>

                            <div className="text-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(false);
                                        setError("");
                                        setMessage("");
                                    }}
                                    className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar ao login
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
                    © {new Date().getFullYear()} Sistema de Gestão Integrado
                </p>
            </div>
        </div>
    )
}
