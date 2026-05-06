// src/components/Sidebar.tsx
import { View } from '../pages/AuthenticatedApp';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Bot,
  MessageCircle,
  Users,
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
  AlertTriangle,
  BarChart3,
  Building2,
  CircleDollarSign,
  HelpCircle,
  History,
  PieChart,
  Plus,
  Sliders,
  Sparkles,
  TrendingUp,
  UserPlus,
  Warehouse,
  HardHat,
  Landmark,
  Bell,
  ArrowLeftRight,
  Banknote,
  FileText,
  TrendingDown,
  Cog,
  FolderTree,
  MessageSquare,
  Briefcase,
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
  timeline: 'timeline',
  relatorios: 'dashboard',
  'relatorios/visao-geral': 'dashboard',
  entregas: 'entregas',
  'entregas/cadastrar': 'entregas',
  'entregas/agendar': 'entregas',
  'entregas/relatorios': 'entregas',
  cadastros: 'cadastros',
  estoque: 'estoque',
  'estoque/alertas': 'estoque',
  produtos: 'estoque',
  'produtos/cadastrar': 'estoque',
  categorias: 'cadastros',
  vendas: 'vendas',
  'vendas/saida-rapida': 'vendas',
  pedidos: 'vendas',
  fiscal: 'fiscal',
  'fiscal-receber': 'fiscal',
  'fiscal-receber-criar': 'fiscal',
  'fiscal-pagar': 'fiscal',
  'fiscal-pagar-criar': 'fiscal',
  financeiro: 'financeiro',
  ecommerce: 'ecommerce',
  consultas: 'consultas',
  entrada: 'estoque',
  movimentacoes: 'movimentacoes',
  'formulario-movimentacao': 'movimentacoes',
  'historico-movimentacao': 'movimentacoes',
  historico: 'movimentacoes',
  help: 'dashboard',
  empresa: 'configuracoes',
  configuracoes: 'configuracoes',
  vendedores: 'vendas',
  bancos: 'bancos',
  alertas: 'alertas',
  motoristas: 'entregas',
  ia: 'dashboard',
  'agente-ia': 'dashboard',
  obras: 'construction',
  'obras/cadastrar': 'construction',
  'obras/transacoes': 'construction',
  'obras/transacoes/cadastrar': 'construction',
  'obras/cadastros/centros-custo': 'construction',
  'obras/cadastros/categorias': 'construction',
  'obras/relatorios/previsto-realizado': 'construction',
  'obras/relatorios/desvio': 'construction',
  'obras/relatorios/fluxo-caixa': 'construction',
  'obras/relatorios/quebra-custos': 'construction',
  notas: 'notas',
  'notas/nova': 'notas',
  'configuracoes/fiscal': 'configuracoes',
  'configuracoes/parametros': 'configuracoes',
  'configuracoes/plano-contas': 'configuracoes',
  'configuracoes/templates': 'configuracoes',
  notificacoes: 'notificacoes',
  comunicacoes: 'comunicacoes',
  'comunicacoes/whatsapp': 'comunicacoes',
  'comunicacoes/whatsapp/contatos': 'comunicacoes',
  'comunicacoes/whatsapp/chatbot': 'comunicacoes',
  crm: 'crm',
  contratos: 'contratos',
  auditoria: 'auditoria',
} as Record<string, string>;

const ALWAYS_VISIBLE_MODULES = new Set(['construction', 'bancos', 'alertas', 'notas', 'auditoria', 'configuracoes', 'notificacoes', 'comunicacoes', 'crm', 'contratos', 'timeline']);

function hasPermission(
  permissions: { module_key: string; permissions: string[] }[],
  view: View,
): boolean {
  const moduleKey = VIEW_TO_MODULE[view];
  if (!moduleKey) return false;
  if (ALWAYS_VISIBLE_MODULES.has(moduleKey)) return true;
  return permissions.some((p) => p.module_key === moduleKey);
}

