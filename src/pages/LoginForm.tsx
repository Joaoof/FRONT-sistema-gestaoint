import type React from "react"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export const LoginForm = () => {
    const [email, setEmail] = useState<string>("")
    const [password_hash, setPassword] = useState<string>("")
    const { login, isLoading, error } = useAuth()

    const navigate = useNavigate();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password_hash);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            // Erro já é tratado no `AuthProvider`, mas pode adicionar fallback
            console.error('Erro no login:', err);
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Imagem acima do título */}
                <div className="flex justify-center">
                    <img
                        src="images/logo.png"
                        alt="Logo"
                        className="h-56 w-auto sm:h-30"
                    />
                </div>

                <div>
                    <h2 className="mt-6 text-center text-3xl font-serif text-gray-900">Entre na sua conta</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">Sistema de Estoque Multi-Empresa</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password_hash" className="sr-only">
                                Senha
                            </label>
                            <input
                                id="password_hash"
                                name="password_hash"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Senha"
                                value={password_hash}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
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
                            ) : (
                                "Entrar"
                            )}

                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}