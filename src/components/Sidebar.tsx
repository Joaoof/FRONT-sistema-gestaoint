// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react'; // Importa o ícone de Sair
import { useAuth } from '../contexts/AuthContext'; // Importa o hook de autenticação

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
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/8655/8655421.png',
    children: [
      { id: 'fiscal-receber', label: 'Contas a Receber', imageUrl: 'https://cdn-icons-png.flaticon.com/512/6397/6397689.png' },
      { id: 'fiscal-receber-criar', label: 'Nova Receita', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1605/1605298.png' },
      { id: 'fiscal-pagar', label: 'Contas a Pagar', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1999/1999210.png' },
      { id: 'fiscal-pagar-criar', label: 'Nova Despesa', imageUrl: 'https://cdn-icons-png.freepik.com/512/8910/8910710.png' },
    ],
  },
  { id: 'financeiro', label: 'Financeiro', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3514/3514721.png' },
  { id: 'ecommerce', label: 'E-commerce', imageUrl: 'https://cdn-icons-png.flaticon.com/512/8552/8552655.png' },
  { id: 'consultas', label: 'Consultas', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1469/1469975.png' },
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
  // CHAMA O HOOK useAuth para obter a função logout
  const { logout } = useAuth();

  if (isLoading || !company) {
    return (
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-950 border-r border-white/5 z-50 animate-pulse" />
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
    <div
      className={`fixed left-0 top-0 h-full w-64 flex flex-col bg-slate-950 text-slate-100 border-r border-white/5 shadow-soft-xl z-50 transform transition-transform duration-300 ease-smooth ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
    >
      {/* subtle brand glow no topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-600/15 to-transparent" aria-hidden />

      {/* Header */}
      <div className="relative px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div
          onClick={() => {
            onViewChange('dashboard');
            navigate('/dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer group"
          title="Voltar ao Início"
        >
          <img
            src={logo}
            alt="Logo da Empresa"
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10 group-hover:ring-white/25 transition"
            onError={e =>
            ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              company.name
            )}&background=3B82F6&color=fff`)
            }
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] uppercase tracking-[0.14em] text-slate-400">Empresa</span>
            <span className="font-semibold text-[15px] text-white truncate max-w-[150px]">
              {company.name}
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          aria-label="Fechar menu"
          className="lg:hidden p-2 rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
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
      <nav className="relative flex-1 mt-3 px-3 pb-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Navegação
        </p>
        {filteredMenuItems.map(item => {
          const isActive = currentView === item.id;
          const isSectionActive = item.children?.some(c => c.id === currentView) ?? false;
          const isExpanded = expandedItems[item.id] ?? false;
          const highlight = isActive || isSectionActive;

          // Single Item
          if (!item.children) {
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span
                  className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-400 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden
                />
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden
                  className={`w-5 h-5 object-contain ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

          // Group Item
          return (
            <div key={item.id} className="space-y-0.5">
              <button
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                aria-expanded={isExpanded}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium ${
                  highlight
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span
                  className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-400 transition-opacity ${highlight ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden
                />
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden
                  className={`w-5 h-5 object-contain ${highlight ? 'opacity-100' : 'opacity-70'}`}
                />
                <span className="truncate">{item.label}</span>
                <motion.span
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="ml-auto text-slate-400"
                  aria-hidden
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.span>
              </button>

              {/* Sub-menu */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 pl-3 border-l border-white/10 space-y-0.5 py-1">
                      {item.children.map(child => {
                        const isChildActive = currentView === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleItemClick(child.id)}
                            title={child.label}
                            aria-current={isChildActive ? 'page' : undefined}
                            className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium ${
                              isChildActive
                                ? 'bg-brand-600/20 text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <img src={child.imageUrl} alt="" aria-hidden className="w-4 h-4 object-contain opacity-80" />
                            <span className="truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer fixo na base */}
      <div className="relative shrink-0 px-3 pt-3 pb-4 border-t border-white/5 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-slate-300 hover:bg-rose-500/15 hover:text-rose-200"
        >
          <LogOut className="w-[18px] h-[18px] text-rose-400" />
          <span>Sair</span>
        </button>
        <div className="flex items-center justify-between px-3 pt-2 text-[11px] text-slate-500">
          <a href="/help" className="hover:text-slate-300 transition-colors">Ajuda</a>
          <span>v2.0.0</span>
        </div>
      </div>
    </div>
  );
}