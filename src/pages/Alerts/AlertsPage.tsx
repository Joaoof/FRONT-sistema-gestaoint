import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    AlertCircle,
    Bell,
    BellOff,
    CheckCircle2,
    Clock,
    Info,
    Mail,
    MessageCircle,
    Plus,
    Settings,
    Smartphone,
    Trash2,
    X,
    Zap,
    Wallet,
    Landmark,
    Target,
    Activity,
    TrendingDown,
    ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GET_CASH_MOVEMENTS } from '../../graphql/queries/queries';
import { GET_BANKS } from '../../graphql/queries/banks';
import { formatCurrency } from '../../utils/formatValue';

// =====================================================================
// CONFIG TYPES
// =====================================================================

type Severity = 'critical' | 'warning' | 'info';
type Channel = 'inapp' | 'whatsapp' | 'email' | 'push';

const CHANNEL_META: Record<Channel, { label: string; icon: any; available: boolean; helper?: string }> = {
    inapp: { label: 'No sistema', icon: Bell, available: true, helper: 'Sino + toast' },
    whatsapp: { label: 'WhatsApp', icon: MessageCircle, available: true, helper: 'Mensagem ao número cadastrado' },
    email: { label: 'E-mail', icon: Mail, available: false, helper: 'Em breve' },
    push: { label: 'Push do navegador', icon: Smartphone, available: false, helper: 'Em breve' },
};

interface AlertRule {
    id: string;
    label: string;
    description: string;
    icon: any;
    category: 'caixa' | 'banco' | 'metas' | 'atividade';
    severity: Severity;
    enabled: boolean;
    threshold?: number;
    thresholdLabel?: string;
    thresholdSuffix?: string;
    channels: Channel[];
    cooldownMin: number;
}

const DEFAULT_RULES: AlertRule[] = [
    {
        id: 'saldo_negativo',
        label: 'Saldo negativo do dia',
        description: 'Disparado quando o saldo do dia (entradas − saídas) fica abaixo de zero.',
        icon: TrendingDown,
        category: 'caixa',
        severity: 'critical',
        enabled: true,
        channels: ['inapp', 'whatsapp'],
        cooldownMin: 120,
    },
    {
        id: 'banco_baixo',
        label: 'Saldo baixo no banco',
        description: 'Quando qualquer banco fica com saldo líquido abaixo do limite definido.',
        icon: Landmark,
        category: 'banco',
        severity: 'warning',
        enabled: true,
        threshold: 100,
        thresholdLabel: 'Limite mínimo',
        thresholdSuffix: 'R$',
        channels: ['inapp'],
        cooldownMin: 60,
    },
    {
        id: 'banco_negativo',
        label: 'Banco negativo',
        description: 'Quando um banco específico fica com saldo negativo.',
        icon: Wallet,
        category: 'banco',
        severity: 'critical',
        enabled: true,
        channels: ['inapp', 'whatsapp'],
        cooldownMin: 120,
    },
    {
        id: 'meta_diaria',
        label: 'Meta diária não atingida',
        description: 'Avisa às 18h se a meta diária de receita não foi atingida.',
        icon: Target,
        category: 'metas',
        severity: 'info',
        enabled: false,
        threshold: 1000,
        thresholdLabel: 'Meta de entradas',
        thresholdSuffix: 'R$',
        channels: ['inapp'],
        cooldownMin: 1440,
    },
    {
        id: 'meta_mensal',
        label: 'Meta mensal em risco',
        description: 'Quando a projeção do mês fica abaixo da meta com 10 dias ou menos restantes.',
        icon: Target,
        category: 'metas',
        severity: 'warning',
        enabled: false,
        threshold: 30000,
        thresholdLabel: 'Meta mensal',
        thresholdSuffix: 'R$',
        channels: ['inapp', 'whatsapp'],
        cooldownMin: 1440,
    },
    {
        id: 'mov_grande',
        label: 'Movimentação acima do esperado',
        description: 'Detecta lançamentos com valor anormalmente alto (acima do limite definido).',
        icon: Zap,
        category: 'atividade',
        severity: 'info',
        enabled: true,
        threshold: 5000,
        thresholdLabel: 'A partir de',
        thresholdSuffix: 'R$',
        channels: ['inapp'],
        cooldownMin: 0,
    },
    {
        id: 'caixa_parado',
        label: 'Caixa sem movimentação',
        description: 'Quando o caixa fica sem nenhum lançamento por mais de X horas durante o expediente.',
        icon: Activity,
        category: 'atividade',
        severity: 'info',
        enabled: false,
        threshold: 4,
        thresholdLabel: 'Horas sem atividade',
        thresholdSuffix: 'h',
        channels: ['inapp'],
        cooldownMin: 240,
    },
];

