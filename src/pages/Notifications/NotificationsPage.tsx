import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  DISMISS_NOTIFICATION,
  GET_NOTIFICATIONS,
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from '../../graphql/queries/notifications';

type NotificationType =
  | 'STOCK_LOW'
  | 'ORDER_PENDING'
  | 'INVOICE_DUE'
  | 'INVOICE_OVERDUE'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'DELIVERY_SCHEDULED'
  | 'DELIVERY_COMPLETED'
  | 'CUSTOM'
  | 'INFO';

type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

interface AppNotification {
  id: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  message: string;
  href: string | null;
  entity: string | null;
  entityId: string | null;
  metadataJson: string | null;
  readAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface NotificationsPage {
  items: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

const TYPE_LABEL: Record<NotificationType, string> = {
  STOCK_LOW: 'Estoque baixo',
  ORDER_PENDING: 'Pedido pendente',
  INVOICE_DUE: 'NF a vencer',
  INVOICE_OVERDUE: 'NF vencida',
  PAYMENT_RECEIVED: 'Pagamento recebido',
  PAYMENT_FAILED: 'Pagamento falhou',
  DELIVERY_SCHEDULED: 'Entrega agendada',
  DELIVERY_COMPLETED: 'Entrega concluída',
  CUSTOM: 'Custom',
  INFO: 'Info',
};

const SEVERITY_COLOR: Record<Severity, string> = {
  INFO: 'bg-blue-50 text-blue-700 border-blue-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

const SEVERITY_DOT: Record<Severity, string> = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-amber-500',
  CRITICAL: 'bg-rose-500',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'' | NotificationType>('');
  const [severity, setSeverity] = useState<'' | Severity>('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');

  const variables = useMemo(
    () => ({
      filter: {
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
        ...(unreadOnly ? { unreadOnly: true } : {}),
        ...(search ? { search } : {}),
        page,
        pageSize: 30,
      },
    }),
    [type, severity, unreadOnly, search, page],
  );

  const { data, loading, error, refetch } = useQuery<{
    notifications: NotificationsPage;
  }>(GET_NOTIFICATIONS, {
    variables,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const [markRead] = useMutation(MARK_NOTIFICATION_READ);
  const [markAllRead, { loading: markingAll }] = useMutation(
    MARK_ALL_NOTIFICATIONS_READ,
  );
  const [dismiss] = useMutation(DISMISS_NOTIFICATION);

  const items = data?.notifications.items ?? [];
  const total = data?.notifications.total ?? 0;
  const unread = data?.notifications.unreadCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  const handleClick = async (n: AppNotification) => {
    if (!n.readAt) {
      await markRead({ variables: { id: n.id } });
      refetch();
    }
    if (n.href) navigate(n.href);
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dismiss({ variables: { id } });
    refetch();
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold flex items-center gap-2">
              Notificações
              {unread > 0 && (
                <span className="bg-rose-600 text-white text-xs rounded-full px-2 py-0.5">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">
              Alertas internos do sistema (estoque, pedidos, pagamentos, entregas).
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await markAllRead();
            refetch();
          }}
          disabled={markingAll || unread === 0}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
        >
          {markingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCheck className="w-4 h-4" />
          )}
          Marcar todas como lidas
        </button>
      </header>

      <section className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Tipo</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as '' | NotificationType);
                setPage(1);
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {(Object.keys(TYPE_LABEL) as NotificationType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Severidade</span>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value as '' | Severity);
                setPage(1);
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Aviso</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Busca</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Título ou mensagem..."
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm pt-5">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
            />
            Apenas não lidas
          </label>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar notificações: {error.message}
        </div>
      )}

      <section className="bg-white border rounded-lg overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma notificação.
          </div>
        ) : (
          <ul>
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 border-b cursor-pointer hover:bg-slate-50 ${
                  n.readAt ? 'opacity-60' : ''
                }`}
              >
                <span
                  className={`w-2 h-2 mt-2 rounded-full shrink-0 ${SEVERITY_DOT[n.severity]}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{n.title}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[n.severity]}`}
                    >
                      {TYPE_LABEL[n.type]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <div className="text-xs text-slate-400 mt-1">
                    {formatDate(n.createdAt)}
                    {n.readAt && ' · lida'}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDismiss(e, n.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  title="Descartar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            Página {page} de {totalPages} · {total} notificação(ões)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-slate-50"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
