import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Bell, BellRing, Check, Search, ChevronRight, Slash, Command, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";
import { useLowStock } from "../hooks/useLowStock";
import { useNotificationsCenter } from "../contexts/NotificationsCenterContext";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  entregas: "Entregas",
  cadastrar: "Cadastrar",
  agendar: "Agendar rota",
  relatorios: "Relatórios",
  estoque: "Estoque",
  vendas: "Vendas",
  "fiscal-receber": "Contas a receber",
  "fiscal-receber-cria": "Nova receita",
  "fiscal-pagar": "Contas a pagar",
  "fiscal-pagar-criar": "Nova despesa",
  "listar-contas-pagas": "Pagas",
  "listar-contas-receber": "A receber",
  financeiro: "Financeiro",
  consultas: "Consultas",
  movimentacoes: "Movimentações",
  "formulario-movimentacao": "Nova movimentação",
  "historico-movimentacao": "Histórico",
  historico: "Histórico",
  cadastros: "Cadastros",
  configuracoes: "Configurações",
  help: "Ajuda",
};

const initials = (name?: string) =>
  name
    ?.split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "•";

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();

  const [menuOpen, setMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const { items: notifications, unreadCount: notifUnread, markAllRead, markRead, remove: removeNotif, clear: clearNotifs } = useNotificationsCenter();

  // Fecha o dropdown de atividade ao clicar fora
  useEffect(() => {
    if (!activityOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-activity-menu]')) setActivityOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activityOpen]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const { lowStock, count: lowStockCount, outOfStockCount } = useLowStock({ liveToasts: true });

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  // ⌘K / Ctrl+K abre o foco da busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("topbar-search") as HTMLInputElement | null;
        el?.focus();
      }
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  // Fecha o popover de alertas ao clicar fora
  useEffect(() => {
    if (!alertsOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-alerts-menu]")) setAlertsOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [alertsOpen]);

  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || seg.replace(/-/g, " ");
    return { path, label };
  });

  // Não mostra a topbar na tela de login
  if (location.pathname === "/" || location.pathname === "/login") return null;

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 lg:px-6 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06]"
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] min-w-0 flex-1 lg:flex-none">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          <span className="hidden sm:inline truncate max-w-[140px]">{company?.name || "Início"}</span>
          <span className="sm:hidden">Início</span>
        </Link>
        {crumbs.length > 0 && (
          <Slash className="w-3 h-3 text-slate-300 dark:text-slate-700 -rotate-12 shrink-0" strokeWidth={1.5} aria-hidden />
        )}
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <div key={c.path} className="flex items-center gap-1.5 min-w-0">
              {isLast ? (
                <span className="px-1.5 py-1 font-medium text-slate-900 dark:text-white truncate">
                  {c.label}
                </span>
              ) : (
                <Link
                  to={c.path}
                  className="px-1.5 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors truncate"
                >
                  {c.label}
                </Link>
              )}
              {!isLast && (
                <Slash className="w-3 h-3 text-slate-300 dark:text-slate-700 -rotate-12 shrink-0" strokeWidth={1.5} aria-hidden />
              )}
            </div>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="hidden lg:block flex-1" />

      {/* Search */}
      <div
        className={`hidden md:flex items-center gap-2 h-8 min-w-[260px] px-2.5 rounded-md border transition-colors ${
          searchFocused
            ? "border-slate-400 dark:border-white/20 bg-white dark:bg-slate-900"
            : "border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]"
        }`}
      >
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} aria-hidden />
        <input
          id="topbar-search"
          type="search"
          placeholder="Buscar produtos, contas, clientes…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) navigate(`/consultas?q=${encodeURIComponent(q)}`);
            }
          }}
          className="flex-1 bg-transparent border-0 outline-none text-[12.5px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 p-0 m-0 focus:ring-0"
        />
        <kbd className="hidden lg:inline-flex items-center gap-0.5 h-5 px-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded">
          {isMac ? <Command className="w-2.5 h-2.5" strokeWidth={2} /> : "Ctrl"}
          <span>K</span>
        </kbd>
      </div>

      {/* Central de atividades (notificações in-app) */}
      <div className="relative" data-activity-menu>
        <button
          type="button"
          aria-label={`Atividades${notifUnread > 0 ? ` — ${notifUnread} não lida${notifUnread === 1 ? '' : 's'}` : ''}`}
          aria-haspopup="menu"
          aria-expanded={activityOpen}
          onClick={() => {
            setActivityOpen(v => !v);
            if (!activityOpen && notifUnread > 0) markAllRead();
          }}
          className="relative w-8 h-8 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          {notifUnread > 0 ? (
            <BellRing className="w-[15px] h-[15px] animate-wiggle" strokeWidth={1.75} />
          ) : (
            <Bell className="w-[15px] h-[15px]" strokeWidth={1.75} />
          )}
          {notifUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center text-[10px] font-bold text-white rounded-full ring-2 ring-white dark:ring-slate-950 tabular-nums bg-violet-600">
              {notifUnread > 9 ? '9+' : notifUnread}
            </span>
          )}
        </button>

        {activityOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] w-96 max-h-[480px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-md shadow-soft-lg flex flex-col animate-fade-in-up z-50"
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Atividades</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Eventos recentes do sistema</p>
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifs}
                  title="Limpar tudo"
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12.5px] text-slate-500 dark:text-slate-400">
                Sem atividades por aqui ainda.<br />
                <span className="text-[11px]">Vendas, entregas e alertas aparecem em tempo real.</span>
              </div>
            ) : (
              <ul className="overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                {notifications.map((n) => (
                  <li key={n.id} className={!n.read ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead(n.id);
                        if (n.href) {
                          setActivityOpen(false);
                          navigate(n.href);
                        }
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors flex gap-3"
                    >
                      {n.iconUrl ? (
                        <img src={n.iconUrl} alt="" className="w-9 h-9 object-contain shrink-0 mt-0.5" />
                      ) : (
                        <span className={`w-8 h-8 rounded-md grid place-items-center text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                          n.type === 'order' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' :
                          n.type === 'delivery' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' :
                          n.type === 'stock' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' :
                          n.type === 'driver' ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' :
                          'bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300'
                        }`}>
                          {n.type.slice(0, 3)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          {n.title}
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />}
                        </p>
                        {n.message && (
                          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                          {new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeNotif(n.id); }}
                        className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1 self-start"
                        aria-label="Remover notificação"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Notifications (alertas de estoque) */}
      <div className="relative" data-alerts-menu>
        <button
          type="button"
          aria-label={`Notificações${lowStockCount > 0 ? ` — ${lowStockCount} alerta${lowStockCount === 1 ? '' : 's'}` : ''}`}
          aria-haspopup="menu"
          aria-expanded={alertsOpen}
          onClick={() => setAlertsOpen(v => !v)}
          className="relative w-8 h-8 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          <Bell className={`w-[15px] h-[15px] ${lowStockCount > 0 ? 'animate-wiggle' : ''}`} strokeWidth={1.75} />
          {lowStockCount > 0 && (
            <>
              <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center text-[10px] font-bold text-white rounded-full ring-2 ring-white dark:ring-slate-950 tabular-nums ${outOfStockCount > 0 ? 'bg-rose-500' : 'bg-amber-500'}`}>
                {lowStockCount > 9 ? '9+' : lowStockCount}
              </span>
              <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full animate-ping ${outOfStockCount > 0 ? 'bg-rose-500' : 'bg-amber-500'} opacity-60`} aria-hidden />
            </>
          )}
        </button>

        {alertsOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] w-80 max-h-[420px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-md shadow-soft-lg flex flex-col animate-fade-in-up"
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Alertas</h3>
                {lowStockCount > 0 && (
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-full">
                    {lowStockCount} estoque{lowStockCount === 1 ? '' : 's'} baixo{lowStockCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              {outOfStockCount > 0 && (
                <p className="mt-1 text-[11.5px] text-rose-600 dark:text-rose-400 font-medium">
                  {outOfStockCount} produto{outOfStockCount === 1 ? '' : 's'} sem estoque
                </p>
              )}
            </div>

            {lowStockCount === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-slate-500 dark:text-slate-400">
                Nenhum alerta no momento.
              </div>
            ) : (
              <ul className="overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                {lowStock.slice(0, 8).map(p => {
                  const isOut = p.quantity === 0;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setAlertsOpen(false);
                          navigate(`/produtos/${p.id}`);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">
                            {p.nameProduct}
                          </span>
                          <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                          }`}>
                            {isOut ? 'Sem estoque' : `${p.quantity} ${p.unit}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          mínimo: {p.minStock} {p.unit}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-slate-100 dark:border-white/[0.06] px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  setAlertsOpen(false);
                  navigate('/produtos');
                }}
                className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todos os produtos →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" data-user-menu>
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          <span className="relative w-6 h-6 rounded overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[10.5px] font-semibold flex items-center justify-center shadow-[0_0_0_1px_rgb(139_92_246_/_0.25)]">
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
              <span>{initials(user?.name)}</span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" aria-label="Online" />
          </span>
          <span className="hidden sm:inline text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
            {user?.name?.split(" ")[0] || "Conta"}
          </span>
          <ChevronRight className={`hidden sm:inline w-3 h-3 text-slate-400 transition-transform ${menuOpen ? "rotate-90" : ""}`} strokeWidth={2} />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-md shadow-soft-lg overflow-hidden animate-fade-in-up"
          >
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
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
                  <span>{initials(user?.name)}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{user?.name}</div>
                <div className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <div className="py-1">
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); navigate("/configuracoes"); }}
                className="w-full text-left px-3 py-1.5 text-[12.5px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                Configurações
              </button>
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); navigate("/help"); }}
                className="w-full text-left px-3 py-1.5 text-[12.5px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                Ajuda &amp; suporte
              </button>
            </div>
            <div className="border-t border-slate-100 dark:border-white/[0.06] py-1">
              <a
                role="menuitem"
                href="https://github.com/Joaoof"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                Sobre o sistema
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
