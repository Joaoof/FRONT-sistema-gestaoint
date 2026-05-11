import { useMemo, useState } from 'react';
import {
    Boxes, Plus, Check, X, Eye, Edit3, Trash2, BookOpen, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Button, Card, PageHeader, KPI, EmptyState, Badge, Modal, Field, inputCls,
} from './_ui';
import { gql, useQuery } from './_api';

type Permission = 'READ' | 'WRITE';

type ModuleAdmin = { id: string; name: string; module_key: string; description: string | null };
type PlanModule = { id: string; moduleId: string; module_key: string; moduleName: string; permission: string[]; isActive: boolean };
type Plan = {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    companiesCount: number;
    modules: PlanModule[];
};

const Q_PLANS = `
  query SuperAdminPlans {
    superAdminPlans {
      id name description isActive createdAt companiesCount
      modules { id moduleId module_key moduleName permission isActive }
    }
    superAdminModules { id name module_key description }
  }
`;

const M_UPSERT_PERM = `
  mutation UpsertPlanModule($input: UpsertPlanModuleInput!) {
    superAdminUpsertPlanModule(input: $input)
  }
`;

const M_CREATE = `
  mutation CreatePlan($input: CreatePlanInput!) {
    superAdminCreatePlan(input: $input) {
      id name description isActive createdAt companiesCount
      modules { id moduleId module_key moduleName permission isActive }
    }
  }
`;

const M_DELETE = `mutation DeletePlan($planId: ID!) { superAdminDeletePlan(planId: $planId) }`;
const M_SET_ACTIVE = `mutation SetPlanActive($planId: ID!, $isActive: Boolean!) { superAdminSetPlanActive(planId: $planId, isActive: $isActive) }`;

