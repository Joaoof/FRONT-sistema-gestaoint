import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Building, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  CREATE_CENTRO_CUSTO,
  DELETE_CENTRO_CUSTO,
  GET_CENTROS_CUSTO,
} from '../../../graphql/queries/construction-cadastros';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';

interface CC {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

export function CentrosCustoList() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useQuery<{ centrosCusto: CC[] }>(GET_CENTROS_CUSTO, {
    fetchPolicy: 'cache-and-network',
  });
  const [createCC, { loading: creating }] = useMutation(CREATE_CENTRO_CUSTO);
  const [delCC] = useMutation(DELETE_CENTRO_CUSTO);

  const [form, setForm] = useState({ codigo: '', nome: '', descricao: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nome.trim()) {
      toast.error('Código e nome são obrigatórios.');
      return;
    }
    try {
      await createCC({
        variables: {
          input: {
            codigo: form.codigo.trim(),
            nome: form.nome.trim(),
            descricao: form.descricao || null,
          },
        },
      });
      setForm({ codigo: '', nome: '', descricao: '' });
      toast.success('Centro de custo criado.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir centro de custo?')) return;
    setDeletingId(id);
    try {
      await delCC({ variables: { id } });
      toast.success('Centro de custo excluído.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao excluir.');
    } finally {
      setDeletingId(null);
    }
  }

  const items = data?.centrosCusto ?? [];

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <Building className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Centros de custo
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_auto] gap-2 items-end"
      >
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Código</label>
          <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="CC-001" className={inputCls} />
        </div>
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Nome</label>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Administração da obra" className={inputCls} />
        </div>
        <div>
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Descrição</label>
          <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputCls} />
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

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">Carregando…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                Nenhum centro de custo. Cadastre o primeiro acima.
              </td></tr>
            )}
            {items.map((cc) => (
              <tr key={cc.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{cc.codigo}</td>
                <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{cc.nome}</td>
                <td className="px-4 py-3 text-slate-500">{cc.descricao ?? '—'}</td>
                <td className="px-4 py-3">
                  {cc.ativo
                    ? <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">Ativo</span>
                    : <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400">Inativo</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(cc.id)}
                    disabled={deletingId === cc.id}
                    className="w-7 h-7 grid place-items-center rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 disabled:opacity-50"
                  >
                    {deletingId === cc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputCls =
  'w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40';
