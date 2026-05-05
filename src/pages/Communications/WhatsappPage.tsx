import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  Clock,
  CloudCog,
  Download,
  History,
  Inbox,
  Loader2,
  LogOut,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Send,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Link2,
  Link2Off,
  Smile,
  Sparkles,
  User,
  Users,
  UserPlus,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  CONNECT_WHATSAPP,
  DISCONNECT_WHATSAPP,
  GET_WHATSAPP_CONTACT,
  GET_WHATSAPP_CONVERSATIONS,
  GET_WHATSAPP_MESSAGES,
  GET_WHATSAPP_SESSION,
  LINK_CUSTOMER_TO_WHATSAPP_CONTACT,
  MARK_WHATSAPP_CONVERSATION_READ,
  RECONFIGURE_WHATSAPP_WEBHOOK,
  SEARCH_CUSTOMERS_FOR_LINK,
  SEND_WHATSAPP_MESSAGE,
  SYNC_WHATSAPP_FROM_EVOLUTION,
  SYNC_WHATSAPP_MESSAGES_FOR_PEER,
  UNLINK_CUSTOMER_FROM_WHATSAPP_CONTACT,
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
  profilePicUrl: string | null;
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
  isGroup: boolean;
}

interface Message {
  id: string;
  peerNumber: string;
  fromMe: boolean;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  externalId: string | null;
  participantNumber: string | null;
  participantName: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════

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
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Ontem';
  const ms = now.getTime() - d.getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 7) {
    return d.toLocaleDateString('pt-BR', { weekday: 'long' }).slice(0, 3);
  }
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'HOJE';
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'ONTEM';
  return d
    .toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
    .toUpperCase();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyWhatsappFormatting(body: string): string {
  return escapeHtml(body)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<del>$1</del>')
    .replace(/```([^`]+)```/g, '<code class="bg-slate-100 px-1 rounded">$1</code>')
    .replace(/\n/g, '<br/>');
}

function formatPhone(p: string): string {
  const d = p.replace(/\D+/g, '');
  if (d.length === 13)
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12)
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

function getInitials(name: string | null, fallback: string): string {
  const src = (name && name.trim()) || fallback;
  const parts = src.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-emerald-400 to-emerald-600',
  'from-blue-400 to-blue-600',
  'from-violet-400 to-violet-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-teal-400 to-cyan-600',
  'from-indigo-400 to-purple-600',
  'from-lime-400 to-green-600',
];

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function Avatar({
  name,
  seed,
  size = 'md',
  isGroup = false,
}: {
  name: string | null;
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isGroup?: boolean;
}) {
  const dims = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-2xl',
  }[size];
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6', xl: 'w-9 h-9' };
  if (isGroup) {
    return (
      <div
        className={`${dims} rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center shadow-sm shrink-0`}
      >
        <Users className={iconSizes[size]} />
      </div>
    );
  }
  return (
    <div
      className={`${dims} rounded-full bg-gradient-to-br ${gradientFor(seed)} text-white flex items-center justify-center font-semibold shadow-sm shrink-0`}
    >
      {getInitials(name, seed)}
    </div>
  );
}

function displayPeer(c: { peerNumber: string; peerName: string | null; isGroup: boolean }): string {
  if (c.peerName && c.peerName.trim().length > 0) return c.peerName;
  if (c.isGroup) return 'Grupo do WhatsApp';
  return formatPhone(c.peerNumber);
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const map: Record<
    SessionStatus,
    { label: string; bg: string; text: string; Icon: typeof Wifi; spin?: boolean }
  > = {
    DISCONNECTED: {
      label: 'Desconectado',
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      Icon: WifiOff,
    },
    CONNECTING: {
      label: 'Conectando',
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      Icon: Loader2,
      spin: true,
    },
    QR_PENDING: {
      label: 'Aguardando QR',
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      Icon: Clock,
    },
    CONNECTED: {
      label: 'Online',
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      Icon: Wifi,
    },
    ERROR: {
      label: 'Erro',
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      Icon: AlertTriangle,
    },
  };
  const { label, bg, text, Icon, spin } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${bg} ${text}`}
    >
      <Icon className={`w-3 h-3 ${spin ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// QR Code (onboarding)
// ════════════════════════════════════════════════════════════

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
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl grid md:grid-cols-2 gap-8 bg-white border rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-['Rajdhani'] font-bold leading-tight">
              Conecte o WhatsApp da empresa
            </h2>
            <p className="text-sm text-emerald-50 mt-3 leading-relaxed">
              Atenda clientes, dispare boletos e organize conversas direto pelo
              sistema. Funciona como o WhatsApp Web — escaneie o QR e pronto.
            </p>
          </div>
          <ol className="space-y-3 text-sm mt-8">
            {[
              'Abra o WhatsApp no celular',
              'Toque em Configurações ou ⋮',
              'Selecione "Aparelhos conectados"',
              'Toque em "Conectar um aparelho" e escaneie',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold shrink-0">
                  {i + 1}
                </span>
                <span className="text-emerald-50">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-8 flex flex-col items-center justify-center">
          {session.qrCode ? (
            <>
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-emerald-200 to-emerald-400 rounded-2xl blur-xl opacity-30" />
                <div className="relative bg-white border-2 border-emerald-200 rounded-2xl p-3 shadow-lg">
                  <img
                    src={session.qrCode}
                    alt="QR Code"
                    className="w-60 h-60"
                  />
                </div>
              </div>
              <button
                onClick={onConnect}
                disabled={loading}
                className="mt-6 flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar QR Code
              </button>
              <p className="text-xs text-slate-400 mt-2">
                O QR é descartado após o pareamento
              </p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <Power className="w-14 h-14 text-emerald-500" />
              </div>
              <button
                onClick={onConnect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-medium hover:from-emerald-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-shadow"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Power className="w-5 h-5" />
                )}
                Iniciar conexão
              </button>
              <p className="text-xs text-slate-500 text-center mt-4">
                Após clicar, um QR Code aparecerá aqui
              </p>
            </>
          )}

          {session.lastError && (
            <div className="mt-6 w-full bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{session.lastError}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Empty state (conectado mas sem conversas)
// ════════════════════════════════════════════════════════════

function ConnectedEmptyState({
  onSync,
  onReconfigure,
  syncing,
  reconfiguring,
}: {
  onSync: () => void;
  onReconfigure: () => void;
  syncing: boolean;
  reconfiguring: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50"
    >
      <div className="max-w-md w-full text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl opacity-50" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
            <Inbox className="w-11 h-11 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-['Rajdhani'] font-bold text-slate-800">
          Caixa de entrada vazia
        </h2>
        <p className="text-sm text-slate-600 mt-2 mb-8">
          Conectado, mas ainda sem conversas. O WhatsApp não envia histórico
          completo automaticamente. Você pode importar os contatos existentes
          ou aguardar mensagens novas.
        </p>

        <div className="grid gap-3 text-left">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-emerald-300 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              {syncing ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-slate-800">
                Importar contatos do WhatsApp
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Traz a lista de chats existentes (sem mensagens antigas)
              </div>
            </div>
          </button>

          <button
            onClick={onReconfigure}
            disabled={reconfiguring}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-amber-300 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              {reconfiguring ? (
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              ) : (
                <CloudCog className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-slate-800">
                Reconfigurar webhook
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Use se mensagens novas não estão chegando ao sistema
              </div>
            </div>
          </button>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed text-left">
              <strong className="block mb-1">Dica:</strong>
              Mensagens novas chegando agora são captadas 100%. O histórico
              antigo permanece só no celular — limitação do WhatsApp Multi-Device.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Bubbles + grupos por data
// ════════════════════════════════════════════════════════════

function MessageBubble({
  message,
  showSender,
}: {
  message: Message;
  showSender?: boolean;
}) {
  const time = fmtTime(message.createdAt);
  const isFailed = message.status === 'FAILED';
  const senderLabel =
    showSender && !message.fromMe
      ? message.participantName ??
        (message.participantNumber
          ? formatPhone(message.participantNumber)
          : null)
      : null;

  if (message.fromMe) {
    return (
      <div className="flex justify-end mb-1.5">
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className={`max-w-[78%] md:max-w-[60%] rounded-xl rounded-tr-sm px-3 pt-2 pb-1.5 shadow-sm relative ${
            isFailed
              ? 'bg-rose-100 border border-rose-200'
              : 'bg-[#d9fdd3]'
          }`}
        >
          <div
            className="text-sm text-slate-900 break-words whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: applyWhatsappFormatting(message.body),
            }}
          />
          <div className="text-[10px] text-slate-500 text-right mt-0.5 flex items-center justify-end gap-1">
            {time}
            {isFailed ? (
              <AlertTriangle className="w-3 h-3 text-rose-600" />
            ) : (
              <CheckCheck
                className={`w-3.5 h-3.5 ${
                  message.status === 'READ'
                    ? 'text-blue-500'
                    : message.status === 'DELIVERED'
                      ? 'text-slate-500'
                      : 'text-slate-400'
                }`}
              />
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-1.5">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="max-w-[78%] md:max-w-[60%] rounded-xl rounded-tl-sm px-3 pt-2 pb-1.5 bg-white shadow-sm"
      >
        {senderLabel && (
          <div
            className={`text-[11px] font-semibold mb-0.5 ${gradientFor(senderLabel).includes('emerald') ? 'text-emerald-600' : 'text-violet-600'}`}
            style={{
              color: `hsl(${
                Array.from(senderLabel).reduce(
                  (h, c) => c.charCodeAt(0) + ((h << 5) - h),
                  0,
                ) % 360
              }, 65%, 40%)`,
            }}
          >
            {senderLabel}
          </div>
        )}
        <div
          className="text-sm text-slate-900 break-words whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: applyWhatsappFormatting(message.body),
          }}
        />
        <div className="text-[10px] text-slate-400 text-right mt-0.5">
          {time}
        </div>
      </motion.div>
    </div>
  );
}

function DateSeparator({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center my-3">
      <div className="bg-white/80 backdrop-blur-sm text-slate-600 text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm">
        {children}
      </div>
    </div>
  );
}

function groupByDay(messages: Message[]): Array<{ key: string; items: Message[] }> {
  const groups: Array<{ key: string; items: Message[] }> = [];
  for (const m of messages) {
    const key = new Date(m.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(m);
    } else {
      groups.push({ key, items: [m] });
    }
  }
  return groups;
}

// ════════════════════════════════════════════════════════════
// Drawer de detalhes do contato
// ════════════════════════════════════════════════════════════

interface ContactDetails {
  peerNumber: string;
  displayName: string;
  phoneFormatted: string | null;
  isGroup: boolean;
  profilePicUrl: string | null;
  about: string | null;
  isBusiness: boolean;
  verifiedName: string | null;
  businessCategory: string | null;
  businessDescription: string | null;
  customerId: string | null;
  customerName: string | null;
  totalMessages: number;
  inboundCount: number;
  outboundCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  waLink: string;
}

interface CustomerOption {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
}

function CustomerLinker({
  peerNumber,
  currentSuggestionPhone,
  onLinked,
}: {
  peerNumber: string;
  currentSuggestionPhone: string | null;
  onLinked: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(currentSuggestionPhone ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading } = useQuery<{ customers: CustomerOption[] }>(
    SEARCH_CUSTOMERS_FOR_LINK,
    {
      variables: { search: debouncedSearch || undefined },
      skip: !open,
      fetchPolicy: 'cache-and-network',
    },
  );

  const [linkMut, { loading: linking }] = useMutation(
    LINK_CUSTOMER_TO_WHATSAPP_CONTACT,
  );

  const handleLink = async (customerId: string) => {
    try {
      await linkMut({ variables: { peerNumber, customerId } });
      onLinked();
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-blue-700" />
        </div>
        <div className="flex-1 text-left text-sm">
          <div className="font-medium text-slate-800">
            Vincular cliente existente
          </div>
          <div className="text-xs text-slate-500">
            Buscar e selecionar do cadastro
          </div>
        </div>
      </button>
    );
  }

  const customers = data?.customers ?? [];

  return (
    <div className="bg-white border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          Buscar cliente
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, CPF/CNPJ ou e-mail..."
          className="w-full bg-slate-50 border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="max-h-56 overflow-y-auto space-y-1">
        {loading && customers.length === 0 ? (
          <div className="py-6 text-center">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Nenhum cliente encontrado.
          </div>
        ) : (
          customers.map((c) => (
            <button
              key={c.id}
              onClick={() => handleLink(c.id)}
              disabled={linking}
              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
                {getInitials(c.name, c.id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 truncate">
                  {c.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {c.phone ? formatPhone(c.phone) : c.document ?? c.email ?? ''}
                </div>
              </div>
              {linking && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function fmtFullDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ContactDrawer({
  peer,
  onClose,
}: {
  peer: Conversation;
  onClose: () => void;
}) {
  const { data, loading, refetch } = useQuery<{
    whatsappContact: ContactDetails;
  }>(GET_WHATSAPP_CONTACT, {
    variables: { peerNumber: peer.peerNumber },
    fetchPolicy: 'cache-and-network',
  });
  const [unlinkMut, { loading: unlinking }] = useMutation(
    UNLINK_CUSTOMER_FROM_WHATSAPP_CONTACT,
  );
  const [imgError, setImgError] = useState(false);

  const c = data?.whatsappContact;

  const handleUnlink = async () => {
    if (!window.confirm('Desvincular este cliente da conversa?')) return;
    try {
      await unlinkMut({ variables: { peerNumber: peer.peerNumber } });
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.18 }}
      className="absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white shadow-2xl border-l z-30 flex flex-col"
    >
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Detalhes do contato
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && !c ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : !c ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Não foi possível carregar.
          </div>
        ) : (
          <>
            {/* Cabeçalho com avatar e nome */}
            <div className="bg-gradient-to-b from-slate-50 to-white p-6 text-center border-b">
              {c.profilePicUrl && !imgError ? (
                <div className="relative inline-block">
                  <img
                    src={c.profilePicUrl}
                    alt={c.displayName}
                    onError={() => setImgError(true)}
                    className="w-24 h-24 rounded-full mx-auto shadow-md object-cover ring-4 ring-white"
                  />
                  {c.isBusiness && (
                    <div
                      className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-md"
                      title={c.verifiedName ? 'Conta business verificada' : 'Conta business'}
                    >
                      <BadgeCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto relative">
                  <Avatar
                    name={c.displayName}
                    seed={c.peerNumber}
                    size="xl"
                    isGroup={c.isGroup}
                  />
                  {c.isBusiness && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-md">
                      <BadgeCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              )}
              <h2 className="mt-3 font-bold text-slate-800 text-lg flex items-center justify-center gap-1.5">
                {c.displayName}
                {c.isBusiness && (
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </h2>
              {!c.isGroup && c.phoneFormatted && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {formatPhone(c.phoneFormatted)}
                </p>
              )}
              {c.isGroup && (
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  Grupo
                </span>
              )}
              {c.isBusiness && c.verifiedName && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  Verificado: {c.verifiedName}
                </span>
              )}
              {c.about && (
                <p className="text-xs text-slate-600 mt-3 italic px-3">
                  "{c.about}"
                </p>
              )}
            </div>

            {/* Detalhes Business (se aplicável) */}
            {c.isBusiness &&
              (c.businessCategory || c.businessDescription) && (
                <section className="p-4 bg-emerald-50/40 border-b">
                  <h4 className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Conta Business
                  </h4>
                  {c.businessCategory && (
                    <div className="text-xs mb-1.5">
                      <span className="text-slate-500">Categoria: </span>
                      <span className="text-slate-800 font-medium">
                        {c.businessCategory}
                      </span>
                    </div>
                  )}
                  {c.businessDescription && (
                    <div className="text-xs text-slate-700 leading-relaxed mt-1">
                      {c.businessDescription}
                    </div>
                  )}
                </section>
              )}

            {/* Estatísticas */}
            <section className="p-4 grid grid-cols-3 gap-2 border-b">
              <div className="text-center bg-slate-50 rounded-lg py-2">
                <div className="text-lg font-bold text-slate-800">
                  {c.totalMessages.toLocaleString('pt-BR')}
                </div>
                <div className="text-[10px] uppercase text-slate-500 tracking-wide">
                  Total
                </div>
              </div>
              <div className="text-center bg-blue-50 rounded-lg py-2">
                <div className="text-lg font-bold text-blue-700">
                  {c.inboundCount.toLocaleString('pt-BR')}
                </div>
                <div className="text-[10px] uppercase text-blue-600 tracking-wide">
                  Recebidas
                </div>
              </div>
              <div className="text-center bg-emerald-50 rounded-lg py-2">
                <div className="text-lg font-bold text-emerald-700">
                  {c.outboundCount.toLocaleString('pt-BR')}
                </div>
                <div className="text-[10px] uppercase text-emerald-600 tracking-wide">
                  Enviadas
                </div>
              </div>
            </section>

            {/* Cliente vinculado */}
            <section className="p-4 border-b space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                Cliente vinculado
              </h4>
              {c.customerId ? (
                <>
                  <a
                    href={`/clientes/${c.customerId}`}
                    className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">
                        {c.customerName ?? 'Cliente'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Ver perfil completo →
                      </div>
                    </div>
                  </a>
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {unlinking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Link2Off className="w-3.5 h-3.5" />
                    )}
                    Desvincular cliente
                  </button>
                </>
              ) : (
                <>
                  <CustomerLinker
                    peerNumber={c.peerNumber}
                    currentSuggestionPhone={c.phoneFormatted ?? null}
                    onLinked={() => refetch()}
                  />
                  <a
                    href={`/cadastros?phone=${encodeURIComponent(c.phoneFormatted ?? '')}&name=${encodeURIComponent(c.displayName)}`}
                    className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-medium text-slate-800">
                        Cadastrar como cliente
                      </div>
                      <div className="text-xs text-slate-500">
                        Telefone e nome pré-preenchidos
                      </div>
                    </div>
                  </a>
                </>
              )}
            </section>

            {/* Linha do tempo */}
            <section className="p-4 border-b">
              <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
                Histórico de conversa
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Primeira mensagem</span>
                  <span className="text-slate-700 font-medium">
                    {fmtFullDate(c.firstMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Última mensagem</span>
                  <span className="text-slate-700 font-medium">
                    {fmtFullDate(c.lastMessageAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* Identificadores */}
            <section className="p-4 border-b">
              <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                Identificador WhatsApp
              </h4>
              <div className="font-mono text-[11px] bg-slate-50 rounded-lg p-2 break-all text-slate-600">
                {c.peerNumber}
              </div>
            </section>

            {/* Ações */}
            <section className="p-4 space-y-2">
              {!c.isGroup && c.waLink && (
                <a
                  href={c.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Abrir no WhatsApp Web
                </a>
              )}
            </section>
          </>
        )}
      </div>
    </motion.aside>
  );
}

// ════════════════════════════════════════════════════════════
// Painel de chat
// ════════════════════════════════════════════════════════════

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
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, refetch, loading: loadingMessages } = useQuery<{
    whatsappMessages: Message[];
  }>(GET_WHATSAPP_MESSAGES, {
    variables: { peerNumber: peer.peerNumber, limit: 200 },
    pollInterval: 4000,
    fetchPolicy: 'cache-and-network',
  });

  const [send, { loading: sending }] = useMutation(SEND_WHATSAPP_MESSAGE);
  const [markRead] = useMutation(MARK_WHATSAPP_CONVERSATION_READ);
  const [syncMessages, { loading: syncingHistory }] = useMutation(
    SYNC_WHATSAPP_MESSAGES_FOR_PEER,
  );

  const messages = data?.whatsappMessages ?? [];
  const groups = useMemo(() => groupByDay(messages), [messages]);

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [draft]);

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

  const handleSyncHistory = async () => {
    try {
      const res = await syncMessages({
        variables: { peerNumber: peer.peerNumber, limit: 200 },
      });
      const count = res.data?.syncWhatsappMessagesForPeer ?? 0;
      await refetch();
      setShowMenu(false);
      alert(
        count > 0
          ? `${count} mensagem(ns) antigas importadas.`
          : 'Nenhuma mensagem nova encontrada. O Evolution só consegue trazer o que sincronizou — pode tentar abrir a conversa no celular pra forçar.',
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#efeae2]">
      {/* Background decorativo (similar WhatsApp Web) */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30m-3 0a3 3 0 1 1 6 0a3 3 0 1 1 -6 0' fill='%23128C7E'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header da conversa */}
      <div className="relative z-10 bg-[#f0f2f5] border-b px-4 py-2.5 flex items-center gap-3 shadow-sm">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 hover:bg-slate-200 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-slate-200/50 rounded-lg px-2 -mx-2 py-1 transition-colors"
          title="Ver detalhes do contato"
        >
          <Avatar
            name={peer.peerName}
            seed={peer.peerNumber}
            size="md"
            isGroup={peer.isGroup}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate text-slate-800 leading-tight flex items-center gap-1.5">
              {displayPeer(peer)}
              {peer.isGroup && (
                <span className="text-[10px] font-medium uppercase tracking-wide bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  grupo
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {peer.isGroup
                ? `${peer.totalMessages.toLocaleString('pt-BR')} mensagens · clique para detalhes`
                : `${formatPhone(peer.peerNumber)} · ${peer.totalMessages.toLocaleString('pt-BR')} mensagens`}
            </div>
          </div>
        </button>
        <button
          onClick={handleSyncHistory}
          disabled={syncingHistory}
          className="p-2 hover:bg-slate-200 rounded-full disabled:opacity-50"
          title="Buscar mensagens antigas"
        >
          {syncingHistory ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <History className="w-4 h-4 text-slate-600" />
          )}
        </button>
        <a
          href={`https://wa.me/${peer.peerNumber.replace(/\D+/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-slate-200 rounded-full"
          title="Abrir no WhatsApp Web"
        >
          <Phone className="w-4 h-4 text-slate-600" />
        </a>
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="p-2 hover:bg-slate-200 rounded-full"
          >
            <MoreVertical className="w-4 h-4 text-slate-600" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg w-56 z-20 py-1 text-sm"
              >
                <button
                  onClick={handleSyncHistory}
                  disabled={syncingHistory}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Buscar mensagens antigas
                </button>
                <button
                  onClick={() => {
                    refetch();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Atualizar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-3">
        {loadingMessages && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white/70 backdrop-blur rounded-xl p-6 text-center max-w-sm">
              <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-700 font-medium">
                Sem mensagens nesta conversa
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tente <strong>"Buscar mensagens antigas"</strong> no menu, ou
                envie a primeira mensagem.
              </p>
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key}>
              <DateSeparator>{dateLabel(group.items[0].createdAt)}</DateSeparator>
              {group.items.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  showSender={peer.isGroup}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={submit}
        className="relative z-10 bg-[#f0f2f5] border-t p-3 flex items-end gap-2"
      >
        <button
          type="button"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full"
        >
          <Smile className="w-5 h-5" />
        </button>
        <textarea
          ref={textareaRef}
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
          className="flex-1 resize-none border-0 rounded-2xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 max-h-32"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim() || session.status !== 'CONNECTED'}
          className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 shrink-0 shadow-md hover:shadow-lg transition-shadow"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 -ml-0.5" />
          )}
        </button>
      </form>

      <AnimatePresence>
        {showDetails && (
          <ContactDrawer peer={peer} onClose={() => setShowDetails(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Sidebar
// ════════════════════════════════════════════════════════════

function ConversationsSidebar({
  conversations,
  search,
  setSearch,
  activePeer,
  onSelect,
  hidden,
}: {
  conversations: Conversation[];
  search: string;
  setSearch: (s: string) => void;
  activePeer: string | null;
  onSelect: (peer: string) => void;
  hidden: boolean;
}) {
  return (
    <aside
      className={`flex-col border-r bg-white min-h-0 ${
        hidden ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full bg-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-400 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {search ? 'Nada encontrado' : 'Nenhuma conversa ainda'}
          </div>
        ) : (
          conversations.map((c) => {
            const active = c.peerNumber === activePeer;
            return (
              <button
                key={c.peerNumber}
                onClick={() => onSelect(c.peerNumber)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  active ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                }`}
              >
                <Avatar
                  name={c.peerName}
                  seed={c.peerNumber}
                  size="md"
                  isGroup={c.isGroup}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-semibold truncate text-sm flex items-center gap-1 ${
                        c.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {c.isGroup && (
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      {displayPeer(c)}
                    </span>
                    <span
                      className={`text-[10px] shrink-0 ${
                        c.unreadCount > 0
                          ? 'text-emerald-600 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {fmtRelative(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span
                      className={`text-xs truncate ${
                        c.unreadCount > 0 ? 'text-slate-700' : 'text-slate-500'
                      }`}
                    >
                      {c.lastMessage ?? '—'}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="bg-emerald-500 text-white text-[10px] font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
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
  );
}

// ════════════════════════════════════════════════════════════
// Página principal
// ════════════════════════════════════════════════════════════

export function WhatsappPage() {
  const [search, setSearch] = useState('');
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

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

  const handleReconfigure = async () => {
    try {
      const res = await reconfigureMut();
      const data = res.data?.reconfigureWhatsappWebhook;
      alert(
        data?.ok
          ? `Webhook reconfigurado!\nFormato: ${data.format}\nURL: ${data.webhookUrl}`
          : 'Falha ao reconfigurar.',
      );
      setShowActions(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncMut();
      const count = res.data?.syncWhatsappFromEvolution ?? 0;
      alert(
        count > 0
          ? `${count} contato(s) importado(s).`
          : 'Nenhum contato novo. Pode ser que o Evolution ainda não sincronizou ou já está tudo importado.',
      );
      setShowActions(false);
      await refetchConv();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const conversationsRaw = convData?.whatsappConversations ?? [];
  const filteredConvs = useMemo(() => {
    if (!search) return conversationsRaw;
    const q = search.toLowerCase();
    return conversationsRaw.filter(
      (c) =>
        (c.peerName ?? '').toLowerCase().includes(q) ||
        c.peerNumber.includes(q.replace(/\D+/g, '')) ||
        (c.lastMessage ?? '').toLowerCase().includes(q),
    );
  }, [conversationsRaw, search]);

  const activeConv = useMemo(
    () => conversationsRaw.find((c) => c.peerNumber === activePeer) ?? null,
    [conversationsRaw, activePeer],
  );

  if (loadingSession && !session) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded-lg">
        Não foi possível carregar a sessão WhatsApp.
      </div>
    );
  }

  const isConnected = session.status === 'CONNECTED';
  const hasConversations = conversationsRaw.length > 0;

  return (
    <div className="space-y-3 h-[calc(100vh-7rem)] flex flex-col">
      {/* Header refinado */}
      <header className="flex items-center justify-between flex-wrap gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-['Rajdhani'] font-bold leading-none">
                WhatsApp Business
              </h1>
              <StatusBadge status={session.status} />
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              {session.phone && <span>{formatPhone(session.phone)}</span>}
              {session.profileName && <span>· {session.profileName}</span>}
              {!session.phone && !session.profileName && (
                <span>Conexão via Evolution API</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchSession()}
            className="p-2 border rounded-lg hover:bg-slate-50 transition-colors"
            title="Atualizar status"
          >
            <RefreshCcw className="w-4 h-4 text-slate-600" />
          </button>
          {isConnected && (
            <div className="relative">
              <button
                onClick={() => setShowActions((s) => !s)}
                className="flex items-center gap-1.5 p-2 border rounded-lg hover:bg-slate-50 transition-colors"
                title="Mais ações"
              >
                <MoreVertical className="w-4 h-4 text-slate-600" />
              </button>
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 mt-1 w-60 bg-white border rounded-xl shadow-xl z-30 py-1 text-sm overflow-hidden"
                  >
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Importar contatos</div>
                        <div className="text-xs text-slate-500">
                          Da lista do WhatsApp
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={handleReconfigure}
                      disabled={reconfiguring}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 disabled:opacity-50"
                    >
                      <CloudCog className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium">Reconfigurar webhook</div>
                        <div className="text-xs text-slate-500">
                          Se mensagens não chegam
                        </div>
                      </div>
                    </button>
                    <div className="border-t my-1" />
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="w-full text-left px-3 py-2.5 hover:bg-rose-50 flex items-center gap-2.5 text-rose-700"
                    >
                      <LogOut className="w-4 h-4" />
                      <div className="font-medium">Desconectar sessão</div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {session.lastError && session.status !== 'CONNECTED' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{session.lastError}</span>
        </div>
      )}

      {/* Corpo principal */}
      {!isConnected ? (
        <QrConnectScreen
          session={session}
          onConnect={handleConnect}
          loading={connecting}
        />
      ) : !hasConversations ? (
        <ConnectedEmptyState
          onSync={handleSync}
          onReconfigure={handleReconfigure}
          syncing={syncing}
          reconfiguring={reconfiguring}
        />
      ) : (
        <div className="flex-1 grid md:grid-cols-[340px_1fr] gap-0 border rounded-2xl overflow-hidden bg-white shadow-md min-h-0 relative">
          <ConversationsSidebar
            conversations={filteredConvs}
            search={search}
            setSearch={setSearch}
            activePeer={activePeer}
            onSelect={(peer) => {
              setActivePeer(peer);
              setTimeout(() => refetchConv(), 500);
            }}
            hidden={!!activePeer}
          />

          <main
            className={`relative min-h-0 flex ${
              !activePeer ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConv ? (
              <ChatPanel
                session={session}
                peer={activeConv}
                onBack={() => setActivePeer(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30">
                <div className="text-center max-w-sm p-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-['Rajdhani'] font-bold text-slate-700">
                    Selecione uma conversa
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Escolha um contato à esquerda para abrir o histórico e
                    enviar mensagens diretamente do sistema.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Plus className="w-3.5 h-3.5" />
                    {conversationsRaw.length} conversa(s) carregada(s)
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
