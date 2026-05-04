import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    Loader2,
    Lock,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import {
    GET_FISCAL_CONFIG,
    UPSERT_FISCAL_CONFIG,
} from '../../graphql/queries/fiscal-config';
import { getGraphQLErrorMessages } from '../../utils/getGraphQLErrorMessage';

type FiscalEnvironment = 'HOMOLOG' | 'PRODUCTION';
type TaxRegime = 'SIMPLES_NACIONAL' | 'SIMPLES_NACIONAL_EXCESSO' | 'REGIME_NORMAL' | 'MEI';

interface FormState {
    ambiente: FiscalEnvironment;
    regimeTributario: TaxRegime;
    cnpj: string;
    inscricaoEstadual: string;
    inscricaoMunicipal: string;
    razaoSocial: string;
    nomeFantasia: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    codigoMunicipioIbge: string;
    uf: string;
    cep: string;
    serieNfe: string;
    proximoNumeroNfe: string;
    serieNfce: string;
    proximoNumeroNfce: string;
    serieNfse: string;
    proximoNumeroNfse: string;
    cscNfce: string;
    cscIdNfce: string;
    certificadoB64: string;
    certificadoSenha: string;
    providerName: string;
    providerApiToken: string;
    providerCnpjReference: string;
    providerWebhookSecret: string;
    ativo: boolean;
}

const REGIME_LABEL: Record<TaxRegime, string> = {
    SIMPLES_NACIONAL: 'Simples Nacional',
    SIMPLES_NACIONAL_EXCESSO: 'Simples Nacional — Excesso de sublimite',
    REGIME_NORMAL: 'Regime Normal',
    MEI: 'MEI',
};

const emptyForm: FormState = {
    ambiente: 'HOMOLOG',
    regimeTributario: 'SIMPLES_NACIONAL',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    razaoSocial: '',
    nomeFantasia: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    codigoMunicipioIbge: '',
    uf: '',
    cep: '',
    serieNfe: '1',
    proximoNumeroNfe: '1',
    serieNfce: '1',
    proximoNumeroNfce: '1',
    serieNfse: '1',
    proximoNumeroNfse: '1',
    cscNfce: '',
    cscIdNfce: '',
    certificadoB64: '',
    certificadoSenha: '',
    providerName: '',
    providerApiToken: '',
    providerCnpjReference: '',
    providerWebhookSecret: '',
    ativo: true,
};

interface ConfigResponse {
    id: string;
    ambiente: FiscalEnvironment;
    regimeTributario: TaxRegime;
    cnpj: string;
    inscricaoEstadual: string | null;
    inscricaoMunicipal: string | null;
    razaoSocial: string | null;
    nomeFantasia: string | null;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    codigoMunicipioIbge: string | null;
    uf: string | null;
    cep: string | null;
    serieNfe: number;
    proximoNumeroNfe: number;
    serieNfce: number;
    proximoNumeroNfce: number;
    serieNfse: number;
    proximoNumeroNfse: number;
    hasCertificado: boolean;
    certificadoValidoAte: string | null;
    cscIdNfce: string | null;
    providerName: string | null;
    hasProviderToken: boolean;
    providerCnpjReference: string | null;
    ativo: boolean;
}

