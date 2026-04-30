import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export type StatTone = "emerald" | "sky" | "amber" | "violet" | "rose" | "slate";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;            // percentual vs período anterior
  trend?: number[];          // série pra sparkline
  hint?: string;             // texto auxiliar (ex.: "vs últimos 7 dias")
  icon?: React.ReactNode;    // ícone Lucide opcional
  tone?: StatTone;           // cor semântica do KPI
  format?: "currency" | "number" | "raw";
  className?: string;
}

// Mapas estáticos para o JIT do Tailwind detectar todas as classes
const TONE_ICON: Record<StatTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  sky:     "bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  amber:   "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  violet:  "bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
  rose:    "bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  slate:   "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/[0.08]",
};

const TONE_ACCENT: Record<StatTone, string> = {
  emerald: "bg-emerald-500",
  sky:     "bg-sky-500",
  amber:   "bg-amber-500",
  violet:  "bg-violet-500",
  rose:    "bg-rose-500",
  slate:   "bg-slate-400",
};

const TONE_SPARK: Record<StatTone, string> = {
  emerald: "rgb(16 185 129)",
  sky:     "rgb(14 165 233)",
  amber:   "rgb(245 158 11)",
  violet:  "rgb(139 92 246)",
  rose:    "rgb(244 63 94)",
  slate:   "rgb(100 116 139)",
};

const formatValue = (value: string | number, format: StatCardProps["format"]) => {
  if (typeof value === "string") return value;
  if (format === "currency")
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  if (format === "number")
    return new Intl.NumberFormat("pt-BR").format(value);
  return String(value);
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 88;
  const h = 28;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => `${(i * stepX).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`);
  const polyline = points.join(" ");
  // Área preenchida com gradient
  const area = `0,${h} ${polyline} ${w},${h}`;
  const id = `spark-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) * stepX} cy={h - ((data[data.length - 1] - min) / range) * h} r="2" fill={color} />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  trend,
  hint,
  icon,
  tone = "slate",
  format = "raw",
  className = "",
}: StatCardProps) {
  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const isUp = hasDelta && delta! > 0;
  const isDown = hasDelta && delta! < 0;
  const isFlat = hasDelta && delta === 0;

  return (
    <div
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/[0.14] hover:shadow-sm transition-all ${className}`}
    >
      {/* Accent bar topo — assinatura SaaS pra categorizar visualmente */}
      <span className={`absolute inset-x-0 top-0 h-[2px] ${TONE_ACCENT[tone]} opacity-70`} aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span
                className={`w-7 h-7 rounded-md flex items-center justify-center ${TONE_ICON[tone]}`}
                aria-hidden
              >
                {icon}
              </span>
            )}
            <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
              {label}
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[24px] leading-none font-semibold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatValue(value, format)}
            </span>
            {hasDelta && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums ${
                  isUp
                    ? "text-emerald-700 dark:text-emerald-400"
                    : isDown
                      ? "text-rose-700 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {isUp && <ArrowUpRight className="w-3 h-3" strokeWidth={2.25} />}
                {isDown && <ArrowDownRight className="w-3 h-3" strokeWidth={2.25} />}
                {isFlat && <Minus className="w-3 h-3" strokeWidth={2.25} />}
                {Math.abs(delta!).toFixed(1)}%
              </span>
            )}
          </div>
          {hint && (
            <p className="mt-1.5 text-[11.5px] text-slate-500 dark:text-slate-500">{hint}</p>
          )}
        </div>
        {trend && trend.length > 1 && (
          <div className="opacity-90 group-hover:opacity-100 transition-opacity self-end">
            <Sparkline data={trend} color={TONE_SPARK[tone]} />
          </div>
        )}
      </div>
    </div>
  );
}
