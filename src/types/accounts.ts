export type AccountStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';

export interface AccountProductImage {
    id: string;
    url: string;
    isPrimary: boolean;
    order: number;
}

export interface AccountProduct {
    id: string;
    nameProduct: string;
    sku?: string | null;
    unit: string;
    costPrice: number;
    salePrice: number;
    quantity: number;
    description?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
    images: AccountProductImage[];
}

export interface AccountCustomer {
    id: string;
    name: string;
    document?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
}

export interface AccountSupplier {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
}

export interface AccountReceivableData {
    id: string;
    customerId: string;
    productId?: string | null;
    description: string;
    amount: number;
    interestRate: number;
    dueDate: string;
    paidAt?: string | null;
    status: AccountStatus;
    notes?: string | null;
    finalAmount: number;
    interestAccrued: number;
    daysOverdue: number;
    createdAt: string;
    updatedAt: string;
    customer?: AccountCustomer | null;
    product?: AccountProduct | null;
}

export interface AccountPayableData {
    id: string;
    supplierId?: string | null;
    productId?: string | null;
    supplierName: string;
    description: string;
    amount: number;
    interestRate: number;
    dueDate: string;
    paidAt?: string | null;
    status: AccountStatus;
    notes?: string | null;
    finalAmount: number;
    interestAccrued: number;
    daysOverdue: number;
    createdAt: string;
    updatedAt: string;
    supplier?: AccountSupplier | null;
    product?: AccountProduct | null;
}

export interface AccountSummary {
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    countTotal: number;
}

export const STATUS_LABEL: Record<AccountStatus, string> = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    OVERDUE: 'Vencido',
    CANCELED: 'Cancelado',
};

export const STATUS_BADGE: Record<AccountStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELED: 'bg-slate-100 text-slate-700',
};

export function formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function formatDate(value: string | Date): string {
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toLocaleDateString('pt-BR');
}
