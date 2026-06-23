import { useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GET_ACCOUNTS_PAYABLE } from '../graphql/queries/accounts';
import { UPDATE_ACCOUNT_PAYABLE } from '../graphql/mutations/accounts';
import { AccountPayableData, formatBRL } from '../types/accounts';
import { SnoozeMenu } from '../components/snooze/SnoozeMenu';
import { AgendaAudioWidget } from '../components/agendaAudio/AgendaAudioWidget';
import { QuickCaptureButton } from '../components/quickCapture/QuickCaptureButton';

/**
 * "Foco do Dia" — única tela TDAH-friendly: só mostra as 5 contas mais
 * urgentes + 1 ação possível por linha. Sem tabela densa, sem filtros.
 */
export function FocoDoDiaPage() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useQuery<{ accountsPayable: AccountPayableData[] }>(
    GET_ACCOUNTS_PAYABLE,
    { variables: { status: 'PENDING' }, fetchPolicy: 'cache-and-network' },
  );

  const [markPaid, { loading: paying }] = useMutation(UPDATE_ACCOUNT_PAYABLE, {
    onCompleted: () => {
      toast.success('Pago! Boa, menos uma na lista.');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const focus = useMemo(() => {
    const list = data?.accountsPayable ?? [];
    return [...list]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [data]);

  const today = new Date();

  const urgencyOf = (p: AccountPayableData) => {
    const days = Math.floor((new Date(p.dueDate).getTime() - today.getTime()) / 86_400_000);
    if (p.daysOverdue > 0) return { label: `${p.daysOverdue}d atrasada`, color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300', icon: AlertTriangle };
    if (days <= 0) return { label: 'Hoje', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', icon: Clock };
    if (days === 1) return { label: 'Amanhã', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', icon: Clock };
    return { label: `em ${days} dias`, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Clock };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            Foco do dia
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Só o que importa agora. Resolve esses {focus.length} item(s) e o resto pode esperar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AgendaAudioWidget />
          <QuickCaptureButton />
        </div>
      </div>

      {loading && focus.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : focus.length === 0 ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500 mb-3" />
          <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">Tudo em dia.</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Nenhuma conta pendente. Aproveita.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {focus.map((p) => {
            const u = urgencyOf(p);
            const Icon = u.icon;
            return (
              <li
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition ${p.daysOverdue > 0 ? 'ring-2 ring-red-200 dark:ring-red-900/40' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${u.color}`}>
                        <Icon className="w-3 h-3" />
                        {u.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                      {p.supplierName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{p.description}</p>
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
                      {formatBRL(p.finalAmount ?? p.amount)}
                      {p.interestAccrued > 0 && (
                        <span className="text-xs font-normal text-red-500 ml-2">
                          (+{formatBRL(p.interestAccrued)} juros)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() =>
                        markPaid({
                          variables: { input: { id: p.id, status: 'PAID' } },
                        })
                      }
                      disabled={paying}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition disabled:opacity-60"
                      title="Marcar como paga"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      JÁ PAGUEI
                    </button>
                    <SnoozeMenu accountId={p.id} onSnoozed={() => refetch()} />
                    <button
                      onClick={() => navigate(`/listar-contas-pagas?id=${p.id}`)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:underline text-center"
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {focus.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/listar-contas-pagas')}
            className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
          >
            Ver todas as contas →
          </button>
        </div>
      )}
    </div>
  );
}
