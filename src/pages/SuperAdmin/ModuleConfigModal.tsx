import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Field, inputCls, Modal } from './_ui';
import { gql, useQuery } from './_api';
import {
    SUPER_ADMIN_COMPANY_MODULE_CONFIG_QUERY,
    SUPER_ADMIN_SET_COMPANY_MODULE_CONFIG_MUTATION,
} from '../../graphql/queries/feature-flags';

/**
 * Modal que mostra/altera a config criptografada de um módulo numa empresa.
 *
 *  - Campos "secret" (apiKey, apiToken...) nunca vêm decifrados do back:
 *    o back devolve só `hint` ("••••••4f2a") e `hasValue`. O campo fica
 *    em modo "manter atual" — só envia se o admin clicar "Trocar" e digitar.
 *
 *  - Campos "plain" (model, url, etc) vêm como JSON-stringificado em
 *    `valueJson` e são editados normalmente.
 *
 *  - O front monta um objeto JSON e manda como string em `configJson`.
 *    O back criptografa apenas os fields listados como secret pra
 *    aquele `module_key` (definido no backend, não confiável ao front).
 */

type ConfigField = {
    key: string;
    type: 'plain' | 'secret' | string;
    valueJson?: string | null;
    hasValue?: boolean | null;
    hint?: string | null;
};

// Defaults por módulo — campos que devem aparecer mesmo se ainda não estão
// salvos. O backend é a fonte da verdade sobre quais são secret.
const FIELD_TEMPLATES: Record<
    string,
    Array<{ key: string; type: 'plain' | 'secret'; label: string; placeholder?: string; hint?: string }>
> = {
    ai_assistant: [
        { key: 'provider', type: 'plain', label: 'Provider', placeholder: 'openai | anthropic', hint: 'qual fornecedor de IA' },
        { key: 'model', type: 'plain', label: 'Modelo', placeholder: 'gpt-4o, claude-sonnet-4-6, ...' },
        { key: 'apiKey', type: 'secret', label: 'API Key', placeholder: 'sk-...', hint: 'criptografado AES-256-GCM' },
    ],
    chatbot_typebot: [
        { key: 'publicId', type: 'plain', label: 'Public ID', placeholder: 'meu-bot' },
        { key: 'baseUrl', type: 'plain', label: 'URL do Typebot', placeholder: 'https://typebot.io' },
        { key: 'apiToken', type: 'secret', label: 'API Token', placeholder: 'token-...', hint: 'criptografado' },
    ],
    whatsapp: [
        { key: 'phoneNumberId', type: 'plain', label: 'Phone Number ID', placeholder: '123456789' },
        { key: 'wabaId', type: 'plain', label: 'WABA ID', placeholder: 'WhatsApp Business Account ID' },
        { key: 'accessToken', type: 'secret', label: 'Access Token', placeholder: 'EAAG...', hint: 'criptografado' },
    ],
    whatsapp_session: [
        { key: 'instanceId', type: 'plain', label: 'Instance ID', placeholder: 'instancia-1' },
        { key: 'apiToken', type: 'secret', label: 'API Token', placeholder: 'token-...', hint: 'criptografado' },
    ],
};

