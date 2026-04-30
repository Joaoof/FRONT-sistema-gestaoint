import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Bell, Search, ChevronRight, Slash, Command } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";

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
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMac, setIsMac] = useState(true);

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

      {/* Notifications */}
      <button
        type="button"
        aria-label="Notificações"
        className="relative w-8 h-8 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
      >
        <Bell className="w-[15px] h-[15px]" strokeWidth={1.75} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" aria-hidden />
      </button>

      {/* User menu */}
      <div className="relative" data-user-menu>
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          <span className="relative w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[10.5px] font-semibold flex items-center justify-center shadow-[0_0_0_1px_rgb(139_92_246_/_0.25)]">
            {initials(user?.name)}
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
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{user?.name}</div>
              <div className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
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
