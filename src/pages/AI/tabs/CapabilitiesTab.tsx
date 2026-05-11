import { BookOpen, Eye, Wrench } from 'lucide-react';

interface Tool {
    name: string;
    kind: 'read' | 'write';
    description: string;
    example: string;
}

const TOOLS: Tool[] = [
    {
        name: 'getDailySummary',
        kind: 'read',
        description: 'Resumo do dia: vendas, recebido, pago, formas de pagamento, contas em aberto.',
        example: '"Como foi hoje?" / "Quanto entrou hoje?"',
    },
    {
        name: 'getWeeklySummary',
        kind: 'read',
        description: 'Resumo da semana com top clientes e top produtos.',
        example: '"Resumo da semana" / "Quais foram os melhores clientes?"',
    },
    {
        name: 'getAlerts',
        kind: 'read',
        description: 'Boletos vencidos, contas a vencer nos próximos 3 dias e produtos com estoque baixo.',
        example: '"Tem algum alerta?" / "O que está atrasado?"',
    },
    {
        name: 'searchProducts',
        kind: 'read',
        description: 'Busca produtos pelo nome — retorna estoque e preço.',
        example: '"Quanto custa o produto X?" / "Tem manilha de 1m no estoque?"',
    },
    {
        name: 'searchCustomers',
        kind: 'read',
        description: 'Busca clientes por nome ou CPF/CNPJ.',
        example: '"Achar cliente João" / "Quem é o cliente do CPF 123…?"',
    },
    {
        name: 'listPendingReceivables',
        kind: 'read',
        description: 'Lista contas a receber pendentes ou vencidas.',
        example: '"Quem está devendo?" / "Quais boletos venceram?"',
    },
    {
        name: 'createAccountPayable',
        kind: 'write',
        description: 'Cria uma conta a pagar. Sempre pede sua confirmação antes de salvar.',
        example: '"Crie uma conta de R$ 500 pra Claro com vencimento 10/06"',
    },
    {
        name: 'markReceivableAsPaid',
        kind: 'write',
        description: 'Marca uma conta a receber como paga e cria o movimento financeiro.',
        example: '"Marque a conta do João como paga, recebi via PIX"',
    },
    {
        name: 'productionEntry',
        kind: 'write',
        description: 'Registra produção (entrada de estoque) de um produto.',
        example: '"Galego produziu 16 manilhas hoje"',
    },
];

export function CapabilitiesTab() {
    const reads = TOOLS.filter((t) => t.kind === 'read');
    const writes = TOOLS.filter((t) => t.kind === 'write');

    return (
        <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-violet-500" />
                    Capacidades da IA
                </h2>
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                    Tudo que a IA sabe fazer hoje. Ferramentas de <b>leitura</b> rodam direto.
                    Ferramentas de <b>escrita</b> sempre pedem sua confirmação.
                </p>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Leitura ({reads.length})
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reads.map((t) => (
                        <CapabilityCard key={t.name} tool={t} />
                    ))}
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Escrita ({writes.length}) <span className="text-[11px] font-normal text-slate-500">— exige confirmação</span>
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {writes.map((t) => (
                        <CapabilityCard key={t.name} tool={t} />
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                        <div className="font-semibold text-[13px] text-blue-900 dark:text-blue-200">
                            Como usar
                        </div>
                        <p className="text-[12px] text-blue-800 dark:text-blue-300 mt-1">
                            Você não precisa decorar nomes de ferramentas. Pergunte em português normal —
                            a IA escolhe a ferramenta certa. Os exemplos acima são pra inspirar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CapabilityCard({ tool }: { tool: Tool }) {
    const isWrite = tool.kind === 'write';
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <code className="text-[11.5px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {tool.name}
                </code>
                <span
                    className={`text-[9.5px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                        isWrite
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                >
                    {isWrite ? 'escrita' : 'leitura'}
                </span>
            </div>
            <p className="text-[12.5px] text-slate-700 dark:text-slate-300 mb-2">{tool.description}</p>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 italic">{tool.example}</p>
        </div>
    );
}
