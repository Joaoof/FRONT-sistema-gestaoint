import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  AlertCircle,
  CheckCircle,
  Cog,
  Loader2,
  Save,
} from 'lucide-react';
import {
  GET_COMPANY_SETTINGS,
  UPSERT_COMPANY_SETTINGS,
} from '../../graphql/queries/system-settings';

interface CompanySettings {
  id: string;
  companyId: string;
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberDecimals: number;
  numberDecimalSep: string;
  numberThousandSep: string;
  weekStartsOn: number;
  fiscalYearStartMonth: number;
  defaultPageSize: number;
  companyWhatsappNumber: string | null;
  companyWhatsappName: string | null;
  createdAt: string;
  updatedAt: string;
}

const CURRENCIES = [
  { code: 'BRL', label: 'Real Brasileiro (BRL)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'Libra Esterlina (GBP)' },
  { code: 'ARS', label: 'Peso Argentino (ARS)' },
  { code: 'CLP', label: 'Peso Chileno (CLP)' },
];

const LOCALES = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'es-AR', label: 'Español (Argentina)' },
];

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Recife',
  'America/Fortaleza',
  'America/Cuiaba',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'UTC',
];

const DATE_FORMATS = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/AAAA (31/12/2026)' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/AAAA (12/31/2026)' },
  { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD (2026-12-31)' },
  { value: 'dd-MM-yyyy', label: 'DD-MM-AAAA (31-12-2026)' },
];

const TIME_FORMATS = [
  { value: 'HH:mm', label: '24h (14:30)' },
  { value: 'hh:mm a', label: '12h (02:30 PM)' },
  { value: 'HH:mm:ss', label: '24h com segundos (14:30:45)' },
];