export function FiscalConfigPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [hasExistingCert, setHasExistingCert] = useState(false);
    const [hasExistingToken, setHasExistingToken] = useState(false);

    const { data, loading, refetch } = useQuery<{ companyFiscalConfig: ConfigResponse | null }>(
        GET_FISCAL_CONFIG,
        { fetchPolicy: 'cache-and-network' },
    );

    const [upsert, { loading: saving }] = useMutation(UPSERT_FISCAL_CONFIG);

    useEffect(() => {
        const config = data?.companyFiscalConfig;
        if (!config) return;
        setForm((prev) => ({
            ...prev,
            ambiente: config.ambiente,
            regimeTributario: config.regimeTributario,
            cnpj: config.cnpj ?? '',
            inscricaoEstadual: config.inscricaoEstadual ?? '',
            inscricaoMunicipal: config.inscricaoMunicipal ?? '',
            razaoSocial: config.razaoSocial ?? '',
            nomeFantasia: config.nomeFantasia ?? '',
            endereco: config.endereco ?? '',
            numero: config.numero ?? '',
            complemento: config.complemento ?? '',
            bairro: config.bairro ?? '',
            cidade: config.cidade ?? '',
            codigoMunicipioIbge: config.codigoMunicipioIbge ?? '',
            uf: config.uf ?? '',
            cep: config.cep ?? '',
            serieNfe: String(config.serieNfe),
            proximoNumeroNfe: String(config.proximoNumeroNfe),
            serieNfce: String(config.serieNfce),
            proximoNumeroNfce: String(config.proximoNumeroNfce),
            serieNfse: String(config.serieNfse),
            proximoNumeroNfse: String(config.proximoNumeroNfse),
            cscIdNfce: config.cscIdNfce ?? '',
            providerName: config.providerName ?? '',
            providerCnpjReference: config.providerCnpjReference ?? '',
            ativo: config.ativo,
        }));
        setHasExistingCert(config.hasCertificado);
        setHasExistingToken(config.hasProviderToken);
    }, [data]);

    const handleCertFile = async (file: File) => {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        setForm((prev) => ({ ...prev, certificadoB64: base64 }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        const cnpj = form.cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) {
            setFeedback({ type: 'error', message: 'CNPJ deve ter 14 dígitos.' });
            return;
        }

        try {
            await upsert({
                variables: {
                    input: {
                        ambiente: form.ambiente,
                        regimeTributario: form.regimeTributario,
                        cnpj,
                        inscricaoEstadual: form.inscricaoEstadual.trim() || undefined,
                        inscricaoMunicipal: form.inscricaoMunicipal.trim() || undefined,
                        razaoSocial: form.razaoSocial.trim() || undefined,
                        nomeFantasia: form.nomeFantasia.trim() || undefined,
                        endereco: form.endereco.trim() || undefined,
                        numero: form.numero.trim() || undefined,
                        complemento: form.complemento.trim() || undefined,
                        bairro: form.bairro.trim() || undefined,
                        cidade: form.cidade.trim() || undefined,
                        codigoMunicipioIbge: form.codigoMunicipioIbge.trim() || undefined,
                        uf: form.uf.trim().toUpperCase() || undefined,
                        cep: form.cep.replace(/\D/g, '') || undefined,
                        serieNfe: Number(form.serieNfe) || 1,
                        proximoNumeroNfe: Number(form.proximoNumeroNfe) || 1,
                        serieNfce: Number(form.serieNfce) || 1,
                        proximoNumeroNfce: Number(form.proximoNumeroNfce) || 1,
                        serieNfse: Number(form.serieNfse) || 1,
                        proximoNumeroNfse: Number(form.proximoNumeroNfse) || 1,
                        cscNfce: form.cscNfce.trim() || undefined,
                        cscIdNfce: form.cscIdNfce.trim() || undefined,
                        certificadoB64: form.certificadoB64.trim() || undefined,
                        certificadoSenha: form.certificadoSenha || undefined,
                        providerName: form.providerName.trim() || undefined,
                        providerApiToken: form.providerApiToken.trim() || undefined,
                        providerCnpjReference: form.providerCnpjReference.trim() || undefined,
                        providerWebhookSecret: form.providerWebhookSecret.trim() || undefined,
                        ativo: form.ativo,
                    },
                },
            });
            setFeedback({ type: 'success', message: 'Configuração fiscal salva.' });
            setForm((prev) => ({ ...prev, certificadoB64: '', certificadoSenha: '', providerApiToken: '', providerWebhookSecret: '' }));
            await refetch();
        } catch (err) {
            setFeedback({
                type: 'error',
                message: getGraphQLErrorMessages(err)[0] ?? 'Erro ao salvar configuração.',
            });
        }
    };

    if (loading && !data) {
        return (
            <div className="p-8 flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-4xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-300"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        Configuração fiscal da empresa
                    </h1>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                        Dados de emissão de NFe / NFCe / NFSe — usados em todas as notas
                    </p>
                </div>
            </div>

            {feedback && (
                <div
                    className={`p-3 rounded-md border text-[12.5px] ${feedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                >
                    {feedback.message}
                </div>
            )}

            <Section title="Ambiente e regime">
                <Row>
                    <Field label="Ambiente">
                        <select
                            value={form.ambiente}
                            onChange={(e) => setForm({ ...form, ambiente: e.target.value as FiscalEnvironment })}
                            className="input"
                        >
                            <option value="HOMOLOG">Homologação (testes)</option>
                            <option value="PRODUCTION">Produção</option>
                        </select>
                    </Field>
                    <Field label="Regime tributário">
                        <select
                            value={form.regimeTributario}
                            onChange={(e) => setForm({ ...form, regimeTributario: e.target.value as TaxRegime })}
                            className="input"
                        >
                            {(Object.keys(REGIME_LABEL) as TaxRegime[]).map((r) => (
                                <option key={r} value={r}>{REGIME_LABEL[r]}</option>
                            ))}
                        </select>
                    </Field>
                </Row>
                <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200 pt-2">
                    <input
                        type="checkbox"
                        checked={form.ativo}
                        onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600"
                    />
                    Emissão fiscal ativa
                </label>
            </Section>

            <Section title="Dados da empresa emitente">
                <Row>
                    <Field label="CNPJ *" mono>
                        <input
                            type="text"
                            value={form.cnpj}
                            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                            className="input"
                            required
                            placeholder="00000000000000"
                        />
                    </Field>
                    <Field label="Inscrição estadual">
                        <input
                            type="text"
                            value={form.inscricaoEstadual}
                            onChange={(e) => setForm({ ...form, inscricaoEstadual: e.target.value })}
                            className="input"
                        />
                    </Field>
                    <Field label="Inscrição municipal">
                        <input
                            type="text"
                            value={form.inscricaoMunicipal}
                            onChange={(e) => setForm({ ...form, inscricaoMunicipal: e.target.value })}
                            className="input"
                        />
                    </Field>
                </Row>
                <Row>
                    <Field label="Razão social">
                        <input
                            type="text"
                            value={form.razaoSocial}
                            onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
                            className="input"
                        />
                    </Field>
                    <Field label="Nome fantasia">
                        <input
                            type="text"
                            value={form.nomeFantasia}
                            onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                            className="input"
                        />
                    </Field>
                </Row>
                <Row>
                    <Field label="Endereço">
                        <input
                            type="text"
                            value={form.endereco}
                            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                            className="input"
                        />
                    </Field>
                    <Field label="Número">
                        <input
                            type="text"
                            value={form.numero}
                            onChange={(e) => setForm({ ...form, numero: e.target.value })}
                            className="input"
                        />
                    </Field>
                    <Field label="Complemento">
                        <input
                            type="text"
                            value={form.complemento}
                            onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                            className="input"
                        />
                    </Field>
                </Row>
                <Row>
                    <Field label="Bairro">
                        <input
                            type="text"
                            value={form.bairro}
                            onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                            className="input"
                        />
                    </Field>
                    <Field label="Cidade">
                        <input
                            type="text"
                            value={form.cidade}
                            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                            className="input"
                        />
                    </Field>
                    <Field label="Cód. IBGE">
                        <input
                            type="text"
                            value={form.codigoMunicipioIbge}
                            onChange={(e) => setForm({ ...form, codigoMunicipioIbge: e.target.value })}
                            className="input"
                            maxLength={7}
                        />
                    </Field>
                    <Field label="UF">
                        <input
                            type="text"
                            value={form.uf}
                            onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                            className="input uppercase font-mono"
                            maxLength={2}
                        />
                    </Field>
                    <Field label="CEP">
                        <input
                            type="text"
                            value={form.cep}
                            onChange={(e) => setForm({ ...form, cep: e.target.value })}
                            className="input font-mono"
                        />
                    </Field>
                </Row>
            </Section>

            <Section title="Numeração">
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 -mt-3">
                    A numeração é controlada por (tipo, série) e incrementada automaticamente a cada emissão. Ajuste se você está migrando de outro sistema.
                </p>
                <Row>
                    <Field label="Série NFe">
                        <input type="number" min="1" max="999" value={form.serieNfe} onChange={(e) => setForm({ ...form, serieNfe: e.target.value })} className="input font-mono" />
                    </Field>
                    <Field label="Próximo nº NFe">
                        <input type="number" min="1" value={form.proximoNumeroNfe} onChange={(e) => setForm({ ...form, proximoNumeroNfe: e.target.value })} className="input font-mono" />
                    </Field>
                    <Field label="Série NFCe">
                        <input type="number" min="1" max="999" value={form.serieNfce} onChange={(e) => setForm({ ...form, serieNfce: e.target.value })} className="input font-mono" />
                    </Field>
                    <Field label="Próximo nº NFCe">
                        <input type="number" min="1" value={form.proximoNumeroNfce} onChange={(e) => setForm({ ...form, proximoNumeroNfce: e.target.value })} className="input font-mono" />
                    </Field>
                </Row>
                <Row>
                    <Field label="Série NFSe">
                        <input type="number" min="1" max="999" value={form.serieNfse} onChange={(e) => setForm({ ...form, serieNfse: e.target.value })} className="input font-mono" />
                    </Field>
                    <Field label="Próximo nº NFSe">
                        <input type="number" min="1" value={form.proximoNumeroNfse} onChange={(e) => setForm({ ...form, proximoNumeroNfse: e.target.value })} className="input font-mono" />
                    </Field>
                </Row>
            </Section>

            <Section title="Certificado digital A1">
                {hasExistingCert && (
                    <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-[12.5px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Certificado já cadastrado. Para substituir, envie um novo arquivo .pfx abaixo.
                    </div>
                )}
                <Row>
                    <Field label="Arquivo .pfx / .p12">
                        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-white/15 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] text-[12.5px] text-slate-700 dark:text-slate-200">
                            <Upload className="w-4 h-4" />
                            {form.certificadoB64 ? 'Arquivo carregado · clique pra trocar' : 'Selecionar certificado'}
                            <input
                                type="file"
                                accept=".pfx,.p12"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleCertFile(file);
                                }}
                            />
                        </label>
                    </Field>
                    <Field label="Senha do certificado">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                value={form.certificadoSenha}
                                onChange={(e) => setForm({ ...form, certificadoSenha: e.target.value })}
                                className="input pl-10"
                                placeholder={hasExistingCert ? 'Mantém a atual se vazio' : ''}
                            />
                        </div>
                    </Field>
                </Row>
            </Section>

            <Section title="Provedor de NFe">
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 -mt-3">
                    Informe o nome do provedor (ex.: <code>focus_nfe</code>, <code>plugnotas</code>). O adapter precisa estar implementado no backend para que a emissão funcione.
                </p>
                <Row>
                    <Field label="Provedor (slug)">
                        <input
                            type="text"
                            value={form.providerName}
                            onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                            className="input font-mono"
                            placeholder="focus_nfe"
                        />
                    </Field>
                    <Field label="Token / API key">
                        <input
                            type="password"
                            value={form.providerApiToken}
                            onChange={(e) => setForm({ ...form, providerApiToken: e.target.value })}
                            className="input"
                            placeholder={hasExistingToken ? 'Mantém o token atual se vazio' : ''}
                        />
                    </Field>
                </Row>
                <Row>
                    <Field label="CNPJ de referência no provedor">
                        <input
                            type="text"
                            value={form.providerCnpjReference}
                            onChange={(e) => setForm({ ...form, providerCnpjReference: e.target.value })}
                            className="input font-mono"
                            placeholder="Algumas APIs usam o CNPJ como identificador"
                        />
                    </Field>
                    <Field label="Webhook secret">
                        <input
                            type="password"
                            value={form.providerWebhookSecret}
                            onChange={(e) => setForm({ ...form, providerWebhookSecret: e.target.value })}
                            className="input"
                        />
                    </Field>
                </Row>
            </Section>

            <Section title="NFCe — CSC (Código de Segurança do Contribuinte)">
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 -mt-3">
                    Necessário apenas para emissão de NFCe (varejo / consumidor final). Obtido na SEFAZ do estado.
                </p>
                <Row>
                    <Field label="ID do CSC">
                        <input
                            type="text"
                            value={form.cscIdNfce}
                            onChange={(e) => setForm({ ...form, cscIdNfce: e.target.value })}
                            className="input font-mono"
                        />
                    </Field>
                    <Field label="Token CSC">
                        <input
                            type="password"
                            value={form.cscNfce}
                            onChange={(e) => setForm({ ...form, cscNfce: e.target.value })}
                            className="input"
                        />
                    </Field>
                </Row>
            </Section>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                <button
                    type="button"
                    onClick={() => navigate('/configuracoes')}
                    className="h-10 px-5 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-md"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 h-10 px-5 text-[13px] font-medium text-white bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-md shadow-sm disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando…
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Salvar configuração
                        </>
                    )}
                </button>
            </div>

            <style>{`
                .input {
                    width: 100%;
                    padding: 0.625rem;
                    border: 1px solid rgb(226 232 240);
                    border-radius: 0.375rem;
                    background: white;
                    font-size: 13px;
                }
                :is(.dark) .input {
                    border-color: rgba(255,255,255,0.15);
                    background: rgb(2 6 23);
                    color: rgb(226 232 240);
                }
                .input:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgb(99 102 241);
                }
            `}</style>
        </form>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h2>
            {children}
        </div>
    );
}

function Row({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

function Field({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
    return (
        <div>
            <label className={`block text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-1.5 ${mono ? 'font-mono' : ''}`}>
                {label}
            </label>
            {children}
        </div>
    );
}