const sections: MenuSection[] = [
  {
    label: 'Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'timeline' as View, label: 'Novidades do dia', icon: Sparkles },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { id: 'consultas', label: 'Consultas', icon: ScanSearch },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      {
        id: 'produtos' as View,
        label: 'Produtos',
        icon: Package,
        children: [
          { id: 'produtos' as View, label: 'Listar', icon: Package },
          { id: 'produtos/cadastrar' as View, label: 'Novo produto', icon: Plus },
        ],
      },
      { id: 'categorias' as View, label: 'Categorias', icon: Tag },
      {
        id: 'estoque' as View,
        label: 'Estoque',
        icon: Warehouse,
        children: [
          { id: 'estoque' as View, label: 'Central', icon: Boxes },
          { id: 'estoque/alertas' as View, label: 'Alertas críticos', icon: AlertTriangle },
        ],
      },
      { id: 'cadastros' as View, label: 'Clientes & Fornecedores', icon: UserPlus },
    ],
  },
  {
    label: 'Operação',
    items: [
      {
        id: 'vendas' as View,
        label: 'Vendas',
        icon: ShoppingCart,
        children: [
          { id: 'vendas' as View, label: 'Nova venda (PDV)', icon: Plus },
          { id: 'pedidos' as View, label: 'Pedidos & impressão', icon: Receipt },
          { id: 'vendas/saida-rapida' as View, label: 'Saída rápida', icon: Sliders },
          { id: 'vendedores' as View, label: 'Vendedores', icon: UserPlus },
        ],
      },
      {
        id: 'entregas' as View,
        label: 'Entregas',
        icon: Truck,
        children: [
          { id: 'entregas' as View, label: 'Painel', icon: Truck },
          { id: 'entregas/cadastrar' as View, label: 'Nova entrega', icon: Plus },
          { id: 'motoristas' as View, label: 'Motoristas', icon: UserPlus },
          { id: 'entregas/agendar' as View, label: 'Agendar rota', icon: ClipboardList },
          { id: 'entregas/relatorios' as View, label: 'Relatórios', icon: BarChart3 },
        ],
      },
      { id: 'ecommerce' as View, label: 'E-commerce', icon: Globe },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { id: 'ia' as View, label: 'IA Studio', icon: Sparkles },
      { id: 'agente-ia' as View, label: 'Agente de IA', icon: MessageCircle },
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
          { id: 'movimentacoes' as View, label: 'Painel', icon: ArrowRightLeft },
          { id: 'formulario-movimentacao', label: 'Nova movimentação', icon: Plus },
          { id: 'historico-movimentacao', label: 'Histórico', icon: History },
        ],
      },
      {
        id: 'fiscal',
        label: 'Contas',
        icon: Receipt,
        children: [
          { id: 'fiscal-receber', label: 'A Receber', icon: TrendingUp },
          { id: 'fiscal-receber-criar', label: 'Nova receita', icon: Plus },
          { id: 'fiscal-pagar', label: 'A Pagar', icon: CircleDollarSign },
          { id: 'fiscal-pagar-criar', label: 'Nova despesa', icon: Plus },
        ],
      },
      {
        id: 'notas' as View,
        label: 'Notas fiscais',
        icon: FileText,
        children: [
          { id: 'notas' as View, label: 'Listar notas', icon: FileText },
          { id: 'notas/nova' as View, label: 'Emitir nota', icon: Plus },
        ],
      },
      {
        id: 'financeiro' as View,
        label: 'Financeiro',
        icon: Wallet,
        children: [
          { id: 'financeiro' as View, label: 'Visão geral', icon: PieChart },
          { id: 'bancos' as View, label: 'Bancos', icon: Landmark },
          { id: 'relatorios/visao-geral' as View, label: 'Painel completo', icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: 'Construção civil',
    items: [
      {
        id: 'obras' as View,
        label: 'Obras',
        icon: HardHat,
        children: [
          { id: 'obras' as View, label: 'Painel de obras', icon: HardHat },
          { id: 'obras/cadastrar' as View, label: 'Nova obra', icon: Plus },
          { id: 'obras/transacoes' as View, label: 'Transações', icon: ArrowLeftRight },
          { id: 'obras/transacoes/cadastrar' as View, label: 'Nova transação', icon: Plus },
        ],
      },
      {
        id: 'obras/relatorios/previsto-realizado' as View,
        label: 'Relatórios de obra',
        icon: BarChart3,
        children: [
          { id: 'obras/relatorios/previsto-realizado' as View, label: 'Previsto vs Realizado', icon: BarChart3 },
          { id: 'obras/relatorios/desvio' as View, label: 'Análise de desvio', icon: TrendingDown },
          { id: 'obras/relatorios/fluxo-caixa' as View, label: 'Fluxo de caixa', icon: Banknote },
          { id: 'obras/relatorios/quebra-custos' as View, label: 'Quebra de custos', icon: PieChart },
        ],
      },
      {
        id: 'obras/cadastros/centros-custo' as View,
        label: 'Cadastros',
        icon: FileText,
        children: [
          { id: 'obras/cadastros/centros-custo' as View, label: 'Centros de custo', icon: Building2 },
          { id: 'obras/cadastros/categorias' as View, label: 'Categorias', icon: Tag },
        ],
      },
    ],
  },
  {
    label: 'CRM & Contratos',
    items: [
      { id: 'crm' as View, label: 'Pipeline (CRM)', icon: Briefcase },
      { id: 'contratos' as View, label: 'Contratos', icon: FileText },
    ],
  },
  {
    label: 'Comunicações',
    items: [
      {
        id: 'comunicacoes/whatsapp' as View,
        label: 'WhatsApp',
        icon: MessageCircle,
        children: [
          { id: 'comunicacoes/whatsapp' as View, label: 'Conversas', icon: MessageCircle },
          { id: 'comunicacoes/whatsapp/contatos' as View, label: 'Contatos', icon: Users },
          { id: 'comunicacoes/whatsapp/chatbot' as View, label: 'Chatbot', icon: Bot },
        ],
      },
      { id: 'comunicacoes' as View, label: 'Central de mensagens', icon: MessageSquare },
      { id: 'notificacoes' as View, label: 'Notificações', icon: Bell },
      { id: 'alertas' as View, label: 'Alertas críticos', icon: AlertTriangle },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'empresa' as View, label: 'Empresa', icon: Building2 },
      {
        id: 'configuracoes' as View,
        label: 'Configurações',
        icon: Settings,
        children: [
          { id: 'configuracoes' as View, label: 'Geral', icon: Sliders },
          { id: 'configuracoes/fiscal' as View, label: 'Fiscal', icon: Receipt },
          { id: 'configuracoes/parametros' as View, label: 'Parâmetros', icon: Cog },
          { id: 'configuracoes/plano-contas' as View, label: 'Plano de contas', icon: FolderTree },
          { id: 'configuracoes/templates' as View, label: 'Templates', icon: MessageSquare },
        ],
      },
      { id: 'auditoria' as View, label: 'Auditoria', icon: History },
      { id: 'help' as View, label: 'Ajuda & suporte', icon: HelpCircle },
    ],
  },
];

