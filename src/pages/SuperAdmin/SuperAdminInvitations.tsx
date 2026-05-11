import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, X, Send, Copy, Check, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

type Invitation = {
    id: string;
    email: string;
    role: string;
    companyId: string | null;
    companyName?: string | null;
    planId: string | null;
    planName?: string | null;
    status: InviteStatus;
    token: string;
    message?: string | null;
    invitedBy?: string | null;
    createdAt: string;
    acceptedAt?: string | null;
    expiresAt?: string | null;
};

const GQL_LIST = `
  query Invitations($status: String) {
    invitations(status: $status) {
      id email role companyId companyName planId planName
      status token message createdAt acceptedAt expiresAt
    }
  }
`;

const GQL_CREATE = `
  mutation CreateInvitation($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      id email status token
    }
  }
`;

const GQL_REVOKE = `
  mutation RevokeInvitation($id: String!) {
    revokeInvitation(id: $id) { id status }
  }
`;

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(endpoint ?? '', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message ?? 'Erro GraphQL');
    return json.data;
}

export function SuperAdminInvitations() {
    const [items, setItems] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<InviteStatus | 'ALL'>('ALL');
    const [showModal, setShowModal] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await gql<{ invitations: Invitation[] }>(
                GQL_LIST,
                { status: filter === 'ALL' ? null : filter },
            );
            setItems(data.invitations);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [filter]);

    const counts = useMemo(() => {
        const c = { ALL: items.length, PENDING: 0, ACCEPTED: 0, REVOKED: 0, EXPIRED: 0 } as Record<string, number>;
        items.forEach((i) => { c[i.status] = (c[i.status] ?? 0) + 1; });
        return c;
    }, [items]);

    const handleRevoke = async (id: string) => {
        if (!confirm('Revogar este convite?')) return;
        try {
            await gql(GQL_REVOKE, { id });
            toast.success('Convite revogado');
            void load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Convites</h1>
                    <p className="text-[13px] text-slate-400 mt-1">
                        Envie convites para novos usuários, empresas ou administradores.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[13.5px] font-semibold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo convite
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#181b25] border border-white/5 w-fit">
                {(['ALL', 'PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                            filter === s
                                ? 'bg-rose-500/15 text-rose-300'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {STATUS_LABEL[s]} <span className="opacity-60">({counts[s] ?? 0})</span>
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="rounded-xl bg-[#181b25] border border-white/5 overflow-hidden">
                <table className="w-full text-[13px]">
                    <thead className="bg-white/[0.02] border-b border-white/5">
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Empresa</th>
                            <th className="px-4 py-3 font-medium">Plano</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Criado</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Carregando…</td></tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-16 text-center">
                                    <Mail className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                    <div className="text-slate-400 text-[13.5px]">Nenhum convite ainda</div>
                                    <div className="text-slate-500 text-[12px] mt-1">Clique em "Novo convite" para começar</div>
                                </td>
                            </tr>
                        ) : items.map((inv) => (
                            <InviteRow key={inv.id} inv={inv} onRevoke={handleRevoke} />
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <CreateInviteModal
                    onClose={() => setShowModal(false)}
                    onCreated={() => { setShowModal(false); void load(); }}
                />
            )}
        </div>
    );
}

const STATUS_LABEL: Record<string, string> = {
    ALL: 'Todos',
    PENDING: 'Pendentes',
    ACCEPTED: 'Aceitos',
    REVOKED: 'Revogados',
    EXPIRED: 'Expirados',
};

const STATUS_STYLES: Record<InviteStatus, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING:  { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-300', icon: Clock },
    ACCEPTED: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-300', icon: CheckCircle2 },
    REVOKED:  { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', icon: XCircle },
    EXPIRED:  { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-300', icon: XCircle },
};

function InviteRow({ inv, onRevoke }: { inv: Invitation; onRevoke: (id: string) => void }) {
    const [copied, setCopied] = useState(false);
    const style = STATUS_STYLES[inv.status];
    const Icon = style.icon;
    const link = `${window.location.origin}/aceitar-convite/${inv.token}`;

    const copy = async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Link copiado');
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <tr className="hover:bg-white/[0.02]">
            <td className="px-4 py-3 text-white font-medium">{inv.email}</td>
            <td className="px-4 py-3 text-slate-300">{inv.companyName ?? '—'}</td>
            <td className="px-4 py-3 text-slate-300">{inv.planName ?? '—'}</td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11.5px] font-medium ${style.bg} ${style.text}`}>
                    <Icon className="w-3 h-3" />
                    {STATUS_LABEL[inv.status]}
                </span>
            </td>
            <td className="px-4 py-3 text-slate-400 text-[12px]">
                {new Date(inv.createdAt).toLocaleDateString('pt-BR')}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                    {inv.status === 'PENDING' && (
                        <>
                            <button
                                onClick={copy}
                                className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                                title="Copiar link"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => onRevoke(inv.id)}
                                className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                                title="Revogar"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

function CreateInviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('ADMIN');
    const [companyId, setCompanyId] = useState('');
    const [planId, setPlanId] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await gql(GQL_CREATE, {
                input: {
                    email: email.trim(),
                    role,
                    companyId: companyId.trim() || null,
                    planId: planId.trim() || null,
                    message: message.trim() || null,
                },
            });
            toast.success('Convite enviado para ' + email);
            onCreated();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <form
                onSubmit={submit}
                className="w-full max-w-lg bg-[#181b25] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <div>
                        <h3 className="text-[15px] font-semibold text-white">Novo convite</h3>
                        <p className="text-[12px] text-slate-400 mt-0.5">Envie um link de acesso por e-mail</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <Field label="E-mail *">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@empresa.com"
                            className="input-dark"
                        />
                    </Field>

                    <Field label="Função *">
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="input-dark">
                            <option value="ADMIN">Administrador da empresa</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="USER">Usuário</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Empresa (ID)">
                            <input
                                type="text"
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                placeholder="opcional"
                                className="input-dark"
                            />
                        </Field>
                        <Field label="Plano (ID)">
                            <input
                                type="text"
                                value={planId}
                                onChange={(e) => setPlanId(e.target.value)}
                                placeholder="opcional"
                                className="input-dark"
                            />
                        </Field>
                    </div>

                    <Field label="Mensagem personalizada">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Olá! Você foi convidado para usar o GestãoInt…"
                            className="input-dark resize-none"
                        />
                    </Field>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white/[0.02] border-t border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-300 hover:bg-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[13px] font-semibold"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {submitting ? 'Enviando…' : 'Enviar convite'}
                    </button>
                </div>

                <style>{`
                    .input-dark {
                        width: 100%;
                        padding: 0.6rem 0.75rem;
                        border-radius: 0.5rem;
                        background: rgba(255,255,255,0.04);
                        border: 1px solid rgba(255,255,255,0.08);
                        color: #e2e8f0;
                        font-size: 13px;
                        outline: none;
                    }
                    .input-dark:focus {
                        border-color: rgba(244, 63, 94, 0.4);
                    }
                    .input-dark::placeholder { color: #64748b; }
                `}</style>
            </form>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-[11.5px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">{label}</span>
            {children}
        </label>
    );
}
