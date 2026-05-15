import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Building2, ChevronDown, Power, Settings2, Sparkles, Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Badge, Button, Card, EmptyState, KPI, Modal, PageHeader, SectionTitle, Tabs,
} from './_ui';
import { gql, formatBRL, useQuery } from './_api';
import {
    SUPER_ADMIN_APPLY_BUSINESS_TEMPLATE_MUTATION,
    SUPER_ADMIN_BUSINESS_TEMPLATES_QUERY,
    SUPER_ADMIN_COMPANY_FEATURES_QUERY,
    SUPER_ADMIN_TOGGLE_COMPANY_MODULE_MUTATION,
} from '../../graphql/queries/feature-flags';
import { ModuleConfigModal } from './ModuleConfigModal';

// ============================================================
//   Tipos
// ============================================================

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

type CompanyFeature = {
    module_key: string;
    name: string;
    enabled: boolean;
    source: string; // 'plan' | 'override' | 'plan+override'
    permission: string[];
    hasConfig: boolean;
};

type BusinessTemplate = {
    id: string;
    template_key: string;
    name: string;
    description: string | null;
    icon: string | null;
    isActive: boolean;
    modules: { module_key: string; enabled: boolean }[];
};

const Q_COMPANY = `
  query SuperAdminCompanyOne($input: ListCompaniesInput) {
    superAdminCompanies(input: $input) {
      id name cnpj email phone logoUrl isActive
      plan usersCount revenue30d createdAt lastActivityAt
    }
  }
`;

const M_SET_ACTIVE = `
  mutation SetActive($id: ID!, $isActive: Boolean!) {
    superAdminSetCompanyActive(id: $id, isActive: $isActive)
  }
`;

// Categorias para agrupar visualmente os 38 módulos
const CATEGORIES: { key: string; label: string; modules: string[] }[] = [
    {
        key: 'bi',
        label: 'Visualização & BI',
        modules: ['dashboard', 'insights', 'reports', 'exports', 'timeline'],
    },
    {
        key: 'financial',
        label: 'Financeiro',
        modules: [
            'financials', 'cash_movement', 'accounts_payable', 'accounts_receivable',
            'recurring_bill', 'financial_account', 'bank', 'bank_integrations',
            'bank_transfer', 'boletos', 'payments', 'reconciliation', 'invoice',
        ],
    },
    {
        key: 'sales',
        label: 'Vendas & Operação',
        modules: [
            'order', 'customer', 'product', 'warehouse', 'category',
            'seller', 'opportunity', 'contract', 'delivery', 'driver',
        ],
    },
    {
        key: 'ai',
        label: 'IA & Mensageria',
        modules: ['ai_assistant', 'ai_credits', 'whatsapp', 'whatsapp_session', 'chatbot_typebot'],
    },
    {
        key: 'construction',
        label: 'Construção',
        modules: [
            'construction_obra', 'construction_orcamento',
            'construction_transacao', 'construction_centro_custo', 'construction_relatorios',
        ],
    },
];

// Mostra apenas estes botões "Configurar"
const CONFIGURABLE = new Set([
    'ai_assistant',
    'chatbot_typebot',
    'whatsapp',
    'whatsapp_session',
]);

// ============================================================
//   Página
// ============================================================

