import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Filter, Eye, Settings2, ExternalLink, Power } from 'lucide-react';
import { toast } from 'sonner';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, EmptyState, Badge, Modal, Field, inputCls, Avatar,
} from './_ui';
import { gql, useQuery, timeAgo, formatBRL } from './_api';

type Company = {
    id: string;
    name: string;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    logoUrl: string | null;
    isActive: boolean;
    plan: string | null;
    usersCount: number;
    revenue30d: number;
    createdAt: string;
    lastActivityAt: string | null;
};

const Q_LIST = `
  query SuperAdminCompanies($input: ListCompaniesInput) {
    superAdminCompanies(input: $input) {
      id name cnpj email phone logoUrl isActive
      plan usersCount revenue30d createdAt lastActivityAt
    }
  }
`;

const M_CREATE = `
  mutation SuperAdminCreateCompany($input: CreateCompanyAdminInput!) {
    superAdminCreateCompany(input: $input) {
      id name cnpj email phone logoUrl isActive plan usersCount revenue30d createdAt lastActivityAt
    }
  }
`;

const M_SET_ACTIVE = `
  mutation SetActive($id: ID!, $isActive: Boolean!) {
    superAdminSetCompanyActive(id: $id, isActive: $isActive)
  }
`;

export function SuperAdminCompanies() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
    const [showModal, setShowModal] = useState(false);
    const [detail, setDetail] = useState<Company | null>(null);

    const openDetail = (c: Company) => navigate(`/super-admin/empresas/${c.id}`);

    const { data, loading, refetch } = useQuery<{ superAdminCompanies: Company[] }>(
        Q_LIST,
        { input: { search: search || null, status: filter === 'ALL' ? null : filter } },
        [search, filter],
    );
    const items = data?.superAdminCompanies ?? [];

    const counts = useMemo(() => ({
        ALL: items.length,
        ACTIVE: items.filter((c) => c.isActive).length,
        SUSPENDED: items.filter((c) => !c.isActive).length,
    }), [items]);

    const totalRevenue = items.reduce((s, c) => s + c.revenue30d, 0);
    const totalUsers = items.reduce((s, c) => s + c.usersCount, 0);

    const toggle = async (c: Company) => {
        if (!confirm(`${c.isActive ? 'Suspender' : 'Reativar'} ${c.name}?`)) return;
        try {
            await gql(M_SET_ACTIVE, { id: c.id, isActive: !c.isActive });
            toast.success(`Empresa ${c.isActive ? 'suspensa' : 'reativada'}`);
            setDetail(null);
            void refetch();
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Empresas"
                description="Tenants do GestãoInt. Aqui você visualiza, cria e administra cada empresa-cliente."
                actions={<Button icon={Plus} onClick={() => setShowModal(true)}>Nova empresa</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total" value={loading ? '…' : items.length} icon={Building2} accent="sky" />
                <KPI label="Ativas" value={loading ? '…' : counts.ACTIVE} accent="emerald" />
                <KPI label="Usuários totais" value={loading ? '…' : totalUsers} accent="violet" />
                <KPI label="Receita 30d" value={loading ? '…' : formatBRL(totalRevenue)} accent="amber" />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Tabs
                    options={[
                        { value: 'ALL', label: 'Todas' },
                        { value: 'ACTIVE', label: 'Ativas' },
                        { value: 'SUSPENDED', label: 'Suspensas' },
                    ]}
                    value={filter}
                    onChange={setFilter as any}
                    counts={counts as any}
                />
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar nome ou CNPJ"
                            className={`${inputCls} h-9 pl-9 w-64`}
                        />
                    </div>
                    <Button variant="ghost" size="sm" icon={Filter}>Filtros</Button>
                </div>
            </div>

            <Card padding={false}>
                <Table>
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                        <tr>
                            <Th>Empresa</Th>
                            <Th>CNPJ</Th>
                            <Th>Plano</Th>
                            <Th align="right">Usuários</Th>
                            <Th align="right">Receita 30d</Th>
                            <Th>Status</Th>
                            <Th>Última atividade</Th>
                            <Th align="right">Ações</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={8}>
                                <EmptyState
                                    icon={Building2}
                                    title="Nenhuma empresa encontrada"
                                    description="Ajuste os filtros ou crie a primeira empresa do sistema."
                                    action={<Button icon={Plus} onClick={() => setShowModal(true)}>Nova empresa</Button>}
                                />
                            </td></tr>
                        ) : items.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => openDetail(c)}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        <Avatar name={c.name} size={36} />
                                        <div>
                                            <div className="text-[13px] font-semibold text-white">{c.name}</div>
                                            <div className="text-[10.5px] text-slate-500 mt-0.5 font-mono-num">{c.id.slice(0, 8)}…</div>
                                        </div>
                                    </div>
                                </Td>
                                <Td className="font-mono-num text-[11.5px] text-slate-400">{c.cnpj ?? '—'}</Td>
                                <Td>
                                    {c.plan ? (
                                        <Badge tone={c.plan === 'Enterprise' ? 'violet' : c.plan === 'Pro' ? 'sky' : 'neutral'}>
                                            {c.plan}
                                        </Badge>
                                    ) : <span className="text-slate-600">—</span>}
                                </Td>
                                <Td align="right" className="font-mono-num text-[13px] text-slate-200">{c.usersCount}</Td>
                                <Td align="right" className="font-mono-num text-[13px] text-slate-200">
                                    {c.revenue30d > 0 ? formatBRL(c.revenue30d) : <span className="text-slate-600">—</span>}
                                </Td>
                                <Td>
                                    <Badge tone={c.isActive ? 'emerald' : 'rose'}>
                                        {c.isActive ? 'Ativa' : 'Suspensa'}
                                    </Badge>
                                </Td>
                                <Td className="text-[11.5px] text-slate-500">
                                    {c.lastActivityAt ? `há ${timeAgo(c.lastActivityAt)}` : '—'}
                                </Td>
                                <Td align="right">
                                    <div className="inline-flex items-center gap-1 justify-end">
                                        <button
                                            title="Configurar módulos"
                                            className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-rose-300"
                                            onClick={(e) => { e.stopPropagation(); openDetail(c); }}
                                        >
                                            <Settings2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            title="Resumo rápido"
                                            className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white"
                                            onClick={(e) => { e.stopPropagation(); setDetail(c); }}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            <NewCompanyModal open={showModal} onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); void refetch(); }} />
            <CompanyDetailModal company={detail} onClose={() => setDetail(null)} onToggle={toggle} />
        </div>
    );
}

function NewCompanyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [planId, setPlanId] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (!name.trim()) return toast.error('Nome obrigatório');
        setSubmitting(true);
        try {
            await gql(M_CREATE, {
                input: {
                    name: name.trim(),
                    cnpj: cnpj.trim() || null,
                    email: email.trim() || null,
                    phone: phone.trim() || null,
                    planId: planId.trim() || null,
                    adminEmail: adminEmail.trim() || null,
                },
            });
            toast.success('Empresa criada');
            setName(''); setCnpj(''); setEmail(''); setPhone(''); setPlanId(''); setAdminEmail('');
            onCreated();
        } catch (e: any) { toast.error(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Nova empresa"
            description="Cria o tenant. Se informar e-mail de admin, um convite é enviado automaticamente."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={submit} disabled={submitting}>{submitting ? 'Criando…' : 'Criar empresa'}</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Nome fantasia" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Padaria do Bairro Ltda" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="CNPJ"><input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={inputCls} placeholder="00.000.000/0000-00" /></Field>
                    <Field label="Telefone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(11) 99999-0000" /></Field>
                </div>
                <Field label="E-mail da empresa"><input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="contato@empresa.com.br" /></Field>
                <Field label="Plano (ID)" hint="opcional"><input value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputCls} placeholder="uuid do plano" /></Field>
                <Field label="E-mail do administrador" hint="se preenchido, dispara convite">
                    <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputCls} placeholder="dono@empresa.com.br" />
                </Field>
            </div>
        </Modal>
    );
}

function CompanyDetailModal({ company, onClose, onToggle }: { company: Company | null; onClose: () => void; onToggle: (c: Company) => void }) {
    if (!company) return null;
    return (
        <Modal
            open={!!company}
            onClose={onClose}
            title={company.name}
            description={`CNPJ ${company.cnpj ?? '—'}`}
            size="lg"
            footer={
                <>
                    <Button variant="ghost" icon={ExternalLink}>Acessar tenant</Button>
                    <Button variant="danger" icon={Power} onClick={() => onToggle(company)}>
                        {company.isActive ? 'Suspender' : 'Reativar'}
                    </Button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-3 mb-5">
                <KPI label="Usuários" value={company.usersCount} icon={Building2} accent="violet" />
                <KPI label="Receita 30d" value={formatBRL(company.revenue30d)} accent="amber" />
            </div>
            <Card>
                <div className="text-[12px] text-slate-400">
                    <Row label="Plano" value={company.plan ? <Badge tone="sky">{company.plan}</Badge> : <span className="text-slate-600">sem plano</span>} />
                    <Row label="Status" value={<Badge tone={company.isActive ? 'emerald' : 'rose'}>{company.isActive ? 'Ativa' : 'Suspensa'}</Badge>} />
                    <Row label="E-mail" value={<span className="text-slate-200">{company.email ?? '—'}</span>} />
                    <Row label="Telefone" value={<span className="text-slate-200">{company.phone ?? '—'}</span>} />
                    <Row label="Criada em" value={<span className="text-slate-200 font-mono-num">{new Date(company.createdAt).toLocaleDateString('pt-BR')}</span>} />
                    <Row label="Última atividade" value={<span className="text-slate-200">{company.lastActivityAt ? `há ${timeAgo(company.lastActivityAt)}` : '—'}</span>} />
                </div>
            </Card>
        </Modal>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
            <span>{label}</span>{value}
        </div>
    );
}
