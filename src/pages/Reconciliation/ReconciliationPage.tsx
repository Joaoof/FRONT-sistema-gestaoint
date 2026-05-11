import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Upload, Banknote, Check, X, Plus, Sparkles, FileText } from 'lucide-react';
import {
    AUTO_MATCH,
    CREATE_MOVEMENT_FROM_ITEM,
    IGNORE_ITEM,
    IMPORT_OFX,
    STATEMENT_IMPORT,
    STATEMENT_IMPORTS,
} from '../../graphql/queries/reconciliation';
import { GET_BANKS } from '../../graphql/queries/banks';

interface ImportSummary {
    id: string;
    bankId: string;
    fileName: string;
    rangeStart: string;
    rangeEnd: string;
    totalItems: number;
    matchedItems: number;
    createdAt: string;
}

interface StatementItem {
    id: string;
    fitId: string | null;
    trnType: string;
    postedAt: string;
    amount: number;
    memo: string | null;
    matchedStatus: 'UNMATCHED' | 'AUTO' | 'MANUAL' | 'IGNORED' | 'CREATED';
    cashMovementId: string | null;
}

interface ImportDetail extends ImportSummary {
    items: StatementItem[];
}

function brl(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_META: Record<string, { label: string; color: string }> = {
    UNMATCHED: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
    AUTO: { label: 'Casado automaticamente', color: 'bg-emerald-100 text-emerald-700' },
    MANUAL: { label: 'Casado manual', color: 'bg-blue-100 text-blue-700' },
    CREATED: { label: 'Movimento criado', color: 'bg-violet-100 text-violet-700' },
    IGNORED: { label: 'Ignorado', color: 'bg-slate-200 text-slate-600' },
};

export function ReconciliationPage() {
    const { data: importsData, refetch: refetchImports } = useQuery<{ statementImports: ImportSummary[] }>(
        STATEMENT_IMPORTS,
        { fetchPolicy: 'cache-and-network' },
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const imports = importsData?.statementImports ?? [];

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="pb-4 border-b border-slate-200 dark:border-white/[0.06] flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-cyan-500" />
                        Conciliação bancária
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Importe o extrato OFX do banco. O sistema casa automaticamente com seus lançamentos por valor e data.
                    </p>
                </div>
                <UploadOfx onImported={() => refetchImports()} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Importações
                    </div>
                    {imports.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500 text-center">Nenhum extrato importado ainda.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/5">
                            {imports.map((imp) => {
                                const matchedPct = imp.totalItems > 0 ? Math.round((imp.matchedItems / imp.totalItems) * 100) : 0;
                                return (
                                    <li
                                        key={imp.id}
                                        onClick={() => setSelectedId(imp.id)}
                                        className={`px-4 py-2 cursor-pointer ${selectedId === imp.id ? 'bg-cyan-50 dark:bg-cyan-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                    >
                                        <div className="text-sm font-medium truncate">{imp.fileName}</div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                            <span>{new Date(imp.createdAt).toLocaleDateString('pt-BR')}</span>
                                            <span>·</span>
                                            <span>{imp.matchedItems}/{imp.totalItems} ({matchedPct}%)</span>
                                        </div>
                                        <div className="mt-1 h-1 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                                            <div className="h-1 bg-emerald-500" style={{ width: `${matchedPct}%` }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="md:col-span-2">
                    {selectedId ? (
                        <ImportDetailPanel id={selectedId} onUpdated={() => refetchImports()} />
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-12 text-center text-slate-400">
                            Selecione uma importação à esquerda para ver as transações.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UploadOfx({ onImported }: { onImported: () => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showModal, setShowModal] = useState(false);
    const [bankId, setBankId] = useState('');
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState('');
    const { data: banksData } = useQuery<{ banks: { id: string; name: string }[] }>(GET_BANKS, {
        variables: { activeOnly: true },
        skip: !showModal,
    });
    const [doImport, { loading }] = useMutation(IMPORT_OFX);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setContent(String(reader.result ?? ''));
            setFileName(file.name);
        };
        reader.readAsText(file);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankId) return toast.error('Selecione o banco.');
        if (!content) return toast.error('Selecione um arquivo OFX.');
        try {
            const { data } = await doImport({ variables: { bankId, fileName, content } });
            const r = data?.importOfxStatement;
            toast.success(`${r?.itemsCreated} transações importadas (${r?.duplicatesSkipped} duplicadas puladas).`);
            setShowModal(false);
            setContent('');
            setFileName('');
            onImported();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md"
            >
                <Upload className="w-4 h-4" /> Importar OFX
            </button>
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-cyan-500" /> Importar extrato OFX
                        </h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Banco *</label>
                                <select required value={bankId} onChange={(e) => setBankId(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded">
                                    <option value="">Selecione...</option>
                                    {banksData?.banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Arquivo OFX *</label>
                                <input ref={inputRef} type="file" accept=".ofx,text/plain"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    className="w-full text-sm" />
                                {fileName && <p className="text-[11px] text-emerald-700 mt-1">📎 {fileName}</p>}
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded p-2 text-[12px] text-blue-800 dark:text-blue-300">
                                Dica: baixe o extrato em formato <b>OFX</b> no internet banking do seu banco. Aceita extratos do Itaú, Bradesco, Santander, Caixa, Sicredi e outros.
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm">Cancelar</button>
                                <button type="submit" disabled={loading || !content} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded text-sm">
                                    {loading ? 'Importando…' : 'Importar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function ImportDetailPanel({ id, onUpdated }: { id: string; onUpdated: () => void }) {
    const { data, refetch, loading } = useQuery<{ statementImport: ImportDetail }>(STATEMENT_IMPORT, {
        variables: { id },
        fetchPolicy: 'cache-and-network',
    });
    const [autoMatch, { loading: matching }] = useMutation(AUTO_MATCH);
    const [createMov] = useMutation(CREATE_MOVEMENT_FROM_ITEM);
    const [ignore] = useMutation(IGNORE_ITEM);

    const imp = data?.statementImport;
    if (loading && !imp) return <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-12 text-center text-slate-500">Carregando…</div>;
    if (!imp) return null;

    const runAutoMatch = async () => {
        try {
            const { data } = await autoMatch({ variables: { importId: id } });
            toast.success(`${data?.autoMatchStatement?.matched} item(ns) casado(s).`);
            refetch();
            onUpdated();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleCreate = async (itemId: string) => {
        if (!confirm('Criar um novo lançamento de caixa a partir desse item?')) return;
        try {
            await createMov({ variables: { itemId } });
            toast.success('Movimento criado e vinculado.');
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleIgnore = async (itemId: string) => {
        try {
            await ignore({ variables: { itemId } });
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold truncate">{imp.fileName}</div>
                    <div className="text-[11px] text-slate-500">
                        {new Date(imp.rangeStart).toLocaleDateString('pt-BR')} → {new Date(imp.rangeEnd).toLocaleDateString('pt-BR')}
                    </div>
                </div>
                <button onClick={runAutoMatch} disabled={matching}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded">
                    <Sparkles className="w-3.5 h-3.5" /> {matching ? 'Casando…' : 'Casar automaticamente'}
                </button>
            </div>

            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                        <th className="px-4 py-2 text-left">Data</th>
                        <th className="text-left">Memo</th>
                        <th className="text-right">Valor</th>
                        <th>Status</th>
                        <th className="text-right pr-4">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {imp.items.map((item) => {
                        const meta = STATUS_META[item.matchedStatus];
                        const isPending = item.matchedStatus === 'UNMATCHED';
                        return (
                            <tr key={item.id} className="border-b border-slate-100 dark:border-white/5">
                                <td className="px-4 py-1.5 text-[12px]">{new Date(item.postedAt).toLocaleDateString('pt-BR')}</td>
                                <td className="text-[12px] truncate max-w-[180px]">{item.memo ?? <em className="text-slate-400">{item.trnType}</em>}</td>
                                <td className={`text-right tabular-nums text-[12px] font-medium ${item.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {brl(Number(item.amount))}
                                </td>
                                <td>
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                                </td>
                                <td className="text-right pr-4">
                                    {isPending && (
                                        <div className="inline-flex gap-2">
                                            <button onClick={() => handleCreate(item.id)} className="text-[11px] text-violet-600 hover:underline flex items-center gap-0.5">
                                                <Plus className="w-3 h-3" /> Criar
                                            </button>
                                            <button onClick={() => handleIgnore(item.id)} className="text-[11px] text-slate-500 hover:underline flex items-center gap-0.5">
                                                <X className="w-3 h-3" /> Ignorar
                                            </button>
                                        </div>
                                    )}
                                    {!isPending && item.cashMovementId && (
                                        <Check className="w-4 h-4 text-emerald-500 inline" />
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
