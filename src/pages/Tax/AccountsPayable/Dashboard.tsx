// TYPES & INTERFACES
// ==============================

export enum PayableStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
}

export enum SortField {
    SUPPLIER = 'supplier',
    VALUE = 'value',
    DUE_DATE = 'dueDate',
    STATUS = 'status',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export interface Payable {
    id: string;
    supplier: string;
    value: number;
    dueDate: string;
    status: PayableStatus;
    description: string;
    category?: string;
    invoiceNumber?: string;
    notes?: string;
    lastModified?: string;
    createdAt?: string;
}

export interface PayableSummary {
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    daysOverdue: number;
}

export interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
}

export interface FilterState {
    status?: PayableStatus;
    supplier?: string;
    dateRange?: { start: string; end: string };
    minValue?: number;
    maxValue?: number;
    searchTerm?: string;
}

export interface SortState {
    field: SortField;
    order: SortOrder;
}

// ==============================
// CONSTANTS
// ==============================

export const PAYABLE_STATUS_CONFIG = {
    [PayableStatus.PENDING]: {
        label: 'Pendente',
        color: 'yellow',
        bgClass: 'bg-yellow-50',
        textClass: 'text-yellow-800',
        badgeClass: 'bg-yellow-100 text-yellow-800',
        icon: 'Clock',
    },
    [PayableStatus.PAID]: {
        label: 'Pago',
        color: 'green',
        bgClass: 'bg-green-50',
        textClass: 'text-green-800',
        badgeClass: 'bg-green-100 text-green-800',
        icon: 'CheckCircle',
    },
    [PayableStatus.OVERDUE]: {
        label: 'Atrasado',
        color: 'red',
        bgClass: 'bg-red-50',
        textClass: 'text-red-800',
        badgeClass: 'bg-red-100 text-red-800',
        icon: 'AlertTriangle',
    },
};

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;
export const REFRESH_INTERVAL = 30000; // 30 segundos

// ==============================
// CUSTOM HOOKS
// ==============================

'use client';

import { useMemo, useState, useEffect } from 'react';

export function usePayableSummary(payables: Payable[]) {
    return useMemo(() => {
        const now = new Date();

        const total = payables.reduce((acc, p) => acc + p.value, 0);
        const paid = payables
            .filter((p) => p.status === PayableStatus.PAID)
            .reduce((acc, p) => acc + p.value, 0);
        const pending = payables
            .filter((p) => p.status === PayableStatus.PENDING)
            .reduce((acc, p) => acc + p.value, 0);

        const overdue = payables
            .filter(
                (p) =>
                    p.status !== PayableStatus.PAID && new Date(p.dueDate) < now
            )
            .reduce((acc, p) => acc + p.value, 0);

        const overdueItems = payables.filter(
            (p) =>
                p.status !== PayableStatus.PAID && new Date(p.dueDate) < now
        );

        const daysOverdue = overdueItems.length > 0
            ? Math.max(
                ...overdueItems.map((p) =>
                    Math.ceil(
                        (now.getTime() - new Date(p.dueDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                )
            )
            : 0;

        return {
            total,
            paid,
            pending,
            overdue,
            daysOverdue,
        };
    }, [payables]);
}

export function usePayableFilters(payables: Payable[]) {
    const [filters, setFilters] = useState<FilterState>({});
    const [sort, setSort] = useState<SortState>({
        field: SortField.DUE_DATE,
        order: SortOrder.ASC,
    });
    const [pagination, setPagination] = useState<PaginationState>({
        page: 0,
        pageSize: DEFAULT_PAGE_SIZE,
        total: payables.length,
    });

    const filtered = useMemo(() => {
        let result = [...payables];

        if (filters.status) {
            result = result.filter((p) => p.status === filters.status);
        }

        if (filters.supplier) {
            result = result.filter((p) =>
                p.supplier.toLowerCase().includes(filters.supplier?.toLowerCase() ?? '')
            );
        }

        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            result = result.filter(
                (p) =>
                    p.supplier.toLowerCase().includes(term) ||
                    p.description.toLowerCase().includes(term) ||
                    p.invoiceNumber?.toLowerCase().includes(term)
            );
        }

        if (filters.dateRange) {
            const start = new Date(filters.dateRange.start);
            const end = new Date(filters.dateRange.end);
            result = result.filter((p) => {
                const dueDate = new Date(p.dueDate);
                return dueDate >= start && dueDate <= end;
            });
        }

        if (filters.minValue !== undefined) {
            result = result.filter((p) => p.value >= filters.minValue!);
        }

        if (filters.maxValue !== undefined) {
            result = result.filter((p) => p.value <= filters.maxValue!);
        }

        // Sort
        result.sort((a, b) => {
            let aVal: any = a[sort.field];
            let bVal: any = b[sort.field];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal as string).toLowerCase();
            }

            if (sort.order === SortOrder.ASC) {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });

        return result;
    }, [payables, filters, sort]);

    const paged = useMemo(() => {
        const start = pagination.page * pagination.pageSize;
        const end = start + pagination.pageSize;
        return filtered.slice(start, end);
    }, [filtered, pagination.page, pagination.pageSize]);

    return {
        filters,
        setFilters,
        sort,
        setSort,
        pagination,
        setPagination,
        filtered,
        paged,
    };
}

export function useDebounce<T>(value: T, delay: number = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function useAutoRefresh(callback: () => void, interval: number) {
    useEffect(() => {
        const timer = setInterval(callback, interval);
        return () => clearInterval(timer);
    }, [callback, interval]);
}

// ==============================
// UTILITY FUNCTIONS
// ==============================

export const formatCurrency = (value: number, locale = 'pt-BR') =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'BRL',
    }).format(value);

