import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface BadgeProps {
  status: 'pendente' | 'pago' | 'vencido';
}

export function StatusBadge({ status }: any) {
  const config = {
    pago: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    vencido: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
  };

  const { bg, text, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status === 'pago' ? 'Pago' : status === 'pendente' ? 'Pendente' : 'Vencido'}
    </span>
  );
}