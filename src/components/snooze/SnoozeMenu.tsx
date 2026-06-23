import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Clock, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SNOOZE_ACCOUNT_PAYABLE } from '../../graphql/mutations/accounts';

type Preset = 'PLUS_15MIN' | 'PLUS_1H' | 'TOMORROW_9H' | 'PLUS_3D';

const PRESETS: { key: Preset; label: string; hint: string }[] = [
  { key: 'PLUS_15MIN', label: '+15 min', hint: 'me lembra logo' },
  { key: 'PLUS_1H', label: '+1 hora', hint: 'depois do café' },
  { key: 'TOMORROW_9H', label: 'Amanhã 9h', hint: 'fresco no dia seguinte' },
  { key: 'PLUS_3D', label: '+3 dias', hint: 'preciso de tempo' },
];

/**
 * Snooze menu TDAH-friendly: 1 clique no preset, bumpa o dueDate
 * e o aviso é re-disparado na nova janela.
 */
export function SnoozeMenu({
  accountId,
  onSnoozed,
  size = 'sm',
}: {
  accountId: string;
  onSnoozed?: () => void;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const [run, { loading }] = useMutation(SNOOZE_ACCOUNT_PAYABLE, {
    onCompleted: (data) => {
      const newDue = new Date(data.snoozeAccountPayable.dueDate);
      toast.success(`Adiado pra ${newDue.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`);
      setOpen(false);
      onSnoozed?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const sizeCls = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`inline-flex items-center gap-1 ${sizeCls} font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50`}
        title="Adiar lembrete"
      >
        <Clock className="w-3 h-3" />
        Adiar
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-gray-200 dark:border-white/10 z-40 py-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => run({ variables: { id: accountId, preset: p.key } })}
                disabled={loading}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <div className="text-sm font-medium text-slate-900 dark:text-white">{p.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.hint}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
