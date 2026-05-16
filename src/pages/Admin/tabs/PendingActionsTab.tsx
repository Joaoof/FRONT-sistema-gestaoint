import { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';

const Q_PENDING = gql`
  query AiPendingActions($channel: String) {
    aiPendingActions(channel: $channel) {
      id
      tool
      description
      paramsJson
      status
      channel
      peerNumber
      userId
      conversationId
      createdAt
    }
  }
`;

const M_EXECUTE = gql`
  mutation ExecuteAiAction($actionId: String!) {
    executeAiAction(actionId: $actionId) {
      ok
      resultJson
    }
  }
`;

const M_CANCEL = gql`
  mutation CancelAiAction($actionId: String!) {
    cancelAiAction(actionId: $actionId)
  }
`;

type Pending = {
  id: string;
  tool: string;
  description: string;
  paramsJson: string;
  status: string;
  channel: string;
  peerNumber: string | null;
  userId: string | null;
  conversationId: string | null;
  createdAt: string;
};

const CHANNEL_LABEL: Record<string, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
};

export function PendingActionsTab() {
  const [filter, setFilter] = useState<'all' | 'web' | 'whatsapp'>('all');
  const { data, loading, refetch } = useQuery<{ aiPendingActions: Pending[] }>(Q_PENDING, {
    variables: filter === 'all' ? {} : { channel: filter },
    fetchPolicy: 'network-only',
  });
  const [executeMutation] = useMutation(M_EXECUTE);
  const [cancelMutation] = useMutation(M_CANCEL);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = data?.aiPendingActions ?? [];

  const approve = async (id: string) => {
    if (!confirm('Aprovar e executar essa ação? Esta operação altera dados do sistema.')) return;
    setBusyId(id);
    try {
      const { data } = await executeMutation({ variables: { actionId: id } });
      if (data?.executeAiAction?.ok) {
        toast.success('Ação executada.');
        await refetch();
      } else {
        toast.error('Falha ao executar.');
      }
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    if (!confirm('Rejeitar esta ação? Ela ficará marcada como cancelada.')) return;
    setBusyId(id);
    try {
      await cancelMutation({ variables: { actionId: id } });
      toast.success('Ação cancelada.');
      await refetch();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <fieldset className="win98-fieldset">
        <legend>Filtro</legend>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="win98-label">Canal:</span>
          <button
            className={`win98-button ${filter === 'all' ? 'primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`win98-button ${filter === 'web' ? 'primary' : ''}`}
            onClick={() => setFilter('web')}
          >
            Web
          </button>
          <button
            className={`win98-button ${filter === 'whatsapp' ? 'primary' : ''}`}
            onClick={() => setFilter('whatsapp')}
          >
            WhatsApp
          </button>
          <button className="win98-button" onClick={() => refetch()} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </fieldset>

      <fieldset className="win98-fieldset">
        <legend>Ações pendentes ({rows.length})</legend>
        {rows.length === 0 ? (
          <p className="win98-helptext">Nenhuma ação pendente.</p>
        ) : (
          <table className="win98-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Tool</th>
                <th>Descrição</th>
                <th>Origem</th>
                <th>Quando</th>
                <th style={{ width: 220 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const isOpen = expanded === p.id;
                return (
                  <>
                    <tr key={p.id}>
                      <td>
                        <span
                          className={`win98-badge ${p.channel === 'whatsapp' ? 'success' : ''}`}
                        >
                          {CHANNEL_LABEL[p.channel] ?? p.channel}
                        </span>
                      </td>
                      <td><code>{p.tool}</code></td>
                      <td>{p.description}</td>
                      <td style={{ fontSize: 11 }}>
                        {p.channel === 'whatsapp' ? (
                          <span title="Número do cliente WhatsApp">📱 {p.peerNumber ?? '(sem número)'}</span>
                        ) : (
                          <span title="Usuário web">👤 {p.userId?.slice(0, 8) ?? '-'}</span>
                        )}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        {new Date(p.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td>
                        <button
                          className="win98-button primary"
                          disabled={busyId === p.id}
                          onClick={() => approve(p.id)}
                        >
                          ✓ Aprovar
                        </button>{' '}
                        <button
                          className="win98-button"
                          disabled={busyId === p.id}
                          onClick={() => reject(p.id)}
                        >
                          ✗ Rejeitar
                        </button>{' '}
                        <button
                          className="win98-button"
                          onClick={() => setExpanded(isOpen ? null : p.id)}
                        >
                          {isOpen ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} style={{ background: '#f5f5f5' }}>
                          <div style={{ padding: 8 }}>
                            <b>Parâmetros:</b>
                            <pre style={{ fontSize: 11, margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(JSON.parse(p.paramsJson), null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </fieldset>
    </div>
  );
}
