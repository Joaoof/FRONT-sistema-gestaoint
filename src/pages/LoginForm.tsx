import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, ArrowLeft, RotateCcw } from "lucide-react"
import { generateClassicCaptcha } from "../hooks/generateClassicCaptcha"


export const LoginForm = () => {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false)
    const [email, setEmail] = useState<string>("")
    const [password_hash, setPassword] = useState<string>("")
    const { login, isLoading, isAuthenticated } = useAuth()
    const [message, setMessage] = useState<string>("")
    const [recoveryEmail, setRecoveryEmail] = useState<string>("")
    const [error, setError] = useState<string>("")

    // CAPTCHA states
    const [captchaCode, setCaptchaCode] = useState<string>("")
    const [captchaImage, setCaptchaImage] = useState<string>("")
    const [captchaInput, setCaptchaInput] = useState<string>("")
    const [isCaptchaValid, setIsCaptchaValid] = useState<boolean>(false)

    const navigate = useNavigate()

    // Função para gerar código CAPTCHA clássico
    const generateCaptcha = () => {
        const { code, image } = generateClassicCaptcha()
        setCaptchaCode(code)
        setCaptchaImage(image)
        setCaptchaInput("")
        setIsCaptchaValid(false)
    }

    // Gerar CAPTCHA quando entrar na tela de login
    useEffect(() => {
        if (!isRecoveryMode) {
            generateCaptcha()
        }
    }, [isRecoveryMode])

    // Validar CAPTCHA
    const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase()
        setCaptchaInput(value)
        setIsCaptchaValid(value === captchaCode)
    }

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard", { replace: true })
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Validar CAPTCHA antes de fazer login
        if (!isCaptchaValid) {
            setError("Por favor, complete o CAPTCHA corretamente.")
            return
        }

        try {
            await login(email, password_hash)
        } catch (err) {
            console.error("Erro na submissão do login:", err)
        }
    }

    const handleRecoverySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")

        if (!recoveryEmail || !recoveryEmail.includes("@")) {
            setError("Por favor, insira um e-mail válido.")
            return
        }

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            setMessage("Um link de recuperação foi enviado para seu e-mail.")
            setRecoveryEmail("")
        } catch {
            setError("Falha ao enviar e-mail. Tente novamente.")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br py-12 px-4 sm:px-6 lg:px-8 font-poppins">
            <div className="max-w-md w-full">
                <div className="rounded-3xl p-8 space-y-8 font-poppins">
                    {/* Logo */}
                    <div className="flex justify-center">
                        <div className="w-56 h-36 flex items-center justify-center">
                            <img
                                src="images/logo.png"
                                alt="Logo da empresa"
                            />
                        </div>
                    </div>

                    {/* Formulário de Login */}
                    {!isRecoveryMode && (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-poppins">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Campo de E-mail */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 font-poppins">
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
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-poppins"
                                            placeholder="E-mail"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Campo de Senha */}
                                <div>
                                    <label htmlFor="password_hash" className="block text-sm font-bold text-gray-700 mb-2 font-poppins">
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
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-poppins"
                                            placeholder="Senha"
                                            value={password_hash}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* CAPTCHA Clássico */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 font-poppins">
                                        CAPTCHA de Segurança
                                    </label>
                                    <div className="space-y-3">
                                        {/* Display do CAPTCHA */}
                                        <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 border-2 border-gray-300 rounded-xl">
                                            <div className="flex-1">
                                                {captchaImage && (
                                                    <img
                                                        src={captchaImage}
                                                        alt="CAPTCHA"
                                                        className="w-full h-16 rounded-lg border border-gray-200 bg-white"
                                                    />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => generateCaptcha()}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                                                title="Regenerar CAPTCHA"
                                            >
                                                <RotateCcw className="h-5 w-5 text-gray-600" />
                                            </button>
                                        </div>

                                        {/* Input do CAPTCHA */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={captchaInput}
                                                onChange={handleCaptchaChange}
                                                placeholder="Digite o código acima"
                                                maxLength={6}
                                                className={`block w-full px-3 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all font-poppins uppercase tracking-widest ${captchaInput === ""
                                                    ? "border-gray-200 focus:ring-purple-500"
                                                    : isCaptchaValid
                                                        ? "border-green-500 focus:ring-green-500 bg-green-50"
                                                        : "border-red-500 focus:ring-red-500 bg-red-50"
                                                    }`}
                                            />
                                            {captchaInput !== "" && (
                                                <div className={`absolute right-3 top-3 text-sm font-poppins ${isCaptchaValid ? "text-green-600" : "text-red-600"}`}>
                                                    {isCaptchaValid ? "✓" : "✗"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botão Entrar */}
                            <button
                                type="submit"
                                disabled={isLoading || !isCaptchaValid}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] font-poppins"
                            >
                                {isLoading ? (
                                    <div className="flex items-center font-poppins">
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
                                    className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors font-poppins"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </form>
                    )}

                    {isRecoveryMode && (
                        <form className="space-y-6" onSubmit={handleRecoverySubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-poppins">
                                    {error}
                                </div>
                            )}
                            {message && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-poppins">
                                    {message}
                                </div>
                            )}

                            <div>
                                <label htmlFor="recovery-email" className="block text-sm font-bold text-gray-700 mb-2 font-poppins">
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
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-poppins"
                                        placeholder="Seu e-mail"
                                        value={recoveryEmail}
                                        onChange={(e) => setRecoveryEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors font-poppins"
                            >
                                Enviar Link de Recuperação
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRecoveryMode(false)
                                        setError("")
                                        setMessage("")
                                    }}
                                    className="flex items-center justify-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors font-poppins"
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