import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
  ADMIN_CREATE_USER,
  ADMIN_DEACTIVATE_USER,
  ADMIN_RESET_PASSWORD,
  ADMIN_UPDATE_USER,
  ADMIN_USERS,
  ADMIN_COMPANIES,
} from '../../../graphql/queries/admin';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  isSuperAdmin: boolean;
  company_id: string | null;
  companyName: string | null;
  createdAt: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

export function UsersTab() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, refetch, loading } = useQuery<{ adminUsers: AdminUser[] }>(ADMIN_USERS, {
    variables: { search: search || null },
    fetchPolicy: 'cache-and-network',
  });
  const { data: companiesData } = useQuery<{ adminCompanies: CompanyOption[] }>(ADMIN_COMPANIES);
  const [createUser] = useMutation(ADMIN_CREATE_USER);
  const [updateUser] = useMutation(ADMIN_UPDATE_USER);
  const [resetPassword] = useMutation(ADMIN_RESET_PASSWORD);
  const [deactivate] = useMutation(ADMIN_DEACTIVATE_USER);

  const users = data?.adminUsers ?? [];
  const companies = companiesData?.adminCompanies ?? [];

  const handleToggleSuperAdmin = async (u: AdminUser) => {
    if (!confirm(`${u.isSuperAdmin ? 'Remover' : 'Conceder'} super-admin para ${u.email}?`)) return;
    try {
      await updateUser({
        variables: { input: { id: u.id, isSuperAdmin: !u.isSuperAdmin } },
      });
      toast.success('Atualizado.');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleActive = async (u: AdminUser) => {
    try {
      await updateUser({
        variables: { input: { id: u.id, is_active: !u.is_active } },
      });
      toast.success(u.is_active ? 'Desativado.' : 'Reativado.');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResetPassword = async (u: AdminUser) => {
    const pwd = prompt(`Nova senha para ${u.email}:`);
    if (!pwd) return;
    if (pwd.length < 6) return toast.error('Mínimo 6 caracteres.');
    try {
      await resetPassword({ variables: { input: { userId: u.id, newPassword: pwd } } });
      toast.success('Senha redefinida.');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeactivate = async (u: AdminUser) => {
    if (!confirm(`Desativar (não apaga) o usuário ${u.email}?`)) return;
    try {
      await deactivate({ variables: { id: u.id } });
      toast.success('Desativado.');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <fieldset className="win98-fieldset">
        <legend>Buscar</legend>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            className="win98-input"
            style={{ flex: 1 }}
            placeholder="Nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="win98-button" onClick={() => refetch()} disabled={loading}>
            Buscar
          </button>
          <button className="win98-button primary" onClick={() => setCreating(true)}>
            + Novo usuário
          </button>
        </div>
      </fieldset>

      <table className="win98-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Empresa</th>
            <th>Função</th>
            <th>Status</th>
            <th>Super</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className={selected?.id === u.id ? 'selected' : ''}
              onClick={() => setSelected(u)}
            >
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.companyName ?? '—'}</td>
              <td>{u.role}</td>
              <td>
                <span className={`win98-badge ${u.is_active ? 'success' : 'danger'}`}>
                  {u.is_active ? 'ATIVO' : 'INATIVO'}
                </span>
              </td>
              <td>{u.isSuperAdmin ? <span className="win98-badge danger">SIM</span> : '—'}</td>
              <td>
                <button
                  className="win98-button"
                  style={{ minWidth: 'unset', padding: '1px 6px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSuperAdmin(u);
                  }}
                >
                  {u.isSuperAdmin ? 'Remover ★' : 'Promover ★'}
                </button>{' '}
                <button
                  className="win98-button"
                  style={{ minWidth: 'unset', padding: '1px 6px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(u);
                  }}
                >
                  {u.is_active ? 'Desativar' : 'Reativar'}
                </button>{' '}
                <button
                  className="win98-button"
                  style={{ minWidth: 'unset', padding: '1px 6px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPassword(u);
                  }}
                >
                  Senha
                </button>{' '}
                <button
                  className="win98-button danger"
                  style={{ minWidth: 'unset', padding: '1px 6px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate(u);
                  }}
                >
                  Apagar
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#404040' }}>
                {loading ? 'Carregando...' : 'Nenhum usuário.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {creating && (
        <CreateUserDialog
          companies={companies}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            refetch();
          }}
          createUser={createUser}
        />
      )}
    </div>
  );
}

interface CreateUserDialogProps {
  companies: CompanyOption[];
  createUser: any;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserDialog({ companies, createUser, onClose, onCreated }: CreateUserDialogProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    company_id: companies[0]?.id ?? '',
    isSuperAdmin: false,
    phone: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({
        variables: {
          input: {
            ...form,
            phone: form.phone || undefined,
          },
        },
      });
      toast.success('Usuário criado.');
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      className="win98"
    >
      <div className="win98-window" style={{ width: 420 }}>
        <div className="win98-titlebar">
          <span>Novo usuário</span>
          <button className="win98-titlebar-btn" onClick={onClose}>×</button>
        </div>
        <form className="win98-content" onSubmit={handleCreate}>
          <fieldset className="win98-fieldset">
            <legend>Dados básicos</legend>
            <div style={{ display: 'grid', gap: 6 }}>
              <label className="win98-label">Nome:
                <input className="win98-input" required style={{ width: '100%' }}
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="win98-label">E-mail:
                <input type="email" className="win98-input" required style={{ width: '100%' }}
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="win98-label">Senha:
                <input type="password" className="win98-input" required minLength={6} style={{ width: '100%' }}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <label className="win98-label">Telefone:
                <input className="win98-input" style={{ width: '100%' }}
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="win98-label">Função (role):
                <input className="win98-input" required style={{ width: '100%' }}
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </label>
              <label className="win98-label">Empresa:
                <select className="win98-select" required style={{ width: '100%' }}
                  value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="win98-label" style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" className="win98-checkbox"
                  checked={form.isSuperAdmin}
                  onChange={(e) => setForm({ ...form, isSuperAdmin: e.target.checked })} />
                Conceder Super-Admin (acesso total)
              </label>
            </div>
          </fieldset>

          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="win98-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="win98-button primary">Criar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
