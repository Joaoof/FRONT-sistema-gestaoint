import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;            // percentual vs período anterior
  trend?: number[];          // série pra sparkline
  hint?: string;             // texto auxiliar (ex.: "vs últimos 7 dias")
  icon?: React.ReactNode;    // ícone Lucide opcional
  format?: "currency" | "number" | "raw";
  className?: string;
}

const formatValue = (value: string | number, format: StatCardProps["format"]) => {
  if (typeof value === "string") return value;
  if (format === "currency")
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  if (format === "number")
    return new Intl.NumberFormat("pt-BR").format(value);
  return String(value);
};

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 22;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(" ");
  const last = data[data.length - 1];
  const first = data[0];
  const up = last >= first;
  const stroke = up ? "rgb(16 185 129)" : "rgb(244 63 94)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
  format = "raw",
  className = "",
}: StatCardProps) {
  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const isUp = hasDelta && delta! > 0;
  const isDown = hasDelta && delta! < 0;
  const isFlat = hasDelta && delta === 0;

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="w-5 h-5 rounded text-slate-500 dark:text-slate-400 flex items-center justify-center">
                {icon}
              </span>
            )}
            <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
              {label}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
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
          <div className="opacity-90 group-hover:opacity-100 transition-opacity">
            <Sparkline data={trend} />
          </div>
        )}
      </div>
    </div>
  );
}
