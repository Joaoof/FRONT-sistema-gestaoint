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
  BadgeCheck,
  Bell,
  Briefcase,
  CheckCheck,
  CheckCircle2,
  Clock,
  CloudCog,
  Download,
  ExternalLink,
  EyeOff,
  Filter,
  History,
  Inbox,
  Info,
  Link2,
  Link2Off,
  Loader2,
  LogOut,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Smile,
  Sparkles,
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
  isHiddenNumber: boolean;
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

type ConvFilter = 'all' | 'unread' | 'groups';

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
  if (sameDay) return 'Hoje';
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
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

// Paleta WhatsApp-style: tons sólidos, sem gradient — mais limpo no Kommo.
const AVATAR_COLORS = [
  '#0ea5e9', // sky
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#ea580c', // orange
  '#ca8a04', // amber
  '#16a34a', // green
  '#0d9488', // teal
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({
  name,
  seed,
  size = 'md',
  isGroup = false,
  online = false,
}: {
  name: string | null;
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isGroup?: boolean;
  online?: boolean;
}) {
  const dims = {
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-12 h-12 text-[16px]',
    xl: 'w-20 h-20 text-[26px]',
  }[size];
  const dotSize = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
  }[size];
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6', xl: 'w-9 h-9' };

  return (
    <div className="relative shrink-0">
      {isGroup ? (
        <div
          className={`${dims} rounded-full bg-[#54656f] text-white flex items-center justify-center`}
        >
          <Users className={iconSizes[size]} />
        </div>
      ) : (
        <div
          className={`${dims} rounded-full text-white flex items-center justify-center font-medium`}
          style={{ backgroundColor: colorFor(seed) }}
        >
          {getInitials(name, seed)}
        </div>
      )}
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${dotSize} rounded-full bg-[#00a884] ring-white`}
          aria-label="online"
        />
      )}
    </div>
  );
}

function displayPeer(c: {
  peerNumber: string;
  peerName: string | null;
  isGroup: boolean;
  isHiddenNumber?: boolean;
}): string {
  if (c.peerName && c.peerName.trim().length > 0) return c.peerName;
  if (c.isGroup) return 'Grupo do WhatsApp';
  if (c.isHiddenNumber) return 'Contato (número oculto)';
  return formatPhone(c.peerNumber);
}

