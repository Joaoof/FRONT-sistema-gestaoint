import { gql, useMutation, useQuery } from '@apollo/client';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const INSIGHTS_QUERY = gql`
  query DashboardInsights {
    insights(limit: 1) {
      id kind title body createdAt creditsCost
    }
  }
`;

const GENERATE_INSIGHT = gql`
  mutation GenerateInsightNow {
    generateInsightNow {
      id title body createdAt
    }
  }
`;

interface Insight {
    id: string;
    kind: string;
    title: string;
    body: string;
    createdAt: string;
    creditsCost: number;
}

export function InsightCard() {
    const { data, refetch, loading } = useQuery<{ insights: Insight[] }>(INSIGHTS_QUERY, {
        fetchPolicy: 'cache-and-network',
    });
    const [generate, { loading: generating }] = useMutation(GENERATE_INSIGHT);

    const insight = data?.insights?.[0];

    const handleGenerate = async () => {
        try {
            await generate();
            toast.success('Novo insight gerado.');
            refetch();
        } catch (e: any) {
            if (e.message?.includes('Créditos insuficientes')) {
                toast.error('Sem créditos. Compre na página de IA.');
            } else {
                toast.error(e.message);
            }
        }
    };

    if (loading && !insight) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 grid place-items-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/70">
                            Insight da IA
                        </div>
                        <div className="text-[11px] text-white/80">
                            {insight
                                ? new Date(insight.createdAt).toLocaleString('pt-BR')
                                : 'Nada gerado ainda'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md flex items-center gap-1 disabled:opacity-50"
                    title="Gerar insight agora (consome 5 créditos)"
                >
                    <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Gerando…' : 'Gerar'}
                </button>
            </div>

            {insight ? (
                <>
                    <h3 className="text-[15px] font-bold leading-snug mb-2">{insight.title}</h3>
                    <p className="text-[12.5px] text-white/90 whitespace-pre-wrap leading-relaxed">
                        {insight.body}
                    </p>
                </>
            ) : (
                <p className="text-[13px] text-white/85">
                    Clique em "Gerar" para a IA analisar suas métricas do dia. Consome 5 créditos.
                </p>
            )}
        </div>
    );
}
