import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  color: 'green' | 'red' | 'blue' | 'teal' | 'orange';
  icon: string;
  isCount?: boolean;
}

export function MetricCard({ title, value, color, icon, isCount = false }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500'
  };

  const formatValue = (val: number) => {
    if (isCount) {
      return val.toString();
    }
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 text-white relative overflow-hidden`}>
      <div className="relative z-10">
        <p className="text-xs font-medium opacity-90 mb-1 leading-tight">{title}</p>
        <p className="text-lg lg:text-xl font-bold">
          {formatValue(value)}
        </p>
      </div>
      <div className="absolute top-2 right-2 text-white opacity-60">
        <span className="text-sm">{icon}</span>
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 lg:w-16 lg:h-16 bg-white bg-opacity-10 rounded-full"></div>
    </div>
  );
}