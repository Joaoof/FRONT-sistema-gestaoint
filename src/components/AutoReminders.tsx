// src/components/AutoReminders.tsx
import { useEffect } from 'react';
import { Clock } from 'lucide-react';

interface AutoRemindersProps {
    receivables: Array<{ id: string; clientName: string; description: string; dueDate: string; status: string }>;
    payables: Array<{ id: string; supplierName: string; description: string; dueDate: string; status: string }>;
}

export function AutoReminders({ receivables, payables }: AutoRemindersProps) {
    useEffect(() => {
        const now = new Date();
        const reminders = [] as any;

        // Verifica contas a vencer em 3 dias
        const soon = new Date(now);
        soon.setDate(soon.getDate() + 3);

        receivables.forEach(r => {
            const due = new Date(r.dueDate);
            if (r.status === 'pendente' && due <= soon && due >= now) {
                reminders.push(`Receber de ${r.clientName}: ${r.description}`);
            }
        });

        payables.forEach(p => {
            const due = new Date(p.dueDate);
            if (p.status === 'pendente' && due <= soon && due >= now) {
                reminders.push(`Pagar para ${p.supplierName}: ${p.description}`);
            }
        });

        if (reminders.length > 0) {
            console.log('Lembretes:', reminders);
            // Aqui você pode disparar um toast ou notificação
        }
    }, [receivables, payables]);

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-yellow-800 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Lembretes
            </h3>
            <p className="text-sm text-yellow-700 mt-1">Verificando vencimentos nos próximos 3 dias...</p>
        </div>
    );
}