export const formatDate = (date: string, locale = 'pt-BR') =>
    new Date(date).toLocaleDateString(locale);

export const isOverdue = (dueDate: string, status: PayableStatus): boolean =>
    new Date(dueDate) < new Date() && status !== PayableStatus.PAID;

export const getDaysUntilDue = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ==============================
// COMPONENTS - Skeleton Loader
// ==============================

export function SkeletonLoader() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
            ))}
        </div>
    );
}

// ==============================
// COMPONENTS - Summary Card
// ==============================

import { motion } from 'framer-motion';
import React from 'react';
import {
    TrendingUp,
    Clock,
} from 'lucide-react';

interface SummaryCardProps {
    label: string;
    value: number;
    color: 'red' | 'yellow' | 'green' | 'blue';
    progress?: number;
    trend?: number;
    icon?: React.ComponentType<{ className?: string }>;
    subtitle?: string;
}

const CARD_CONFIG = {
    red: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100',
        border: 'border-red-200',
        text: 'text-red-900',
        accent: 'text-red-600',
        progressBar: 'bg-red-500',
    },
    yellow: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        accent: 'text-yellow-600',
        progressBar: 'bg-yellow-500',
    },
    green: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        border: 'border-green-200',
        text: 'text-green-900',
        accent: 'text-green-600',
        progressBar: 'bg-green-500',
    },
    blue: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-900',
        accent: 'text-blue-600',
        progressBar: 'bg-blue-500',
    },
};

