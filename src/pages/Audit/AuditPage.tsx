import { useEffect, useMemo, useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  History,
  Loader2,
  Lock,
  RefreshCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  GET_AUDIT_LOGS,
  GET_AUDIT_LOGS_EXPORT_CSV,
  VERIFY_AUDIT_ACCESS,
} from '../../graphql/queries/audit';

type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'SOFT_DELETE'
  | 'DELETE'
  | 'CONFIRM'
  | 'REVERT'
  | 'ACTIVATE'
  | 'FREEZE';

interface AuditLog {
  id: string;
  companyId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  entity: string;
  entityId: string;
  action: AuditAction;
  beforeJson: string | null;
  afterJson: string | null;
  reason: string | null;
  createdAt: string;
}

interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface FiltersState {
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  action: '' | AuditAction;
  search: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
}

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Criação',
  UPDATE: 'Atualização',
  SOFT_DELETE: 'Inativação',
  DELETE: 'Exclusão',
  CONFIRM: 'Confirmação',
  REVERT: 'Estorno',
  ACTIVATE: 'Ativação',
  FREEZE: 'Congelamento',
};

const ACTION_COLOR: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  SOFT_DELETE: 'bg-orange-50 text-orange-700 border-orange-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  CONFIRM: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  REVERT: 'bg-amber-50 text-amber-700 border-amber-200',
  ACTIVATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FREEZE: 'bg-slate-100 text-slate-700 border-slate-200',
};

const initialFilters: FiltersState = {
  entity: '',
  entityId: '',
  userId: '',
  userName: '',
  action: '',
  search: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 50,
};

const TOKEN_KEY = 'auditAccessToken';
const TOKEN_EXP_KEY = 'auditAccessExpiresAt';

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return json;
  }
}

function diffKeys(before: unknown, after: unknown): string[] {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
    return [];
  }
  const a = before as Record<string, unknown>;
  const b = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changed: string[] = [];
  keys.forEach((k) => {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) changed.push(k);
  });
  return changed;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  return String(v);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function isAuditTokenValid(): boolean {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expRaw = sessionStorage.getItem(TOKEN_EXP_KEY);
  if (!token || !expRaw) return false;
  const exp = Number(expRaw);
  return !Number.isNaN(exp) && exp > Date.now();
}

function clearAuditToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXP_KEY);
}

interface ReauthModalProps {
  onSuccess: () => void;
  onCancel?: () => void;
  invalidate?: boolean;
}

function ReauthModal({ onSuccess, onCancel, invalidate }: ReauthModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verify, { loading }] = useMutation(VERIFY_AUDIT_ACCESS);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await verify({ variables: { password } });
      const token = data?.verifyAuditAccess?.token as string | undefined;
      const expiresIn = data?.verifyAuditAccess?.expiresIn as number | undefined;
      if (!token || !expiresIn) {
        setError('Resposta inesperada do servidor.');
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(
        TOKEN_EXP_KEY,
        String(Date.now() + expiresIn * 1000),
      );
      setPassword('');
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao validar credenciais';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-rose-600" />
          <div>
            <h2 className="text-lg font-semibold">Reautenticação obrigatória</h2>
            <p className="text-xs text-slate-500">
              Os logs de auditoria contêm informações sensíveis. Confirme sua
              senha para continuar.
            </p>
          </div>
        </div>

        {invalidate && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2 rounded">
            Sessão de auditoria expirada. Confirme novamente para continuar.
          </div>
        )}

        <label className="block text-sm">
          <span className="block mb-1 text-slate-700">Senha</span>
          <input
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="px-4 py-2 bg-rose-600 text-white rounded text-sm hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Confirmar acesso
          </button>
        </div>
      </form>
    </div>
  );
}

interface DetailModalProps {
  log: AuditLog;
  onClose: () => void;
}

