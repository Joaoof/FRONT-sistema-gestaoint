import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, HardHat, Loader2, Save } from 'lucide-react';
import { CREATE_OBRA, GET_OBRAS } from '../../../graphql/queries/construction-obras';
import { getGraphQLErrorMessages } from '../../../utils/getGraphQLErrorMessage';
import type { ObraStatus } from '../components/shared';

interface FormState {
  codigo: string;
  nome: string;
  descricao: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status: ObraStatus;
  dataInicio: string;
  dataFimPrev: string;
  valorContrato: string;
}

export function ObraCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    codigo: '',
    nome: '',
    descricao: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    status: 'PLANEJAMENTO',
    dataInicio: '',
    dataFimPrev: '',
    valorContrato: '',
  });
  const [createObra, { loading }] = useMutation(CREATE_OBRA, {
    refetchQueries: [{ query: GET_OBRAS }],
  });

  const upd = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nome.trim()) {
      toast.error('Código e nome são obrigatórios.');
      return;
    }
    try {
      const { data } = await createObra({
        variables: {
          input: {
            codigo: form.codigo.trim(),
            nome: form.nome.trim(),
            descricao: form.descricao || null,
            endereco: form.endereco || null,
            cidade: form.cidade || null,
            estado: form.estado || null,
            cep: form.cep || null,
            status: form.status,
            dataInicio: form.dataInicio ? new Date(form.dataInicio).toISOString() : null,
            dataFimPrev: form.dataFimPrev ? new Date(form.dataFimPrev).toISOString() : null,
            valorContrato: form.valorContrato ? Number(form.valorContrato) : null,
          },
        },
      });
      toast.success('Obra criada com sucesso.');
      navigate(`/obras/${data.createObra.id}`);
    } catch (err) {
      toast.error(getGraphQLErrorMessages(err)[0] || 'Erro ao criar obra.');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-sm">
            <HardHat className="w-4 h-4 text-white" />
          </span>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Nova obra
          </h1>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Código *" required>
            <input
              value={form.codigo}
              onChange={(e) => upd('codigo', e.target.value)}
              placeholder="OBR-001"
              className={inputCls}
            />
          </Field>
          <Field label="Nome *" required className="sm:col-span-2">
            <input
              value={form.nome}
              onChange={(e) => upd('nome', e.target.value)}
              placeholder="Edifício Aurora"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Descrição">
          <textarea
            value={form.descricao}
            onChange={(e) => upd('descricao', e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => upd('status', e.target.value as ObraStatus)}
              className={inputCls}
            >
              <option value="PLANEJAMENTO">Planejamento</option>
              <option value="EM_EXECUCAO">Em execução</option>
              <option value="PAUSADA">Pausada</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </Field>
          <Field label="Início">
            <input type="date" value={form.dataInicio} onChange={(e) => upd('dataInicio', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Previsão de fim">
            <input type="date" value={form.dataFimPrev} onChange={(e) => upd('dataFimPrev', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Valor contratual (R$)">
          <input
            type="number"
            step="0.01"
            min={0}
            value={form.valorContrato}
            onChange={(e) => upd('valorContrato', e.target.value)}
            placeholder="0,00"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Endereço">
            <input value={form.endereco} onChange={(e) => upd('endereco', e.target.value)} className={inputCls} />
          </Field>
          <Field label="CEP">
            <input value={form.cep} onChange={(e) => upd('cep', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Cidade" className="sm:col-span-2">
            <input value={form.cidade} onChange={(e) => upd('cidade', e.target.value)} className={inputCls} />
          </Field>
          <Field label="UF">
            <input maxLength={2} value={form.estado} onChange={(e) => upd('estado', e.target.value.toUpperCase())} className={inputCls} />
          </Field>
        </div>

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
            Salvar obra
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40';

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
