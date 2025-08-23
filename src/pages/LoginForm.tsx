import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";

export const LoginForm = () => {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [email, setEmail] = useState("");
    const [password_hash, setPassword] = useState("");
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    // 🔍 Auto-focus e teclado
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email || !password_hash) return;

        // ✅ Inicia login
        await login(email, password_hash);
        // ✅ Redireciona imediatamente — o loading já está no botão
        navigate("/dashboard", { replace: true });
    };

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!recoveryEmail || !recoveryEmail.includes("@")) {
            setError("E-mail inválido.");
            return;
        }

        try {
            // Simulação: substitua pela API real
            await new Promise((resolve) => setTimeout(resolve, 1200));
            setMessage("Link de recuperação enviado.");
            setRecoveryEmail("");
        } catch {
            setError("Falha ao enviar. Tente novamente.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-fade-in">
                    {/* Logo */}
                    <div className="flex justify-center">
                        <img
                            src="images/logo.png"
                            alt="Logo"
                            className="w-56 h-36 object-contain"
                        />
                    </div>

                    {/* Formulário de Login */}
                    {!isRecoveryMode ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            ref={emailRef}
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            autoFocus
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="seu@email.com"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") passwordRef.current?.focus();
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Senha */}
                                <div>
                                    <label htmlFor="password_hash" className="block text-sm font-bold text-gray-700 mb-2">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            ref={passwordRef}
                                            id="password_hash"
                                            name="password_hash"
                                            type="password"
                                            required
                                            value={password_hash}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSubmit(e);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botão Entrar */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Entrando...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsRecoveryMode(true)}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Formulário de Recuperação */
                        <form onSubmit={handleRecoverySubmit} className="space-y-6">
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
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        id="recovery-email"
                                        type="email"
                                        required
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Enviar Link
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(false);
                                        setError("");
                                        setMessage("");
                                    }}
                                    className="flex items-center justify-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium mx-auto"
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
    );
};