function DetailModal({ log, onClose }: DetailModalProps) {
  const before = safeParse(log.beforeJson);
  const after = safeParse(log.afterJson);
  const changed = diffKeys(before, after);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {log.entity} <span className="text-slate-400">·</span>{' '}
              <span className="font-mono text-sm">{log.entityId}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {ACTION_LABEL[log.action]} · {formatDate(log.createdAt)}
              {log.userName ? ` · por ${log.userName}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto p-6 space-y-6">
          {log.reason && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
              <strong>Motivo:</strong> {log.reason}
            </div>
          )}

          {changed.length > 0 && (
            <section>
              <h3 className="font-semibold mb-3 text-slate-700">
                Campos alterados ({changed.length})
              </h3>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Campo</th>
                      <th className="px-3 py-2 font-medium text-rose-700">Antes</th>
                      <th className="px-3 py-2 font-medium text-emerald-700">Depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changed.map((k) => {
                      const a = (before as Record<string, unknown> | null)?.[k];
                      const b = (after as Record<string, unknown> | null)?.[k];
                      return (
                        <tr key={k} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs">{k}</td>
                          <td className="px-3 py-2 text-rose-700 break-all">
                            {formatValue(a)}
                          </td>
                          <td className="px-3 py-2 text-emerald-700 break-all">
                            {formatValue(b)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {before !== null && (
            <section>
              <h3 className="font-semibold mb-2 text-slate-700">
                Estado anterior (completo)
              </h3>
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(before, null, 2)}
              </pre>
            </section>
          )}

          {after !== null && (
            <section>
              <h3 className="font-semibold mb-2 text-slate-700">
                Estado posterior (completo)
              </h3>
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(after, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditPage() {
  const [authorized, setAuthorized] = useState<boolean>(() =>
    isAuditTokenValid(),
  );
  const [reauthInvalidate, setReauthInvalidate] = useState(false);

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [pendingFilters, setPendingFilters] = useState<FiltersState>(initialFilters);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  // Polling-light: a cada 30s revalida o token local; se expirou força re-auth
  useEffect(() => {
    if (!authorized) return;
    const interval = setInterval(() => {
      if (!isAuditTokenValid()) {
        setAuthorized(false);
        setReauthInvalidate(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [authorized]);

  const variables = useMemo(() => {
    const f = filters;
    return {
      filter: {
        ...(f.entity ? { entity: f.entity } : {}),
        ...(f.entityId ? { entityId: f.entityId } : {}),
        ...(f.userId ? { userId: f.userId } : {}),
        ...(f.userName ? { userName: f.userName } : {}),
        ...(f.action ? { action: f.action } : {}),
        ...(f.search ? { search: f.search } : {}),
        ...(f.from ? { from: new Date(f.from).toISOString() } : {}),
        ...(f.to ? { to: new Date(f.to).toISOString() } : {}),
        page: f.page,
        pageSize: f.pageSize,
      },
    };
  }, [filters]);

  const { data, loading, error, refetch } = useQuery<{ auditLogs: AuditLogPage }>(
    GET_AUDIT_LOGS,
    {
      variables,
      fetchPolicy: 'cache-and-network',
      skip: !authorized,
    },
  );

  const [fetchCsv, { loading: csvLoading }] = useLazyQuery<{
    auditLogsExportCsv: string;
  }>(GET_AUDIT_LOGS_EXPORT_CSV, { fetchPolicy: 'network-only' });

  // Erro de re-auth: limpa token e força modal
  useEffect(() => {
    if (!error) return;
    const message = error.message || '';
    if (
      message.includes('reautentique') ||
      message.includes('reautenticação') ||
      message.toLowerCase().includes('audit')
    ) {
      clearAuditToken();
      setAuthorized(false);
      setReauthInvalidate(true);
    }
  }, [error]);

  const items = data?.auditLogs.items ?? [];
  const total = data?.auditLogs.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  const applyFilters = () => {
    setFilters({ ...pendingFilters, page: 1 });
  };

  const resetFilters = () => {
    setPendingFilters(initialFilters);
    setFilters(initialFilters);
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = async () => {
    try {
      const result = await fetchCsv({ variables });
      const csv = result.data?.auditLogsExportCsv;
      if (!csv) return;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `auditoria-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('audit')) {
        clearAuditToken();
        setAuthorized(false);
        setReauthInvalidate(true);
      } else {
        alert('Erro ao exportar CSV: ' + msg);
      }
    }
  };

  if (!authorized) {
    return (
      <ReauthModal
        invalidate={reauthInvalidate}
        onSuccess={() => {
          setAuthorized(true);
          setReauthInvalidate(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-['Rajdhani'] font-bold">Auditoria</h1>
            <p className="text-xs text-slate-500">
              Histórico completo de criações, alterações e exclusões
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={csvLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            {csvLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar CSV
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => {
              clearAuditToken();
              setAuthorized(false);
              setReauthInvalidate(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-slate-50"
            title="Encerrar sessão de auditoria"
          >
            <Lock className="w-4 h-4" />
            Bloquear
          </button>
        </div>
      </header>

      <section className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Entidade</span>
            <input
              type="text"
              placeholder="Ex.: Bank, Order, Customer"
              value={pendingFilters.entity}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, entity: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">ID do registro</span>
            <input
              type="text"
              value={pendingFilters.entityId}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, entityId: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Nome do usuário</span>
            <input
              type="text"
              placeholder="Ex.: João"
              value={pendingFilters.userName}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, userName: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">ID do usuário</span>
            <input
              type="text"
              value={pendingFilters.userId}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, userId: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Ação</span>
            <select
              value={pendingFilters.action}
              onChange={(e) =>
                setPendingFilters((p) => ({
                  ...p,
                  action: e.target.value as FiltersState['action'],
                }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              {(Object.keys(ACTION_LABEL) as AuditAction[]).map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs md:col-span-2">
            <span className="block mb-1 text-slate-600">Busca</span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Entidade, ID ou motivo..."
                value={pendingFilters.search}
                onChange={(e) =>
                  setPendingFilters((p) => ({ ...p, search: e.target.value }))
                }
                className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
              />
            </div>
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">De</span>
            <input
              type="datetime-local"
              value={pendingFilters.from}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, from: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="block mb-1 text-slate-600">Até</span>
            <input
              type="datetime-local"
              value={pendingFilters.to}
              onChange={(e) =>
                setPendingFilters((p) => ({ ...p, to: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Aplicar
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 border text-sm rounded hover:bg-slate-50"
          >
            Limpar
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded">
          Erro ao carregar logs: {error.message}
        </div>
      )}

      <section className="bg-white border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b text-sm">
          <span className="text-slate-600">
            {loading
              ? 'Carregando...'
              : `${total.toLocaleString('pt-BR')} registro(s) encontrados`}
          </span>
          <span className="text-slate-500 text-xs">
            Página {filters.page} de {totalPages}
          </span>
        </div>

        {loading && items.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum registro encontrado
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Data/hora</th>
                <th className="px-3 py-2 font-medium">Ação</th>
                <th className="px-3 py-2 font-medium">Entidade</th>
                <th className="px-3 py-2 font-medium">Registro</th>
                <th className="px-3 py-2 font-medium">Usuário</th>
                <th className="px-3 py-2 font-medium">Motivo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelected(log)}
                >
                  <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded border ${ACTION_COLOR[log.action]}`}
                    >
                      {ACTION_LABEL[log.action]}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">{log.entity}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600 max-w-[180px] truncate">
                    {log.entityId}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {log.userName ?? log.userEmail ?? (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 max-w-[240px] truncate">
                    {log.reason ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-blue-600 text-xs">Detalhes →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
          <button
            onClick={() => goToPage(Math.max(1, filters.page - 1))}
            disabled={filters.page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            {filters.pageSize} por página
          </span>
          <button
            onClick={() => goToPage(Math.min(totalPages, filters.page + 1))}
            disabled={filters.page >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-slate-50"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {selected && (
        <DetailModal log={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
