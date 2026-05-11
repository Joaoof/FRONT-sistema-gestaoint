import { useMemo, useState } from 'react';
import {
    Activity, Search, Download, AlertTriangle, Info, AlertCircle, ShieldAlert, Calendar,
} from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, Badge, inputCls, Avatar, EmptyState,
} from './_ui';
// (Filter icon dropped — using Calendar button only)

type Severity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
type LogEntry = {
    id: string;
    severity: Severity;
    actor: string;
    action: string;
    company: string;
    ip: string;
    detail: string;
    at: string;
    timestamp: string;
};

const MOCK_LOGS: LogEntry[] = [
    { id: '1', severity: 'INFO', actor: 'Maria Souza', action: 'user.login',  company: 'Norteshop', ip: '189.45.12.10', detail: 'Login bem-sucedido', at: '2 min', timestamp: '14:32:15' },
    { id: '2', severity: 'INFO', actor: 'João Pereira', action: 'order.create', company: 'Norteshop', ip: '189.45.12.10', detail: 'Pedido #2841 criado — R$ 1.240,00', at: '5 min', timestamp: '14:29:08' },
    { id: '3', severity: 'WARN', actor: 'Sistema', action: 'webhook.retry', company: 'Padaria BP', ip: 'webhook', detail: 'Tentativa 2/3 — Banco do Brasil', at: '12 min', timestamp: '14:22:01' },
    { id: '4', severity: 'ERROR', actor: 'Sistema', action: 'webhook.auth_fail', company: 'Padaria BP', ip: 'webhook', detail: 'HTTP 401 ao renovar token BB — token expirado', at: '14 min', timestamp: '14:20:43' },
    { id: '5', severity: 'INFO', actor: 'Ana Lima', action: 'invitation.accept', company: 'Padaria BP', ip: '177.22.45.8', detail: 'Aceitou convite e criou conta', at: '1 h', timestamp: '13:30:00' },
    { id: '6', severity: 'CRITICAL', actor: 'Carlos M.', action: 'plan.upgrade', company: 'Tech SA', ip: '200.158.34.22', detail: 'Plano alterado de Pro para Enterprise', at: '2 h', timestamp: '12:14:55' },
    { id: '7', severity: 'WARN', actor: 'Sistema', action: 'ai.credits_low', company: 'Padaria BP', ip: 'cron', detail: 'Créditos da IA abaixo de 10%', at: '3 h', timestamp: '11:30:11' },
    { id: '8', severity: 'INFO', actor: 'doutordigital', action: 'admin.invitation_create', company: '—', ip: '187.10.30.5', detail: 'Convite criado para maria@norteshop.com.br', at: '5 h', timestamp: '09:42:30' },
];

const SEVERITY_META: Record<Severity, { tone: 'sky' | 'amber' | 'rose' | 'violet'; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    INFO:     { tone: 'sky',    icon: Info,        label: 'Info' },
    WARN:     { tone: 'amber',  icon: AlertCircle, label: 'Alerta' },
    ERROR:    { tone: 'rose',   icon: AlertTriangle, label: 'Erro' },
    CRITICAL: { tone: 'violet', icon: ShieldAlert,   label: 'Crítico' },
};

export function SuperAdminLogs() {
    const [severity, setSeverity] = useState<'ALL' | Severity>('ALL');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => MOCK_LOGS.filter((l) =>
        (severity === 'ALL' || l.severity === severity) &&
        (l.actor.toLowerCase().includes(search.toLowerCase()) ||
         l.action.toLowerCase().includes(search.toLowerCase()) ||
         l.company.toLowerCase().includes(search.toLowerCase()) ||
         l.detail.toLowerCase().includes(search.toLowerCase()))
    ), [severity, search]);

    const counts = useMemo(() => ({
        ALL: MOCK_LOGS.length,
        INFO: MOCK_LOGS.filter((l) => l.severity === 'INFO').length,
        WARN: MOCK_LOGS.filter((l) => l.severity === 'WARN').length,
        ERROR: MOCK_LOGS.filter((l) => l.severity === 'ERROR').length,
        CRITICAL: MOCK_LOGS.filter((l) => l.severity === 'CRITICAL').length,
    }), []);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Logs master"
                description="Auditoria global de toda a plataforma. Filtre por severidade, ator ou empresa."
                actions={<Button variant="secondary" icon={Download}>Exportar CSV</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Eventos (24h)" value={counts.ALL} icon={Activity} accent="violet" />
                <KPI label="Alertas" value={counts.WARN} icon={AlertCircle} accent="amber" />
                <KPI label="Erros" value={counts.ERROR} icon={AlertTriangle} accent="rose" />
                <KPI label="Críticos" value={counts.CRITICAL} icon={ShieldAlert} accent="violet" />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Tabs
                    options={[
                        { value: 'ALL', label: 'Todos' },
                        { value: 'INFO', label: 'Info' },
                        { value: 'WARN', label: 'Alertas' },
                        { value: 'ERROR', label: 'Erros' },
                        { value: 'CRITICAL', label: 'Críticos' },
                    ]}
                    value={severity}
                    onChange={setSeverity as any}
                    counts={counts as any}
                />
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar ator, ação, empresa"
                            className={`${inputCls} h-9 pl-9 w-72`}
                        />
                    </div>
                    <Button variant="ghost" size="sm" icon={Calendar}>Período</Button>
                </div>
            </div>

            <Card padding={false}>
                <Table>
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                        <tr>
                            <Th>Severidade</Th>
                            <Th>Hora</Th>
                            <Th>Ator</Th>
                            <Th>Ação</Th>
                            <Th>Empresa</Th>
                            <Th>Detalhe</Th>
                            <Th>IP</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7}><EmptyState icon={Activity} title="Sem eventos no filtro atual" /></td></tr>
                        ) : filtered.map((l) => {
                            const s = SEVERITY_META[l.severity];
                            const SIcon = s.icon;
                            return (
                                <tr key={l.id} className="hover:bg-white/[0.02]">
                                    <Td><Badge tone={s.tone} icon={SIcon}>{s.label}</Badge></Td>
                                    <Td className="font-mono-num text-[11.5px] text-slate-400">{l.timestamp}<div className="text-[10px] text-slate-600">há {l.at}</div></Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Avatar name={l.actor} size={24} />
                                            <span className="text-[12.5px] font-semibold text-slate-200">{l.actor}</span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <code className="text-[11px] font-mono-num px-1.5 py-0.5 rounded bg-white/5 text-slate-300">{l.action}</code>
                                    </Td>
                                    <Td className="text-[12.5px] text-slate-300">{l.company}</Td>
                                    <Td className="text-[12px] text-slate-400 max-w-md truncate">{l.detail}</Td>
                                    <Td className="font-mono-num text-[11px] text-slate-500">{l.ip}</Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}
