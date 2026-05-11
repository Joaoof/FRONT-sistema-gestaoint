import {
    BarChart3,
    BotMessageSquare,
    Brain,
    Lightbulb,
    Rocket,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react';

const ADVANTAGES = [
    {
        icon: BotMessageSquare,
        title: 'Assistente 24/7',
        text: 'Pergunta sobre vendas, contas, estoque, clientes. Responde em segundos, qualquer hora.',
    },
    {
        icon: Zap,
        title: 'Automatiza tarefas',
        text: 'Crie contas, marque pagamentos, lance produção. A IA executa — você só confirma.',
    },
    {
        icon: BarChart3,
        title: 'Insights diários e semanais',
        text: 'Resumos automáticos: o que vendeu mais, quem está devendo, o que está parando o estoque.',
    },
    {
        icon: Brain,
        title: 'Detecta padrões que você não vê',
        text: 'Quedas de venda, clientes inativos, despesas crescendo — destaca antes de virar problema.',
    },
    {
        icon: TrendingUp,
        title: 'Decisões mais rápidas',
        text: 'Em vez de abrir 5 telas, pergunte. A IA cruza dados de várias áreas e entrega resposta direta.',
    },
    {
        icon: ShieldCheck,
        title: 'Sem risco',
        text: 'Toda ação que altera dado pede sua confirmação. A IA nunca executa por conta própria.',
    },
];

const EXAMPLE_QUESTIONS = [
    {
        category: '📊 Análise rápida',
        items: [
            'Como foi o dia hoje?',
            'Resumo da semana',
            'Quanto entrou ontem?',
            'Quais foram os melhores produtos do mês?',
        ],
    },
    {
        category: '⚠️ Alertas e cobranças',
        items: [
            'Tem alguma conta vencendo amanhã?',
            'Quem está devendo mais?',
            'Quais produtos estão acabando no estoque?',
            'Tem boletos atrasados?',
        ],
    },
    {
        category: '💰 Ações financeiras',
        items: [
            'Crie uma conta de R$ 200 da Claro com vencimento dia 10',
            'Marque a conta do João como paga, recebi via PIX',
            'Quanto recebi de PIX essa semana?',
        ],
    },
    {
        category: '📦 Operacional',
        items: [
            'Galego produziu 16 manilhas hoje',
            'Quanto custa a tampa de 1m?',
            'Achar cliente Maria Silva',
        ],
    },
];

const STEPS = [
    {
        n: 1,
        title: 'Tenha créditos',
        text: 'Na aba "Créditos", compre um pacote via PIX. Cada mensagem custa 1 crédito (modelo padrão).',
    },
    {
        n: 2,
        title: 'Fale em português normal',
        text: 'Você não precisa decorar comandos. Pergunte como falaria com um funcionário.',
    },
    {
        n: 3,
        title: 'Confirme ações de escrita',
        text: 'Se pedir pra criar/alterar algo, a IA mostra um card "Confirmação necessária" antes de salvar.',
    },
    {
        n: 4,
        title: 'Receba insights automáticos',
        text: 'Todo dia 7:30 e segunda 8h, a IA gera um resumo e manda pro sininho. Veja em "Insights".',
    },
];

export function HowToUseTab() {
    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-[11px] uppercase tracking-wider font-bold">Inteligência GestãoInt</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight mb-2">
                    Seu sócio digital, com acesso aos dados.
                </h2>
                <p className="text-white/90 text-[14px] max-w-2xl">
                    A IA lê em tempo real suas vendas, contas, estoque e clientes. Responde dúvidas,
                    sugere ações, gera relatórios e automatiza tarefas — tudo com confirmação sua nas
                    operações de escrita.
                </p>
            </div>

            {/* Vantagens */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Por que vale a pena
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ADVANTAGES.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <div
                                key={i}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex gap-3"
                            >
                                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 grid place-items-center shrink-0">
                                    <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                        {a.title}
                                    </div>
                                    <div className="text-[12.5px] text-slate-600 dark:text-slate-400 leading-snug">
                                        {a.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Como começar */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-blue-500" />
                    Como começar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {STEPS.map((s) => (
                        <div
                            key={s.n}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4"
                        >
                            <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-sm font-bold grid place-items-center mb-2">
                                {s.n}
                            </div>
                            <div className="font-semibold text-[13.5px] text-slate-900 dark:text-white mb-1">
                                {s.title}
                            </div>
                            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-snug">
                                {s.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exemplos de perguntas */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                    💬 Exemplos do que você pode perguntar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EXAMPLE_QUESTIONS.map((cat) => (
                        <div
                            key={cat.category}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4"
                        >
                            <div className="font-semibold text-[13px] text-slate-900 dark:text-white mb-2">
                                {cat.category}
                            </div>
                            <ul className="space-y-1.5">
                                {cat.items.map((q) => (
                                    <li
                                        key={q}
                                        className="text-[12.5px] text-slate-600 dark:text-slate-400 italic before:content-['→'] before:mr-2 before:text-violet-500 before:not-italic"
                                    >
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
