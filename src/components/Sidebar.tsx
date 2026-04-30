// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Moon, Sun, Search, Settings } from 'lucide-react'; // Ícones
import { useAuth } from '../contexts/AuthContext'; // Importa o hook de autenticação
import { useTheme } from '../contexts/ThemeContext';

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
  const [search, setSearch] = useState('');
  const { company, isLoading } = useCompany();
  // CHAMA O HOOK useAuth para obter a função logout
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  const filteredMenuItems = menuItems
    .filter(item =>
      item.children
        ? item.children.some(child => hasPermission(userPermissions, child.id))
        : hasPermission(userPermissions, item.id)
    )
    .filter(item => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      if (item.label.toLowerCase().includes(q)) return true;
      return item.children?.some(c => c.label.toLowerCase().includes(q)) ?? false;
    });

  const initials = (user?.name || '•')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 flex flex-col bg-slate-950 text-slate-100 border-r border-white/[0.06] z-50 transform transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
    >
      {/* Header */}
      <div className="relative px-3.5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
        <div
          onClick={() => {
            onViewChange('dashboard');
            navigate('/dashboard');
          }}
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
          title="Voltar ao Início"
        >
          <img
            src={logo}
            alt=""
            aria-hidden
            className="w-7 h-7 rounded-md object-cover ring-1 ring-white/10"
            onError={e =>
            ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              company.name
            )}&background=3B82F6&color=fff`)
            }
          />
          <span className="font-medium text-[14px] text-white truncate">
            {company.name}
          </span>
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

      {/* Search */}
      <div className="px-2 pt-2.5 pb-1">
        <label className="relative flex items-center h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.06] focus-within:border-white/15 focus-within:bg-white/[0.06] transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            placeholder="Buscar no menu…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-2 flex-1 bg-transparent border-0 outline-none text-[12.5px] text-slate-200 placeholder:text-slate-500 p-0 m-0 focus:ring-0"
          />
        </label>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 mt-1 px-2 pb-2 space-y-px overflow-y-auto">
        <p className="px-2 pt-2 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-500">
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
                className={`group relative w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] ${
                  isActive
                    ? 'bg-white/[0.07] text-white font-medium'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden
                  className={`w-[18px] h-[18px] object-contain ${isActive ? 'opacity-95' : 'opacity-60 group-hover:opacity-90'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

          // Group Item
          return (
            <div key={item.id} className="space-y-px">
              <button
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                aria-expanded={isExpanded}
                className={`group relative w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] ${
                  highlight
                    ? 'bg-white/[0.07] text-white font-medium'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden
                  className={`w-[18px] h-[18px] object-contain ${highlight ? 'opacity-95' : 'opacity-60 group-hover:opacity-90'}`}
                />
                <span className="truncate">{item.label}</span>
                <motion.svg
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="ml-auto w-3.5 h-3.5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </motion.svg>
              </button>

              {/* Sub-menu */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="ml-[15px] pl-2.5 border-l border-white/[0.06] space-y-px py-0.5">
                      {item.children.map(child => {
                        const isChildActive = currentView === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleItemClick(child.id)}
                            title={child.label}
                            aria-current={isChildActive ? 'page' : undefined}
                            className={`relative w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] ${
                              isChildActive
                                ? 'bg-white/[0.07] text-white font-medium'
                                : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                            }`}
                          >
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

      {/* Footer com user card + ações */}
      <div className="relative shrink-0 border-t border-white/[0.06]">
        {/* Toggle tema + sair (linha enxuta) */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1.5 gap-1">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex items-center gap-2 h-7 px-2 rounded-md text-[12px] text-slate-400 hover:bg-white/[0.04] hover:text-white"
            title={`Tema ${theme === 'dark' ? 'escuro' : 'claro'}`}
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5" strokeWidth={1.75} />
            ) : (
              <Sun className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            <span className="capitalize">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          </button>
          <button
            onClick={() => navigate('/configuracoes')}
            aria-label="Configurações"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.04] hover:text-white"
            title="Configurações"
          >
            <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            onClick={logout}
            aria-label="Sair"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.04] hover:text-white"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>

        {/* User card */}
        <div className="px-2 pb-2.5">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <span className="w-7 h-7 rounded bg-white/10 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-white truncate leading-tight">
                {user?.name || 'Conta'}
              </div>
              <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                {user?.email || 'sem e-mail'}
              </div>
            </div>
            <span
              className="text-[10px] font-mono text-slate-600 tracking-tight shrink-0"
              title="Versão do sistema"
            >
              v2.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}