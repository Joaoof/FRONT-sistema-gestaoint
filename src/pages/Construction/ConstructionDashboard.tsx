import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Banknote,
  Building,
  FileText,
  HardHat,
  PieChart,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { GET_OBRAS } from '../../graphql/queries/construction-obras';
import { REL_PREVISTO_VS_REALIZADO } from '../../graphql/queries/construction-relatorios';
import { formatBRL, formatPct, OBRA_STATUS_LABEL, OBRA_STATUS_TONE, type ObraStatus } from './components/shared';

export function ConstructionDashboard() {
  const navigate = useNavigate();
  const { data: obrasData } = useQuery<{ obras: { id: string; codigo: string; nome: string; status: ObraStatus; valorContrato?: number | null }[] }>(GET_OBRAS, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: relData } = useQuery<{ relatorioPrevistoVsRealizado: { totalPrevisto: number; totalRealizado: number; totalPendente: number; saldo: number; percentExecutado?: number | null } }>(
    REL_PREVISTO_VS_REALIZADO,
    {
      variables: { filter: { tipoData: 'COMPETENCIA' } },
      fetchPolicy: 'cache-and-network',
    },
  );

  const obras = obrasData?.obras ?? [];
  const r = relData?.relatorioPrevistoVsRealizado;

  return (
    <div className="space-y-6 w-full">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <HardHat className="w-5 h-5 text-white" />
          </span>
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Construção civil</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Painel central — obras, custos e relatórios</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Previsto total" value={formatBRL(r?.totalPrevisto ?? 0)} sub="orçamentos ativos" tone="slate" />
        <KPI label="Realizado" value={formatBRL(r?.totalRealizado ?? 0)} sub="despesas confirmadas" tone="emerald" />
        <KPI label="Pendente" value={formatBRL(r?.totalPendente ?? 0)} sub="aguardando confirmação" tone="amber" />
        <KPI label="% Executado" value={formatPct(r?.percentExecutado)} sub="realizado / previsto" tone="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">Obras recentes</span>
            <button onClick={() => navigate('/obras')} className="text-[12px] text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {obras.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-[13px]">Nenhuma obra cadastrada ainda.</div>
          ) : (
            <table className="w-full text-[13px]">
              <tbody>
                {obras.slice(0, 8).map((o) => (
                  <tr key={o.id} onClick={() => navigate(`/obras/${o.id}`)} className="cursor-pointer border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-slate-500 w-24">{o.codigo}</td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{o.nome}</td>
                    <td className="px-4 py-2.5 w-32">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${OBRA_STATUS_TONE[o.status]}`}>
                        {OBRA_STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums w-32">
                      {o.valorContrato ? formatBRL(Number(o.valorContrato)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Atalhos</h3>
          <div className="space-y-2">
            <Shortcut icon={HardHat} label="Nova obra" desc="Cadastrar projeto" onClick={() => navigate('/obras/cadastrar')} />
            <Shortcut icon={ArrowLeftRight} label="Lançar transação" desc="NF, pagamento, recibo" onClick={() => navigate('/obras/transacoes/cadastrar')} />
            <Shortcut icon={FileText} label="Orçamentos" desc="Ver versões ativas" onClick={() => navigate('/obras')} />
            <Shortcut icon={Building} label="Centros de custo" desc="Cadastros básicos" onClick={() => navigate('/obras/cadastros/centros-custo')} />
            <Shortcut icon={Tag} label="Categorias" desc="Material, mão de obra…" onClick={() => navigate('/obras/cadastros/categorias')} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Relatórios</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <RelCard icon={BarChart3} title="Previsto vs Realizado" desc="Por obra, etapa e categoria" tone="emerald" onClick={() => navigate('/obras/relatorios/previsto-realizado')} />
          <RelCard icon={TrendingDown} title="Análise de desvio" desc="Top variações" tone="rose" onClick={() => navigate('/obras/relatorios/desvio')} />
          <RelCard icon={Banknote} title="Fluxo de caixa" desc="Entradas vs saídas no tempo" tone="sky" onClick={() => navigate('/obras/relatorios/fluxo-caixa')} />
          <RelCard icon={PieChart} title="Quebra de custos" desc="Por categoria, CC, fornecedor" tone="indigo" onClick={() => navigate('/obras/relatorios/quebra-custos')} />
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'slate' | 'emerald' | 'amber' | 'indigo' }) {
  const map: Record<string, string> = {
    slate: 'from-slate-500/10 to-slate-500/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300',
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300',
    indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${map[tone]} p-3.5`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <p className="mt-1.5 text-[20px] font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-400">{sub}</p>
    </div>
  );
}

function Shortcut({ icon: Icon, label, desc, onClick }: { icon: any; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.04] text-left transition-colors">
      <span className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-500/15 grid place-items-center shrink-0">
        <Icon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{label}</div>
        <div className="text-[11.5px] text-slate-500">{desc}</div>
      </div>
    </button>
  );
}

function RelCard({ icon: Icon, title, desc, tone, onClick }: { icon: any; title: string; desc: string; tone: 'emerald' | 'rose' | 'sky' | 'indigo'; onClick: () => void }) {
  const map: Record<string, string> = {
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300',
    sky: 'from-sky-500/15 to-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300',
    indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  };
  return (
    <button onClick={onClick} className={`text-left rounded-xl border bg-gradient-to-br ${map[tone]} p-4 hover:shadow-md transition-shadow`}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-[13.5px] font-semibold text-slate-900 dark:text-white">{title}</div>
      <div className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5">{desc}</div>
    </button>
  );
}
