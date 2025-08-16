import { useState } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    TrendingUp,
    TrendingDown,
    Download,
    AlertTriangle,
    Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Recharts
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    AreaChart,
    Area,
    ResponsiveContainer,
} from 'recharts';

type Movement = {
    id: string;
    value: number;
    description: string;
    type: 'venda' | 'troco' | 'outros' | 'despesa' | 'retirada' | 'pagamento';
    date: string;
};

// Dados mockados
const mockMovements: Movement[] = [
    { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', date: '2025-04-05T10:30' },
    { id: '2', value: 50, description: 'Troco de cliente', type: 'troco', date: '2025-04-05T11:15' },
    { id: '3', value: 200, description: 'Pagamento de energia', type: 'despesa', date: '2025-04-05T09:00' },
    { id: '4', value: 300, description: 'Retirada de sócio', type: 'retirada', date: '2025-04-04T17:00' },
    { id: '5', value: 80, description: 'Compra de insumos', type: 'despesa', date: '2025-04-04T14:20' },
    { id: '6', value: 700, description: 'Venda no almoço', type: 'venda', date: '2025-04-04T12:30' },
    { id: '7', value: 100, description: 'Despesa com transporte', type: 'despesa', date: '2025-04-03T10:00' },
    { id: '8', value: 400, description: 'Venda final de semana', type: 'venda', date: '2025-04-06T16:00' },
    { id: '9', value: 1200, description: 'Venda de eletrônicos', type: 'venda', date: '2025-04-05T15:45' },
    { id: '10', value: 90, description: 'Material de escritório', type: 'despesa', date: '2025-04-03T16:00' },
];

// Dados mensais (simulação: últimos 7 dias)
const monthlyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toISOString().split('T')[0];

    const dayMovements = mockMovements.filter((m) => m.date.startsWith(dayStr));
    const entradasDia = dayMovements
        .filter((m) => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);
    const saidasDia = dayMovements
        .filter((m) => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    return {
        day: i + 1,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo: entradasDia - saidasDia,
    };
});

// Paleta de cores
const COLORS = {
    entrada: '#22c55e',
    saida: '#ef4444',
    venda: '#6366f1',
    despesa: '#f97316',
    troco: '#10b981',
    retirada: '#ec4899',
    outros: '#8b5cf6',
};

