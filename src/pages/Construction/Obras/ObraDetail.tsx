import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Calendar,
  HardHat,
  Layers,
  Loader2,
  MapPin,
  Plus,
} from 'lucide-react';
import {
  CREATE_OBRA_ETAPA,
  CREATE_OBRA_ITEM_WBS,
  CREATE_OBRA_SUBETAPA,
  GET_OBRA,
} from '../../../graphql/queries/construction-obras';
import { GET_VERSOES_ORCAMENTO } from '../../../graphql/queries/construction-orcamento';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import {
  formatBRL,
  formatDate,
  OBRA_STATUS_LABEL,
  OBRA_STATUS_TONE,
  VERSAO_STATUS_LABEL,
  VERSAO_STATUS_TONE,
  type ObraStatus,
  type VersaoOrcamentoStatus,
} from '../components/shared';

type Tab = 'resumo' | 'estrutura' | 'orcamentos' | 'transacoes';

interface ItemWBS { id: string; etapaId: string; subetapaId?: string | null; codigo: string; nome: string; unidade: string; quantidadeRef?: number | null; ordem: number }
interface Subetapa { id: string; etapaId: string; codigo: string; nome: string; ordem: number; itens: ItemWBS[] }
interface Etapa { id: string; obraId: string; codigo: string; nome: string; ordem: number; descricao?: string | null; subetapas: Subetapa[]; itens: ItemWBS[] }
interface Obra {
  id: string; codigo: string; nome: string; descricao?: string | null;
  endereco?: string | null; cidade?: string | null; estado?: string | null; cep?: string | null;
  status: ObraStatus; dataInicio?: string | null; dataFimPrev?: string | null; dataFimReal?: string | null;
  valorContrato?: number | null; createdAt: string; etapas: Etapa[];
}
interface Versao { id: string; numero: number; nome: string; status: VersaoOrcamentoStatus; total: number; ativadoEm?: string | null; createdAt: string }

export function ObraDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('resumo');

  const { data, loading, refetch } = useQuery<{ obra: Obra }>(GET_OBRA, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  const { data: vData } = useQuery<{ versoesOrcamento: Versao[] }>(GET_VERSOES_ORCAMENTO, {
    variables: { obraId: id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) return <div className="text-slate-500 p-6">Carregando obra…</div>;
  if (!data?.obra) return <div className="text-slate-500 p-6">Obra não encontrada.</div>;

  const obra = data.obra;
  const versoes = vData?.versoesOrcamento ?? [];

  return (
    <div className="space-y-6 w-full">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate('/obras')}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar para obras
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <HardHat className="w-4.5 h-4.5 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">
              <span className="font-mono text-[14px] text-slate-500 dark:text-slate-400 mr-2">{obra.codigo}</span>
              {obra.nome}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${OBRA_STATUS_TONE[obra.status]}`}>
                {OBRA_STATUS_LABEL[obra.status]}
              </span>
              {obra.cidade && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {obra.cidade}{obra.estado ? ' / ' + obra.estado : ''}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Início: {formatDate(obra.dataInicio)}
              </span>
              <span>Prev. fim: <span className="text-slate-700 dark:text-slate-300">{formatDate(obra.dataFimPrev)}</span></span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Contrato</div>
            <div className="text-[18px] font-bold tabular-nums text-slate-900 dark:text-white">
              {formatBRL(Number(obra.valorContrato ?? 0))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-white/10">
        {(['resumo', 'estrutura', 'orcamentos', 'transacoes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 h-9 text-[12.5px] font-semibold border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t === 'resumo' && 'Resumo'}
            {t === 'estrutura' && 'Estrutura (WBS)'}
            {t === 'orcamentos' && 'Orçamentos'}
            {t === 'transacoes' && 'Transações'}
          </button>
        ))}
      </div>

      {tab === 'resumo' && <ResumoTab obra={obra} versoes={versoes} />}
      {tab === 'estrutura' && <EstruturaTab obra={obra} onMutate={refetch} />}
      {tab === 'orcamentos' && <OrcamentosTab obraId={obra.id} versoes={versoes} />}
      {tab === 'transacoes' && (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 text-center text-slate-500">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          Vá para a página de transações filtrada por esta obra.
          <div className="mt-3">
            <button
              onClick={() => navigate(`/obras/transacoes?obraId=${obra.id}`)}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md"
            >
              Abrir transações da obra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumoTab({ obra, versoes }: { obra: Obra; versoes: Versao[] }) {
  const versaoAtiva = versoes.find((v) => v.status === 'ATIVO');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Detalhes</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <Item label="Código" value={obra.codigo} mono />
          <Item label="Status" value={OBRA_STATUS_LABEL[obra.status]} />
          <Item label="Endereço" value={obra.endereco ?? '—'} />
          <Item label="CEP" value={obra.cep ?? '—'} />
          <Item label="Cidade / UF" value={obra.cidade ? `${obra.cidade}${obra.estado ? ' / ' + obra.estado : ''}` : '—'} />
          <Item label="Data de início" value={formatDate(obra.dataInicio)} />
          <Item label="Prev. de fim" value={formatDate(obra.dataFimPrev)} />
          <Item label="Fim real" value={formatDate(obra.dataFimReal)} />
          <Item label="Cadastrada em" value={formatDate(obra.createdAt)} />
        </dl>
        {obra.descricao && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Descrição
            </div>
            <p className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{obra.descricao}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Orçamento ativo</h3>
        {versaoAtiva ? (
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Versão</span>
              <span className="font-semibold">v{versaoAtiva.numero} — {versaoAtiva.nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total previsto</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatBRL(Number(versaoAtiva.total))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ativado em</span>
              <span className="tabular-nums">{formatDate(versaoAtiva.ativadoEm)}</span>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500">Sem versão ativa. Crie um orçamento na aba "Orçamentos".</p>
        )}
      </div>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-0.5 ${mono ? 'font-mono' : ''} text-slate-800 dark:text-slate-200`}>{value}</dd>
    </div>
  );
}

