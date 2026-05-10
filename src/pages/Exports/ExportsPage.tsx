import { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { FileDown, Plus, Play, Trash2 } from 'lucide-react';

const EXPORT_TEMPLATES = gql`
  query ExportTemplates {
    exportTemplates {
      id name module format filtersJson columns schedule createdAt updatedAt
    }
  }
`;
const CREATE_EXPORT_TEMPLATE = gql`
  mutation CreateExportTemplate($input: CreateExportTemplateInput!) {
    createExportTemplate(input: $input) { id name }
  }
`;
const DELETE_EXPORT_TEMPLATE = gql`
  mutation DeleteExportTemplate($id: String!) {
    deleteExportTemplate(id: $id)
  }
`;
const RUN_EXPORT_TEMPLATE = gql`
  mutation RunExportTemplate($id: String!) {
    runExportTemplate(id: $id) { filename mimeType content }
  }
`;

interface Template {
    id: string;
    name: string;
    module: string;
    format: string;
    filtersJson: string;
    columns: string[];
    schedule: string | null;
    updatedAt: string;
}

const MODULES = [
    { value: 'sales', label: 'Vendas / Pedidos', defaultColumns: ['number', 'customerName', 'total', 'status', 'createdAt'] },
    { value: 'receivables', label: 'Contas a Receber', defaultColumns: ['description', 'customer.name', 'amount', 'dueDate', 'status'] },
    { value: 'payables', label: 'Contas a Pagar', defaultColumns: ['supplierName', 'description', 'amount', 'dueDate', 'status'] },
    { value: 'movements', label: 'Movimentações de Caixa', defaultColumns: ['date', 'type', 'category', 'value', 'description', 'typePayment'] },
    { value: 'inventory', label: 'Estoque', defaultColumns: ['nameProduct', 'quantity', 'salePrice', 'minStock', 'unit'] },
];

export function ExportsPage() {
    const { data, refetch } = useQuery<{ exportTemplates: Template[] }>(EXPORT_TEMPLATES, {
        fetchPolicy: 'cache-and-network',
    });
    const [createTpl] = useMutation(CREATE_EXPORT_TEMPLATE);
    const [deleteTpl] = useMutation(DELETE_EXPORT_TEMPLATE);
    const [runTpl, { loading: running }] = useMutation(RUN_EXPORT_TEMPLATE);

    const [creating, setCreating] = useState(false);
    const templates = data?.exportTemplates ?? [];

    const handleRun = async (tpl: Template) => {
        try {
            const { data } = await runTpl({ variables: { id: tpl.id } });
            const r = data?.runExportTemplate;
            if (!r) return;
            // Download
            const blob = new Blob([r.content], { type: r.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = r.filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Exportado.');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apagar este modelo?')) return;
        try {
            await deleteTpl({ variables: { id } });
            toast.success('Apagado.');
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-blue-500" />
                        Modelos de Exportação
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Crie modelos reutilizáveis para gerar relatórios em CSV. Cada modelo escolhe o
                        módulo, filtros e colunas.
                    </p>
                </div>
                <button
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                    <Plus className="w-4 h-4" /> Novo modelo
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl">
                {templates.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                        Nenhum modelo ainda. Clique em "Novo modelo" para começar.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-white/10">
                                <th className="px-4 py-3">Nome</th>
                                <th>Módulo</th>
                                <th>Formato</th>
                                <th>Atualizado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map((t) => (
                                <tr key={t.id} className="border-b border-slate-100 dark:border-white/5">
                                    <td className="px-4 py-3 font-medium">{t.name}</td>
                                    <td>{MODULES.find((m) => m.value === t.module)?.label ?? t.module}</td>
                                    <td>{t.format}</td>
                                    <td className="text-[12px] text-slate-500">{new Date(t.updatedAt).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRun(t)}
                                                disabled={running}
                                                className="text-[12px] inline-flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
                                            >
                                                <Play className="w-3.5 h-3.5" /> Exportar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-[12px] inline-flex items-center gap-1 text-rose-600 hover:underline"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Apagar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {creating && (
                <CreateTemplateDialog
                    onClose={() => setCreating(false)}
                    onCreated={() => {
                        setCreating(false);
                        refetch();
                    }}
                    create={createTpl}
                />
            )}
        </div>
    );
}

function CreateTemplateDialog({
    onClose,
    onCreated,
    create,
}: {
    onClose: () => void;
    onCreated: () => void;
    create: any;
}) {
    const [name, setName] = useState('');
    const [module, setModule] = useState(MODULES[0].value);
    const [format, setFormat] = useState<'CSV' | 'XLSX' | 'PDF'>('CSV');
    const [columns, setColumns] = useState<string>(MODULES[0].defaultColumns.join(', '));
    const [filtersJson, setFiltersJson] = useState('{}');

    const handleModuleChange = (v: string) => {
        setModule(v);
        const m = MODULES.find((x) => x.value === v);
        if (m) setColumns(m.defaultColumns.join(', '));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            JSON.parse(filtersJson); // valida
        } catch {
            toast.error('Filtros JSON inválido.');
            return;
        }
        try {
            await create({
                variables: {
                    input: {
                        name,
                        module,
                        format,
                        filtersJson,
                        columns: columns.split(',').map((c) => c.trim()).filter(Boolean),
                    },
                },
            });
            toast.success('Modelo criado.');
            onCreated();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold mb-4">Novo modelo de exportação</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            placeholder="Ex: Vendas do mês"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Módulo</label>
                            <select
                                value={module}
                                onChange={(e) => handleModuleChange(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            >
                                {MODULES.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Formato</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as any)}
                                className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            >
                                <option value="CSV">CSV (recomendado)</option>
                                <option value="XLSX" disabled>XLSX (em breve)</option>
                                <option value="PDF" disabled>PDF (em breve)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Colunas <span className="text-[11px] text-slate-400">(separar por vírgula, dot-notation pra nested)</span>
                        </label>
                        <input
                            value={columns}
                            onChange={(e) => setColumns(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded font-mono text-[12px]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Filtros (JSON) <span className="text-[11px] text-slate-400">— ex: {`{"from":"2026-01-01"}`}</span>
                        </label>
                        <textarea
                            value={filtersJson}
                            onChange={(e) => setFiltersJson(e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded font-mono text-[12px]"
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Criar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
