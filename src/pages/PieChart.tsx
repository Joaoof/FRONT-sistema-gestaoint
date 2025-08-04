import React from 'react';

interface PieChartData {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartData[];
}

export function PieChart({ data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <p className="text-xs">Nenhum dado disponível</p>
      </div>
    );
  }

  const colors = [
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#f59e0b', // Amarelo
    '#ef4444', // Vermelho
    '#8b5cf6', // Roxo
    '#06b6d4', // Cyan
    '#84cc16', // Lima
    '#f97316'  // Laranja
  ];

  let cumulativePercentage = 0;
  const radius = 50;
  const centerX = 70;
  const centerY = 70;

  const pathData = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage * 360) / 100;
    const endAngle = ((cumulativePercentage + percentage) * 360) / 100;
    
    cumulativePercentage += percentage;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = percentage > 50 ? 1 : 0;

    const pathD = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    return {
      pathD,
      color: colors[index % colors.length],
      percentage: percentage.toFixed(0),
      name: item.name,
      value: item.value
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="mb-3">
        {pathData.map((segment, index) => (
          <path
            key={index}
            d={segment.pathD}
            fill={segment.color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>
      
      <div className="space-y-1 w-full">
        {pathData.slice(0, 5).map((segment, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div 
                className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-gray-600 truncate">{segment.name}</span>
            </div>
            <span className="font-medium text-gray-900 ml-2">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}