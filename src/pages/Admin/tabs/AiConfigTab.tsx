import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { toast } from 'sonner';

const CHAT_WITH_AI = gql`
  mutation ChatWithAi($message: String!, $conversationId: String, $model: String) {
    chatWithAi(message: $message, conversationId: $conversationId, model: $model) {
      conversationId
      assistantMessage { id content createdAt }
      pendingActions { id tool description paramsJson }
    }
  }
`;

const MODELS = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini (recomendado — barato e rápido)' },
  { value: 'gpt-4o', label: 'gpt-4o (mais capaz, mais caro)' },
  { value: 'gpt-4-turbo', label: 'gpt-4-turbo (legado)' },
];

export function AiConfigTab() {
  const [model, setModel] = useState(localStorage.getItem('ai-default-model') ?? 'gpt-4o-mini');
  const [testInput, setTestInput] = useState('Resumo financeiro de hoje, por favor.');
  const [testOutput, setTestOutput] = useState('');
  const [chat, { loading }] = useMutation(CHAT_WITH_AI);

  const saveModel = (m: string) => {
    setModel(m);
    localStorage.setItem('ai-default-model', m);
    toast.success(`Modelo padrão: ${m}`);
  };

  const runTest = async () => {
    setTestOutput('Consultando…');
    try {
      const { data } = await chat({ variables: { message: testInput, model } });
      setTestOutput(data?.chatWithAi?.assistantMessage?.content ?? '(sem resposta)');
    } catch (e: any) {
      setTestOutput(`ERRO: ${e.message}`);
    }
  };

  return (
    <div>
      <fieldset className="win98-fieldset">
        <legend>Configuração da IA (OpenAI)</legend>
        <div style={{ marginBottom: 8 }}>
          <span className="win98-label">Modelo padrão:</span>
          <select
            className="win98-select"
            value={model}
            onChange={(e) => saveModel(e.target.value)}
            style={{ minWidth: 360 }}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="win98-helptext" style={{ background: '#ffffe1', border: '1px solid #808080', padding: 8 }}>
          <b>Para a IA funcionar, o servidor precisa de:</b>
          <pre style={{ fontFamily: 'monospace', fontSize: 11, margin: '4px 0' }}>
{`OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini`}
          </pre>
          A chave é criada em <b>platform.openai.com → API Keys</b>. Ela fica APENAS no servidor —
          o front nunca recebe a chave.
        </div>
      </fieldset>

      <fieldset className="win98-fieldset">
        <legend>Capacidades da IA</legend>
        <p className="win98-helptext">
          A IA tem acesso às seguintes ferramentas. Ações de <b>escrita</b> sempre pedem confirmação
          antes de executar:
        </p>
        <table className="win98-table">
          <thead>
            <tr>
              <th>Ferramenta</th>
              <th>Tipo</th>
              <th>O que faz</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>getDailySummary</td><td><span className="win98-badge success">leitura</span></td><td>Resumo do dia (vendas, recebido, pago)</td></tr>
            <tr><td>getWeeklySummary</td><td><span className="win98-badge success">leitura</span></td><td>Resumo da semana + top clientes/produtos</td></tr>
            <tr><td>getAlerts</td><td><span className="win98-badge success">leitura</span></td><td>Boletos vencidos + estoque baixo</td></tr>
            <tr><td>searchProducts</td><td><span className="win98-badge success">leitura</span></td><td>Busca de produto por nome</td></tr>
            <tr><td>searchCustomers</td><td><span className="win98-badge success">leitura</span></td><td>Busca de cliente por nome/CPF</td></tr>
            <tr><td>listPendingReceivables</td><td><span className="win98-badge success">leitura</span></td><td>Contas a receber pendentes/vencidas</td></tr>
            <tr><td>createAccountPayable</td><td><span className="win98-badge danger">escrita</span></td><td>Cria conta a pagar (após confirmação)</td></tr>
            <tr><td>markReceivableAsPaid</td><td><span className="win98-badge danger">escrita</span></td><td>Marca AR como paga + cria movimentação</td></tr>
            <tr><td>productionEntry</td><td><span className="win98-badge danger">escrita</span></td><td>Registra produção no estoque</td></tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset className="win98-fieldset">
        <legend>Testar IA</legend>
        <textarea
          className="win98-textarea"
          rows={3}
          style={{ width: '100%' }}
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
        />
        <div style={{ marginTop: 6, textAlign: 'right' }}>
          <button className="win98-button primary" onClick={runTest} disabled={loading}>
            {loading ? 'Pensando…' : 'Enviar pergunta'}
          </button>
        </div>
        {testOutput && (
          <>
            <div style={{ marginTop: 8, fontWeight: 'bold' }}>Resposta:</div>
            <textarea
              className="win98-textarea"
              readOnly
              rows={10}
              style={{ width: '100%' }}
              value={testOutput}
            />
          </>
        )}
      </fieldset>
    </div>
  );
}
