import type { Movement } from "../types"

type AnyMod = any

const toBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

const pad3 = (n: number) => String(n).padStart(3, "0")

const fmtDateTime = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(iso))

function isEntrada(m: Movement) {
    // ENTRADA se type === 'ENTRY'; caso contrário SAÍDA
    return m.type === "ENTRY"
}

export async function generateMovementsPdf(
    movements: Movement[],
    filename = "movimentacoes.pdf",
    selectedMonth: string = new Date().toISOString().slice(0, 7),
    selectedYear: string = new Date().getFullYear().toString(),
) {
    // Carrega pdfmake no navegador
    const pdfMakeMod = (await import("pdfmake/build/pdfmake")) as AnyMod
    const pdfFontsMod = (await import("pdfmake/build/vfs_fonts")) as AnyMod
    const pdfMake: AnyMod = pdfMakeMod.default || pdfMakeMod
    pdfMake.vfs = pdfFontsMod.vfs

    // Ordena por data crescente
    const rowsData = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const entradas = rowsData.filter((m) => isEntrada(m)).reduce((acc, m) => acc + Math.abs(m.value || 0), 0)
    const saidas = rowsData.filter((m) => !isEntrada(m)).reduce((acc, m) => acc + Math.abs(m.value || 0), 0)
    const saldo = entradas - saidas

    const tableRows = rowsData.map((m, idx) => [
        { text: pad3(idx + 1), alignment: "center" },
        { text: m.description || "-" },
        { text: isEntrada(m) ? "ENTRADA" : "SAÍDA", alignment: "center" },
        { text: fmtDateTime(m.date), alignment: "center" },
        { text: toBRL(Math.abs(m.value || 0)), alignment: "right" },
    ])

    const primaryBlue = "#2563eb"
    const lightBlue = "#dbeafe"
    const headerBg = "#1e40af"
    const zebra = "#f8fafc"
    const border = "#e2e8f0"
    const textDark = "#1e293b"
    const textMuted = "#64748b"
    const success = "#059669"
    const danger = "#dc2626"

    const docDefinition = {
        info: {
            title: filename,
            subject: "Relatório de Movimentações Financeiras",
            keywords: "relatorio, movimentacoes, financeiro, elegante",
            author: "Sistema Financeiro",
        },
        pageSize: "A4",
        pageMargins: [40, 80, 40, 60],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: textDark,
            lineHeight: 1.3,
        },

        header: {
            margin: [40, 20, 40, 20],
            table: {
                widths: ["*"],
                body: [
                    [
                        {
                            stack: [
                                {
                                    columns: [
                                        {
                                            stack: [
                                                { text: "RELATÓRIO FINANCEIRO", style: "headerTitle" },
                                                { text: "Sistema de Movimentações", style: "headerSubtitle" },
                                            ],
                                        },
                                        {
                                            stack: [
                                                {
                                                    text: `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
                                                    style: "headerDate",
                                                    alignment: "right",
                                                },
                                                { text: `${new Date().toLocaleTimeString("pt-BR")}`, style: "headerTime", alignment: "right" },
                                            ],
                                        },
                                    ],
                                },
                                { canvas: [{ type: "line", x1: 0, y1: 15, x2: 515, y2: 15, lineWidth: 2, lineColor: primaryBlue }] },
                            ],
                            fillColor: lightBlue,
                            margin: [20, 15, 20, 15],
                        },
                    ],
                ],
            },
            layout: "noBorders",
        },

        footer: (currentPage: number, pageCount: number) => ({
            margin: [40, 10, 40, 20],
            table: {
                widths: ["*"],
                body: [
                    [
                        {
                            stack: [
                                { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: border }] },
                                {
                                    columns: [
                                        { text: "© 2025 Sistema Financeiro - Relatório Confidencial", style: "footerText" },
                                        { text: `Página ${currentPage} de ${pageCount}`, style: "footerText", alignment: "right" },
                                    ],
                                    margin: [0, 8, 0, 0],
                                },
                            ],
                        },
                    ],
                ],
            },
            layout: "noBorders",
        }),

        content: [
            {
                text: "Relatório de Movimentações",
                style: "mainTitle",
                alignment: "center",
                margin: [0, 0, 0, 20],
            },

            {
                table: {
                    widths: ["*", "*", "*"],
                    body: [
                        [
                            {
                                stack: [
                                    { text: "💰 ENTRADAS", style: "cardLabel", color: success },
                                    { text: toBRL(entradas), style: "cardValue", color: success },
                                ],
                                alignment: "center",
                            },
                            {
                                stack: [
                                    { text: "💸 SAÍDAS", style: "cardLabel", color: danger },
                                    { text: toBRL(saidas), style: "cardValue", color: danger },
                                ],
                                alignment: "center",
                            },
                            {
                                stack: [
                                    { text: "📊 SALDO", style: "cardLabel", color: primaryBlue },
                                    { text: toBRL(saldo), style: "cardValue", color: saldo >= 0 ? success : danger },
                                ],
                                alignment: "center",
                            },
                        ],
                    ],
                },
                layout: {
                    fillColor: () => "#f1f5f9",
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => border,
                    vLineColor: () => border,
                    paddingLeft: () => 15,
                    paddingRight: () => 15,
                    paddingTop: () => 15,
                    paddingBottom: () => 15,
                },
                margin: [0, 0, 0, 25],
            },

            {
                table: {
                    widths: ["*"],
                    body: [
                        [
                            {
                                text: "📋 DETALHAMENTO DAS MOVIMENTAÇÕES",
                                style: "sectionHeader",
                                fillColor: headerBg,
                                color: "white",
                            },
                        ],
                    ],
                },
                layout: "noBorders",
                margin: [0, 0, 0, 5],
            },

            {
                table: {
                    headerRows: 1,
                    widths: [50, "*", 80, 120, 90],
                    body: [
                        [
                            { text: "ITEM", style: "tableHeader" },
                            { text: "DESCRIÇÃO", style: "tableHeader" },
                            { text: "TIPO", style: "tableHeader" },
                            { text: "DATA/HORA", style: "tableHeader" },
                            { text: "VALOR", style: "tableHeader" },
                        ],
                        ...tableRows,
                    ],
                },
                layout: {
                    fillColor: (rowIndex: number) => {
                        if (rowIndex === 0) return headerBg
                        return rowIndex % 2 === 1 ? zebra : null
                    },
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => border,
                    vLineColor: () => border,
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                    paddingTop: (rowIndex: number) => (rowIndex === 0 ? 10 : 8),
                    paddingBottom: (rowIndex: number) => (rowIndex === 0 ? 10 : 8),
                },
                margin: [0, 0, 0, 20],
            },

            {
                columns: [
                    { text: "", width: "*" },
                    {
                        width: "auto",
                        table: {
                            widths: [120, 100],
                            body: [
                                [
                                    { text: "SALDO FINAL", style: "finalLabel" },
                                    { text: toBRL(saldo), style: "finalValue", color: saldo >= 0 ? success : danger },
                                ],
                            ],
                        },
                        layout: {
                            fillColor: () => (saldo >= 0 ? "#ecfdf5" : "#fef2f2"),
                            hLineWidth: () => 2,
                            vLineWidth: () => 2,
                            hLineColor: () => (saldo >= 0 ? success : danger),
                            vLineColor: () => (saldo >= 0 ? success : danger),
                            paddingLeft: () => 15,
                            paddingRight: () => 15,
                            paddingTop: () => 10,
                            paddingBottom: () => 10,
                        },
                    },
                ],
                margin: [0, 10, 0, 0],
            },
        ],

        styles: {
            headerTitle: {
                fontSize: 16,
                bold: true,
                color: headerBg,
                letterSpacing: 0.5,
            },
            headerSubtitle: {
                fontSize: 11,
                color: textMuted,
                margin: [0, 2, 0, 0],
            },
            headerDate: {
                fontSize: 10,
                bold: true,
                color: textDark,
            },
            headerTime: {
                fontSize: 9,
                color: textMuted,
            },
            footerText: {
                fontSize: 8,
                color: textMuted,
            },
            mainTitle: {
                fontSize: 20,
                bold: true,
                color: headerBg,
                letterSpacing: 1,
            },
            cardLabel: {
                fontSize: 10,
                bold: true,
                margin: [0, 0, 0, 5],
            },
            cardValue: {
                fontSize: 16,
                bold: true,
            },
            sectionHeader: {
                fontSize: 12,
                bold: true,
                alignment: "center",
                margin: [0, 8, 0, 8],
                letterSpacing: 0.5,
            },
            tableHeader: {
                bold: true,
                color: "white",
                alignment: "center",
                fontSize: 9,
            },
            finalLabel: {
                bold: true,
                alignment: "right",
                fontSize: 12,
            },
            finalValue: {
                bold: true,
                fontSize: 14,
                alignment: "right",
            },
        },
    } as AnyMod

    const pdf = pdfMake.createPdf(docDefinition)
    pdf.download(filename)
}
