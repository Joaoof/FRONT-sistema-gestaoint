import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { REL_PREVISTO_VS_REALIZADO } from '../../../graphql/queries/construction-relatorios';
import { formatBRL, formatPct } from '../components/shared';
import { buildFilterPayload, emptyFiltro, FiltroBar } from './_filtros';

interface Linha {
  chaveId?: string | null;
  chaveNome: string;
  previsto: number;
  realizado: number;
  pendente: number;
  saldo: number;
  percentExecutado?: number | null;
}

interface Data {
  totalPrevisto: number;
  totalRealizado: number;
  totalPendente: number;
  saldo: number;
  percentExecutado?: number | null;
  porObra: Linha[];
  porEtapa: Linha[];
  porCategoria: Linha[];
}

export function PrevistoVsRealizado() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState(emptyFiltro());

  const { data, loading } = useQuery<{ relatorioPrevistoVsRealizado: Data }>(
    REL_PREVISTO_VS_REALIZADO,
    {
      variables: { filter: buildFilterPayload(filtro) },
      fetchPolicy: 'cache-and-network',
    },
  );

  const r = data?.relatorioPrevistoVsRealizado;

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
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Previsto vs Realizado
          </h1>
        </div>
      </div>

      <FiltroBar value={filtro} onChange={setFiltro} />

      {loading && !r && <div className="text-center text-slate-500 py-12">Calculando relatório…</div>}

      {r && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Previsto" value={formatBRL(r.totalPrevisto)} tone="slate" />
            <Stat label="Realizado" value={formatBRL(r.totalRealizado)} tone="emerald" />
            <Stat label="Pendente" value={formatBRL(r.totalPendente)} tone="amber" />
            <Stat label="Saldo" value={formatBRL(r.saldo)} tone={r.saldo >= 0 ? 'sky' : 'rose'} />
            <Stat label="% Executado" value={formatPct(r.percentExecutado)} tone="indigo" />
          </div>

          <Section title="Por obra" linhas={r.porObra} />
          <Section title="Por etapa" linhas={r.porEtapa} />
          <Section title="Por categoria" linhas={r.porCategoria} />
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
              <th className="px-4 py-2 text-right">Pendente</th>
              <th className="px-4 py-2 text-right">Saldo</th>
              <th className="px-4 py-2 text-right">%</th>
              <th className="px-4 py-2 w-[180px]">Execução</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Sem dados.</td></tr>
            )}
            {linhas.map((l, i) => {
              const pct = l.percentExecutado ?? 0;
              return (
                <tr key={(l.chaveId ?? '') + i} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{l.chaveNome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatBRL(l.previsto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{formatBRL(l.realizado)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-amber-700 dark:text-amber-400">{formatBRL(l.pendente)}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${l.saldo >= 0 ? 'text-sky-700 dark:text-sky-400' : 'text-rose-700 dark:text-rose-400'}`}>{formatBRL(l.saldo)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPct(l.percentExecutado)}</td>
                  <td className="px-4 py-2.5">
                    <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                      />
                    </div>
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

function Stat({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'emerald' | 'amber' | 'sky' | 'rose' | 'indigo' }) {
  const map: Record<string, string> = {
    slate: 'from-slate-500/10 to-slate-500/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300',
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300',
    sky: 'from-sky-500/15 to-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300',
    rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300',
    indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${map[tone]} p-3.5`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <p className="mt-1.5 text-[18px] font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
