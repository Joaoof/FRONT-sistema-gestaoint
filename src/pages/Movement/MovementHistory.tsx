"use client"

import { useState } from "react"
import {
    Search,
    Filter,
    DollarSign,
    Banknote,
    Download,
    Edit,
    X,
    Check,
    MoreVertical,
    Eye,
    FileText,
    Sparkles,
    CalendarDays,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUp,
    ArrowDown,
    TrendingUp, // Novo ícone para Saldo positivo
    TrendingDown, // Novo ícone para Saldo negativo
} from "lucide-react"
import { useQuery, useMutation } from "@apollo/client"
import { GET_CASH_MOVEMENTS, CREATE_CASH_MOVEMENT, UPDATE_CASH_MOVEMENT } from "../../graphql/queries/queries"
import { generateMovementPdfDoc } from "../../utils/generatePDF"
import type { CategoryType, Movement, MovementType } from "../../types"
import { RotateCcw } from "lucide-react"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

import * as Dialog from "@radix-ui/react-dialog"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

import CountUp from "react-countup"
import { toast } from "sonner"
import { DELETE_CASH_MOVEMENT } from "../../graphql/mutations/mutations"
import { useCompany } from "../../contexts/CompanyContext"

type FilterType = "ALL" | "ENTRY" | "EXIT" | "SALE" | "CHANGE" | "OTHER_IN" | "EXPENSE" | "WITHDRAWAL" | "PAYMENT"

type Subtype = "SALE" | "CHANGE" | "OTHER_IN" | "EXPENSE" | "WITHDRAWAL" | "PAYMENT"

type SortField = "date" | "value" | "description"
type SortOrder = "asc" | "desc"

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
    }).format(value)
}

const mapCategoryToSubtype = (category: string): Subtype => {
    const map: Record<string, Subtype> = {
        VENDA: "SALE",
        TROCO: "CHANGE",
        OUTROS_ENTRADA: "OTHER_IN",
        DESPESA: "EXPENSE",
        SAQUE: "WITHDRAWAL",
        PAGAMENTO: "PAYMENT",
        SALE: "SALE",
        CHANGE: "CHANGE",
        OTHER_IN: "OTHER_IN",
        EXPENSE: "EXPENSE",
        WITHDRAWAL: "WITHDRAWAL",
        PAYMENT: "PAYMENT",
    }
    const normalizedCategory = category.toUpperCase().trim()
    return map[normalizedCategory] || "EXPENSE"
}

const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return isNaN(date.getTime())
        ? ""
        : date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        })
}

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Sem data"
    const date = new Date(dateString)
    return isNaN(date.getTime())
        ? "Data inválida"
        : date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
}
const toDateInputString = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    // Usa os componentes da hora local (do navegador)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

const toTimeInputString = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    // Usa os componentes da hora local (do navegador)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
}

const combineDateTime = (datePart: string, timePart: string): string => {
    if (!datePart) return ""
    // Corrigido para ISO sem Z para evitar problemas de fuso horário na data.
    // A função toTimeInputString já usa a hora local, então a ISO String deve ser sem Z.
    const isoString = `${datePart}T${timePart || "00:00"}:00`

    return isoString
}

// REMOVIDA A FUNÇÃO 'generateMovementPdfDoc' AUXILIAR DO ESCOPO GLOBAL
// e movida para dentro de MovementHistory (renomeada para generateMovementsPdf)

