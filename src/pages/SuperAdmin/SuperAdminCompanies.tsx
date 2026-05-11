import { useMemo, useState } from 'react';
import { Building2, Plus, Search, Filter, ExternalLink, Power, Eye } from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, EmptyState, Badge, Modal, Field, inputCls, Avatar,
} from './_ui';

type CompanyStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
type Company = {
    id: string;
    name: string;
    cnpj: string;
    plan: string;
    users: number;
    revenueMonth: number;
    status: CompanyStatus;
    createdAt: string;
    lastActivity: string;
};

const MOCK: Company[] = [
    { id: '1', name: 'Norteshop Distribuidora', cnpj: '12.345.678/0001-90', plan: 'Pro', users: 18, revenueMonth: 45200, status: 'ACTIVE', createdAt: '2025-08-12', lastActivity: '2 min' },
    { id: '2', name: 'Padaria Bom Pão Ltda', cnpj: '11.222.333/0001-44', plan: 'Starter', users: 4, revenueMonth: 8900, status: 'ACTIVE', createdAt: '2026-03-02', lastActivity: '1 h' },
    { id: '3', name: 'Tech Solutions SA', cnpj: '22.333.444/0001-55', plan: 'Enterprise', users: 42, revenueMonth: 128400, status: 'ACTIVE', createdAt: '2024-11-01', lastActivity: '4 min' },
    { id: '4', name: 'Construtora Horizonte', cnpj: '33.444.555/0001-66', plan: 'Pro', users: 12, revenueMonth: 0, status: 'SUSPENDED', createdAt: '2025-02-19', lastActivity: '12 dias' },
    { id: '5', name: 'Loja do João', cnpj: '44.555.666/0001-77', plan: 'Trial', users: 2, revenueMonth: 0, status: 'TRIAL', createdAt: '2026-05-08', lastActivity: '3 h' },
];

export function SuperAdminCompanies() {
    const [items] = useState<Company[]>(MOCK);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | CompanyStatus>('ALL');
    const [showModal, setShowModal] = useState(false);
    const [detail, setDetail] = useState<Company | null>(null);

    const filtered = useMemo(() => {
        return items.filter((c) =>
            (filter === 'ALL' || c.status === filter) &&
            (c.name.toLowerCase().includes(search.toLowerCase()) || c.cnpj.includes(search))
        );
    }, [items, search, filter]);

    const counts = useMemo(() => ({
        ALL: items.length,
        ACTIVE: items.filter((c) => c.status === 'ACTIVE').length,
        SUSPENDED: items.filter((c) => c.status === 'SUSPENDED').length,
        TRIAL: items.filter((c) => c.status === 'TRIAL').length,
    }), [items]);

    const totalRevenue = items.reduce((s, c) => s + c.revenueMonth, 0);
    const totalUsers = items.reduce((s, c) => s + c.users, 0);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Empresas"
                description="Tenants do GestãoInt. Aqui você visualiza, cria e administra cada empresa-cliente."
                actions={<Button icon={Plus} onClick={() => setShowModal(true)}>Nova empresa</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total" value={items.length} icon={Building2} accent="sky" />
                <KPI label="Ativas" value={counts.ACTIVE} accent="emerald" />
                <KPI label="Usuários totais" value={totalUsers} accent="violet" />
                <KPI label="MRR estimado" value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} accent="amber" />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Tabs
                    options={[
                        { value: 'ALL', label: 'Todas' },
                        { value: 'ACTIVE', label: 'Ativas' },
                        { value: 'TRIAL', label: 'Trial' },
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
                            <Th align="right">MRR</Th>
                            <Th>Status</Th>
                            <Th>Última atividade</Th>
                            <Th align="right">Ações</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8}>
                                <EmptyState
                                    icon={Building2}
                                    title="Nenhuma empresa encontrada"
                                    description="Ajuste os filtros ou crie a primeira empresa do sistema."
                                    action={<Button icon={Plus} onClick={() => setShowModal(true)}>Nova empresa</Button>}
                                />
                            </td></tr>
                        ) : filtered.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setDetail(c)}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        <Avatar name={c.name} size={36} />
                                        <div>
                                            <div className="text-[13px] font-semibold text-white">{c.name}</div>
                                            <div className="text-[10.5px] text-slate-500 mt-0.5">ID {c.id}</div>
                                        </div>
                                    </div>
                                </Td>
                                <Td className="font-mono-num text-[11.5px] text-slate-400">{c.cnpj}</Td>
                                <Td>
                                    <Badge tone={c.plan === 'Enterprise' ? 'violet' : c.plan === 'Pro' ? 'sky' : c.plan === 'Trial' ? 'amber' : 'neutral'}>
                                        {c.plan}
                                    </Badge>
                                </Td>
                                <Td align="right" className="font-mono-num text-[13px] text-slate-200">{c.users}</Td>
                                <Td align="right" className="font-mono-num text-[13px] text-slate-200">
                                    {c.revenueMonth > 0 ? `R$ ${c.revenueMonth.toLocaleString('pt-BR')}` : <span className="text-slate-600">—</span>}
                                </Td>
                                <Td>
                                    <Badge tone={c.status === 'ACTIVE' ? 'emerald' : c.status === 'TRIAL' ? 'amber' : 'rose'}>
                                        {c.status === 'ACTIVE' ? 'Ativa' : c.status === 'TRIAL' ? 'Trial' : 'Suspensa'}
                                    </Badge>
                                </Td>
                                <Td className="text-[11.5px] text-slate-500">há {c.lastActivity}</Td>
                                <Td align="right">
                                    <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white" onClick={(e) => { e.stopPropagation(); setDetail(c); }}>
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            <NewCompanyModal open={showModal} onClose={() => setShowModal(false)} />
            <CompanyDetailModal company={detail} onClose={() => setDetail(null)} />
        </div>
    );
}

function NewCompanyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Nova empresa"
            description="Cria o tenant e envia um convite para o primeiro administrador."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button>Criar e convidar</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Nome fantasia" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Padaria do Bairro Ltda" />
                </Field>
                <Field label="CNPJ" required>
                    <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={inputCls} placeholder="00.000.000/0000-00" />
                </Field>
                <Field label="E-mail do administrador" required hint="receberá o convite de acesso">
                    <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputCls} placeholder="dono@empresa.com.br" />
                </Field>
                <Field label="Plano inicial">
                    <select className={inputCls}>
                        <option>Trial (15 dias)</option>
                        <option>Starter</option>
                        <option>Pro</option>
                        <option>Enterprise</option>
                    </select>
                </Field>
            </div>
        </Modal>
    );
}

function CompanyDetailModal({ company, onClose }: { company: Company | null; onClose: () => void }) {
    if (!company) return null;
    return (
        <Modal
            open={!!company}
            onClose={onClose}
            title={company.name}
            description={`CNPJ ${company.cnpj}`}
            size="lg"
            footer={
                <>
                    <Button variant="ghost" icon={ExternalLink}>Acessar tenant</Button>
                    <Button variant="danger" icon={Power}>{company.status === 'ACTIVE' ? 'Suspender' : 'Reativar'}</Button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-3 mb-5">
                <KPI label="Usuários" value={company.users} icon={Building2} accent="violet" />
                <KPI label="MRR" value={`R$ ${company.revenueMonth.toLocaleString('pt-BR')}`} accent="amber" />
            </div>
            <Card>
                <div className="text-[12px] text-slate-400">
                    <div className="flex justify-between py-1.5"><span>Plano</span><Badge tone="sky">{company.plan}</Badge></div>
                    <div className="flex justify-between py-1.5"><span>Status</span><Badge tone={company.status === 'ACTIVE' ? 'emerald' : 'rose'}>{company.status}</Badge></div>
                    <div className="flex justify-between py-1.5"><span>Criada em</span><span className="text-slate-200 font-mono-num">{new Date(company.createdAt).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex justify-between py-1.5"><span>Última atividade</span><span className="text-slate-200">há {company.lastActivity}</span></div>
                </div>
            </Card>
        </Modal>
    );
}
