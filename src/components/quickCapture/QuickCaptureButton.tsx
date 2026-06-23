import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Zap, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { QUICK_CAPTURE_ACCOUNT_PAYABLE } from '../../graphql/mutations/accounts';

/**
 * Quick-capture TDAH-friendly: o usuário digita uma frase tipo
 * "pagar Vivo internet 120 sexta" e a IA cria a conta a pagar.
 * Atalho: Ctrl+Shift+P (P de "pagar").
 */
export function QuickCaptureButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [lastCreated, setLastCreated] = useState<{ supplierName: string; amount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [run, { loading }] = useMutation(QUICK_CAPTURE_ACCOUNT_PAYABLE, {
    onCompleted: (data) => {
      const c = data?.quickCaptureAccountPayable;
      setLastCreated({ supplierName: c.supplierName, amount: Number(c.amount) });
      toast.success(`Conta criada: ${c.supplierName} — R$ ${Number(c.amount).toFixed(2)}`);
      setText('');
    },
    onError: (err) => {
      toast.error(err.message || 'Não consegui interpretar o texto.');
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setLastCreated(null);
  }, [open]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    run({ variables: { text: text.trim() } });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Cadastrar conta a pagar por texto (Ctrl+Shift+P)"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition"
      >
        <Zap className="w-3.5 h-3.5" />
        Captura rápida
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Captura rápida — conta a pagar</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Ex: "pagar Vivo internet 120 sexta" ou "boleto da Enel 450 amanhã"'
                disabled={loading}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Atalho: <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">Shift</kbd>+<kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">P</kbd>
                </p>
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {loading ? 'Interpretando...' : 'Criar conta'}
                </button>
              </div>
            </form>

            {lastCreated && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-md text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Criada: <strong>{lastCreated.supplierName}</strong> — R$ {lastCreated.amount.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
