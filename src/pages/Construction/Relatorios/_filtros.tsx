import { useQuery } from '@apollo/client';
import { GET_OBRAS } from '../../../graphql/queries/construction-obras';
import {
  GET_CATEGORIAS_CONSTRUCAO,
  GET_CENTROS_CUSTO,
} from '../../../graphql/queries/construction-cadastros';
import type { TipoData } from '../components/shared';

export interface RelFiltro {
  obraId: string;
  etapaId: string;
  centroCustoId: string;
  categoriaId: string;
  dataInicio: string;
  dataFim: string;
  tipoData: TipoData;
}

export const emptyFiltro = (): RelFiltro => ({
  obraId: '',
  etapaId: '',
  centroCustoId: '',
  categoriaId: '',
  dataInicio: '',
  dataFim: '',
  tipoData: 'COMPETENCIA',
});

export function FiltroBar({ value, onChange }: { value: RelFiltro; onChange: (next: RelFiltro) => void }) {
  const { data: obras } = useQuery<{ obras: { id: string; codigo: string; nome: string }[] }>(GET_OBRAS);
  const { data: ccs } = useQuery<{ centrosCusto: { id: string; codigo: string; nome: string }[] }>(GET_CENTROS_CUSTO);
  const { data: cats } = useQuery<{ categoriasConstrucao: { id: string; codigo: string; nome: string }[] }>(GET_CATEGORIAS_CONSTRUCAO);

  const upd = <K extends keyof RelFiltro>(k: K, v: RelFiltro[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <select value={value.obraId} onChange={(e) => upd('obraId', e.target.value)} className={selCls}>
        <option value="">Todas as obras</option>
        {obras?.obras?.map((o) => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
      </select>
      <select value={value.centroCustoId} onChange={(e) => upd('centroCustoId', e.target.value)} className={selCls}>
        <option value="">Todos os CCs</option>
        {ccs?.centrosCusto?.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
      </select>
      <select value={value.categoriaId} onChange={(e) => upd('categoriaId', e.target.value)} className={selCls}>
        <option value="">Todas as categorias</option>
        {cats?.categoriasConstrucao?.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
      </select>
      <input type="date" value={value.dataInicio} onChange={(e) => upd('dataInicio', e.target.value)} className={selCls} placeholder="Início" />
      <input type="date" value={value.dataFim} onChange={(e) => upd('dataFim', e.target.value)} className={selCls} placeholder="Fim" />
      <select value={value.tipoData} onChange={(e) => upd('tipoData', e.target.value as TipoData)} className={selCls}>
        <option value="COMPETENCIA">Por competência</option>
        <option value="REAL">Por data real</option>
      </select>
    </div>
  );
}

export function buildFilterPayload(f: RelFiltro) {
  return {
    obraId: f.obraId || null,
    centroCustoId: f.centroCustoId || null,
    categoriaId: f.categoriaId || null,
    dataInicio: f.dataInicio ? new Date(f.dataInicio).toISOString() : null,
    dataFim: f.dataFim ? new Date(f.dataFim).toISOString() : null,
    tipoData: f.tipoData,
  };
}

const selCls =
  'h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[12.5px] text-slate-700 dark:text-slate-200';
