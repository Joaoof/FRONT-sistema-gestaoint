import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Sparkles, X } from 'lucide-react';
import { SUMMARIZE_AGENDA } from '../../graphql/queries/calendar';

type Period = 'DAY' | 'WEEK';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialReferenceDate?: Date | null;
  initialSources?: string[] | null;
}

// Tag custom do dotlottie web component carregado no index.html via CDN
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          autoplay?: boolean;
          loop?: boolean;
          speed?: string | number;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

export function SummaryModal({
  isOpen,
  onClose,
  initialReferenceDate,
  initialSources,
}: Props) {
  const [period, setPeriod] = useState<Period>('DAY');
  const [refDate, setRefDate] = useState(() =>
    (initialReferenceDate ?? new Date()).toISOString().slice(0, 10),
  );
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [run, { loading }] = useMutation(SUMMARIZE_AGENDA);

  const reference = useMemo(() => new Date(refDate + 'T12:00:00'), [refDate]);

  const periodLabel = period === 'DAY' ? 'do dia' : 'da semana';

  const generate = async () => {
    setError(null);
    setResult(null);
    try {
      const r = await run({
        variables: {
          period,
          referenceDate: reference.toISOString(),
          sources: initialSources && initialSources.length > 0 ? initialSources : null,
        },
      });
      setResult(r.data?.summarizeAgenda ?? '');
    } catch (e: any) {
      setError(e?.message ?? 'Não consegui resumir agora.');
    }
  };

  // dispara automaticamente na 1ª abertura
  useEffect(() => {
    if (isOpen && !result && !loading) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // limpa estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        <header className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Resumo da agenda
            </h2>
            <p className="text-xs text-slate-500">
              Resumo executivo {periodLabel} gerado por IA.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-2 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex gap-0.5 bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-white/10">
            {(['DAY', 'WEEK'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setResult(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  period === p
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {p === 'DAY' ? 'Dia' : 'Semana'}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={refDate}
            onChange={(e) => {
              setRefDate(e.target.value);
              setResult(null);
            }}
            className="px-2 py-1 text-xs border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          />
          <button
            onClick={generate}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Resumindo…' : 'Atualizar resumo'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <dotlottie-wc
                src="/Calendar.lottie"
                autoplay
                loop
                style={{ width: 220, height: 220 }}
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center max-w-xs">
                Analisando a agenda {periodLabel} e gerando resumo…
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm text-rose-700 dark:text-rose-300">
              {error}
              <button
                onClick={generate}
                className="ml-2 underline font-medium"
              >
                Tentar de novo
              </button>
            </div>
          ) : result ? (
            <div className="prose-sm">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/10 p-4 m-0">
                {result}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">
              Clique em "Atualizar resumo" pra gerar.
            </div>
          )}
        </div>

        {result && !loading && (
          <footer className="px-5 py-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 bg-slate-50 dark:bg-white/[0.02]">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-md text-xs font-medium border border-slate-200 dark:border-white/10"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copiado!' : 'Copiar texto'}
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-brand-600 text-white rounded-md hover:bg-brand-700 font-semibold"
            >
              Fechar
            </button>
          </footer>
        )}
      </motion.div>
    </div>
  );
}
