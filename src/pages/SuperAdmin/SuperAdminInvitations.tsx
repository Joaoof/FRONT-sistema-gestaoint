import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, Send, Copy, Check, Clock, CheckCircle2, XCircle, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
    Button, Card, PageHeader, Tabs, Table, Th, Td, EmptyState, Badge, Modal, Field, inputCls, textareaCls, Avatar,
} from './_ui';

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
      invitation { id email status token }
      acceptUrl
    }
  }
`;

const GQL_REVOKE = `
  mutation RevokeInvitation($id: String!) {
    revokeInvitation(id: $id)
  }
`;

// Opções pros dropdowns do convite (empresa / plano).
const GQL_OPTIONS = `
  query InviteOptions {
    superAdminCompanies { id name }
    superAdminPlans { id name }
  }
`;

type OptionItem = { id: string; name: string };

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

const STATUS_LABEL: Record<InviteStatus | 'ALL', string> = {
    ALL: 'Todos', PENDING: 'Pendentes', ACCEPTED: 'Aceitos', REVOKED: 'Revogados', EXPIRED: 'Expirados',
};

const STATUS_STYLES: Record<InviteStatus, { tone: 'amber' | 'emerald' | 'slate' | 'rose'; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING:  { tone: 'amber', icon: Clock },
    ACCEPTED: { tone: 'emerald', icon: CheckCircle2 },
    REVOKED:  { tone: 'slate', icon: XCircle },
    EXPIRED:  { tone: 'rose', icon: XCircle },
};

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

    useEffect(() => { void load(); }, [filter]);

    const counts = useMemo(() => {
        const c: any = { ALL: items.length };
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
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Convites"
                description="Envie acessos por e-mail. O destinatário recebe um link assinado e cria a própria senha."
                actions={
                    <Button icon={Plus} onClick={() => setShowModal(true)}>
                        Novo convite
                    </Button>
                }
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Tabs
                    options={[
                        { value: 'ALL', label: STATUS_LABEL.ALL },
                        { value: 'PENDING', label: STATUS_LABEL.PENDING },
                        { value: 'ACCEPTED', label: STATUS_LABEL.ACCEPTED },
                        { value: 'REVOKED', label: STATUS_LABEL.REVOKED },
                        { value: 'EXPIRED', label: STATUS_LABEL.EXPIRED },
                    ]}
                    value={filter}
                    onChange={setFilter}
                    counts={counts}
                />
                <Button variant="ghost" size="sm" icon={Filter}>Filtros avançados</Button>
            </div>

            <Card padding={false}>
                <Table>
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                        <tr>
                            <Th>Destinatário</Th>
                            <Th>Empresa</Th>
                            <Th>Plano</Th>
                            <Th>Função</Th>
                            <Th>Status</Th>
                            <Th>Criado</Th>
                            <Th align="right">Ações</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7}>
                                <EmptyState
                                    icon={Mail}
                                    title="Nenhum convite ainda"
                                    description="Clique em 'Novo convite' pra trazer alguém pra plataforma. O destinatário recebe um e-mail bonito e personalizado."
                                    action={<Button icon={Plus} onClick={() => setShowModal(true)}>Enviar primeiro convite</Button>}
                                />
                            </td></tr>
                        ) : items.map((inv) => (
                            <InviteRow key={inv.id} inv={inv} onRevoke={handleRevoke} />
                        ))}
                    </tbody>
                </Table>
            </Card>

            <CreateInviteModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onCreated={() => { setShowModal(false); void load(); }}
            />
        </div>
    );
}

function InviteRow({ inv, onRevoke }: { inv: Invitation; onRevoke: (id: string) => void }) {
    const [copied, setCopied] = useState(false);
    const style = STATUS_STYLES[inv.status];
    const StatusIcon = style.icon;
    const link = `${window.location.origin}/aceitar-convite/${inv.token}`;

    const copy = async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Link copiado');
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <tr className="hover:bg-white/[0.02] transition-colors">
            <Td>
                <div className="flex items-center gap-3">
                    <Avatar name={inv.email} size={32} />
                    <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-white truncate">{inv.email}</div>
                        {inv.acceptedAt && (
                            <div className="text-[10.5px] text-emerald-400 mt-0.5">
                                aceito em {new Date(inv.acceptedAt).toLocaleDateString('pt-BR')}
                            </div>
                        )}
                    </div>
                </div>
            </Td>
            <Td className="text-slate-300 text-[12.5px]">{inv.companyName ?? <span className="text-slate-600">—</span>}</Td>
            <Td className="text-slate-300 text-[12.5px]">{inv.planName ?? <span className="text-slate-600">—</span>}</Td>
            <Td>
                <Badge tone="violet">{translateRole(inv.role)}</Badge>
            </Td>
            <Td>
                <Badge tone={style.tone} icon={StatusIcon}>
                    {STATUS_LABEL[inv.status]}
                </Badge>
            </Td>
            <Td className="text-slate-400 text-[11.5px] font-mono-num">
                {new Date(inv.createdAt).toLocaleDateString('pt-BR')}
            </Td>
            <Td align="right">
                <div className="flex items-center justify-end gap-0.5">
                    {inv.status === 'PENDING' && (
                        <>
                            <button
                                onClick={copy}
                                className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                title="Copiar link"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => onRevoke(inv.id)}
                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Revogar"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </Td>
        </tr>
    );
}

function translateRole(role: string) {
    return ({
        SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Gerente', USER: 'Usuário',
    } as Record<string, string>)[role] ?? role;
}

function CreateInviteModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('ADMIN');
    const [companyId, setCompanyId] = useState('');
    const [planId, setPlanId] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [companies, setCompanies] = useState<OptionItem[]>([]);
    const [plans, setPlans] = useState<OptionItem[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Carrega empresas/planos só quando o modal abre.
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoadingOptions(true);
        gql<{ superAdminCompanies: OptionItem[]; superAdminPlans: OptionItem[] }>(GQL_OPTIONS)
            .then((data) => {
                if (cancelled) return;
                setCompanies(data.superAdminCompanies ?? []);
                setPlans(data.superAdminPlans ?? []);
            })
            .catch((e: any) => toast.error(e.message))
            .finally(() => !cancelled && setLoadingOptions(false));
        return () => { cancelled = true; };
    }, [open]);

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
            setEmail(''); setCompanyId(''); setPlanId(''); setMessage('');
            onCreated();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Novo convite"
            description="Enviamos um link assinado por e-mail. Expira em 7 dias."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button icon={Send} onClick={() => (document.querySelector('#invite-form') as HTMLFormElement)?.requestSubmit()} disabled={submitting}>
                        {submitting ? 'Enviando…' : 'Enviar convite'}
                    </Button>
                </>
            }
        >
            <form id="invite-form" onSubmit={submit} className="space-y-4">
                <Field label="E-mail do destinatário" required>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="pessoa@empresa.com.br"
                        className={inputCls}
                    />
                </Field>

                <Field label="Função no sistema" required>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                        <option value="ADMIN">Administrador da empresa</option>
                        <option value="MANAGER">Gerente</option>
                        <option value="USER">Usuário</option>
                        <option value="SUPER_ADMIN">Super administrador</option>
                    </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Empresa" hint={loadingOptions ? 'carregando…' : 'opcional'}>
                        <select
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            disabled={loadingOptions}
                            className={inputCls}
                        >
                            <option value="">— Definir na aceitação —</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Plano" hint={loadingOptions ? 'carregando…' : 'opcional'}>
                        <select
                            value={planId}
                            onChange={(e) => setPlanId(e.target.value)}
                            disabled={loadingOptions}
                            className={inputCls}
                        >
                            <option value="">— Nenhum —</option>
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </Field>
                </div>

                <Field label="Mensagem personalizada" hint="aparece no corpo do e-mail">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="Olá! Você foi convidado para usar o GestãoInt…"
                        className={textareaCls}
                    />
                </Field>
            </form>
        </Modal>
    );
}
