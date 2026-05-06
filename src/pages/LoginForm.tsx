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
        <div className="relative min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {/* grid pattern sutil — assinatura SaaS, não decoração */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgb(15 23 42 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.04) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 hidden dark:block opacity-[0.4]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
                }}
            />

            <div className="relative max-w-[520px] w-full animate-fade-in-up">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-10 sm:p-12 space-y-8 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
                    {/* Logo + título */}
                    <div className="flex flex-col items-center gap-6 pb-2">
                        <div className="h-16 flex items-center justify-center">
                            <img src="images/logo.png" alt="Logo" className="max-h-full max-w-[220px] object-contain" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight">
                                {isRecoveryMode ? "Recuperar acesso" : "Entrar na sua conta"}
                            </h1>
                            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
                                {isRecoveryMode
                                    ? "Enviaremos um link de recuperação para o seu e-mail"
                                    : "Use suas credenciais para continuar"}
                            </p>
                        </div>
                    </div>

                    {/* Formulário de Login */}
                    {!isRecoveryMode && (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div role="alert" className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 rounded-lg text-[13px]">
                                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Campo de E-mail */}
                                <div>
                                    <label htmlFor="email" className="block text-[13.5px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        E-mail
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
                                            className="block w-full pl-11 pr-4 py-3.5 text-[15px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 focus:border-brand-600 dark:focus:border-brand-400 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Campo de Senha */}
                                <div>
                                    <label htmlFor="password_hash" className="block text-[13.5px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Senha
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-[20px] w-[20px] text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                        </div>
                                        <input
                                            id="password_hash"
                                            name="password_hash"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            className="block w-full pl-11 pr-4 py-3.5 text-[15px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 focus:border-brand-600 dark:focus:border-brand-400 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
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
                                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 text-[15px] font-semibold rounded-xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                    className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </form>
                    )}

                    {isRecoveryMode && (
                        <form className="space-y-5" onSubmit={handleRecoverySubmit}>
                            {error && (
                                <div role="alert" className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 rounded-lg text-[13px]">
                                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {message && (
                                <div role="status" className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3.5 py-2.5 rounded-lg text-[13px]">
                                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                    <span>{message}</span>
                                </div>
                            )}

                            <div>
                                <label htmlFor="recovery-email" className="block text-[13.5px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    E-mail
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-[20px] w-[20px] text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                    </div>
                                    <input
                                        id="recovery-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        className="block w-full pl-11 pr-4 py-3.5 text-[15px] bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 focus:border-brand-600 dark:focus:border-brand-400 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                                        placeholder="seu@email.com"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 px-4 text-[15px] font-semibold rounded-xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
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
                                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Voltar ao login
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-[11.5px] text-slate-400 dark:text-slate-600 mt-5">
                    © {new Date().getFullYear()} Sistema de Gestão Integrado
                </p>
            </div>
        </div>
    )
}
