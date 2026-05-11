import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Shield, LayoutDashboard, Building2, Mail, Users,
    Boxes, Activity, Sparkles, Webhook, Settings, LogOut,
    ChevronLeft, ChevronRight, Search, Bell, Crown, ChevronRight as ChevronRightIcon,
    Command, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    group?: string;
};

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
    {
        title: 'Geral',
        items: [
            { to: '/super-admin', label: 'Visão geral', icon: LayoutDashboard },
            { to: '/super-admin/empresas', label: 'Empresas', icon: Building2 },
            { to: '/super-admin/usuarios', label: 'Usuários', icon: Users },
        ],
    },
    {
        title: 'Acessos',
        items: [
            { to: '/super-admin/convites', label: 'Convites', icon: Mail },
            { to: '/super-admin/planos', label: 'Planos & módulos', icon: Boxes },
        ],
    },
    {
        title: 'Produto',
        items: [
            { to: '/super-admin/ia', label: 'IA & créditos', icon: Sparkles },
            { to: '/super-admin/webhooks', label: 'Webhooks', icon: Webhook },
        ],
    },
    {
        title: 'Operação',
        items: [
            { to: '/super-admin/logs', label: 'Logs master', icon: Activity },
            { to: '/super-admin/configuracoes', label: 'Configurações', icon: Settings },
        ],
    },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
    '/super-admin': { title: 'Visão geral', subtitle: 'Painel global do GestãoInt' },
    '/super-admin/empresas': { title: 'Empresas', subtitle: 'Tenants do sistema' },
    '/super-admin/usuarios': { title: 'Usuários', subtitle: 'Todas as contas cadastradas' },
    '/super-admin/convites': { title: 'Convites', subtitle: 'Onboarding por e-mail' },
    '/super-admin/planos': { title: 'Planos & módulos', subtitle: 'Permissões READ / WRITE' },
    '/super-admin/ia': { title: 'IA & créditos', subtitle: 'Pacotes PIX, consumo e modelos' },
    '/super-admin/webhooks': { title: 'Webhooks', subtitle: 'Conexões bancárias e eventos' },
    '/super-admin/logs': { title: 'Logs master', subtitle: 'Auditoria de toda a plataforma' },
    '/super-admin/configuracoes': { title: 'Configurações', subtitle: 'Variáveis globais e integrações' },
};

function useGoogleFonts() {
    useEffect(() => {
        const id = 'super-admin-fonts';
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
        document.head.appendChild(link);
    }, []);
}

