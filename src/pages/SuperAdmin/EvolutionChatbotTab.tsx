import { useEffect, useState } from 'react';
import {
    Bot, CheckCircle2, Copy, Loader2, MessageSquare, Plus, Power,
    QrCode, RefreshCcw, Save, Server, Trash2, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, Field, inputCls, Modal, SectionTitle, textareaCls } from './_ui';
import { gql, useQuery } from './_api';
import {
    M_CREATE_EVOLUTION_FLOW, M_DELETE_EVOLUTION_FLOW, M_EVOLUTION_CONNECT,
    M_EVOLUTION_DISCONNECT, M_EVOLUTION_REFRESH, M_SAVE_EVOLUTION_CONFIG,
    M_UPDATE_EVOLUTION_FLOW, Q_EVOLUTION_FLOWS, Q_EVOLUTION_STATUS,
} from '../../graphql/queries/chatbot-evolution';

type EvolutionStatus = {
    configured: boolean;
    serverUrl: string | null;
    hasApiKey: boolean;
    apiKeyHint: string | null;
    instanceName: string | null;
    status: string;
    connectionState: string | null;
    phone: string | null;
    profileName: string | null;
    profilePicUrl: string | null;
    qrCodeBase64: string | null;
    webhookUrl: string | null;
    webhookToken: string | null;
    lastError: string | null;
    lastSyncAt: string | null;
};

type Flow = {
    id: string;
    name: string;
    trigger: string;
    pattern: string | null;
    responseBody: string;
    priority: number;
    enabled: boolean;
    cooldownMinutes: number;
};

export function EvolutionChatbotTab({ companyId }: { companyId: string }) {
    const { data: statusData, loading, refetch } =
        useQuery<{ superAdminEvolutionStatus: EvolutionStatus }>(
            Q_EVOLUTION_STATUS, { companyId }, [companyId],
        );
    const status = statusData?.superAdminEvolutionStatus ?? null;

    const { data: flowsData, refetch: refetchFlows } =
        useQuery<{ superAdminEvolutionFlows: Flow[] }>(
            Q_EVOLUTION_FLOWS, { companyId }, [companyId],
        );
    const flows = flowsData?.superAdminEvolutionFlows ?? [];

    return (
        <div className="space-y-4">
            <ConfigCard
                companyId={companyId}
                status={status}
                loading={loading && !status}
                onSaved={() => void refetch()}
            />
            <ConnectionCard
                companyId={companyId}
                status={status}
                onChanged={() => void refetch()}
            />
            <FlowsCard
                companyId={companyId}
                flows={flows}
                onChanged={() => void refetchFlows()}
            />
        </div>
    );
}

// ============================================================
//   Config (serverUrl + apiKey + instanceName)
// ============================================================