export function ModuleConfigModal({
    companyId, module_key, moduleName, onClose,
}: {
    companyId: string;
    module_key: string;
    moduleName: string;
    onClose: () => void;
}) {
    const { data, loading, refetch } = useQuery<{
        superAdminCompanyModuleConfig: ConfigField[];
    }>(
        SUPER_ADMIN_COMPANY_MODULE_CONFIG_QUERY,
        { companyId, module_key },
        [companyId, module_key],
    );

    const stored = data?.superAdminCompanyModuleConfig ?? [];
    const template = FIELD_TEMPLATES[module_key] ?? [];

    const storedByKey = new Map(stored.map((f) => [f.key, f]));

    // valores locais editáveis. Para secrets: undefined/'' = manter; '__delete__' = apagar.
    const [values, setValues] = useState<Record<string, string>>({});
    const [revealing, setRevealing] = useState<Record<string, boolean>>({});
    // marca quais secrets estão em modo "trocar" (input editável, vazio)
    const [replacing, setReplacing] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const initial: Record<string, string> = {};
        for (const f of template) {
            if (f.type === 'plain') {
                const s = storedByKey.get(f.key);
                if (s?.valueJson != null) {
                    try {
                        const parsed = JSON.parse(s.valueJson);
                        initial[f.key] = parsed == null ? '' : String(parsed);
                    } catch {
                        initial[f.key] = s.valueJson;
                    }
                } else {
                    initial[f.key] = '';
                }
            } else {
                initial[f.key] = ''; // secret: vazio = manter
            }
        }
        setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const submit = async () => {
        const config: Record<string, unknown> = {};
        for (const f of template) {
            const v = values[f.key] ?? '';
            if (f.type === 'plain') {
                if (v === '') continue;
                if (v === 'true' || v === 'false') config[f.key] = v === 'true';
                else if (!isNaN(Number(v)) && v.trim() !== '') config[f.key] = Number(v);
                else config[f.key] = v;
            } else {
                // secret
                if (v === '') continue; // manter
                if (v === '__delete__') config[f.key] = ''; // apaga no back
                else config[f.key] = v;
            }
        }

        if (Object.keys(config).length === 0) {
            toast.info('Nada para atualizar');
            return;
        }

        setSubmitting(true);
        try {
            await gql(SUPER_ADMIN_SET_COMPANY_MODULE_CONFIG_MUTATION, {
                input: { companyId, module_key, configJson: JSON.stringify(config) },
            });
            toast.success('Configuração salva');
            void refetch();
            // limpa secrets do form pra evitar reuso acidental
            const cleared = { ...values };
            for (const f of template) if (f.type === 'secret') cleared[f.key] = '';
            setValues(cleared);
            setReplacing({});
        } catch (e: any) { toast.error(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={`Configurar ${moduleName}`}
            description="Tokens são criptografados no servidor. O front nunca recebe o valor decifrado."
            size="md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Fechar</Button>
                    <Button onClick={submit} disabled={submitting} icon={Save}>
                        {submitting ? 'Salvando…' : 'Salvar'}
                    </Button>
                </>
            }
        >
            {loading ? (
                <div className="text-center py-8 text-slate-500 text-[13px]">Carregando…</div>
            ) : template.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-[13px]">
                    Este módulo não tem campos configuráveis.
                </div>
            ) : (
                <div className="space-y-4">
                    {template.map((f) => {
                        const stored = storedByKey.get(f.key);
                        const reveal = revealing[f.key];

                        if (f.type === 'plain') {
                            return (
                                <Field key={f.key} label={f.label} hint={f.hint}>
                                    <input
                                        value={values[f.key] ?? ''}
                                        onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className={inputCls}
                                    />
                                </Field>
                            );
                        }

                        // secret
                        const hasValue = stored?.hasValue === true;
                        const hint = stored?.hint ?? null;
                        const current = values[f.key] ?? '';
                        const isDeleting = current === '__delete__';
                        const inReplaceMode = replacing[f.key] === true;
                        const canEdit = !hasValue || inReplaceMode;

                        return (
                            <Field key={f.key} label={f.label} hint={f.hint}>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={reveal ? 'text' : 'password'}
                                            value={isDeleting ? '' : current}
                                            onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                                            placeholder={hasValue && !inReplaceMode ? (hint ?? '••••••••') : f.placeholder}
                                            disabled={!canEdit || isDeleting}
                                            className={`${inputCls} pr-9 font-mono-num text-[12.5px]`}
                                        />
                                        {canEdit && !isDeleting && (
                                            <button
                                                type="button"
                                                onClick={() => setRevealing((s) => ({ ...s, [f.key]: !reveal }))}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 p-1"
                                            >
                                                {reveal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>
                                    {hasValue && !inReplaceMode && !isDeleting && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={RefreshCcw}
                                            onClick={() => {
                                                setReplacing((s) => ({ ...s, [f.key]: true }));
                                                setValues((s) => ({ ...s, [f.key]: '' }));
                                            }}
                                        >
                                            Trocar
                                        </Button>
                                    )}
                                    {hasValue && !isDeleting && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            icon={Trash2}
                                            onClick={() => {
                                                setValues((s) => ({ ...s, [f.key]: '__delete__' }));
                                                setReplacing((s) => ({ ...s, [f.key]: false }));
                                            }}
                                        >
                                            Apagar
                                        </Button>
                                    )}
                                    {(inReplaceMode || isDeleting) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setReplacing((s) => ({ ...s, [f.key]: false }));
                                                setValues((s) => ({ ...s, [f.key]: '' }));
                                            }}
                                        >
                                            Desfazer
                                        </Button>
                                    )}
                                </div>
                                {isDeleting && (
                                    <div className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                                        <Trash2 className="w-3 h-3" />
                                        Será apagado ao salvar
                                    </div>
                                )}
                                {inReplaceMode && current.length > 0 && (
                                    <div className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                                        <KeyRound className="w-3 h-3" />
                                        Novo valor será salvo (criptografado)
                                    </div>
                                )}
                            </Field>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
