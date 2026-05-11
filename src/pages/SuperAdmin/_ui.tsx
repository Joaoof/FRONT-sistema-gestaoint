/**
 * Primitivos de UI compartilhados entre as páginas do super-admin.
 * Mantém consistência visual (8pt grid, tipografia Plus Jakarta + Inter,
 * cores funcionais, estados de hover/focus/empty).
 */
import { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from 'lucide-react';

// ---- Page header ---------------------------------------------------------

export function PageHeader({
    title, description, actions,
}: { title: string; description?: string; actions?: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 mb-8">
            <div className="min-w-0">
                <h1 className="font-display text-[28px] font-bold text-white tracking-tight leading-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-[13.5px] text-slate-400 mt-1.5 leading-relaxed max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
}

// ---- Section / Card ------------------------------------------------------

export function Card({
    children, className = '', padding = true,
}: { children: ReactNode; className?: string; padding?: boolean }) {
    return (
        <div className={`rounded-xl bg-[#13161e] border border-white/[0.06] ${padding ? 'p-5' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function SectionTitle({
    title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="flex items-end justify-between gap-4 mb-4">
            <div className="min-w-0">
                <h2 className="font-display text-[15.5px] font-bold text-white tracking-tight">{title}</h2>
                {description && <p className="text-[12.5px] text-slate-500 mt-0.5">{description}</p>}
            </div>
            {action}
        </div>
    );
}

// ---- KPIs ----------------------------------------------------------------

type Trend = { value: number; label?: string; direction?: 'up' | 'down' };

export function KPI({
    label, value, trend, icon: Icon, hint, accent = 'default',
}: {
    label: string;
    value: string | number;
    trend?: Trend;
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    hint?: string;
    accent?: 'default' | 'rose' | 'amber' | 'emerald' | 'violet' | 'sky';
}) {
    const accentMap = {
        default: { bg: 'bg-white/[0.04]', text: 'text-white', icon: 'text-slate-400' },
        rose: { bg: 'bg-rose-500/[0.08]', text: 'text-rose-300', icon: 'text-rose-400' },
        amber: { bg: 'bg-amber-500/[0.08]', text: 'text-amber-300', icon: 'text-amber-400' },
        emerald: { bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-300', icon: 'text-emerald-400' },
        violet: { bg: 'bg-violet-500/[0.08]', text: 'text-violet-300', icon: 'text-violet-400' },
        sky: { bg: 'bg-sky-500/[0.08]', text: 'text-sky-300', icon: 'text-sky-400' },
    }[accent];

    return (
        <Card className="hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
                    {label}
                </span>
                {Icon && (
                    <div className={`w-7 h-7 rounded-md ${accentMap.bg} flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${accentMap.icon}`} strokeWidth={2} />
                    </div>
                )}
            </div>
            <div className={`font-display font-bold text-[26px] mt-3 ${accentMap.text} leading-none font-mono-num tracking-tight`}>
                {value}
            </div>
            {(trend || hint) && (
                <div className="mt-2.5 flex items-center gap-2 text-[11.5px]">
                    {trend && (
                        <span className={`inline-flex items-center gap-0.5 font-semibold ${
                            trend.direction === 'down' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                            {trend.direction === 'down' ? (
                                <ArrowDownRight className="w-3 h-3" />
                            ) : (
                                <ArrowUpRight className="w-3 h-3" />
                            )}
                            {trend.value > 0 ? '+' : ''}{trend.value}%
                        </span>
                    )}
                    {hint && <span className="text-slate-500">{hint}</span>}
                    {trend?.label && <span className="text-slate-500">{trend.label}</span>}
                </div>
            )}
        </Card>
    );
}

// ---- Buttons -------------------------------------------------------------

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type BtnSize = 'sm' | 'md';