function EstruturaTab({ obra, onMutate }: { obra: Obra; onMutate: () => void }) {
  const [createEtapa] = useMutation(CREATE_OBRA_ETAPA);
  const [createSub] = useMutation(CREATE_OBRA_SUBETAPA);
  const [createItem] = useMutation(CREATE_OBRA_ITEM_WBS);
  const [busy, setBusy] = useState(false);
  const [novoEtapa, setNovoEtapa] = useState({ codigo: '', nome: '' });
  const [novoSubAt, setNovoSubAt] = useState<string | null>(null);
  const [novoSub, setNovoSub] = useState({ codigo: '', nome: '' });
  const [novoItemAt, setNovoItemAt] = useState<{ etapaId: string; subetapaId?: string } | null>(null);
  const [novoItem, setNovoItem] = useState({ codigo: '', nome: '', unidade: 'UN' });

  async function addEtapa(e: React.FormEvent) {
    e.preventDefault();
    if (!novoEtapa.codigo || !novoEtapa.nome) return;
    setBusy(true);
    try {
      await createEtapa({
        variables: {
          input: {
            obraId: obra.id,
            codigo: novoEtapa.codigo,
            nome: novoEtapa.nome,
            ordem: obra.etapas.length,
          },
        },
      });
      toast.success('Etapa criada.');
      setNovoEtapa({ codigo: '', nome: '' });
      onMutate();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar etapa.');
    } finally {
      setBusy(false);
    }
  }

  async function addSub(etapaId: string) {
    if (!novoSub.codigo || !novoSub.nome) return;
    setBusy(true);
    try {
      await createSub({
        variables: { input: { etapaId, codigo: novoSub.codigo, nome: novoSub.nome, ordem: 0 } },
      });
      toast.success('Subetapa criada.');
      setNovoSub({ codigo: '', nome: '' });
      setNovoSubAt(null);
      onMutate();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar subetapa.');
    } finally {
      setBusy(false);
    }
  }

  async function addItem(etapaId: string, subetapaId?: string) {
    if (!novoItem.codigo || !novoItem.nome) return;
    setBusy(true);
    try {
      await createItem({
        variables: {
          input: {
            etapaId,
            subetapaId: subetapaId ?? null,
            codigo: novoItem.codigo,
            nome: novoItem.nome,
            unidade: novoItem.unidade || 'UN',
            ordem: 0,
          },
        },
      });
      toast.success('Item da WBS criado.');
      setNovoItem({ codigo: '', nome: '', unidade: 'UN' });
      setNovoItemAt(null);
      onMutate();
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar item.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addEtapa} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Código da etapa</label>
          <input value={novoEtapa.codigo} onChange={(e) => setNovoEtapa({ ...novoEtapa, codigo: e.target.value })} placeholder="ETP-01" className={inputCls} />
        </div>
        <div className="flex-[2]">
          <label className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Nome</label>
          <input value={novoEtapa.nome} onChange={(e) => setNovoEtapa({ ...novoEtapa, nome: e.target.value })} placeholder="Fundação" className={inputCls} />
        </div>
        <button disabled={busy} className="inline-flex items-center gap-1.5 h-10 px-4 text-[12.5px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Adicionar etapa
        </button>
      </form>

      {obra.etapas.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center text-slate-500">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
          Nenhuma etapa cadastrada. Comece criando a primeira etapa.
        </div>
      )}

      {obra.etapas.map((e) => (
        <div key={e.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="font-mono text-[12px] text-slate-500">{e.codigo}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{e.nome}</span>
            <div className="ml-auto flex gap-1.5">
              <button onClick={() => { setNovoSubAt(e.id); setNovoItemAt(null); }} className="text-[11.5px] font-semibold h-7 px-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-slate-700 dark:text-slate-300">+ Subetapa</button>
              <button onClick={() => { setNovoItemAt({ etapaId: e.id }); setNovoSubAt(null); }} className="text-[11.5px] font-semibold h-7 px-2.5 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-300">+ Item</button>
            </div>
          </div>

          {novoSubAt === e.id && (
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <input placeholder="Código" value={novoSub.codigo} onChange={(ev) => setNovoSub({ ...novoSub, codigo: ev.target.value })} className={inputCls} />
              <input placeholder="Nome subetapa" value={novoSub.nome} onChange={(ev) => setNovoSub({ ...novoSub, nome: ev.target.value })} className={inputCls} />
              <button onClick={() => addSub(e.id)} disabled={busy} className="h-10 px-3 text-[12px] font-semibold text-white bg-amber-600 rounded-md">Salvar</button>
              <button onClick={() => setNovoSubAt(null)} className="h-10 px-3 text-[12px] text-slate-600">Cancelar</button>
            </div>
          )}

          {novoItemAt?.etapaId === e.id && !novoItemAt.subetapaId && (
            <NovoItemForm onCancel={() => setNovoItemAt(null)} item={novoItem} setItem={setNovoItem} onSave={() => addItem(e.id)} busy={busy} />
          )}

          {e.subetapas.map((s) => (
            <div key={s.id} className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] last:border-0">
              <div className="flex items-center gap-3 pl-4">
                <span className="font-mono text-[11.5px] text-slate-500">{s.codigo}</span>
                <span className="text-[13px] text-slate-700 dark:text-slate-300">{s.nome}</span>
                <div className="ml-auto">
                  <button onClick={() => setNovoItemAt({ etapaId: e.id, subetapaId: s.id })} className="text-[11px] font-semibold h-6 px-2 rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300">+ Item</button>
                </div>
              </div>
              {novoItemAt?.subetapaId === s.id && (
                <NovoItemForm onCancel={() => setNovoItemAt(null)} item={novoItem} setItem={setNovoItem} onSave={() => addItem(e.id, s.id)} busy={busy} />
              )}
              {s.itens.map((it) => (
                <ItemRow key={it.id} item={it} indent={2} />
              ))}
            </div>
          ))}

          {e.itens.filter((i) => !i.subetapaId).map((it) => (
            <div key={it.id} className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] last:border-0">
              <ItemRow item={it} indent={1} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function NovoItemForm({ onCancel, onSave, busy, item, setItem }: { onCancel: () => void; onSave: () => void; busy: boolean; item: { codigo: string; nome: string; unidade: string }; setItem: React.Dispatch<React.SetStateAction<{ codigo: string; nome: string; unidade: string }>> }) {
  return (
    <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-amber-50/40 dark:bg-amber-500/[0.04] grid grid-cols-1 sm:grid-cols-[120px_1fr_80px_auto_auto] gap-2 items-end">
      <input placeholder="Código" value={item.codigo} onChange={(e) => setItem({ ...item, codigo: e.target.value })} className={inputCls} />
      <input placeholder="Descrição do item" value={item.nome} onChange={(e) => setItem({ ...item, nome: e.target.value })} className={inputCls} />
      <input placeholder="UN" value={item.unidade} onChange={(e) => setItem({ ...item, unidade: e.target.value.toUpperCase() })} className={inputCls} />
      <button onClick={onSave} disabled={busy} className="h-10 px-3 text-[12px] font-semibold text-white bg-amber-600 rounded-md">Salvar</button>
      <button onClick={onCancel} className="h-10 px-3 text-[12px] text-slate-600">Cancelar</button>
    </div>
  );
}

function ItemRow({ item, indent }: { item: ItemWBS; indent: number }) {
  return (
    <div className={`flex items-center gap-3 ${indent === 1 ? 'pl-4' : 'pl-10'}`}>
      <span className="font-mono text-[11px] text-slate-400">{item.codigo}</span>
      <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{item.nome}</span>
      <span className="text-[11px] text-slate-400">[{item.unidade}]</span>
    </div>
  );
}

function OrcamentosTab({ obraId, versoes }: { obraId: string; versoes: Versao[] }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/obras/${obraId}/orcamento/novo`)}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova versão
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Versão</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Ativado em</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {versoes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  Sem versões. Crie a primeira para começar a planejar custos.
                </td>
              </tr>
            )}
            {versoes.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono font-semibold tabular-nums">v{v.numero}</td>
                <td className="px-4 py-3">{v.nome}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${VERSAO_STATUS_TONE[v.status]}`}>
                    {VERSAO_STATUS_LABEL[v.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(v.createdAt)}</td>
                <td className="px-4 py-3 text-slate-500 tabular-nums">{formatDate(v.ativadoEm)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatBRL(Number(v.total))}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => navigate(`/obras/${obraId}/orcamento/${v.id}`)}
                    className="text-[11.5px] font-semibold h-7 px-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300"
                  >
                    Abrir
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
