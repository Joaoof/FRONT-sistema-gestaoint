// ====================================================================
// Unit: FinancialMovementReport.ts (Simulando uma "Unit" Delphi)
// Responsabilidade: Geração do documento PDF de Movimentações Financeiras.
// ====================================================================

// --- 1. Imports e Configurações de Terceiros ---
import type { Movement } from "../types" // Tipo externo (analogia: interface de Unit)
import pdfMake from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts"

// 'AnyMod' usado para contornar problemas de tipagem com módulos importados
type AnyMod = any

// Configura as fontes do pdfMake (Inicialização global como em uma 'initialization' section)
pdfMake.vfs = (pdfFonts as AnyMod).vfs
// ----------------------------------------------


// --- 2. Tipos de Dados (Records/Classes) ---

// Interface para as informações da empresa (análogo ao "Record" de dados de entrada)
export interface CompanyInfo {
    name: string;
    cnpj: string;
    phone: string;
    address: string;
    email: string;
    inscricaoEstadual?: string;
}

// Interface para os dados processados e resumidos (análogo a um "Record" de resultados)
interface ReportSummary {
    entradas: number;
    saidas: number;
    saldo: number;
    tableRows: any[]; // Linhas prontas para o pdfMake
}
// ----------------------------------------------


// --- 3. Funções Utilitárias Puras (Helper Functions) ---

/** Formata um número para a moeda Real Brasileiro (BRL). */
const toBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)

/** Adiciona preenchimento zero à esquerda, garantindo 3 dígitos. */
const pad3 = (n: number) => String(n).padStart(3, "0")

/** Formata data e hora para o padrão brasileiro. */
const fmtDateTime = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(iso))

/** Formata apenas a data para o padrão brasileiro. */
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
    }).format(new Date(iso))

/** Verifica se uma movimentação é de entrada. */
function isEntrada(m: Movement) {
    return m.type === "ENTRY"
}

// ----------------------------------------------


// --- 4. Lógica de Processamento de Dados (Data Processing) ---

/**
 * Processa a lista de movimentos, calcula totais e prepara as linhas da tabela.
 * @param movements Lista de Movimentações.
 * @returns Um objeto ReportSummary com os totais e linhas prontas.
 */
