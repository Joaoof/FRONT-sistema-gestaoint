import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GET_OBRAS } from '../../../graphql/queries/construction-obras';
import { REL_FLUXO_CAIXA } from '../../../graphql/queries/construction-relatorios';
import { formatBRL, type GranularidadeFluxo, type TipoData } from '../components/shared';

interface Ponto {
  periodo: string;
  entradasConfirmadas: number;
  saidasConfirmadas: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoConfirmado: number;
  saldoProjetado: number;
}

interface Data {
  totalEntradasConfirmadas: number;
  totalSaidasConfirmadas: number;
  totalEntradasPrevistas: number;
  totalSaidasPrevistas: number;
  saldoFinalConfirmado: number;
  saldoFinalProjetado: number;
  pontos: Ponto[];
}

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export function FluxoCaixa() {
  const navigate = useNavigate();
  const [obraId, setObraId] = useState('');
  const [dataInicio, setDataInicio] = useState(monthsAgo(6));
  const [dataFim, setDataFim] = useState(today());
  const [granularidade, setGranularidade] = useState<GranularidadeFluxo>('MES');
  const [tipoData, setTipoData] = useState<TipoData>('COMPETENCIA');

  const { data: obrasData } = useQuery<{ obras: any[] }>(GET_OBRAS);

  const { data, loading } = useQuery<{ relatorioFluxoCaixa: Data }>(REL_FLUXO_CAIXA, {
    variables: {
      input: {
        obraId: obraId || null,
        dataInicio: new Date(dataInicio).toISOString(),
        dataFim: new Date(dataFim).toISOString(),
        granularidade,
        tipoData,
      },
    },
    fetchPolicy: 'cache-and-network',
    skip: !dataInicio || !dataFim,
  });

  const r = data?.relatorioFluxoCaixa;
  const chartData = r?.pontos.map((p) => ({
    periodo: p.periodo,
    'Entradas conf.': p.entradasConfirmadas,
    'Saídas conf.': -p.saidasConfirmadas,
    'Entradas prev.': p.entradasPrevistas,
    'Saídas prev.': -p.saidasPrevistas,
    'Saldo conf.': p.saldoConfirmado,
    'Saldo proj.': p.saldoProjetado,
  })) ?? [];

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
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center shadow-sm">
            <Banknote className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Fluxo de caixa
          </h1>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <select value={obraId} onChange={(e) => setObraId(e.target.value)} className={selCls}>
          <option value="">Todas as obras</option>
          {obrasData?.obras?.map((o) => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
        </select>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={selCls} />
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={selCls} />
        <select value={granularidade} onChange={(e) => setGranularidade(e.target.value as GranularidadeFluxo)} className={selCls}>
          <option value="DIA">Diário</option>
          <option value="SEMANA">Semanal</option>
          <option value="MES">Mensal</option>
        </select>
        <select value={tipoData} onChange={(e) => setTipoData(e.target.value as TipoData)} className={selCls}>
          <option value="COMPETENCIA">Por competência</option>
          <option value="REAL">Por data real</option>
        </select>
      </div>

      {loading && !r && <div className="text-center text-slate-500 py-12">Calculando fluxo…</div>}

      {r && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Entradas confirmadas" value={formatBRL(r.totalEntradasConfirmadas)} tone="emerald" />
            <Stat label="Saídas confirmadas" value={formatBRL(r.totalSaidasConfirmadas)} tone="rose" />
            <Stat label="Saldo final confirmado" value={formatBRL(r.saldoFinalConfirmado)} tone={r.saldoFinalConfirmado >= 0 ? 'sky' : 'rose'} />
            <Stat label="Saldo final projetado" value={formatBRL(r.saldoFinalProjetado)} tone={r.saldoFinalProjetado >= 0 ? 'indigo' : 'rose'} />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Movimentações por período</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Entradas conf." stackId="conf" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="Saídas conf." stackId="conf" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="Entradas prev." stackId="prev" fill="#22c55e" stroke="#22c55e" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Saídas prev." stackId="prev" fill="#f97316" stroke="#f97316" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Saldo acumulado</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Saldo conf." stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Saldo proj." stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
              <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">Detalhe por período</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                  <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2">Período</th>
                    <th className="px-4 py-2 text-right">Entradas conf.</th>
                    <th className="px-4 py-2 text-right">Saídas conf.</th>
                    <th className="px-4 py-2 text-right">Entradas prev.</th>
                    <th className="px-4 py-2 text-right">Saídas prev.</th>
                    <th className="px-4 py-2 text-right">Saldo conf.</th>
                    <th className="px-4 py-2 text-right">Saldo proj.</th>
                  </tr>
                </thead>
                <tbody>
                  {r.pontos.map((p) => (
                    <tr key={p.periodo} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                      <td className="px-4 py-2 font-mono text-[12px]">{p.periodo}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{formatBRL(p.entradasConfirmadas)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-rose-700 dark:text-rose-400">{formatBRL(p.saidasConfirmadas)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-600/70">{formatBRL(p.entradasPrevistas)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-rose-600/70">{formatBRL(p.saidasPrevistas)}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-semibold ${p.saldoConfirmado >= 0 ? 'text-sky-700 dark:text-sky-400' : 'text-rose-700 dark:text-rose-400'}`}>{formatBRL(p.saldoConfirmado)}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-semibold ${p.saldoProjetado >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700 dark:text-rose-400'}`}>{formatBRL(p.saldoProjetado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'rose' | 'sky' | 'indigo' }) {
  const map: Record<string, string> = {
    emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    rose: 'from-rose-500/15 to-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-300',
    sky: 'from-sky-500/15 to-sky-500/5 border-sky-500/20 text-sky-700 dark:text-sky-300',
    indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${map[tone]} p-3.5`}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <p className="mt-1.5 text-[18px] font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

const selCls =
  'h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[12.5px] text-slate-700 dark:text-slate-200';