const STORAGE_KEY = 'alerts_config_v1';
const DISMISSED_KEY = 'alerts_dismissed_v1';
const HISTORY_KEY = 'alerts_history_v1';

interface FiredAlert {
    id: string;
    ruleId: string;
    ruleLabel: string;
    severity: Severity;
    title: string;
    detail: string;
    firedAt: string;
}

const CATEGORY_LABEL: Record<AlertRule['category'], string> = {
    caixa: 'Caixa',
    banco: 'Bancos',
    metas: 'Metas',
    atividade: 'Atividade',
};

// =====================================================================
// MAIN
// =====================================================================

export function AlertsPage() {
    const navigate = useNavigate();

    const [rules, setRules] = useState<AlertRule[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return DEFAULT_RULES;
            const saved = JSON.parse(raw) as Partial<AlertRule>[];
            // merge with defaults to keep new rules from updates
            return DEFAULT_RULES.map((d) => {
                const found = saved.find((s) => s.id === d.id);
                return found ? { ...d, ...found, icon: d.icon } : d;
            });
        } catch {
            return DEFAULT_RULES;
        }
    });

    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        try {
            const raw = localStorage.getItem(DISMISSED_KEY);
            if (!raw) return new Set();
            const arr = JSON.parse(raw) as string[];
            return new Set(arr);
        } catch {
            return new Set();
        }
    });

    const [history, setHistory] = useState<FiredAlert[]>(() => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (!raw) return [];
            return JSON.parse(raw) as FiredAlert[];
        } catch {
            return [];
        }
    });

    // persist
    useEffect(() => {
        try {
            // strip icons before saving
            const stripped = rules.map(({ icon, ...r }) => r);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
        } catch { /* ok */ }
    }, [rules]);
    useEffect(() => {
        try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(dismissed))); } catch { /* ok */ }
    }, [dismissed]);
    useEffect(() => {
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))); } catch { /* ok */ }
    }, [history]);

    // fetch live data
    const { data: movesData } = useQuery(GET_CASH_MOVEMENTS, { fetchPolicy: 'cache-and-network', pollInterval: 60000 });
    const { data: banksData } = useQuery(GET_BANKS, { fetchPolicy: 'cache-and-network' });
    const allMoves = (movesData?.cashMovements ?? []) as Array<{
        id: string; type: 'ENTRY' | 'EXIT'; value: number; description: string; date: string; bankId?: string | null;
    }>;
    const banks = (banksData?.banks ?? []) as Array<{ id: string; name: string; corHex: string }>;

    // ============= compute live alerts =============
    const liveAlerts = useMemo(() => {
        const fired: FiredAlert[] = [];
        const now = new Date();
        const todayKey = now.toISOString().slice(0, 10);

        // saldo negativo do dia
        const ruleSN = rules.find((r) => r.id === 'saldo_negativo');
        if (ruleSN?.enabled) {
            const todayMoves = allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === todayKey);
            const e = todayMoves.filter((m) => m.type === 'ENTRY').reduce((a, b) => a + Number(b.value), 0);
            const s = todayMoves.filter((m) => m.type === 'EXIT').reduce((a, b) => a + Number(b.value), 0);
            const balance = e - s;
            if (balance < 0) {
                fired.push({
                    id: `saldo_negativo_${todayKey}`,
                    ruleId: ruleSN.id,
                    ruleLabel: ruleSN.label,
                    severity: ruleSN.severity,
                    title: 'Saldo do dia ficou negativo',
                    detail: `Hoje você tem ${formatCurrency(s - e)} a mais em saídas que em entradas (${formatCurrency(balance)}).`,
                    firedAt: now.toISOString(),
                });
            }
        }

        // banco baixo / negativo
        const ruleBL = rules.find((r) => r.id === 'banco_baixo');
        const ruleBN = rules.find((r) => r.id === 'banco_negativo');
        const bankBalance = new Map<string, number>();
        for (const m of allMoves) {
            if (!m.bankId) continue;
            bankBalance.set(m.bankId, (bankBalance.get(m.bankId) ?? 0) + (m.type === 'ENTRY' ? Number(m.value) : -Number(m.value)));
        }
        for (const [bankId, total] of bankBalance.entries()) {
            const b = banks.find((x) => x.id === bankId);
            if (!b) continue;
            if (ruleBN?.enabled && total < 0) {
                fired.push({
                    id: `banco_negativo_${bankId}`,
                    ruleId: ruleBN.id,
                    ruleLabel: ruleBN.label,
                    severity: ruleBN.severity,
                    title: `${b.name} está negativo`,
                    detail: `Saldo líquido ${formatCurrency(total)}.`,
                    firedAt: now.toISOString(),
                });
            } else if (ruleBL?.enabled && total >= 0 && total < (ruleBL.threshold ?? 0)) {
                fired.push({
                    id: `banco_baixo_${bankId}`,
                    ruleId: ruleBL.id,
                    ruleLabel: ruleBL.label,
                    severity: ruleBL.severity,
                    title: `${b.name} com saldo baixo`,
                    detail: `Saldo de ${formatCurrency(total)} (limite ${formatCurrency(ruleBL.threshold ?? 0)}).`,
                    firedAt: now.toISOString(),
                });
            }
        }

        // movimentação grande hoje
        const ruleMG = rules.find((r) => r.id === 'mov_grande');
        if (ruleMG?.enabled) {
            const todayMoves = allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === todayKey);
            const big = todayMoves.filter((m) => Number(m.value) >= (ruleMG.threshold ?? Infinity));
            for (const m of big) {
                fired.push({
                    id: `mov_grande_${m.id}`,
                    ruleId: ruleMG.id,
                    ruleLabel: ruleMG.label,
                    severity: ruleMG.severity,
                    title: `Movimentação ${m.type === 'ENTRY' ? 'de entrada' : 'de saída'} alta`,
                    detail: `${m.description} — ${formatCurrency(Number(m.value))}`,
                    firedAt: m.date,
                });
            }
        }

        // caixa parado
        const ruleCP = rules.find((r) => r.id === 'caixa_parado');
        if (ruleCP?.enabled && allMoves.length > 0) {
            const sorted = [...allMoves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const last = sorted[0];
            const hoursAgo = (Date.now() - new Date(last.date).getTime()) / 3600000;
            const hour = now.getHours();
            const isExpediente = hour >= 8 && hour < 18;
            if (isExpediente && hoursAgo >= (ruleCP.threshold ?? 4)) {
                fired.push({
                    id: `caixa_parado_${todayKey}_${Math.floor(hoursAgo)}`,
                    ruleId: ruleCP.id,
                    ruleLabel: ruleCP.label,
                    severity: ruleCP.severity,
                    title: 'Caixa sem movimentação',
                    detail: `Última movimentação há ${hoursAgo.toFixed(1)}h.`,
                    firedAt: now.toISOString(),
                });
            }
        }

        // meta diária
        const ruleMD = rules.find((r) => r.id === 'meta_diaria');
        if (ruleMD?.enabled && now.getHours() >= 18) {
            const todayMoves = allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === todayKey);
            const e = todayMoves.filter((m) => m.type === 'ENTRY').reduce((a, b) => a + Number(b.value), 0);
            if (e < (ruleMD.threshold ?? 0)) {
                fired.push({
                    id: `meta_diaria_${todayKey}`,
                    ruleId: ruleMD.id,
                    ruleLabel: ruleMD.label,
                    severity: ruleMD.severity,
                    title: 'Meta diária não atingida',
                    detail: `Entradas hoje: ${formatCurrency(e)} (meta ${formatCurrency(ruleMD.threshold ?? 0)}).`,
                    firedAt: now.toISOString(),
                });
            }
        }

        return fired.filter((f) => !dismissed.has(f.id));
    }, [allMoves, banks, rules, dismissed]);

    // adiciona ao histórico (apenas novos)
    useEffect(() => {
        if (liveAlerts.length === 0) return;
        setHistory((h) => {
            const knownIds = new Set(h.map((x) => x.id));
            const newOnes = liveAlerts.filter((a) => !knownIds.has(a.id));
            if (newOnes.length === 0) return h;
            return [...newOnes, ...h].slice(0, 50);
        });
    }, [liveAlerts]);

    const enabledCount = rules.filter((r) => r.enabled).length;
    const activeCount = liveAlerts.length;
    const criticalCount = liveAlerts.filter((a) => a.severity === 'critical').length;

    const setRule = (id: string, patch: Partial<AlertRule>) => {
        setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const dismissAlert = (id: string) => {
        setDismissed((s) => new Set(s).add(id));
    };

    const clearDismissed = () => setDismissed(new Set());

    const grouped = useMemo(() => {
        const map: Record<AlertRule['category'], AlertRule[]> = { caixa: [], banco: [], metas: [], atividade: [] };
        for (const r of rules) map[r.category].push(r);
        return map;
    }, [rules]);

    const [openCategory, setOpenCategory] = useState<Record<string, boolean>>({ caixa: true, banco: true, metas: true, atividade: true });

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-12">
            {/* HEADER */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        Notificações & monitoramento
                    </p>
                    <h1 className="mt-2 text-[32px] sm:text-[36px] font-semibold text-slate-900 dark:text-white tracking-[-0.02em] leading-[1.05]">
                        Alertas
                    </h1>
                    <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                        Configure o que deve te avisar e por onde · {enabledCount} regra(s) ativa(s) ·
                        <span className={activeCount > 0 ? 'text-rose-600 dark:text-rose-400 ml-1' : 'text-emerald-600 dark:text-emerald-400 ml-1'}>
                            {activeCount === 0 ? 'tudo tranquilo' : `${activeCount} disparado(s) agora`}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {dismissed.size > 0 && (
                        <button
                            onClick={clearDismissed}
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 rounded-md transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Restaurar {dismissed.size} dispensados
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/movimentacoes')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-md shadow-sm transition-colors"
                    >
                        <Activity className="w-3.5 h-3.5" />
                        Ir para o painel
                    </button>
                </div>
            </header>

            {/* OVERALL STATUS */}
            <div className={`mb-6 p-5 rounded-xl border ${
                criticalCount > 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40' :
                activeCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' :
                'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
            }`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="relative flex w-3 h-3">
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                                criticalCount > 0 ? 'bg-rose-500' : activeCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <span className={`relative inline-flex w-3 h-3 rounded-full ${
                                criticalCount > 0 ? 'bg-rose-500' : activeCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                        </span>
                        <div>
                            <p className={`text-[15px] font-semibold ${
                                criticalCount > 0 ? 'text-rose-700 dark:text-rose-300' :
                                activeCount > 0 ? 'text-amber-700 dark:text-amber-300' :
                                'text-emerald-700 dark:text-emerald-300'
                            }`}>
                                {criticalCount > 0 ? 'Atenção crítica necessária' :
                                 activeCount > 0 ? `${activeCount} alerta(s) ativo(s)` :
                                 'Tudo sob controle'}
                            </p>
                            <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-0.5">
                                {criticalCount > 0 && `${criticalCount} crítico(s) · `}
                                {activeCount === 0 && 'Nenhum alerta disparado no momento.'}
                                {activeCount > 0 && `Última verificação ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-[12px]">
                        <KPI label="Ativos" value={activeCount} color={activeCount > 0 ? 'rose' : 'slate'} />
                        <KPI label="Configurados" value={enabledCount} color="slate" />
                        <KPI label="Total no histórico" value={history.length} color="slate" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: ACTIVE ALERTS + CONFIG */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active alerts */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <div>
                                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Alertas ativos</h2>
                                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Disparados agora com base nos dados em tempo real</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                activeCount > 0 ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            }`}>
                                {activeCount}
                            </span>
                        </div>
                        {liveAlerts.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                                <p className="text-[14px] font-medium text-slate-900 dark:text-white">Nenhum alerta no momento</p>
                                <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">As regras ativas não dispararam.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                                <AnimatePresence>
                                    {liveAlerts.map((a) => (
                                        <motion.li
                                            key={a.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <SeverityIcon sev={a.severity} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{a.title}</p>
                                                    <span className="text-[11px] text-slate-400 shrink-0">
                                                        {new Date(a.firedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{a.detail}</p>
                                                <p className="text-[10.5px] text-slate-400 mt-1.5 uppercase tracking-wider">{a.ruleLabel}</p>
                                            </div>
                                            <button
                                                onClick={() => dismissAlert(a.id)}
                                                className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                                                title="Dispensar"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )}
                    </section>

                    {/* Configuration */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5" /> Regras de alerta
                            </h2>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Configure quais alertas ficam ativos e em quais canais você é notificado</p>
                        </div>

                        {(Object.keys(grouped) as AlertRule['category'][]).map((cat) => {
                            const items = grouped[cat];
                            if (items.length === 0) return null;
                            const isOpen = openCategory[cat];
                            return (
                                <div key={cat} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                                    <button
                                        onClick={() => setOpenCategory((s) => ({ ...s, [cat]: !s[cat] }))}
                                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">{CATEGORY_LABEL[cat]}</p>
                                            <span className="text-[11px] text-slate-400 tabular-nums">{items.filter((i) => i.enabled).length}/{items.length} ativas</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-3 space-y-2">
                                                    {items.map((r) => (
                                                        <RuleRow key={r.id} rule={r} onChange={(patch) => setRule(r.id, patch)} />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </section>
                </div>

                {/* RIGHT: HISTORY + HELP */}
                <div className="space-y-6">
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Histórico
                            </h2>
                            {history.length > 0 && (
                                <button
                                    onClick={() => setHistory([])}
                                    className="text-[11px] text-slate-500 hover:text-rose-600"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <p className="px-5 py-12 text-center text-[12.5px] text-slate-500 dark:text-slate-400">Nenhum alerta disparado ainda</p>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-white/[0.04] max-h-[460px] overflow-y-auto">
                                {history.slice(0, 30).map((h) => (
                                    <li key={h.id + h.firedAt} className="px-5 py-2.5">
                                        <div className="flex items-start gap-2">
                                            <SeverityDot sev={h.severity} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{h.title}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{h.detail}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                                                    {new Date(h.firedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Channels overview */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Canais</h2>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Por onde os alertas podem ser entregues</p>
                        </div>
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                                const meta = CHANNEL_META[c];
                                const Icon = meta.icon;
                                return (
                                    <li key={c} className="px-5 py-3 flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-md grid place-items-center shrink-0 ${meta.available ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-400'}`}>
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-white">{meta.label}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{meta.helper}</p>
                                        </div>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${meta.available ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500'}`}>
                                            {meta.available ? 'Disponível' : 'Em breve'}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* Help */}
                    <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-3.5 h-3.5" />
                            <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-60">Como funciona</span>
                        </div>
                        <p className="text-[12.5px] leading-relaxed opacity-90">
                            Os alertas são calculados em tempo real com base nas suas movimentações e bancos.
                            Configurações ficam salvas no seu navegador. Para receber por <strong>WhatsApp</strong>,
                            seu número precisa estar cadastrado em <button onClick={() => navigate('/configuracoes')} className="underline-offset-2 underline">Configurações</button>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =====================================================================
// SUB COMPONENTS
// =====================================================================

function RuleRow({ rule, onChange }: { rule: AlertRule; onChange: (patch: Partial<AlertRule>) => void }) {
    const Icon = rule.icon;
    return (
        <div className={`p-3 rounded-lg border transition-all ${rule.enabled ? 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] opacity-70'}`}>
            <div className="flex items-start gap-3">
                <span className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                    rule.severity === 'critical' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                    rule.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'
                }`}>
                    <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                        <div>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{rule.label}</p>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{rule.description}</p>
                        </div>
                        <Toggle on={rule.enabled} onChange={(v) => onChange({ enabled: v })} />
                    </div>

                    {rule.enabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04] space-y-3"
                        >
                            {rule.threshold !== undefined && (
                                <div className="flex items-center gap-2">
                                    <label className="text-[11.5px] text-slate-600 dark:text-slate-300 min-w-[120px]">{rule.thresholdLabel ?? 'Limite'}</label>
                                    <div className="relative flex-1 max-w-[200px]">
                                        {rule.thresholdSuffix === 'R$' && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11.5px] text-slate-400 pointer-events-none">R$</span>}
                                        <input
                                            type="number"
                                            value={rule.threshold}
                                            onChange={(e) => onChange({ threshold: Number(e.target.value) })}
                                            className={`w-full h-8 ${rule.thresholdSuffix === 'R$' ? 'pl-9' : 'pl-2.5'} pr-2.5 text-[12.5px] tabular-nums font-mono border border-slate-200 dark:border-white/[0.08] rounded-md bg-white dark:bg-slate-950 focus:outline-none focus:border-slate-400 dark:focus:border-white/30`}
                                        />
                                        {rule.thresholdSuffix && rule.thresholdSuffix !== 'R$' && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11.5px] text-slate-400 pointer-events-none">{rule.thresholdSuffix}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <label className="text-[11.5px] text-slate-600 dark:text-slate-300 min-w-[120px]">Cooldown</label>
                                <select
                                    value={rule.cooldownMin}
                                    onChange={(e) => onChange({ cooldownMin: Number(e.target.value) })}
                                    className="h-8 px-2 text-[12.5px] border border-slate-200 dark:border-white/[0.08] rounded-md bg-white dark:bg-slate-950"
                                >
                                    <option value={0}>Sempre disparar</option>
                                    <option value={30}>30 minutos</option>
                                    <option value={60}>1 hora</option>
                                    <option value={120}>2 horas</option>
                                    <option value={240}>4 horas</option>
                                    <option value={1440}>1 dia</option>
                                </select>
                                <span className="text-[10.5px] text-slate-400">tempo mínimo entre disparos do mesmo tipo</span>
                            </div>

                            <div>
                                <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mb-1.5">Notificar por</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                                        const meta = CHANNEL_META[c];
                                        const Icon = meta.icon;
                                        const active = rule.channels.includes(c);
                                        return (
                                            <button
                                                key={c}
                                                disabled={!meta.available}
                                                onClick={() => {
                                                    if (!meta.available) return;
                                                    if (active) onChange({ channels: rule.channels.filter((x) => x !== c) });
                                                    else onChange({ channels: [...rule.channels, c] });
                                                }}
                                                className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11.5px] font-medium transition-colors border ${
                                                    !meta.available ? 'border-slate-200 dark:border-white/[0.06] text-slate-400 cursor-not-allowed' :
                                                    active ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900' :
                                                    'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/30'
                                                }`}
                                                title={meta.helper}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {meta.label}
                                                {!meta.available && <span className="text-[9px] ml-0.5 opacity-60">(em breve)</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!on)}
            className={`shrink-0 relative inline-flex h-5 w-9 rounded-full transition-colors ${on ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-white/[0.08]'}`}
            aria-checked={on}
            role="switch"
        >
            <motion.span
                layout
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm ${on ? 'bg-white dark:bg-slate-900' : 'bg-white'}`}
                animate={{ x: on ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 700, damping: 30 }}
            />
        </button>
    );
}

function SeverityIcon({ sev }: { sev: Severity }) {
    if (sev === 'critical') return <span className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0"><AlertCircle className="w-4 h-4" /></span>;
    if (sev === 'warning') return <span className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center shrink-0"><AlertTriangle className="w-4 h-4" /></span>;
    return <span className="w-7 h-7 rounded-md bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0"><Info className="w-4 h-4" /></span>;
}

function SeverityDot({ sev }: { sev: Severity }) {
    const cls = sev === 'critical' ? 'bg-rose-500' : sev === 'warning' ? 'bg-amber-500' : 'bg-sky-500';
    return <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${cls}`} />;
}

function KPI({ label, value, color }: { label: string; value: number; color: 'rose' | 'amber' | 'emerald' | 'slate' }) {
    const cls = color === 'rose' ? 'text-rose-700 dark:text-rose-300' : color === 'amber' ? 'text-amber-700 dark:text-amber-300' : color === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white';
    return (
        <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`text-[18px] font-semibold tabular-nums font-mono ${cls}`}>{value}</p>
        </div>
    );
}