export function SuperAdminCompanyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'info' | 'modules'>('info');
    const [configFor, setConfigFor] = useState<string | null>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const { data: companyData, loading: companyLoading, refetch: refetchCompany } = useQuery<{
        superAdminCompanies: Company[];
    }>(Q_COMPANY, { input: { search: null } }, [id]);

    const company = (companyData?.superAdminCompanies ?? []).find((c) => c.id === id) ?? null;

    const { data: featuresData, loading: featuresLoading, refetch: refetchFeatures } =
        useQuery<{ superAdminCompanyFeatures: CompanyFeature[] }>(
            SUPER_ADMIN_COMPANY_FEATURES_QUERY,
            { companyId: id ?? '' },
            [id],
        );
    const features = featuresData?.superAdminCompanyFeatures ?? [];

    const enabledKeys = useMemo(
        () => new Set(features.filter((f) => f.enabled).map((f) => f.module_key)),
        [features],
    );
    const featuresByKey = useMemo(
        () => new Map(features.map((f) => [f.module_key, f])),
        [features],
    );

    const toggleActive = async () => {
        if (!company) return;
        if (!confirm(`${company.isActive ? 'Suspender' : 'Reativar'} ${company.name}?`)) return;
        try {
            await gql(M_SET_ACTIVE, { id: company.id, isActive: !company.isActive });
            toast.success(`Empresa ${company.isActive ? 'suspensa' : 'reativada'}`);
            void refetchCompany();
        } catch (e: any) { toast.error(e.message); }
    };

    const toggleModule = async (module_key: string, currentlyEnabled: boolean) => {
        try {
            await gql(SUPER_ADMIN_TOGGLE_COMPANY_MODULE_MUTATION, {
                input: { companyId: id, module_key, enabled: !currentlyEnabled },
            });
            toast.success(`Módulo ${module_key} ${currentlyEnabled ? 'desativado' : 'ativado'}`);
            void refetchFeatures();
        } catch (e: any) { toast.error(e.message); }
    };

    if (!id) return null;

    return (
        <div className="space-y-6 max-w-[1400px]">
            <button
                onClick={() => navigate('/super-admin/empresas')}
                className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-200 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para Empresas
            </button>

            <PageHeader
                title={company?.name ?? (companyLoading ? 'Carregando…' : 'Empresa não encontrada')}
                description={company ? `CNPJ ${company.cnpj ?? '—'} · ${company.email ?? 'sem e-mail'}` : undefined}
                actions={
                    company && (
                        <>
                            <Button
                                variant="secondary"
                                icon={Wand2}
                                onClick={() => setShowTemplateModal(true)}
                            >
                                Aplicar template
                            </Button>
                            <Button
                                variant={company.isActive ? 'danger' : 'primary'}
                                icon={Power}
                                onClick={toggleActive}
                            >
                                {company.isActive ? 'Suspender' : 'Reativar'}
                            </Button>
                        </>
                    )
                }
            />

            {company && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPI label="Status" value={company.isActive ? 'Ativa' : 'Suspensa'} accent={company.isActive ? 'emerald' : 'rose'} />
                    <KPI label="Plano" value={company.plan ?? '—'} accent="sky" />
                    <KPI label="Usuários" value={company.usersCount} icon={Building2} accent="violet" />
                    <KPI label="Receita 30d" value={formatBRL(company.revenue30d)} accent="amber" />
                </div>
            )}

            <Tabs<'info' | 'modules'>
                options={[
                    { value: 'info', label: 'Informações' },
                    { value: 'modules', label: 'Módulos' },
                ]}
                value={tab}
                onChange={setTab}
                counts={{ modules: enabledKeys.size }}
            />

            {tab === 'info' && company && (
                <Card>
                    <SectionTitle title="Dados cadastrais" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
                        <Row label="Razão social" value={company.name} />
                        <Row label="CNPJ" value={company.cnpj ?? '—'} mono />
                        <Row label="E-mail" value={company.email ?? '—'} />
                        <Row label="Telefone" value={company.phone ?? '—'} />
                        <Row label="Plano atual" value={company.plan ?? 'sem plano'} />
                        <Row label="Criada em" value={new Date(company.createdAt).toLocaleDateString('pt-BR')} mono />
                    </div>
                </Card>
            )}

            {tab === 'modules' && (
                <ModulesTab
                    loading={featuresLoading}
                    features={features}
                    featuresByKey={featuresByKey}
                    onToggle={toggleModule}
                    onConfigure={(mk) => setConfigFor(mk)}
                />
            )}

            {configFor && id && (
                <ModuleConfigModal
                    companyId={id}
                    module_key={configFor}
                    moduleName={featuresByKey.get(configFor)?.name ?? configFor}
                    onClose={() => { setConfigFor(null); void refetchFeatures(); }}
                />
            )}

            {showTemplateModal && id && (
                <ApplyTemplateModal
                    companyId={id}
                    onClose={() => setShowTemplateModal(false)}
                    onApplied={() => { setShowTemplateModal(false); void refetchFeatures(); }}
                />
            )}
        </div>
    );
}

// ============================================================
//   ModulesTab
// ============================================================

function ModulesTab({
    loading, features, featuresByKey, onToggle, onConfigure,
}: {
    loading: boolean;
    features: CompanyFeature[];
    featuresByKey: Map<string, CompanyFeature>;
    onToggle: (module_key: string, enabled: boolean) => void;
    onConfigure: (module_key: string) => void;
}) {
    if (loading && features.length === 0) {
        return (
            <Card><div className="text-center py-12 text-slate-500 text-[13px]">Carregando módulos…</div></Card>
        );
    }

    return (
        <div className="space-y-4">
            {CATEGORIES.map((cat) => (
                <Card key={cat.key}>
                    <SectionTitle title={cat.label} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {cat.modules.map((mk) => {
                            const f = featuresByKey.get(mk);
                            return (
                                <ModuleRow
                                    key={mk}
                                    module_key={mk}
                                    name={f?.name ?? prettify(mk)}
                                    enabled={f?.enabled ?? false}
                                    source={f?.source ?? 'off'}
                                    hasConfig={f?.hasConfig ?? false}
                                    configurable={CONFIGURABLE.has(mk)}
                                    onToggle={() => onToggle(mk, f?.enabled ?? false)}
                                    onConfigure={() => onConfigure(mk)}
                                />
                            );
                        })}
                    </div>
                </Card>
            ))}
        </div>
    );
}