export function MovementHistory() {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<FilterType>("ALL")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [valueMin, setValueMin] = useState("")
    const [valueMax, setValueMax] = useState("")
    const [showFilters, setShowFilters] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [sortField, setSortField] = useState<SortField>("date")
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

    const [quickDateFilter, setQuickDateFilter] = useState<string>("")

    // Estados para os Modais de Ação
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
    const [viewingMovement, setViewingMovement] = useState<Movement | null>(null)
    const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const { data, loading, error, refetch } = useQuery(GET_CASH_MOVEMENTS, {
        fetchPolicy: "cache-first",
        notifyOnNetworkStatusChange: true,
    })

    const { company, user } = useCompany()
    const companyInfo = company ?? {}
    const userName = user?.name ?? "Usuário Desconhecido"
    const generateMovementsPdf = (
        allMovements: Movement[],
        filter: string, // 'all', 'YYYY', or 'YYYY-MM'
    ) => {
        let filteredMovements = allMovements
        let reportTitle = "RELATÓRIO DE MOVIMENTAÇÕES"
        let filename = "relatorio-movimentacoes-geral.pdf"
        if (filter === "all") {
            // Use all movements, default title/filename
        } else {
            const [year, month] = filter.split("-")

            filteredMovements = allMovements.filter((m) => {
                if (!m.date) return false
                const d = new Date(m.date)

                // Trata as datas como locais para filtrar o YYYY/MM
                const mYear = d.getFullYear().toString()
                const mMonth = (d.getMonth() + 1).toString().padStart(2, "0")

                if (month) {
                    // Filter by specific month (YYYY-MM)
                    return mYear === year && mMonth === month
                } else {
                    // Filter by year only (YYYY)
                    return mYear === year
                }
            })

            if (month) {
                const monthName = new Date(+year, +month - 1, 1).toLocaleDateString("pt-BR", { month: "long" })
                reportTitle = `RELATÓRIO MENSAL - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`
                filename = `relatorio-mensal-${month}-${year}.pdf`
            } else {
                reportTitle = `RELATÓRIO ANUAL - ${year}`
                filename = `relatorio-anual-${year}.pdf`
            }
        }

        if (filteredMovements.length === 0) {
            toast.info("Não há movimentações para exportar para este período.")
            return
        }

        // Chamada CORRIGIDA com os 5 argumentos
        generateMovementPdfDoc(
            filteredMovements,
            filename,
            reportTitle,
            companyInfo, // Context
            userName, // Context
        )
        toast.success(`Relatório "${reportTitle}" gerado com sucesso!`)
    }

    // Função original corrigida para PDF Diário
    const generateTodayPdf = (movements: Movement[]) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayMovements = movements.filter((m) => {
            if (!m.date) return false
            const movementDate = new Date(m.date)
            // Compara as datas como locais (ignorando o fuso se m.date for ISO sem Z)
            return movementDate.getTime() >= today.getTime() && movementDate.getTime() < tomorrow.getTime()
        })

        if (todayMovements.length === 0) {
            toast.info("Não há movimentações para exportar na data de hoje.")
            return
        }

        const dateString = toDateInputString(new Date().toISOString())
        generateMovementPdfDoc(
            todayMovements,
            `relatorio-diario-${dateString}.pdf`,
            "RELATÓRIO DIÁRIO DE MOVIMENTAÇÕES",
            companyInfo, // Context
            userName, // Context
        )

        toast.success("Relatório do dia gerado com sucesso!")
    }

    const [createMovement] = useMutation(CREATE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS],
    })
    const [updateMovement] = useMutation(UPDATE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS],
        onCompleted: () => toast.success("Movimentação atualizada!"),
        onError: (err) => toast.error("Erro ao atualizar: " + err.message),
    })

    const [deleteMovement, { loading: isDeleting }] = useMutation(DELETE_CASH_MOVEMENT, {
        refetchQueries: [GET_CASH_MOVEMENTS, "dashboardStats"],
        onCompleted: () => { },
        onError: (err) => toast.error("Erro ao deletar: " + err.message),
    })

    const openViewModal = (movement: Movement) => setViewingMovement(movement)
    const openEditModal = (movement: Movement) => setEditingMovement(movement)
    const openDeleteModal = (movement: Movement) => setDeletingMovement(movement)

    const confirmDelete = async () => {
        if (!deletingMovement) return

        setDeletingId(deletingMovement.id)
        const description = deletingMovement.description
        try {
            await deleteMovement({ variables: { movementId: deletingMovement.id } })
            toast.success(`Movimento "${description}" deletado com sucesso!`)
        } catch (e: any) {
        } finally {
            setDeletingId(null)
            setDeletingMovement(null)
        }
    }

    const movements: Movement[] = (data?.cashMovements || []).map((m: Movement) => ({
        id: m.id,
        value: Number(m.value),
        description: m.description,
        type: m.type,
        category: mapCategoryToSubtype(m.category),
        date: m.date,
    }))

    const applyQuickDateFilter = (movements: Movement[]) => {
        if (!quickDateFilter) return movements

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        switch (quickDateFilter) {
            case "today":
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= today
                })
            case "yesterday":
                const yesterday = new Date(today)
                yesterday.setDate(today.getDate() - 1)
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= yesterday && d < today
                })
            case "this-week":
                const weekStart = new Date(today)
                weekStart.setDate(today.getDate() - today.getDay())
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= weekStart
                })
            case "this-month":
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= monthStart
                })
            case "last-month":
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= lastMonthStart && d < lastMonthEnd
                })
            case "last-7-days":
                const last7Days = new Date(today)
                last7Days.setDate(today.getDate() - 7)
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= last7Days
                })
            case "last-30-days":
                const last30Days = new Date(today)
                last30Days.setDate(today.getDate() - 30)
                return movements.filter((m) => {
                    if (!m.date) return false
                    const d = new Date(m.date)
                    return d >= last30Days
                })
            default:
                return movements
        }
    }

    const filtered = applyQuickDateFilter(movements).filter((m) => {
        const matchesSearch = m.description.toLowerCase().includes(search.toLowerCase())

        const matchesFilter =
            filter === "ALL" ||
            (filter === "ENTRY" && m.type === "ENTRY") ||
            (filter === "EXIT" && m.type === "EXIT") ||
            (["SALE", "CHANGE", "OTHER_IN", "EXPENSE", "WITHDRAWAL", "PAYMENT"].includes(filter as string) &&
                mapCategoryToSubtype(m.category as string) === filter)

        const date = m.date ? new Date(m.date) : null
        const from = dateFrom ? new Date(dateFrom) : null
        const to = dateTo ? new Date(dateTo) : null

        const matchesDate = !from && !to ? true : date && (!from || date >= from) && (!to || date <= to)

        const min = valueMin ? Number.parseFloat(valueMin) : Number.NEGATIVE_INFINITY
        const max = valueMax ? Number.parseFloat(valueMax) : Number.POSITIVE_INFINITY
        const matchesValue = m.value >= min && m.value <= max

        return matchesSearch && matchesFilter && matchesDate && matchesValue
    })

    const sorted = [...filtered].sort((a, b) => {
        let comparison = 0

        switch (sortField) {
            case "date":
                const dateA = a.date ? new Date(a.date).getTime() : 0
                const dateB = b.date ? new Date(b.date).getTime() : 0
                comparison = dateA - dateB
                break
            case "value":
                comparison = a.value - b.value
                break
            case "description":
                comparison = a.description.localeCompare(b.description)
                break
        }

        return sortOrder === "asc" ? comparison : -comparison
    })

    const totalPages = Math.ceil(sorted.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedMovements = sorted.slice(startIndex, endIndex)

    const handleFilterChange = (newFilter: FilterType) => {
        setFilter(newFilter)
        setCurrentPage(1)
    }

    const handleQuickDateFilterChange = (value: string) => {
        setQuickDateFilter(value)
        setDateFrom("")
        setDateTo("")
        setCurrentPage(1)
    }

    const handleSortChange = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortOrder("desc")
        }
        setCurrentPage(1)
    }

    const totalEntries = filtered.filter((m) => m.type === "ENTRY").reduce((sum, m) => sum + m.value, 0)

    const totalExits = filtered.filter((m) => m.type === "EXIT").reduce((sum, m) => sum + m.value, 0)

    const balance = totalEntries - totalExits

    const typeLabels = {
        SALE: "Venda",
        CHANGE: "Troco",
        OTHER_IN: "Outros (Entrada)",
        EXPENSE: "Despesa",
        WITHDRAWAL: "Saque",
        PAYMENT: "Pagamento",
    }

    const handleAdjustment = (type: "ENTRY" | "EXIT" | "ADJUSTMENT") => {
        const rawValue = prompt(`Informe o valor do ajuste:`)
        const value = Number.parseFloat(rawValue || "")
        if (isNaN(value)) return toast.error("Valor inválido.")

        const description = prompt("Descrição (opcional):") || "Ajuste"

        const absValue = Math.abs(value)
        const movementType = value >= 0 ? "ENTRY" : "EXIT"
        const category = (() => {
            if (type === "ADJUSTMENT") return value >= 0 ? "OTHER_IN" : "EXPENSE"
            return type === "ENTRY" ? "OTHER_IN" : "EXPENSE"
        })()

        createMovement({
            variables: {
                input: {
                    value: absValue,
                    description,
                    type: movementType,
                    category,
                    date: new Date().toISOString(),
                },
            },
        }).then(
            () => toast.success("Ajuste realizado!"),
            (err) => toast.error("Erro: " + err.message),
        )
    }

    const handleReverse = (movementToReverse: Movement) => {
        if (
            !window.confirm(
                `Confirma o estorno de ${formatCurrency(movementToReverse.value)} (${movementToReverse.description})? Um novo lançamento será criado.`,
            )
        ) {
            return
        }
        const isEntry = movementToReverse.type === "ENTRY"
        const reverseType = isEntry ? "EXIT" : "ENTRY"

        const reverseCategory = isEntry ? "EXPENSE" : "OTHER_IN"

        createMovement({
            variables: {
                input: {
                    value: Math.abs(movementToReverse.value),
                    description: `ESTORNO: ${movementToReverse.description} (Original: ${movementToReverse.id})`,
                    type: reverseType,
                    category: reverseCategory,
                    date: new Date().toISOString(),
                },
            },
        }).then(
            () => toast.success("Estorno registrado com sucesso!"),
            (err) => toast.error("Funcionalidade em preparo: " + err.message),
        )
    }

    const saveEdit = async () => {
        if (!editingMovement) return

        await updateMovement({
            variables: {
                movementId: editingMovement.id,
                movementUpdateCash: {
                    description: editingMovement.description,
                    value: Math.abs(editingMovement.value),
                    type: editingMovement.type,
                    category: editingMovement.category,
                    date: editingMovement.date,
                },
            },
        })
        setEditingMovement(null)
    }

    if (loading) return <LoadingSkeleton />

    if (error) return <div className="p-8 text-center text-red-600">Erro: {error.message}</div>

    return (
        <>
            <div className="space-y-8 px-6 py-6 bg-gray-50 min-h-screen w-full font-sans">
                <div className="w-full relative pb-10">
                    <h1 className="text-4xl font-serif text-gray-900 mb-2">📋 Histórico de Movimentações</h1>
                    <p className="text-gray-600 font-sans">Controle completo das entradas e saídas do caixa.</p>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={loading}
                        className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm disabled:opacity-60 rounded-xl text-gray-700 text-sm font-sans font-medium transition-all duration-200 group"
                        aria-label="Atualizar dados"
                    >
                        <RotateCcw
                            className={`h-5 w-5 transition-transform duration-300 ${loading ? "animate-spin text-[#780087]" : "group-hover:rotate-12 text-gray-600"
                                }`}
                        />
                        <span className="font-medium">{loading ? "Atualizando..." : "Atualizar"}</span>
                    </button>
                </div>

                {/* Metric Cards (Antigo Resumo) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Entradas"
                        value={totalEntries}
                        icon={<img src="https://cdn-icons-png.flaticon.com/512/2916/2916115.png" className="w-8 h-8" />}
                        bg="from-green-600 to-green-600"
                        text="text-green-100"
                        actionClick={() => handleAdjustment("ENTRY")}
                    />

                    <MetricCard
                        title="Saídas"
                        value={totalExits}
                        icon={<img src="https://cdn-icons-png.flaticon.com/256/2331/2331668.png" className="w-10 h-10" />}
                        bg="from-red-600 to-red-600"
                        text="text-red-100"
                        actionClick={() => handleAdjustment("EXIT")}
                    />

                    {/* Card de Saldo com tratamento de cor e ícone */}
                    <div className="bg-gradient-to-br from-blue-700 to-blue-700 rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-serif text-white">Saldo Atual</p>
                                <p className={`text-2xl font-bold ${balance >= 0 ? "text-white" : "text-white"}`}>
                                    <CountUp end={balance} decimal="," decimals={2} prefix="R$ " separator="." />
                                </p>
                            </div>
                            <div className={`p-3 ${balance >= 0} rounded-full text-white`}>
                                {balance >= 0 ? (
                                    <img src="https://png.pngtree.com/png-clipart/20230805/original/pngtree-payment-icon-circle-balance-commerce-vector-picture-image_9731293.png" className="w-10 h-10" />
                                ) : (
                                    <img src="https://cdn-icons-png.flaticon.com/512/334/334047.png" className="w-8 h-8" />
                                )}
                            </div>
                            <button
                                onClick={() => handleAdjustment("ADJUSTMENT")}
                                className="absolute top-2 right-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Fazer Ajuste de Saldo"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mini gráfico */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-300">
                    <h3 className="text-lg font-sans text-gray-800 mb-4">Resumo Financeiro</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: "Entradas", value: totalEntries, color: "#10b981" },
                                        { name: "Saídas", value: totalExits, color: "#ef4444" },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {[
                                        { name: "Entradas", value: totalEntries, color: "#10b981" },
                                        { name: "Saídas", value: totalExits, color: "#ef4444" },
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend formatter={(value: string, entry: any) => `${value}: ${formatCurrency(entry.payload.value)}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 font-sans">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar por descrição..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                        >
                            <Filter className="w-5 h-5" />
                            {showFilters ? "Ocultar" : "Filtros"}
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Filtros Rápidos de Data</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: "", label: "Todas as datas", icon: "📅" },
                                { value: "today", label: "Hoje", icon: "📆" },
                                { value: "yesterday", label: "Ontem", icon: "📋" },
                                { value: "this-week", label: "Esta semana", icon: "📊" },
                                { value: "last-7-days", label: "Últimos 7 dias", icon: "🗓️" },
                                { value: "this-month", label: "Este mês", icon: "📈" },
                                { value: "last-month", label: "Mês passado", icon: "📉" },
                                { value: "last-30-days", label: "Últimos 30 dias", icon: "🗂️" },
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => handleQuickDateFilterChange(f.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-sans font-medium transition ${quickDateFilter === f.value
                                        ? "bg-[#780087] text-white shadow-md"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {f.icon} {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtros rápidos em pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {[
                            { value: "ALL", label: "Todos", icon: "💸" },
                            { value: "ENTRY", label: "Entradas", icon: "➕" },
                            { value: "EXIT", label: "Saídas", icon: "➖" },
                            { value: "SALE", label: "Vendas", icon: "💰" },
                            { value: "EXPENSE", label: "Despesas", icon: "🧾" },
                            { value: "CHANGE", label: "Troco", icon: "💱" },
                            { value: "WITHDRAWAL", label: "Saques", icon: "🏧" },
                            { value: "PAYMENT", label: "Pagamentos", icon: "💳" },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => handleFilterChange(f.value as FilterType)}
                                className={`px-3 py-1 rounded-full text-sm font-sans font-medium transition ${filter === f.value ? "bg-[#780087] text-white" : "bg-gray-100 text-gray hover:bg-gray-200"
                                    }`}
                            >
                                {f.icon} {f.label}
                            </button>
                        ))}
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                                <select
                                    value={filter}
                                    onChange={(e) => handleFilterChange(e.target.value as FilterType)}
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="ENTRY">➕ Entradas</option>
                                    <option value="EXIT">➖ Saídas</option>
                                    <option value="SALE">💰 Vendas</option>
                                    <option value="CHANGE">💱 Troco</option>
                                    <option value="OTHER_IN">📦 Outros (Entrada)</option>
                                    <option value="EXPENSE">🧾 Despesas</option>
                                    <option value="WITHDRAWAL">🏧 Saques</option>
                                    <option value="PAYMENT">💳 Pagamentos</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value)
                                        setQuickDateFilter("")
                                        setCurrentPage(1)
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value)
                                        setQuickDateFilter("")
                                        setCurrentPage(1)
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    label="Valor Mín."
                                    value={valueMin}
                                    onChange={(v: string) => {
                                        setValueMin(v)
                                        setCurrentPage(1)
                                    }}
                                />
                                <Input
                                    label="Valor Máx."
                                    value={valueMax}
                                    onChange={(v: string) => {
                                        setValueMax(v)
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <ExportPdfDropdown
                        movements={movements}
                        generateAllPdf={generateMovementsPdf}
                        generateTodayPdf={generateTodayPdf}
                    />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-sans font-medium text-gray-700">Ordenar por:</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSortChange("date")}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-sans font-medium transition ${sortField === "date" ? "bg-[#780087] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        Data
                                        {sortField === "date" &&
                                            (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                    </button>
                                    <button
                                        onClick={() => handleSortChange("value")}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-sans font-medium transition ${sortField === "value" ? "bg-[#780087] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        Valor
                                        {sortField === "value" &&
                                            (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                    </button>
                                    <button
                                        onClick={() => handleSortChange("description")}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-sans font-medium transition ${sortField === "description"
                                            ? "bg-[#780087] text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        Descrição
                                        {sortField === "description" &&
                                            (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-sans font-medium text-gray-700">Itens por página:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-sans"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-4 font-sans">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, sorted.length)} de {sorted.length} movimentações
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto mt-8 bg-gray-50 rounded-xl border border-gray-200">
                        {paginatedMovements.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 font-sans">
                                <p className="text-lg">🔍 Nenhuma movimentação encontrada.</p>
                                <p className="text-sm mt-1">Ajuste os filtros.</p>
                            </div>
                        ) : (
                            <table className="w-full font-sans">
                                <thead className="bg-gradient-to-r from-[#780087] to-[#9d00b8] text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Data</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Descrição</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold">Valor</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {paginatedMovements.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-50 odd:bg-gray-50 transition-opacity duration-200">
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(m.date)}
                                                {m.date && (
                                                    <>
                                                        <br />
                                                        <span className="text-xs text-gray-500">{formatTime(m.date)}</span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.description}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                                                             ${m.type === "ENTRY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                                >
                                                    {typeLabels[mapCategoryToSubtype(m.category)]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 ${m.type === "ENTRY" ? "text-green-600" : "text-red-600"
                                                        }`}
                                                >
                                                    {m.type === "ENTRY" ? "+" : "-"} R$ {formatCurrency(m.value)}
                                                </span>
                                            </td>
                                            {/* NOVO: Coluna de Ações com Dropdown de 3 pontos */}
                                            <td className="px-6 py-4 text-sm text-center">
                                                <ActionsDropdown
                                                    movement={m}
                                                    onView={openViewModal}
                                                    onEdit={openEditModal}
                                                    onDelete={openDeleteModal}
                                                    onReverse={handleReverse}
                                                    isDeleting={deletingId === m.id}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600 font-sans">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    title="Primeira página"
                                >
                                    <ChevronsLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    title="Página anterior"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {/* Page numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 rounded-lg text-sm font-sans font-medium transition ${currentPage === pageNum
                                                    ? "bg-[#780087] text-white"
                                                    : "border border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    title="Próxima página"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    title="Última página"
                                >
                                    <ChevronsRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modais */}
            <EditModal
                movement={editingMovement}
                setMovement={setEditingMovement}
                onSave={saveEdit}
                onClose={() => setEditingMovement(null)}
            />
            <ViewModal movement={viewingMovement} onClose={() => setViewingMovement(null)} />
            <DeleteConfirmationModal
                movement={deletingMovement}
                onConfirm={confirmDelete}
                onClose={() => setDeletingMovement(null)}
                isDeleting={isDeleting || deletingId === deletingMovement?.id}
            />
        </>
    )
}