export function Button({
    children, onClick, variant = 'primary', size = 'md', disabled, icon: Icon, type = 'button', className = '',
}: {
    children?: ReactNode;
    onClick?: () => void;
    variant?: BtnVariant;
    size?: BtnSize;
    disabled?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    type?: 'button' | 'submit';
    className?: string;
}) {
    const sizeCls = size === 'sm'
        ? 'h-8 px-3 text-[12.5px]'
        : 'h-10 px-4 text-[13px]';

    const variantCls = {
        primary: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-sm shadow-rose-500/20',
        secondary: 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08]',
        ghost: 'text-slate-400 hover:text-white hover:bg-white/[0.04]',
        danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30',
    }[variant];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:outline-none ${sizeCls} ${variantCls} ${className}`}
        >
            {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
            {children}
        </button>
    );
}

// ---- Badge / Status ------------------------------------------------------

type BadgeTone = 'neutral' | 'rose' | 'amber' | 'emerald' | 'violet' | 'sky' | 'slate';

export function Badge({
    children, tone = 'neutral', icon: Icon,
}: { children: ReactNode; tone?: BadgeTone; icon?: React.ComponentType<{ className?: string }> }) {
    const cls = {
        neutral: 'bg-white/[0.06] text-slate-300 border-white/[0.08]',
        rose: 'bg-rose-500/[0.1] text-rose-300 border-rose-500/30',
        amber: 'bg-amber-500/[0.1] text-amber-300 border-amber-500/30',
        emerald: 'bg-emerald-500/[0.1] text-emerald-300 border-emerald-500/30',
        violet: 'bg-violet-500/[0.1] text-violet-300 border-violet-500/30',
        sky: 'bg-sky-500/[0.1] text-sky-300 border-sky-500/30',
        slate: 'bg-slate-500/[0.1] text-slate-400 border-slate-500/30',
    }[tone];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {children}
        </span>
    );
}

// ---- Form fields ---------------------------------------------------------

export function Field({
    label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
    return (
        <label className="block">
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[11.5px] font-semibold text-slate-300 tracking-wide">
                    {label} {required && <span className="text-rose-400">*</span>}
                </span>
                {hint && <span className="text-[10.5px] text-slate-500">{hint}</span>}
            </div>
            {children}
        </label>
    );
}

export const inputCls =
    'w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-rose-500/40 focus:bg-white/[0.06] text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors';

export const textareaCls =
    'w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-rose-500/40 focus:bg-white/[0.06] text-[13px] text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors resize-none';

// ---- Empty state ---------------------------------------------------------

export function EmptyState({
    icon: Icon, title, description, action,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-slate-500" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-[15px] font-bold text-slate-200">{title}</h3>
            {description && (
                <p className="text-[12.5px] text-slate-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

// ---- Table primitives ----------------------------------------------------

export function Table({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[13px] min-w-[640px]">{children}</table>
        </div>
    );
}

export function Th({ children, className = '', align = 'left' }: { children?: ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
    return (
        <th className={`px-4 py-3 font-semibold text-[10.5px] uppercase tracking-[0.08em] text-slate-500 text-${align} ${className}`}>
            {children}
        </th>
    );
}

export function Td({ children, className = '', align = 'left' }: { children?: ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
    return <td className={`px-4 py-3 text-${align} ${className}`}>{children}</td>;
}

export function MoreButton({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
        >
            <MoreHorizontal className="w-4 h-4" />
        </button>
    );
}

// ---- Avatar --------------------------------------------------------------

export function Avatar({ name, size = 32, hue }: { name: string; size?: number; hue?: number }) {
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || '?';
    const h = hue ?? hashStringToHue(name);
    const fontSize = Math.round(size * 0.38);
    return (
        <div
            className="rounded-full flex items-center justify-center font-bold text-white shrink-0 ring-1 ring-white/10"
            style={{
                width: size,
                height: size,
                fontSize,
                background: `linear-gradient(135deg, hsl(${h}deg 70% 50%), hsl(${(h + 40) % 360}deg 70% 45%))`,
            }}
        >
            {initials}
        </div>
    );
}

function hashStringToHue(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    return Math.abs(hash) % 360;
}

// ---- Modal ---------------------------------------------------------------

export function Modal({
    open, onClose, title, description, children, footer, size = 'md',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}) {
    if (!open) return null;
    const sizeCls = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 anim-fade-slide" onClick={onClose}>
            <div
                className={`w-full ${sizeCls} bg-[#13161e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-white/[0.06]">
                    <h3 className="font-display text-[16px] font-bold text-white">{title}</h3>
                    {description && <p className="text-[12.5px] text-slate-400 mt-1">{description}</p>}
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                {footer && (
                    <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Tabs ----------------------------------------------------------------

export function Tabs<T extends string>({
    options, value, onChange, counts,
}: {
    options: Array<{ value: T; label: string }>;
    value: T;
    onChange: (v: T) => void;
    counts?: Partial<Record<T, number>>;
}) {
    return (
        <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-[#13161e] border border-white/[0.06]">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 h-8 rounded-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${
                        value === opt.value
                            ? 'bg-white/[0.08] text-white'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    {opt.label}
                    {counts?.[opt.value] !== undefined && (
                        <span className={`text-[10.5px] font-mono-num px-1.5 py-0.5 rounded ${
                            value === opt.value ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-slate-500'
                        }`}>
                            {counts[opt.value]}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
