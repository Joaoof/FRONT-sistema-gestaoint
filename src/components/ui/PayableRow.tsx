// components/PayableRow.tsx
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Payable } from '../../types';
import { StatusBadge } from '../ui/Badge';

interface PayableRowProps {
    payable: Payable;
    onClick: () => void;
}

export function PayableRow({ payable, onClick }: PayableRowProps) {
    return (
        <tr
            onClick={onClick}
            className="hover:bg-gray-50 cursor-pointer transition-colors"
        >
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payable.supplierName}</td>
            <td className="px-6 py-4 text-sm text-gray-700">{payable.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                {formatCurrency(payable.value)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(payable.dueDate)}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={payable.status} />
            </td>
        </tr>
    );
}