function ActionsDropdown({
    movement,
    onView,
    onEdit,
    onDelete,
    onReverse,
    isDeleting,
}: {
    movement: Movement
    onView: (m: Movement) => void
    onEdit: (m: Movement) => void
    onDelete: (m: Movement) => void
    onReverse: (m: Movement) => void // NOVO: Função para estornar
    isDeleting: boolean
}) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50 font-sans"
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <RotateCcw className="h-5 w-5 animate-spin text-red-500" />
                    ) : (
                        <MoreVertical className="w-5 h-5" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-32 bg-white rounded-lg shadow-xl border border-gray-200 p-1 z-50 font-sans">
                <DropdownMenu.Item
                    onClick={() => onView(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer rounded"
                >
                    <Eye className="w-4 h-4 text-[#780087]" /> Visualizar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onClick={() => onEdit(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer rounded"
                >
                    <Edit className="w-4 h-4 text-blue-600" /> Editar
                </DropdownMenu.Item>

                {/* NOVO ITEM: ESTORNAR MOVIMENTO */}
                <DropdownMenu.Item
                    onClick={() => onReverse(movement)} // Chama a nova função de estorno
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 cursor-pointer rounded"
                >
                    <RotateCcw className="w-4 h-4 text-yellow-600" /> Estornar Movimento
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 border-t border-gray-100" />

                <DropdownMenu.Item
                    onClick={() => onDelete(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded"
                >
                    <img
                        src={TRASH_ICON_URL || "/placeholder.svg"}
                        alt="Deletar"
                        className="w-4 h-4 object-contain invert brightness-0 transition-transform group-hover:animate-jump"
                    />
                    Deletar
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    )
}

const categoryImageMap: Record<Subtype, string> = {
    SALE: "https://cdn-icons-png.flaticon.com/512/5607/5607725.png", // Venda
    CHANGE: "https://cdn-icons-png.flaticon.com/512/1969/1969111.png", // Troco
    OTHER_IN: "https://cdn-icons-png.flaticon.com/512/7580/7580377.png", // Outros (Entrada)
    EXPENSE: "https://cdn-icons-png.flaticon.com/512/781/781760.png", // Despesa
    WITHDRAWAL: "https://cdn-icons-png.flaticon.com/512/11625/11625164.png", // Saque
    PAYMENT: "https://cdn-icons-png.flaticon.com/512/4564/4564998.png", // Pagamento
}

function ViewModal({ movement, onClose }: { movement: Movement | null; onClose: () => void }) {
    if (!movement) return null

    const typeLabels = {
        SALE: "Venda",
        CHANGE: "Troco",
        OTHER_IN: "Outros (Entrada)",
        EXPENSE: "Despesa",
        WITHDRAWAL: "Saque",
        PAYMENT: "Pagamento",
    }

    const categoryLabel = typeLabels[mapCategoryToSubtype(movement.category)]
    const categoryIconUrl = categoryImageMap[mapCategoryToSubtype(movement.category)]

    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-50 font-sans">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <img src={categoryIconUrl || "/placeholder.svg"} alt="Categoria" className="w-6 h-6 object-contain" />{" "}
                        Detalhes da Movimentação
                    </Dialog.Title>
                    <div className="space-y-4 text-gray-700">
                        <InfoItem label="ID da Movimentação" value={movement.id} />
                        <InfoItem label="Descrição" value={movement.description} />
                        <InfoItem
                            label="Valor"
                            value={formatCurrency(movement.value)}
                            color={movement.type === "ENTRY" ? "text-green-600" : "text-red-600"}
                        />
                        <InfoItem
                            label="Tipo"
                            value={movement.type === "ENTRY" ? "Entrada (➕)" : "Saída (➖)"}
                            color={movement.type === "ENTRY" ? "text-green-600" : "text-red-600"}
                        />
                        <InfoItem label="Categoria" value={categoryLabel} />
                        <InfoItem label="Data" value={`${formatDate(movement.date)} às ${formatTime(movement.date)}`} />
                    </div>
                    <div className="flex justify-end mt-8">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-2 bg-[#780087] text-white rounded-lg hover:bg-[#9d00b8] transition"
                        >
                            <Check className="w-5 h-5" /> Fechar
                        </button>
                    </div>
                    <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
function InfoItem({ label, value, color = "text-gray-700" }: { label: string; value: string; color?: string }) {
    return (
        <div className="border-b border-gray-100 pb-2">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-base font-semibold ${color}`}>{value}</p>
        </div>
    )
}

const TRASH_ICON_URL = "https://cdn-icons-png.flaticon.com/512/1214/1214428.png"
function DeleteConfirmationModal({
    movement,
    onConfirm,
    onClose,
    isDeleting,
}: {
    movement: Movement | null
    onConfirm: () => void
    onClose: () => void
    isDeleting: boolean
}) {
    if (!movement) return null

    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-50 font-sans">
                    {/* Título mais profissional com imagem e cor forte */}
                    <Dialog.Title className="text-xl font-semibold text-red-700 mb-4 flex items-center gap-2">
                        <img src={TRASH_ICON_URL || "/placeholder.svg"} alt="Lixeira" className="w-6 h-6 object-contain" />
                        Confirmação de Exclusão
                    </Dialog.Title>

                    {/* Texto de confirmação melhor formatado */}
                    <p className="text-gray-700 mb-6 border-l-4 border-red-200 pl-4 py-2 bg-red-50 rounded-lg">
                        Você está prestes a deletar a movimentação permanentemente:
                        <span className="font-extrabold text-red-900 block mt-1 text-lg">
                            {movement.description} ({formatCurrency(movement.value)})
                        </span>
                        Esta ação é <span className="font-semibold text-red-700">irreversível</span> e afetará o saldo de caixa.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            // Adiciona 'group' para o hover, e 'hover:shadow-lg' para o efeito profissional
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-lg disabled:bg-red-400 transition group"
                        >
                            {isDeleting ? (
                                <RotateCcw className="w-5 h-5 animate-spin" />
                            ) : (
                                <img
                                    src={TRASH_ICON_URL || "/placeholder.svg"}
                                    alt="Deletar"
                                    // Inverte cor e adiciona a animação de pulo no hover
                                    className="w-5 h-5 object-contain invert brightness-0 transition-transform group-hover:animate-jump"
                                />
                            )}
                            {isDeleting ? "Deletando..." : "Deletar"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

// NOVO COMPONENTE: MetricCard
function MetricCard({ title, value, icon, bg, text, actionClick }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    bg: string;
    text: string;
    actionClick: () => void;
}) {
    // Usamos o CountUp para formatação BRL
    const formattedValue = (
        <CountUp
            end={value}
            decimal=","
            decimals={2}
            prefix="R$ "
            separator="."
        />
    )

    return (
        <div
            className={`bg-gradient-to-br ${bg} rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform relative`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-serif text-white">{title}</p>
                    <p className={`text-2xl font-bold ${text}`}>
                        {formattedValue}
                    </p>
                </div>
                {/* Cor de fundo do ícone é derivada da prop 'text' */}
                <div className={`${text.replace("text-", "bg-")}200 p-3 rounded-full ${text}`}>{icon}</div>
            </div>
            {/* Botão de ajuste/ação movido para dentro, no canto superior direito */}
            <button
                onClick={actionClick}
                className="absolute top-2 right-2 p-1 text-gray-600 hover:bg-gray-100 rounded transition"
                title={`Adicionar ${title.toLowerCase()}`}
            >
                <Edit className="w-5 h-5" />
            </button>
        </div>
    )
}


function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label.includes("Mín") ? "0" : "9999"}
                className="w-full p-3 border border-gray-300 rounded-xl"
            />
        </div>
    )
}

// Assinatura da função atualizada para receber as funções de callback
function ExportPdfDropdown({
    movements,
    generateAllPdf,
    generateTodayPdf,
}: {
    movements: Movement[]
    generateAllPdf: (m: Movement[], filter: string) => void
    generateTodayPdf: (m: Movement[]) => void
}) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="relative flex items-center gap-2 mt-8 px-6 py-3 bg-gradient-to-r from-[#780087] to-[#9d00b8] text-white rounded-xl hover:from-[#9d00b8] hover:to-[#780087] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group font-sans">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <Download className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 font-semibold">Exportar PDF</span>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                className="min-w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-50 animate-slideDown font-sans"
                sideOffset={5}
            >
                <DropdownMenu.Item
                    onClick={() => generateAllPdf(movements, "all")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 cursor-pointer rounded-lg transition-all duration-200 group outline-none"
                >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <FileText className="w-4 h-4 text-[#780087]" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-[#780087]">Exportar tudo</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-2 border-t border-gray-100" />

                <DropdownMenu.Item
                    onClick={() => generateTodayPdf(movements)}
                    className="relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 cursor-pointer rounded-lg transition-all duration-200 group outline-none border-2 border-amber-200 animate-pulse-soft overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 opacity-30 animate-shimmer"></div>
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-md">
                        <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                    </div>
                    <span className="text-orange-700 font-bold group-hover:text-orange-800 relative z-10 flex items-center gap-2">
                        PDF do Dia
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full animate-bounce-subtle">
                            BAIXAR
                        </span>
                    </span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-2 border-t border-gray-100" />

                {(() => {
                    const yearsMap = new Map<string, Set<string>>()
                    movements.forEach((m) => {
                        if (!m.date) return
                        const d = new Date(m.date)
                        const year = d.getFullYear().toString()
                        const month = (d.getMonth() + 1).toString().padStart(2, "0")
                        if (!yearsMap.has(year)) yearsMap.set(year, new Set())
                        yearsMap.get(year)!.add(`${year}-${month}`)
                    })

                    const sortedYears = Array.from(yearsMap.keys()).sort((a, b) => +b - +a)

                    return sortedYears.flatMap((year) => {
                        const months = Array.from(yearsMap.get(year)!).sort().reverse()
                        const monthOptions = months.map((ym) => {
                            const [y, m] = ym.split("-")
                            const monthName = new Date(+y, +m - 1, 1).toLocaleDateString("pt-BR", { month: "long" })
                            return (
                                <DropdownMenu.Item
                                    key={ym}
                                    onClick={() => generateAllPdf(movements, ym)}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-all duration-200 group outline-none ml-4"
                                >
                                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                        <CalendarDays className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#780087]" />
                                    </div>
                                    <span className="text-gray-600 group-hover:text-gray-800 text-sm">
                                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {y}
                                    </span>
                                </DropdownMenu.Item>
                            )
                        })

                        return [
                            <DropdownMenu.Separator key={`sep-${year}`} className="my-2 border-t border-gray-100" />,
                            <DropdownMenu.Item
                                key={`y-${year}`}
                                onClick={() => generateAllPdf(movements, year)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 cursor-pointer rounded-lg transition-all duration-200 group outline-none"
                            >
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <Calendar className="w-4 h-4 text-[#780087]" />
                                </div>
                                <span className="text-gray-700 font-semibold group-hover:text-[#780087]">Ano {year}</span>
                            </DropdownMenu.Item>,
                            ...monthOptions,
                        ]
                    })
                })()}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    )
}

function EditModal({
    movement,
    onSave,
    onClose,
    setMovement,
}: { movement: Movement | null; onSave: () => void; onClose: () => void; setMovement: (m: Movement | null) => void }) {
    if (!movement) return null

    const categoryOptions: { value: CategoryType; label: string }[] = [
        { value: "SALE", label: "Venda" },
        { value: "CHANGE", label: "Troco" },
        { value: "OTHER_IN", label: "Outros (Entrada)" },
        { value: "EXPENSE", label: "Despesa" },
        { value: "WITHDRAWAL", label: "Saque" },
        { value: "PAYMENT", label: "Pagamento" },
    ]

    const handleCategoryChange = (newCategory: CategoryType) => {
        const newType: MovementType = ["SALE", "CHANGE", "OTHER_IN"].includes(newCategory) ? "ENTRY" : "EXIT"

        setMovement({
            ...movement,
            category: newCategory,
            type: newType,
        })
    }

    const handleDateChange = (dateInput: string) => {
        const datePart = dateInput

        if (!datePart) {
            setMovement({ ...movement, date: "" })
            return
        }

        const timePart = toTimeInputString(movement.date)

        // Combina a nova data e a hora
        const newISOString = combineDateTime(datePart, timePart)

        setMovement({ ...movement, date: newISOString })
    }

    const handleTimeChange = (timeInput: string) => {
        const datePart = toDateInputString(movement.date)

        if (!datePart) {
            return
        }

        const newISOString = combineDateTime(datePart, timeInput)

        setMovement({ ...movement, date: newISOString })
    }

    const categoryIconUrl = categoryImageMap[mapCategoryToSubtype(movement.category)] // Obtém a URL da imagem

    return (
        <Dialog.Root open={!!movement} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-50 font-sans">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        {/* Substitui o ícone 'Edit' pela imagem */}
                        <img src={categoryIconUrl || "/placeholder.svg"} alt="Categoria" className="w-6 h-6 object-contain" />{" "}
                        Editar Movimentação
                    </Dialog.Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tipo (Exibição apenas, muda com a Categoria) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimento</label>
                            <div
                                className={`p-3 rounded-xl border font-semibold ${movement.type === "ENTRY"
                                    ? "bg-green-50 text-green-700 border-green-300"
                                    : "bg-red-50 text-red-700 border-red-300"
                                    }`}
                            >
                                {movement.type === "ENTRY" ? "Entrada (➕)" : "Saída (➖)"}
                            </div>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                            <select
                                value={movement.category}
                                onChange={(e) => handleCategoryChange(e.target.value as Subtype)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Descrição */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                            <input
                                type="text"
                                value={movement.description}
                                onChange={(e) => setMovement({ ...movement, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                // O valor exibido é o valor absoluto, pois a mutação espera isso
                                value={Math.abs(movement.value)}
                                onChange={(e) => setMovement({ ...movement, value: Number.parseFloat(e.target.value) || 0 })}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Data e Hora */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                                <input
                                    type="date"
                                    // Convertendo a data ISO para o formato YYYY-MM-DD para o input[type=date]
                                    value={toDateInputString(movement.date)}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                                <input
                                    type="time"
                                    // Convertendo a data ISO para o formato HH:MM para o input[type=time]
                                    value={toTimeInputString(movement.date)}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-8 border-t pt-4 border-gray-100">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5" /> Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Check className="w-5 h-5" /> Salvar Alterações
                        </button>
                    </div>
                    <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 px-6 py-6">
            <div className="animate-pulse">
                <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
                    ))}
                </div>
                <div className="h-12 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
    )
}