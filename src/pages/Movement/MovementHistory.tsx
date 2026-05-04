"use client"

import { useState, useMemo } from "react"
import {
    Search,
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
    SlidersHorizontal,
    LayoutGrid,
    List as ListIcon,
} from "lucide-react"
import { useQuery, useMutation } from "@apollo/client"
import { GET_CASH_MOVEMENTS, CREATE_CASH_MOVEMENT, UPDATE_CASH_MOVEMENT } from "../../graphql/queries/queries"
import { GET_BANKS } from "../../graphql/queries/banks"
import { generateMovementPdfDoc } from "../../utils/generatePDF"
import type { CategoryType, Movement, MovementType, MovementTypePayment } from "../../types"
import { RotateCcw } from "lucide-react"

import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { motion, AnimatePresence } from "framer-motion"

import * as Dialog from "@radix-ui/react-dialog"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

import CountUp from "react-countup"
import { toast } from "sonner"
import { DELETE_CASH_MOVEMENT } from "../../graphql/mutations/mutations"
import { useCompany } from "../../contexts/CompanyContext"
import { CashMovementBackupActions } from "../../components/CashMovementBackupActions"

type FilterType = "ALL" | "ENTRY" | "EXIT" | "SALE" | "CHANGE" | "OTHER_IN" | "EXPENSE" | "WITHDRAWAL" | "PAYMENT"

type Subtype = "SALE" | "CHANGE" | "OTHER_IN" | "EXPENSE" | "WITHDRAWAL" | "PAYMENT"

type SortField = "date" | "value" | "description"
type SortOrder = "asc" | "desc"

type PaymentMethod = "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER"

