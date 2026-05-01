import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  ADD_ITENS_ORCAMENTO,
  ATIVAR_VERSAO_ORCAMENTO,
  CREATE_VERSAO_ORCAMENTO,
  GET_VERSAO_ORCAMENTO,
} from '../../../graphql/queries/construction-orcamento';
import { GET_OBRA } from '../../../graphql/queries/construction-obras';
import {
  GET_CATEGORIAS_CONSTRUCAO,
  GET_CENTROS_CUSTO,
} from '../../../graphql/queries/construction-cadastros';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import {
  formatBRL,
  VERSAO_STATUS_LABEL,
  VERSAO_STATUS_TONE,
  type VersaoOrcamentoStatus,
} from '../components/shared';

interface ItemDraft {
  etapaId: string;
  subetapaId?: string;
  itemWbsId?: string;
  centroCustoId?: string;
  categoriaId?: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
}

export function VersaoEditor() {
  const navigate = useNavigate();
  const { id: obraId, versaoId } = useParams<{ id: string; versaoId?: string }>();
  const isNew = !versaoId || versaoId === 'novo';

  const { data: obraData } = useQuery(GET_OBRA, {
    variables: { id: obraId },
    skip: !obraId,
  });
  const { data: versaoData, refetch } = useQuery(GET_VERSAO_ORCAMENTO, {
    variables: { id: versaoId },
    skip: isNew,
    fetchPolicy: 'cache-and-network',
  });
  const { data: ccData } = useQuery(GET_CENTROS_CUSTO);
  const { data: catData } = useQuery(GET_CATEGORIAS_CONSTRUCAO);

  const [createVersao, { loading: creating }] = useMutation(CREATE_VERSAO_ORCAMENTO);
  const [addItens, { loading: addingItens }] = useMutation(ADD_ITENS_ORCAMENTO);
  const [ativar, { loading: ativando }] = useMutation(ATIVAR_VERSAO_ORCAMENTO);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [drafts, setDrafts] = useState<ItemDraft[]>([]);

  const obra = obraData?.obra;
  const versao = versaoData?.versaoOrcamento;
  const status: VersaoOrcamentoStatus = versao?.status ?? 'RASCUNHO';
  const editavel = isNew || status === 'RASCUNHO';

  const etapas = obra?.etapas ?? [];
  const centrosCusto = ccData?.centrosCusto ?? [];
  const categorias = catData?.categoriasConstrucao ?? [];

  function addDraft() {
    setDrafts((prev) => [
      ...prev,
      { etapaId: '', descricao: '', unidade: 'UN', quantidade: '', valorUnitario: '' },
    ]);
  }

  function removeDraft(idx: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  function updDraft(idx: number, patch: Partial<ItemDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function buildPayload() {
    return drafts.map((d) => ({
      etapaId: d.etapaId || null,
      subetapaId: d.subetapaId || null,
      itemWbsId: d.itemWbsId || null,
      centroCustoId: d.centroCustoId || null,
      categoriaId: d.categoriaId || null,
      descricao: d.descricao.trim(),
      unidade: d.unidade || 'UN',
      quantidade: Number(d.quantidade || 0),
      valorUnitario: Number(d.valorUnitario || 0),
      ordem: 0,
    }));
  }

  async function handleCriarVersao() {
    if (!nome.trim()) return toast.error('Informe o nome da versão.');
    if (drafts.length === 0) return toast.error('Adicione pelo menos um item.');
    try {
      const { data } = await createVersao({
        variables: {
          input: {
            obraId,
            nome: nome.trim(),
            descricao: descricao || null,
            itens: buildPayload(),
          },
        },
      });
      toast.success('Versão criada.');
      navigate(`/obras/${obraId}/orcamento/${data.createVersaoOrcamento.id}`);
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar versão.');
    }
  }

  async function handleAddItens() {
    if (!versaoId) return;
    if (drafts.length === 0) return toast.error('Adicione pelo menos um item.');
    try {
      await addItens({ variables: { input: { versaoId, itens: buildPayload() } } });
      toast.success('Itens adicionados.');
      setDrafts([]);
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao adicionar itens.');
    }
  }

  async function handleAtivar() {
    if (!versaoId) return;
    if (!confirm('Ao ativar, a versão fica congelada e imutável. Continuar?')) return;
    try {
      await ativar({ variables: { id: versaoId } });
      toast.success('Versão ativada.');
      await refetch();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao ativar versão.');
    }
  }

  const itensExistentes = versao?.itens ?? [];
  const totalDraft = drafts.reduce((s, d) => s + Number(d.quantidade || 0) * Number(d.valorUnitario || 0), 0);
  const totalAtual = Number(versao?.total ?? 0);

  return (
    <div className="space-y-6 w-full">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate(`/obras/${obraId}`)}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar para obra
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <FileText className="w-4.5 h-4.5 text-white" />
          </span>
          <div>
            <h1 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">
              {isNew ? 'Nova versão de orçamento' : `Versão v${versao?.numero ?? '...'}: ${versao?.nome ?? ''}`}
            </h1>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
              {obra ? `${obra.codigo} — ${obra.nome}` : '...'}
            </p>
          </div>
          {!isNew && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11.5px] font-semibold ${VERSAO_STATUS_TONE[status]}`}>
              {VERSAO_STATUS_LABEL[status]}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {!isNew && status === 'RASCUNHO' && (
              <button
                onClick={handleAtivar}
                disabled={ativando}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-semibold disabled:opacity-50"
              >
                {ativando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Ativar versão
              </button>
            )}
          </div>
        </div>
      </div>

      {isNew && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Nome da versão *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="v1 — orçamento inicial" className={inputCls} />
          </div>
          <div>
            <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Descrição</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {!isNew && itensExistentes.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
              Itens já lançados ({itensExistentes.length})
            </span>
            <span className="text-[13px] font-bold tabular-nums text-slate-900 dark:text-white">
              Total: {formatBRL(totalAtual)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">UN</th>
                  <th className="px-4 py-2 text-right">Qtd</th>
                  <th className="px-4 py-2 text-right">V. unit</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {itensExistentes.map((it: any) => (
                  <tr key={it.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{it.descricao}</td>
                    <td className="px-4 py-2 text-slate-500">{it.unidade}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{Number(it.quantidade).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatBRL(Number(it.valorUnitario))}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatBRL(Number(it.valorTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editavel && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
              {isNew ? 'Itens da versão' : 'Adicionar itens'}
            </span>
            <button
              onClick={addDraft}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded text-[11.5px] font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3 h-3" />
              Linha
            </button>
          </div>
          {drafts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-[13px]">
              Adicione linhas com o botão acima.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                  <tr className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2">Etapa</th>
                    <th className="px-3 py-2">Subetapa</th>
                    <th className="px-3 py-2">Item WBS</th>
                    <th className="px-3 py-2">CC</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2 min-w-[200px]">Descrição</th>
                    <th className="px-3 py-2">UN</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-right">V. unit</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d, i) => {
                    const etapa = etapas.find((e: any) => e.id === d.etapaId);
                    const subetapas = etapa?.subetapas ?? [];
                    const itensWBS = etapa
                      ? [...etapa.itens, ...etapa.subetapas.flatMap((s: any) => s.itens)]
                      : [];
                    const total = Number(d.quantidade || 0) * Number(d.valorUnitario || 0);
                    return (
                      <tr key={i} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                        <td className="px-2 py-1.5">
                          <select value={d.etapaId} onChange={(e) => updDraft(i, { etapaId: e.target.value, subetapaId: undefined, itemWbsId: undefined })} className={selCls}>
                            <option value="">—</option>
                            {etapas.map((e: any) => <option key={e.id} value={e.id}>{e.codigo} {e.nome}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={d.subetapaId ?? ''} onChange={(e) => updDraft(i, { subetapaId: e.target.value || undefined })} className={selCls} disabled={!d.etapaId}>
                            <option value="">—</option>
                            {subetapas.map((s: any) => <option key={s.id} value={s.id}>{s.codigo} {s.nome}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={d.itemWbsId ?? ''} onChange={(e) => updDraft(i, { itemWbsId: e.target.value || undefined })} className={selCls} disabled={!d.etapaId}>
                            <option value="">—</option>
                            {itensWBS.map((it: any) => <option key={it.id} value={it.id}>{it.codigo} {it.nome}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={d.centroCustoId ?? ''} onChange={(e) => updDraft(i, { centroCustoId: e.target.value || undefined })} className={selCls}>
                            <option value="">—</option>
                            {centrosCusto.map((cc: any) => <option key={cc.id} value={cc.id}>{cc.codigo} {cc.nome}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={d.categoriaId ?? ''} onChange={(e) => updDraft(i, { categoriaId: e.target.value || undefined })} className={selCls}>
                            <option value="">—</option>
                            {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.codigo} {c.nome}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={d.descricao} onChange={(e) => updDraft(i, { descricao: e.target.value })} className={inputSm} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={d.unidade} onChange={(e) => updDraft(i, { unidade: e.target.value.toUpperCase() })} className={`${inputSm} w-16`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="0.0001" value={d.quantidade} onChange={(e) => updDraft(i, { quantidade: e.target.value })} className={`${inputSm} w-24 text-right tabular-nums`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="0.01" value={d.valorUnitario} onChange={(e) => updDraft(i, { valorUnitario: e.target.value })} className={`${inputSm} w-28 text-right tabular-nums`} />
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{formatBRL(total)}</td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => removeDraft(i)} className="w-7 h-7 grid place-items-center rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                <span className="text-[12px] text-slate-500">{drafts.length} item(ns) em rascunho</span>
                <span className="text-[14px] font-bold tabular-nums text-slate-900 dark:text-white">
                  Total novo: {formatBRL(totalDraft)}
                </span>
              </div>
            </div>
          )}
          {drafts.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] flex justify-end gap-2">
              <button
                onClick={isNew ? handleCriarVersao : handleAddItens}
                disabled={creating || addingItens}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md disabled:opacity-50"
              >
                {(creating || addingItens) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {isNew ? 'Criar versão' : 'Adicionar itens'}
              </button>
            </div>
          )}
        </div>
      )}

      {!editavel && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-[12.5px] text-amber-800 dark:text-amber-300">
          Versão {VERSAO_STATUS_LABEL[status].toLowerCase()} é imutável. Para alterar, crie uma nova versão a partir desta.
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40';

const inputSm =
  'h-8 px-2 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-amber-500/40';

const selCls =
  'h-8 px-2 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[12px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 max-w-[140px]';
