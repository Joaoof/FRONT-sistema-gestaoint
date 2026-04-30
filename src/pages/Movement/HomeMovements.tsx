import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Tipos
type MovementType = 'venda' | 'troco' | 'outros' | 'despesa' | 'retirada' | 'pagamento';

export type Movement = {
    id: string;
    value: number;
    description: string;
    type: MovementType;
    date: string;
};

// Dados mockados (substitua com GraphQL depois)
const mockMovements: Movement[] = [
    { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', date: '2025-04-05T10:30' },
    { id: '2', value: 50, description: 'Troco de cliente', type: 'troco', date: '2025-04-05T11:15' },
    { id: '3', value: 200, description: 'Pagamento de energia', type: 'despesa', date: '2025-04-05T09:00' },
    { id: '4', value: 300, description: 'Retirada de sócio', type: 'retirada', date: '2025-04-04T17:00' },
];

export function HomeMovement() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];

    // Filtro por data
    const [filterDate, setFilterDate] = useState<string>(today);

    // Filtra movimentações pela data
    const filteredMovements = mockMovements.filter(m =>
        m.date.startsWith(filterDate)
    );

    // Calcula resumo
    const entradas = filteredMovements
        .filter(m => ['venda', 'troco', 'outros'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saidas = filteredMovements
        .filter(m => ['despesa', 'retirada', 'pagamento'].includes(m.type))
        .reduce((sum, m) => sum + m.value, 0);

    const saldo = entradas - saidas;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white mb-2">Controle de Caixa</h1>
                <p className="text-gray-700 dark:text-slate-200 text-[13px]">Sistema de movimentações financeiras</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/movimentacoes')}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Nova Entrada
                </button>
                <button
                    onClick={() => navigate('/movimentacoes-saida')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <ArrowDownCircle className="w-5 h-5" />
                    Nova Saída
                </button>
            </div>

            {/* KPIs do dia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-emerald-500 opacity-70" aria-hidden />
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">Entradas do dia</span>
                    </div>
                    <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">R$ {entradas.toFixed(2)}</p>
                </div>
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <span className="absolute inset-x-0 top-0 h-[2px] bg-rose-500 opacity-70" aria-hidden />
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20 flex items-center justify-center">
                            <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">Saídas do dia</span>
                    </div>
                    <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">R$ {saidas.toFixed(2)}</p>
                </div>
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <span className={`absolute inset-x-0 top-0 h-[2px] ${saldo >= 0 ? 'bg-sky-500' : 'bg-rose-500'} opacity-70`} aria-hidden />
                    <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-md flex items-center justify-center ring-1 ${
                            saldo >= 0
                                ? 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20'
                                : 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
                        }`}>
                            <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">Saldo final</span>
                    </div>
                    <p className={`mt-2.5 text-[24px] font-semibold leading-none tabular-nums tracking-tight ${
                        saldo >= 0 ? 'text-sky-700 dark:text-sky-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>R$ {saldo.toFixed(2)}</p>
                </div>
            </div>

            {/* Filtro de data */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-200">Filtrar por data</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-white/15 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Lista de movimentações */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Movimentações de {new Date(filterDate).toLocaleDateString('pt-BR')}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredMovements.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-slate-400">Nenhuma movimentação encontrada para esta data.</div>
                    ) : (
                        filteredMovements.map((m) => (
                            <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:bg-slate-950">
                                <div className="flex items-center space-x-3">
                                    <span className={`w-2 h-2 rounded-full ${['venda', 'troco', 'outros'].includes(m.type) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(m.date).toLocaleTimeString('pt-BR')}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-semibold ${['venda', 'troco', 'outros'].includes(m.type) ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {['venda', 'troco', 'outros'].includes(m.type) ? '+' : '-'} R$ {m.value.toFixed(2)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}