// Produtos simulados (para ranking)
const mockProducts = [
    { name: 'Produto A', revenue: 1500 },
    { name: 'Produto B', revenue: 1200 },
    { name: 'Produto C', revenue: 700 },
    { name: 'Produto D', revenue: 400 },
];

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);

    // Filtra movimentações pela data
    const filteredMovements = mockMovements.filter((m) => m.date.startsWith(filterDate));
    const allVendas = mockMovements.filter((m) => m.type === 'venda');

    // Calcula resumo do dia
    const entradas = filteredMovements
        .filter((m) => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saidas = filteredMovements
        .filter((m) => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saldo = entradas - saidas;

    const totalMes = 15000;
    const [metaMensal, setMetaMensal] = useState<number>(20000); // Meta inicial
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(metaMensal.toFixed(2));

    // Função para iniciar edição
    const handleEdit = () => {
        setInputValue(metaMensal.toFixed(2));
        setIsEditing(true);
    };

    // Função para salvar
    const handleSave = () => {
        const value = parseFloat(inputValue);
        if (!isNaN(value) && value > 0) {
            setMetaMensal(value);
        } else {
            setInputValue(metaMensal.toFixed(2)); // Reverte se inválido
        }
        setIsEditing(false);
    };

    // ===== 1️⃣ KPIs de Performance =====
    const margemLucro = entradas > 0 ? ((saldo / entradas) * 100).toFixed(1) : '0.0';
    const ticketMedio = allVendas.length > 0 ? (allVendas.reduce((sum, v) => sum + v.value, 0) / allVendas.length).toFixed(2) : '0.00';

    // Crescimento diário (simulado)
    const crescimentoDiario = '+12.5%';

    // ===== 2️⃣ Previsão de Caixa =====
    const forecastData = Array.from({ length: 14 }, (_, i) => {
        return {
            day: i + 1,
            saldo: Math.max(0, 1000 + i * 50 + (Math.random() - 0.5) * 150), // crescimento leve com ruído
        };
    });

    // ===== 3️⃣ Heatmap por Hora (simulado) =====
    // Heatmap por Hora (0h até 23h)
    const heatmapData = Array.from({ length: 24 }, (_, hour) => {
        // Pico no almoço (12h-14h) e final de tarde (17h-19h)
        const base = 50;
        const picoAlmoco = hour >= 12 && hour <= 14 ? 100 : 0;
        const picoTarde = hour >= 17 && hour <= 19 ? 80 : 0;
        return {
            hour,
            value: base + picoAlmoco + picoTarde + Math.random() * 30,
        };
    });

    // ===== 4️⃣ Ranking de Produtos =====
    const topProducts = mockProducts.slice(0, 3).map(p => ({
        name: p.name,
        value: p.revenue,
    }));

    // ===== 5️⃣ Alertas =====
    const hasAlert = saldo < 0;

    // ===== 8️⃣ Insights Inteligentes =====
    const insights = [
        "Despesa com transporte subiu 45% esta semana.",
        "Ticket médio aumentou 12% vs semana passada.",
        "Horário de pico: 12h-14h e 17h-19h.",
    ];

    // Função de exportação
    const handleExport = () => {
        const csv = [
            ['Data', 'Descrição', 'Tipo', 'Valor'],
            ...filteredMovements.map(m => [m.date, m.description, m.type, m.value]),
        ]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${filterDate}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-serif text-gray-900 mb-2">Dashboard de Movimentações</h1>
                <p className="text-gray-600 font-light">Controle completo de entradas e saídas do caixa</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/formulario-movimentacao')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Nova Entrada
                </button>
                <button
                    onClick={() => navigate('/historico-movimentacao')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                >
                    <ArrowDownCircle className="w-5 h-5" />
                    Histórico de Saídas
                </button>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-sm"
                >
                    <Download className="w-5 h-5" />
                    Exportar CSV
                </button>
            </div>

            {/* Filtro de data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por data:</label>
                    <div className="relative flex-1 max-w-md">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* KPIs de Performance */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white border-l-4 border-green-500 rounded-lg p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
                    <p className="text-2xl font-bold text-gray-900">{margemLucro}%</p>
                    <TrendingUp className="w-5 h-5 text-green-600 inline mt-1" />{' '}
                    <span className="text-sm text-green-600">+3.2%</span>
                </div>

                <div className="bg-white border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-900">R$ {ticketMedio}</p>
                    <TrendingUp className="w-5 h-5 text-green-600 inline mt-1" />{' '}
                    <span className="text-sm text-green-600">+12%</span>
                </div>

                <div className="bg-white border-l-4 border-purple-500 rounded-lg p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-600">Crescimento Diário</p>
                    <p className="text-2xl font-bold text-gray-900">{crescimentoDiario}</p>
                    <TrendingUp className="w-5 h-5 text-green-600 inline mt-1" />
                </div>

                <div className="bg-white border-l-4 border-orange-500 rounded-lg p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-600">Total Vendas</p>
                    <p className="text-2xl font-bold text-gray-900">{allVendas.length}</p>
                    <TrendingUp className="w-5 h-5 text-green-600 inline mt-1" />{' '}
                    <span className="text-sm text-green-600">+5</span>
                </div>

                <div className="bg-white border-l-4 border-red-500 rounded-lg p-6 shadow-sm relative">
                    {hasAlert && (
                        <AlertTriangle className="w-5 h-5 text-red-500 absolute top-2 right-2" />
                    )}
                    <p className="text-sm font-medium text-gray-600">Alertas</p>
                    <p className="text-2xl font-bold text-gray-900">{hasAlert ? '1' : '0'}</p>
                    <span className="text-xs text-red-500">{hasAlert ? 'Saldo negativo' : 'Tudo OK'}</span>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">Entradas do Dia</p>
                            <p className="text-xl font-bold text-green-900">R$ {entradas.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600 opacity-70" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-800">Saídas do Dia</p>
                            <p className="text-xl font-bold text-red-900">R$ {saidas.toFixed(2)}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-600 opacity-70" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Saldo do Dia</p>
                            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                                R$ {saldo.toFixed(2)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-600 opacity-70" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-800">Total do Mês</p>
                            <p className="text-xl font-bold text-purple-900">R$ {totalMes.toFixed(2)}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-600 opacity-70" />
                    </div>
                </div>
            </div>

            {/* Painel de Meta */}
            {/* Painel de Meta Editável */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Meta de Faturamento Mensal</h3>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Editar
                        </button>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 mb-4">
                    {isEditing ? (
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                step="100"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleSave}
                                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                                autoFocus
                                className="px-3 py-1 border border-blue-300 rounded text-sm w-32 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500">R$/mês</span>
                        </div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900">R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                        className={`h-2.5 rounded-full ${totalMes >= metaMensal
                            ? 'bg-green-500'
                            : totalMes / metaMensal >= 0.7
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                        style={{ width: `${Math.min((totalMes / metaMensal) * 100, 100)}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-600">
                    R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de{' '}
                    R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                    ({((totalMes / metaMensal) * 100).toFixed(1)}%)
                </p>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Previsão de Caixa */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Previsão de Caixa (14 dias)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Area
                                type="monotone"
                                dataKey="saldo"
                                stroke="#8b5cf6"
                                fill="url(#colorForecast)"
                                name="Saldo Previsto"
                            />
                            <defs>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Heatmap por Hora */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Heatmap de Vendas por Hora</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmapData}>
                            <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}h`} />
                            <YAxis hide />
                            <Tooltip formatter={(value: number) => [`${value} vendas`, 'Volume']} />
                            <Bar
                                dataKey="value"
                                fill="#059669"
                                radius={[4, 4, 0, 0]}
                                background={{ fill: '#f3f4f6' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Ranking de Produtos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Produtos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={topProducts} margin={{ left: 80 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Insights Inteligentes</h3>
                    <ul className="space-y-3 text-sm text-blue-800">
                        {insights.map((text, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 mt-0.5 text-blue-600" />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Gráficos existentes (Entradas/Saídas, Evolução, etc.) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Entradas vs Saídas</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: 'Hoje', entradas, saidas }]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="entradas" fill={COLORS.entrada} name="Entradas" />
                            <Bar dataKey="saidas" fill={COLORS.saida} name="Saídas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução Diária</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="entradas" stroke={COLORS.entrada} name="Entradas" />
                            <Line type="monotone" dataKey="saidas" stroke={COLORS.saida} name="Saídas" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Histórico */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredMovements.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Nenhuma movimentação registrada nesta data.</div>
                    ) : (
                        filteredMovements.map((m) => (
                            <div
                                key={m.id}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <span
                                        className={`w-3 h-3 rounded-full ${['venda', 'troco', 'outros'].includes(m.type) ? 'bg-green-500' : 'bg-red-500'}`}
                                    ></span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{m.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(m.date).toLocaleTimeString('pt-BR')}</p>
                                    </div>
                                </div>
                                <p
                                    className={`text-sm font-semibold ${['venda', 'troco', 'outros'].includes(m.type) ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {['venda', 'troco', 'outros'].includes(m.type) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                    <button
                        onClick={() => navigate('/historico')}
                        className="text-blue-600 hover:underline text-sm font-medium"
                    >
                        Ver todo histórico
                    </button>
                </div>
            </div>
        </div>
    );
}