function StatusPill({ status }: { status: SessionStatus }) {
  const map: Record<
    SessionStatus,
    { label: string; bg: string; text: string; dot: string; Icon: typeof Wifi; spin?: boolean }
  > = {
    DISCONNECTED: {
      label: 'Desconectado',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      Icon: WifiOff,
    },
    CONNECTING: {
      label: 'Conectando',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      Icon: Loader2,
      spin: true,
    },
    QR_PENDING: {
      label: 'Aguardando QR',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      Icon: Clock,
    },
    CONNECTED: {
      label: 'Online',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      Icon: Wifi,
    },
    ERROR: {
      label: 'Erro',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      Icon: AlertTriangle,
    },
  };
  const { label, bg, text, dot, Icon, spin } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${bg} ${text} border border-current/10`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${spin ? '' : 'animate-pulse'}`} />
      <Icon className={`w-3 h-3 ${spin ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// WAHA dashboard onboarding
// ════════════════════════════════════════════════════════════

const WAHA_DASHBOARD_URL =
  (import.meta.env.VITE_WAHA_DASHBOARD_URL as string | undefined) ??
  'https://devlikeaprowaha-production-52f4.up.railway.app/dashboard/';

function WahaConnectScreen({
  session,
  onRefresh,
  loading,
}: {
  session: Session;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl grid md:grid-cols-2 gap-0 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-['Rajdhani'] font-bold leading-tight">
              Conecte o WhatsApp da empresa
            </h2>
            <p className="text-sm text-white/80 mt-3 leading-relaxed">
              O pareamento é feito direto no painel do WAHA. Depois de escanear
              o QR por lá, volte aqui e clique em <strong>Atualizar status</strong>.
            </p>
          </div>
          <ol className="space-y-3 text-sm mt-8">
            {[
              'Abra o painel do WAHA pelo botão ao lado',
              'Crie/inicie a sessão chamada "default"',
              'Escaneie o QR no WhatsApp do celular',
              'Aguarde o status ficar WORKING e volte aqui',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold shrink-0">
                  {i + 1}
                </span>
                <span className="text-white/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-8 flex flex-col items-center justify-center bg-slate-50">
          <div className="w-32 h-32 rounded-full bg-brand-50 flex items-center justify-center mb-6 border border-brand-100">
            <ExternalLink className="w-14 h-14 text-brand-600" />
          </div>
          <a
            href={WAHA_DASHBOARD_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-700 to-brand-500 text-white py-3 rounded-xl font-medium hover:from-brand-800 hover:to-brand-600 shadow-lg hover:shadow-xl transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            Abrir painel do WAHA
          </a>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            Já conectei, atualizar status
          </button>
          <p className="text-xs text-slate-500 text-center mt-4">
            A sessão é compartilhada — só precisa parear uma vez.
          </p>

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
      className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-brand-50/40 to-slate-50"
    >
      <div className="max-w-md w-full text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-brand-200 rounded-full blur-2xl opacity-40" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl">
            <Inbox className="w-11 h-11 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-['Rajdhani'] font-bold text-slate-800">
          Caixa de entrada vazia
        </h2>
        <p className="text-sm text-slate-600 mt-2 mb-8">
          Conectado, mas ainda sem conversas. O WhatsApp não envia histórico
          completo automaticamente. Você pode importar contatos ou aguardar
          mensagens novas.
        </p>

        <div className="grid gap-3 text-left">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
              {syncing ? (
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-brand-600" />
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
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
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

          <div className="flex items-start gap-3 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
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
      <div className="flex justify-end mb-1.5 px-2">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={`relative max-w-[78%] md:max-w-[55%] rounded-lg pl-3 pr-2 pt-1.5 pb-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
            isFailed
              ? 'bg-rose-50 border border-rose-200 text-slate-900'
              : 'bg-[#d9fdd3] text-slate-900'
          }`}
        >
          <div
            className="text-[14.2px] break-words whitespace-pre-wrap leading-[19px] pb-3"
            dangerouslySetInnerHTML={{
              __html: applyWhatsappFormatting(message.body),
            }}
          />
          <div
            className={`absolute right-2 bottom-1 flex items-center gap-1 text-[10.5px] ${
              isFailed ? 'text-rose-600' : 'text-[#667781]'
            }`}
          >
            <span>{time}</span>
            {isFailed ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <CheckCheck
                className={`w-[15px] h-[15px] -mb-0.5 ${
                  message.status === 'READ'
                    ? 'text-[#53bdeb]'
                    : message.status === 'DELIVERED'
                      ? 'text-[#667781]'
                      : 'text-[#9aa7ad]'
                }`}
              />
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-1.5 px-2">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        className="relative max-w-[78%] md:max-w-[55%] rounded-lg pl-3 pr-2 pt-1.5 pb-1 bg-white shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
      >
        {senderLabel && (
          <div
            className="text-[12.5px] font-semibold mb-0.5 leading-tight"
            style={{
              color: `hsl(${
                Array.from(senderLabel).reduce(
                  (h, c) => c.charCodeAt(0) + ((h << 5) - h),
                  0,
                ) % 360
              }, 60%, 42%)`,
            }}
          >
            {senderLabel}
          </div>
        )}
        <div
          className="text-[14.2px] text-slate-900 break-words whitespace-pre-wrap leading-[19px] pb-3"
          dangerouslySetInnerHTML={{
            __html: applyWhatsappFormatting(message.body),
          }}
        />
        <div className="absolute right-2 bottom-1 text-[10.5px] text-[#667781]">
          {time}
        </div>
      </motion.div>
    </div>
  );
}

function DateSeparator({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center my-3">
      <div className="bg-[#e1f2fb] text-[#54656f] text-[12.5px] font-medium px-3 py-[5px] rounded-md shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
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
// Customer linker (busca cliente)
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
        className="flex items-center gap-2 w-full p-2.5 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-100"
      >
        <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-brand-700" />
        </div>
        <div className="flex-1 text-left text-sm">
          <div className="font-medium text-slate-800 text-xs">
            Vincular cliente existente
          </div>
          <div className="text-[10px] text-slate-500">
            Buscar e selecionar do cadastro
          </div>
        </div>
      </button>
    );
  }

  const customers = data?.customers ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-2">
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
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-400"
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
              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-brand-50 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
                {getInitials(c.name, c.id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-slate-800 truncate">
                  {c.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {c.phone ? formatPhone(c.phone) : c.document ?? c.email ?? ''}
                </div>
              </div>
              {linking && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
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

// ════════════════════════════════════════════════════════════
// Painel lateral direito (Kommo-style: contato + lead info)
// ════════════════════════════════════════════════════════════

function ContactInfoPanel({
  peer,
  onClose,
  showCloseButton,
}: {
  peer: Conversation;
  onClose: () => void;
  showCloseButton?: boolean;
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
    <div className="h-full bg-white border-l border-slate-200 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-brand-600" />
          Detalhes do contato
        </h3>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
            {/* Header */}
            <div className="p-5 text-center border-b border-slate-100">
              {c.profilePicUrl && !imgError ? (
                <div className="relative inline-block">
                  <img
                    src={c.profilePicUrl}
                    alt={c.displayName}
                    onError={() => setImgError(true)}
                    className="w-20 h-20 rounded-full mx-auto shadow-md object-cover ring-4 ring-slate-100"
                  />
                  {c.isBusiness && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 bg-brand-600 rounded-full p-1 shadow-md ring-2 ring-white"
                      title={c.verifiedName ? 'Conta business verificada' : 'Conta business'}
                    >
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto relative">
                  <Avatar
                    name={c.displayName}
                    seed={c.peerNumber}
                    size="xl"
                    isGroup={c.isGroup}
                  />
                  {c.isBusiness && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-brand-600 rounded-full p-1 shadow-md ring-2 ring-white">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              )}
              <h2 className="mt-3 font-bold text-slate-800 text-base flex items-center justify-center gap-1.5">
                {c.displayName}
                {c.isBusiness && (
                  <BadgeCheck className="w-4 h-4 text-brand-600 shrink-0" />
                )}
              </h2>
              {!c.isGroup && c.phoneFormatted && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatPhone(c.phoneFormatted)}
                </p>
              )}
              {c.isGroup && (
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  Grupo
                </span>
              )}
              {c.isBusiness && c.verifiedName && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  {c.verifiedName}
                </span>
              )}
              {c.about && (
                <p className="text-[11px] text-slate-600 mt-2 italic px-3 leading-snug">
                  "{c.about}"
                </p>
              )}
            </div>

            {/* Business info */}
            {c.isBusiness &&
              (c.businessCategory || c.businessDescription) && (
                <section className="p-4 bg-brand-50/40 border-b border-slate-100">
                  <h4 className="text-[10px] uppercase tracking-wide text-brand-700 font-semibold mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
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

            {/* Stats */}
            <section className="p-4 grid grid-cols-3 gap-2 border-b border-slate-100">
              <div className="text-center bg-slate-50 rounded-lg py-2 border border-slate-100">
                <div className="text-base font-bold text-slate-800">
                  {c.totalMessages.toLocaleString('pt-BR')}
                </div>
                <div className="text-[9px] uppercase text-slate-500 tracking-wide">
                  Total
                </div>
              </div>
              <div className="text-center bg-blue-50 rounded-lg py-2 border border-blue-100">
                <div className="text-base font-bold text-blue-700">
                  {c.inboundCount.toLocaleString('pt-BR')}
                </div>
                <div className="text-[9px] uppercase text-blue-600 tracking-wide">
                  Recebidas
                </div>
              </div>
              <div className="text-center bg-brand-50 rounded-lg py-2 border border-brand-100">
                <div className="text-base font-bold text-brand-700">
                  {c.outboundCount.toLocaleString('pt-BR')}
                </div>
                <div className="text-[9px] uppercase text-brand-600 tracking-wide">
                  Enviadas
                </div>
              </div>
            </section>

            {/* Customer link */}
            <section className="p-4 border-b border-slate-100 space-y-2">
              <h4 className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Cliente vinculado
              </h4>
              {c.customerId ? (
                <>
                  <a
                    href={`/clientes/${c.customerId}`}
                    className="flex items-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-slate-800 truncate">
                        {c.customerName ?? 'Cliente'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Ver perfil completo →
                      </div>
                    </div>
                  </a>
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {unlinking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Link2Off className="w-3.5 h-3.5" />
                    )}
                    Desvincular
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
                    className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-medium text-slate-800">
                        Cadastrar como cliente
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Pré-preenchido com telefone e nome
                      </div>
                    </div>
                  </a>
                </>
              )}
            </section>

            {/* Timeline */}
            <section className="p-4 border-b border-slate-100">
              <h4 className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
                Linha do tempo
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Primeira</span>
                  <span className="text-slate-700 font-medium">
                    {fmtFullDate(c.firstMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Última</span>
                  <span className="text-slate-700 font-medium">
                    {fmtFullDate(c.lastMessageAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* Identifier */}
            <section className="p-4 border-b border-slate-100">
              <h4 className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
                Identificador WhatsApp
              </h4>
              <div className="font-mono text-[10px] bg-slate-50 rounded-lg p-2 break-all text-slate-600 border border-slate-100">
                {c.peerNumber}
              </div>
            </section>

            {/* Actions */}
            <section className="p-4 space-y-2">
              {!c.isGroup && c.waLink && (
                <a
                  href={c.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Abrir no WhatsApp Web
                </a>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Painel de chat
// ════════════════════════════════════════════════════════════

function ChatPanel({
  session,
  peer,
  onBack,
  onToggleInfo,
  infoOpen,
}: {
  session: Session;
  peer: Conversation;
  onBack: () => void;
  onToggleInfo: () => void;
  infoOpen: boolean;
}) {
  const [draft, setDraft] = useState('');
  const [showMenu, setShowMenu] = useState(false);
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

  const messages = useMemo(
    () => data?.whatsappMessages ?? [],
    [data?.whatsappMessages],
  );
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
          : 'Nenhuma mensagem nova encontrada. Pode tentar abrir a conversa no celular para forçar a sincronização.',
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#efeae2] relative">
      {/* Header da conversa — estilo WhatsApp Web */}
      <div className="bg-[#f0f2f5] border-b border-[#d1d7db] px-4 h-[60px] flex items-center gap-3 z-10 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 hover:bg-black/5 rounded-full text-[#54656f]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar
          name={peer.peerName}
          seed={peer.peerNumber}
          size="md"
          isGroup={peer.isGroup}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-[#111b21] leading-tight flex items-center gap-1.5 text-[16px]">
            {displayPeer(peer)}
            {peer.isGroup && (
              <span className="text-[9px] font-medium uppercase tracking-wide bg-[#d9fdd3] text-[#005c4b] px-1.5 py-0.5 rounded">
                grupo
              </span>
            )}
            {peer.isHiddenNumber && !peer.isGroup && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded"
                title="Telefone oculto pela privacidade do WhatsApp."
              >
                <EyeOff className="w-2.5 h-2.5" />
                oculto
              </span>
            )}
          </div>
          <div className="text-[12.5px] text-[#667781] truncate">
            {peer.isGroup
              ? `${peer.totalMessages.toLocaleString('pt-BR')} mensagens`
              : peer.isHiddenNumber
                ? `${peer.totalMessages.toLocaleString('pt-BR')} mensagens`
                : formatPhone(peer.peerNumber)}
          </div>
        </div>

        <button
          onClick={handleSyncHistory}
          disabled={syncingHistory}
          className="p-2 hover:bg-black/5 rounded-full disabled:opacity-50 text-[#54656f]"
          title="Buscar mensagens antigas"
        >
          {syncingHistory ? (
            <Loader2 className="w-[22px] h-[22px] animate-spin" />
          ) : (
            <History className="w-[22px] h-[22px]" />
          )}
        </button>
        <a
          href={`https://wa.me/${peer.peerNumber.replace(/\D+/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-black/5 rounded-full text-[#54656f]"
          title="Abrir no WhatsApp Web"
        >
          <Phone className="w-[22px] h-[22px]" />
        </a>
        <button
          onClick={onToggleInfo}
          className={`p-2 rounded-full text-[#54656f] hover:bg-black/5 lg:hidden ${
            infoOpen ? 'bg-[#d9fdd3] text-[#005c4b] hover:bg-[#bef0b0]' : ''
          }`}
          title="Detalhes do contato"
        >
          <Info className="w-[22px] h-[22px]" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="p-2 hover:bg-black/5 rounded-full text-[#54656f]"
          >
            <MoreVertical className="w-[22px] h-[22px]" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl w-60 z-20 py-1 text-[14.5px]"
              >
                <button
                  onClick={handleSyncHistory}
                  disabled={syncingHistory}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#f0f2f5] flex items-center gap-2 text-[#3b4a54]"
                >
                  <History className="w-4 h-4" />
                  Buscar mensagens antigas
                </button>
                <button
                  onClick={() => {
                    refetch();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#f0f2f5] flex items-center gap-2 text-[#3b4a54]"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Atualizar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mensagens — wallpaper bege WhatsApp Web (#efeae2) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='%23000000' fill-opacity='0.04'><circle cx='30' cy='30' r='1.2'/><circle cx='90' cy='90' r='1.2'/><circle cx='90' cy='30' r='0.8'/><circle cx='30' cy='90' r='0.8'/><path d='M60 50c-2 0-4 1.5-4 4s2 4 4 4 4-1.5 4-4-2-4-4-4zm0 6c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z'/></g></svg>\")",
        }}
      >
        {loadingMessages && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#667781]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-[#fff3c4] text-[#3b4a54] rounded-md px-4 py-3 text-center max-w-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-[13px]">
              <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
              <p className="font-medium">Sem mensagens nesta conversa</p>
              <p className="text-[12px] text-[#667781] mt-1">
                Use <strong>"Buscar mensagens antigas"</strong> no menu, ou envie a primeira mensagem.
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

      {/* Composer — barra cinza-clara estilo WhatsApp Web */}
      <form
        onSubmit={submit}
        className="bg-[#f0f2f5] px-3 py-2.5 flex items-end gap-2 shrink-0"
      >
        <button
          type="button"
          className="p-2 text-[#54656f] hover:text-[#3b4a54] rounded-full"
          title="Emoji"
        >
          <Smile className="w-[24px] h-[24px]" />
        </button>
        <button
          type="button"
          className="p-2 text-[#54656f] hover:text-[#3b4a54] rounded-full"
          title="Anexar"
        >
          <Paperclip className="w-[24px] h-[24px]" />
        </button>
        <div className="flex-1 bg-white rounded-lg flex items-center min-h-[42px] px-4">
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
            placeholder="Mensagem"
            className="flex-1 resize-none border-0 bg-transparent outline-none text-[15px] text-[#111b21] placeholder:text-[#667781] py-2 max-h-32"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !draft.trim() || session.status !== 'CONNECTED'}
          className="w-[42px] h-[42px] rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#06876c] disabled:opacity-40 shrink-0 transition-colors"
          title="Enviar"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 -ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Conversations Sidebar (Kommo-style com filtros)
