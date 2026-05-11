import { useMemo, useState } from 'react';
import {
    Boxes, Plus, Check, X, Eye, Edit3, Trash2, BookOpen, Pencil,
} from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, EmptyState, Badge, Modal, Field, inputCls,
} from './_ui';

type Permission = 'READ' | 'WRITE';

type ModuleDef = {
    key: string;
    name: string;
    description: string;
    group: string;
};

type Plan = {
    id: string;
    name: string;
    description: string;
    price: number;
    isActive: boolean;
    companies: number;
    modules: Record<string, Permission[]>; // module_key -> permissions
};

const ALL_MODULES: ModuleDef[] = [
    { key: 'dashboard', name: 'Dashboard', description: 'Visão geral e KPIs', group: 'Núcleo' },
    { key: 'products', name: 'Produtos', description: 'Cadastro e gestão de produtos', group: 'Estoque' },
    { key: 'inventory', name: 'Estoque', description: 'Movimentações e depósitos', group: 'Estoque' },
    { key: 'sales', name: 'Vendas', description: 'PDV e ordens de venda', group: 'Vendas' },
    { key: 'crm', name: 'CRM', description: 'Pipeline de oportunidades', group: 'Vendas' },
    { key: 'orders', name: 'Pedidos', description: 'Pedidos de venda e entrega', group: 'Vendas' },
    { key: 'ar', name: 'Contas a Receber', description: 'Recebimentos e baixas', group: 'Financeiro' },
    { key: 'ap', name: 'Contas a Pagar', description: 'Pagamentos e fornecedores', group: 'Financeiro' },
    { key: 'cash', name: 'Movimentações de caixa', description: 'Entradas e saídas', group: 'Financeiro' },
    { key: 'banks', name: 'Bancos', description: 'Contas bancárias e conciliação', group: 'Financeiro' },
    { key: 'boletos', name: 'Boletos', description: 'Geração e cobrança', group: 'Financeiro' },
    { key: 'webhooks', name: 'Webhooks bancários', description: 'PIX e boleto em tempo real', group: 'Financeiro' },
    { key: 'invoices', name: 'Notas fiscais', description: 'NF-e e NFC-e', group: 'Fiscal' },
    { key: 'fiscal_config', name: 'Configuração fiscal', description: 'Certificado A1, CSC', group: 'Fiscal' },
    { key: 'whatsapp', name: 'WhatsApp', description: 'Envio via Evolution', group: 'Comunicações' },
    { key: 'communications', name: 'Centro de mensagens', description: 'Notificações e templates', group: 'Comunicações' },
    { key: 'ai', name: 'IA Studio', description: 'Assistente, agente, insights', group: 'IA' },
    { key: 'reports', name: 'Relatórios', description: 'Geração de relatórios', group: 'Análise' },
    { key: 'audit', name: 'Auditoria', description: 'Log de ações sensíveis', group: 'Compliance' },
];

const INITIAL_PLANS: Plan[] = [
    {
        id: '1', name: 'Starter', description: 'Para pequenos negócios começando', price: 99, isActive: true, companies: 4,
        modules: {
            dashboard: ['READ'], products: ['READ', 'WRITE'], inventory: ['READ', 'WRITE'],
            sales: ['READ', 'WRITE'], ar: ['READ', 'WRITE'], ap: ['READ', 'WRITE'], cash: ['READ', 'WRITE'],
        },
    },
    {
        id: '2', name: 'Pro', description: 'Para empresas em crescimento', price: 299, isActive: true, companies: 12,
        modules: Object.fromEntries(ALL_MODULES.slice(0, 13).map((m) => [m.key, ['READ', 'WRITE'] as Permission[]])),
    },
    {
        id: '3', name: 'Enterprise', description: 'Recursos completos + suporte dedicado', price: 999, isActive: true, companies: 3,
        modules: Object.fromEntries(ALL_MODULES.map((m) => [m.key, ['READ', 'WRITE'] as Permission[]])),
    },
];

