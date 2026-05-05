import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCcw,
  Search,
  Smartphone,
  X,
} from 'lucide-react';
import { GET_MESSAGE_LOGS } from '../../graphql/queries/message-logs';

type NotificationChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PUSH';
type MessageDirection = 'INBOUND' | 'OUTBOUND';
type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';

interface MessageLog {
  id: string;
  companyId: string;
  channel: NotificationChannel;
  direction: MessageDirection;
  toAddress: string;
  fromAddress: string | null;
  subject: string | null;
  body: string;
  status: MessageStatus;
  externalId: string | null;
  errorMessage: string | null;
  customerId: string | null;
  customerName: string | null;
  templateKey: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

interface MessageLogPage {
  items: MessageLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface FiltersState {
  channel: '' | NotificationChannel;
  status: '' | MessageStatus;
  direction: '' | MessageDirection;
  search: string;
  from: string;
  to: string;
  customerId: string;
  page: number;
  pageSize: number;
}

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  IN_APP: 'In-app',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  PUSH: 'Push',
};

const CHANNEL_COLOR: Record<NotificationChannel, string> = {
  IN_APP: 'bg-slate-100 text-slate-700 border-slate-200',
  EMAIL: 'bg-blue-50 text-blue-700 border-blue-200',
  WHATSAPP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SMS: 'bg-amber-50 text-amber-700 border-amber-200',
  PUSH: 'bg-violet-50 text-violet-700 border-violet-200',
};

const STATUS_LABEL: Record<MessageStatus, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviada',
  DELIVERED: 'Entregue',
  READ: 'Lida',
  FAILED: 'Falha',
};

const STATUS_COLOR: Record<MessageStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  READ: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CHANNELS: NotificationChannel[] = [
  'IN_APP',
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'PUSH',
];

const STATUSES: MessageStatus[] = [
  'PENDING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
];

const initialFilters: FiltersState = {
  channel: '',
  status: '',
  direction: '',
  search: '',
  from: '',
  to: '',
  customerId: '',
  page: 1,
  pageSize: 50,
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ChannelIcon({
  channel,
  className,
}: {
  channel: NotificationChannel;
  className?: string;
}) {
  const cls = className ?? 'w-4 h-4';
  if (channel === 'EMAIL') return <Mail className={cls} />;
  if (channel === 'WHATSAPP') return <MessageCircle className={cls} />;
  if (channel === 'SMS') return <Smartphone className={cls} />;
  if (channel === 'PUSH') return <Bell className={cls} />;
  return <MessageCircle className={cls} />;
}

function snippet(text: string, max = 80): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + '…';
}

interface DetailModalProps {
  log: MessageLog;
  onClose: () => void;
}

