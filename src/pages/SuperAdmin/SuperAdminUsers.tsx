import { useMemo, useState } from 'react';
import { Users, Search, Filter, Shield, ShieldCheck, UserCog, User as UserIcon, Mail, Power } from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, EmptyState, Badge, inputCls, Avatar,
} from './_ui';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';

type GlobalUser = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    company: string;
    plan: string;
    isActive: boolean;
    lastLogin: string;
};

const MOCK: GlobalUser[] = [
    { id: '1', name: 'Doutor Digital', email: 'doutordigitalconsultoria@gmail.com', role: 'SUPER_ADMIN', company: '—', plan: '—', isActive: true, lastLogin: 'agora' },
    { id: '2', name: 'Maria Souza', email: 'maria@norteshop.com.br', role: 'ADMIN', company: 'Norteshop Distribuidora', plan: 'Pro', isActive: true, lastLogin: '2 min' },
    { id: '3', name: 'João Pereira', email: 'joao@norteshop.com.br', role: 'MANAGER', company: 'Norteshop Distribuidora', plan: 'Pro', isActive: true, lastLogin: '1 h' },
    { id: '4', name: 'Ana Lima', email: 'ana@padariabp.com.br', role: 'ADMIN', company: 'Padaria Bom Pão Ltda', plan: 'Starter', isActive: true, lastLogin: '3 h' },
    { id: '5', name: 'Carlos Mendes', email: 'carlos@techsol.com.br', role: 'ADMIN', company: 'Tech Solutions SA', plan: 'Enterprise', isActive: true, lastLogin: '15 min' },
    { id: '6', name: 'Beatriz Castro', email: 'bia@techsol.com.br', role: 'USER', company: 'Tech Solutions SA', plan: 'Enterprise', isActive: false, lastLogin: '32 dias' },
];

const ROLE_META: Record<UserRole, { label: string; tone: 'rose' | 'sky' | 'violet' | 'neutral'; icon: React.ComponentType<{ className?: string }> }> = {
    SUPER_ADMIN: { label: 'Super Admin', tone: 'rose', icon: ShieldCheck },
    ADMIN:       { label: 'Admin',       tone: 'sky',  icon: Shield },
    MANAGER:     { label: 'Gerente',     tone: 'violet', icon: UserCog },
    USER:        { label: 'Usuário',     tone: 'neutral', icon: UserIcon },
};

export function SuperAdminUsers() {
    const [items] = useState<GlobalUser[]>(MOCK);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | UserRole>('ALL');

    const filtered = useMemo(() => items.filter((u) =>
        (filter === 'ALL' || u.role === filter) &&
        (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.company.toLowerCase().includes(search.toLowerCase()))
    ), [items, search, filter]);

    const counts = useMemo(() => ({
        ALL: items.length,
        SUPER_ADMIN: items.filter((u) => u.role === 'SUPER_ADMIN').length,
        ADMIN: items.filter((u) => u.role === 'ADMIN').length,
        MANAGER: items.filter((u) => u.role === 'MANAGER').length,
        USER: items.filter((u) => u.role === 'USER').length,
    }), [items]);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Usuários"
                description="Todos os usuários cadastrados em todas as empresas. Visão consolidada."
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total" value={items.length} icon={Users} accent="violet" />
                <KPI label="Ativos" value={items.filter((u) => u.isActive).length} accent="emerald" />
                <KPI label="Super admins" value={counts.SUPER_ADMIN} icon={ShieldCheck} accent="rose" />
                <KPI label="Inativos > 30d" value={items.filter((u) => !u.isActive).length} accent="amber" />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Tabs
                    options={[
                        { value: 'ALL', label: 'Todos' },
                        { value: 'SUPER_ADMIN', label: 'Super Admin' },
                        { value: 'ADMIN', label: 'Admin' },
                        { value: 'MANAGER', label: 'Gerente' },
                        { value: 'USER', label: 'Usuário' },
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
                            placeholder="Buscar nome, email ou empresa"
                            className={`${inputCls} h-9 pl-9 w-72`}
                        />
                    </div>
                    <Button variant="ghost" size="sm" icon={Filter}>Filtros</Button>
                </div>
            </div>

            <Card padding={false}>
                <Table>
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                        <tr>
                            <Th>Usuário</Th>
                            <Th>Função</Th>
                            <Th>Empresa</Th>
                            <Th>Plano</Th>
                            <Th>Status</Th>
                            <Th>Último login</Th>
                            <Th align="right">Ações</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7}>
                                <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Tente alterar os filtros ou a busca." />
                            </td></tr>
                        ) : filtered.map((u) => {
                            const role = ROLE_META[u.role];
                            const RoleIcon = role.icon;
                            return (
                                <tr key={u.id} className="hover:bg-white/[0.02]">
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <Avatar name={u.name} size={36} />
                                            <div>
                                                <div className="text-[13px] font-semibold text-white">{u.name}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{u.email}</div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td><Badge tone={role.tone} icon={RoleIcon}>{role.label}</Badge></Td>
                                    <Td className="text-[12.5px] text-slate-300">{u.company}</Td>
                                    <Td>{u.plan !== '—' ? <Badge>{u.plan}</Badge> : <span className="text-slate-600">—</span>}</Td>
                                    <Td>
                                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${u.isActive ? 'text-emerald-300' : 'text-slate-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                            {u.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </Td>
                                    <Td className="text-[11.5px] text-slate-400">há {u.lastLogin}</Td>
                                    <Td align="right">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <button className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white" title="Enviar e-mail">
                                                <Mail className="w-3.5 h-3.5" />
                                            </button>
                                            <button className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-400" title="Desativar">
                                                <Power className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}