const groupedChildren: Record<string, View[]> = {
  produtos: ['produtos', 'produtos/cadastrar'],
  estoque: ['estoque', 'estoque/alertas'],
  vendas: ['vendas', 'pedidos' as View, 'vendas/saida-rapida'],
  entregas: ['entregas', 'entregas/cadastrar', 'entregas/agendar', 'entregas/relatorios'],
  movimentacoes: ['movimentacoes', 'formulario-movimentacao', 'historico-movimentacao'],
  fiscal: ['fiscal', 'fiscal-pagar', 'fiscal-pagar-criar', 'fiscal-receber', 'fiscal-receber-criar'],
  financeiro: ['financeiro', 'bancos', 'relatorios/visao-geral'],
  notas: ['notas' as View, 'notas/nova' as View],
  'comunicacoes/whatsapp': [
    'comunicacoes/whatsapp',
    'comunicacoes/whatsapp/contatos',
    'comunicacoes/whatsapp/chatbot',
  ],
  configuracoes: [
    'configuracoes',
    'configuracoes/fiscal',
    'configuracoes/parametros',
    'configuracoes/plano-contas',
    'configuracoes/templates',
  ],
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
      <div className="fixed left-0 top-0 h-full w-72 bg-slate-950 border-r border-white/5 z-50 animate-pulse" />
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
      className={`fixed left-0 top-0 h-full w-72 flex flex-col bg-slate-950 text-slate-100 border-r border-white/[0.06] z-50 transform transition-transform duration-200 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Header */}
      <div className="relative px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <button
          onClick={() => {
            onViewChange('dashboard');
            navigate('/dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer min-w-0 group"
          title="Voltar ao Início"
        >
          <img
            src={logo}
            alt=""
            aria-hidden
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition"
            onError={(e) =>
              ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                company.name,
              )}&background=3B82F6&color=fff`)
            }
          />
          <span className="font-semibold text-[15.5px] text-white truncate">{company.name}</span>
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
      <div className="px-3 pt-3 pb-1">
        <label className="relative flex items-center h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] focus-within:border-violet-500/40 focus-within:bg-white/[0.06] transition-colors">
          <Search className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            placeholder="Buscar no menu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-2 flex-1 bg-transparent border-0 outline-none text-[13.5px] text-slate-200 placeholder:text-slate-500 p-0 m-0 focus:ring-0"
          />
        </label>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 mt-1 px-2 pb-2 overflow-y-auto">
        {filteredSections.map((section, sectionIdx) => (
          <div key={section.label} className={sectionIdx > 0 ? 'mt-3' : ''}>
            <p className="px-2.5 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
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

      {/* Atalho WhatsApp */}
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={() => {
            navigate('/whatsapp/relatorio');
            if (window.innerWidth < 1024) onToggle();
          }}
          aria-current={currentView === ('whatsapp/relatorio' as View) ? 'page' : undefined}
          className="group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-gradient-to-r from-emerald-600/20 to-green-600/20 hover:from-emerald-600/30 hover:to-green-600/30 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-colors"
          title="Enviar relatório por WhatsApp"
        >
          <span className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center shrink-0 shadow-sm">
            <MessageCircle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold text-emerald-100 truncate leading-tight">
              Relatório por WhatsApp
            </span>
            <span className="block text-[10.5px] text-emerald-200/70 leading-tight mt-0.5">
              Resumo do mês com preview
            </span>
          </span>
        </button>
      </div>

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
            <span className="relative w-7 h-7 rounded overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || 'avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
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
        className={`group relative w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-[14px] transition-colors ${
          isActive
            ? 'bg-white/[0.07] text-white font-medium'
            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-violet-400" aria-hidden />
        )}
        <Icon
          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
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
        className={`group relative w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-[14px] transition-colors ${
          highlight
            ? 'bg-white/[0.07] text-white font-medium'
            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {highlight && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-violet-400" aria-hidden />
        )}
        <Icon
          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
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
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
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
                    className={`relative w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors ${
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
