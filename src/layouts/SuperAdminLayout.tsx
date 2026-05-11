import { useState, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Shield, LayoutDashboard, Building2, Mail, Users,
    Boxes, Activity, Sparkles, Webhook, Settings, LogOut,
    ChevronLeft, ChevronRight, Search, Bell, Crown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
};

const NAV_ITEMS: NavItem[] = [
    { to: '/super-admin', label: 'Visão Geral', icon: LayoutDashboard },
    { to: '/super-admin/empresas', label: 'Empresas', icon: Building2 },
    { to: '/super-admin/convites', label: 'Convites', icon: Mail },
    { to: '/super-admin/usuarios', label: 'Usuários', icon: Users },
    { to: '/super-admin/planos', label: 'Planos & Módulos', icon: Boxes },
    { to: '/super-admin/ia', label: 'IA & Créditos', icon: Sparkles },
    { to: '/super-admin/webhooks', label: 'Webhooks', icon: Webhook },
    { to: '/super-admin/logs', label: 'Logs Master', icon: Activity },
    { to: '/super-admin/configuracoes', label: 'Configurações', icon: Settings },
];

export function SuperAdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, company, logout } = useAuth();
    const navigate = useNavigate();

    const initials = useMemo(() => {
        const name = user?.name?.trim() || 'SA';
        return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'SA';
    }, [user?.name]);

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-[#0f1117] text-slate-100">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 bg-[#181b25] border-r border-white/5 flex flex-col ${
                    collapsed ? 'w-[68px]' : 'w-[252px]'
                }`}
            >
                {/* Brand */}
                <div className="h-16 flex items-center px-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shrink-0">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="min-w-0">
                                <div className="text-[13.5px] font-semibold text-white leading-tight">
                                    GestãoInt
                                </div>
                                <div className="text-[10.5px] font-medium text-rose-400 uppercase tracking-wider">
                                    Super Admin
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/super-admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-[13.5px] font-medium transition-all ${
                                    isActive
                                        ? 'bg-rose-500/15 text-rose-300 border-l-2 border-rose-500'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                }`
                            }
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon className="w-[18px] h-[18px] shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {!collapsed && item.badge && (
                                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User card */}
                <div className="p-3 border-t border-white/5">
                    {!collapsed ? (
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate">
                                    {user?.name || 'Super Admin'}
                                </div>
                                <div className="text-[10.5px] text-slate-400 truncate">
                                    {user?.email}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-rose-400 transition-colors"
                                title="Sair"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#181b25] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Main */}
            <div className={`flex-1 min-w-0 ${collapsed ? 'ml-[68px]' : 'ml-[252px]'}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-30 h-16 bg-[#11141b] border-b border-white/5 flex items-center px-6 gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <Shield className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[11.5px] font-semibold text-rose-300 uppercase tracking-wider">
                            Modo Super Admin
                        </span>
                    </div>

                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar empresas, usuários, convites..."
                                className="w-full h-9 pl-10 pr-3 rounded-lg bg-white/5 border border-white/10 text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/40"
                            />
                        </div>
                    </div>

                    <button className="relative w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                    </button>

                    {company && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[12px] text-slate-300 truncate max-w-[140px]">
                                {company.name}
                            </span>
                        </div>
                    )}
                </header>

                {/* Content */}
                <main className="p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