const WEEK_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function SystemParametersPage() {
  const { data, loading, error, refetch } = useQuery<{
    companySettings: CompanySettings;
  }>(GET_COMPANY_SETTINGS, { fetchPolicy: 'cache-and-network' });

  const [upsert, { loading: saving }] = useMutation(UPSERT_COMPANY_SETTINGS);

  const [form, setForm] = useState<Partial<CompanySettings>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (data?.companySettings) {
      setForm(data.companySettings);
    }
  }, [data]);

  const sample = useMemo(() => {
    if (!form.locale || !form.numberDecimals || !form.currency) return '';
    try {
      return new Intl.NumberFormat(form.locale, {
        style: 'currency',
        currency: form.currency,
        minimumFractionDigits: form.numberDecimals,
        maximumFractionDigits: form.numberDecimals,
      }).format(1234567.89);
    } catch {
      return '—';
    }
  }, [form.locale, form.currency, form.numberDecimals]);

  const sampleDate = useMemo(() => {
    if (!form.locale || !form.timezone) return '';
    try {
      return new Date().toLocaleString(form.locale, {
        timeZone: form.timezone,
      });
    } catch {
      return '—';
    }
  }, [form.locale, form.timezone]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await upsert({
        variables: {
          input: {
            currency: form.currency,
            locale: form.locale,
            timezone: form.timezone,
            dateFormat: form.dateFormat,
            timeFormat: form.timeFormat,
            numberDecimals: form.numberDecimals,
            numberDecimalSep: form.numberDecimalSep,
            numberThousandSep: form.numberThousandSep,
            weekStartsOn: form.weekStartsOn,
            fiscalYearStartMonth: form.fiscalYearStartMonth,
            defaultPageSize: form.defaultPageSize,
            companyWhatsappNumber: form.companyWhatsappNumber ?? null,
            companyWhatsappName: form.companyWhatsappName ?? null,
          },
        },
      });
      await refetch();
      setFeedback({ type: 'success', message: 'Parâmetros salvos com sucesso.' });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao salvar parâmetros';
      setFeedback({ type: 'error', message: msg });
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
        Erro ao carregar configurações: {error.message}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      <header className="flex items-center gap-3">
        <Cog className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-['Rajdhani'] font-bold">
            Parâmetros do Sistema
          </h1>
          <p className="text-xs text-slate-500">
            Moeda, fuso horário, formatos de data, número e ano fiscal.
          </p>
        </div>
      </header>

      {feedback && (
        <div
          className={`flex items-start gap-2 text-sm p-3 rounded border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Internacionalização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Moeda</span>
            <select
              value={form.currency ?? 'BRL'}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Idioma/Região</span>
            <select
              value={form.locale ?? 'pt-BR'}
              onChange={(e) =>
                setForm((p) => ({ ...p, locale: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            <span className="block mb-1 text-slate-600">Fuso horário</span>
            <select
              value={form.timezone ?? 'America/Sao_Paulo'}
              onChange={(e) =>
                setForm((p) => ({ ...p, timezone: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Formatos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Formato de data</span>
            <select
              value={form.dateFormat ?? 'dd/MM/yyyy'}
              onChange={(e) =>
                setForm((p) => ({ ...p, dateFormat: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {DATE_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Formato de hora</span>
            <select
              value={form.timeFormat ?? 'HH:mm'}
              onChange={(e) =>
                setForm((p) => ({ ...p, timeFormat: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {TIME_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Casas decimais</span>
            <input
              type="number"
              min={0}
              max={6}
              value={form.numberDecimals ?? 2}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  numberDecimals: Number(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">
              Separador decimal
            </span>
            <select
              value={form.numberDecimalSep ?? ','}
              onChange={(e) =>
                setForm((p) => ({ ...p, numberDecimalSep: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value=",">vírgula (,)</option>
              <option value=".">ponto (.)</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">
              Separador de milhar
            </span>
            <select
              value={form.numberThousandSep ?? '.'}
              onChange={(e) =>
                setForm((p) => ({ ...p, numberThousandSep: e.target.value }))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value=".">ponto (.)</option>
              <option value=",">vírgula (,)</option>
              <option value=" ">espaço ( )</option>
              <option value="">nenhum</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Itens por página</span>
            <input
              type="number"
              min={10}
              max={500}
              step={10}
              value={form.defaultPageSize ?? 50}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  defaultPageSize: Number(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
        </div>

        <div className="bg-slate-50 border rounded p-3 text-xs space-y-1">
          <div>
            <span className="font-medium text-slate-600">
              Pré-visualização moeda:
            </span>{' '}
            <span className="font-mono">{sample}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">
              Pré-visualização data/hora:
            </span>{' '}
            <span className="font-mono">{sampleDate}</span>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Calendário e Ano Fiscal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Início da semana</span>
            <select
              value={form.weekStartsOn ?? 0}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  weekStartsOn: Number(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {WEEK_DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">
              Mês de início do ano fiscal
            </span>
            <select
              value={form.fiscalYearStartMonth ?? 1}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  fiscalYearStartMonth: Number(e.target.value),
                }))
              }
              className="w-full border rounded px-3 py-2"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          WhatsApp da empresa
        </h2>
        <p className="text-xs text-slate-500 -mt-2">
          Usado pelo sistema para gerar links wa.me. O envio acontece pelo
          WhatsApp Web/app — basta clicar e enviar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Número (com DDI)</span>
            <input
              type="text"
              placeholder="Ex.: 5571999998888"
              value={form.companyWhatsappNumber ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  companyWhatsappNumber: e.target.value,
                }))
              }
              className="w-full border rounded px-3 py-2 font-mono"
            />
            <span className="block mt-1 text-xs text-slate-400">
              Apenas dígitos. Ex.: 55 (Brasil) + 71 (DDD) + número
            </span>
          </label>

          <label className="text-sm">
            <span className="block mb-1 text-slate-600">Nome de exibição</span>
            <input
              type="text"
              placeholder="Ex.: JC Concreto"
              value={form.companyWhatsappName ?? ''}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  companyWhatsappName: e.target.value,
                }))
              }
              className="w-full border rounded px-3 py-2"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar parâmetros
        </button>
      </div>
    </form>
  );
}