export function SuperAdminPlans() {
    const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
    const [selected, setSelected] = useState<Plan | null>(INITIAL_PLANS[0]);
    const [showNew, setShowNew] = useState(false);

    const togglePermission = (planId: string, moduleKey: string, perm: Permission) => {
        setPlans((prev) => prev.map((p) => {
            if (p.id !== planId) return p;
            const current = p.modules[moduleKey] ?? [];
            const next = current.includes(perm)
                ? current.filter((x) => x !== perm)
                : [...current, perm];
            const modules = { ...p.modules };
            if (next.length === 0) delete modules[moduleKey];
            else modules[moduleKey] = next;
            return { ...p, modules };
        }));
        setSelected((s) => {
            if (!s || s.id !== planId) return s;
            const current = s.modules[moduleKey] ?? [];
            const next = current.includes(perm) ? current.filter((x) => x !== perm) : [...current, perm];
            const modules = { ...s.modules };
            if (next.length === 0) delete modules[moduleKey];
            else modules[moduleKey] = next;
            return { ...s, modules };
        });
    };

    const grouped = useMemo(() => {
        const out: Record<string, ModuleDef[]> = {};
        ALL_MODULES.forEach((m) => { (out[m.group] ??= []).push(m); });
        return out;
    }, []);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Planos & módulos"
                description="Defina o que cada plano libera e em qual permissão (somente leitura ou leitura + escrita)."
                actions={<Button icon={Plus} onClick={() => setShowNew(true)}>Novo plano</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Planos" value={plans.length} icon={Boxes} accent="emerald" />
                <KPI label="Módulos disponíveis" value={ALL_MODULES.length} icon={BookOpen} accent="sky" />
                <KPI label="Empresas no Pro" value={plans.find((p) => p.name === 'Pro')?.companies ?? 0} accent="violet" />
                <KPI label="Empresas Enterprise" value={plans.find((p) => p.name === 'Enterprise')?.companies ?? 0} accent="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Plans list */}
                <div className="lg:col-span-4">
                    <Card padding={false}>
                        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                            <h2 className="font-display text-[14px] font-bold text-white">Planos cadastrados</h2>
                            <Badge>{plans.length}</Badge>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                            {plans.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelected(p)}
                                    className={`w-full text-left px-5 py-4 transition-colors ${
                                        selected?.id === p.id ? 'bg-rose-500/[0.05] border-l-2 border-rose-500' : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-display text-[14px] font-bold text-white">{p.name}</div>
                                        <div className="text-[13px] font-mono-num font-bold text-rose-300">R$ {p.price}<span className="text-[10px] text-slate-500 font-sans">/mês</span></div>
                                    </div>
                                    <div className="text-[11.5px] text-slate-400 mt-1">{p.description}</div>
                                    <div className="flex items-center gap-2 mt-2.5">
                                        <Badge tone="emerald">{Object.keys(p.modules).length} módulos</Badge>
                                        <Badge tone="sky">{p.companies} empresas</Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Module matrix */}
                <div className="lg:col-span-8">
                    {selected ? (
                        <Card padding={false}>
                            <div className="px-5 py-4 border-b border-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-display text-[15px] font-bold text-white">{selected.name}</h2>
                                        <p className="text-[12px] text-slate-400 mt-0.5">{selected.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="ghost" icon={Pencil}>Editar</Button>
                                        <Button size="sm" variant="danger" icon={Trash2}>Excluir</Button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-[11.5px] text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block w-3 h-3 rounded bg-sky-500/30 border border-sky-500/40" />
                                        <span><Eye className="w-3 h-3 inline -mt-0.5" /> READ — visualizar</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-block w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />
                                        <span><Edit3 className="w-3 h-3 inline -mt-0.5" /> WRITE — criar/editar</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {Object.entries(grouped).map(([group, mods]) => (
                                    <div key={group}>
                                        <div className="px-5 py-2 bg-white/[0.02] text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                            {group}
                                        </div>
                                        {mods.map((m) => {
                                            const perms = selected.modules[m.key] ?? [];
                                            return (
                                                <div key={m.key} className="px-5 py-3 flex items-center gap-4 border-b border-white/[0.04] hover:bg-white/[0.01]">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[13px] font-semibold text-slate-200">{m.name}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">{m.description}</div>
                                                    </div>
                                                    <PermissionToggle
                                                        active={perms.includes('READ')}
                                                        onToggle={() => togglePermission(selected.id, m.key, 'READ')}
                                                        label="READ"
                                                        icon={Eye}
                                                        tone="sky"
                                                    />
                                                    <PermissionToggle
                                                        active={perms.includes('WRITE')}
                                                        onToggle={() => togglePermission(selected.id, m.key, 'WRITE')}
                                                        label="WRITE"
                                                        icon={Edit3}
                                                        tone="emerald"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <EmptyState
                                icon={Boxes}
                                title="Selecione um plano"
                                description="Escolha um plano na lista pra ver e editar os módulos liberados."
                            />
                        </Card>
                    )}
                </div>
            </div>

            <NewPlanModal open={showNew} onClose={() => setShowNew(false)} />
        </div>
    );
}

function PermissionToggle({
    active, onToggle, label, icon: Icon, tone,
}: {
    active: boolean;
    onToggle: () => void;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: 'sky' | 'emerald';
}) {
    const cls = active
        ? tone === 'sky'
            ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
        : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]';
    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md border text-[11px] font-bold transition-all ${cls}`}
            type="button"
        >
            <Icon className="w-3 h-3" />
            {label}
            {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
        </button>
    );
}

function NewPlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Novo plano"
            description="Defina nome, preço e os módulos que esse plano libera"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button>Criar plano</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Field label="Nome do plano" required><input className={inputCls} placeholder="Ex: Pro Plus" /></Field>
                <Field label="Descrição"><input className={inputCls} placeholder="Para quem é esse plano?" /></Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Preço mensal (R$)" required><input type="number" className={inputCls} placeholder="299" /></Field>
                    <Field label="Status">
                        <select className={inputCls}><option>Ativo</option><option>Inativo</option></select>
                    </Field>
                </div>
            </div>
        </Modal>
    );
}
