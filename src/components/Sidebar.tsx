// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  return moduleKey ? permissions.some(p => p.module_key === moduleKey) : false;
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
      <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white/80 to-gray-100 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-md shadow-xl border-r border-gray-100 z-50 animate-pulse" />
    );
  }

  const logo =
    company.logoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=3B82F6&color=fff`;

  useEffect(() => {
    const section = currentView.split('-')[0];
    if (['movimentacoes', 'fiscal'].includes(section)) {
      setExpandedItems(prev => ({ ...prev, [section]: true }));
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

  const filteredMenuItems = menuItems.filter(item =>
    item.children
      ? item.children.some(child => hasPermission(userPermissions, child.id))
      : hasPermission(userPermissions, item.id)
  );

  return (
    // Dentro do <Sidebar> substitua a div principal por:
    <div
      className={`fixed left-0 top-0 h-full w-64 
    bg-gradient-to-b from-[#780087] to-[#000000]
    dark:from-[#580065] dark:to-[#380047]
    backdrop-blur-md shadow-xl border-r border-[#000000] z-50 
    transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div
          onClick={() => {
            onViewChange('dashboard');
            navigate('/dashboard');
          }}
          className="flex items-center space-x-4 cursor-pointer"
          title="Voltar ao Início"
        >
          <img
            src={logo}
            alt="Logo da Empresa"
            className="w-12 h-12 rounded-lg object-cover shadow-sm"
            onError={e =>
            ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              company.name
            )}&background=3B82F6&color=fff`)
            }
          />
          <span className="font-inter font-semibold text-lg text-gray-800 dark:text-gray-100 tracking-wide">
            {company.name}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="lg:hidden p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform duration-200 transform hover:scale-110"
        >
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </motion.svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        {filteredMenuItems.map(item => {
          const isActive = currentView === item.id;
          const isSectionActive = item.children?.some(c => c.id === currentView) ?? false;
          const isExpanded = expandedItems[item.id] ?? false;

          // Single Item
          if (!item.children) {
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95 ${isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
              >
                <span
                  className={`absolute left-0 h-full w-1 rounded-r bg-primary transition-all ${isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                />
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className={`w-5 h-5 object-contain ${isActive ? 'opacity-100' : 'opacity-75'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          }

          // Group Item
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95 ${isActive || isSectionActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
              >
                <span
                  className={`absolute left-0 h-full w-1 rounded-r bg-primary transition-all ${isActive || isSectionActive ? 'opacity-100' : 'opacity-0'
                    }`}
                />
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className={`w-5 h-5 object-contain ${isActive || isSectionActive ? 'opacity-100' : 'opacity-75'}`}
                />
                <span>{item.label}</span>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.span
                      key="chevron"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 90 }}
                      exit={{ rotate: 0 }}
                      className="ml-auto text-gray-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.span>
                  )}
                  {!isExpanded && !isActive && (
                    <motion.span
                      key="chevron-collapsed"
                      initial={{ rotate: 90 }}
                      animate={{ rotate: 0 }}
                      exit={{ rotate: 90 }}
                      className="ml-auto text-gray-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Sub-menu */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {item.children.map(child => {
                      const isChildActive = currentView === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleItemClick(child.id)}
                          title={child.label}
                          className={`relative w-full flex items-center space-x-3 px-6 py-2 text-sm font-medium transition-transform duration-150 hover:scale-105 active:scale-95 ${isChildActive
                            ? 'bg-primary/30 text-primary'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <span
                            className={`absolute left-0 h-full w-1 rounded-r bg-primary transition-all ${isChildActive ? 'opacity-100' : 'opacity-0'
                              }`}
                          />
                          <img src={child.imageUrl} alt={child.label} className="w-4 h-4 object-contain" />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 w-full px-4 text-xs text-gray-500 dark:text-gray-400">
        <div>v{process.env.REACT_APP_VERSION}</div>
        <a href="/help" className="hover:underline">
          Ajuda
        </a>
      </div>
    </div>
  );
}