function processMovementData(movements: Movement[]): ReportSummary {
    // Ordena por data crescente (mantendo a imutabilidade)
    const sortedMovements = [...movements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calcula Totais
    const entradas = sortedMovements
        .filter(isEntrada)
        .reduce((acc, m) => acc + Math.abs(m.value || 0), 0)

    const saidas = sortedMovements
        .filter((m) => !isEntrada(m))
        .reduce((acc, m) => acc + Math.abs(m.value || 0), 0)

    const saldo = entradas - saidas

    // Prepara as Linhas da Tabela (Mapeamento de Dados)
    const tableRows = sortedMovements.map((m, idx) => [
        { text: pad3(idx + 1), alignment: "center" },
        { text: m.description || "-", style: "tableBody" },
        { text: isEntrada(m) ? "ENTRADA" : "SAÍDA", alignment: "center", style: isEntrada(m) ? "successText" : "dangerText" },
        { text: fmtDateTime(m.date), alignment: "center" },
        { text: toBRL(Math.abs(m.value || 0)), alignment: "right" },
    ])

    return { entradas, saidas, saldo, tableRows }
}

// ----------------------------------------------


// --- 5. Lógica de Geração do PDF (PDF Document Generator) ---

/**
 * Função principal para gerar o documento PDF.
 * @param movements Dados das movimentações.
 * @param filename Nome do arquivo para download.
 * @param reportTitle Título do relatório.
 * @param companyInfo Informações da empresa (parcial).
 * @param userName Nome do usuário logado.
 */
export function generateMovementPdfDoc(
    movements: Movement[],
    filename: string,
    reportTitle: string,
    companyInfo: Partial<CompanyInfo>,
    userName: string,
) {
    // Extração de Variáveis (Evita repetição de acesso a 'companyInfo')
    const companyName = companyInfo.name || "EM PREPARO";
    const companyCnpj = companyInfo.cnpj || "EM PREPARO";
    const companyPhone = companyInfo.phone || "EM PREPARO";
    const companyAddress = companyInfo.address || "EM PREPARO";
    const companyEmail = companyInfo.email || "EM PREPARO";
    const companyIE = companyInfo.inscricaoEstadual || "Isento";
    const user = userName || "EM PREPARO";

    // Processamento dos dados
    const summary = processMovementData(movements);
    const { entradas, saidas, tableRows } = summary;

    // --- Definição de Cores e Estilos (Constantes do Reporte) ---
    const primaryRed = "#DC2626"
    const headerBg = "#374151"
    const textDark = "#1F2937"
    const textMuted = "#4B5563"
    const border = "#E5E7EB"
    const zebra = "#F9FAFB"
    const success = "#059669"
    const danger = "#EF4444"
    const textSmall = "#374151"
    // -----------------------------------------------------------

    const docDefinition = {
        // ... (resto da definição do documento, que permanece inalterado)

        info: {
            title: filename,
            subject: "Relatório de Movimentações Financeiras",
            keywords: "relatorio, movimentacoes, financeiro",
            author: companyName,
        },
        pageSize: "A4",
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: textDark,
            lineHeight: 1.3,
        },

        content: [
            {
                columns: [
                    // Coluna Esquerda: Info da Empresa
                    {
                        stack: [
                            { text: companyName, fontSize: 9, bold: true },
                            { text: `${companyCnpj} - ${companyPhone}`, fontSize: 8 },
                            { text: companyAddress, fontSize: 8 },
                        ],
                        width: 350,
                    },
                    // Coluna Direita: Logo (comentado, mas mantido o placeholder)
                    // { /* ... logo column ... */ }, 
                ],
                columnGap: 10,
                margin: [0, 0, 0, 10]
            },

            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: border }], margin: [0, 0, 0, 5] },

            {
                table: {
                    widths: [120, '*', 120, 'auto'],
                    body: [
                        [
                            { text: "Responsável pelo levantamento:", style: 'infoLabel' },
                            { text: user, style: 'infoValue' },
                            { text: "Data do levantamento:", style: 'infoLabel', alignment: 'right' },
                            { text: fmtDate(new Date().toISOString()), style: 'infoValue', alignment: 'right' },
                        ],
                        [
                            { text: "CLIENTE", style: 'infoLabel' },
                            { text: "CC 1B", style: 'infoValue' },
                            { text: "INSC. ESTADUAL", style: 'infoLabel', alignment: 'right' },
                            { text: companyIE, style: 'infoValue', alignment: 'right' },
                        ],
                        [
                            { text: "CNPJ", style: 'infoLabel' },
                            { text: companyCnpj, style: 'infoValue' },
                            { text: "COMPLEMENTO", style: 'infoLabel', alignment: 'right' },
                            { text: "...", style: 'infoValue', alignment: 'right' },
                        ],
                        [
                            { text: "ENDEREÇO", style: 'infoLabel' },
                            { text: companyAddress, style: 'infoValue', colSpan: 3 },
                        ],
                        [
                            { text: "E-MAIL", style: 'infoLabel' },
                            { text: companyEmail, style: 'infoValue' },
                            { text: "TELEFONE", style: 'infoLabel', alignment: 'right' },
                            { text: companyPhone, style: 'infoValue', alignment: 'right' },
                        ],
                    ]
                },
                layout: 'noBorders',
                margin: [0, 5, 0, 15]
            },

            { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: border }], margin: [0, 0, 0, 0] },

            {
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                text: reportTitle.toUpperCase(),
                                style: "tableSectionHeader",
                                fillColor: primaryRed,
                                color: "white",
                                margin: [0, 2, 0, 2]
                            },
                        ],
                    ],
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 0],
            },

            {
                table: {
                    headerRows: 1,
                    widths: [50, "*", 80, 120, 90],
                    body: [
                        [
                            // Linha de Cabeçalho
                            { text: "ITEM", style: "tableHeaderBody", fillColor: zebra },
                            { text: "DESCRIÇÃO", style: "tableHeaderBody", fillColor: zebra },
                            { text: "TIPO", style: "tableHeaderBody", fillColor: zebra },
                            { text: "DATA/HORA", style: "tableHeaderBody", fillColor: zebra },
                            { text: "VALOR", style: "tableHeaderBody", alignment: 'right', fillColor: zebra },
                        ],
                        // Linhas de Dados
                        ...tableRows.map(row => [
                            row[0], row[1], row[2], row[3],
                            { ...row[4], alignment: 'right' }
                        ]),
                        // Linhas vazias para preenchimento
                        ...Array(8 - tableRows.length > 0 ? 8 - tableRows.length : 0).fill(0).map(() => [
                            { text: '...', style: "tableBody", alignment: 'center' },
                            { text: '', style: "tableBody" },
                            { text: '', style: "tableBody" },
                            { text: '', style: "tableBody" },
                            { text: toBRL(0), style: "tableBody", alignment: 'right' },
                        ]),
                    ],
                },
                layout: {
                    hLineWidth: (i: number, node: AnyMod) => (i === 0 || i === node.table.body.length) ? 0.5 : 0,
                    vLineWidth: () => 0.5,
                    hLineColor: (i: number, node: AnyMod) => i === node.table.body.length ? headerBg : border,
                    vLineColor: () => border,
                    fillColor: (rowIndex: number) => (rowIndex % 2 === 1 ? zebra : null),
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                    paddingTop: () => 5,
                    paddingBottom: () => 5,
                } as any, // 'as any' para forçar o tipo customizado de layout
                margin: [0, 0, 0, 0],
            },

            {
                columns: [
                    // Coluna 1: Espaço Vazio
                    { text: '', width: '*' },
                    // Coluna 2: Bloco TOTAL
                    {
                        width: 'auto',
                        table: {
                            widths: [90, 90],
                            body: [
                                [
                                    { text: "TOTAL", style: "totalLabel", alignment: "right", fillColor: headerBg, color: "white" },
                                    // Utiliza o total de entradas + saídas como "TOTAL GERAL"
                                    { text: toBRL(entradas + saidas), style: "totalValue", alignment: "right", fillColor: headerBg, color: "white" },
                                ],
                            ],
                        },
                        layout: {
                            hLineWidth: () => 0,
                            vLineWidth: () => 0,
                            paddingLeft: () => 10,
                            paddingRight: () => 10,
                            paddingTop: () => 5,
                            paddingBottom: () => 5,
                        } as any,
                    },
                ],
                margin: [0, -1, 0, 20],
            },

            {
                text: "Informações:",
                style: "infoBlockHeader",
                alignment: "left",
                margin: [0, 20, 0, 5],
            },
            {
                text: "Este relatório resume as movimentações financeiras registradas no sistema até a data e hora da emissão. Qualquer discrepância deve ser verificada com o setor financeiro.",
                fontSize: 9,
                color: textMuted
            }
        ],

        // Definições de Estilos (Permanece inalterado, pois está bem estruturado)
        styles: {
            infoLabel: { fontSize: 8, bold: true, color: textDark },
            infoValue: { fontSize: 9, color: textSmall, margin: [0, 0, 10, 0] },
            tableSectionHeader: { fontSize: 9, bold: true, alignment: "center" },
            tableHeaderBody: { bold: true, color: textDark, alignment: "center", fontSize: 9 },
            tableBody: { fontSize: 9 },
            totalLabel: { fontSize: 10, bold: true },
            totalValue: { fontSize: 10, bold: true },
            infoBlockHeader: { fontSize: 10, bold: true, color: textDark },
            successText: { color: success, bold: true },
            dangerText: { color: danger, bold: true }
        },
    } as AnyMod // 'as AnyMod' para a definição completa do documento

    // Geração e Download (Ação principal)
    const pdf = pdfMake.createPdf(docDefinition)
    pdf.download(filename)
}

// --- 6. Funções Assíncronas Auxiliares (Auxiliary Async Functions) ---

/**
 * Converte uma URL de imagem em uma string Base64 para inclusão no PDF.
 * (Mantido como estava, pois é uma utilidade moderna de I/O)
 */
export async function urlToBase64(url: string): Promise<string | undefined> {
    if (!url) return undefined;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Erro ao carregar a logo: ${response.statusText}`);
            return undefined;
        }
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Erro ao converter URL da logo para Base64:", error);
        return undefined;
    }
}