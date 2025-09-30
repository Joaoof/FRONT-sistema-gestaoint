"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { DollarSign, Save, ArrowLeftRight, PlusCircle, CreditCard, Database, Banknote } from "lucide-react"
import { apolloClient } from "../lib/apollo-client"
import { CREATE_CASH_MOVEMENT } from "../graphql/mutations/mutations"
import { getGraphQLErrorMessages } from "../utils/getGraphQLErrorMessage"
import { getUserIdFromToken } from "../utils/getToken"
import { formatLocalDateTime, parseLocalDateTime } from "../utils/formatDate"
import { GET_CASH_MOVEMENTS } from "../graphql/queries/queries"

// Mapeamento para backend (Prisma/GraphQL)
const movementTypeMap = {
    venda: "ENTRY",
    troco: "ENTRY",
    outros_entrada: "ENTRY",
    despesa: "EXIT",
    saque: "EXIT",
    pagamento: "EXIT",
} as const

const categoryMap = {
    venda: "SALE",
    troco: "CHANGE",
    outros_entrada: "OTHER_IN",
    despesa: "EXPENSE",
    saque: "WITHDRAWAL",
    pagamento: "PAYMENT",
} as const

type MovementType = keyof typeof movementTypeMap

export const CashMovementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState({
        type: "venda" as MovementType,
        value: "",
        description: "",
        date: formatLocalDateTime(new Date()),
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleTypeChange = (type: MovementType) => {
        setFormData((prev) => ({
            ...prev,
            type,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const value = Number.parseFloat(formData.value)

        const token = localStorage.getItem("accessToken")
        if (!token) {
            toast.error("Sessão expirada. Faça login novamente.")
            setError("Sem autenticação")
            setLoading(false)
            return
        }

        const userId = getUserIdFromToken()
        if (!userId) {
            toast.error("Usuário inválido. Faça login novamente.")
            setError("ID de usuário não encontrado.")
            setLoading(false)
            return
        }

        if (!formData.value || isNaN(value) || value <= 0) {
            toast.error("O valor deve ser maior que zero.")
            setLoading(false)
            return
        }

        if (!formData.description.trim()) {
            toast.error("A descrição é obrigatória.")
            setLoading(false)
            return
        }

        try {
            const input = {
                value,
                description: formData.description.trim(),
                date: parseLocalDateTime(formData.date),
                type: movementTypeMap[formData.type],
                category: categoryMap[formData.type],
            }

            const response = await apolloClient.mutate({
                mutation: CREATE_CASH_MOVEMENT,
                variables: { input },
                refetchQueries: [{ query: GET_CASH_MOVEMENTS }],
                awaitRefetchQueries: true,
            })

            console.log(response)

            if (response.errors && response.errors.length > 0) {
                const messages = response.errors.flatMap(({ message, extensions }: any) => {
                    const issues = extensions?.issues
                    if (Array.isArray(issues)) return issues.map((i: any) => i.message)
                    return [message]
                })

                const deduped = Array.from(new Set(messages))

                deduped.forEach((msg) => {
                    const cleanMsg = msg.replace(/,$/, "").trim()
                    toast.error(cleanMsg)
                })

                setError(deduped.join(" • "))
                return
            }

            const result = response.data?.createCashMovement.message

            console.log(result)

            if (!result || result.success === false) {
                const errorMsg = result?.message || "Falha ao registrar movimentação."
                toast.error(errorMsg)
                setError(errorMsg)
                return
            }

            toast.success(result || "Movimentação registrada com sucesso!")
            setFormData({
                type: "venda",
                value: "",
                description: "",
                date: new Date().toISOString().slice(0, 16),
            })

            onSuccess?.()
        } catch (err: any) {
            console.log("🔴 Erro capturado no catch:", err)
            if (err.networkError) {
                console.log("🌐 Network Error:", err.networkError)
            }
            if (err.graphQLErrors) {
                console.log("🛠 GraphQL Errors:", err.graphQLErrors)
            }
            const messages = getGraphQLErrorMessages(err)
            messages.forEach((msg: any) => toast.error(msg))
            setError(messages.join(" • "))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white border border-slate-300 shadow-md">
            <div className="bg-slate-700 px-6 py-4 border-b border-slate-300">
                <h2 className="text-lg font-semibold text-white tracking-wide">REGISTRO DE MOVIMENTAÇÃO FINANCEIRA</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Transaction Type */}
                    <div className="space-y-4">
                        <div className="border border-slate-300 bg-slate-50">
                            <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Tipo de Entrada</h3>
                            </div>
                            <div className="p-4 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("venda")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-colors ${formData.type === "venda"
                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    disabled={loading}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.type === "venda" ? "border-blue-600" : "border-slate-400"
                                            }`}
                                    >
                                        {formData.type === "venda" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <DollarSign className="w-5 h-5" />
                                    <span className="text-sm font-medium">Venda</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("troco")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-colors ${formData.type === "troco"
                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    disabled={loading}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.type === "troco" ? "border-blue-600" : "border-slate-400"
                                            }`}
                                    >
                                        {formData.type === "troco" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <ArrowLeftRight className="w-5 h-5" />
                                    <span className="text-sm font-medium">Troco</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("outros_entrada")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-colors ${formData.type === "outros_entrada"
                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    disabled={loading}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.type === "outros_entrada" ? "border-blue-600" : "border-slate-400"
                                            }`}
                                    >
                                        {formData.type === "outros_entrada" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <PlusCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Outros</span>
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-300 bg-slate-50">
                            <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Tipo de Saída</h3>
                            </div>
                            <div className="p-4 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("despesa")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-colors ${formData.type === "despesa"
                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    disabled={loading}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.type === "despesa" ? "border-blue-600" : "border-slate-400"
                                            }`}
                                    >
                                        {formData.type === "despesa" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <Banknote className="w-5 h-5" />
                                    <span className="text-sm font-medium">Despesa</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("saque")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-colors ${formData.type === "saque"
                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    disabled={loading}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.type === "saque" ? "border-blue-600" : "border-slate-400"
                                            }`}
                                    >
                                        {formData.type === "saque" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <Database className="w-5 h-5" />
                                    <span className="text-sm font-medium">Saque</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTypeChange("pagamento")}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-colors ${formData.type === "pagamento"
                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    disabled={loading}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.type === "pagamento" ? "border-blue-600" : "border-slate-400"
                                            }`}
                                    >
                                        {formData.type === "pagamento" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-sm font-medium">Pagamento</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="space-y-4">
                        <div className="border border-slate-300 bg-slate-50">
                            <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Dados da Movimentação</h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label htmlFor="value" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                                        Valor (R$) *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="number"
                                            id="value"
                                            name="value"
                                            step="0.01"
                                            min="0.01"
                                            value={formData.value}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                            placeholder="0,00"
                                            className="w-full pl-10 px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="date" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                                        Data e Hora *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                                        Descrição *
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        rows={5}
                                        className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm resize-none"
                                        placeholder="Informe os detalhes da movimentação..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-300 flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold uppercase tracking-wide"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Registrar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