export function SuperAdminPlans() {
    const { data, loading, refetch } = useQuery<{ superAdminPlans: Plan[]; superAdminModules: ModuleAdmin[] }>(Q_PLANS);
    const plans = data?.superAdminPlans ?? [];
    const modules = data?.superAdminModules ?? [];

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = useMemo(
        () => plans.find((p) => p.id === selectedId) ?? plans[0] ?? null,
        [plans, selectedId],
    );

    const [showNew, setShowNew] = useState(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const togglePermission = async (plan: Plan, module_key: string, perm: Permission) => {
        const current = plan.modules.find((m) => m.module_key === module_key)?.permission ?? [];
        const next = current.includes(perm) ? current.filter((x) => x !== perm) : [...current, perm];
        setSavingKey(`${plan.id}:${module_key}`);
        try {
            await gql(M_UPSERT_PERM, { input: { planId: plan.id, module_key, permission: next } });
            await refetch();
        } catch (e: any) { toast.error(e.message); }
        finally { setSavingKey(null); }
    };

    const handleDelete = async (planId: string) => {
        if (!confirm('Excluir este plano? Só funciona se nenhuma empresa estiver usando.')) return;
        try {
            await gql(M_DELETE, { planId });
            toast.success('Plano excluído');
            setSelectedId(null);
            void refetch();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleToggleActive = async (plan: Plan) => {
        try {
            await gql(M_SET_ACTIVE, { planId: plan.id, isActive: !plan.isActive });
            toast.success(plan.isActive ? 'Plano desativado' : 'Plano ativado');
            void refetch();
        } catch (e: any) { toast.error(e.message); }
    };

    const totalUsedByEnterprise = plans.find((p) => p.name === 'Enterprise')?.companiesCount ?? 0;
    const totalUsedByPro = plans.find((p) => p.name === 'Pro')?.companiesCount ?? 0;

    // Agrupa módulos por grupo derivado do module_key (heurística simples)
    const grouped = useMemo(() => {
        const out: Record<string, ModuleAdmin[]> = {};
        modules.forEach((m) => {
            const group = inferGroup(m.module_key);
            (out[group] ??= []).push(m);
        });
        return out;
    }, [modules]);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Planos & módulos"
                description="Defina o que cada plano libera e em qual permissão (somente leitura ou leitura + escrita)."
                actions={<Button icon={Plus} onClick={() => setShowNew(true)}>Novo plano</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Planos" value={loading ? '…' : plans.length} icon={Boxes} accent="emerald" />
                <KPI label="Módulos disponíveis" value={loading ? '…' : modules.length} icon={BookOpen} accent="sky" />
                <KPI label="Empresas no Pro" value={loading ? '…' : totalUsedByPro} accent="violet" />
                <KPI label="Empresas Enterprise" value={loading ? '…' : totalUsedByEnterprise} accent="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Lista de planos */}
                <div className="lg:col-span-4">
                    <Card padding={false}>
                        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                            <h2 className="font-display text-[14px] font-bold text-white">Planos cadastrados</h2>
                            <Badge>{plans.length}</Badge>
                        </div>
                        {loading ? (
                            <div className="p-5 space-y-3">
                                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/[0.04] rounded animate-pulse" />)}
                            </div>
                        ) : plans.length === 0 ? (
                            <EmptyState icon={Boxes} title="Nenhum plano cadastrado" action={<Button icon={Plus} onClick={() => setShowNew(true)}>Criar primeiro</Button>} />
                        ) : (
                            <div className="divide-y divide-white/[0.04]">
                                {plans.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedId(p.id)}
                                        className={`w-full text-left px-5 py-4 transition-colors ${
                                            selected?.id === p.id ? 'bg-rose-500/[0.05] border-l-2 border-rose-500' : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-display text-[14px] font-bold text-white">{p.name}</div>
                                            {!p.isActive && <Badge tone="slate">inativo</Badge>}
                                        </div>
                                        {p.description && <div className="text-[11.5px] text-slate-400 mt-1">{p.description}</div>}
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <Badge tone="emerald">{p.modules.length} módulos</Badge>
                                            <Badge tone="sky">{p.companiesCount} empresa{p.companiesCount !== 1 ? 's' : ''}</Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Matriz */}
                <div className="lg:col-span-8">
                    {!selected ? (
                        <Card><EmptyState icon={Boxes} title="Selecione um plano" description="Escolha um plano na lista pra ver e editar os módulos liberados." /></Card>
                    ) : (
                        <Card padding={false}>
                            <div className="px-5 py-4 border-b border-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-display text-[15px] font-bold text-white">{selected.name}</h2>
                                        {selected.description && <p className="text-[12px] text-slate-400 mt-0.5">{selected.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => handleToggleActive(selected)}>
                                            {selected.isActive ? 'Desativar' : 'Ativar'}
                                        </Button>
                                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(selected.id)}>
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-[11.5px] text-slate-400">
                                    <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-sky-500/30 border border-sky-500/40" /> <Eye className="w-3 h-3" /> READ — visualizar</div>
                                    <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" /> <Edit3 className="w-3 h-3" /> WRITE — criar/editar</div>
                                </div>
                            </div>

                            {modules.length === 0 ? (
                                <EmptyState
                                    icon={BookOpen}
                                    title="Nenhum módulo cadastrado"
                                    description="Cadastre os módulos no banco (tabela Module) ou rode o seed."
                                />
                            ) : (
                                <div>
                                    {Object.entries(grouped).map(([group, mods]) => (
                                        <div key={group}>
                                            <div className="px-5 py-2 bg-white/[0.02] text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500">{group}</div>
                                            {mods.map((m) => {
                                                const perms = selected.modules.find((pm) => pm.module_key === m.module_key)?.permission ?? [];
                                                const saving = savingKey === `${selected.id}:${m.module_key}`;
                                                return (
                                                    <div key={m.id} className="px-5 py-3 flex items-center gap-4 border-b border-white/[0.04] hover:bg-white/[0.01]">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[13px] font-semibold text-slate-200">{m.name}</div>
                                                            {m.description && <div className="text-[11px] text-slate-500 mt-0.5">{m.description}</div>}
                                                        </div>
                                                        <PermissionToggle
                                                            active={perms.includes('READ')}
                                                            onToggle={() => togglePermission(selected, m.module_key, 'READ')}
                                                            label="READ"
                                                            icon={Eye}
                                                            tone="sky"
                                                            disabled={saving}
                                                        />
                                                        <PermissionToggle
                                                            active={perms.includes('WRITE')}
                                                            onToggle={() => togglePermission(selected, m.module_key, 'WRITE')}
                                                            label="WRITE"
                                                            icon={Edit3}
                                                            tone="emerald"
                                                            disabled={saving}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            <NewPlanModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); void refetch(); }} />
        </div>
    );
}

function PermissionToggle({
    active, onToggle, label, icon: Icon, tone, disabled,
}: {
    active: boolean; onToggle: () => void; label: string; disabled?: boolean;
    icon: React.ComponentType<{ className?: string }>; tone: 'sky' | 'emerald';
}) {
    const cls = active
        ? tone === 'sky' ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
        : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]';
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md border text-[11px] font-bold transition-all disabled:opacity-50 disabled:cursor-wait ${cls}`}
        >
            <Icon className="w-3 h-3" />
            {label}
            {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
        </button>
    );
}

function NewPlanModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (!name.trim()) return toast.error('Nome obrigatório');
        setSubmitting(true);
        try {
            await gql(M_CREATE, { input: { name: name.trim(), description: description.trim() || null } });
            toast.success('Plano criado');
            setName(''); setDescription('');
            onCreated();
        } catch (e: any) { toast.error(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Novo plano"
            description="Crie o plano e depois ative os módulos na matriz."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={submit} disabled={submitting}>{submitting ? 'Criando…' : 'Criar plano'}</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Nome do plano" required><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ex: Pro Plus" /></Field>
                <Field label="Descrição"><input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Para quem é esse plano?" /></Field>
            </div>
        </Modal>
    );
}

function inferGroup(module_key: string): string {
    const k = module_key.toLowerCase();
    if (['dashboard'].includes(k)) return 'Núcleo';
    if (['products', 'inventory', 'warehouses'].includes(k)) return 'Estoque';
    if (['sales', 'crm', 'orders'].includes(k)) return 'Vendas';
    if (['ar', 'ap', 'cash', 'banks', 'boletos', 'webhooks', 'reconciliation'].includes(k)) return 'Financeiro';
    if (['invoices', 'fiscal_config'].includes(k)) return 'Fiscal';
    if (['whatsapp', 'communications', 'notifications'].includes(k)) return 'Comunicações';
    if (['ai', 'ai_credits', 'ai_studio'].includes(k)) return 'IA';
    if (['reports'].includes(k)) return 'Análise';
    if (['audit', 'security'].includes(k)) return 'Compliance';
    return 'Outros';
}
