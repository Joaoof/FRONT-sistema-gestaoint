import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { MY_AI_CREDIT_ACCOUNT } from '../../graphql/queries/ai-credits';

interface Account {
    balance: number;
    isLow: boolean;
    isEmpty: boolean;
    lowThreshold: number;
}

export function CreditsBadge() {
    const navigate = useNavigate();
    const { data } = useQuery<{ myAiCreditAccount: Account }>(MY_AI_CREDIT_ACCOUNT, {
        fetchPolicy: 'cache-and-network',
        pollInterval: 60000,
    });

    const acc = data?.myAiCreditAccount;
    if (!acc) return null;

    const color = acc.isEmpty
        ? 'bg-rose-100 text-rose-700 border-rose-300'
        : acc.isLow
        ? 'bg-amber-100 text-amber-700 border-amber-300'
        : 'bg-violet-50 text-violet-700 border-violet-200';

    return (
        <button
            onClick={() => navigate('/ia?tab=credits')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] font-medium border transition-colors ${color} hover:brightness-95`}
            title={acc.isLow ? 'Saldo baixo — clique pra comprar mais' : 'Saldo de créditos da IA'}
        >
            {acc.isLow || acc.isEmpty ? (
                <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
                <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="tabular-nums">{acc.balance}</span>
            <span className="text-[10.5px] opacity-75 uppercase tracking-wider">cr</span>
            {(acc.isLow || acc.isEmpty) && (
                <span className="text-[10px] font-bold ml-1">
                    {acc.isEmpty ? 'comprar!' : 'baixo'}
                </span>
            )}
        </button>
    );
}
