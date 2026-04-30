// components/PayableCard.tsx
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Payable } from '../../types';
import { StatusBadge } from '../ui/Badge';

export function PayableCard({ payable, onClick }: { payable: Payable; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="p-4 border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:bg-slate-950 cursor-pointer transition-colors"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{payable.supplierName}</h3>
                <StatusBadge status={payable.status} />
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-200 mb-2">{payable.description}</p>
            <div className="flex justify-between text-sm">
                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(payable.value)}</span>
                <span className="text-gray-500 dark:text-slate-400">{formatDate(payable.dueDate)}</span>
            </div>
        </div>
    );
}