// ════════════════════════════════════════════════════════════

function ConversationsSidebar({
  conversations,
  search,
  setSearch,
  filter,
  setFilter,
  activePeer,
  onSelect,
  hidden,
  totalUnread,
}: {
  conversations: Conversation[];
  search: string;
  setSearch: (s: string) => void;
  filter: ConvFilter;
  setFilter: (f: ConvFilter) => void;
  activePeer: string | null;
  onSelect: (peer: string) => void;
  hidden: boolean;
  totalUnread: number;
}) {
  const groupCount = conversations.filter((c) => c.isGroup).length;

  return (
    <aside
      className={`flex-col bg-white border-r border-[#d1d7db] min-h-0 ${
        hidden ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Search bar pill — estilo WhatsApp Web */}
      <div className="px-3 py-2 bg-white">
        <div className="relative">
          <Search className="absolute left-4 top-[10px] w-[18px] h-[18px] text-[#54656f]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar uma conversa"
            className="w-full bg-[#f0f2f5] rounded-lg pl-12 pr-3 py-2 text-[14px] text-[#111b21] placeholder:text-[#667781] focus:outline-none border-0"
          />
        </div>
      </div>

      {/* Filter chips horizontais — Kommo-style */}
      <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto bg-white border-b border-[#e9edef]">
        <button
          onClick={() => setFilter('all')}
          className={`text-[13px] font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap shrink-0 ${
            filter === 'all'
              ? 'bg-[#d9fdd3] text-[#005c4b]'
              : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`text-[13px] font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-[#d9fdd3] text-[#005c4b]'
              : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
          }`}
        >
          Não lidas
          {totalUnread > 0 && (
            <span
              className={`text-[10px] px-1.5 rounded-full font-semibold ${
                filter === 'unread'
                  ? 'bg-[#005c4b] text-white'
                  : 'bg-[#00a884] text-white'
              }`}
            >
              {totalUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('groups')}
          className={`text-[13px] font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
            filter === 'groups'
              ? 'bg-[#d9fdd3] text-[#005c4b]'
              : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]'
          }`}
        >
          Grupos
          {groupCount > 0 && (
            <span
              className={`text-[10px] px-1.5 rounded-full font-semibold ${
                filter === 'groups'
                  ? 'bg-[#005c4b] text-white'
                  : 'bg-[#cfd5d9] text-[#3b4a54]'
              }`}
            >
              {groupCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {conversations.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f0f2f5] mx-auto flex items-center justify-center mb-3">
              <Filter className="w-5 h-5 text-[#54656f]" />
            </div>
            <p className="text-[14px] text-[#667781]">
              {search ? 'Nada encontrado' : 'Nenhuma conversa'}
            </p>
          </div>
        ) : (
          conversations.map((c) => {
            const active = c.peerNumber === activePeer;
            return (
              <button
                key={c.peerNumber}
                onClick={() => onSelect(c.peerNumber)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 transition-colors border-b border-[#e9edef] last:border-b-0 ${
                  active ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                }`}
              >
                <Avatar
                  name={c.peerName}
                  seed={c.peerNumber}
                  size="lg"
                  isGroup={c.isGroup}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-[16px] flex items-center gap-1 text-[#111b21] ${
                        c.unreadCount > 0 ? 'font-semibold' : 'font-normal'
                      }`}
                    >
                      {c.isHiddenNumber && !c.isGroup && (
                        <EyeOff
                          className="w-3 h-3 text-[#8696a0] shrink-0"
                          aria-label="Número oculto"
                        />
                      )}
                      {displayPeer(c)}
                    </span>
                    <span
                      className={`text-[12px] shrink-0 ${
                        c.unreadCount > 0
                          ? 'text-[#00a884] font-medium'
                          : 'text-[#667781]'
                      }`}
                    >
                      {fmtRelative(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span
                      className={`text-[14px] truncate ${
                        c.unreadCount > 0
                          ? 'text-[#3b4a54]'
                          : 'text-[#667781]'
                      }`}
                    >
                      {c.lastMessage ?? '—'}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="bg-[#00a884] text-white text-[12px] font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
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
  const [filter, setFilter] = useState<ConvFilter>('all');
  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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
          : 'Nenhum contato novo. Pode ser que o WAHA ainda não sincronizou ou tudo já está importado.',
      );
      setShowActions(false);
      await refetchConv();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const conversationsRaw = useMemo(
    () => convData?.whatsappConversations ?? [],
    [convData?.whatsappConversations],
  );
  const totalUnread = useMemo(
    () => conversationsRaw.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversationsRaw],
  );

  const filteredConvs = useMemo(() => {
    let list = conversationsRaw;
    if (filter === 'unread') list = list.filter((c) => c.unreadCount > 0);
    if (filter === 'groups') list = list.filter((c) => c.isGroup);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.peerName ?? '').toLowerCase().includes(q) ||
          c.peerNumber.includes(q.replace(/\D+/g, '')) ||
          (c.lastMessage ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [conversationsRaw, search, filter]);

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
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-[#f0f2f5]">
      {/* Header — barra fina sobre o painel, estilo Kommo */}
      <header className="flex items-center justify-between gap-3 bg-white border-b border-[#d1d7db] px-4 h-[60px] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-semibold leading-none text-[#111b21] truncate">
                WhatsApp
              </h1>
              <StatusPill status={session.status} />
            </div>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-[#667781] truncate">
              {session.phone && (
                <span className="font-medium">{formatPhone(session.phone)}</span>
              )}
              {session.profileName && <span>· {session.profileName}</span>}
              {!session.phone && !session.profileName && (
                <span>Conexão via WAHA API</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isConnected && totalUnread > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d9fdd3] text-[#005c4b] text-[12px] font-medium mr-1">
              <Bell className="w-3 h-3" />
              {totalUnread} não lida{totalUnread > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => refetchSession()}
            className="p-2 hover:bg-black/5 rounded-full text-[#54656f]"
            title="Atualizar status"
          >
            <RefreshCcw className="w-[20px] h-[20px]" />
          </button>
          {isConnected && (
            <div className="relative">
              <button
                onClick={() => setShowActions((s) => !s)}
                className="p-2 hover:bg-black/5 rounded-full text-[#54656f]"
                title="Mais ações"
              >
                <MoreVertical className="w-[20px] h-[20px]" />
              </button>
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl z-30 py-1 text-[14px] overflow-hidden"
                  >
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#f0f2f5] flex items-center gap-3 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-[#00a884]" />
                      <div>
                        <div className="font-medium text-[#111b21]">
                          Importar contatos
                        </div>
                        <div className="text-[12px] text-[#667781]">
                          Da lista do WhatsApp
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={handleReconfigure}
                      disabled={reconfiguring}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#f0f2f5] flex items-center gap-3 disabled:opacity-50"
                    >
                      <CloudCog className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-[#111b21]">
                          Reconfigurar webhook
                        </div>
                        <div className="text-[12px] text-[#667781]">
                          Se mensagens não chegam
                        </div>
                      </div>
                    </button>
                    <div className="border-t border-[#e9edef] my-1" />
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 flex items-center gap-3 text-rose-700"
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

      {/* Corpo */}
      {!isConnected ? (
        <WahaConnectScreen
          session={session}
          onRefresh={handleConnect}
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
        <div className="flex-1 grid md:grid-cols-[360px_1fr] lg:grid-cols-[360px_1fr_360px] gap-0 bg-white min-h-0 relative">
          <ConversationsSidebar
            conversations={filteredConvs}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            activePeer={activePeer}
            onSelect={(peer) => {
              setActivePeer(peer);
              setShowInfo(false);
              setTimeout(() => refetchConv(), 500);
            }}
            hidden={!!activePeer}
            totalUnread={totalUnread}
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
                onToggleInfo={() => setShowInfo((s) => !s)}
                infoOpen={showInfo}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] border-l border-[#d1d7db]">
                <div className="text-center max-w-md px-10">
                  <div className="w-44 h-44 rounded-full bg-[#e9edef] mx-auto flex items-center justify-center mb-6">
                    <MessageCircle className="w-20 h-20 text-[#54656f]" strokeWidth={1.2} />
                  </div>
                  <h2 className="text-[28px] font-light text-[#41525d] tracking-tight">
                    Mantenha seu WhatsApp conectado
                  </h2>
                  <p className="text-[14px] text-[#667781] mt-3 leading-relaxed">
                    Selecione uma conversa à esquerda para abrir o histórico e enviar mensagens.
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-[#8696a0]">
                    <Plus className="w-3.5 h-3.5" />
                    {conversationsRaw.length} conversa(s) carregada(s)
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Info panel — sempre visível em lg+; slide-over em telas menores */}
          {activeConv && (
            <>
              <div className="hidden lg:block">
                <ContactInfoPanel
                  peer={activeConv}
                  onClose={() => setShowInfo(false)}
                />
              </div>
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    key="info-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:hidden absolute inset-0 z-30 bg-slate-900/30 backdrop-blur-sm"
                    onClick={() => setShowInfo(false)}
                  />
                )}
                {showInfo && (
                  <motion.aside
                    key="info-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.22 }}
                    className="lg:hidden absolute right-0 top-0 h-full w-full sm:w-[360px] z-40 shadow-2xl"
                  >
                    <ContactInfoPanel
                      peer={activeConv}
                      onClose={() => setShowInfo(false)}
                      showCloseButton
                    />
                  </motion.aside>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </div>
  );
}
