"use client"

// src/pages/FinancialManagement.tsx
import { useState, useMemo, useCallback } from "react"
import toast, { Toaster } from "react-hot-toast"

// Ícones
import { DollarSign, FileText, CheckCircle, Clock, AlertTriangle, Search, Download, Edit } from "lucide-react"

// Gráficos
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

// === DEFINIÇÕES DE TIPOS ===
type Receivable = {
    id: string
    clientName: string
    description: string
    value: number
    dueDate: string
    status: "pendente" | "pago" | "vencido"
}

type Payable = {
    id: string
    supplierName: string
    description: string
    value: number
    dueDate: string
    status: "pendente" | "pago" | "vencido"
}

// === UTILITÁRIOS DE FORMATAÇÃO ===
const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

const formatDate = (date: string) => new Date(date).toLocaleDateString("pt-BR")

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

const isNearDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
}

// Dados analíticos de performance comercial por região
const salesData = [
    { estado: "SP", acessorios: 20450, bicicletas: 102300, vestuario: 70259 },
    { estado: "RJ", acessorios: 22099, bicicletas: 103432, vestuario: 53164 },
    { estado: "MG", acessorios: 9000, bicicletas: 79000, vestuario: 27035 },
    { estado: "BA", acessorios: 7900, bicicletas: 67190, vestuario: 23565 },
    { estado: "PR", acessorios: 9888, bicicletas: 80100, vestuario: 32239 },
    { estado: "GO", acessorios: 6500, bicicletas: 32432, vestuario: 33507 },
]

// Paleta cromática para visualizações de dados
const COLORS = ["#00C49F", "#FFBB28", "#FF8042"]

