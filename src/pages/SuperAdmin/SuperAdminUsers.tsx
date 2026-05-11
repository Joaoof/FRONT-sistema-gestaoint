import { useMemo, useState } from 'react';
import { Users, Search, Filter, Shield, ShieldCheck, UserCog, User as UserIcon, Mail, Power } from 'lucide-react';
import { toast } from 'sonner';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, EmptyState, Badge, inputCls, Avatar,
} from './_ui';
import { gql, useQuery, timeAgo } from './_api';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';

type GlobalUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    companyId: string | null;
    companyName: string | null;
    plan: string | null;
    createdAt: string;
};

const Q_LIST = `
  query SuperAdminUsers($input: ListUsersInput) {
    superAdminUsers(input: $input) {
      id name email role isActive isSuperAdmin
      companyId companyName plan createdAt
    }
  }
`;

const M_SET_ACTIVE = `
  mutation SetUserActive($id: ID!, $isActive: Boolean!) {
    superAdminSetUserActive(id: $id, isActive: $isActive)
  }
`;

const ROLE_META: Record<UserRole, { label: string; tone: 'rose' | 'sky' | 'violet' | 'neutral'; icon: React.ComponentType<{ className?: string }> }> = {
    SUPER_ADMIN: { label: 'Super Admin', tone: 'rose', icon: ShieldCheck },
    ADMIN:       { label: 'Admin',       tone: 'sky',  icon: Shield },
    MANAGER:     { label: 'Gerente',     tone: 'violet', icon: UserCog },
    USER:        { label: 'Usuário',     tone: 'neutral', icon: UserIcon },
};

export function SuperAdminUsers() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | UserRole>('ALL');

    const { data, loading, refetch } = useQuery<{ superAdminUsers: GlobalUser[] }>(
        Q_LIST,
        { input: { search: search || null, role: filter === 'ALL' ? null : filter } },
        [search, filter],
    );
    const items = data?.superAdminUsers ?? [];

    const counts = useMemo(() => ({
        ALL: items.length,
        SUPER_ADMIN: items.filter((u) => u.role === 'SUPER_ADMIN' || u.isSuperAdmin).length,
        ADMIN: items.filter((u) => u.role === 'ADMIN').length,
        MANAGER: items.filter((u) => u.role === 'MANAGER').length,
        USER: items.filter((u) => u.role === 'USER').length,
    }), [items]);

    const toggle = async (u: GlobalUser) => {
        if (!confirm(`${u.isActive ? 'Desativar' : 'Reativar'} ${u.name}?`)) return;
        try {
            await gql(M_SET_ACTIVE, { id: u.id, isActive: !u.isActive });
            toast.success(`Usuário ${u.isActive ? 'desativado' : 'reativado'}`);
            void refetch();
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Usuários"
                description="Todos os usuários cadastrados em todas as empresas. Visão consolidada."
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Total" value={loading ? '…' : items.length} icon={Users} accent="violet" />
                <KPI label="Ativos" value={loading ? '…' : items.filter((u) => u.isActive).length} accent="emerald" />
                <KPI label="Super admins" value={loading ? '…' : counts.SUPER_ADMIN} icon={ShieldCheck} accent="rose" />
                <KPI label="Inativos" value={loading ? '…' : items.filter((u) => !u.isActive).length} accent="amber" />
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
                            <Th>Criado</Th>
                            <Th align="right">Ações</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7}>
                                <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Tente alterar os filtros ou a busca." />
                            </td></tr>
                        ) : items.map((u) => {
                            const roleKey = (u.isSuperAdmin ? 'SUPER_ADMIN' : u.role.toUpperCase()) as UserRole;
                            const role = ROLE_META[roleKey] ?? ROLE_META.USER;
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
                                    <Td className="text-[12.5px] text-slate-300">{u.companyName ?? <span className="text-slate-600">—</span>}</Td>
                                    <Td>{u.plan ? <Badge>{u.plan}</Badge> : <span className="text-slate-600">—</span>}</Td>
                                    <Td>
                                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${u.isActive ? 'text-emerald-300' : 'text-slate-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                            {u.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </Td>
                                    <Td className="text-[11.5px] text-slate-400 font-mono-num">há {timeAgo(u.createdAt)}</Td>
                                    <Td align="right">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <a
                                                href={`mailto:${u.email}`}
                                                className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white"
                                                title="Enviar e-mail"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() => toggle(u)}
                                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
                                                title={u.isActive ? 'Desativar' : 'Reativar'}
                                            >
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