export const SummaryCard = React.memo(
    ({ label, value, color, progress, trend, icon: Icon, subtitle }: SummaryCardProps) => {
        const config = CARD_CONFIG[color];

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
                className={`${config.bg} ${config.border} border-2 rounded-xl p-6 backdrop-blur-sm`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className={`text-sm font-semibold ${config.accent} uppercase tracking-wide`}>
                            {label}
                        </p>
                        <p className={`text-3xl font-bold ${config.text} mt-2`}>
                            {formatCurrency(value)}
                        </p>
                        {subtitle && (
                            <p className={`text-xs ${config.accent} mt-1`}>{subtitle}</p>
                        )}
                    </div>

                    {Icon && (
                        <Icon className={`w-12 h-12 ${config.accent} opacity-20`} />
                    )}
                </div>

                {progress !== undefined && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${config.accent}`}>
                                Progresso
                            </span>
                            <span className={`text-xs font-bold ${config.text}`}>
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-300 bg-opacity-30 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className={`${config.progressBar} h-full rounded-full shadow-lg`}
                            />
                        </div>
                    </div>
                )}

                {trend !== undefined && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend >= 0 ? (
                            <>
                                <TrendingUp className={`w-4 h-4 ${config.accent}`} />
                                <span className={`text-xs font-semibold ${config.accent}`}>
                                    +{trend}% vs. mês anterior
                                </span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className={`w-4 h-4 ${config.accent}`} />
                                <span className={`text-xs font-semibold ${config.accent}`}>
                                    {trend}% vs. mês anterior
                                </span>
                            </>
                        )}
                    </div>
                )}
            </motion.div>
        );
    }
);

SummaryCard.displayName = 'SummaryCard';

// ==============================
// COMPONENTS - Action Button
// ==============================

interface ActionButtonProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    tooltip?: string;
    size?: 'sm' | 'md' | 'lg';
}

const BUTTON_VARIANTS = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white',
    tertiary: 'bg-transparent border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700',
    danger: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white',
};

const BUTTON_SIZES = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
};

export const ActionButton = React.memo(
    ({
        icon: Icon,
        label,
        variant = 'primary',
        onClick,
        disabled = false,
        loading = false,
        tooltip,
        size = 'md',
    }: ActionButtonProps) => {
        return (
            <motion.button
                onClick={onClick}
                disabled={disabled || loading}
                whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
                whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
                className={`
          flex items-center gap-2 rounded-lg font-semibold transition-all duration-200
          ${BUTTON_VARIANTS[variant]}
          ${BUTTON_SIZES[size]}
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:shadow-xl active:shadow-md
        `}
                title={tooltip}
            >
                <Icon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                {label}
            </motion.button>
        );
    }
);

ActionButton.displayName = 'ActionButton';

// ==============================
// COMPONENTS - Filter Bar
// ==============================

import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onSearchChange: (term: string) => void;
    searchTerm: string;
}

export const FilterBar = React.memo(
    ({ filters, onFilterChange, onSearchChange, searchTerm }: FilterBarProps) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const debouncedSearch = useDebounce(searchTerm, 300);

        React.useEffect(() => {
            onFilterChange({ ...filters, searchTerm: debouncedSearch });
        }, [debouncedSearch]);

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 font-open_sans"
            >
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por fornecedor, descrição ou invoice..."
                            onChange={(e) => onSearchChange(e.target.value)}
                            value={searchTerm}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-gray-700 font-medium transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filtros
                    </motion.button>
                </div>

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200"
                    >
                        {/* Filter Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        status: e.target.value as PayableStatus || undefined,
                                    })
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Todos</option>
                                {Object.entries(PAYABLE_STATUS_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>
                                        {config.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Value Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Valor Mínimo
                            </label>
                            <input
                                type="number"
                                placeholder="R$ 0,00"
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        minValue: e.target.value ? parseFloat(e.target.value) : undefined,
                                    })
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Valor Máximo
                            </label>
                            <input
                                type="number"
                                placeholder="R$ 0,00"
                                onChange={(e) =>
                                    onFilterChange({
                                        ...filters,
                                        maxValue: e.target.value ? parseFloat(e.target.value) : undefined,
                                    })
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <motion.button
                                onClick={() => {
                                    onFilterChange({});
                                    onSearchChange('');
                                }}
                                whileHover={{ scale: 1.05 }}
                                className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Limpar
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        );
    }
);

FilterBar.displayName = 'FilterBar';

// ==============================
// COMPONENTS - Payables Table
// ==============================

interface PayablesTableProps {
    payables: Payable[];
    isLoading: boolean;
    onSort: (field: SortField) => void;
    sort: SortState;
    pagination: PaginationState;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export const PayablesTable = React.memo(
    ({
        payables,
        isLoading,
        onSort,
        sort,
        pagination,
        onPageChange,
        onPageSizeChange,
    }: PayablesTableProps) => {
        if (isLoading) {
            return <SkeletonLoader />;
        }

        if (payables.length === 0) {
            return (
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Nenhuma conta a pagar encontrada</p>
                    <p className="text-gray-400 text-sm mt-1">
                        Tente ajustar os filtros ou criar uma nova conta
                    </p>
                </div>
            );
        }

        const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
            <th className="px-6 py-3 text-left">
                <motion.button
                    onClick={() => onSort(field)}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                    {label}
                    {sort.field === field && (
                        <span>{sort.order === SortOrder.ASC ? '↑' : '↓'}</span>
                    )}
                </motion.button>
            </th>
        );

        return (
            <div className="space-y-4 font-poppins">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <SortableHeader field={SortField.SUPPLIER} label="Fornecedor" />
                                    <th className="px-6 py-3 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Descrição
                                        </span>
                                    </th>
                                    <SortableHeader field={SortField.VALUE} label="Valor" />
                                    <SortableHeader field={SortField.DUE_DATE} label="Vencimento" />
                                    <SortableHeader field={SortField.STATUS} label="Status" />
                                    <th className="px-6 py-3 text-left">
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Ações
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payables.map((item) => {
                                    const statusConfig = PAYABLE_STATUS_CONFIG[item.status];
                                    const overdueStatus = isOverdue(item.dueDate, item.status);
                                    const daysUntil = getDaysUntilDue(item.dueDate);

                                    return (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.01)' }}
                                            className={`${overdueStatus ? statusConfig.bgClass : ''
                                                } hover:bg-opacity-50 transition-colors`}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {item.supplier}
                                                </p>
                                                {item.invoiceNumber && (
                                                    <p className="text-xs text-gray-500">NF: {item.invoiceNumber}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {formatCurrency(item.value)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    <p>{formatDate(item.dueDate)}</p>
                                                    {item.status !== PayableStatus.PAID && (
                                                        <p
                                                            className={`text-xs mt-1 font-semibold ${daysUntil < 0
                                                                ? 'text-red-600'
                                                                : daysUntil < 7
                                                                    ? 'text-yellow-600'
                                                                    : 'text-green-600'
                                                                }`}
                                                        >
                                                            {daysUntil < 0
                                                                ? `${Math.abs(daysUntil)} dias atrasado`
                                                                : `Vence em ${daysUntil} dias`}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.badgeClass}`}
                                                >
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        ✎
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Deletar"
                                                    >
                                                        ✕
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                            Mostrando <span className="font-semibold">{payables.length}</span> de{' '}
                            <span className="font-semibold">{pagination.total}</span> registros
                        </span>

                        <select
                            value={pagination.pageSize}
                            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                    {size} por página
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <motion.button
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 0}
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            ← Anterior
                        </motion.button>

                        <div className="flex items-center gap-1">
                            {Array.from(
                                { length: Math.ceil(pagination.total / pagination.pageSize) },
                                (_, i) => i
                            )
                                .slice(
                                    Math.max(0, pagination.page - 2),
                                    Math.min(
                                        Math.ceil(pagination.total / pagination.pageSize),
                                        pagination.page + 3
                                    )
                                )
                                .map((page) => (
                                    <motion.button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        whileHover={{ scale: 1.05 }}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pagination.page === page
                                            ? 'bg-red-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page + 1}
                                    </motion.button>
                                ))}
                        </div>

                        <motion.button
                            onClick={() =>
                                onPageChange(
                                    Math.min(
                                        pagination.page + 1,
                                        Math.ceil(pagination.total / pagination.pageSize) - 1
                                    )
                                )
                            }
                            disabled={
                                pagination.page >=
                                Math.ceil(pagination.total / pagination.pageSize) - 1
                            }
                            whileHover={{ scale: 1.05 }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Próximo →
                        </motion.button>
                    </div>
                </div>
            </div>
        );
    }
);

