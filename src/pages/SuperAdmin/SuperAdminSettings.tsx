import { useState } from 'react';
import {
    Mail, Sparkles, CreditCard, Lock, Database, CheckCircle2, AlertCircle,
    Eye, EyeOff, Save, ExternalLink, Webhook,
} from 'lucide-react';
import {
    Button, Card, PageHeader, Field, inputCls, Badge, SectionTitle,
} from './_ui';

export function SuperAdminSettings() {
    return (
        <div className="space-y-6 max-w-[1100px]">
            <PageHeader
                title="Configurações"
                description="Variáveis globais que afetam toda a plataforma. Apenas super admins têm acesso."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Sidebar />

                <div className="lg:col-span-2 space-y-4">
                    <EmailSection />
                    <AISection />
                    <PixSection />
                    <BanksSection />
                    <SecuritySection />
                    <DatabaseSection />
                </div>
            </div>
        </div>
    );
}

function Sidebar() {
    const sections = [
        { id: 'email', label: 'E-mail (Resend)', icon: Mail, status: 'warn' },
        { id: 'ai',    label: 'IA (OpenAI)', icon: Sparkles, status: 'ok' },
        { id: 'pix',   label: 'PIX', icon: CreditCard, status: 'ok' },
        { id: 'banks', label: 'Bancos', icon: Webhook, status: 'ok' },
        { id: 'security', label: 'Segurança / JWT', icon: Lock, status: 'ok' },
        { id: 'database', label: 'Banco de dados', icon: Database, status: 'ok' },
    ];
    return (
        <Card padding={false} className="sticky top-[88px] h-fit">
            <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="font-display text-[14px] font-bold text-white">Seções</h3>
            </div>
            <div className="p-2">
                {sections.map((s) => (
                    <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/[0.04] text-slate-300 hover:text-white text-[13px] transition-colors"
                    >
                        <s.icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="flex-1">{s.label}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'ok' ? 'bg-emerald-400' : s.status === 'warn' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                    </a>
                ))}
            </div>
        </Card>
    );
}

