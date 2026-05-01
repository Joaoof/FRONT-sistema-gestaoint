import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { REL_DESVIO } from '../../../graphql/queries/construction-relatorios';
import { formatBRL } from '../components/shared';
import { buildFilterPayload, emptyFiltro, FiltroBar } from './_filtros';

interface Linha {
  chaveId?: string | null;
  chaveNome: string;
  previsto: number;
  realizado: number;
  desvioAbs: number;
  desvioPct?: number | null;
}

interface Data {
  totalDesvios: number;
  porObra: Linha[];
  porEtapa: Linha[];
  porCategoria: Linha[];
}

export function AnaliseDesvio() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState(emptyFiltro());
  const { data, loading } = useQuery<{ relatorioDesvio: Data }>(REL_DESVIO, {
    variables: { filter: buildFilterPayload(filtro) },
    fetchPolicy: 'cache-and-network',
  });

  const r = data?.relatorioDesvio;

  return (
    <div className="space-y-6 w-full">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-rose-500 to-pink-600 grid place-items-center shadow-sm">
            <TrendingDown className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Análise de desvio
          </h1>
        </div>
      </div>

      <FiltroBar value={filtro} onChange={setFiltro} />

      {loading && !r && <div className="text-center text-slate-500 py-12">Calculando…</div>}

      {r && (
        <>
          <Section title="Top desvios — por obra" linhas={r.porObra} />
          <Section title="Top desvios — por etapa" linhas={r.porEtapa} />
          <Section title="Top desvios — por categoria" linhas={r.porCategoria} />
        </>
      )}
    </div>
  );
}

function Section({ title, linhas }: { title: string; linhas: Linha[] }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
        <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">{title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
            <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2 text-right">Previsto</th>
              <th className="px-4 py-2 text-right">Realizado</th>
              <th className="px-4 py-2 text-right">Desvio</th>
              <th className="px-4 py-2 text-right">%</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Sem desvios.</td></tr>
            )}
            {linhas.slice(0, 25).map((l, i) => {
              const acima = l.desvioAbs > 0;
              return (
                <tr key={(l.chaveId ?? '') + i} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{l.chaveNome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatBRL(l.previsto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatBRL(l.realizado)}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${acima ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {acima ? '+' : ''}{formatBRL(l.desvioAbs)}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${acima ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {l.desvioPct !== null && l.desvioPct !== undefined ? `${acima ? '+' : ''}${l.desvioPct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {acima ? <TrendingUp className="w-4 h-4 text-rose-500" /> : <TrendingDown className="w-4 h-4 text-emerald-500" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
