// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CarTaxiFrontIcon,
  CreditCard,
  DollarSign,
  FileText,
  FolderDotIcon,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';



interface MenuItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Omit<MenuItem, 'children'>[];
}

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onToggle: () => void;
  userPermissions: { module_key: string; permissions: string[] }[];
}

// ✅ Mapeamento entre View e módulo
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
  entrada: '',
  historico: ''
};

function hasPermission(
  permissions: { module_key: string; permissions: string[] }[],
  view: View
): boolean {
  const moduleKey = VIEW_TO_MODULE[view];
  if (!moduleKey) return false;
  return permissions.some((p) => p.module_key === moduleKey);
}

// ✅ menuItems definido fora, acessível globalmente
const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entregas', label: 'Entregas', icon: CarTaxiFrontIcon },
  { id: 'cadastros', label: 'Cadastros', icon: Users },
  { id: 'estoque', label: 'Estoque', icon: Package },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  {
    id: 'fiscal',
    label: 'Fiscal',
    icon: FileText,
    children: [
      { id: 'fiscal-receber', label: 'Contas a Receber', icon: ArrowUpCircle },
      { id: 'fiscal-receber-criar', label: 'Nova Receita', icon: PlusCircle },
      { id: 'fiscal-pagar', label: 'Contas a Pagar', icon: ArrowDownCircle },
      { id: 'fiscal-pagar-criar', label: 'Nova Despesa', icon: CreditCard },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: DollarSign,
  },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
  { id: 'consultas', label: 'Consultas', icon: Search },
  {
    id: 'movimentacoes' as View,
    label: 'Movimentações',
    icon: DollarSign,
    children: [
      { id: 'formulario-movimentacao', label: 'Formulario de Movimentação', icon: ArrowUpCircle },
      { id: 'historico-movimentacao', label: 'Histórico de Movimentação', icon: ArrowDownCircle },
    ],
  },
  {
    id: 'configuracoes' as View,
    label: 'Configurações',
    icon: Settings,
  },
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
  const { company, isLoading } = useCompany()
  console.log("MINHA EMPRESA", company);


  if (isLoading || !company) {
    return (
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const logo = company.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=3B82F6&color=fff`;

  useEffect(() => {
    const path = currentView.split('-')[0];
    if (['movimentacoes', 'fiscal'].includes(path)) {
      setExpandedItems((prev) => ({ ...prev, [path]: true }));
    }
  }, [currentView]);

  // ✅ Função de clique
  const handleItemClick = (view: View) => {
    const groupItems: Record<string, View[]> = {
      movimentacoes: [
        'movimentacoes',
        'formulario-movimentacao',
        'historico-movimentacao',
      ],
      fiscal: [
        'fiscal-pagar',
        'fiscal-pagar-criar',
        'fiscal-receber',
        'fiscal-receber-criar',
      ],
    };

    const group = Object.keys(groupItems).find((g) => groupItems[g].includes(view));
    if (group) {
      setExpandedItems({ [group]: true });
      onViewChange(view);
      navigate(`/${view}`);
      if (window.innerWidth < 1024) onToggle();
      return;
    }

    if (groupItems[view]) {
      setExpandedItems((prev) => ({
        ...prev,
        [view]: !prev[view],
      }));
      if (!expandedItems[view]) {
        const firstSubItem = groupItems[view][0];
        onViewChange(firstSubItem);
        navigate(`/${firstSubItem}`);
      }
      return;
    }

    onViewChange(view);
    navigate(`/${view}`);
    if (window.innerWidth < 1024) onToggle();
  };

  console.log('🎯 userPermissions:', userPermissions);
  console.log('📋 menuItems:', menuItems);

  // ✅ Filtra os itens com base nas permissões
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.children) {
      const hasPerm = hasPermission(userPermissions, item.id);
      console.log(`🔍 ${item.id} -> ${hasPerm ? '✓' : '✗'}`);
      return hasPerm;
    }
    const hasPerm = item.children.some((child) => hasPermission(userPermissions, child.id));
    console.log(`🔍 ${item.id} (grupo) -> ${hasPerm ? '✓' : '✗'}`);
    return hasPerm
  });
  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={logo}
              alt="Logo"
              className="w-16 h-13 rounded object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || 'E')}&background=3B82F6&color=fff`;
              }}
            />
            <span className="font-semibold text-gray-900">{company?.name || 'Carregando...'}</span>
          </div>

          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <nav className="mt-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isGroupActive = item.children?.some((child) => child.id === currentView);
          const isExpanded = expandedItems[item.id] || false;

          if (!item.children) {
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <div key={item.id} className="space-y-1">
              <button
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm transition-colors ${isActive || isGroupActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive || isGroupActive ? 'text-blue-600' : 'text-gray-400'
                    }`}
                />
                <span>{item.label}</span>
                <span
                  className={`ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                    }`}
                >
                  ›
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const isChildActive = currentView === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleItemClick(child.id)}
                      className={`w-full flex items-center space-x-3 px-8 py-2 text-left text-sm transition-colors ${isChildActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <ChildIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{child.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div >
  );
}