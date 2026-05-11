import { useMemo, useState } from 'react';
import {
    Activity, Search, Download, AlertTriangle, Info, AlertCircle, ShieldAlert, Calendar,
} from 'lucide-react';
import {
    Button, Card, PageHeader, KPI, Tabs, Table, Th, Td, Badge, inputCls, Avatar, EmptyState,
} from './_ui';
import { useQuery, timeAgo } from './_api';

type Severity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

type LogEntry = {
    id: string;
    severity: Severity;
    action: string;
    entity: string;
    entityId: string;
    companyId: string | null;
    companyName: string | null;
    userId: string | null;
    userName: string | null;
    reason: string | null;
    createdAt: string;
};

const Q_LOGS = `
  query SuperAdminLogs($input: ListLogsInput) {
    superAdminLogs(input: $input) {
      id severity action entity entityId
      companyId companyName userId userName reason createdAt
    }
  }
`;

const SEVERITY_META: Record<Severity, { tone: 'sky' | 'amber' | 'rose' | 'violet'; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    INFO:     { tone: 'sky',    icon: Info,        label: 'Info' },
    WARN:     { tone: 'amber',  icon: AlertCircle, label: 'Alerta' },
    ERROR:    { tone: 'rose',   icon: AlertTriangle, label: 'Erro' },
    CRITICAL: { tone: 'violet', icon: ShieldAlert,   label: 'Crítico' },
};

export function SuperAdminLogs() {
    const [severity, setSeverity] = useState<'ALL' | Severity>('ALL');
    const [search, setSearch] = useState('');

    const { data, loading } = useQuery<{ superAdminLogs: LogEntry[] }>(
        Q_LOGS,
        { input: { search: search || null, severity: severity === 'ALL' ? null : severity, take: 300 } },
        [search, severity],
    );
    const items = data?.superAdminLogs ?? [];

    const counts = useMemo(() => ({
        ALL: items.length,
        INFO: items.filter((l) => l.severity === 'INFO').length,
        WARN: items.filter((l) => l.severity === 'WARN').length,
        ERROR: items.filter((l) => l.severity === 'ERROR').length,
        CRITICAL: items.filter((l) => l.severity === 'CRITICAL').length,
    }), [items]);

    const exportCsv = () => {
        const rows = [
            ['timestamp', 'severity', 'action', 'entity', 'entityId', 'company', 'user', 'reason'].join(','),
            ...items.map((l) => [
                new Date(l.createdAt).toISOString(),
                l.severity,
                l.action,
                l.entity,
                l.entityId,
                l.companyName ?? '',
                l.userName ?? '',
                (l.reason ?? '').replace(/[,;\n]/g, ' '),
            ].map((c) => `"${c}"`).join(',')),
        ].join('\n');
        const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `super-admin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Logs master"
                description="Auditoria global de toda a plataforma. Filtre por severidade, ator ou empresa."
                actions={<Button variant="secondary" icon={Download} onClick={exportCsv}>Exportar CSV</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPI label="Eventos (recentes)" value={loading ? '…' : counts.ALL} icon={Activity} accent="violet" />
                <KPI label="Alertas" value={loading ? '…' : counts.WARN} icon={AlertCircle} accent="amber" />
                <KPI label="Erros" value={loading ? '…' : counts.ERROR} icon={AlertTriangle} accent="rose" />
                <KPI label="Críticos" value={loading ? '…' : counts.CRITICAL} icon={ShieldAlert} accent="violet" />
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
                            <Th>Quando</Th>
                            <Th>Ator</Th>
                            <Th>Ação</Th>
                            <Th>Entidade</Th>
                            <Th>Empresa</Th>
                            <Th>Motivo</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-slate-500">Carregando…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7}><EmptyState icon={Activity} title="Sem eventos no filtro atual" description="Ajuste os filtros ou aguarde nova atividade." /></td></tr>
                        ) : items.map((l) => {
                            const s = SEVERITY_META[l.severity];
                            const SIcon = s.icon;
                            return (
                                <tr key={l.id} className="hover:bg-white/[0.02]">
                                    <Td><Badge tone={s.tone} icon={SIcon}>{s.label}</Badge></Td>
                                    <Td className="text-[11.5px] text-slate-400 font-mono-num">
                                        {new Date(l.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        <div className="text-[10px] text-slate-600">há {timeAgo(l.createdAt)}</div>
                                    </Td>
                                    <Td>
                                        {l.userName ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar name={l.userName} size={24} />
                                                <span className="text-[12.5px] font-semibold text-slate-200">{l.userName}</span>
                                            </div>
                                        ) : <span className="text-[12px] text-slate-500">Sistema</span>}
                                    </Td>
                                    <Td>
                                        <code className="text-[11px] font-mono-num px-1.5 py-0.5 rounded bg-white/5 text-slate-300">{l.action.toLowerCase()}</code>
                                    </Td>
                                    <Td className="text-[12px] text-slate-400">
                                        <span className="text-slate-300">{l.entity}</span>
                                        <div className="text-[10.5px] text-slate-600 font-mono-num">{l.entityId.slice(0, 8)}</div>
                                    </Td>
                                    <Td className="text-[12.5px] text-slate-300">{l.companyName ?? <span className="text-slate-600">—</span>}</Td>
                                    <Td className="text-[12px] text-slate-400 max-w-md truncate">{l.reason ?? <span className="text-slate-600">—</span>}</Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}
