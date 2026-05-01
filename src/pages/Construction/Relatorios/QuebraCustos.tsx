import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart as PieIcon } from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { REL_QUEBRA_CUSTOS } from '../../../graphql/queries/construction-relatorios';
import { CAT_TIPO_LABEL, formatBRL, formatPct } from '../components/shared';
import { buildFilterPayload, emptyFiltro, FiltroBar } from './_filtros';

interface Linha { id: string; nome: string; valor: number; percentTotal: number }
interface Data {
  total: number;
  porCategoria: Linha[];
  porTipoCategoria: Linha[];
  porCentroCusto: Linha[];
  porFornecedor: Linha[];
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16', '#ec4899', '#6366f1', '#14b8a6'];

export function QuebraCustos() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState(emptyFiltro());
  const { data, loading } = useQuery<{ relatorioQuebraCustos: Data }>(REL_QUEBRA_CUSTOS, {
    variables: { filter: buildFilterPayload(filtro) },
    fetchPolicy: 'cache-and-network',
  });

  const r = data?.relatorioQuebraCustos;

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
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center shadow-sm">
            <PieIcon className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Quebra de custos
          </h1>
        </div>
      </div>

      <FiltroBar value={filtro} onChange={setFiltro} />

      {loading && !r && <div className="text-center text-slate-500 py-12">Calculando…</div>}

      {r && (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Total realizado (despesas confirmadas)</div>
            <p className="mt-1 text-[28px] font-bold tabular-nums text-slate-900 dark:text-white">{formatBRL(r.total)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PieSection title="Por tipo de categoria" linhas={r.porTipoCategoria.map(l => ({ ...l, nome: CAT_TIPO_LABEL[l.nome as keyof typeof CAT_TIPO_LABEL] ?? l.nome }))} />
            <PieSection title="Por centro de custo" linhas={r.porCentroCusto} />
            <PieSection title="Por categoria" linhas={r.porCategoria} />
            <PieSection title="Por fornecedor" linhas={r.porFornecedor} />
          </div>
        </>
      )}
    </div>
  );
}

function PieSection({ title, linhas }: { title: string; linhas: Linha[] }) {
  const top = linhas.slice(0, 9);
  const outros = linhas.slice(9);
  const dadosChart = [...top];
  if (outros.length > 0) {
    const valor = outros.reduce((s, l) => s + l.valor, 0);
    const pct = outros.reduce((s, l) => s + l.percentTotal, 0);
    dadosChart.push({ id: '__outros', nome: `Outros (${outros.length})`, valor, percentTotal: pct });
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
      <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      {linhas.length === 0 ? (
        <div className="text-center text-slate-500 py-12 text-[13px]">Sem dados.</div>
      ) : (
        <>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <RPieChart>
                <Pie data={dadosChart} dataKey="valor" nameKey="nome" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {dadosChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1 text-[12.5px] max-h-[180px] overflow-y-auto">
            {linhas.map((l, i) => (
              <div key={l.id} className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] last:border-0 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate text-slate-700 dark:text-slate-300">{l.nome}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular-nums font-semibold text-slate-900 dark:text-white">{formatBRL(l.valor)}</span>
                  <span className="tabular-nums text-slate-500 w-12 text-right">{formatPct(l.percentTotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
