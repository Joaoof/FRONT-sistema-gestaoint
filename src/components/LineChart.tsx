import React from 'react';

interface LineChartData {
  name: string;
  receita: number;
  despesas: number;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
}

export function LineChart({ data, height = 200 }: LineChartProps) {
  const maxValue = Math.max(
    ...data.flatMap(d => [d.receita, d.despesas]),
    1000 // Valor mínimo para evitar divisão por zero
  );
  
  const chartHeight = height;
  const chartWidth = 100; // Usar porcentagem
  const padding = { top: 10, right: 10, bottom: 25, left: 30 };
  
  const getX = (index: number) => 
    padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  
  const getY = (value: number) => 
    chartHeight - padding.bottom - (value / maxValue) * (chartHeight - padding.top - padding.bottom);

  const revenuePoints = data.map((d, i) => `${getX(i)},${getY(d.receita)}`).join(' ');
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.despesas)}`).join(' ');

  // Create area path for revenue
  const revenueAreaPoints = `${padding.left},${chartHeight - padding.bottom} ${revenuePoints} ${chartWidth - padding.right},${chartHeight - padding.bottom}`;

  return (
    <div className="w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <line
            key={ratio}
            x1={padding.left}
            y1={getY(maxValue * ratio)}
            x2={chartWidth - padding.right}
            y2={getY(maxValue * ratio)}
            stroke="#f3f4f6"
            strokeWidth="0.5"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={chartHeight - padding.bottom + 12}
            textAnchor="middle"
            className="text-xs fill-gray-500"
            fontSize="8"
          >
            {d.name}
          </text>
        ))}

        {/* Revenue area */}
        <polygon
          points={revenueAreaPoints}
          fill="url(#revenueGradient)"
          opacity="0.3"
        />

        {/* Revenue line */}
        <polyline
          points={revenuePoints}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Expense line */}
        <polyline
          points={expensePoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(d.receita)}
              r="2"
              fill="#8b5cf6"
            />
            <circle
              cx={getX(i)}
              cy={getY(d.despesas)}
              r="2"
              fill="#3b82f6"
            />
          </g>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}