import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowLeftRight, Loader2, Save } from 'lucide-react';
import { CREATE_TRANSACAO } from '../../../graphql/queries/construction-transacoes';
import { GET_OBRA, GET_OBRAS } from '../../../graphql/queries/construction-obras';
import {
  GET_CATEGORIAS_CONSTRUCAO,
  GET_CENTROS_CUSTO,
} from '../../../graphql/queries/construction-cadastros';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import type { StatusTransacao, TipoTransacao } from '../components/shared';

interface FormState {
  obraId: string;
  etapaId: string;
  subetapaId: string;
  itemWbsId: string;
  centroCustoId: string;
  categoriaId: string;
  supplierId: string;
  tipo: TipoTransacao;
  status: StatusTransacao;
  valor: string;
  descricao: string;
  documento: string;
  dataCompetencia: string;
  dataReal: string;
  dataPrevistaPgto: string;
  observacoes: string;
}

export function TransacaoCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState<FormState>({
    obraId: params.get('obraId') ?? '',
    etapaId: '',
    subetapaId: '',
    itemWbsId: '',
    centroCustoId: '',
    categoriaId: '',
    supplierId: '',
    tipo: 'DESPESA',
    status: 'PENDENTE',
    valor: '',
    descricao: '',
    documento: '',
    dataCompetencia: new Date().toISOString().slice(0, 10),
    dataReal: '',
    dataPrevistaPgto: '',
    observacoes: '',
  });

  const { data: obras } = useQuery<{ obras: any[] }>(GET_OBRAS);
  const { data: obraData } = useQuery(GET_OBRA, {
    variables: { id: form.obraId },
    skip: !form.obraId,
  });
  const { data: ccData } = useQuery(GET_CENTROS_CUSTO);
  const { data: catData } = useQuery(GET_CATEGORIAS_CONSTRUCAO);
  const [createTransacao, { loading }] = useMutation(CREATE_TRANSACAO);

  const obra = obraData?.obra;
  const etapas = obra?.etapas ?? [];
  const etapaSel = etapas.find((e: any) => e.id === form.etapaId);
  const subetapas = etapaSel?.subetapas ?? [];
  const itensWBS = etapaSel
    ? [...etapaSel.itens, ...etapaSel.subetapas.flatMap((s: any) => s.itens)]
    : [];

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.obraId) return toast.error('Selecione a obra.');
    if (!form.centroCustoId) return toast.error('Selecione o centro de custo.');
    if (!form.categoriaId) return toast.error('Selecione a categoria.');
    if (!form.descricao.trim()) return toast.error('Descrição obrigatória.');
    if (!form.valor || Number(form.valor) <= 0) return toast.error('Valor deve ser maior que 0.');
    if (form.status === 'CONFIRMADO' && !form.dataReal) return toast.error('Data real é obrigatória para CONFIRMADA.');

    try {
      await createTransacao({
        variables: {
          input: {
            obraId: form.obraId,
            etapaId: form.etapaId || null,
            subetapaId: form.subetapaId || null,
            itemWbsId: form.itemWbsId || null,
            centroCustoId: form.centroCustoId,
            categoriaId: form.categoriaId,
            supplierId: form.supplierId || null,
            tipo: form.tipo,
            status: form.status,
            valor: Number(form.valor),
            descricao: form.descricao.trim(),
            documento: form.documento || null,
            dataCompetencia: new Date(form.dataCompetencia).toISOString(),
            dataReal: form.dataReal ? new Date(form.dataReal).toISOString() : null,
            dataPrevistaPgto: form.dataPrevistaPgto ? new Date(form.dataPrevistaPgto).toISOString() : null,
            observacoes: form.observacoes || null,
          },
        },
      });
      toast.success('Transação criada.');
      navigate('/obras/transacoes' + (form.obraId ? `?obraId=${form.obraId}` : ''));
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar transação.');
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <ArrowLeftRight className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Nova transação financeira
          </h1>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Obra *">
            <select value={form.obraId} onChange={(e) => upd('obraId', e.target.value)} className={inputCls}>
              <option value="">— selecionar —</option>
              {obras?.obras?.map((o: any) => <option key={o.id} value={o.id}>{o.codigo} — {o.nome}</option>)}
            </select>
          </Field>
          <Field label="Tipo *">
            <div className="flex gap-2">
              <button type="button" onClick={() => upd('tipo', 'DESPESA')} className={`flex-1 h-10 rounded-md text-[12.5px] font-semibold ${form.tipo === 'DESPESA' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300'}`}>Despesa</button>
              <button type="button" onClick={() => upd('tipo', 'RECEITA')} className={`flex-1 h-10 rounded-md text-[12.5px] font-semibold ${form.tipo === 'RECEITA' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300'}`}>Receita</button>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Etapa">
            <select value={form.etapaId} onChange={(e) => upd('etapaId', e.target.value)} className={inputCls} disabled={!form.obraId}>
              <option value="">—</option>
              {etapas.map((e: any) => <option key={e.id} value={e.id}>{e.codigo} {e.nome}</option>)}
            </select>
          </Field>
          <Field label="Subetapa">
            <select value={form.subetapaId} onChange={(e) => upd('subetapaId', e.target.value)} className={inputCls} disabled={!form.etapaId}>
              <option value="">—</option>
              {subetapas.map((s: any) => <option key={s.id} value={s.id}>{s.codigo} {s.nome}</option>)}
            </select>
          </Field>
          <Field label="Item WBS">
            <select value={form.itemWbsId} onChange={(e) => upd('itemWbsId', e.target.value)} className={inputCls} disabled={!form.etapaId}>
              <option value="">—</option>
              {itensWBS.map((it: any) => <option key={it.id} value={it.id}>{it.codigo} {it.nome}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Centro de custo *">
            <select value={form.centroCustoId} onChange={(e) => upd('centroCustoId', e.target.value)} className={inputCls}>
              <option value="">— selecionar —</option>
              {ccData?.centrosCusto?.map((cc: any) => <option key={cc.id} value={cc.id}>{cc.codigo} — {cc.nome}</option>)}
            </select>
          </Field>
          <Field label="Categoria *">
            <select value={form.categoriaId} onChange={(e) => upd('categoriaId', e.target.value)} className={inputCls}>
              <option value="">— selecionar —</option>
              {catData?.categoriasConstrucao?.map((c: any) => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Descrição *">
          <input value={form.descricao} onChange={(e) => upd('descricao', e.target.value)} placeholder="NF 1234 - 240m³ concreto" className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Valor (R$) *">
            <input type="number" step="0.01" min={0} value={form.valor} onChange={(e) => upd('valor', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Documento">
            <input value={form.documento} onChange={(e) => upd('documento', e.target.value)} placeholder="NF-e 1234" className={inputCls} />
          </Field>
          <Field label="Status *">
            <select value={form.status} onChange={(e) => upd('status', e.target.value as StatusTransacao)} className={inputCls}>
              <option value="PENDENTE">Pendente</option>
              <option value="CONFIRMADO">Confirmado</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Data de competência *">
            <input type="date" value={form.dataCompetencia} onChange={(e) => upd('dataCompetencia', e.target.value)} className={inputCls} />
          </Field>
          <Field label={form.status === 'CONFIRMADO' ? 'Data real *' : 'Data real'}>
            <input type="date" value={form.dataReal} onChange={(e) => upd('dataReal', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Prev. de pagamento">
            <input type="date" value={form.dataPrevistaPgto} onChange={(e) => upd('dataPrevistaPgto', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Observações">
          <textarea value={form.observacoes} onChange={(e) => upd('observacoes', e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </Field>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-md disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar transação
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
