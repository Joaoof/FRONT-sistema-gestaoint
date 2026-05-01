import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, Tag } from 'lucide-react';
import {
  CREATE_CATEGORIA_CONSTRUCAO,
  GET_CATEGORIAS_CONSTRUCAO,
} from '../../../graphql/queries/construction-cadastros';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import { CAT_TIPO_LABEL, type CategoriaConstrucaoTipo } from '../components/shared';

interface Cat {
  id: string;
  codigo: string;
  nome: string;
  parentId?: string | null;
  tipo: CategoriaConstrucaoTipo;
  ativo: boolean;
}

const TIPOS: CategoriaConstrucaoTipo[] = ['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'SERVICO_TERCEIRO', 'ADMINISTRATIVO', 'IMPOSTO', 'OUTRO'];

export function CategoriasConstrucaoList() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useQuery<{ categoriasConstrucao: Cat[] }>(GET_CATEGORIAS_CONSTRUCAO, {
    fetchPolicy: 'cache-and-network',
  });
  const [createCat, { loading: creating }] = useMutation(CREATE_CATEGORIA_CONSTRUCAO);

  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    tipo: 'MATERIAL' as CategoriaConstrucaoTipo,
    parentId: '' as string,
  });
  const [filterTipo, setFilterTipo] = useState<CategoriaConstrucaoTipo | ''>('');

  const items = data?.categoriasConstrucao ?? [];

  const grouped = useMemo(() => {
    const map = new Map<CategoriaConstrucaoTipo, Cat[]>();
    for (const c of items) {
      if (filterTipo && c.tipo !== filterTipo) continue;
      const arr = map.get(c.tipo) ?? [];
      arr.push(c);
      map.set(c.tipo, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items, filterTipo]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nome.trim()) {
      toast.error('Código e nome são obrigatórios.');
      return;
    }
    try {
      await createCat({
        variables: {
          input: {
            codigo: form.codigo.trim(),
            nome: form.nome.trim(),
            tipo: form.tipo,
            parentId: form.parentId || null,
          },
        },
      });
      setForm({ codigo: '', nome: '', tipo: form.tipo, parentId: '' });
      toast.success('Categoria criada.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar categoria.');
    }
  }

  return (
    <div className="space-y-6 w-full max-w-5xl">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <Tag className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Categorias de construção
          </h1>
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          Material, mão de obra, equipamento, serviço terceiro, administrativo, etc.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-[110px_140px_1fr_1fr_auto] gap-2 items-end"
      >
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Código</label>
          <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="CAT-001" className={inputCls} />
        </div>
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Tipo</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as CategoriaConstrucaoTipo })} className={inputCls}>
            {TIPOS.map((t) => <option key={t} value={t}>{CAT_TIPO_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Nome</label>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Concreto FCK 25" className={inputCls} />
        </div>
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Categoria pai</label>
          <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className={inputCls}>
            <option value="">— sem pai —</option>
            {items
              .filter((c) => c.tipo === form.tipo)
              .map((c) => <option key={c.id} value={c.id}>{c.codigo} {c.nome}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-semibold disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Adicionar
        </button>
      </form>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterTipo('')}
          className={`h-7 px-2.5 rounded text-[11.5px] font-semibold ${filterTipo === '' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300'}`}
        >Todos</button>
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setFilterTipo(t)}
            className={`h-7 px-2.5 rounded text-[11.5px] font-semibold ${filterTipo === t ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300'}`}
          >{CAT_TIPO_LABEL[t]}</button>
        ))}
      </div>

      {loading && grouped.length === 0 && (
        <div className="text-center text-slate-500 py-12">Carregando…</div>
      )}

      {grouped.map(([tipo, cats]) => (
        <div key={tipo} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
            <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">{CAT_TIPO_LABEL[tipo]}</span>
            <span className="text-[11.5px] text-slate-500 ml-2">({cats.length})</span>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {cats.map((c) => {
                const parent = cats.find((p) => p.id === c.parentId);
                return (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-slate-500 w-24">{c.codigo}</td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                      {c.parentId && <span className="text-slate-400">└ </span>}
                      {c.nome}
                      {parent && <span className="text-[11.5px] text-slate-400 ml-1">(filho de {parent.codigo})</span>}
                    </td>
                    <td className="px-4 py-2.5 w-24 text-right">
                      {c.ativo
                        ? <span className="inline-flex px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">Ativa</span>
                        : <span className="inline-flex px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/[0.06]">Inativa</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

const inputCls =
  'w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40';