function ConfigCard({
    companyId, status, loading, onSaved,
}: {
    companyId: string;
    status: EvolutionStatus | null;
    loading: boolean;
    onSaved: () => void;
}) {
    const [serverUrl, setServerUrl] = useState('');
    const [instanceName, setInstanceName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [replacing, setReplacing] = useState(false);
    const [saving, setSaving] = useState(false);

    // hydrata quando status carrega/muda
    useEffect(() => {
        if (status) {
            setServerUrl(status.serverUrl ?? '');
            setInstanceName(status.instanceName ?? '');
        }
    }, [status?.serverUrl, status?.instanceName]);

    const save = async () => {
        if (!serverUrl.trim()) return toast.error('Server URL é obrigatório');
        setSaving(true);
        try {
            await gql(M_SAVE_EVOLUTION_CONFIG, {
                input: {
                    companyId,
                    serverUrl: serverUrl.trim(),
                    instanceName: instanceName.trim() || null,
                    // só envia apiKey se o usuário digitou (replacing) ou nunca teve
                    apiKey: replacing || !status?.hasApiKey ? apiKey : undefined,
                },
            });
            toast.success('Configuração salva');
            setApiKey('');
            setReplacing(false);
            onSaved();
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    if (loading) {
        return <Card><div className="text-center py-8 text-slate-500 text-[13px]">Carregando…</div></Card>;
    }

    return (
        <Card>
            <SectionTitle
                title="Configuração do Evolution"
                description="Cada empresa aponta pro próprio servidor Evolution. A API key é criptografada AES-256-GCM."
                action={
                    <Badge tone={status?.configured ? 'emerald' : 'slate'} icon={status?.configured ? CheckCircle2 : Server}>
                        {status?.configured ? 'configurado' : 'pendente'}
                    </Badge>
                }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Server URL" required hint="URL base do seu Evolution Manager">
                    <input
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder={status?.serverUrl ?? 'https://evo.suaempresa.com'}
                        className={inputCls}
                    />
                </Field>
                <Field label="Instance name" hint="único global. Vazio = gera automático">
                    <input
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder={status?.instanceName ?? `tenant-${companyId.slice(0, 8)}`}
                        className={inputCls}
                    />
                </Field>
                <Field label="API Key (apikey header)" required={!status?.hasApiKey}>
                    <div className="flex gap-2">
                        <input
                            type={replacing || !status?.hasApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={status?.hasApiKey && !replacing ? (status?.apiKeyHint ?? '••••••') : 'cole sua API key'}
                            disabled={status?.hasApiKey === true && !replacing}
                            className={`${inputCls} flex-1 font-mono-num text-[12.5px]`}
                        />
                        {status?.hasApiKey && !replacing && (
                            <Button size="sm" variant="secondary" icon={RefreshCcw} onClick={() => setReplacing(true)}>
                                Trocar
                            </Button>
                        )}
                    </div>
                </Field>
                <Field label="Webhook URL (gerado)" hint="cole isso no seu Evolution server">
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={status?.webhookUrl ?? '(será gerado após salvar serverUrl)'}
                            className={`${inputCls} flex-1 font-mono-num text-[11.5px] text-slate-400`}
                        />
                        {status?.webhookUrl && (
                            <Button
                                size="sm"
                                variant="ghost"
                                icon={Copy}
                                onClick={() => {
                                    navigator.clipboard.writeText(status.webhookUrl!);
                                    toast.success('URL copiada');
                                }}
                            >
                                Copiar
                            </Button>
                        )}
                    </div>
                </Field>
            </div>
            <div className="flex justify-end mt-4">
                <Button icon={Save} onClick={save} disabled={saving}>
                    {saving ? 'Salvando…' : 'Salvar configuração'}
                </Button>
            </div>
        </Card>
    );
}

// ============================================================
//   Conexão (QR / status)
// ============================================================

function ConnectionCard({
    companyId, status, onChanged,
}: {
    companyId: string;
    status: EvolutionStatus | null;
    onChanged: () => void;
}) {
    const [busy, setBusy] = useState<null | 'connect' | 'refresh' | 'disconnect'>(null);

    const doConnect = async () => {
        setBusy('connect');
        try {
            await gql(M_EVOLUTION_CONNECT, { companyId });
            toast.success('Solicitação de conexão enviada. Aguarde o QR.');
            onChanged();
        } catch (e: any) { toast.error(e.message); }
        finally { setBusy(null); }
    };
    const doRefresh = async () => {
        setBusy('refresh');
        try {
            await gql(M_EVOLUTION_REFRESH, { companyId });
            onChanged();
        } catch (e: any) { toast.error(e.message); }
        finally { setBusy(null); }
    };
    const doDisconnect = async () => {
        if (!confirm('Desconectar a instância (logout)?')) return;
        setBusy('disconnect');
        try {
            await gql(M_EVOLUTION_DISCONNECT, { companyId });
            toast.success('Desconectado');
            onChanged();
        } catch (e: any) { toast.error(e.message); }
        finally { setBusy(null); }
    };

    const isConnected = (status?.status ?? '').toUpperCase() === 'CONNECTED';
    const hasQr = !!status?.qrCodeBase64;

    return (
        <Card>
            <SectionTitle
                title="Conexão WhatsApp"
                description="Escaneie o QR no app WhatsApp da empresa pra autenticar a instância."
                action={
                    <Badge
                        tone={isConnected ? 'emerald' : status?.status === 'QR_PENDING' ? 'amber' : status?.status === 'ERROR' ? 'rose' : 'slate'}
                        icon={isConnected ? Wifi : WifiOff}
                    >
                        {status?.status ?? 'sem dados'}
                    </Badge>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="text-[13px] text-slate-300">
                        {isConnected && status?.profileName ? (
                            <div className="flex items-center gap-3">
                                {status.profilePicUrl
                                    ? <img src={status.profilePicUrl} className="w-12 h-12 rounded-full" alt="" />
                                    : <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold">WA</div>
                                }
                                <div>
                                    <div className="font-semibold text-white">{status.profileName}</div>
                                    <div className="text-[11.5px] text-slate-400 font-mono-num">{status.phone ?? '—'}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-[12.5px]">
                                {status?.configured
                                    ? 'Clique em Conectar pra gerar o QR.'
                                    : 'Salve a configuração antes de conectar.'}
                            </div>
                        )}
                    </div>

                    {status?.lastError && (
                        <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[11.5px] text-rose-200 break-all">
                            {status.lastError}
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        <Button
                            icon={busy === 'connect' ? Loader2 : Power}
                            disabled={!status?.configured || busy !== null}
                            onClick={doConnect}
                        >
                            {busy === 'connect' ? 'Conectando…' : 'Conectar'}
                        </Button>
                        <Button variant="secondary" icon={RefreshCcw} disabled={busy !== null} onClick={doRefresh}>
                            {busy === 'refresh' ? 'Atualizando…' : 'Atualizar status'}
                        </Button>
                        {isConnected && (
                            <Button variant="danger" icon={Power} disabled={busy !== null} onClick={doDisconnect}>
                                Desconectar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center">
                    {hasQr ? (
                        <div className="p-4 rounded-xl bg-white border border-white/10">
                            <img src={status!.qrCodeBase64!} alt="QR code" className="w-48 h-48" />
                            <div className="text-[11.5px] text-slate-700 text-center mt-2 font-semibold">
                                Escaneie no app WhatsApp
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-slate-500">
                            <QrCode className="w-12 h-12 mx-auto mb-2 opacity-40" />
                            <div className="text-[12px]">QR aparece aqui após clicar em Conectar</div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ============================================================
//   Flows (regras de chatbot)
// ============================================================

function FlowsCard({
    companyId, flows, onChanged,
}: {
    companyId: string;
    flows: Flow[];
    onChanged: () => void;
}) {
    const [editing, setEditing] = useState<Flow | null>(null);
    const [creating, setCreating] = useState(false);

    const remove = async (flow: Flow) => {
        if (!confirm(`Apagar regra "${flow.name}"?`)) return;
        try {
            await gql(M_DELETE_EVOLUTION_FLOW, { companyId, id: flow.id });
            toast.success('Regra removida');
            onChanged();
        } catch (e: any) { toast.error(e.message); }
    };

    return (
        <Card>
            <SectionTitle
                title="Regras do bot"
                description="Mensagens recebidas são comparadas com as regras (ordem por prioridade). Sem match e com IA ativa, cai pra IA."
                action={<Button icon={Plus} size="sm" onClick={() => setCreating(true)}>Nova regra</Button>}
            />
            {flows.length === 0 ? (
                <EmptyState
                    icon={Bot}
                    title="Nenhuma regra ainda"
                    description="Crie a primeira regra (ex: keyword 'cardápio' → texto de resposta)."
                    action={<Button icon={Plus} onClick={() => setCreating(true)}>Criar regra</Button>}
                />
            ) : (
                <div className="space-y-2">
                    {flows.map((f) => (
                        <div key={f.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.14] transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[13px] font-semibold text-white">{f.name}</span>
                                        <Badge tone={f.enabled ? 'emerald' : 'slate'}>{f.enabled ? 'ativa' : 'pausada'}</Badge>
                                        <Badge tone="sky">{f.trigger}</Badge>
                                        {f.pattern && <span className="text-[11px] text-slate-400 font-mono-num">→ "{f.pattern}"</span>}
                                        <span className="text-[10.5px] text-slate-500">prio {f.priority} · cd {f.cooldownMinutes}min</span>
                                    </div>
                                    <div className="text-[12px] text-slate-400 mt-1.5 line-clamp-2 whitespace-pre-wrap">{f.responseBody}</div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button size="sm" variant="ghost" icon={MessageSquare} onClick={() => setEditing(f)}>Editar</Button>
                                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => remove(f)}>Apagar</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(creating || editing) && (
                <FlowModal
                    companyId={companyId}
                    initial={editing}
                    onClose={() => { setCreating(false); setEditing(null); }}
                    onSaved={() => { setCreating(false); setEditing(null); onChanged(); }}
                />
            )}
        </Card>
    );
}

function FlowModal({
    companyId, initial, onClose, onSaved,
}: {
    companyId: string;
    initial: Flow | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [trigger, setTrigger] = useState(initial?.trigger ?? 'keyword');
    const [pattern, setPattern] = useState(initial?.pattern ?? '');
    const [responseBody, setResponseBody] = useState(initial?.responseBody ?? '');
    const [priority, setPriority] = useState(String(initial?.priority ?? 100));
    const [cooldown, setCooldown] = useState(String(initial?.cooldownMinutes ?? 60));
    const [enabled, setEnabled] = useState(initial?.enabled ?? true);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!name.trim() || !responseBody.trim()) return toast.error('Nome e resposta obrigatórios');
        setSaving(true);
        try {
            if (initial) {
                await gql(M_UPDATE_EVOLUTION_FLOW, {
                    input: {
                        companyId, id: initial.id,
                        name, trigger, pattern: pattern || null, responseBody,
                        priority: Number(priority) || 100, enabled,
                        cooldownMinutes: Number(cooldown) || 0,
                    },
                });
            } else {
                await gql(M_CREATE_EVOLUTION_FLOW, {
                    input: {
                        companyId, name, trigger, pattern: pattern || null, responseBody,
                        priority: Number(priority) || 100, enabled,
                        cooldownMinutes: Number(cooldown) || 0,
                    },
                });
            }
            toast.success(initial ? 'Regra atualizada' : 'Regra criada');
            onSaved();
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={initial ? 'Editar regra' : 'Nova regra'}
            size="lg"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button icon={Save} onClick={save} disabled={saving}>
                        {saving ? 'Salvando…' : initial ? 'Atualizar' : 'Criar'}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <Field label="Nome" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Saudação inicial" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Trigger" hint="keyword | regex | first_message | out_of_hours">
                        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={inputCls}>
                            <option value="keyword">keyword</option>
                            <option value="regex">regex</option>
                            <option value="first_message">first_message</option>
                            <option value="out_of_hours">out_of_hours</option>
                        </select>
                    </Field>
                    <Field label="Padrão" hint="palavra-chave ou regex (case-insensitive)">
                        <input value={pattern} onChange={(e) => setPattern(e.target.value)} className={inputCls} placeholder="cardápio" />
                    </Field>
                </div>
                <Field label="Resposta" required hint="Suporta {{name}} (nome do contato)">
                    <textarea
                        value={responseBody}
                        onChange={(e) => setResponseBody(e.target.value)}
                        rows={4}
                        className={textareaCls}
                        placeholder="Olá {{name}}! 👋 Nosso cardápio está em https://..."
                    />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="Prioridade" hint="menor = primeiro">
                        <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Cooldown (min)">
                        <input type="number" value={cooldown} onChange={(e) => setCooldown(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Ativa">
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4" />
                            <span className="text-[12.5px] text-slate-300">{enabled ? 'sim' : 'pausada'}</span>
                        </label>
                    </Field>
                </div>
            </div>
        </Modal>
    );
}