const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: "Dinheiro 💵",
    PIX: "PIX 📱",
    CREDIT_CARD: "Crédito 💳",
    DEBIT_CARD: "Débito 💳",
    OTHER: "Outros 📦",
}

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

    const { data: banksData } = useQuery<{ banks: Array<{ id: string; name: string; corHex: string }> }>(GET_BANKS, {
        fetchPolicy: "cache-and-network",
    })
    const bankMap = useMemo(() => {
        const map = new Map<string, { id: string; name: string; corHex: string }>()
        for (const b of banksData?.banks ?? []) map.set(b.id, b)
        return map
    }, [banksData])

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

    const movements: Movement[] = (data?.cashMovements || []).map((m: any) => ({
        id: m.id,
        value: Number(m.value),
        description: m.description,
        type: m.type as MovementType || (
            ['SALE', 'CHANGE', 'OTHER_IN'].includes(m.category) ? 'ENTRY' : 'EXIT'
        ) as MovementType,
        typePayment: (m.typePayment as MovementTypePayment) ?? null,
        category: mapCategoryToSubtype(m.category),
        date: m.date,
        bankId: m.bankId ?? null,
    }));
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

    // ============= analytics derivados para cards/charts =============
    const totalCount = filtered.length
    const avgTicket = totalCount > 0 ? (totalEntries + totalExits) / totalCount : 0
    const totalVolume = totalEntries + totalExits
    const entriesShare = totalVolume > 0 ? (totalEntries / totalVolume) * 100 : 0

    // tendência por dia (últimos 14 dias dentro do filtrado)
    const dailyTrend = useMemo(() => {
        const map = new Map<string, { date: string; entradas: number; saidas: number; saldo: number }>()
        const days: string[] = []
        const today = new Date()
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(today.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            days.push(key)
            map.set(key, { date: key, entradas: 0, saidas: 0, saldo: 0 })
        }
        for (const m of filtered) {
            if (!m.date) continue
            const key = new Date(m.date).toISOString().slice(0, 10)
            const slot = map.get(key)
            if (!slot) continue
            if (m.type === "ENTRY") slot.entradas += m.value
            else slot.saidas += m.value
            slot.saldo = slot.entradas - slot.saidas
        }
        return days.map((k) => {
            const s = map.get(k)!
            const d = new Date(k + "T00:00:00")
            return { ...s, label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) }
        })
    }, [filtered])

    // breakdown por categoria
    const categoryBreakdown = useMemo(() => {
        const counter = new Map<Subtype, { count: number; total: number }>()
        for (const m of filtered) {
            const cat = mapCategoryToSubtype(m.category as string)
            const cur = counter.get(cat) ?? { count: 0, total: 0 }
            cur.count += 1
            cur.total += m.value
            counter.set(cat, cur)
        }
        const COLORS: Record<Subtype, string> = {
            SALE: "#10b981",
            CHANGE: "#14b8a6",
            OTHER_IN: "#22c55e",
            EXPENSE: "#ef4444",
            WITHDRAWAL: "#f97316",
            PAYMENT: "#e11d48",
        }
        return Array.from(counter.entries())
            .map(([cat, v]) => ({
                category: cat,
                label: typeLabels[cat as keyof typeof typeLabels],
                count: v.count,
                total: v.total,
                color: COLORS[cat],
            }))
            .sort((a, b) => b.total - a.total)
    }, [filtered]) // eslint-disable-line react-hooks/exhaustive-deps

    // mini sparkline para cada KPI (últimos 7 dias)
    const sparkEntries = dailyTrend.slice(-7).map((d) => ({ v: d.entradas }))
    const sparkExits = dailyTrend.slice(-7).map((d) => ({ v: d.saidas }))

    // comparação 7 dias atuais vs 7 anteriores
    const comparison = useMemo(() => {
        const last7 = dailyTrend.slice(-7)
        const prev7 = dailyTrend.slice(0, 7)
        const sumE = (arr: typeof dailyTrend) => arr.reduce((a, b) => a + b.entradas, 0)
        const sumS = (arr: typeof dailyTrend) => arr.reduce((a, b) => a + b.saidas, 0)
        const cur = sumE(last7) - sumS(last7)
        const prev = sumE(prev7) - sumS(prev7)
        const delta = prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100
        const entriesDelta = sumE(prev7) === 0 ? 0 : ((sumE(last7) - sumE(prev7)) / Math.abs(sumE(prev7))) * 100
        const exitsDelta = sumS(prev7) === 0 ? 0 : ((sumS(last7) - sumS(prev7)) / Math.abs(sumS(prev7))) * 100
        return { delta, entriesDelta, exitsDelta }
    }, [dailyTrend])

    // melhor / pior dia
    const bestWorst = useMemo(() => {
        if (dailyTrend.length === 0) return { best: null, worst: null }
        const sorted = [...dailyTrend].sort((a, b) => (b.entradas - b.saidas) - (a.entradas - a.saidas))
        return { best: sorted[0], worst: sorted[sorted.length - 1] }
    }, [dailyTrend])

    // última atividade
    const lastActivity = useMemo(() => {
        if (filtered.length === 0) return null
        const sorted = [...filtered].sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0
            const db = b.date ? new Date(b.date).getTime() : 0
            return db - da
        })
        const m = sorted[0]
        if (!m.date) return null
        const diff = Date.now() - new Date(m.date).getTime()
        const min = Math.floor(diff / 60000)
        const hr = Math.floor(min / 60)
        const day = Math.floor(hr / 24)
        let label = ""
        if (day > 0) label = `há ${day} dia${day > 1 ? "s" : ""}`
        else if (hr > 0) label = `há ${hr}h`
        else if (min > 0) label = `há ${min} min`
        else label = "agora"
        return { movement: m, label }
    }, [filtered])

    // active filter chips (para mostrar "filtros ativos")
    const activeFilters: { key: string; label: string; onClear: () => void }[] = []
    if (search) activeFilters.push({ key: "search", label: `Busca: "${search}"`, onClear: () => setSearch("") })
    if (filter !== "ALL") activeFilters.push({ key: "filter", label: `Tipo: ${filter}`, onClear: () => setFilter("ALL") })
    if (quickDateFilter) activeFilters.push({ key: "qd", label: `Período: ${quickDateFilter}`, onClear: () => setQuickDateFilter("") })
    if (dateFrom) activeFilters.push({ key: "df", label: `De: ${dateFrom}`, onClear: () => setDateFrom("") })
    if (dateTo) activeFilters.push({ key: "dt", label: `Até: ${dateTo}`, onClear: () => setDateTo("") })
    if (valueMin) activeFilters.push({ key: "vmin", label: `Mín: R$ ${valueMin}`, onClear: () => setValueMin("") })
    if (valueMax) activeFilters.push({ key: "vmax", label: `Máx: R$ ${valueMax}`, onClear: () => setValueMax("") })

    const clearAllFilters = () => {
        setSearch("")
        setFilter("ALL")
        setQuickDateFilter("")
        setDateFrom("")
        setDateTo("")
        setValueMin("")
        setValueMax("")
        setCurrentPage(1)
    }

    // view mode (table | cards)
    const [viewMode, setViewMode] = useState<"table" | "cards">("table")

    if (loading) return <LoadingSkeleton />

    if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">Erro: {error.message}</div>

    return (
        <>
            <div className="w-full max-w-[1400px] mx-auto">

                {/* HEADER editorial */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-white/[0.06]">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                            Caixa · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                        <h1 className="mt-2 text-[32px] sm:text-[36px] font-semibold text-slate-900 dark:text-white tracking-[-0.02em] leading-[1.05]">
                            Movimentações
                        </h1>
                        {lastActivity && (
                            <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                                Última: <span className="text-slate-700 dark:text-slate-200 font-medium">{lastActivity.movement.description}</span>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                <span className={lastActivity.movement.type === "ENTRY" ? "text-emerald-600 dark:text-emerald-400 font-mono font-medium" : "text-rose-600 dark:text-rose-400 font-mono font-medium"}>
                                    {lastActivity.movement.type === "ENTRY" ? "+" : "−"}{formatCurrency(lastActivity.movement.value)}
                                </span>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                {lastActivity.label}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <CashMovementBackupActions onImported={() => refetch()} />
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/15 rounded-md disabled:opacity-50 transition-colors group"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                            <span>{loading ? "Atualizando" : "Atualizar"}</span>
                        </button>
                    </div>
                </header>

                {/* Big number + KPIs grid editorial */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 mb-10">
                    {/* Saldo grande */}
                    <div className="lg:col-span-5">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Saldo do recorte</p>
                        <p className={`mt-3 text-[56px] sm:text-[64px] font-semibold tracking-[-0.035em] leading-none tabular-nums font-mono ${balance >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600 dark:text-rose-400"}`}>
                            <CountUp end={balance} decimal="," decimals={2} prefix="R$ " separator="." duration={0.8} />
                        </p>
                        <div className="mt-4 flex items-center gap-3 text-[12.5px]">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium tabular-nums ${comparison.delta >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                                {comparison.delta >= 0 ? "↑" : "↓"} {Math.abs(comparison.delta).toFixed(1)}%
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">vs. semana anterior</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleAdjustment("ADJUSTMENT")}
                            className="mt-3 text-[12px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-4 hover:underline"
                        >
                            Ajustar manualmente
                        </button>
                    </div>

                    {/* mini kpis col direita */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                        <KpiCell
                            label="Entradas"
                            value={totalEntries}
                            delta={comparison.entriesDelta}
                            spark={sparkEntries}
                            color="#10b981"
                            onClick={() => handleAdjustment("ENTRY")}
                        />
                        <KpiCell
                            label="Saídas"
                            value={totalExits}
                            delta={comparison.exitsDelta}
                            spark={sparkExits}
                            color="#ef4444"
                            invertDelta
                            onClick={() => handleAdjustment("EXIT")}
                        />
                        <KpiCell
                            label="Lançamentos"
                            value={totalCount}
                            kind="count"
                            sub={`Ticket ${formatCurrency(avgTicket)}`}
                        />
                        {bestWorst.best && (
                            <KpiCell
                                label="Melhor dia"
                                value={bestWorst.best.entradas - bestWorst.best.saidas}
                                sub={(bestWorst.best as any).label}
                                color="#10b981"
                                muted
                            />
                        )}
                        {bestWorst.worst && (bestWorst.worst.entradas - bestWorst.worst.saidas) < 0 && (
                            <KpiCell
                                label="Pior dia"
                                value={bestWorst.worst.entradas - bestWorst.worst.saidas}
                                sub={(bestWorst.worst as any).label}
                                color="#ef4444"
                                muted
                            />
                        )}
                        <KpiCell
                            label="Volume total"
                            value={totalVolume}
                            sub={`${entriesShare.toFixed(0)}% entrada · ${(100 - entriesShare).toFixed(0)}% saída`}
                            muted
                        />
                    </div>
                </section>

                {/* TENDÊNCIA + BREAKDOWN side by side */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-px mb-10 bg-slate-200 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    {/* Trend chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5">
                        <div className="flex items-baseline justify-between mb-1">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Fluxo</h2>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">últimos 14 dias</span>
                        </div>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">Comparativo diário entre entradas e saídas</p>
                        <div className="h-56 -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad-en" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="grad-ex" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} className="text-slate-400" axisLine={false} tickLine={false} interval={"preserveStartEnd"} />
                                    <YAxis tick={{ fontSize: 10, fill: "currentColor" }} className="text-slate-400" axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [formatCurrency(value), name === "entradas" ? "Entradas" : "Saídas"]}
                                        contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#fff", fontSize: 12, padding: "8px 10px" }}
                                        labelStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}
                                        cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }}
                                    />
                                    <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={1.75} fill="url(#grad-en)" isAnimationActive animationDuration={500} />
                                    <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={1.75} fill="url(#grad-ex)" isAnimationActive animationDuration={500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Breakdown lista vertical compacta */}
                    <div className="bg-white dark:bg-slate-900 p-5">
                        <div className="flex items-baseline justify-between mb-1">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Por categoria</h2>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{categoryBreakdown.length}</span>
                        </div>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">Distribuição do volume total</p>
                        {categoryBreakdown.length === 0 ? (
                            <p className="text-[12px] text-slate-400 py-6 text-center">Sem dados no recorte</p>
                        ) : (
                            <ul className="space-y-2.5">
                                {categoryBreakdown.map((c) => {
                                    const pct = totalVolume > 0 ? (c.total / totalVolume) * 100 : 0
                                    return (
                                        <li key={c.category}>
                                            <button
                                                type="button"
                                                onClick={() => handleFilterChange(c.category as FilterType)}
                                                className="w-full text-left group"
                                            >
                                                <div className="flex items-baseline justify-between mb-1">
                                                    <span className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                                        {c.label}
                                                        <span className="text-[10.5px] text-slate-400">{c.count}</span>
                                                    </span>
                                                    <span className="font-mono text-[12.5px] tabular-nums text-slate-900 dark:text-white">{formatCurrency(c.total)}</span>
                                                </div>
                                                <div className="h-[3px] rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: c.color }}
                                                    />
                                                </div>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                {/* TABELA com toolbar minimal */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Lançamentos</h2>
                                <span className="text-[12px] text-slate-400">{sorted.length}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ExportPdfDropdown
                                    movements={movements}
                                    generateAllPdf={generateMovementsPdf}
                                    generateTodayPdf={generateTodayPdf}
                                />
                                <div className="inline-flex rounded-md border border-slate-200 dark:border-white/[0.08] p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("table")}
                                        className={`flex items-center gap-1 h-7 px-2 rounded text-[11.5px] transition-colors ${viewMode === "table" ? "bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}
                                        title="Tabela"
                                    ><ListIcon className="w-3.5 h-3.5" /></button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("cards")}
                                        className={`flex items-center gap-1 h-7 px-2 rounded text-[11.5px] transition-colors ${viewMode === "cards" ? "bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}
                                        title="Cards"
                                    ><LayoutGrid className="w-3.5 h-3.5" /></button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium transition-colors ${showFilters ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"}`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filtros
                                    {activeFilters.length > 0 && (
                                        <span className={`text-[10.5px] tabular-nums px-1.5 rounded-full ${showFilters ? "bg-white/20" : "bg-slate-200 dark:bg-white/[0.08]"}`}>{activeFilters.length}</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* search */}
                        <div className="flex flex-col md:flex-row gap-2 md:items-center">
                            <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Buscar por descrição, contato, código…"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                                    className="w-full h-9 pl-9 pr-3 text-[13px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.06] rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors"
                                />
                            </div>
                            {/* período inline */}
                            <div className="flex items-center gap-1 text-[12px]">
                                {[
                                    { value: "today", label: "Hoje" },
                                    { value: "this-week", label: "Semana" },
                                    { value: "this-month", label: "Mês" },
                                    { value: "last-30-days", label: "30d" },
                                    { value: "", label: "Tudo" },
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => handleQuickDateFilterChange(f.value)}
                                        className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${quickDateFilter === f.value
                                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* tipo (segmented) */}
                        <div className="flex items-center gap-1 text-[12px] -mx-1 overflow-x-auto">
                            {[
                                { value: "ALL", label: "Todas" },
                                { value: "ENTRY", label: "Entradas" },
                                { value: "EXIT", label: "Saídas" },
                                { value: "SALE", label: "Vendas" },
                                { value: "EXPENSE", label: "Despesas" },
                                { value: "PAYMENT", label: "Pagamentos" },
                                { value: "WITHDRAWAL", label: "Saques" },
                                { value: "CHANGE", label: "Troco" },
                                { value: "OTHER_IN", label: "Outros" },
                            ].map((f) => {
                                const active = filter === f.value
                                return (
                                    <button
                                        key={f.value}
                                        onClick={() => handleFilterChange(f.value as FilterType)}
                                        className={`h-7 px-2.5 mx-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${active
                                            ? "bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white ring-1 ring-slate-300 dark:ring-white/15"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.02]"}`}
                                    >
                                        {f.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Advanced */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
                                        <div>
                                            <label className="block text-[10.5px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Data inicial</label>
                                            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setQuickDateFilter(""); setCurrentPage(1) }} className="w-full p-2 border border-slate-200 dark:border-white/[0.06] rounded-md text-[12.5px] bg-white dark:bg-slate-950" />
                                        </div>
                                        <div>
                                            <label className="block text-[10.5px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Data final</label>
                                            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setQuickDateFilter(""); setCurrentPage(1) }} className="w-full p-2 border border-slate-200 dark:border-white/[0.06] rounded-md text-[12.5px] bg-white dark:bg-slate-950" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Mín. R$" value={valueMin} onChange={(v: string) => { setValueMin(v); setCurrentPage(1) }} />
                                            <Input label="Máx. R$" value={valueMax} onChange={(v: string) => { setValueMax(v); setCurrentPage(1) }} />
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={clearAllFilters} className="text-[12px] text-slate-500 hover:text-rose-600 underline-offset-2 hover:underline">Limpar todos os filtros</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Active chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {activeFilters.map((f) => (
                                    <span key={f.key} className="inline-flex items-center gap-1 pl-2.5 pr-1 h-6 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200">
                                        {f.label}
                                        <button type="button" onClick={f.onClear} className="hover:bg-slate-200 dark:hover:bg-white/[0.08] rounded p-0.5">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort row */}
                    <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] text-[11.5px]">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            {sorted.length === 0 ? "Nenhum resultado" : `${startIndex + 1}–${Math.min(endIndex, sorted.length)} de ${sorted.length}`}
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>Ordenar:</span>
                            {(["date", "value", "description"] as SortField[]).map((field) => {
                                const active = sortField === field
                                const labels = { date: "Data", value: "Valor", description: "Descrição" }
                                return (
                                    <button
                                        key={field}
                                        onClick={() => handleSortChange(field)}
                                        className={`inline-flex items-center gap-0.5 h-6 px-1.5 rounded transition-colors ${active ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                                    >
                                        {labels[field]}
                                        {active && (sortOrder === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                                    </button>
                                )
                            })}
                        </div>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                            className="text-[11.5px] bg-transparent border-0 text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer"
                        >
                            <option value={10}>10 por página</option>
                            <option value={20}>20 por página</option>
                            <option value={50}>50 por página</option>
                            <option value={100}>100 por página</option>
                        </select>
                    </div>

                    {/* CONTENT */}
                    {paginatedMovements.length === 0 ? (
                        <div className="text-center py-24 px-6">
                            <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200">Sem lançamentos</p>
                            <p className="mt-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                Nenhuma movimentação corresponde aos filtros aplicados.
                            </p>
                            {activeFilters.length > 0 && (
                                <button onClick={clearAllFilters} className="mt-4 text-[12px] text-slate-700 dark:text-slate-200 underline-offset-4 hover:underline">
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    ) : viewMode === "table" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[10.5px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04]">
                                        <th className="px-5 py-2.5 text-left font-medium">Data</th>
                                        <th className="px-5 py-2.5 text-left font-medium">Descrição</th>
                                        <th className="px-5 py-2.5 text-left font-medium hidden md:table-cell">Categoria</th>
                                        <th className="px-5 py-2.5 text-left font-medium hidden lg:table-cell">Pagamento</th>
                                        <th className="px-5 py-2.5 text-left font-medium hidden lg:table-cell">Banco</th>
                                        <th className="px-5 py-2.5 text-right font-medium">Valor</th>
                                        <th className="px-3 py-2.5 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedMovements.map((m, idx) => {
                                        const sub = mapCategoryToSubtype(m.category as string)
                                        const bank = m.bankId ? bankMap.get(m.bankId) : null
                                        return (
                                            <motion.tr
                                                key={m.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.25, delay: idx * 0.012 }}
                                                className="group border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-5 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                                                    <div>{formatDate(m.date)}</div>
                                                    {m.date && <div className="text-[10.5px] text-slate-400 mt-0.5">{formatTime(m.date)}</div>}
                                                </td>
                                                <td className="px-5 py-3.5 text-[13px] text-slate-900 dark:text-white max-w-md">
                                                    <div className="line-clamp-2 leading-snug">{m.description}</div>
                                                </td>
                                                <td className="px-5 py-3.5 hidden md:table-cell">
                                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600 dark:text-slate-300">
                                                        <span className={`w-1 h-1 rounded-full ${m.type === "ENTRY" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                        {typeLabels[sub]}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 hidden lg:table-cell text-[11.5px] text-slate-600 dark:text-slate-300">
                                                    {m.typePayment ? paymentMethodLabels[m.typePayment].split(" ")[0] : <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5 hidden lg:table-cell">
                                                    {bank ? (
                                                        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600 dark:text-slate-300">
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bank.corHex }} />
                                                            {bank.name}
                                                        </span>
                                                    ) : (<span className="text-slate-400 text-[11.5px]">—</span>)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <span className={`text-[13.5px] font-mono font-medium tabular-nums ${m.type === "ENTRY" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                        {m.type === "ENTRY" ? "+" : "−"}{formatCurrency(m.value).replace("R$", "").trim()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3.5 text-center">
                                                    <ActionsDropdown
                                                        movement={m}
                                                        onView={openViewModal}
                                                        onEdit={openEditModal}
                                                        onDelete={openDeleteModal}
                                                        onReverse={handleReverse}
                                                        isDeleting={deletingId === m.id}
                                                    />
                                                </td>
                                            </motion.tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {paginatedMovements.map((m, idx) => {
                                const sub = mapCategoryToSubtype(m.category as string)
                                const bank = m.bankId ? bankMap.get(m.bankId) : null
                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: idx * 0.015 }}
                                        whileHover={{ y: -2 }}
                                        className="p-4 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/15 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                                                <span className={`w-1 h-1 rounded-full ${m.type === "ENTRY" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                {typeLabels[sub]}
                                            </span>
                                            <ActionsDropdown
                                                movement={m}
                                                onView={openViewModal}
                                                onEdit={openEditModal}
                                                onDelete={openDeleteModal}
                                                onReverse={handleReverse}
                                                isDeleting={deletingId === m.id}
                                            />
                                        </div>
                                        <p className={`text-[22px] font-mono font-semibold tabular-nums tracking-tight leading-none ${m.type === "ENTRY" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                            {m.type === "ENTRY" ? "+" : "−"}{formatCurrency(m.value).replace("R$", "").trim()}
                                        </p>
                                        <p className="mt-2 text-[12.5px] text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug">{m.description}</p>
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                            <span>{formatDate(m.date)} · {formatTime(m.date)}</span>
                                            {bank && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bank.corHex }} />
                                                    {bank.name}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] text-[12px]">
                            <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500" title="Primeira"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500" title="Anterior"><ChevronLeft className="w-3.5 h-3.5" /></button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum
                                    if (totalPages <= 5) pageNum = i + 1
                                    else if (currentPage <= 3) pageNum = i + 1
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                                    else pageNum = currentPage - 2 + i
                                    const active = currentPage === pageNum
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`min-w-[26px] h-7 px-1.5 rounded-md text-[12px] font-medium transition-colors tabular-nums ${active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"}`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500" title="Próxima"><ChevronRight className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500" title="Última"><ChevronsRight className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    )}
                </section>
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
                    className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 font-sans"
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <RotateCcw className="h-5 w-5 animate-spin text-red-500" />
                    ) : (
                        <MoreVertical className="w-5 h-5" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-32 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-white/10 p-1 z-50 font-sans">
                <DropdownMenu.Item
                    onClick={() => onView(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:bg-purple-950/40 cursor-pointer rounded"
                >
                    <Eye className="w-4 h-4 text-[#780087]" /> Visualizar
                </DropdownMenu.Item>
                <DropdownMenu.Item
                    onClick={() => onEdit(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-purple-50 dark:bg-purple-950/40 cursor-pointer rounded"
                >
                    <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Editar
                </DropdownMenu.Item>

                {/* NOVO ITEM: ESTORNAR MOVIMENTO */}
                <DropdownMenu.Item
                    onClick={() => onReverse(movement)} // Chama a nova função de estorno
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-yellow-50 dark:bg-yellow-950/40 cursor-pointer rounded"
                >
                    <RotateCcw className="w-4 h-4 text-yellow-600 dark:text-amber-400" /> Estornar Movimento
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 border-t border-gray-100 dark:border-white/5" />

                <DropdownMenu.Item
                    onClick={() => onDelete(movement)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/40 cursor-pointer rounded"
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
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 w-full max-w-2xl z-50 font-open_sans">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <img src={categoryIconUrl || "/placeholder.svg"} alt="Categoria" className="w-6 h-6 object-contain" />{" "}
                        Detalhes da Movimentação
                    </Dialog.Title>
                    <div className="space-y-4 text-gray-700 dark:text-slate-200">
                        <InfoItem label="ID da Movimentação" value={movement.id} />
                        <InfoItem label="Descrição" value={movement.description} />
                        <InfoItem
                            label="Valor"
                            value={formatCurrency(movement.value)}
                            color={movement.type === "ENTRY" ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
                        />
                        <InfoItem
                            label="Tipo"
                            value={movement.type === "ENTRY" ? "Entrada (➕)" : "Saída (➖)"}
                            color={movement.type === "ENTRY" ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
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
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1" aria-label="Fechar">
                            <X className="w-6 h-6" />
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
function InfoItem({ label, value, color = "text-gray-700 dark:text-slate-200" }: { label: string; value: string; color?: string }) {
    return (
        <div className="border-b border-gray-100 dark:border-white/5 pb-2">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
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
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 w-full max-w-sm z-50 font-sans">
                    {/* Título mais profissional com imagem e cor forte */}
                    <Dialog.Title className="text-xl font-semibold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                        <img src={TRASH_ICON_URL || "/placeholder.svg"} alt="Lixeira" className="w-6 h-6 object-contain" />
                        Confirmação de Exclusão
                    </Dialog.Title>

                    {/* Texto de confirmação melhor formatado */}
                    <p className="text-gray-700 dark:text-slate-200 mb-6 border-l-4 border-red-200 pl-4 py-2 bg-red-50 dark:bg-red-950/40 rounded-lg">
                        Você está prestes a deletar a movimentação permanentemente:
                        <span className="font-extrabold text-red-900 block mt-1 text-lg">
                            {movement.description} ({formatCurrency(movement.value)})
                        </span>
                        Esta ação é <span className="font-semibold text-red-700 dark:text-red-300">irreversível</span> e afetará o saldo de caixa.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 transition"
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
                className="absolute top-2 right-2 p-1 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition"
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
            <label className="block text-[10.5px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label.includes("Mín") ? "0" : "9999"}
                className="w-full p-2 border border-slate-200 dark:border-white/[0.06] rounded-md text-[12.5px] bg-white dark:bg-slate-950 focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors"
            />
        </div>
    )
}

function KpiCell({
    label,
    value,
    delta,
    sub,
    spark,
    color,
    invertDelta,
    muted,
    kind,
    onClick,
}: {
    label: string
    value: number
    delta?: number
    sub?: string
    spark?: { v: number }[]
    color?: string
    invertDelta?: boolean
    muted?: boolean
    kind?: "count"
    onClick?: () => void
}) {
    const Wrap: any = onClick ? "button" : "div"
    const showDelta = typeof delta === "number" && Math.abs(delta) >= 0.1
    const positive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) >= 0
    return (
        <Wrap
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`group text-left ${onClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] -mx-2 px-2 -my-1 py-1 rounded-md transition-colors" : ""}`}
        >
            <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</p>
                {showDelta && (
                    <span className={`text-[10.5px] tabular-nums font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {(delta as number) >= 0 ? "+" : ""}{(delta as number).toFixed(0)}%
                    </span>
                )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-[22px] font-semibold tracking-tight tabular-nums font-mono leading-none ${muted ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"}`} style={color && !muted ? { color } : {}}>
                    {kind === "count" ? (
                        <CountUp end={value} duration={0.7} separator="." />
                    ) : (
                        <CountUp end={value} decimal="," decimals={2} prefix="R$ " separator="." duration={0.7} />
                    )}
                </p>
            </div>
            {spark && spark.length > 0 && (
                <div className="h-7 mt-2 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`spk-${label}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color || "#64748b"} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={color || "#64748b"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={color || "#64748b"} strokeWidth={1.25} fill={`url(#spk-${label})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
            {sub && <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
        </Wrap>
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
                    <span className={`px-3 py-1.5 rounded-full text-sm font-[Inter] font-medium transition ? "bg-[#780087] text-white shadow-md"
                            : "bg-gray- hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}>Exportar PDF</span>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                className="min-w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-white/5 p-3 z-50 animate-slideDown font-sans"
                sideOffset={5}
            >
                <DropdownMenu.Item
                    onClick={() => generateAllPdf(movements, "all")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 cursor-pointer rounded-lg transition-all duration-200 group outline-none"
                >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <FileText className="w-4 h-4 text-[#780087]" />
                    </div>
                    <span className="text-gray-700 dark:text-slate-200 font-medium group-hover:text-[#780087]">Exportar tudo</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-2 border-t border-gray-100 dark:border-white/5" />

                <DropdownMenu.Item
                    onClick={() => generateTodayPdf(movements)}
                    className="relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 cursor-pointer rounded-lg transition-all duration-200 group outline-none border-2 border-amber-200 animate-pulse-soft overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 opacity-30 animate-shimmer"></div>
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-md">
                        <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                    </div>
                    <span className="text-orange-700 dark:text-orange-300 font-bold group-hover:text-orange-800 relative z-10 flex items-center gap-2">
                        PDF do Dia
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full animate-bounce-subtle">
                            BAIXAR
                        </span>
                    </span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-2 border-t border-gray-100 dark:border-white/5" />

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
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer rounded-lg transition-all duration-200 group outline-none ml-4"
                                >
                                    <div className="w-7 h-7 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                        <CalendarDays className="w-3.5 h-3.5 text-gray-600 dark:text-slate-300 group-hover:text-[#780087]" />
                                    </div>
                                    <span className="text-gray-600 dark:text-slate-300 group-hover:text-gray-800 dark:group-hover:text-slate-100 text-sm">
                                        {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {y}
                                    </span>
                                </DropdownMenu.Item>
                            )
                        })

                        return [
                            <DropdownMenu.Separator key={`sep-${year}`} className="my-2 border-t border-gray-100 dark:border-white/5" />,
                            <DropdownMenu.Item
                                key={`y-${year}`}
                                onClick={() => generateAllPdf(movements, year)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 cursor-pointer rounded-lg transition-all duration-200 group outline-none"
                            >
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <Calendar className="w-4 h-4 text-[#780087]" />
                                </div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold group-hover:text-[#780087]">Ano {year}</span>
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
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 w-full max-w-2xl z-50 font-open_sans">
                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        {/* Substitui o ícone 'Edit' pela imagem */}
                        <img src={categoryIconUrl || "/placeholder.svg"} alt="Categoria" className="w-6 h-6 object-contain" />{" "}
                        Editar Movimentação
                    </Dialog.Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tipo (Exibição apenas, muda com a Categoria) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Tipo de Movimento</label>
                            <div
                                className={`p-3 rounded-xl border font-semibold ${movement.type === "ENTRY"
                                    ? "bg-green-50 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-300 border-green-300"
                                    : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300"
                                    }`}
                            >
                                {movement.type === "ENTRY" ? "Entrada (➕)" : "Saída (➖)"}
                            </div>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Categoria</label>
                            <select
                                value={movement.category}
                                onChange={(e) => handleCategoryChange(e.target.value as Subtype)}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Descrição</label>
                            <input
                                type="text"
                                value={movement.description}
                                onChange={(e) => setMovement({ ...movement, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                // O valor exibido é o valor absoluto, pois a mutação espera isso
                                value={Math.abs(movement.value)}
                                onChange={(e) => setMovement({ ...movement, value: Number.parseFloat(e.target.value) || 0 })}
                                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Data e Hora */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Data</label>
                                <input
                                    type="date"
                                    // Convertendo a data ISO para o formato YYYY-MM-DD para o input[type=date]
                                    value={toDateInputString(movement.date)}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Hora</label>
                                <input
                                    type="time"
                                    // Convertendo a data ISO para o formato HH:MM para o input[type=time]
                                    value={toTimeInputString(movement.date)}
                                    onChange={(e) => handleTimeChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-8 border-t pt-4 border-gray-100 dark:border-white/5">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
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
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1" aria-label="Fechar">
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
                        <div key={i} className="h-24 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
                    ))}
                </div>
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
                <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
            </div>
        </div>
    )
}