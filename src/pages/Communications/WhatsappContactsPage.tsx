import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  CheckCircle2,
  Filter,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  CREATE_CUSTOMER_FROM_WHATSAPP_CONTACT,
  GET_WHATSAPP_CONTACTS_LIST,
  SYNC_WHATSAPP_CONTACTS,
} from '../../graphql/queries/whatsapp-session';

interface ContactCard {
  jid: string;
  number: string | null;
  name: string | null;
  profilePicUrl: string | null;
  isGroup: boolean;
  messageCount: number;
  customerId: string | null;
  customerName: string | null;
  lastInteractionAt: string | null;
}

type FilterMode = 'all' | 'customers' | 'leads' | 'groups';

const filterLabels: Record<FilterMode, string> = {
  all: 'Todos',
  customers: 'Clientes',
  leads: 'Leads (sem cadastro)',
  groups: 'Grupos',
};

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const palette = [
    '#06876c', '#475569', '#7c3aed', '#0891b2', '#dc2626',
    '#d97706', '#0d9488', '#ea580c', '#9333ea', '#059669',
  ];
  return palette[Math.abs(h) % palette.length];
}

function getInitials(name: string | null, seed: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]).join('').toUpperCase();
  }
  return seed.slice(-2).toUpperCase();
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D+/g, '');
  if (d.length < 10) return d;
  const dd = d.slice(-11, -9);
  const main = d.slice(-9);
  const ddi = d.length > 11 ? `+${d.slice(0, d.length - 11)} ` : '';
  return `${ddi}(${dd}) ${main.slice(0, 5)}-${main.slice(5)}`;
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = Date.now();
  const ms = now - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('pt-BR');
}

