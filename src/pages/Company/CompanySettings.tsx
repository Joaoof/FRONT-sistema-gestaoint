import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Building2,
    FileText,
    Image as ImageIcon,
    Mail,
    MapPin,
    Phone,
    Save,
} from 'lucide-react';
import { GET_MY_COMPANY, UPDATE_COMPANY } from '../../graphql/queries/company';

interface CompanyData {
    id: string;
    name: string;
    nomeFantasia?: string | null;
    razaoSocial?: string | null;
    inscricaoEstadual?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cnpj?: string | null;
    logoUrl?: string | null;
}

interface FormState {
    name: string;
    nomeFantasia: string;
    razaoSocial: string;
    inscricaoEstadual: string;
    email: string;
    phone: string;
    address: string;
    bairro: string;
    cidade: string;
    estado: string;
    cnpj: string;
    logoUrl: string;
}

const EMPTY: FormState = {
    name: '',
    nomeFantasia: '',
    razaoSocial: '',
    inscricaoEstadual: '',
    email: '',
    phone: '',
    address: '',
    bairro: '',
    cidade: '',
    estado: '',
    cnpj: '',
    logoUrl: '',
};

export function CompanySettings() {
    const navigate = useNavigate();
    const { data, loading, refetch } = useQuery<{ myCompany: CompanyData | null }>(GET_MY_COMPANY, {
        fetchPolicy: 'cache-and-network',
    });
    const [updateCompany, { loading: saving }] = useMutation(UPDATE_COMPANY);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [pristine, setPristine] = useState<FormState>(EMPTY);

    const company = data?.myCompany;

    useEffect(() => {
        if (company) {
            const filled: FormState = {
                name: company.name ?? '',
                nomeFantasia: company.nomeFantasia ?? '',
                razaoSocial: company.razaoSocial ?? '',
                inscricaoEstadual: company.inscricaoEstadual ?? '',
                email: company.email ?? '',
                phone: company.phone ?? '',
                address: company.address ?? '',
                bairro: company.bairro ?? '',
                cidade: company.cidade ?? '',
                estado: company.estado ?? '',
                cnpj: company.cnpj ?? '',
                logoUrl: company.logoUrl ?? '',
            };
            setForm(filled);
            setPristine(filled);
        }
    }, [company]);

    const dirty = JSON.stringify(form) !== JSON.stringify(pristine);

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((p) => ({ ...p, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;
        try {
            await updateCompany({
                variables: {
                    id: company.id,
                    input: {
                        name: form.name || undefined,
                        nomeFantasia: form.nomeFantasia || null,
                        razaoSocial: form.razaoSocial || null,
                        inscricaoEstadual: form.inscricaoEstadual || null,
                        email: form.email || null,
                        phone: form.phone || null,
                        address: form.address || null,
                        bairro: form.bairro || null,
                        cidade: form.cidade || null,
                        estado: form.estado || null,
                        cnpj: form.cnpj || null,
                        logoUrl: form.logoUrl || null,
                    },
                },
            });
            toast.success('Empresa atualizada com sucesso');
            await refetch();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao atualizar empresa');
        }
    }

    if (loading && !company) {
        return <div className="p-12 text-center text-slate-500">Carregando dados da empresa…</div>;
    }

    if (!company) {
        return (
            <div className="p-12 text-center">
                <Building2 className="w-10 h-10 mx-auto text-slate-300" />
                <p className="mt-3 text-[13px] text-slate-500">Nenhuma empresa associada à sua conta.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-violet-500" />
                            Empresa
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Dados que aparecem em pedidos, recibos e impressões
                        </p>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden"
            >
                {/* Cabeçalho com logo */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 dark:from-violet-500/10 dark:via-fuchsia-500/10 dark:to-rose-500/10 border-b border-slate-100 dark:border-white/[0.06]">
                    {form.logoUrl ? (
                        <img
                            src={form.logoUrl}
                            alt="Logo"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                            className="w-16 h-16 rounded-lg object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center text-white font-bold text-xl shadow-sm">
                            {(form.name || 'EM').slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white truncate">
                            {form.name || 'Sua empresa'}
                        </h2>
                        <p className="text-[12px] text-slate-600 dark:text-slate-400 truncate">
                            {form.cnpj ? `CNPJ ${form.cnpj}` : 'CNPJ não cadastrado'} · ID{' '}
                            <span className="font-mono">{company.id.slice(0, 8)}</span>
                        </p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Razão social" required icon={<Building2 className="w-4 h-4" />}>
                        <input
                            value={form.razaoSocial}
                            onChange={(e) => update('razaoSocial', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            placeholder="Ex: JC Comércio Ltda"
                        />
                    </Field>

                    <Field label="Fantasia" icon={<Building2 className="w-4 h-4" />}>
                        <input
                            value={form.nomeFantasia}
                            onChange={(e) => update('nomeFantasia', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            placeholder="Ex: JC Variedades"
                        />
                    </Field>

                    <Field label="CNPJ / CPF" icon={<FileText className="w-4 h-4" />}>
                        <input
                            value={form.cnpj}
                            onChange={(e) => update('cnpj', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px] font-mono"
                            placeholder="00.000.000/0000-00"
                        />
                    </Field>

                    <Field label="Inscrição estadual" icon={<FileText className="w-4 h-4" />}>
                        <input
                            value={form.inscricaoEstadual}
                            onChange={(e) => update('inscricaoEstadual', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px] font-mono"
                            placeholder="ISENTO ou número"
                        />
                    </Field>

                    <Field label="Fone" icon={<Phone className="w-4 h-4" />}>
                        <input
                            value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            placeholder="(11) 99999-9999"
                        />
                    </Field>

                    <Field label="E-mail" icon={<Mail className="w-4 h-4" />}>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            placeholder="contato@empresa.com.br"
                        />
                    </Field>

                    <Field label="Endereço" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
                        <input
                            value={form.address}
                            onChange={(e) => update('address', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            placeholder="Rua, número, complemento"
                        />
                    </Field>

                    <Field label="Bairro" icon={<MapPin className="w-4 h-4" />}>
                        <input
                            value={form.bairro}
                            onChange={(e) => update('bairro', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                            placeholder="Centro"
                        />
                    </Field>

                    <div className="grid grid-cols-3 gap-2">
                        <Field label="Cidade" icon={<MapPin className="w-4 h-4" />} className="col-span-2">
                            <input
                                value={form.cidade}
                                onChange={(e) => update('cidade', e.target.value)}
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                                placeholder="São Paulo"
                            />
                        </Field>
                        <Field label="UF">
                            <input
                                value={form.estado}
                                onChange={(e) => update('estado', e.target.value.toUpperCase().slice(0, 2))}
                                maxLength={2}
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px] uppercase font-mono"
                                placeholder="SP"
                            />
                        </Field>
                    </div>

                    <Field
                        label="URL do logo"
                        icon={<ImageIcon className="w-4 h-4" />}
                        hint="Use uma URL pública (ex: do R2 / CDN)"
                        className="md:col-span-2"
                    >
                        <input
                            value={form.logoUrl}
                            onChange={(e) => update('logoUrl', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px] font-mono"
                            placeholder="https://cdn.exemplo.com/logo.png"
                        />
                    </Field>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/[0.06]">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        {dirty ? 'Você tem alterações não salvas' : 'Sem alterações pendentes'}
                    </p>
                    <div className="flex items-center gap-2">
                        {dirty && (
                            <button
                                type="button"
                                onClick={() => setForm(pristine)}
                                className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.04] rounded-md text-[13px]"
                            >
                                Descartar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving || !dirty}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Salvando…' : 'Salvar alterações'}
                        </button>
                    </div>
                </div>
            </form>

            <div className="bg-sky-50 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-lg p-4 text-[12.5px] text-sky-800 dark:text-sky-300">
                💡 Estes dados aparecem automaticamente no cabeçalho dos pedidos impressos, recibos e relatórios.
            </div>
        </div>
    );
}

function Field({
    label,
    children,
    icon,
    hint,
    required,
    className = '',
}: {
    label: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    hint?: string;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {icon && <span className="text-slate-400">{icon}</span>}
                {label}
                {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">{hint}</p>}
        </div>
    );
}