PayablesTable.displayName = 'PayablesTable';

// ==============================
// MAIN COMPONENT
// ==============================

import { FileText, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TAX_EXPENSES } from '../../../graphql/queries/suppliers';
import { useAuth } from '../../../contexts/AuthContext';

export function AccountsPayableDashboard() {
    const navigate = useNavigate();
    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const { data, loading: queryLoading, refetch } = useQuery(GET_TAX_EXPENSES, {
        fetchPolicy: 'cache-and-network',
        skip: authLoading || !isAuthenticated || !user?.id,
    });

    const [searchTerm, setSearchTerm] = React.useState('');

    const payables = React.useMemo(
        () => data?.taxExpenses ?? [],
        [data?.taxExpenses]
    );

    const summary = usePayableSummary(payables);
    const filterState = usePayableFilters(payables);
    const paidPercentage = summary.total > 0
        ? Math.round((summary.paid / summary.total) * 100)
        : 0;

    useAutoRefresh(() => refetch(), REFRESH_INTERVAL);

    if (authLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
            >
                <div className="inline-block w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Carregando autenticação...</p>
            </motion.div>
        );
    }

    if (!isAuthenticated || !user?.id) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl text-center"
            >
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-yellow-800 mb-2">Autenticação Necessária</h2>
                <p className="text-yellow-700 text-sm">
                    Você precisa estar autenticado para acessar as contas a pagar.
                </p>
                <motion.button
                    onClick={() => navigate('/login')}
                    whileHover={{ scale: 1.05 }}
                    className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
                >
                    Ir para Login
                </motion.button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-poppins text-gray-900 mb-2"
                    >
                        Contas a Pagar
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-600 text-lg font-open_sans"
                    >
                        Gestão inteligente de fornecedores e fluxo de caixa
                    </motion.p>
                </div>

                <motion.button
                    onClick={() => refetch()}
                    disabled={queryLoading}
                    whileHover={{ rotate: queryLoading ? 0 : 90 }}
                    className="p-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-open_sans"
                    title="Atualizar dados"
                >
                    <RefreshCw className={`w-6 h-6 text-gray-600 ${queryLoading ? 'animate-spin' : ''}`} />
                </motion.button>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-3"
            >
                <ActionButton
                    icon={FileText}
                    label="Criar Conta"
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/app/fiscal/payables/create')}
                />
                <ActionButton
                    icon={TrendingDown}
                    label="Ver Todas"
                    variant="secondary"
                    size="md"
                    onClick={() => navigate('/app/fiscal/payables/list')}
                />
                <ActionButton
                    icon={FileText}
                    label="Exportar"
                    variant="tertiary"
                    size="md"
                    onClick={() => console.log('Exportar dados')}
                />
            </motion.div>

            {/* Summary Cards */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                    },
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <SummaryCard
                        label="Total do mês"
                        value={summary.total}
                        color="red"
                        icon={AlertCircle}
                        trend={12}
                    />
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <SummaryCard
                        label="Pendentes"
                        value={summary.pending}
                        color="yellow"
                        progress={100 - paidPercentage}
                        icon={Clock}
                        subtitle={`${100 - paidPercentage}% do total`}
                    />
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <SummaryCard
                        label="Pagos"
                        value={summary.paid}
                        color="green"
                        progress={paidPercentage}
                        trend={8}
                        subtitle={`${paidPercentage}% do total`}
                    />
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                    <SummaryCard
                        label="Atrasados"
                        value={summary.overdue}
                        color="red"
                        subtitle={`${summary.daysOverdue} dias`}
                        trend={-5}
                    />
                </motion.div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <FilterBar
                    filters={filterState.filters}
                    onFilterChange={filterState.setFilters}
                    onSearchChange={setSearchTerm}
                    searchTerm={searchTerm}
                />
            </motion.div>

            {/* Payables Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <PayablesTable
                    payables={filterState.paged}
                    isLoading={queryLoading && payables.length === 0}
                    onSort={(field) =>
                        filterState.setSort({
                            field,
                            order:
                                filterState.sort.field === field &&
                                    filterState.sort.order === SortOrder.ASC
                                    ? SortOrder.DESC
                                    : SortOrder.ASC,
                        })
                    }
                    sort={filterState.sort}
                    pagination={{
                        ...filterState.pagination,
                        total: filterState.filtered.length,
                    }}
                    onPageChange={(page) =>
                        filterState.setPagination({ ...filterState.pagination, page })
                    }
                    onPageSizeChange={(pageSize) =>
                        filterState.setPagination({
                            ...filterState.pagination,
                            pageSize,
                            page: 0,
                        })
                    }
                />
            </motion.div>
        </motion.div>
    );
}

export default AccountsPayableDashboard;