function ContactAvatar({ contact }: { contact: ContactCard }) {
  const [failed, setFailed] = useState(false);
  if (contact.profilePicUrl && !failed) {
    return (
      <img
        src={contact.profilePicUrl}
        alt={contact.name ?? ''}
        onError={() => setFailed(true)}
        className="w-12 h-12 rounded-full object-cover bg-slate-200 shrink-0"
      />
    );
  }
  if (contact.isGroup) {
    return (
      <div className="w-12 h-12 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
        <Users className="w-6 h-6" />
      </div>
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-full text-white flex items-center justify-center font-semibold text-base shrink-0"
      style={{ backgroundColor: colorFor(contact.jid) }}
    >
      {getInitials(contact.name, contact.jid)}
    </div>
  );
}

function ContactRow({
  contact,
  onCreateCustomer,
  onOpen,
  isSelected,
}: {
  contact: ContactCard;
  onCreateCustomer: (c: ContactCard) => void;
  onOpen: (c: ContactCard) => void;
  isSelected: boolean;
}) {
  return (
    <div
      onClick={() => onOpen(contact)}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 transition-colors ${
        isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
      }`}
    >
      <ContactAvatar contact={contact} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 truncate">
            {contact.name || (contact.number ? formatPhone(contact.number) : contact.jid)}
          </span>
          {contact.customerId && (
            <span className="text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Cliente
            </span>
          )}
          {contact.isGroup && (
            <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
              Grupo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-0.5">
          {contact.number && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {formatPhone(contact.number)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {contact.messageCount}
          </span>
          <span className="text-slate-400">
            {fmtRelative(contact.lastInteractionAt)}
          </span>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {!contact.customerId && !contact.isGroup ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateCustomer(contact);
            }}
            className="text-[11px] inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium"
          >
            <UserPlus className="w-3 h-3" />
            Cadastrar
          </button>
        ) : contact.customerId ? (
          <a
            href={`/clientes/${contact.customerId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-brand-600 hover:underline"
          >
            ver cliente →
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function WhatsappContactsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [createOpen, setCreateOpen] = useState<ContactCard | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDoc, setNewDoc] = useState('');

  const { data, loading, refetch } = useQuery<{
    whatsappContactsList: ContactCard[];
  }>(GET_WHATSAPP_CONTACTS_LIST, {
    fetchPolicy: 'cache-and-network',
  });
  const [syncMut, { loading: syncing }] = useMutation(SYNC_WHATSAPP_CONTACTS);
  const [createCustomerMut, { loading: creating }] = useMutation(
    CREATE_CUSTOMER_FROM_WHATSAPP_CONTACT,
  );

  const contacts = data?.whatsappContactsList ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter === 'customers' && !c.customerId) return false;
      if (filter === 'leads' && (c.customerId || c.isGroup)) return false;
      if (filter === 'groups' && !c.isGroup) return false;
      if (q) {
        const hay = [c.name, c.number, c.jid, c.customerName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, search, filter]);

  const stats = useMemo(() => {
    const totalCustomers = contacts.filter((c) => c.customerId).length;
    const totalLeads = contacts.filter((c) => !c.customerId && !c.isGroup).length;
    const totalGroups = contacts.filter((c) => c.isGroup).length;
    return { totalCustomers, totalLeads, totalGroups, total: contacts.length };
  }, [contacts]);

  const openCreate = (c: ContactCard) => {
    setCreateOpen(c);
    setNewName(c.name ?? '');
    setNewEmail('');
    setNewDoc('');
  };

  const submitCreate = async () => {
    if (!createOpen) return;
    try {
      const res = await createCustomerMut({
        variables: {
          peerNumber: createOpen.jid,
          name: newName.trim() || undefined,
          email: newEmail.trim() || undefined,
          document: newDoc.trim() || undefined,
        },
      });
      const linked = res.data?.createCustomerFromWhatsappContact?.linkedMessages;
      alert(`Cliente criado e ${linked} mensagem(ns) vinculada(s).`);
      setCreateOpen(null);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncMut();
      const count = res.data?.syncWhatsappContacts ?? 0;
      alert(`${count} contato(s) sincronizado(s) do WhatsApp.`);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const openChat = (c: ContactCard) => {
    // /comunicacoes/whatsapp já abre o painel rico (timeline, tags, lembretes,
    // métricas) com um único click — não duplicamos isso aqui.
    window.location.href = `/comunicacoes/whatsapp?peer=${encodeURIComponent(c.jid)}`;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50">
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">
              Contatos do WhatsApp
            </h1>
            <p className="text-sm text-slate-500">
              CRM unificado — cada contato sincronizado vira lead, e leads viram
              clientes em 1 clique.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm font-medium"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            Sincronizar
          </button>
        </header>

        {/* KPIs */}
        <div className="px-6 py-4 grid grid-cols-4 gap-3 bg-white border-b border-slate-200">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Total</div>
            <div className="text-xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="text-[10px] uppercase tracking-wide text-emerald-600">
              Clientes
            </div>
            <div className="text-xl font-bold text-emerald-700">
              {stats.totalCustomers}
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="text-[10px] uppercase tracking-wide text-amber-600">
              Leads
            </div>
            <div className="text-xl font-bold text-amber-700">{stats.totalLeads}</div>
          </div>
          <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">
              Grupos
            </div>
            <div className="text-xl font-bold text-slate-700">
              {stats.totalGroups}
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou cliente vinculado…"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(Object.keys(filterLabels) as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1 ${
                  filter === f
                    ? 'bg-white text-slate-800 shadow-sm font-medium'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {f === 'all' && <Filter className="w-3 h-3" />}
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading && contacts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando contatos…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto opacity-30 mb-3" />
              <p className="text-sm">Nenhum contato encontrado.</p>
              {contacts.length === 0 && (
                <p className="text-xs mt-1">
                  Clique em "Sincronizar" para puxar contatos do WhatsApp.
                </p>
              )}
            </div>
          ) : (
            filtered.map((c) => (
              <ContactRow
                key={c.jid}
                contact={c}
                onOpen={openChat}
                onCreateCustomer={openCreate}
                isSelected={false}
              />
            ))
          )}
        </div>
      </main>

      {/* Modal de criação de cliente */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Cadastrar como cliente
              </h3>
              <button
                onClick={() => setCreateOpen(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Nome
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  E-mail (opcional)
                </label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  CPF/CNPJ (opcional)
                </label>
                <input
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                <strong>Telefone:</strong>{' '}
                {createOpen.number ? formatPhone(createOpen.number) : '—'}
                <br />
                Todas as mensagens dessa conversa serão vinculadas ao cliente.
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setCreateOpen(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submitCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
              >
                {creating ? 'Salvando…' : 'Criar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
