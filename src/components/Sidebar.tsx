// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Moon,
  Sun,
  Search,
  Settings,
  LayoutDashboard,
  Truck,
  ClipboardList,
  Boxes,
  Package,
  Tag,
  ShoppingCart,
  Receipt,
  Wallet,
  Globe,
  ScanSearch,
  ArrowRightLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface MenuItem {
  id: View;
  label: string;
  icon: LucideIcon;
  children?: Omit<MenuItem, 'children'>[];
}

interface MenuSection {
  label: string;
  items: MenuItem[];
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
  produtos: 'estoque',
  categorias: 'cadastros',
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
  view: View,
): boolean {
  const moduleKey = VIEW_TO_MODULE[view];
  return moduleKey ? permissions.some((p) => p.module_key === moduleKey) : false;
}

const sections: MenuSection[] = [
  {
    label: 'Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'consultas', label: 'Consultas', icon: ScanSearch },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { id: 'produtos', label: 'Produtos', icon: Package },
      { id: 'categorias', label: 'Categorias', icon: Tag },
      { id: 'estoque', label: 'Estoque', icon: Boxes },
      { id: 'cadastros', label: 'Cadastros gerais', icon: ClipboardList },
    ],
  },
  {
    label: 'Operação',
    items: [
      { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
      { id: 'entregas', label: 'Entregas', icon: Truck },
      { id: 'ecommerce', label: 'E-commerce', icon: Globe },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      {
        id: 'movimentacoes',
        label: 'Movimentações',
        icon: ArrowRightLeft,
        children: [
          { id: 'formulario-movimentacao', label: 'Nova movimentação', icon: ArrowRightLeft },
          { id: 'historico-movimentacao', label: 'Histórico', icon: ClipboardList },
        ],
      },
      {
        id: 'fiscal',
        label: 'Fiscal',
        icon: Receipt,
        children: [
          { id: 'fiscal-receber', label: 'Contas a Receber', icon: Wallet },
          { id: 'fiscal-receber-criar', label: 'Nova Receita', icon: Wallet },
          { id: 'fiscal-pagar', label: 'Contas a Pagar', icon: Wallet },
          { id: 'fiscal-pagar-criar', label: 'Nova Despesa', icon: Wallet },
        ],
      },
      { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    ],
  },
];

const groupedChildren: Record<string, View[]> = {
  movimentacoes: ['movimentacoes', 'formulario-movimentacao', 'historico-movimentacao'],
  fiscal: ['fiscal', 'fiscal-pagar', 'fiscal-pagar-criar', 'fiscal-receber', 'fiscal-receber-criar'],
};

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
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    for (const [groupId, members] of Object.entries(groupedChildren)) {
      if (members.includes(currentView)) {
        setExpandedItems((prev) => ({ ...prev, [groupId]: true }));
      }
    }
  }, [currentView]);

  if (isLoading || !company) {
    return (
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-950 border-r border-white/5 z-50 animate-pulse" />
    );
  }

  const logo =
    company.logoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=3B82F6&color=fff`;

  const handleItemClick = (view: View, hasChildren: boolean) => {
    if (hasChildren) {
      setExpandedItems((prev) => ({ ...prev, [view]: !prev[view] }));
      const members = groupedChildren[view];
      if (members && !expandedItems[view]) {
        const first = members.find((v) => v !== view) ?? members[0];
        onViewChange(first);
        navigate(`/${first}`);
      }
      return;
    }
    onViewChange(view);
    navigate(`/${view}`);
    if (window.innerWidth < 1024) onToggle();
  };

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) =>
          item.children
            ? item.children.some((child) => hasPermission(userPermissions, child.id))
            : hasPermission(userPermissions, item.id),
        )
        .filter((item) => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          if (item.label.toLowerCase().includes(q)) return true;
          return item.children?.some((c) => c.label.toLowerCase().includes(q)) ?? false;
        }),
    }))
    .filter((section) => section.items.length > 0);

  const initials = (user?.name || '•')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`fixed left-0 top-0 h-full w-64 flex flex-col bg-slate-950 text-slate-100 border-r border-white/[0.06] z-50 transform transition-transform duration-200 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Header */}
      <div className="relative px-3.5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
        <button
          onClick={() => {
            onViewChange('dashboard');
            navigate('/dashboard');
          }}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 group"
          title="Voltar ao Início"
        >
          <img
            src={logo}
            alt=""
            aria-hidden
            className="w-7 h-7 rounded-md object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                company.name,
              )}&background=3B82F6&color=fff`)
            }
          />
          <span className="font-medium text-[14px] text-white truncate">{company.name}</span>
        </button>
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
        <label className="relative flex items-center h-8 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.06] focus-within:border-violet-500/40 focus-within:bg-white/[0.06] transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            placeholder="Buscar no menu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-2 flex-1 bg-transparent border-0 outline-none text-[12.5px] text-slate-200 placeholder:text-slate-500 p-0 m-0 focus:ring-0"
          />
        </label>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 mt-1 px-2 pb-2 overflow-y-auto">
        {filteredSections.map((section, sectionIdx) => (
          <div key={section.label} className={sectionIdx > 0 ? 'mt-3' : ''}>
            <p className="px-2 pt-2 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-500">
              {section.label}
            </p>
            <div className="space-y-px">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  currentView={currentView}
                  expanded={expandedItems[item.id] ?? false}
                  onClick={() => handleItemClick(item.id, !!item.children)}
                  onChildClick={(childId) => handleItemClick(childId, false)}
                />
              ))}
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && search && (
          <div className="px-3 py-6 text-center text-[12px] text-slate-500">
            Nenhum item encontrado para “{search}”.
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="relative shrink-0 border-t border-white/[0.06]">
        <div className="flex items-center justify-between px-2 pt-2 pb-1.5 gap-1">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex items-center gap-2 h-7 px-2 rounded-md text-[12px] text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
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
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
            title="Configurações"
          >
            <Settings className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button
            onClick={logout}
            aria-label="Sair"
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-2 pb-2.5">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <span className="relative w-7 h-7 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" aria-label="Online" />
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

interface SidebarItemProps {
  item: MenuItem;
  currentView: View;
  expanded: boolean;
  onClick: () => void;
  onChildClick: (id: View) => void;
}

function SidebarItem({ item, currentView, expanded, onClick, onChildClick }: SidebarItemProps) {
  const Icon = item.icon;
  const isActive = currentView === item.id;
  const isSectionActive = item.children?.some((c) => c.id === currentView) ?? false;
  const highlight = isActive || isSectionActive;

  if (!item.children) {
    return (
      <button
        onClick={onClick}
        title={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${
          isActive
            ? 'bg-white/[0.07] text-white font-medium'
            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-violet-400" aria-hidden />
        )}
        <Icon
          className={`w-[17px] h-[17px] shrink-0 transition-colors ${
            isActive ? 'text-violet-300' : 'text-slate-400 group-hover:text-slate-200'
          }`}
          strokeWidth={1.75}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  }

  return (
    <div className="space-y-px">
      <button
        onClick={onClick}
        title={item.label}
        aria-expanded={expanded}
        className={`group relative w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors ${
          highlight
            ? 'bg-white/[0.07] text-white font-medium'
            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {highlight && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-violet-400" aria-hidden />
        )}
        <Icon
          className={`w-[17px] h-[17px] shrink-0 transition-colors ${
            highlight ? 'text-violet-300' : 'text-slate-400 group-hover:text-slate-200'
          }`}
          strokeWidth={1.75}
        />
        <span className="truncate flex-1 text-left">{item.label}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-slate-500 shrink-0"
          aria-hidden
        >
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-[15px] pl-2.5 border-l border-white/[0.06] space-y-px py-0.5">
              {item.children.map((child) => {
                const isChildActive = currentView === child.id;
                const ChildIcon = child.icon;
                return (
                  <button
                    key={child.id}
                    onClick={() => onChildClick(child.id)}
                    title={child.label}
                    aria-current={isChildActive ? 'page' : undefined}
                    className={`relative w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] transition-colors ${
                      isChildActive
                        ? 'bg-white/[0.07] text-white font-medium'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                    }`}
                  >
                    <ChildIcon
                      className={`w-[14px] h-[14px] shrink-0 ${
                        isChildActive ? 'text-violet-300' : 'text-slate-500'
                      }`}
                      strokeWidth={1.75}
                    />
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
}
