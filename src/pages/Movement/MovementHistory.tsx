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
    ArrowDownCircle,
    ArrowUpCircle,
    Wallet,
    Receipt,
    Activity,
    SlidersHorizontal,
    ListFilter,
    LayoutGrid,
    List as ListIcon,
    Hash,
    Landmark,
    CreditCard,
    Filter as FilterIcon,
    Layers,
    TrendingUp,
    TrendingDown,
    Trophy,
    Crown,
    Clock,
    Target,
    Flame,
    Zap,
    Minus,
    BarChart3,
    LineChart as LineChartIcon,
} from "lucide-react"
import { useQuery, useMutation } from "@apollo/client"
import { GET_CASH_MOVEMENTS, CREATE_CASH_MOVEMENT, UPDATE_CASH_MOVEMENT } from "../../graphql/queries/queries"
import { GET_BANKS } from "../../graphql/queries/banks"
import { generateMovementPdfDoc } from "../../utils/generatePDF"
import type { CategoryType, Movement, MovementType, MovementTypePayment } from "../../types"
import { RotateCcw } from "lucide-react"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts"
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

    // ============= comparação com período anterior =============
    const periodComparison = useMemo(() => {
        if (filtered.length === 0) {
            return { prevEntries: 0, prevExits: 0, prevBalance: 0, prevCount: 0 }
        }
        const dates = filtered.map((m) => (m.date ? new Date(m.date).getTime() : 0)).filter(Boolean)
        if (dates.length === 0) return { prevEntries: 0, prevExits: 0, prevBalance: 0, prevCount: 0 }
        const minDate = Math.min(...dates)
        const maxDate = Math.max(...dates)
        const span = Math.max(maxDate - minDate, 24 * 3600 * 1000)
        const prevEnd = minDate
        const prevStart = minDate - span
        const previousMovs = movements.filter((m) => {
            if (!m.date) return false
            const t = new Date(m.date).getTime()
            return t >= prevStart && t < prevEnd
        })
        const prevEntries = previousMovs.filter((m) => m.type === "ENTRY").reduce((s, m) => s + m.value, 0)
        const prevExits = previousMovs.filter((m) => m.type === "EXIT").reduce((s, m) => s + m.value, 0)
        return {
            prevEntries,
            prevExits,
            prevBalance: prevEntries - prevExits,
            prevCount: previousMovs.length,
        }
    }, [filtered, movements])

    const computeDelta = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / Math.abs(previous)) * 100
    }

    const deltaEntries = computeDelta(totalEntries, periodComparison.prevEntries)
    const deltaExits = computeDelta(totalExits, periodComparison.prevExits)
    const deltaBalance = computeDelta(balance, periodComparison.prevBalance)
    const deltaCount = computeDelta(totalCount, periodComparison.prevCount)

    // ============= top movimentações =============
    const topEntries = useMemo(() => {
        return [...filtered]
            .filter((m) => m.type === "ENTRY")
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
    }, [filtered])

    const topExits = useMemo(() => {
        return [...filtered]
            .filter((m) => m.type === "EXIT")
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
    }, [filtered])

    const biggestSale = useMemo(() => {
        const sales = filtered.filter((m) => mapCategoryToSubtype(m.category as string) === "SALE")
        if (sales.length === 0) return 0
        return Math.max(...sales.map((m) => m.value))
    }, [filtered])

    // ============= distribuição por dia da semana =============
    const weekdayBreakdown = useMemo(() => {
        const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        const data = labels.map((l, i) => ({ label: l, idx: i, entradas: 0, saidas: 0, total: 0 }))
        for (const m of filtered) {
            if (!m.date) continue
            const d = new Date(m.date)
            const wd = d.getDay()
            if (m.type === "ENTRY") data[wd].entradas += m.value
            else data[wd].saidas += m.value
            data[wd].total = data[wd].entradas + data[wd].saidas
        }
        return data
    }, [filtered])

    const busiestWeekday = useMemo(() => {
        const sorted = [...weekdayBreakdown].sort((a, b) => b.total - a.total)
        return sorted[0]?.total > 0 ? sorted[0] : null
    }, [weekdayBreakdown])

    // ============= heatmap por hora do dia =============
    const hourlyBreakdown = useMemo(() => {
        const data = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, total: 0 }))
        for (const m of filtered) {
            if (!m.date) continue
            const d = new Date(m.date)
            const h = d.getHours()
            data[h].count += 1
            data[h].total += m.value
        }
        return data
    }, [filtered])

    const peakHour = useMemo(() => {
        const sorted = [...hourlyBreakdown].sort((a, b) => b.count - a.count)
        return sorted[0]?.count > 0 ? sorted[0] : null
    }, [hourlyBreakdown])

    const maxHourCount = useMemo(() => {
        return Math.max(1, ...hourlyBreakdown.map((h) => h.count))
    }, [hourlyBreakdown])

    // ============= métricas de fluxo =============
    const burnRate = useMemo(() => {
        // saídas médias por dia (com base no recorte)
        const days = dailyTrend.filter((d) => d.entradas + d.saidas > 0).length
        return days > 0 ? totalExits / days : 0
    }, [dailyTrend, totalExits])

    const savingsRate = totalEntries > 0 ? Math.max(0, (balance / totalEntries) * 100) : 0

    // mini sparkline para cada KPI (últimos 7 dias)
    const sparkEntries = dailyTrend.slice(-7).map((d) => ({ v: d.entradas }))
    const sparkExits = dailyTrend.slice(-7).map((d) => ({ v: d.saidas }))
    const sparkBalance = dailyTrend.slice(-7).map((d) => ({ v: d.saldo }))
    const sparkCount = useMemo(() => {
        return dailyTrend.slice(-7).map((d) => {
            const dateStr = (d as any).date as string
            const c = filtered.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === dateStr).length
            return { v: c }
        })
    }, [dailyTrend, filtered])

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
            <div className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

                {/* HERO */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-br from-white via-violet-50/30 to-fuchsia-50/40 dark:from-slate-900 dark:via-violet-950/20 dark:to-fuchsia-950/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(124,58,237,0.18)] mb-6"
                >
                    {/* glow blobs */}
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-400/25 dark:bg-violet-500/15 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-fuchsia-300/15 dark:bg-fuchsia-500/10 blur-3xl pointer-events-none" />
                    {/* grid texture */}
                    <div
                        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                            backgroundSize: "32px 32px",
                            color: "#0f172a",
                        }}
                    />

                    <div className="relative px-6 lg:px-8 py-7 lg:py-8">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/[0.06] text-violet-700 dark:text-violet-300 text-[11px] font-medium border border-violet-200/70 dark:border-violet-800/40 backdrop-blur-sm">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                        </span>
                                        <Activity className="w-3 h-3" /> Caixa ao vivo
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200/70 dark:border-white/[0.08] backdrop-blur-sm">
                                        <Receipt className="w-3 h-3" /> {filtered.length} lançamentos
                                    </span>
                                    {busiestWeekday && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/[0.06] text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200/70 dark:border-amber-800/40 backdrop-blur-sm">
                                            <Flame className="w-3 h-3" /> Pico em {busiestWeekday.label}
                                        </span>
                                    )}
                                    {peakHour && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/[0.06] text-sky-700 dark:text-sky-300 text-[11px] font-medium border border-sky-200/70 dark:border-sky-800/40 backdrop-blur-sm">
                                            <Clock className="w-3 h-3" /> Hora-pico {String(peakHour.hour).padStart(2, "0")}h
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-[32px] lg:text-[38px] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.05]">
                                    Histórico de <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400 bg-clip-text text-transparent">movimentações</span>
                                </h1>
                                <p className="text-[14px] text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
                                    Visão completa de entradas e saídas com inteligência de fluxo —
                                    filtre, compare e exporte em segundos.
                                </p>

                                {/* Mini stats inline */}
                                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                                    <div className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/80 dark:border-white/[0.06] backdrop-blur-sm">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Saldo</p>
                                        <p className={`text-[15px] font-mono font-bold tabular-nums mt-0.5 ${balance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                                            {balance >= 0 ? "+ " : "− "}{formatCurrency(Math.abs(balance))}
                                        </p>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/80 dark:border-white/[0.06] backdrop-blur-sm">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Ticket médio</p>
                                        <p className="text-[15px] font-mono font-bold tabular-nums mt-0.5 text-slate-800 dark:text-slate-100">
                                            {formatCurrency(avgTicket)}
                                        </p>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/80 dark:border-white/[0.06] backdrop-blur-sm">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Burn / dia</p>
                                        <p className="text-[15px] font-mono font-bold tabular-nums mt-0.5 text-slate-800 dark:text-slate-100">
                                            {formatCurrency(burnRate)}
                                        </p>
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-white/80 dark:border-white/[0.06] backdrop-blur-sm">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Taxa retenção</p>
                                        <p className="text-[15px] font-mono font-bold tabular-nums mt-0.5 text-slate-800 dark:text-slate-100">
                                            {savingsRate.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
                                <CashMovementBackupActions onImported={() => refetch()} />
                                <motion.button
                                    type="button"
                                    onClick={() => refetch()}
                                    disabled={loading}
                                    whileTap={{ scale: 0.97 }}
                                    whileHover={{ y: -1 }}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] hover:border-violet-300 hover:bg-white dark:hover:bg-white/[0.1] rounded-xl disabled:opacity-50 transition-all backdrop-blur-sm shadow-sm group"
                                >
                                    <RotateCcw className={`w-3.5 h-3.5 transition-transform ${loading ? "animate-spin text-violet-500" : "group-hover:rotate-180"}`} strokeWidth={2.2} />
                                    <span>{loading ? "Atualizando…" : "Atualizar"}</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                    {/* Entradas */}
                    <KpiCard
                        delay={0.05}
                        accent="emerald"
                        icon={<ArrowDownCircle className="w-4 h-4" strokeWidth={2.2} />}
                        label="Entradas"
                        value={totalEntries}
                        delta={deltaEntries}
                        sparkData={sparkEntries}
                        sparkColor="#10b981"
                        sparkId="spk-en"
                        onClick={() => handleAdjustment("ENTRY")}
                        formatValue={(v) => formatCurrency(v)}
                        countUp={{ end: totalEntries, decimal: ",", decimals: 2, prefix: "R$ ", separator: "." }}
                    />

                    {/* Saídas */}
                    <KpiCard
                        delay={0.08}
                        accent="rose"
                        icon={<ArrowUpCircle className="w-4 h-4" strokeWidth={2.2} />}
                        label="Saídas"
                        value={totalExits}
                        delta={deltaExits}
                        deltaInverted
                        sparkData={sparkExits}
                        sparkColor="#ef4444"
                        sparkId="spk-ex"
                        onClick={() => handleAdjustment("EXIT")}
                        formatValue={(v) => formatCurrency(v)}
                        countUp={{ end: totalExits, decimal: ",", decimals: 2, prefix: "R$ ", separator: "." }}
                    />

                    {/* Saldo */}
                    <KpiCard
                        delay={0.11}
                        accent={balance >= 0 ? "sky" : "rose"}
                        icon={<Wallet className="w-4 h-4" strokeWidth={2.2} />}
                        label="Saldo"
                        value={balance}
                        delta={deltaBalance}
                        sparkData={sparkBalance}
                        sparkColor={balance >= 0 ? "#0ea5e9" : "#ef4444"}
                        sparkId="spk-bal"
                        onClick={() => handleAdjustment("ADJUSTMENT")}
                        formatValue={(v) => formatCurrency(v)}
                        countUp={{ end: balance, decimal: ",", decimals: 2, prefix: "R$ ", separator: "." }}
                        progress={Math.min(100, entriesShare)}
                        progressLabel={`${entriesShare.toFixed(0)}% do volume foi entrada`}
                        valueClassName={balance < 0 ? "text-rose-600 dark:text-rose-400" : ""}
                    />

                    {/* Lançamentos */}
                    <KpiCard
                        delay={0.14}
                        accent="violet"
                        icon={<Receipt className="w-4 h-4" strokeWidth={2.2} />}
                        label="Lançamentos"
                        value={totalCount}
                        delta={deltaCount}
                        sparkData={sparkCount}
                        sparkColor="#a78bfa"
                        sparkId="spk-cnt"
                        sparkAsBars
                        countUp={{ end: totalCount, separator: "." }}
                        subtitle={`Ticket médio ${formatCurrency(avgTicket)}`}
                    />

                    {/* Maior venda */}
                    <KpiCard
                        delay={0.17}
                        accent="amber"
                        icon={<Crown className="w-4 h-4" strokeWidth={2.2} />}
                        label="Maior venda"
                        value={biggestSale}
                        countUp={{ end: biggestSale, decimal: ",", decimals: 2, prefix: "R$ ", separator: "." }}
                        formatValue={(v) => formatCurrency(v)}
                        subtitle={biggestSale > 0 ? "Top venda do recorte" : "Sem vendas"}
                    />

                    {/* Saldo médio diário */}
                    <KpiCard
                        delay={0.2}
                        accent="teal"
                        icon={<Target className="w-4 h-4" strokeWidth={2.2} />}
                        label="Burn rate"
                        value={burnRate}
                        countUp={{ end: burnRate, decimal: ",", decimals: 2, prefix: "R$ ", separator: "." }}
                        formatValue={(v) => formatCurrency(v)}
                        subtitle="Saídas/dia (média)"
                    />
                </div>

                {/* CHARTS row: composição + tendência diária */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
                    {/* DONUT */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 }}
                        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden"
                    >
                        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-violet-200/30 dark:bg-violet-500/10 blur-3xl pointer-events-none" />
                        <div className="relative px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 ring-1 ring-violet-100 dark:ring-violet-500/20 flex items-center justify-center">
                                    <Layers className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Composição</h3>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Entradas vs saídas</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative p-4">
                            {totalVolume === 0 ? (
                                <div className="h-48 grid place-items-center text-[12.5px] text-slate-400">Sem dados no recorte</div>
                            ) : (
                                <div className="relative h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <defs>
                                                <linearGradient id="don-en" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" />
                                                    <stop offset="100%" stopColor="#14b8a6" />
                                                </linearGradient>
                                                <linearGradient id="don-ex" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#ef4444" />
                                                    <stop offset="100%" stopColor="#e11d48" />
                                                </linearGradient>
                                            </defs>
                                            <Pie
                                                data={[
                                                    { name: "Entradas", value: totalEntries },
                                                    { name: "Saídas", value: totalExits },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={56}
                                                outerRadius={84}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                                isAnimationActive
                                                animationDuration={650}
                                            >
                                                <Cell fill="url(#don-en)" />
                                                <Cell fill="url(#don-ex)" />
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "#0f172a",
                                                    border: "none",
                                                    borderRadius: 10,
                                                    color: "#fff",
                                                    fontSize: 12,
                                                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* center label */}
                                    <div className="absolute inset-0 grid place-items-center pointer-events-none">
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Saldo</p>
                                            <p className={`text-[15px] font-mono font-bold tabular-nums ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                {balance >= 0 ? "+" : "−"}{formatCurrency(Math.abs(balance)).replace("R$", "").trim()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-3 text-[12px]">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-50/40 dark:from-emerald-950/30 dark:to-emerald-950/10 border border-emerald-200/40 dark:border-emerald-500/15">
                                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                                        <ArrowDownCircle className="w-3 h-3" /> Entradas
                                    </span>
                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{entriesShare.toFixed(0)}%</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-br from-rose-50 to-rose-50/40 dark:from-rose-950/30 dark:to-rose-950/10 border border-rose-200/40 dark:border-rose-500/15">
                                    <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[11px] font-medium">
                                        <ArrowUpCircle className="w-3 h-3" /> Saídas
                                    </span>
                                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{(100 - entriesShare).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* TREND 14 dias */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="lg:col-span-2 relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden"
                    >
                        <div className="absolute -top-20 -left-10 w-72 h-32 bg-gradient-to-r from-emerald-200/30 to-rose-200/30 dark:from-emerald-500/5 dark:to-rose-500/5 blur-3xl pointer-events-none" />
                        <div className="relative px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-white/[0.06] flex items-center justify-center">
                                    <LineChartIcon className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Tendência diária</h3>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Fluxo dos últimos 14 dias</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10.5px] flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Entradas
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Saídas
                                </span>
                            </div>
                        </div>
                        <div className="relative p-3 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad-en" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="grad-ex" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                                        labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                                        cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                                    />
                                    <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2.25} fill="url(#grad-en)" isAnimationActive animationDuration={750} dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 2, fill: "#10b981", stroke: "#fff" }} />
                                    <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2.25} fill="url(#grad-ex)" isAnimationActive animationDuration={750} dot={{ r: 0 }} activeDot={{ r: 4, strokeWidth: 2, fill: "#ef4444", stroke: "#fff" }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* CATEGORY BREAKDOWN */}
                {categoryBreakdown.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl mb-6"
                    >
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div>
                                <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Por categoria</h3>
                                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{categoryBreakdown.length} categoria(s) ativas</p>
                            </div>
                            <Hash className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categoryBreakdown.map((c) => {
                                const pct = totalVolume > 0 ? (c.total / totalVolume) * 100 : 0
                                return (
                                    <motion.div
                                        key={c.category}
                                        whileHover={{ scale: 1.02 }}
                                        className="p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/15 transition-colors cursor-pointer"
                                        onClick={() => handleFilterChange(c.category as FilterType)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                                                <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200">{c.label}</span>
                                            </div>
                                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{c.count}x</span>
                                        </div>
                                        <p className="text-[16px] font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                                            {formatCurrency(c.total)}
                                        </p>
                                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: c.color }}
                                            />
                                        </div>
                                        <p className="mt-1 text-[10.5px] text-slate-500 dark:text-slate-400">{pct.toFixed(1)}% do volume</p>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ACTIVITY: weekday + hour heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
                    {/* Weekday */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl"
                    >
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-500/20 flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Atividade por dia da semana</h3>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Distribuição entradas vs saídas</p>
                                </div>
                            </div>
                            {busiestWeekday && (
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25">
                                    <Flame className="w-3 h-3" /> Pico em {busiestWeekday.label}
                                </span>
                            )}
                        </div>
                        <div className="p-3 h-56">
                            {totalVolume === 0 ? (
                                <div className="h-full grid place-items-center text-[12.5px] text-slate-400">Sem dados</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weekdayBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.45} vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                                            labelStyle={{ color: "#cbd5e1" }}
                                            cursor={{ fill: "rgba(148,163,184,0.08)" }}
                                        />
                                        <Bar dataKey="entradas" fill="#10b981" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="saidas" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Hour heatmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.45 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl"
                    >
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-1 ring-sky-100 dark:ring-sky-500/20 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Por hora do dia</h3>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{peakHour ? `Pico ${String(peakHour.hour).padStart(2, "0")}h` : "Sem dados"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-12 gap-1">
                                {hourlyBreakdown.map((h) => {
                                    const intensity = h.count / maxHourCount
                                    const opacity = h.count === 0 ? 0.06 : 0.18 + intensity * 0.82
                                    return (
                                        <div
                                            key={h.hour}
                                            title={`${String(h.hour).padStart(2, "0")}h — ${h.count} lançamento(s) · ${formatCurrency(h.total)}`}
                                            className="aspect-square rounded-md transition-transform hover:scale-110 cursor-default"
                                            style={{
                                                backgroundColor: `rgba(124, 58, 237, ${opacity})`,
                                                outline: h.count > 0 ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(148,163,184,0.15)",
                                            }}
                                        />
                                    )
                                })}
                            </div>
                            <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                                <span>00h</span>
                                <span>06h</span>
                                <span>12h</span>
                                <span>18h</span>
                                <span>23h</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">Menor</span>
                                <div className="flex-1 h-1.5 rounded-full" style={{ background: "linear-gradient(to right, rgba(124,58,237,0.06), rgba(124,58,237,1))" }} />
                                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">Maior</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* TOP MOVEMENTS */}
                {(topEntries.length > 0 || topExits.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                        {/* Top entradas */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden"
                        >
                            <div className="relative px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-500/25 flex items-center justify-center shadow-sm">
                                        <Trophy className="w-4 h-4" strokeWidth={2.2} />
                                    </span>
                                    <div>
                                        <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Top entradas</h3>
                                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Maiores recebimentos do recorte</p>
                                    </div>
                                </div>
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    {topEntries.length} de {filtered.filter(m => m.type === "ENTRY").length}
                                </span>
                            </div>
                            <div className="p-2">
                                {topEntries.length === 0 ? (
                                    <div className="px-3 py-8 text-center text-[12.5px] text-slate-400">Sem entradas no recorte</div>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                        {topEntries.map((m, idx) => {
                                            const max = topEntries[0]?.value || 1
                                            const pct = (m.value / max) * 100
                                            return (
                                                <li key={m.id} className="px-3 py-2.5 flex items-center gap-3 group hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 rounded-lg transition-colors cursor-pointer" onClick={() => openViewModal(m)}>
                                                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11.5px] font-bold tabular-nums shrink-0 ${idx === 0
                                                        ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm"
                                                        : idx === 1
                                                            ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm"
                                                            : idx === 2
                                                                ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm"
                                                                : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                                                        }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{m.description}</p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0">
                                                                {formatDate(m.date)} · {typeLabels[mapCategoryToSubtype(m.category as string)]}
                                                            </span>
                                                            <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.7, delay: idx * 0.05 }}
                                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[13px] font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                                                        + {formatCurrency(m.value)}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>
                        </motion.div>

                        {/* Top saídas */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.55 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden"
                        >
                            <div className="relative px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-transparent dark:from-rose-950/20">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200/50 dark:ring-rose-500/25 flex items-center justify-center shadow-sm">
                                        <Zap className="w-4 h-4" strokeWidth={2.2} />
                                    </span>
                                    <div>
                                        <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Top saídas</h3>
                                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Maiores despesas do recorte</p>
                                    </div>
                                </div>
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                    {topExits.length} de {filtered.filter(m => m.type === "EXIT").length}
                                </span>
                            </div>
                            <div className="p-2">
                                {topExits.length === 0 ? (
                                    <div className="px-3 py-8 text-center text-[12.5px] text-slate-400">Sem saídas no recorte</div>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                        {topExits.map((m, idx) => {
                                            const max = topExits[0]?.value || 1
                                            const pct = (m.value / max) * 100
                                            return (
                                                <li key={m.id} className="px-3 py-2.5 flex items-center gap-3 group hover:bg-rose-50/40 dark:hover:bg-rose-950/10 rounded-lg transition-colors cursor-pointer" onClick={() => openViewModal(m)}>
                                                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11.5px] font-bold tabular-nums shrink-0 ${idx === 0
                                                        ? "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm"
                                                        : idx === 1
                                                            ? "bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-sm"
                                                            : idx === 2
                                                                ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm"
                                                                : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"
                                                        }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{m.description}</p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0">
                                                                {formatDate(m.date)} · {typeLabels[mapCategoryToSubtype(m.category as string)]}
                                                            </span>
                                                            <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 0.7, delay: idx * 0.05 }}
                                                                    className="h-full bg-gradient-to-r from-rose-500 to-red-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[13px] font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400 shrink-0">
                                                        − {formatCurrency(m.value)}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* FILTERS + TABLE */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden"
                >
                    {/* HEADER */}
                    <div className="px-5 lg:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20">
                        <div className="flex items-center gap-2">
                            <span className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 ring-1 ring-violet-100 dark:ring-violet-500/20 flex items-center justify-center shadow-sm">
                                <ListIcon className="w-4 h-4" strokeWidth={2.2} />
                            </span>
                            <div>
                                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white tracking-tight">Lista de movimentações</h2>
                                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Filtre, ordene e exporte. Clique para ver detalhes.</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-semibold border border-emerald-200/60 dark:border-emerald-500/20">
                                <ArrowDownCircle className="w-3 h-3" /> {filtered.filter(m => m.type === "ENTRY").length} entradas
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10.5px] font-semibold border border-rose-200/60 dark:border-rose-500/20">
                                <ArrowUpCircle className="w-3 h-3" /> {filtered.filter(m => m.type === "EXIT").length} saídas
                            </span>
                        </div>
                    </div>

                    {/* TOOLBAR */}
                    <div className="px-5 lg:px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-4">
                            <div className="relative flex-1 max-w-lg group">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" strokeWidth={2} />
                                <input
                                    type="text"
                                    placeholder="Buscar por descrição, valor, categoria…"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                                    className="w-full h-11 pl-11 pr-20 text-[13.5px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                                />
                                <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08] text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
                                    {search ? (
                                        <button type="button" onClick={() => { setSearch(""); setCurrentPage(1) }} className="px-1 hover:text-rose-500">limpar</button>
                                    ) : "⌘K"}
                                </kbd>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <ExportPdfDropdown
                                    movements={movements}
                                    generateAllPdf={generateMovementsPdf}
                                    generateTodayPdf={generateTodayPdf}
                                />
                                <div className="relative inline-flex rounded-xl border border-slate-200 dark:border-white/[0.08] p-1 bg-slate-50 dark:bg-slate-950">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("table")}
                                        className={`relative z-10 flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-semibold transition-colors ${viewMode === "table" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
                                    >
                                        <ListIcon className="w-3.5 h-3.5" /> Tabela
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("cards")}
                                        className={`relative z-10 flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-semibold transition-colors ${viewMode === "cards" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" /> Cards
                                    </button>
                                    <motion.span
                                        layout
                                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                        className="absolute top-1 bottom-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-white/[0.06]"
                                        style={{
                                            left: viewMode === "table" ? 4 : "calc(50% + 0px)",
                                            right: viewMode === "cards" ? 4 : "calc(50% + 0px)",
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-[12.5px] font-semibold border transition-all ${showFilters ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700/50 shadow-sm" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-slate-300"}`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filtros
                                    {activeFilters.length > 0 && (
                                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold">{activeFilters.length}</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Quick date pills */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                            <span className="inline-flex items-center gap-1 mr-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                                <CalendarDays className="w-3.5 h-3.5" /> Período
                            </span>
                            {[
                                { value: "", label: "Tudo" },
                                { value: "today", label: "Hoje" },
                                { value: "yesterday", label: "Ontem" },
                                { value: "this-week", label: "Semana" },
                                { value: "last-7-days", label: "7 dias" },
                                { value: "this-month", label: "Mês" },
                                { value: "last-month", label: "Mês anterior" },
                                { value: "last-30-days", label: "30 dias" },
                            ].map((f) => (
                                <motion.button
                                    key={f.value}
                                    onClick={() => handleQuickDateFilterChange(f.value)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-3 h-7 rounded-full text-[11.5px] font-medium transition-all border ${quickDateFilter === f.value
                                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-violet-600 shadow-sm shadow-violet-500/25"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-violet-300 hover:text-violet-700 dark:hover:border-violet-700"}`}
                                >
                                    {f.label}
                                </motion.button>
                            ))}
                        </div>

                        {/* Category chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 mr-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                                <ListFilter className="w-3.5 h-3.5" /> Tipo
                            </span>
                            {([
                                { value: "ALL", label: "Todas", icon: "💸", activeClass: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" },
                                { value: "ENTRY", label: "Entradas", icon: "➕", activeClass: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40" },
                                { value: "EXIT", label: "Saídas", icon: "➖", activeClass: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40" },
                                { value: "SALE", label: "Vendas", icon: "💰", activeClass: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40" },
                                { value: "EXPENSE", label: "Despesas", icon: "🧾", activeClass: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40" },
                                { value: "CHANGE", label: "Troco", icon: "💱", activeClass: "bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/40" },
                                { value: "WITHDRAWAL", label: "Saques", icon: "🏧", activeClass: "bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/40" },
                                { value: "PAYMENT", label: "Pagamentos", icon: "💳", activeClass: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40" },
                            ] as const).map((f) => {
                                const active = filter === f.value
                                return (
                                    <motion.button
                                        key={f.value}
                                        onClick={() => handleFilterChange(f.value as FilterType)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-[11.5px] font-semibold transition-all border ${active
                                            ? `${f.activeClass} shadow-sm`
                                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"}`}
                                    >
                                        <span>{f.icon}</span>
                                        <span>{f.label}</span>
                                    </motion.button>
                                )
                            })}
                        </div>

                        {/* Advanced filters */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 mt-3 border-t border-slate-100 dark:border-white/[0.06]">
                                        <div>
                                            <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">Tipo detalhado</label>
                                            <select
                                                value={filter}
                                                onChange={(e) => handleFilterChange(e.target.value as FilterType)}
                                                className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg text-[13px] bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                                            <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">Data inicial</label>
                                            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setQuickDateFilter(""); setCurrentPage(1) }} className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg text-[13px] bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">Data final</label>
                                            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setQuickDateFilter(""); setCurrentPage(1) }} className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg text-[13px] bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Valor mín." value={valueMin} onChange={(v: string) => { setValueMin(v); setCurrentPage(1) }} />
                                            <Input label="Valor máx." value={valueMax} onChange={(v: string) => { setValueMax(v); setCurrentPage(1) }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Active filter chips */}
                        {activeFilters.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]"
                            >
                                <FilterIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Filtros ativos:</span>
                                {activeFilters.map((f) => (
                                    <span key={f.key} className="inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-medium bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900/40">
                                        {f.label}
                                        <button type="button" onClick={f.onClear} className="hover:bg-violet-200 dark:hover:bg-violet-900/40 rounded-full p-0.5 -mr-1">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                                <button type="button" onClick={clearAllFilters} className="text-[11px] text-rose-600 hover:text-rose-700 ml-1 underline-offset-2 hover:underline">
                                    Limpar tudo
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* SORT BAR */}
                    <div className="px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-2 text-[12px]">
                            <span className="text-slate-500 dark:text-slate-400">Ordenar:</span>
                            {(["date", "value", "description"] as SortField[]).map((field) => {
                                const active = sortField === field
                                const labels = { date: "Data", value: "Valor", description: "Descrição" }
                                return (
                                    <button
                                        key={field}
                                        onClick={() => handleSortChange(field)}
                                        className={`flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors ${active ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"}`}
                                    >
                                        {labels[field]}
                                        {active && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="flex items-center gap-3 text-[12px]">
                            <span className="text-slate-500 dark:text-slate-400">
                                {sorted.length === 0 ? "Nenhum resultado" : `${startIndex + 1}–${Math.min(endIndex, sorted.length)} de ${sorted.length}`}
                            </span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                                className="px-2 h-7 border border-slate-200 dark:border-white/[0.08] rounded-md text-[12px] bg-white dark:bg-slate-900"
                            >
                                <option value={5}>5/pág</option>
                                <option value={10}>10/pág</option>
                                <option value={20}>20/pág</option>
                                <option value={50}>50/pág</option>
                                <option value={100}>100/pág</option>
                            </select>
                        </div>
                    </div>

                    {/* CONTENT: TABLE / CARDS */}
                    {paginatedMovements.length === 0 ? (
                        <div className="text-center py-24 px-6">
                            <div className="relative w-20 h-20 mx-auto mb-5">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 blur-xl" />
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 ring-1 ring-violet-200/60 dark:ring-violet-500/20 grid place-items-center">
                                    <Search className="w-8 h-8 text-violet-500 dark:text-violet-400" strokeWidth={1.5} />
                                </div>
                            </div>
                            <p className="text-[16px] font-bold text-slate-700 dark:text-slate-200">Nenhuma movimentação encontrada</p>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Ajuste os filtros, mude o período ou limpe a busca para ver mais resultados.</p>
                            {activeFilters.length > 0 && (
                                <button onClick={clearAllFilters} className="mt-5 inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-[12.5px] font-semibold shadow-sm shadow-violet-500/25 transition-all">
                                    <X className="w-3.5 h-3.5" /> Limpar filtros
                                </button>
                            )}
                        </div>
                    ) : viewMode === "table" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-b from-slate-50 to-slate-50/40 dark:from-white/[0.03] dark:to-white/[0.01] border-b border-slate-200 dark:border-white/[0.06]">
                                    <tr className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <th className="px-5 py-3.5 text-left font-bold">
                                            <button onClick={() => handleSortChange("date")} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                                                Data
                                                {sortField === "date" && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-violet-500" /> : <ArrowDown className="w-3 h-3 text-violet-500" />)}
                                            </button>
                                        </th>
                                        <th className="px-5 py-3.5 text-left font-bold">
                                            <button onClick={() => handleSortChange("description")} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                                                Descrição
                                                {sortField === "description" && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-violet-500" /> : <ArrowDown className="w-3 h-3 text-violet-500" />)}
                                            </button>
                                        </th>
                                        <th className="px-5 py-3.5 text-left font-bold">Categoria</th>
                                        <th className="px-5 py-3.5 text-left font-bold">Pagamento</th>
                                        <th className="px-5 py-3.5 text-left font-bold">Banco</th>
                                        <th className="px-5 py-3.5 text-right font-bold">
                                            <button onClick={() => handleSortChange("value")} className="inline-flex items-center gap-1 ml-auto hover:text-slate-900 dark:hover:text-white transition-colors">
                                                Valor
                                                {sortField === "value" && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-violet-500" /> : <ArrowDown className="w-3 h-3 text-violet-500" />)}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3.5 text-center font-bold w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {paginatedMovements.map((m, idx) => {
                                            const sub = mapCategoryToSubtype(m.category as string)
                                            const SUBCONFIG: Record<Subtype, { border: string; bg: string; text: string; ring: string; gradFrom: string; gradTo: string }> = {
                                                SALE: { border: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-500/20", gradFrom: "from-emerald-500", gradTo: "to-teal-500" },
                                                CHANGE: { border: "border-l-teal-500", bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200 dark:ring-teal-500/20", gradFrom: "from-teal-500", gradTo: "to-cyan-500" },
                                                OTHER_IN: { border: "border-l-green-500", bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-700 dark:text-green-300", ring: "ring-green-200 dark:ring-green-500/20", gradFrom: "from-green-500", gradTo: "to-emerald-500" },
                                                EXPENSE: { border: "border-l-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-500/20", gradFrom: "from-rose-500", gradTo: "to-red-500" },
                                                WITHDRAWAL: { border: "border-l-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-200 dark:ring-orange-500/20", gradFrom: "from-orange-500", gradTo: "to-amber-500" },
                                                PAYMENT: { border: "border-l-red-500", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-300", ring: "ring-red-200 dark:ring-red-500/20", gradFrom: "from-red-500", gradTo: "to-rose-500" },
                                            }
                                            const cfg = SUBCONFIG[sub]
                                            const bank = m.bankId ? bankMap.get(m.bankId) : null
                                            return (
                                                <motion.tr
                                                    key={m.id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2, delay: idx * 0.015 }}
                                                    onClick={() => openViewModal(m)}
                                                    className={`group border-b border-slate-100 dark:border-white/[0.04] border-l-[3px] ${cfg.border} hover:bg-slate-50/70 dark:hover:bg-white/[0.025] transition-colors cursor-pointer`}
                                                >
                                                    <td className="px-5 py-3.5 text-[12.5px] text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                                        <div className="font-semibold">{formatDate(m.date)}</div>
                                                        {m.date && <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 inline-flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatTime(m.date)}</div>}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-[12.5px] font-medium text-slate-900 dark:text-white max-w-md">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`shrink-0 w-8 h-8 rounded-lg ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring} grid place-items-center shadow-sm`}>
                                                                {m.type === "ENTRY" ? <ArrowDownCircle className="w-4 h-4" strokeWidth={2} /> : <ArrowUpCircle className="w-4 h-4" strokeWidth={2} />}
                                                            </span>
                                                            <span className="line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{m.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-[12.5px]">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.ring.replace("ring-", "border-").replace("/20", "/40").replace("/30", "/50")}`}>
                                                            {typeLabels[sub]}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-[12.5px]">
                                                        {m.typePayment ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20">
                                                                <CreditCard className="w-2.5 h-2.5" />
                                                                {paymentMethodLabels[m.typePayment]}
                                                            </span>
                                                        ) : (<span className="text-slate-300 dark:text-slate-600 text-[11px]">—</span>)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-[12.5px]">
                                                        {bank ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.06]">
                                                                <span className="w-1.5 h-1.5 rounded-full ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: bank.corHex }} />
                                                                {bank.name}
                                                            </span>
                                                        ) : (<span className="text-slate-300 dark:text-slate-600 text-[11px]">—</span>)}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                        <span className={`text-[14px] font-mono font-bold tabular-nums ${m.type === "ENTRY" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                            {m.type === "ENTRY" ? "+" : "−"} {formatCurrency(m.value)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
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
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            <AnimatePresence>
                                {paginatedMovements.map((m, idx) => {
                                    const sub = mapCategoryToSubtype(m.category as string)
                                    const SUBCFG: Record<Subtype, { iconBg: string; iconText: string; iconRing: string; bar: string }> = {
                                        SALE: { iconBg: "bg-emerald-50 dark:bg-emerald-500/10", iconText: "text-emerald-700 dark:text-emerald-400", iconRing: "ring-emerald-100 dark:ring-emerald-500/20", bar: "from-emerald-500 to-teal-500" },
                                        CHANGE: { iconBg: "bg-teal-50 dark:bg-teal-500/10", iconText: "text-teal-700 dark:text-teal-400", iconRing: "ring-teal-100 dark:ring-teal-500/20", bar: "from-teal-500 to-cyan-500" },
                                        OTHER_IN: { iconBg: "bg-green-50 dark:bg-green-500/10", iconText: "text-green-700 dark:text-green-400", iconRing: "ring-green-100 dark:ring-green-500/20", bar: "from-green-500 to-emerald-500" },
                                        EXPENSE: { iconBg: "bg-rose-50 dark:bg-rose-500/10", iconText: "text-rose-700 dark:text-rose-400", iconRing: "ring-rose-100 dark:ring-rose-500/20", bar: "from-rose-500 to-red-500" },
                                        WITHDRAWAL: { iconBg: "bg-orange-50 dark:bg-orange-500/10", iconText: "text-orange-700 dark:text-orange-400", iconRing: "ring-orange-100 dark:ring-orange-500/20", bar: "from-orange-500 to-amber-500" },
                                        PAYMENT: { iconBg: "bg-red-50 dark:bg-red-500/10", iconText: "text-red-700 dark:text-red-400", iconRing: "ring-red-100 dark:ring-red-500/20", bar: "from-red-500 to-rose-500" },
                                    }
                                    const cfg = SUBCFG[sub]
                                    const bank = m.bankId ? bankMap.get(m.bankId) : null
                                    return (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, scale: 0.97 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            whileHover={{ y: -4 }}
                                            onClick={() => openViewModal(m)}
                                            className={`relative p-4 rounded-2xl border bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-slate-900/5 transition-all cursor-pointer overflow-hidden ${m.type === "ENTRY" ? "border-emerald-200/60 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40" : "border-rose-200/60 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40"}`}
                                        >
                                            <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${cfg.bar}`} />
                                            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br ${cfg.bar} opacity-[0.08] blur-2xl pointer-events-none`} />
                                            <div className="relative flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-9 h-9 rounded-xl ${cfg.iconBg} ${cfg.iconText} ring-1 ${cfg.iconRing} grid place-items-center shadow-sm`}>
                                                        {m.type === "ENTRY" ? <ArrowDownCircle className="w-4 h-4" strokeWidth={2.2} /> : <ArrowUpCircle className="w-4 h-4" strokeWidth={2.2} />}
                                                    </span>
                                                    <div>
                                                        <span className={`block text-[10.5px] font-bold uppercase tracking-wider ${cfg.iconText}`}>
                                                            {typeLabels[sub]}
                                                        </span>
                                                        <span className="text-[10.5px] text-slate-400 dark:text-slate-500">{formatDate(m.date)}</span>
                                                    </div>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <ActionsDropdown
                                                        movement={m}
                                                        onView={openViewModal}
                                                        onEdit={openEditModal}
                                                        onDelete={openDeleteModal}
                                                        onReverse={handleReverse}
                                                        isDeleting={deletingId === m.id}
                                                    />
                                                </div>
                                            </div>
                                            <p className="relative text-[13px] font-semibold text-slate-900 dark:text-white line-clamp-2 mb-3 min-h-[34px]">{m.description}</p>
                                            <p className={`relative text-[22px] font-mono font-bold tabular-nums leading-none tracking-tight ${m.type === "ENTRY" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                {m.type === "ENTRY" ? "+" : "−"} {formatCurrency(m.value)}
                                            </p>
                                            <div className="relative mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between gap-2 text-[11px]">
                                                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                    <Clock className="w-3 h-3" /> {formatTime(m.date)}
                                                </span>
                                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                    {m.typePayment && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                                            <CreditCard className="w-2.5 h-2.5" />
                                                            {paymentMethodLabels[m.typePayment].split(" ")[0]}
                                                        </span>
                                                    )}
                                                    {bank && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200">
                                                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: bank.corHex }} />
                                                            {bank.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.01]">
                            <div className="text-[12px] text-slate-500 dark:text-slate-400">
                                Página <span className="font-semibold text-slate-700 dark:text-slate-200">{currentPage}</span> de <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Primeira"><ChevronsLeft className="w-4 h-4" /></button>
                                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Anterior"><ChevronLeft className="w-4 h-4" /></button>
                                <div className="flex gap-1 mx-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum
                                        if (totalPages <= 5) pageNum = i + 1
                                        else if (currentPage <= 3) pageNum = i + 1
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                                        else pageNum = currentPage - 2 + i
                                        const active = currentPage === pageNum
                                        return (
                                            <motion.button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                whileTap={{ scale: 0.95 }}
                                                className={`min-w-[28px] h-7 px-2 rounded-md text-[12px] font-medium transition-colors ${active ? "bg-violet-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"}`}
                                            >
                                                {pageNum}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Próxima"><ChevronRight className="w-4 h-4" /></button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Última"><ChevronsRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </motion.div>
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

type KpiAccent = "emerald" | "rose" | "sky" | "violet" | "amber" | "teal"

const accentMap: Record<KpiAccent, { bar: string; iconBg: string; iconText: string; iconRing: string; hoverBorder: string; hoverShadow: string; deltaBg: string; deltaText: string }> = {
    emerald: {
        bar: "from-emerald-500 to-teal-500",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        iconText: "text-emerald-700 dark:text-emerald-400",
        iconRing: "ring-emerald-100 dark:ring-emerald-500/20",
        hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
        hoverShadow: "hover:shadow-emerald-500/10",
        deltaBg: "bg-emerald-50 dark:bg-emerald-500/10",
        deltaText: "text-emerald-700 dark:text-emerald-300",
    },
    rose: {
        bar: "from-rose-500 to-red-500",
        iconBg: "bg-rose-50 dark:bg-rose-500/10",
        iconText: "text-rose-700 dark:text-rose-400",
        iconRing: "ring-rose-100 dark:ring-rose-500/20",
        hoverBorder: "hover:border-rose-300 dark:hover:border-rose-500/40",
        hoverShadow: "hover:shadow-rose-500/10",
        deltaBg: "bg-rose-50 dark:bg-rose-500/10",
        deltaText: "text-rose-700 dark:text-rose-300",
    },
    sky: {
        bar: "from-sky-500 to-blue-500",
        iconBg: "bg-sky-50 dark:bg-sky-500/10",
        iconText: "text-sky-700 dark:text-sky-400",
        iconRing: "ring-sky-100 dark:ring-sky-500/20",
        hoverBorder: "hover:border-sky-300 dark:hover:border-sky-500/40",
        hoverShadow: "hover:shadow-sky-500/10",
        deltaBg: "bg-sky-50 dark:bg-sky-500/10",
        deltaText: "text-sky-700 dark:text-sky-300",
    },
    violet: {
        bar: "from-violet-500 to-fuchsia-500",
        iconBg: "bg-violet-50 dark:bg-violet-500/10",
        iconText: "text-violet-700 dark:text-violet-400",
        iconRing: "ring-violet-100 dark:ring-violet-500/20",
        hoverBorder: "hover:border-violet-300 dark:hover:border-violet-500/40",
        hoverShadow: "hover:shadow-violet-500/10",
        deltaBg: "bg-violet-50 dark:bg-violet-500/10",
        deltaText: "text-violet-700 dark:text-violet-300",
    },
    amber: {
        bar: "from-amber-500 to-orange-500",
        iconBg: "bg-amber-50 dark:bg-amber-500/10",
        iconText: "text-amber-700 dark:text-amber-400",
        iconRing: "ring-amber-100 dark:ring-amber-500/20",
        hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/40",
        hoverShadow: "hover:shadow-amber-500/10",
        deltaBg: "bg-amber-50 dark:bg-amber-500/10",
        deltaText: "text-amber-700 dark:text-amber-300",
    },
    teal: {
        bar: "from-teal-500 to-cyan-500",
        iconBg: "bg-teal-50 dark:bg-teal-500/10",
        iconText: "text-teal-700 dark:text-teal-400",
        iconRing: "ring-teal-100 dark:ring-teal-500/20",
        hoverBorder: "hover:border-teal-300 dark:hover:border-teal-500/40",
        hoverShadow: "hover:shadow-teal-500/10",
        deltaBg: "bg-teal-50 dark:bg-teal-500/10",
        deltaText: "text-teal-700 dark:text-teal-300",
    },
}

function DeltaBadge({ delta, inverted = false }: { delta: number; inverted?: boolean }) {
    const isPositive = delta >= 0
    const isGood = inverted ? !isPositive : isPositive
    const Icon = Math.abs(delta) < 0.5 ? Minus : isPositive ? TrendingUp : TrendingDown

    const colors = isGood
        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/25"
        : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-500/25"

    return (
        <span className={`inline-flex items-center gap-0.5 px-1.5 h-5 rounded-md text-[10px] font-semibold tabular-nums border ${colors}`}>
            <Icon className="w-2.5 h-2.5" strokeWidth={2.5} />
            {Math.abs(delta).toFixed(1)}%
        </span>
    )
}

function KpiCard({
    delay = 0,
    accent,
    icon,
    label,
    value,
    delta,
    deltaInverted,
    sparkData,
    sparkColor,
    sparkId,
    sparkAsBars,
    onClick,
    formatValue,
    countUp,
    subtitle,
    progress,
    progressLabel,
    valueClassName = "",
}: {
    delay?: number
    accent: KpiAccent
    icon: React.ReactNode
    label: string
    value: number
    delta?: number
    deltaInverted?: boolean
    sparkData?: Array<{ v: number }>
    sparkColor?: string
    sparkId?: string
    sparkAsBars?: boolean
    onClick?: () => void
    formatValue?: (v: number) => string
    countUp?: { end: number; decimal?: string; decimals?: number; prefix?: string; separator?: string }
    subtitle?: string
    progress?: number
    progressLabel?: string
    valueClassName?: string
}) {
    const a = accentMap[accent]
    const Wrapper: any = onClick ? motion.button : motion.div
    const wrapperProps: any = onClick
        ? { type: "button", onClick, whileHover: { y: -3 }, whileTap: { scale: 0.99 } }
        : { whileHover: { y: -3 } }

    return (
        <Wrapper
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            {...wrapperProps}
            className={`group relative overflow-hidden text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 hover:shadow-xl ${a.hoverBorder} ${a.hoverShadow} transition-all`}
        >
            {/* gradient bar top */}
            <span className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${a.bar}`} />

            {/* radial decoration */}
            <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${a.bar} opacity-[0.06] blur-2xl pointer-events-none`} />

            <div className="relative flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`w-9 h-9 rounded-xl ${a.iconBg} ${a.iconText} ring-1 ${a.iconRing} flex items-center justify-center shadow-sm`}>
                        {icon}
                    </span>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                </div>
                {typeof delta === "number" && Number.isFinite(delta) && (
                    <DeltaBadge delta={delta} inverted={deltaInverted} />
                )}
            </div>

            <div className="relative mt-3">
                <p className={`text-[22px] font-bold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight ${valueClassName}`}>
                    {countUp ? (
                        <CountUp
                            end={countUp.end}
                            decimal={countUp.decimal}
                            decimals={countUp.decimals}
                            prefix={countUp.prefix}
                            separator={countUp.separator}
                            duration={0.9}
                        />
                    ) : formatValue ? formatValue(value) : value}
                </p>
                {subtitle && (
                    <p className="mt-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {subtitle}
                    </p>
                )}
                {typeof progress === "number" && (
                    <>
                        <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full bg-gradient-to-r ${a.bar}`}
                            />
                        </div>
                        {progressLabel && (
                            <p className="mt-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">{progressLabel}</p>
                        )}
                    </>
                )}
            </div>

            {/* sparkline */}
            {sparkData && sparkData.length > 0 && sparkColor && sparkId && (
                <div className="absolute bottom-0 right-0 w-24 h-12 opacity-80 pointer-events-none">
                    <ResponsiveContainer>
                        {sparkAsBars ? (
                            <BarChart data={sparkData}>
                                <Bar dataKey="v" fill={sparkColor} radius={[2, 2, 0, 0]} />
                            </BarChart>
                        ) : (
                            <AreaChart data={sparkData}>
                                <defs>
                                    <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={sparkColor} stopOpacity={0.5} />
                                        <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.75} fill={`url(#${sparkId})`} />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}
        </Wrapper>
    )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label.includes("Mín") ? "0" : "9999"}
                className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-xl"
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
    const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/[0.06] before:to-transparent"
    return (
        <div className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
            {/* Hero skeleton */}
            <div className={`${shimmer} relative h-44 rounded-3xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] mb-6`} />

            {/* KPIs skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`${shimmer} h-28 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]`} />
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
                <div className={`${shimmer} h-72 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]`} />
                <div className={`${shimmer} lg:col-span-2 h-72 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]`} />
            </div>

            {/* Activity skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                <div className={`${shimmer} h-64 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]`} />
                <div className={`${shimmer} h-64 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]`} />
            </div>

            {/* Table skeleton */}
            <div className={`${shimmer} h-96 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]`} />
        </div>
    )
}