import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
  FolderTree,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  CREATE_FINANCIAL_ACCOUNT,
  DELETE_FINANCIAL_ACCOUNT,
  GET_FINANCIAL_ACCOUNTS,
  SEED_DEFAULT_FINANCIAL_ACCOUNTS,
  UPDATE_FINANCIAL_ACCOUNT,
} from '../../graphql/queries/financial-accounts';

type AccountType = 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';

interface FinancialAccount {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  active: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  code: string;
  name: string;
  type: AccountType;
  parentId: string;
  active: boolean;
  description: string;
}

const TYPE_LABEL: Record<AccountType, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  ASSET: 'Ativo',
  LIABILITY: 'Passivo',
  EQUITY: 'Patrimônio',
};

const TYPE_COLOR: Record<AccountType, string> = {
  INCOME: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPENSE: 'bg-rose-50 text-rose-700 border-rose-200',
  ASSET: 'bg-blue-50 text-blue-700 border-blue-200',
  LIABILITY: 'bg-amber-50 text-amber-700 border-amber-200',
  EQUITY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const emptyForm: FormState = {
  code: '',
  name: '',
  type: 'EXPENSE',
  parentId: '',
  active: true,
  description: '',
};

interface TreeNode {
  account: FinancialAccount;
  children: TreeNode[];
}

function buildTree(accounts: FinancialAccount[]): TreeNode[] {
  const byParent = new Map<string | null, FinancialAccount[]>();
  for (const a of accounts) {
    const arr = byParent.get(a.parentId) ?? [];
    arr.push(a);
    byParent.set(a.parentId, arr);
  }
  const build = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((account) => ({ account, children: build(account.id) }));
  return build(null);
}

interface AccountFormProps {
  initial: FormState;
  accounts: FinancialAccount[];
  onSubmit: (values: FormState) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  isEditing: boolean;
  editingId?: string;
}

function AccountForm({
  initial,
  accounts,
  onSubmit,
  onCancel,
  saving,
  isEditing,
  editingId,
}: AccountFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);

  const possibleParents = accounts.filter(
    (a) => a.id !== editingId && a.type === form.type,
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white border rounded-lg p-5 space-y-4"
    >
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">
          {isEditing ? 'Editar conta' : 'Nova conta'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-slate-100 rounded"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Código *</span>
          <input
            type="text"
            required
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            placeholder="Ex.: 2.01.003"
            className="w-full border rounded px-3 py-2 font-mono text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Nome *</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Tipo *</span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                type: e.target.value as AccountType,
                parentId: '',
              }))
            }
            className="w-full border rounded px-3 py-2"
          >
            {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Conta pai</span>
          <select
            value={form.parentId}
            onChange={(e) =>
              setForm((p) => ({ ...p, parentId: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="">— raiz —</option>
            {possibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm md:col-span-2">
          <span className="block mb-1 text-slate-600">Descrição</span>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={2}
            className="w-full border rounded px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((p) => ({ ...p, active: e.target.checked }))
            }
          />
          Ativa
        </label>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded text-sm hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  onEdit: (a: FinancialAccount) => void;
  onDelete: (a: FinancialAccount) => void;
}

function TreeRow({
  node,
  depth,
  expanded,
  toggle,
  onEdit,
  onDelete,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const open = expanded.has(node.account.id);

  return (
    <>
      <tr className="border-t hover:bg-slate-50">
        <td className="px-3 py-2">
          <div
            className="flex items-center gap-1"
            style={{ paddingLeft: depth * 18 }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggle(node.account.id)}
                className="p-0.5 hover:bg-slate-200 rounded"
              >
                {open ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className="font-mono text-xs text-slate-500">
              {node.account.code}
            </span>
            <span
              className={`font-medium ${
                node.account.active ? '' : 'text-slate-400 line-through'
              }`}
            >
              {node.account.name}
            </span>
          </div>
        </td>
        <td className="px-3 py-2">
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded border ${TYPE_COLOR[node.account.type]}`}
          >
            {TYPE_LABEL[node.account.type]}
          </span>
        </td>
        <td className="px-3 py-2 text-xs text-slate-500 max-w-xs truncate">
          {node.account.description ?? '—'}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex justify-end gap-1">
            <button
              onClick={() => onEdit(node.account)}
              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(node.account)}
              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {open &&
        node.children.map((child) => (
          <TreeRow
            key={child.account.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}

export function ChartOfAccountsPage() {
  const [filterType, setFilterType] = useState<'' | AccountType>('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);

  const { data, loading, error, refetch } = useQuery<{
    financialAccounts: FinancialAccount[];
  }>(GET_FINANCIAL_ACCOUNTS, {
    variables: {
      filter: {
        ...(filterType ? { type: filterType } : {}),
        ...(activeOnly ? { activeOnly: true } : {}),
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const [createMut, { loading: creatingLoading }] = useMutation(
    CREATE_FINANCIAL_ACCOUNT,
  );
  const [updateMut, { loading: updatingLoading }] = useMutation(
    UPDATE_FINANCIAL_ACCOUNT,
  );
  const [deleteMut] = useMutation(DELETE_FINANCIAL_ACCOUNT);
  const [seedMut, { loading: seeding }] = useMutation(
    SEED_DEFAULT_FINANCIAL_ACCOUNTS,
  );

  const accounts = data?.financialAccounts ?? [];
  const tree = useMemo(() => buildTree(accounts), [accounts]);

  const expandAll = () => {
    setExpanded(new Set(accounts.map((a) => a.id)));
  };
  const collapseAll = () => setExpanded(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (values: FormState) => {
    await createMut({
      variables: {
        input: {
          code: values.code,
          name: values.name,
          type: values.type,
          parentId: values.parentId || null,
          active: values.active,
          description: values.description || null,
        },
      },
    });
    await refetch();
    setCreating(false);
  };

  const handleUpdate = async (values: FormState) => {
    if (!editing) return;
    await updateMut({
      variables: {
        id: editing.id,
        input: {
          code: values.code,
          name: values.name,
          type: values.type,
          parentId: values.parentId || null,
          active: values.active,
          description: values.description || null,
        },
      },
    });
    await refetch();
    setEditing(null);
  };

  const handleDelete = async (a: FinancialAccount) => {
    if (
      !window.confirm(
        `Excluir a conta "${a.code} — ${a.name}"?\n\nSe houver contas filhas, esta operação falhará.`,
      )
    )
      return;
    try {
      await deleteMut({ variables: { id: a.id } });
      await refetch();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Erro ao excluir a conta.',
      );
    }
  };

  const handleSeed = async () => {
    if (
      !window.confirm(
        'Criar plano de contas inicial sugerido? Isso só funciona se ainda não houver nenhuma conta cadastrada.',
      )
    )
      return;
    try {
      await seedMut();
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar plano padrão.');
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FolderTree className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold">
              Plano de Contas
            </h1>
            <p className="text-xs text-slate-500">
              Categorias financeiras hierárquicas para receitas, despesas e patrimônio.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Carregar plano sugerido
            </button>
          )}
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nova conta
          </button>
        </div>
      </header>

      <section className="bg-white border rounded-lg p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block mb-1 text-slate-600">Tipo</span>
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as '' | AccountType)
            }
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm pb-1">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Apenas ativas
        </label>
        <div className="ml-auto flex gap-1">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs border rounded hover:bg-slate-50"
          >
            Expandir tudo
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs border rounded hover:bg-slate-50"
          >
            Recolher tudo
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar contas: {error.message}
        </div>
      )}

      {(creating || editing) && (
        <AccountForm
          initial={
            editing
              ? {
                  code: editing.code,
                  name: editing.name,
                  type: editing.type,
                  parentId: editing.parentId ?? '',
                  active: editing.active,
                  description: editing.description ?? '',
                }
              : emptyForm
          }
          accounts={accounts}
          editingId={editing?.id}
          isEditing={!!editing}
          saving={creatingLoading || updatingLoading}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <section className="bg-white border rounded-lg overflow-hidden">
        {loading && accounts.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : tree.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma conta cadastrada.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Conta</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Descrição</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {tree.map((node) => (
                <TreeRow
                  key={node.account.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  toggle={toggle}
                  onEdit={(a) => {
                    setCreating(false);
                    setEditing(a);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
