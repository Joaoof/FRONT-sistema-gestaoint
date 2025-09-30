// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';

// ... (Interfaces, VIEW_TO_MODULE, hasPermission e menuItems permanecem inalterados) ...

interface MenuItem {
  id: View;
  label: string;
  children?: Omit<MenuItem, 'children'>[];
  imageUrl: string;
}

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onToggle: () => void;
  userPermissions: { module_key: string; permissions: string[] }[];
}

const VIEW_TO_MODULE: Record<View, string> = {
  dashboard: 'dashboard',
  entregas: 'entregas',
  cadastros: 'cadastros',
  estoque: 'estoque',
  vendas: 'vendas',
  fiscal: 'fiscal',
  'fiscal-receber': 'fiscal',
  'fiscal-receber-criar': 'fiscal',
  'fiscal-pagar': 'fiscal',
  'fiscal-pagar-criar': 'fiscal',
  financeiro: 'financeiro',
  ecommerce: 'ecommerce',
  consultas: 'consultas',
  movimentacoes: 'movimentacoes',
  'formulario-movimentacao': 'movimentacoes',
  'historico-movimentacao': 'movimentacoes',
  configuracoes: 'configuracoes',
} as any;

function hasPermission(
  permissions: { module_key: string; permissions: string[] }[],
  view: View
): boolean {
  const moduleKey = VIEW_TO_MODULE[view];
  if (!moduleKey) return false;
  return permissions.some(p => p.module_key === moduleKey);
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', imageUrl: 'https://cdn-icons-png.flaticon.com/512/11068/11068821.png' },
  { id: 'entregas', label: 'Entregas', imageUrl: 'https://cdn-icons-png.flaticon.com/256/5457/5457799.png' },
  { id: 'cadastros', label: 'Cadastros', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3534/3534139.png' },
  { id: 'estoque', label: 'Estoque', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3827/3827340.png' },
  { id: 'vendas', label: 'Vendas', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5607/5607725.png' },
  {
    id: 'fiscal',
    label: 'Fiscal',
    imageUrl: '/icons/fiscal.png',
    children: [
      { id: 'fiscal-receber', label: 'Contas a Receber', imageUrl: '/icons/receber.png' },
      { id: 'fiscal-receber-criar', label: 'Nova Receita', imageUrl: '/icons/receita.png' },
      { id: 'fiscal-pagar', label: 'Contas a Pagar', imageUrl: '/icons/pagar.png' },
      { id: 'fiscal-pagar-criar', label: 'Nova Despesa', imageUrl: '/icons/despesa.png' },
    ],
  },
  { id: 'financeiro', label: 'Financeiro', imageUrl: '/icons/financeiro.png' },
  { id: 'ecommerce', label: 'E-commerce', imageUrl: '/icons/ecommerce.png' },
  { id: 'consultas', label: 'Consultas', imageUrl: '/icons/consultas.png' },
  {
    id: 'movimentacoes',
    label: 'Movimentações',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/10384/10384161.png',
    children: [
      { id: 'formulario-movimentacao', label: 'Formulário', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3447/3447560.png' },
      { id: 'historico-movimentacao', label: 'Histórico', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5582/5582334.png' },
    ],
  },
  { id: 'configuracoes', label: 'Configurações', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2698/2698011.png' },
];

export function Sidebar({
  currentView,
  onViewChange,
  isOpen,
  onToggle,
  userPermissions = [],
}: SidebarProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { company, isLoading } = useCompany();

  if (isLoading || !company) {
    return (
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-50 shadow-xl border-r border-gray-100 z-50 animate-pulse">
        {/* Skeleton Loading State */}
        <div className="p-4 border-b border-gray-200">
          <div className="w-16 h-13 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 mt-2 w-3/4"></div>
        </div>
        <div className="mt-4 space-y-3 px-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const logo =
    company.logoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=3B82F6&color=fff`;

  useEffect(() => {
    const group = currentView.split('-')[0];
    if (['movimentacoes', 'fiscal'].includes(group)) {
      setExpandedItems(prev => ({ ...prev, [group]: true }));
    }
  }, [currentView]);

  const handleItemClick = (view: View) => {
    const groups: Record<string, View[]> = {
      movimentacoes: ['movimentacoes', 'formulario-movimentacao', 'historico-movimentacao'],
      fiscal: ['fiscal-pagar', 'fiscal-pagar-criar', 'fiscal-receber', 'fiscal-receber-criar'],
    };

    if (groups[view]) {
      setExpandedItems(prev => ({ ...prev, [view]: !prev[view] }));
      if (!expandedItems[view]) {
        const first = groups[view][0];
        onViewChange(first);
        navigate(`/${first}`);
      }
    } else {
      onViewChange(view);
      navigate(`/${view}`);
      if (window.innerWidth < 1024) onToggle();
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.children) return hasPermission(userPermissions, item.id);
    return item.children.some(child => hasPermission(userPermissions, child.id));
  });

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-gray-50 shadow-xl border-r border-gray-100 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`} // Fundo mais suave e sombra mais profunda
    >
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3"> {/* Aumentado space-x para melhor espaçamento */}
          <img
            src={logo}
            alt="Logo da Empresa"
            className="w-12 h-12 rounded-lg object-cover shadow-sm" // Logo um pouco maior e arredondado
            onError={e =>
            ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              company.name
            )}&background=3B82F6&color=fff`)
            }
          />
          <span className="font-sans text-lg font-bold text-gray-800 tracking-wide">{company.name}</span> {/* Fonte mais corporativa */}
        </div>
        <button onClick={onToggle} className="lg:hidden p-2 rounded-full text-gray-500 hover:bg-gray-200 transition duration-150">
          ✕
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="mt-4 px-3 space-y-1"> {/* Adicionado padding horizontal e espaçamento vertical */}
        {filteredMenuItems.map(item => {
          const isActive = currentView === item.id;
          const isGroupActive = item.children?.some(c => c.id === currentView);
          const isExpanded = expandedItems[item.id] || false;

          // Item Sem Sub-Menu
          if (!item.children) {
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${isActive
                  ? 'bg-blue-100 text-blue-700 shadow-sm' // Fundo mais claro e suave, sem borda lateral
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' // Hover mais claro
                  }`}
              >
                <img src={item.imageUrl} alt={item.label} className={`w-5 h-5 object-contain ${isActive ? 'filter-none' : 'opacity-75'}`} /> {/* Opacidade no ícone inativo */}
                <span>{item.label}</span>
              </button>
            );
          }

          // Item Com Sub-Menu
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${isActive || isGroupActive
                  ? 'bg-blue-100 text-blue-700 shadow-sm' // Fundo mais claro e suave, sem borda lateral
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' // Hover mais claro
                  }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className={`w-5 h-5 object-contain ${isActive || isGroupActive ? 'filter-none' : 'opacity-75'}`}
                />
                <span>{item.label}</span>
                <span className={`ml-auto transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                  {/* Ícone de chevron mais moderno */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </span>
              </button>
              {/* Sub-Menu */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {item.children.map(child => {
                  const isChildActive = currentView === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleItemClick(child.id)}
                      className={`w-full flex items-center space-x-3 px-6 py-2 text-sm transition duration-150 rounded-lg ${isChildActive
                        ? 'bg-blue-200 text-gray-900 font-semibold' // Destaque mais forte para o sub-item ativo
                        : 'text-gray-600 hover:bg-gray-100' // Hover mais suave
                        }`}
                    >
                      <img src={child.imageUrl} alt={child.label} className="w-4 h-4 object-contain" />
                      <span>{child.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}