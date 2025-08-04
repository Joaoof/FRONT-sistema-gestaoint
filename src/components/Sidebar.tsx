// src/components/Sidebar.tsx
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  ShoppingBag,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  PlusCircle,
} from 'lucide-react';
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
}

export function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();

  // ✅ Estado para controlar expansão dos grupos
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // ✅ Sincroniza com a URL para abrir o grupo correto
  useEffect(() => {
    const path = currentView.split('-')[0]; // ex: 'movimentacoes-entrada' → 'movimentacoes'
    if (['movimentacoes'].includes(path)) {
      setExpandedItems(prev => ({ ...prev, [path]: true }));
    }
  }, [currentView]);

  const handleItemClick = (view: View) => {
    // Verifica se é um item com filhos
    const groupItems: Record<string, View[]> = {
      movimentacoes: [
        'movimentacoes',
        'movimentacoes-entrada',
        'movimentacoes-saida',
        'movimentacoes-saida-despesas',
        'movimentacoes-saida-retiradas',
        'movimentacoes-saida-pagamentos',
      ],

      fiscal: [
        'fiscal-a-pagar',
        'fiscal-a-receber'
      ]
    };


    const group = Object.keys(groupItems).find(g => groupItems[g].includes(view));
    if (group) {
      // Se for um subitem, fecha todos e vai direto
      setExpandedItems({ [group]: true });
      onViewChange(view);
      navigate(`${view}`);
      if (window.innerWidth < 1024) onToggle();
      return;
    }

    // Se for um grupo (ex: 'movimentacoes')
    if (groupItems[view]) {
      setExpandedItems(prev => ({
        ...prev,
        [view]: !prev[view],
      }));
      // Navega para o primeiro subitem ou mantém no grupo
      if (!expandedItems[view]) {
        const firstSubItem = groupItems[view][0];
        onViewChange(firstSubItem);
        navigate(`/app/${firstSubItem}`);
      }
      return;
    }

    // Item normal
    onViewChange(view);
    navigate(`${view}`);
    if (window.innerWidth < 1024) onToggle();
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cadastros', label: 'Cadastros', icon: Users },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'fiscal', label: 'Fiscal', icon: FileText },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
    { id: 'consultas', label: 'Consultas', icon: Search },
    {
      id: 'movimentacoes' as View,
      label: 'Movimentações',
      icon: DollarSign,
      children: [
        { id: 'movimentacoes-entrada', label: 'Nova Entrada', icon: ArrowUpCircle },
        { id: 'movimentacoes-saida', label: 'Nova Saída', icon: ArrowDownCircle },
        { id: 'movimentacoes-saida-despesas', label: 'Despesas', icon: FileText },
        { id: 'movimentacoes-saida-retiradas', label: 'Retiradas', icon: Users },
        { id: 'movimentacoes-saida-pagamentos', label: 'Pagamentos', icon: CreditCard },
      ],
    },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-semibold text-gray-900">Estoque Nuvem</span>
          </div>
          <button onClick={onToggle} className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isGroupActive = item.children?.some(child => child.id === currentView);

          // ✅ Item sem filhos
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
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          }

          // ✅ Item com filhos (grupo)
          const isExpanded = expandedItems[item.id] || false;

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

              {/* Subitens com animação */}
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
    </div>
  );
}