// === MÓDULO PRINCIPAL DE GESTÃO FINANCEIRA ===
export function FinancialManagement() {
    // Base de dados de contas a receber
    const [receivables, setReceivables] = useState<Receivable[]>([
        {
            id: "1",
            clientName: "João Silva",
            description: "Faturamento de produtos comercializados",
            value: 1500,
            dueDate: "2025-04-10",
            status: "pendente",
        },
        {
            id: "2",
            clientName: "Maria Oliveira",
            description: "Prestação de serviços especializados",
            value: 800,
            dueDate: "2025-04-05",
            status: "vencido",
        },
        {
            id: "3",
            clientName: "Carlos Souza",
            description: "Consultoria empresarial estratégica",
            value: 2500,
            dueDate: "2025-04-15",
            status: "pendente",
        },
        {
            id: "4",
            clientName: "Ana Lima",
            description: "Transação comercial eletrônica",
            value: 600,
            dueDate: "2025-04-01",
            status: "pago",
        },
    ])

    // Base de dados de contas a pagar
    const [payables, setPayables] = useState<Payable[]>([
        {
            id: "1",
            supplierName: "Fornecedor A",
            description: "Aquisição de matérias-primas",
            value: 3000,
            dueDate: "2025-04-12",
            status: "pendente",
        },
        {
            id: "2",
            supplierName: "Fornecedor B",
            description: "Locação de instalações comerciais",
            value: 1200,
            dueDate: "2025-04-05",
            status: "vencido",
        },
        {
            id: "3",
            supplierName: "Fornecedor C",
            description: "Fornecimento de energia elétrica",
            value: 450,
            dueDate: "2025-04-10",
            status: "pendente",
        },
        {
            id: "4",
            supplierName: "Fornecedor D",
            description: "Serviços de conectividade digital",
            value: 200,
            dueDate: "2025-04-01",
            status: "pago",
        },
    ])

    // Estados de controle da interface
    const [searchTerm, setSearchTerm] = useState("")
    const [filterReceivable, setFilterReceivable] = useState<string[]>([])
    const [filterPayable, setFilterPayable] = useState<string[]>([])
    const [currentPageReceber, setCurrentPageReceber] = useState(1)
    const [currentPagePagar, setCurrentPagePagar] = useState(1)
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

    const itemsPerPage = 5

    // Algoritmos de filtragem de dados
    const filteredReceivables = useMemo(() => {
        return receivables.filter(
            (r) =>
                (filterReceivable.length === 0 || filterReceivable.includes(r.status)) &&
                (r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.description.toLowerCase().includes(searchTerm.toLowerCase())),
        )
    }, [receivables, filterReceivable, searchTerm])

    const filteredPayables = useMemo(() => {
        return payables.filter(
            (p) =>
                (filterPayable.length === 0 || filterPayable.includes(p.status)) &&
                (p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchTerm.toLowerCase())),
        )
    }, [payables, filterPayable, searchTerm])

    // Cálculos de indicadores financeiros
    const totalReceber = useMemo(() => filteredReceivables.reduce((sum, r) => sum + r.value, 0), [filteredReceivables])
    const totalPagar = useMemo(() => filteredPayables.reduce((sum, p) => sum + p.value, 0), [filteredPayables])
    const saldo = totalReceber - totalPagar

    // Sistema de ordenação de dados
    const requestSort = useCallback(
        (key: string) => {
            let direction: "asc" | "desc" = "asc"
            if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
                direction = "desc"
            }
            setSortConfig({ key, direction })
        },
        [sortConfig],
    )

    // Gerenciamento de status de pagamentos
    const toggleStatus = useCallback((id: string, type: "receber" | "pagar") => {
        if (type === "receber") {
            setReceivables((prev) =>
                prev.map((r) => {
                    if (r.id === id) {
                        const newStatus = r.status === "pago" ? "pendente" : "pago"
                        toast.success(
                            newStatus === "pago" ? "Recebimento confirmado com sucesso ✅" : "Status de recebimento revertido ↩️",
                        )
                        return { ...r, status: newStatus }
                    }
                    return r
                }),
            )
        } else {
            setPayables((prev) =>
                prev.map((p) => {
                    if (p.id === id) {
                        const newStatus = p.status === "pago" ? "pendente" : "pago"
                        toast.success(
                            newStatus === "pago" ? "Pagamento processado com sucesso ✅" : "Status de pagamento revertido ↩️",
                        )
                        return { ...p, status: newStatus }
                    }
                    return p
                }),
            )
        }
    }, [])

    // Sistema de exportação em formato CSV
    const exportToCSV = useCallback((data: any[], filename: string, type: "receber" | "pagar") => {
        const headers =
            type === "receber"
                ? ["Cliente", "Descrição", "Valor", "Data de Vencimento", "Status"]
                : ["Fornecedor", "Descrição", "Valor", "Data de Vencimento", "Status"]

        const rows = data.map((item) => [
            type === "receber" ? item.clientName : item.supplierName,
            item.description,
            formatCurrency(item.value),
            formatDate(item.dueDate),
            item.status === "pago" ? "Liquidado" : item.status === "vencido" ? "Em Atraso" : "Em Aberto",
        ])

        const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
        const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.setAttribute("download", `${filename}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Relatório CSV gerado com êxito!")
    }, [])

    // Sistema de exportação em formato PDF
    const exportToPDF = useCallback(async (data: any[], filename: string, type: "receber" | "pagar") => {
        const loadingToast = toast.loading("Processando geração do documento PDF...")

        try {
            const jsPDF = (await import("jspdf")).default

            const doc = new jsPDF()
            const title = type === "receber" ? "Relatório de Contas a Receber" : "Relatório de Contas a Pagar"
            const headers = [[type === "receber" ? "Cliente" : "Fornecedor", "Descrição", "Valor", "Vencimento", "Status"]]

            const rows = data.map((item) => [
                type === "receber" ? item.clientName : item.supplierName,
                item.description,
                formatCurrency(item.value),
                formatDate(item.dueDate),
                item.status === "pago" ? "Liquidado" : item.status === "vencido" ? "Em Atraso" : "Em Aberto",
            ])

            doc.setFontSize(18)
            doc.text(title, 14, 20)
                ; (doc as any).autoTable({
                    head: headers,
                    body: rows,
                    startY: 30,
                })
            doc.save(`${filename}.pdf`)
            toast.success("Documento PDF gerado com êxito!")
        } catch (err) {
            toast.error("Falha na geração do documento PDF.")
        } finally {
            toast.dismiss(loadingToast)
        }
    }, [])

    // Dados para análise de fluxo de caixa
    const chartData = [
        { month: "Jan", receber: 5000, pagar: 4000, saldo: 1000 },
        { month: "Fev", receber: 6000, pagar: 5500, saldo: 500 },
        { month: "Mar", receber: 4500, pagar: 6000, saldo: -1500 },
        { month: "Abr", receber: 7000, pagar: 5000, saldo: 2000 },
    ]

    const pieChartData = useMemo(() => {
        const total = receivables.length
        if (total === 0) return []

        const statusCounts = receivables.reduce(
            (acc, item) => {
                let status = item.status
                if (status === "pendente" && isOverdue(item.dueDate)) {
                    status = "vencido"
                }
                acc[status] = (acc[status] || 0) + 1
                return acc
            },
            {} as Record<string, number>,
        )

        return [
            {
                name: "Em Aberto",
                value: Math.round(((statusCounts.pendente || 0) / total) * 100),
                count: statusCounts.pendente || 0,
            },
            {
                name: "Liquidado",
                value: Math.round(((statusCounts.pago || 0) / total) * 100),
                count: statusCounts.pago || 0,
            },
            {
                name: "Em Atraso",
                value: Math.round(((statusCounts.vencido || 0) / total) * 100),
                count: statusCounts.vencido || 0,
            },
        ].filter((item) => item.count > 0) // Remove categorias sem dados
    }, [receivables])

    // Renderização de tabelas de dados financeiros
    const renderTable = (
        title: string,
        data: (Receivable | Payable)[],
        type: "receber" | "pagar",
        currentPage: number,
        onPageChange: (page: number) => void,
    ) => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const paginated = data.slice(startIndex, startIndex + itemsPerPage)

        const sortedData = paginated.sort((a, b) => {
            if (!sortConfig) return 0
            let aValue = a[sortConfig.key as keyof (Receivable | Payable)]
            let bValue = b[sortConfig.key as keyof (Receivable | Payable)]

            if (sortConfig.key === "value") {
                aValue = a.value
                bValue = b.value
            } else if (sortConfig.key === "dueDate") {
                aValue = new Date(a.dueDate).getTime()
                bValue = new Date(b.dueDate).getTime()
            }

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
            return 0
        })

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort(type === "receber" ? "clientName" : "supplierName")}
                                >
                                    {type === "receber" ? "Cliente" : "Fornecedor"}
                                    {sortConfig?.key === (type === "receber" ? "clientName" : "supplierName") &&
                                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Descrição
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort("value")}
                                >
                                    Valor
                                    {sortConfig?.key === "value" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort("dueDate")}
                                >
                                    Vencimento
                                    {sortConfig?.key === "dueDate" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        Nenhum registro encontrado para os critérios especificados.
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((item) => {
                                    const overdue = isOverdue(item.dueDate)
                                    const nearDue = isNearDue(item.dueDate)
                                    const delayDays = overdue
                                        ? Math.abs(Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                                        : 0

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-gray-50 transition-colors ${overdue ? "bg-red-50" : nearDue ? "bg-orange-50" : ""}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {type === "receber" ? (item as Receivable).clientName : (item as Payable).supplierName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{item.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                                <span className={type === "receber" ? "text-green-600" : "text-red-600"}>
                                                    {formatCurrency(item.value)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(item.dueDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === "pago"
                                                            ? "bg-green-100 text-green-800"
                                                            : overdue
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    title={overdue ? `${delayDays} dias em atraso` : ""}
                                                >
                                                    {item.status === "pago" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {item.status === "pendente" && !overdue && <Clock className="w-3 h-3 mr-1" />}
                                                    {overdue && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {item.status === "pago" ? "Liquidado" : overdue ? "Em Atraso" : "Em Aberto"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative group">
                                                    <button
                                                        onClick={() => toggleStatus(item.id, type)}
                                                        className="text-gray-500 hover:text-blue-600 transition-all transform hover:scale-110 relative"
                                                        aria-label={item.status === "pago" ? "Reverter liquidação" : "Confirmar liquidação"}
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                        <span className="absolute -inset-1 bg-blue-200 rounded-full opacity-20 animate-pulse group-hover:opacity-40 transition-opacity pointer-events-none whitespace-nowrap transform -translate-x-1/2"></span>
                                                    </button>
                                                    <span className="absolute left-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap transform -translate-x-1/2">
                                                        {item.status === "pago" ? "Reverter liquidação" : "Confirmar liquidação"}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 flex justify-between items-center text-sm text-gray-600">
                    <span>
                        Exibindo {startIndex + 1}–{Math.min(startIndex + itemsPerPage, data.length)} de {data.length} registros
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            aria-label="Página anterior"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(data.length / itemsPerPage)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            aria-label="Próxima página"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 px-4 py-6 w-full min-w-0">
            <Toaster position="top-right" />

            {/* Cabeçalho Executivo */}
            <div>
                <h1 className="text-3xl font-serif text-gray-900">Centro de Controle Financeiro</h1>
                <p className="text-gray-600">
                    Plataforma integrada de gestão financeira com análises avançadas e relatórios executivos.
                </p>
            </div>

            {/* Painel de Indicadores Estratégicos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800">Contas a Receber</p>
                    <p className="text-2xl font-bold font-['Rajdhani'] text-blue-600">{formatCurrency(totalReceber)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <FileText className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">Contas a Pagar</p>
                    <p className="text-2xl font-bold font-['Rajdhani'] text-red-900">{formatCurrency(totalPagar)}</p>
                </div>
                <div
                    className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${saldo < 0 ? "bg-red-50 border-red-200" : ""}`}
                >
                    <CheckCircle
                        className="w-6 h-6 text-green-600 mx-auto mb-2"
                        style={{ color: saldo >= 0 ? "#16a34a" : "#dc2626" }}
                    />
                    <p className="text-sm text-green-800">Posição Financeira Líquida</p>
                    <p className={`text-2xl font-bold font-['Rajdhani'] ${saldo >= 0 ? "text-green-900" : "text-red-900"}`}>
                        {formatCurrency(saldo)}
                    </p>
                </div>
            </div>

            {/* Dashboard Analítico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Análise de Fluxo de Caixa */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Análise de Fluxo de Caixa</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="receber" stroke="#22c55e" name="Recebimentos" />
                            <Line type="monotone" dataKey="pagar" stroke="#ef4444" name="Pagamentos" />
                            <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo Líquido" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Comparativo de Recebimentos vs Pagamentos */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Comparativo Financeiro</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Bar dataKey="receber" fill="#22c55e" name="Recebimentos" />
                            <Bar dataKey="pagar" fill="#ef4444" name="Pagamentos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Análise Estratégica de Performance */}
                <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-serif from-gray-500 mb-6">Análise Estratégica de Performance Comercial</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        {/* Distribuição de Status de Recebimentos */}
                        <div className="flex flex-col items-center">
                            <h4 className="text-lg from-gray-800 mb-4">Distribuição de Status - Recebimentos</h4>
                            <ResponsiveContainer width={200} height={200}>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        labelLine={{ stroke: "#999", strokeWidth: 1, strokeDasharray: "4 2" }}
                                        label={({ x, y, midAngle, percent, name }) => {
                                            const value = Math.round(percent * 100)
                                            if (value === 0) return null // Não exibe labels para valores zero

                                            const radius = 110
                                            const radian = (Math.PI / 180) * midAngle
                                            const labelX = x + radius * Math.cos(radian)
                                            const labelY = y + radius * Math.sin(radian)
                                            return (
                                                <text
                                                    x={labelX}
                                                    y={labelY}
                                                    fill="#333"
                                                    fontSize={12}
                                                    fontWeight="bold"
                                                    textAnchor={labelX > x ? "start" : "end"}
                                                    dominantBaseline="central"
                                                >
                                                    {value}%
                                                </text>
                                            )
                                        }}
                                    >
                                        {pieChartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value}% (${props.payload.count} ${props.payload.count === 1 ? "conta" : "contas"})`,
                                            name,
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 text-sm text-gray-600 text-center">
                                <p>Total de {receivables.length} contas a receber</p>
                            </div>
                        </div>

                        {/* Performance Regional por Categoria */}
                        <div>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={salesData} layout="vertical" barSize={20}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="estado" type="category" width={50} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey="acessorios" stackId="a" fill="#3B82F6" name="Acessórios" />
                                    <Bar dataKey="bicicletas" stackId="a" fill="#EF4444" name="Bicicletas" />
                                    <Bar dataKey="vestuario" stackId="a" fill="#10B981" name="Vestuário" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Central de Exportação de Relatórios */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => exportToCSV(filteredReceivables, "relatorio_contas_receber", "receber")}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors rounded-lg font-medium"
                >
                    <Download className="w-5 h-5" />
                    Exportar Recebimentos (CSV)
                </button>
                <button
                    onClick={() => exportToPDF(filteredReceivables, "relatorio_contas_receber", "receber")}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg font-medium"
                >
                    <Download className="w-5 h-5" />
                    Exportar Recebimentos (PDF)
                </button>
                <button
                    onClick={() => exportToCSV(filteredPayables, "relatorio_contas_pagar", "pagar")}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors rounded-lg font-medium"
                >
                    <Download className="w-5 h-5" />
                    Exportar Pagamentos (CSV)
                </button>
                <button
                    onClick={() => exportToPDF(filteredPayables, "relatorio_contas_pagar", "pagar")}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg font-medium"
                >
                    <Download className="w-5 h-5" />
                    Exportar Pagamentos (PDF)
                </button>
            </div>

            {/* Sistema de Busca Inteligente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar por cliente, fornecedor ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Módulos de Gestão de Contas */}
            {renderTable(
                "Gestão de Contas a Receber",
                filteredReceivables,
                "receber",
                currentPageReceber,
                setCurrentPageReceber,
            )}
            {renderTable("Gestão de Contas a Pagar", filteredPayables, "pagar", currentPagePagar, setCurrentPagePagar)}
        </div>
    )
}