function DetailModal({ log, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <ChannelIcon channel={log.channel} className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {log.subject || snippet(log.body, 60) || 'Mensagem'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                <span
                  className={`inline-block px-1.5 py-0.5 text-[10px] rounded border mr-1 ${CHANNEL_COLOR[log.channel]}`}
                >
                  {CHANNEL_LABEL[log.channel]}
                </span>
                <span
                  className={`inline-block px-1.5 py-0.5 text-[10px] rounded border ${STATUS_COLOR[log.status]}`}
                >
                  {STATUS_LABEL[log.status]}
                </span>
                {' · '}
                {log.direction === 'OUTBOUND' ? 'Enviada' : 'Recebida'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto p-6 space-y-4">
          {log.errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
              <strong>Erro:</strong> {log.errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Para</div>
              <div className="font-medium break-all">{log.toAddress}</div>
              {log.customerName && (
                <div className="text-xs text-slate-500">{log.customerName}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-500">De</div>
              <div className="font-medium break-all">
                {log.fromAddress ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Criada em</div>
              <div>{formatDate(log.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Enviada em</div>
              <div>{formatDate(log.sentAt)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Entregue em</div>
              <div>{formatDate(log.deliveredAt)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Lida em</div>
              <div>{formatDate(log.readAt)}</div>
            </div>
            {log.templateKey && (
              <div>
                <div className="text-xs text-slate-500">Template</div>
                <div className="font-mono text-xs">{log.templateKey}</div>
              </div>
            )}
            {log.customerId && (
              <div>
                <div className="text-xs text-slate-500">ID do cliente</div>
                <div className="font-mono text-xs break-all">
                  {log.customerId}
                </div>
              </div>
            )}
            {log.externalId && (
              <div className="md:col-span-2">
                <div className="text-xs text-slate-500">ID externo</div>
                <div className="font-mono text-xs break-all">
                  {log.externalId}
                </div>
              </div>
            )}
          </div>

          {log.subject && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Assunto</div>
              <div className="text-sm font-medium">{log.subject}</div>
            </div>
          )}

          <div>
            <div className="text-xs text-slate-500 mb-1">Corpo</div>
            <div className="bg-slate-50 border rounded p-3 text-sm whitespace-pre-wrap break-words">
              {log.body}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono break-all">
            id: {log.id}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessagesCenterPage() {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [pendingFilters, setPendingFilters] =
    useState<FiltersState>(initialFilters);
  const [selected, setSelected] = useState<MessageLog | null>(null);

  const variables = useMemo(() => {
    const f = filters;
    return {
      filter: {
        ...(f.channel ? { channel: f.channel } : {}),
        ...(f.status ? { status: f.status } : {}),
        ...(f.direction ? { direction: f.direction } : {}),
        ...(f.search ? { search: f.search } : {}),
        ...(f.from ? { from: new Date(f.from).toISOString() } : {}),
        ...(f.to ? { to: new Date(f.to).toISOString() } : {}),
        ...(f.customerId ? { customerId: f.customerId } : {}),
        page: f.page,
        pageSize: f.pageSize,
      },
    };
  }, [filters]);

  const { data, loading, error, refetch } = useQuery<{
    messageLogs: MessageLogPage;
  }>(GET_MESSAGE_LOGS, {
    variables,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const items = data?.messageLogs.items ?? [];
  const total = data?.messageLogs.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  const applyFilters = () => {
    setFilters({ ...pendingFilters, page: 1 });
  };

  const resetFilters = () => {
    setPendingFilters(initialFilters);
    setFilters(initialFilters);
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold">
              Central de Mensagens
            </h1>
            <p className="text-xs text-slate-500">
              Histórico de envios e recebimentos por todos os canais.
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50"
        >
          <RefreshCcw className="w-4 h-4" />
          Atualizar
        </button>
      </header>

      <section className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Canal</span>
            <select
              value={pendingFilters.channel}
              onChange={(e) =>
                setPendingFilters((p) => ({
                  ...p,
                  channel: e.target.value as FiltersState['channel'],
                }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Status</span>
            <select
              value={pendingFilters.status}
              onChange={(e) =>
                setPendingFilters((p) => ({
                  ...p,
                  status: e.target.value as FiltersState['status'],
                }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Direção</span>
            <select
              value={pendingFilters.direction}
              onChange={(e) =>
                setPendingFilters((p) => ({
                  ...p,
                  direction: e.target.value as FiltersState['direction'],
                }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Ambas</option>
              <option value="OUTBOUND">Enviadas</option>
              <option value="INBOUND">Recebidas</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">ID do cliente</span>
            <input
              type="text"
              value={pendingFilters.customerId}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, customerId: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="text-xs lg:col-span-2">
            <span className="block mb-1 text-slate-600">Busca</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Destinatário, assunto ou corpo..."
                value={pendingFilters.search}
                onChange={(e) =>
                  setPendingFilters((p) => ({ ...p, search: e.target.value }))
                }
                className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
              />
            </div>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">De</span>
            <input
              type="datetime-local"
              value={pendingFilters.from}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, from: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Até</span>
            <input
              type="datetime-local"
              value={pendingFilters.to}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, to: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Aplicar
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 border text-sm rounded hover:bg-slate-50"
          >
            Limpar
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar mensagens: {error.message}
        </div>
      )}

      <section className="bg-white border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b text-sm">
          <span className="text-slate-600">
            {loading
              ? 'Carregando...'
              : `${total.toLocaleString('pt-BR')} mensagem(ns)`}
          </span>
          <span className="text-slate-500 text-xs">
            Página {filters.page} de {totalPages}
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma mensagem encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Data/hora</th>
                  <th className="px-3 py-2 font-medium">Canal</th>
                  <th className="px-3 py-2 font-medium">Direção</th>
                  <th className="px-3 py-2 font-medium">Destinatário</th>
                  <th className="px-3 py-2 font-medium">Assunto / mensagem</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(log)}
                  >
                    <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${CHANNEL_COLOR[log.channel]}`}
                      >
                        <ChannelIcon
                          channel={log.channel}
                          className="w-3 h-3"
                        />
                        {CHANNEL_LABEL[log.channel]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {log.direction === 'OUTBOUND' ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-blue-600"
                          title="Enviada"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-emerald-600"
                          title="Recebida"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="font-medium break-all max-w-[220px] truncate">
                        {log.toAddress}
                      </div>
                      {log.customerName && (
                        <div className="text-slate-500 truncate max-w-[220px]">
                          {log.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[360px]">
                      {log.subject ? (
                        <span className="font-medium">
                          {snippet(log.subject, 80)}
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          {snippet(log.body, 80)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded border ${STATUS_COLOR[log.status]}`}
                      >
                        {STATUS_LABEL[log.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-blue-600 text-xs">Detalhes →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
          <button
            onClick={() => goToPage(Math.max(1, filters.page - 1))}
            disabled={filters.page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            {filters.pageSize} por página
          </span>
          <button
            onClick={() => goToPage(Math.min(totalPages, filters.page + 1))}
            disabled={filters.page >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-slate-50"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {selected && (
        <DetailModal log={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
