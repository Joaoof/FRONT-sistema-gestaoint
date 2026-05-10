import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './admin-win98.css';
import { UsersTab } from './tabs/UsersTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { LogsTab } from './tabs/LogsTab';
import { AiConfigTab } from './tabs/AiConfigTab';
import { PaymentsTab } from './tabs/PaymentsTab';

type Tab = 'users' | 'permissions' | 'logs' | 'ai' | 'payments';

export function AdminConsole() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');

  const isSuper = (user as any)?.isSuperAdmin === true;

  if (!isSuper) {
    return (
      <div className="win98">
        <div className="win98-window win98-error-card">
          <div className="win98-titlebar">
            <span>⚠ Acesso negado</span>
          </div>
          <div className="win98-content" style={{ padding: 20 }}>
            <p style={{ marginBottom: 16 }}>
              Esta área é restrita ao <b>super-administrador</b>.
            </p>
            <p style={{ marginBottom: 16, fontSize: 11, color: '#404040' }}>
              Se você acabou de ser promovido, faça <b>logout</b> e entre novamente.
            </p>
            <div style={{ textAlign: 'right' }}>
              <button
                className="win98-button"
                onClick={() => (window.location.href = '/dashboard')}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="win98">
      <div className="win98-window">
        <div className="win98-titlebar">
          <span>📋 Painel do Administrador — GestãoInt v1.0</span>
          <div className="win98-titlebar-buttons">
            <button className="win98-titlebar-btn" title="Minimizar">_</button>
            <button className="win98-titlebar-btn" title="Maximizar">□</button>
            <button
              className="win98-titlebar-btn"
              title="Fechar"
              onClick={() => (window.location.href = '/dashboard')}
            >
              ×
            </button>
          </div>
        </div>

        <div className="win98-content">
          <div className="win98-toolbar">
            <span className="win98-helptext">
              Logado como <b>{user?.email}</b>
              <span className="win98-badge danger">SUPER-ADMIN</span>
            </span>
          </div>

          <div className="win98-tabs">
            <button
              className={`win98-tab ${tab === 'users' ? 'active' : ''}`}
              onClick={() => setTab('users')}
            >
              👥 Usuários
            </button>
            <button
              className={`win98-tab ${tab === 'permissions' ? 'active' : ''}`}
              onClick={() => setTab('permissions')}
            >
              🔑 Permissões
            </button>
            <button
              className={`win98-tab ${tab === 'logs' ? 'active' : ''}`}
              onClick={() => setTab('logs')}
            >
              📜 Logs Master
            </button>
            <button
              className={`win98-tab ${tab === 'ai' ? 'active' : ''}`}
              onClick={() => setTab('ai')}
            >
              🤖 IA
            </button>
            <button
              className={`win98-tab ${tab === 'payments' ? 'active' : ''}`}
              onClick={() => setTab('payments')}
            >
              💰 Pagamentos PIX
            </button>
          </div>

          <div className="win98-tabbody">
            {tab === 'users' && <UsersTab />}
            {tab === 'permissions' && <PermissionsTab />}
            {tab === 'logs' && <LogsTab />}
            {tab === 'ai' && <AiConfigTab />}
            {tab === 'payments' && <PaymentsTab />}
          </div>

          <div className="win98-statusbar">
            <span>Pronto</span>
            <span>Sessão: {user?.id?.slice(0, 8)}…</span>
            <span>{new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
