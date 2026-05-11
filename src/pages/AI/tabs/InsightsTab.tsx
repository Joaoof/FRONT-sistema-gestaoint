import { gql, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, Clock, Brain } from 'lucide-react';

const INSIGHTS_QUERY = gql`
  query InsightsAll {
    insights(limit: 30) {
      id kind title body createdAt creditsCost generatedByModel
    }
  }
`;
const GENERATE_INSIGHT = gql`
  mutation GenerateInsightNow {
    generateInsightNow { id title body createdAt }
  }
`;

interface Insight {
    id: string;
    kind: string;
    title: string;
    body: string;
    createdAt: string;
    creditsCost: number;
    generatedByModel: string;
}

const KIND_LABEL: Record<string, { label: string; color: string }> = {
    DAILY: { label: 'Diário', color: 'bg-blue-100 text-blue-700' },
    WEEKLY: { label: 'Semanal', color: 'bg-violet-100 text-violet-700' },
    MANUAL: { label: 'Manual', color: 'bg-amber-100 text-amber-700' },
    ALERT: { label: 'Alerta', color: 'bg-rose-100 text-rose-700' },
};

export function InsightsTab() {
    const { data, loading, refetch } = useQuery<{ insights: Insight[] }>(INSIGHTS_QUERY, {
        fetchPolicy: 'cache-and-network',
    });
    const [generate, { loading: generating }] = useMutation(GENERATE_INSIGHT);

    const insights = data?.insights ?? [];

    const handleGenerate = async () => {
        try {
            await generate();
            toast.success('Insight gerado.');
            refetch();
        } catch (e: any) {
            if (e.message?.includes('Créditos insuficientes')) {
                toast.error('Sem créditos. Vá na aba "Créditos" pra comprar.');
            } else {
                toast.error(e.message);
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Topo */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Brain className="w-5 h-5 text-violet-500" />
                        Insights da IA
                    </h2>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                        A IA analisa suas métricas e gera resumos com recomendações práticas. Custa
                        5 créditos por insight.
                    </p>
                    <p className="text-[11.5px] text-slate-400 mt-1">
                        Automático: diário às 7:30 e semanal segunda 8:00 (se houver créditos).
                    </p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-md shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Gerando…' : 'Gerar agora'}
                </button>
            </div>

            {/* Lista */}
            {loading && insights.length === 0 && (
                <div className="text-center py-12 text-slate-500">Carregando…</div>
            )}
            {!loading && insights.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    Nenhum insight gerado ainda. Clique em <b>"Gerar agora"</b> ou aguarde a próxima
                    rodada automática.
                </div>
            )}

            <div className="space-y-3">
                {insights.map((i) => {
                    const meta = KIND_LABEL[i.kind] ?? { label: i.kind, color: 'bg-slate-100 text-slate-700' };
                    return (
                        <div
                            key={i.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <h3 className="font-semibold text-[14.5px] text-slate-900 dark:text-white">
                                            {i.title}
                                        </h3>
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <p className="text-[12.5px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {i.body}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(i.createdAt).toLocaleString('pt-BR')}
                                        </span>
                                        <span>{i.generatedByModel}</span>
                                        <span>• {i.creditsCost} créditos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
