import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  CloudCog,
  Download,
  Loader2,
  LogOut,
  MessageCircle,
  Phone,
  Power,
  RefreshCcw,
  Search,
  Send,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  CONNECT_WHATSAPP,
  DISCONNECT_WHATSAPP,
  GET_WHATSAPP_CONVERSATIONS,
  GET_WHATSAPP_MESSAGES,
  GET_WHATSAPP_SESSION,
  MARK_WHATSAPP_CONVERSATION_READ,
  RECONFIGURE_WHATSAPP_WEBHOOK,
  SEND_WHATSAPP_MESSAGE,
  SYNC_WHATSAPP_FROM_EVOLUTION,
} from '../../graphql/queries/whatsapp-session';

type SessionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_PENDING'
  | 'CONNECTED'
  | 'ERROR';

interface Session {
  id: string;
  status: SessionStatus;
  qrCode: string | null;
  phone: string | null;
  profileName: string | null;
  lastError: string | null;
  connectedAt: string | null;
  lastSeenAt: string | null;
}

interface Conversation {
  peerNumber: string;
  peerName: string | null;
  customerId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  totalMessages: number;
}

interface Message {
  id: string;
  peerNumber: string;
  fromMe: boolean;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  externalId: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return fmtTime(iso);
  const ms = now.getTime() - d.getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyWhatsappFormatting(body: string): string {
  const escaped = escapeHtml(body);
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<del>$1</del>')
    .replace(/\n/g, '<br/>');
}

function formatPhone(p: string): string {
  const digits = p.replace(/\D+/g, '');
  if (digits.length === 13)
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  if (digits.length === 12)
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return digits;
}

function getInitials(name: string | null, fallback: string): string {
  const src = (name && name.trim()) || fallback;
  const parts = src.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StatusIndicator({ status }: { status: SessionStatus }) {
  const map: Record<
    SessionStatus,
    { label: string; color: string; Icon: typeof Wifi }
  > = {
    DISCONNECTED: {
      label: 'Desconectado',
      color: 'text-rose-600',
      Icon: WifiOff,
    },
    CONNECTING: {
      label: 'Conectando...',
      color: 'text-amber-600',
      Icon: Loader2,
    },
    QR_PENDING: {
      label: 'Aguardando QR',
      color: 'text-amber-600',
      Icon: Smartphone,
    },
    CONNECTED: { label: 'Conectado', color: 'text-emerald-600', Icon: Wifi },
    ERROR: { label: 'Erro', color: 'text-rose-700', Icon: AlertTriangle },
  };
  const { label, color, Icon } = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${color}`}>
      <Icon
        className={`w-3.5 h-3.5 ${status === 'CONNECTING' ? 'animate-spin' : ''}`}
      />
      {label}
    </span>
  );
}

function QrConnectScreen({
  session,
  onConnect,
  loading,
}: {
  session: Session;
  onConnect: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white border rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl font-['Rajdhani'] font-bold mb-2">
          Conectar WhatsApp
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Conecte o WhatsApp da empresa via Evolution API. As conversas
          aparecerão dentro do sistema.
        </p>

        {session.qrCode ? (
          <div className="space-y-4">
            <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 inline-block">
              <img
                src={session.qrCode}
                alt="QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>
            <ol className="text-left text-sm text-slate-700 space-y-1.5 bg-slate-50 rounded-lg p-4">
              <li>
                <strong>1.</strong> Abra o WhatsApp no celular
              </li>
              <li>
                <strong>2.</strong> Toque em <b>Mais opções</b> ou
                <b> Configurações</b>
              </li>
              <li>
                <strong>3.</strong> Toque em <b>Aparelhos conectados</b>
              </li>
              <li>
                <strong>4.</strong> Toque em <b>Conectar um aparelho</b> e
                escaneie o QR
              </li>
            </ol>
            <button
              onClick={onConnect}
              disabled={loading}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCcw className="w-3 h-3" />
              Atualizar QR
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-emerald-700 disabled:opacity-50 shadow"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Power className="w-5 h-5" />
            )}
            Iniciar conexão
          </button>
        )}

        {session.lastError && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded">
            {session.lastError}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const time = fmtTime(message.createdAt);
  if (message.fromMe) {
    return (
      <div className="flex justify-end mb-1.5">
        <div className="max-w-[70%] rounded-lg rounded-tr-sm px-3 py-2 bg-emerald-100 shadow-sm relative">
          <div
            className="text-sm text-slate-900 break-words"
            dangerouslySetInnerHTML={{
              __html: applyWhatsappFormatting(message.body),
            }}
          />
          <div className="text-[10px] text-slate-500 text-right mt-0.5 flex items-center justify-end gap-1">
            {time}
            <CheckCheck
              className={`w-3.5 h-3.5 ${
                message.status === 'READ'
                  ? 'text-blue-500'
                  : message.status === 'DELIVERED'
                    ? 'text-slate-500'
                    : 'text-slate-400'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-1.5">
      <div className="max-w-[70%] rounded-lg rounded-tl-sm px-3 py-2 bg-white shadow-sm">
        <div
          className="text-sm text-slate-900 break-words"
          dangerouslySetInnerHTML={{
            __html: applyWhatsappFormatting(message.body),
          }}
        />
        <div className="text-[10px] text-slate-400 text-right mt-0.5">
          {time}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({
  session,
  peer,
  onBack,
}: {
  session: Session;
  peer: Conversation;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery<{ whatsappMessages: Message[] }>(
    GET_WHATSAPP_MESSAGES,
    {
      variables: { peerNumber: peer.peerNumber, limit: 200 },
      pollInterval: 4000,
      fetchPolicy: 'cache-and-network',
    },
  );

  const [send, { loading: sending }] = useMutation(SEND_WHATSAPP_MESSAGE);
  const [markRead] = useMutation(MARK_WHATSAPP_CONVERSATION_READ);

  const messages = data?.whatsappMessages ?? [];

  useEffect(() => {
    if (peer.unreadCount > 0) {
      markRead({ variables: { peerNumber: peer.peerNumber } });
    }
  }, [peer.peerNumber, peer.unreadCount, markRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (session.status !== 'CONNECTED') {
      alert('WhatsApp desconectado. Reconecte para enviar mensagens.');
      return;
    }
    try {
      await send({
        variables: {
          to: peer.peerNumber,
          body: text,
          customerId: peer.customerId ?? undefined,
        },
      });
      setDraft('');
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#e5ddd5] min-h-0">
      <div className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={onBack}
          className="md:hidden p-1 hover:bg-white/20 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
          {getInitials(peer.peerName, peer.peerNumber)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {peer.peerName ?? formatPhone(peer.peerNumber)}
          </div>
          <div className="text-[11px] text-emerald-100">
            {formatPhone(peer.peerNumber)} · {peer.totalMessages} mensagens
          </div>
        </div>
        <a
          href={`https://wa.me/${peer.peerNumber.replace(/\D+/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-white/20 rounded"
          title="Abrir no WhatsApp Web"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-sm text-slate-500 bg-white/70 rounded px-4 py-2 backdrop-blur">
              Sem mensagens ainda. Envie a primeira para iniciar a conversa.
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <form
        onSubmit={submit}
        className="bg-slate-100 border-t p-3 flex items-end gap-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder="Digite uma mensagem"
          className="flex-1 resize-none border rounded-2xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 max-h-32"
          style={{ minHeight: '40px' }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim() || session.status !== 'CONNECTED'}
          className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

export function WhatsappPage() {
  const [search, setSearch] = useState('');
  const [activePeer, setActivePeer] = useState<string | null>(null);

  const { data: sessionData, refetch: refetchSession, loading: loadingSession } =
    useQuery<{ whatsappSession: Session }>(GET_WHATSAPP_SESSION, {
      pollInterval: 5000,
      fetchPolicy: 'cache-and-network',
    });

  const { data: convData, refetch: refetchConv } = useQuery<{
    whatsappConversations: Conversation[];
  }>(GET_WHATSAPP_CONVERSATIONS, {
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
    skip: sessionData?.whatsappSession.status !== 'CONNECTED',
  });

  const [connectMut, { loading: connecting }] = useMutation(CONNECT_WHATSAPP);
  const [disconnectMut, { loading: disconnecting }] = useMutation(
    DISCONNECT_WHATSAPP,
  );
  const [reconfigureMut, { loading: reconfiguring }] = useMutation(
    RECONFIGURE_WHATSAPP_WEBHOOK,
  );
  const [syncMut, { loading: syncing }] = useMutation(
    SYNC_WHATSAPP_FROM_EVOLUTION,
  );

  const session = sessionData?.whatsappSession;

  const handleConnect = async () => {
    try {
      await connectMut();
      await refetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Desconectar a sessão WhatsApp atual?')) return;
    try {
      await disconnectMut();
      setActivePeer(null);
      await refetchSession();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReconfigureWebhook = async () => {
    try {
      const res = await reconfigureMut();
      const data = res.data?.reconfigureWhatsappWebhook;
      alert(
        data?.ok
          ? `Webhook reconfigurado!\n\nFormato aceito: ${data.format}\nURL: ${data.webhookUrl}`
          : 'Falha ao reconfigurar.',
      );
    } catch (err) {
      alert(
        `Erro ao reconfigurar webhook:\n${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncMut();
      const count = res.data?.syncWhatsappFromEvolution ?? 0;
      alert(
        `${count} contato(s) importado(s).\n\nObs: o Evolution não envia histórico antigo, apenas a lista de contatos. As mensagens antigas continuam só no celular.`,
      );
      await refetchConv();
    } catch (err) {
      alert(
        `Erro ao sincronizar:\n${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const conversations = convData?.whatsappConversations ?? [];
  const filteredConvs = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.peerName ?? '').toLowerCase().includes(q) ||
        c.peerNumber.includes(q.replace(/\D+/g, '')) ||
        (c.lastMessage ?? '').toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.peerNumber === activePeer) ?? null,
    [conversations, activePeer],
  );

  if (loadingSession && !session) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded">
        Não foi possível carregar a sessão WhatsApp.
      </div>
    );
  }

  const isConnected = session.status === 'CONNECTED';

  return (
    <div className="space-y-3 h-[calc(100vh-7rem)] flex flex-col">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold leading-none">
              WhatsApp Business
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusIndicator status={session.status} />
              {session.phone && (
                <span className="text-xs text-slate-500">
                  {formatPhone(session.phone)}
                </span>
              )}
              {session.profileName && (
                <span className="text-xs text-slate-500">
                  · {session.profileName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetchSession()}
            className="p-2 border rounded hover:bg-slate-50"
            title="Atualizar status"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          {isConnected && (
            <>
              <button
                onClick={handleReconfigureWebhook}
                disabled={reconfiguring}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-amber-200 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-50"
                title="Reconfigurar webhook no Evolution (use se mensagens não estão chegando)"
              >
                {reconfiguring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CloudCog className="w-4 h-4" />
                )}
                Reconfigurar webhook
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50"
                title="Importar contatos existentes do Evolution"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Importar contatos
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-rose-200 text-rose-700 rounded hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                Desconectar
              </button>
            </>
          )}
        </div>
      </header>
      {session.status !== 'CONNECTED' && session.lastError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {session.lastError}
        </div>
      )}

      {!isConnected ? (
        <QrConnectScreen
          session={session}
          onConnect={handleConnect}
          loading={connecting}
        />
      ) : (
        <div className="flex-1 grid md:grid-cols-[320px_1fr] gap-0 border rounded-xl overflow-hidden bg-white shadow-sm min-h-0">
          {/* Sidebar conversas */}
          <aside
            className={`flex flex-col border-r bg-white min-h-0 ${activePeer ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full bg-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  {search ? 'Nada encontrado' : 'Nenhuma conversa ainda'}
                </div>
              ) : (
                filteredConvs.map((c) => {
                  const active = c.peerNumber === activePeer;
                  return (
                    <button
                      key={c.peerNumber}
                      onClick={() => {
                        setActivePeer(c.peerNumber);
                        setTimeout(() => refetchConv(), 500);
                      }}
                      className={`w-full text-left flex items-center gap-3 p-3 border-b hover:bg-slate-50 ${active ? 'bg-emerald-50' : ''}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-semibold shrink-0">
                        {getInitials(c.peerName, c.peerNumber)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">
                            {c.peerName ?? formatPhone(c.peerNumber)}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {fmtRelative(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 truncate">
                            {c.lastMessage ?? '—'}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Painel de chat */}
          <main className={`min-h-0 flex ${!activePeer ? 'hidden md:flex' : 'flex'}`}>
            {activeConv ? (
              <ChatPanel
                session={session}
                peer={activeConv}
                onBack={() => setActivePeer(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
                <div className="text-center max-w-sm p-8">
                  <MessageCircle className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-slate-700">
                    Selecione uma conversa
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Escolha um contato à esquerda para abrir o histórico e
                    enviar mensagens diretamente do sistema.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