function ModuleRow({
    name, module_key, enabled, source, hasConfig, configurable, onToggle, onConfigure,
}: {
    name: string;
    module_key: string;
    enabled: boolean;
    source: string;
    hasConfig: boolean;
    configurable: boolean;
    onToggle: () => void;
    onConfigure: () => void;
}) {
    const sourceTone =
        source === 'plan' ? 'sky' :
        source === 'override' ? 'amber' :
        source === 'plan+override' ? 'violet' :
        'slate';
    const sourceLabel =
        source === 'plan' ? 'do plano' :
        source === 'override' ? 'override' :
        source === 'plan+override' ? 'plano+override' :
        'desligado';

    return (
        <div className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${enabled ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-transparent border-white/[0.03]'}`}>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-semibold ${enabled ? 'text-white' : 'text-slate-500'}`}>{name}</span>
                    <Badge tone={enabled ? sourceTone as any : 'slate'}>{sourceLabel}</Badge>
                    {hasConfig && <Badge tone="emerald" icon={Settings2}>config</Badge>}
                </div>
                <div className="text-[10.5px] text-slate-600 mt-0.5 font-mono-num">{module_key}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {configurable && enabled && (
                    <button
                        onClick={onConfigure}
                        className="text-[11.5px] font-semibold text-rose-300 hover:text-rose-200 inline-flex items-center gap-1"
                    >
                        <Settings2 className="w-3 h-3" />
                        Configurar
                    </button>
                )}
                <ToggleSwitch enabled={enabled} onChange={onToggle} />
            </div>
        </div>
    );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-emerald-500/80' : 'bg-white/[0.08]'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
        </button>
    );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
            <span className="text-slate-500">{label}</span>
            <span className={`text-slate-200 ${mono ? 'font-mono-num text-[12px]' : ''}`}>{value}</span>
        </div>
    );
}

function prettify(mk: string) {
    return mk.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
//   ApplyTemplateModal
// ============================================================

function ApplyTemplateModal({
    companyId, onClose, onApplied,
}: {
    companyId: string;
    onClose: () => void;
    onApplied: () => void;
}) {
    const { data, loading } = useQuery<{ superAdminBusinessTemplates: BusinessTemplate[] }>(
        SUPER_ADMIN_BUSINESS_TEMPLATES_QUERY,
        undefined,
        [],
    );
    const templates = data?.superAdminBusinessTemplates ?? [];
    const [chosen, setChosen] = useState<string | null>(null);
    const [replace, setReplace] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const apply = async () => {
        if (!chosen) return toast.error('Escolha um template');
        if (replace && !confirm('Isso vai apagar TODOS os overrides existentes e substituir pelo template. Continuar?')) return;
        setSubmitting(true);
        try {
            await gql(SUPER_ADMIN_APPLY_BUSINESS_TEMPLATE_MUTATION, {
                input: { companyId, template_key: chosen, replaceExisting: replace },
            });
            toast.success('Template aplicado');
            onApplied();
        } catch (e: any) { toast.error(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Aplicar template de negócio"
            description="Liga os módulos típicos para o tipo de negócio escolhido. Você pode ajustar manualmente depois."
            size="lg"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={apply} disabled={!chosen || submitting} icon={Sparkles}>
                        {submitting ? 'Aplicando…' : 'Aplicar template'}
                    </Button>
                </>
            }
        >
            {loading ? (
                <div className="text-center py-8 text-slate-500 text-[13px]">Carregando templates…</div>
            ) : templates.length === 0 ? (
                <EmptyState
                    icon={Wand2}
                    title="Nenhum template ainda"
                    description="Cadastre um template via seed ou contate o time."
                />
            ) : (
                <div className="space-y-2">
                    {templates.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setChosen(t.template_key)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${chosen === t.template_key ? 'bg-rose-500/10 border-rose-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14]'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{t.icon ?? '🧩'}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-white">{t.name}</div>
                                    <div className="text-[11.5px] text-slate-500 mt-0.5">{t.description ?? '—'}</div>
                                    <div className="text-[10.5px] text-slate-600 mt-1 font-mono-num">
                                        {t.modules.length} módulos · {t.template_key}
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${chosen === t.template_key ? 'rotate-180 text-rose-300' : ''}`} />
                            </div>
                        </button>
                    ))}
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={replace}
                            onChange={(e) => setReplace(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-rose-500 focus:ring-rose-500/40"
                        />
                        <span className="text-[12px] text-slate-400">
                            Substituir overrides existentes (apaga e reaplica do zero)
                        </span>
                    </label>
                </div>
            )}
        </Modal>
    );
}
