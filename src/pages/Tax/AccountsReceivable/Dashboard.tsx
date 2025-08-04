import { DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccountsReceivableDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Contas a Receber</h1>
                <p className="text-gray-600">Gestão de recebíveis: clientes, vencimentos e pagamentos</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/app/fiscal/receivables/create')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <DollarSign className="w-5 h-5" />
                    Nova Conta a Receber
                </button>
                <button
                    onClick={() => navigate('/app/fiscal/receivables/list')}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    <TrendingUp className="w-5 h-5" />
                    Ver Todas
                </button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-blue-800">Total a Receber</p>
                    <p className="text-2xl font-bold text-blue-900">R$ 12.500,00</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-yellow-800">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-900">R$ 8.200,00</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-green-800">Pagos</p>
                    <p className="text-2xl font-bold text-green-900">R$ 4.300,00</p>
                </div>
            </div>

            {/* Últimas contas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Contas Cadastradas</h2>
                <p className="text-gray-500">Em breve listagem dinâmica</p>
            </div>
        </div>
    );
}