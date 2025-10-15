import React from "react"
import { useAuth } from "../contexts/AuthContext"
import { useModules } from "../contexts/ModuleContext" // ✅ Importa o novo hook

export const CustomAccessDeniedFallback: React.FC = () => {
    const { user } = useAuth()
    const { modules } = useModules()

    const firstName = user?.email ? user.email.split('@')[0] : 'usuário'

    const availableModules = modules.filter(m => Array(m.isActive))

    console.log('SEUS MODULOS DISPONIVEIS ------------------------------------------------>', availableModules);


    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white shadow-lg rounded-xl max-w-lg mx-auto mt-10">
            <h1 className="text-2xl font-bold text-green-600 mb-4">
                Bem-vindo(a), {firstName}!
            </h1>
            <p className="text-gray-700 text-center mb-6">
                Você não tem acesso a este módulo ou página específica.
                <br />
                Veja seus módulos disponíveis abaixo:
            </p>

            {availableModules.length > 0 ? (
                <div className="w-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Módulos Acessíveis:</h2>
                    <ul className="list-disc list-inside text-left space-y-1 pl-5">
                        {availableModules.map((module) => (
                            <li key={module.module_key} className="text-blue-600">
                                {module.name || module.module_key}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-red-500 font-medium">Nenhum módulo ativo encontrado no seu plano.</p>
            )}
        </div>
    )
}
