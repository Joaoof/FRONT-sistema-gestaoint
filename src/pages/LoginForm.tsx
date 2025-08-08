import type React from "react"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, ArrowLeft } from "lucide-react"

export const LoginForm = () => {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false); // Controle da tela
    const [email, setEmail] = useState<string>("")
    const [password_hash, setPassword] = useState<string>("")
    const { login, isLoading } = useAuth()
    const [message, setMessage] = useState<string>("");
    const [recoveryEmail, setRecoveryEmail] = useState<string>(""); // Para recuperação
    const [error, setError] = useState<string>("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Limpa erro anterior
        await login(email, password_hash);
        navigate('/dashboard', { replace: true });
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="rounded-3xl p-8 space-y-8">
                    {/* Logo - Replace with your own */}
                    <div className="flex justify-center">
                        <div className="w-56 h-36 flex items-center justify -center">
                            <img
                                src="images/logo.png" // substitui pelo caminho real da sua imagem
                                alt="Logo da empresa"
                            />
                        </div>
                    </div>


                    {/* Formulário de Login */}
                    {!isRecoveryMode && (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Campo de E-mail */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="E-mail"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Campo de Senha */}
                                <div>
                                    <label htmlFor="password_hash" className="block text-sm font-bold text-gray-700 mb-2">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password_hash"
                                            name="password_hash"
                                            type="password"
                                            required
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="Senha"
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
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8H4z"
                                            ></path>
                                        </svg>
                                        Entrando...
                                    </div>
                                ) : (
                                    "Entrar"
                                )}
                            </button>

                            {/* Link para recuperação */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsRecoveryMode(true)}
                                    className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </form>
                    )}

                    {isRecoveryMode && (
                        <form className="space-y-6" onSubmit={handleRecoverySubmit}>
                            {/* Mensagens */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}
                            {message && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                                    {message}
                                </div>
                            )}

                            <div>
                                <label htmlFor="recovery-email" className="block text-sm font-bold text-gray-700 mb-2">
                                    E-mail
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="recovery-email"
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        placeholder="Seu e-mail"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Botão Enviar */}
                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Enviar Link de Recuperação
                            </button>

                            {/* Voltar ao login */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(false);
                                        setError("");
                                        setMessage("");
                                    }}
                                    className="flex items-center justify-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar ao login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}