export function SuperAdminLayout() {
    useGoogleFonts();
    const [collapsed, setCollapsed] = useState(false);
    const { user, company, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const initials = useMemo(() => {
        const name = user?.name?.trim() || 'SA';
        return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'SA';
    }, [user?.name]);

    const pageMeta = useMemo(() => {
        return ROUTE_TITLES[location.pathname] ?? { title: 'Super admin' };
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    return (
        <div
            className="flex min-h-screen bg-[#0b0d12] text-slate-100 super-admin-root"
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontFeatureSettings: '"cv02","cv03","cv04","cv11"',
            }}
        >
            <style>{`
                .super-admin-root { letter-spacing: -0.005em; }
                .super-admin-root .font-display {
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    letter-spacing: -0.02em;
                }
                .super-admin-root .font-mono-num {
                    font-family: 'JetBrains Mono', monospace;
                    font-variant-numeric: tabular-nums;
                }
                .super-admin-root::selection { background: rgba(244, 63, 94, 0.3); }
                .super-admin-root *::-webkit-scrollbar { width: 8px; height: 8px; }
                .super-admin-root *::-webkit-scrollbar-track { background: transparent; }
                .super-admin-root *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
                .super-admin-root *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .super-admin-root .anim-fade-slide { animation: fadeSlideIn 240ms ease-out; }
            `}</style>

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen z-40 transition-[width] duration-300 bg-[#101218] border-r border-white/[0.06] flex flex-col ${
                    collapsed ? 'w-[68px]' : 'w-[248px]'
                }`}
            >
                {/* Brand */}
                <div className="h-[68px] flex items-center px-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-rose-500 via-rose-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                            <Crown className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 anim-fade-slide">
                                <div className="font-display text-[15px] font-bold text-white leading-tight">
                                    GestãoInt
                                </div>
                                <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-[0.15em] mt-0.5">
                                    Super Admin
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    {NAV_GROUPS.map((group, gi) => (
                        <div key={group.title} className={gi > 0 ? 'mt-5' : ''}>
                            {!collapsed && (
                                <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    {group.title}
                                </div>
                            )}
                            {collapsed && gi > 0 && <div className="my-3 mx-2 border-t border-white/5" />}
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/super-admin'}
                                    className={({ isActive }) =>
                                        `relative flex items-center gap-3 px-2.5 py-2 rounded-[8px] mb-0.5 text-[13px] font-medium transition-all duration-150 ${
                                            isActive
                                                ? 'bg-white/[0.06] text-white'
                                                : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
                                        }`
                                    }
                                    title={collapsed ? item.label : undefined}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-gradient-to-b from-rose-400 to-orange-500" />
                                            )}
                                            <item.icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-rose-400' : ''}`} strokeWidth={isActive ? 2.2 : 1.8} />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* User card */}
                <div className="p-3 border-t border-white/[0.06]">
                    {!collapsed ? (
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0 ring-2 ring-rose-500/20">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate leading-tight">
                                    {user?.name || 'Super Admin'}
                                </div>
                                <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                                    {user?.email}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Sair"
                            >
                                <LogOut className="w-[15px] h-[15px]" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-[#101218] border border-white/10 text-slate-400 hover:text-white hover:border-rose-500/40 flex items-center justify-center shadow-md transition-all z-10"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Main */}
            <div className={`flex-1 min-w-0 transition-[margin] duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[248px]'}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-30 h-[68px] bg-[#0b0d12]/85 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-6 lg:px-8 gap-4">
                    {/* Page title + breadcrumb */}
                    <div className="min-w-0 hidden md:block">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-medium">Super admin</span>
                            {location.pathname !== '/super-admin' && (
                                <>
                                    <ChevronRightIcon className="w-3 h-3" />
                                    <span className="text-slate-400 font-medium">{pageMeta.title}</span>
                                </>
                            )}
                        </div>
                        <h1 className="font-display text-[17px] font-bold text-white leading-tight mt-0.5">
                            {pageMeta.title}
                        </h1>
                    </div>

                    <div className="flex-1 max-w-md mx-auto md:mx-0 md:ml-auto">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar empresas, usuários, eventos…"
                                className="w-full h-10 pl-10 pr-12 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10 focus:border-rose-500/40 text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
                            />
                            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono-num rounded bg-white/5 border border-white/10 text-slate-400 hidden lg:flex items-center gap-0.5">
                                <Command className="w-2.5 h-2.5" />K
                            </kbd>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button className="relative w-10 h-10 rounded-lg hover:bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Ajuda">
                            <HelpCircle className="w-[17px] h-[17px]" strokeWidth={1.8} />
                        </button>
                        <button className="relative w-10 h-10 rounded-lg hover:bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Notificações">
                            <Bell className="w-[17px] h-[17px]" strokeWidth={1.8} />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b0d12]" />
                        </button>
                        {company && (
                            <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-white/[0.06] py-1.5">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[12px] text-slate-300 font-medium truncate max-w-[140px]">
                                        {company.name}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="hidden md:flex items-center gap-1.5 ml-2 px-2.5 py-1.5 rounded-lg bg-rose-500/[0.08] border border-rose-500/20">
                            <Shield className="w-3 h-3 text-rose-400" strokeWidth={2.5} />
                            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-[0.1em]">
                                Super
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="px-6 lg:px-8 py-8 min-h-[calc(100vh-68px)] anim-fade-slide" key={location.pathname}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