function EmailSection() {
    const [from, setFrom] = useState('GestãoInt <no-reply@send.joaoof.com.br>');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    return (
        <Card id="email">
            <SectionTitle
                title="E-mail (Resend)"
                description="Envio de convites e notificações por e-mail"
                action={<Badge tone="amber" icon={AlertCircle}>Domínio pendente</Badge>}
            />
            <div className="space-y-4 mt-4">
                <Field label="API key" hint="começa com re_">
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                            className={`${inputCls} pr-10 font-mono-num`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </Field>
                <Field label="Remetente padrão" hint="ex: Nome <email@dominio.com>">
                    <input value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                </Field>
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                    <div className="text-[12.5px] text-amber-200">
                        Domínio <strong>send.joaoof.com.br</strong> precisa estar verificado no Resend pra envio em produção.
                    </div>
                    <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-200 hover:text-amber-100">
                        Verificar <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm">Enviar e-mail de teste</Button>
                    <Button size="sm" icon={Save}>Salvar</Button>
                </div>
            </div>
        </Card>
    );
}

function AISection() {
    return (
        <Card id="ai">
            <SectionTitle
                title="IA (OpenAI)"
                description="Modelos usados pelo assistente, agente e insights"
                action={<Badge tone="emerald" icon={CheckCircle2}>Conectada</Badge>}
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
                <Field label="Modelo padrão (conversas)">
                    <select className={inputCls}>
                        <option>gpt-4o-mini</option>
                        <option>gpt-4o</option>
                        <option>gpt-4.1-mini</option>
                    </select>
                </Field>
                <Field label="Modelo (insights)">
                    <select className={inputCls}>
                        <option>gpt-4o-mini</option>
                        <option>gpt-4o</option>
                    </select>
                </Field>
                <Field label="Tokens por crédito">
                    <input className={inputCls} defaultValue="1000" />
                </Field>
                <Field label="Insights automáticos">
                    <select className={inputCls}>
                        <option>Ativados</option>
                        <option>Desativados</option>
                    </select>
                </Field>
            </div>
            <div className="flex justify-end mt-4"><Button size="sm" icon={Save}>Salvar</Button></div>
        </Card>
    );
}

function PixSection() {
    return (
        <Card id="pix">
            <SectionTitle title="PIX" description="Chave usada na compra de créditos da IA" action={<Badge tone="emerald" icon={CheckCircle2}>Configurado</Badge>} />
            <div className="grid grid-cols-2 gap-3 mt-4">
                <Field label="Chave PIX"><input className={inputCls} defaultValue="63991021043" /></Field>
                <Field label="Tipo de chave">
                    <select className={inputCls}>
                        <option>Celular</option>
                        <option>CPF/CNPJ</option>
                        <option>E-mail</option>
                        <option>Aleatória</option>
                    </select>
                </Field>
                <Field label="Nome do recebedor"><input className={inputCls} defaultValue="GESTAOINT" /></Field>
                <Field label="Cidade"><input className={inputCls} defaultValue="BRASILIA" /></Field>
            </div>
            <div className="flex justify-end mt-4"><Button size="sm" icon={Save}>Salvar</Button></div>
        </Card>
    );
}

function BanksSection() {
    return (
        <Card id="banks">
            <SectionTitle title="Bancos" description="Provider de boleto padrão e credenciais por banco" />
            <Field label="Provider padrão">
                <select className={inputCls}>
                    <option>MOCK (testes)</option>
                    <option>ITAU</option>
                    <option>BB (Banco do Brasil)</option>
                </select>
            </Field>
            <p className="text-[12px] text-slate-500 mt-3">
                Credenciais detalhadas de Itaú e BB ficam no <code className="text-slate-300 px-1 bg-white/5 rounded">.env</code> da API.
                Use a página <strong className="text-slate-200">Webhooks</strong> pra acompanhar conexões por empresa.
            </p>
        </Card>
    );
}

function SecuritySection() {
    return (
        <Card id="security">
            <SectionTitle title="Segurança / JWT" description="Tempo de sessão e regras de senha" action={<Badge tone="emerald" icon={CheckCircle2}>OK</Badge>} />
            <div className="grid grid-cols-2 gap-3 mt-4">
                <Field label="JWT expira em" hint="ex: 3600s, 24h, 7d"><input className={inputCls} defaultValue="3600s" /></Field>
                <Field label="Tamanho mínimo de senha"><input type="number" className={inputCls} defaultValue="8" /></Field>
                <Field label="Forçar 2FA pra Super Admin">
                    <select className={inputCls}><option>Recomendado</option><option>Obrigatório</option><option>Não</option></select>
                </Field>
                <Field label="Logout automático após inatividade"><input className={inputCls} defaultValue="60 min" /></Field>
            </div>
            <div className="flex justify-end mt-4"><Button size="sm" icon={Save}>Salvar</Button></div>
        </Card>
    );
}

function DatabaseSection() {
    return (
        <Card id="database">
            <SectionTitle title="Banco de dados" description="Status e backup" action={<Badge tone="emerald" icon={CheckCircle2}>OK</Badge>} />
            <div className="grid grid-cols-2 gap-3 mt-4 text-[12.5px]">
                <Stat label="Provider" value="PostgreSQL 16" />
                <Stat label="Latência média" value="14ms" />
                <Stat label="Empresas" value="5" />
                <Stat label="Tamanho" value="248 MB" />
            </div>
            <div className="flex justify-end mt-4 gap-2">
                <Button variant="secondary" size="sm">Backup manual</Button>
                <Button size="sm" icon={Save}>Configurar</Button>
            </div>
        </Card>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10.5px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
            <div className="font-display font-bold text-[15px] text-white mt-0.5 font-mono-num">{value}</div>
        </div>
    );
}
