import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
  ADMIN_ASSIGN_PLAN,
  ADMIN_COMPANIES,
  ADMIN_CREATE_MODULE,
  ADMIN_CREATE_PLAN,
  ADMIN_DELETE_PLAN,
  ADMIN_MODULES,
  ADMIN_PLANS,
  ADMIN_REMOVE_PLAN_MODULE,
  ADMIN_UPDATE_PLAN,
  ADMIN_UPSERT_PLAN_MODULE,
} from '../../../graphql/queries/admin';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  modules: PlanModule[];
}
interface PlanModule {
  id: string;
  planId: string;
  moduleId: string;
  isActive: boolean;
  permission: string[];
  module: { id: string; name: string; module_key: string; description: string | null } | null;
}
interface ModuleRow {
  id: string;
  name: string;
  module_key: string;
  description: string | null;
}
interface Company {
  id: string;
  name: string;
  email: string | null;
  userCount: number;
  currentPlanId: string | null;
  currentPlanName: string | null;
}

const PERMISSION_LEVELS = ['read', 'write', 'delete', 'admin'];

export function PermissionsTab() {
  const { data: plansData, refetch: refetchPlans } = useQuery<{ adminPlans: Plan[] }>(ADMIN_PLANS, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: modulesData, refetch: refetchModules } = useQuery<{ adminModules: ModuleRow[] }>(
    ADMIN_MODULES,
  );
  const { data: companiesData, refetch: refetchCompanies } = useQuery<{ adminCompanies: Company[] }>(
    ADMIN_COMPANIES,
  );

  const [createPlan] = useMutation(ADMIN_CREATE_PLAN);
  const [updatePlan] = useMutation(ADMIN_UPDATE_PLAN);
  const [deletePlan] = useMutation(ADMIN_DELETE_PLAN);
  const [createModule] = useMutation(ADMIN_CREATE_MODULE);
  const [upsertPM] = useMutation(ADMIN_UPSERT_PLAN_MODULE);
  const [removePM] = useMutation(ADMIN_REMOVE_PLAN_MODULE);
  const [assignPlan] = useMutation(ADMIN_ASSIGN_PLAN);

  const plans = plansData?.adminPlans ?? [];
  const modules = modulesData?.adminModules ?? [];
  const companies = companiesData?.adminCompanies ?? [];

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId],
  );

  const handleCreatePlan = async () => {
    const name = prompt('Nome do plano:');
    if (!name) return;
    const description = prompt('Descrição (opcional):') || undefined;
    try {
      await createPlan({ variables: { input: { name, description } } });
      toast.success('Plano criado.');
      refetchPlans();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Apagar este plano?')) return;
    try {
      await deletePlan({ variables: { id } });
      toast.success('Plano apagado.');
      setSelectedPlanId(null);
      refetchPlans();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTogglePermission = async (
    plan: Plan,
    module: ModuleRow,
    perm: string,
    isActive: boolean,
  ) => {
    const existing = plan.modules.find((pm) => pm.moduleId === module.id);
    const currentPerms = existing?.permission ?? [];
    const nextPerms = isActive
      ? [...currentPerms.filter((p) => p !== perm), perm]
      : currentPerms.filter((p) => p !== perm);

    try {
      if (nextPerms.length === 0 && existing) {
        await removePM({ variables: { planId: plan.id, moduleId: module.id } });
      } else {
        await upsertPM({
          variables: {
            input: {
              planId: plan.id,
              moduleId: module.id,
              permission: nextPerms,
              isActive: true,
            },
          },
        });
      }
      refetchPlans();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateModule = async () => {
    const name = prompt('Nome do módulo:');
    if (!name) return;
    const moduleKey = prompt('module_key (slug, sem espaços):');
    if (!moduleKey) return;
    try {
      await createModule({ variables: { input: { name, module_key: moduleKey } } });
      toast.success('Módulo criado.');
      refetchModules();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAssignPlan = async (companyId: string, planId: string) => {
    try {
      await assignPlan({ variables: { input: { companyId, planId } } });
      toast.success('Plano atribuído à empresa.');
      refetchCompanies();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <fieldset className="win98-fieldset">
        <legend>Empresas — plano atribuído</legend>
        <table className="win98-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Usuários</th>
              <th>Plano atual</th>
              <th>Trocar para</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.userCount}</td>
                <td>{c.currentPlanName ?? <span style={{ color: '#800000' }}>(sem plano)</span>}</td>
                <td>
                  <select
                    className="win98-select"
                    value={c.currentPlanId ?? ''}
                    onChange={(e) => e.target.value && handleAssignPlan(c.id, e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </fieldset>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 8, marginTop: 8 }}>
        <fieldset className="win98-fieldset" style={{ margin: 0 }}>
          <legend>Planos</legend>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {plans.map((p) => (
              <li
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                style={{
                  padding: '3px 6px',
                  cursor: 'pointer',
                  background: selectedPlan?.id === p.id ? '#000080' : 'transparent',
                  color: selectedPlan?.id === p.id ? '#fff' : '#000',
                }}
              >
                {p.name}
                {!p.isActive && ' (inativo)'}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <button className="win98-button" style={{ flex: 1 }} onClick={handleCreatePlan}>+ Novo</button>
            {selectedPlan && (
              <button className="win98-button danger" onClick={() => handleDeletePlan(selectedPlan.id)}>X</button>
            )}
          </div>
        </fieldset>

        <fieldset className="win98-fieldset" style={{ margin: 0 }}>
          <legend>
            Permissões do plano: <b>{selectedPlan?.name ?? '—'}</b>
          </legend>
          {selectedPlan && (
            <>
              <div style={{ marginBottom: 6 }}>
                <input
                  type="checkbox"
                  className="win98-checkbox"
                  checked={selectedPlan.isActive}
                  onChange={async (e) => {
                    await updatePlan({
                      variables: { input: { id: selectedPlan.id, isActive: e.target.checked } },
                    });
                    refetchPlans();
                  }}
                />
                Plano ativo
              </div>
              <table className="win98-table">
                <thead>
                  <tr>
                    <th>Módulo</th>
                    {PERMISSION_LEVELS.map((l) => (
                      <th key={l} style={{ textAlign: 'center', width: 60 }}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => {
                    const pm = selectedPlan.modules.find((x) => x.moduleId === m.id);
                    return (
                      <tr key={m.id}>
                        <td>
                          <b>{m.name}</b>
                          <div style={{ fontSize: 10, color: '#404040' }}>{m.module_key}</div>
                        </td>
                        {PERMISSION_LEVELS.map((perm) => {
                          const checked = pm?.permission?.includes(perm) ?? false;
                          return (
                            <td key={perm} style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                className="win98-checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  handleTogglePermission(selectedPlan, m, perm, e.target.checked)
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
          <div style={{ marginTop: 6 }}>
            <button className="win98-button" onClick={handleCreateModule}>+ Cadastrar módulo</button>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
