import { FileText, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccountsPayableDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-['Rajdhani'] text-gray-900 mb-2">Contas a Pagar</h1>
                <p className="text-gray-600">Gestão de fornecedores, despesas e pagamentos</p>
            </div>

            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => navigate('/app/fiscal/payables/create')}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <FileText className="w-5 h-5" />
                    Nova Conta a Pagar
                </button>
                <button
                    onClick={() => navigate('/listar-contas-pagas')}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    <TrendingDown className="w-5 h-5" />
                    Ver Todas
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-red-800">Total a Pagar</p>
                    <p className="text-2xl font-bold text-red-900">R$ 7.800,00</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-yellow-800">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-900">R$ 5.200,00</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-green-800">Pagos</p>
                    <p className="text-2xl font-bold text-green-900">R$ 2.600,00</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Contas a Pagar</h2>
                <p className="text-gray-500">Em breve listagem dinâmica</p>
            </div>
        </div>
    );
}