import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ADMIN_AUDIT_LOGS } from '../../../graphql/queries/admin';

interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  reason: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  companyId: string;
  createdAt: string;
}

interface LogsResp {
  auditLogs: {
    items: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
  };
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'REVERT'] as const;

export function LogsTab() {
  const [filter, setFilter] = useState({
    entity: '',
    action: '' as '' | (typeof ACTIONS)[number],
    search: '',
    userName: '',
    page: 1,
  });
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, loading, refetch } = useQuery<LogsResp>(ADMIN_AUDIT_LOGS, {
    variables: {
      filter: {
        entity: filter.entity || undefined,
        action: filter.action || undefined,
        search: filter.search || undefined,
        userName: filter.userName || undefined,
        page: filter.page,
        pageSize: 50,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  const items = data?.auditLogs.items ?? [];
  const total = data?.auditLogs.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div>
      <fieldset className="win98-fieldset">
        <legend>Filtros</legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 6 }}>
          <input
            className="win98-input"
            placeholder="Entidade (ex: AccountPayable)"
            value={filter.entity}
            onChange={(e) => setFilter({ ...filter, entity: e.target.value, page: 1 })}
          />
          <select
            className="win98-select"
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value as any, page: 1 })}
          >
            <option value="">Todas as ações</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input
            className="win98-input"
            placeholder="Nome do usuário"
            value={filter.userName}
            onChange={(e) => setFilter({ ...filter, userName: e.target.value, page: 1 })}
          />
          <input
            className="win98-input"
            placeholder="Buscar por texto..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value, page: 1 })}
          />
          <button className="win98-button" onClick={() => refetch()}>
            Aplicar
          </button>
        </div>
      </fieldset>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '2fr 1fr' : '1fr', gap: 8 }}>
        <table className="win98-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Quem</th>
              <th>Entidade</th>
              <th>ID</th>
              <th>Ação</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr
                key={l.id}
                onClick={() => setSelected(l)}
                className={selected?.id === l.id ? 'selected' : ''}
                style={{ cursor: 'pointer' }}
              >
                <td>{new Date(l.createdAt).toLocaleString('pt-BR')}</td>
                <td>{l.userName ?? l.userEmail ?? '—'}</td>
                <td>{l.entity}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{l.entityId.slice(0, 8)}…</td>
                <td>
                  <span
                    className={`win98-badge ${
                      l.action === 'DELETE' ? 'danger' : l.action === 'CREATE' ? 'success' : ''
                    }`}
                  >
                    {l.action}
                  </span>
                </td>
                <td>{l.reason ?? '—'}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#404040' }}>
                  {loading ? 'Carregando...' : 'Nenhum log.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {selected && (
          <fieldset className="win98-fieldset" style={{ margin: 0 }}>
            <legend>Detalhe</legend>
            <div style={{ fontSize: 11 }}>
              <div><b>ID:</b> {selected.id}</div>
              <div><b>Quando:</b> {new Date(selected.createdAt).toLocaleString('pt-BR')}</div>
              <div><b>Quem:</b> {selected.userName ?? '—'} ({selected.userEmail ?? '—'})</div>
              <div><b>Empresa:</b> {selected.companyId}</div>
              <div><b>Entidade:</b> {selected.entity} #{selected.entityId}</div>
              <div><b>Ação:</b> {selected.action}</div>
              {selected.reason && <div><b>Motivo:</b> {selected.reason}</div>}

              {selected.beforeJson && (
                <>
                  <div style={{ marginTop: 8, fontWeight: 'bold' }}>Antes:</div>
                  <textarea
                    className="win98-textarea"
                    readOnly
                    style={{ width: '100%', height: 100 }}
                    value={tryFormat(selected.beforeJson)}
                  />
                </>
              )}
              {selected.afterJson && (
                <>
                  <div style={{ marginTop: 6, fontWeight: 'bold' }}>Depois:</div>
                  <textarea
                    className="win98-textarea"
                    readOnly
                    style={{ width: '100%', height: 100 }}
                    value={tryFormat(selected.afterJson)}
                  />
                </>
              )}
            </div>
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <button className="win98-button" onClick={() => setSelected(null)}>Fechar</button>
            </div>
          </fieldset>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span className="win98-helptext">
          {total} registros — página {filter.page} de {totalPages}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="win98-button"
            disabled={filter.page <= 1}
            onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
          >
            ← Anterior
          </button>
          <button
            className="win98-button"
            disabled={filter.page >= totalPages}
            onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
}

function tryFormat(v: string): string {
  try {
    return JSON.stringify(JSON.parse(v), null, 2);
  } catch {
    return v;
  }
}
