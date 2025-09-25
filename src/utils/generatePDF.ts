import type { Movement } from "../types"

type AnyMod = any

const toBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

const pad3 = (n: number) => String(n).padStart(3, "0")

const fmtDateTime = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(iso))

function isEntrada(m: Movement) {
    // ENTRADA se type === 'ENTRY'; caso contrário SAÍDA
    return m.type === "ENTRY"
}

export async function generateMovementsPdf(
    movements: Movement[],
    filename: string = "movimentacoes.pdf",
    selectedMonth: string = new Date().toISOString().slice(0, 7),
    selectedYear: string = new Date().getFullYear().toString()
) {
    // Carrega pdfmake no navegador
    const pdfMakeMod = (await import("pdfmake/build/pdfmake")) as AnyMod
    const pdfFontsMod = (await import("pdfmake/build/vfs_fonts")) as AnyMod
    const pdfMake: AnyMod = pdfMakeMod.default || pdfMakeMod
    pdfMake.vfs = pdfFontsMod.vfs

    // Ordena por data crescente
    const rowsData = [...movements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const entradas = rowsData
        .filter((m) => isEntrada(m))
        .reduce((acc, m) => acc + Math.abs(m.value || 0), 0)
    const saidas = rowsData
        .filter((m) => !isEntrada(m))
        .reduce((acc, m) => acc + Math.abs(m.value || 0), 0)
    const saldo = entradas - saidas

    const tableRows = rowsData.map((m, idx) => [
        { text: pad3(idx + 1), alignment: "center" },
        { text: m.description || "-" },
        { text: isEntrada(m) ? "ENTRADA" : "SAÍDA", alignment: "center" },
        { text: fmtDateTime(m.date), alignment: "center" },
        { text: toBRL(Math.abs(m.value || 0)), alignment: "right" },
    ])

    const red = "#e53935"
    const zebra = "#f7f7f7"
    const line = "#d0d0d0"
    const text = "#2f2f2f"
    const muted = "#666"

    const docDefinition = {
        info: {
            title: filename,
            subject: "Relatório de Movimentações",
            keywords: "relatorio, movimentacoes, financeiro",
        },
        pageSize: "A4",
        pageMargins: [28, 28, 28, 42],
        defaultStyle: { font: "Roboto", fontSize: 10, color: text },

        footer: (currentPage: number, pageCount: number) => ({
            margin: [28, 6, 28, 12],
            columns: [
                {
                    text: `Gerado em ${new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                    }).format(new Date())}`,
                    color: muted,
                    fontSize: 8,
                },
                {
                    text: `Página ${currentPage} de ${pageCount}`,
                    alignment: "right",
                    color: muted,
                    fontSize: 8,
                },
            ],
            canvas: [
                { type: "line", x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 0.5, lineColor: line },
            ],
        }),

        content: [
            {
                columns: [
                    { text: "Relatório de Movimentações", style: "title", width: "*" },
                    { text: "", width: "auto" },
                ],
                margin: [0, 0, 0, 8],
            },
            {
                table: {
                    widths: ["*", "*", "*"],
                    body: [
                        [
                            { stack: [{ text: "Entradas", style: "chipLabel" }, { text: toBRL(entradas), style: "chipValue" }] },
                            { stack: [{ text: "Saídas", style: "chipLabel" }, { text: toBRL(saidas), style: "chipValue" }] },
                            { stack: [{ text: "Saldo", style: "chipLabel" }, { text: toBRL(saldo), style: "chipValue" }] },
                        ],
                    ],
                },
                layout: {
                    fillColor: () => "#f3f4f6",
                    hLineWidth: () => 0.6,
                    vLineWidth: () => 0.6,
                    hLineColor: () => line,
                    vLineColor: () => line,
                    paddingLeft: () => 12,
                    paddingRight: () => 12,
                    paddingTop: () => 10,
                    paddingBottom: () => 10,
                },
                margin: [0, 0, 0, 10],
            },
            {
                table: { widths: ["*"], body: [[{ text: "Movimentos", style: "sectionBar" }]] },
                layout: "noBorders",
                margin: [0, 0, 0, 0],
            },
            {
                table: {
                    headerRows: 1,
                    widths: [40, "*", 80, 120, 90],
                    body: [[
                        { text: "ITEM", style: "thead" },
                        { text: "DESCRIÇÃO", style: "thead" },
                        { text: "TIPO", style: "thead" },
                        { text: "DATA", style: "thead" },
                        { text: "VALOR", style: "thead" },
                    ], ...tableRows],
                },
                layout: {
                    fillColor: (rowIndex: number) => (rowIndex === 0 ? red : rowIndex % 2 === 1 ? zebra : null),
                    hLineWidth: () => 0.6,
                    vLineWidth: () => 0.6,
                    hLineColor: () => line,
                    vLineColor: () => line,
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                    paddingTop: (rowIndex: number) => (rowIndex === 0 ? 7 : 5),
                    paddingBottom: (rowIndex: number) => (rowIndex === 0 ? 7 : 5),
                },
                margin: [0, 0, 0, 6],
            },
            {
                columns: [
                    { text: "", width: "*" },
                    {
                        width: "auto",
                        table: {
                            widths: ["auto", "auto"],
                            body: [[{ text: "SALDO", style: "totalLabel" }, { text: toBRL(saldo), style: "totalValue" }]],
                        },
                        layout: {
                            fillColor: () => "#e9ecef",
                            hLineWidth: () => 0.8,
                            vLineWidth: () => 0.8,
                            hLineColor: () => "#cfd4da",
                            vLineColor: () => "#cfd4da",
                            paddingLeft: () => 12,
                            paddingRight: () => 12,
                            paddingTop: () => 6,
                            paddingBottom: () => 6,
                        },
                    },
                ],
                margin: [0, 6, 0, 0],
            },
        ],

        styles: {
            title: { fontSize: 14, bold: true },
            sectionBar: { fontSize: 11, bold: true, color: "white", alignment: "center", margin: [0, 6, 0, 6], fillColor: red, characterSpacing: 0.3 },
            thead: { bold: true, color: "white", alignment: "center" },
            chipLabel: { fontSize: 9, color: muted, margin: [0, 0, 0, 2] },
            chipValue: { fontSize: 12, bold: true },
            totalLabel: { bold: true, alignment: "right" },
            totalValue: { bold: true },
        },
    } as AnyMod

    const pdf = pdfMake.createPdf(docDefinition)
    pdf.download(filename)
}
