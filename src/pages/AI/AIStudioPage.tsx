import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
    Brain,
    MessageCircle,
    Sparkles,
    Wrench,
    Wallet,
    UserCog,
    BookOpen,
} from 'lucide-react';
import { ChatTab } from './tabs/ChatTab';
import { InsightsTab } from './tabs/InsightsTab';
import { CapabilitiesTab } from './tabs/CapabilitiesTab';
import { HowToUseTab } from './tabs/HowToUseTab';
import { AiCreditsPage } from '../AiCredits/AiCreditsPage';
import { AIAgentPage } from './AIAgentPage';
import { MY_AI_CREDIT_ACCOUNT } from '../../graphql/queries/ai-credits';

type Tab = 'chat' | 'credits' | 'insights' | 'capabilities' | 'agent' | 'howto';

const TABS: { id: Tab; label: string; icon: any; description: string }[] = [
    { id: 'chat', label: 'Conversar', icon: MessageCircle, description: 'Chat com a IA — perguntas, análises e ações' },
    { id: 'insights', label: 'Insights', icon: Sparkles, description: 'Resumos automáticos e análises da IA' },
    { id: 'credits', label: 'Créditos', icon: Wallet, description: 'Saldo, pacotes e histórico de compra' },
    { id: 'capabilities', label: 'Capacidades', icon: Wrench, description: 'Tudo que a IA sabe fazer' },
    { id: 'agent', label: 'Personalidade', icon: UserCog, description: 'Configurar o agente de atendimento' },
    { id: 'howto', label: 'Como usar', icon: BookOpen, description: 'Vantagens e exemplos de perguntas' },
];

interface Account {
    balance: number;
    isLow: boolean;
    isEmpty: boolean;
}

export function AIStudioPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialTab = ((): Tab => {
        const params = new URLSearchParams(location.search);
        const t = params.get('tab');
        return (TABS.some((x) => x.id === t) ? (t as Tab) : 'chat');
    })();

    const [tab, setTab] = useState<Tab>(initialTab);

    // Sincroniza com a URL (sem reload)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('tab') !== tab) {
            params.set('tab', tab);
            navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
        }
    }, [tab]);

    const { data: accData } = useQuery<{ myAiCreditAccount: Account }>(MY_AI_CREDIT_ACCOUNT, {
        fetchPolicy: 'cache-and-network',
        pollInterval: 60000,
    });
    const account = accData?.myAiCreditAccount;

    const balancePill = account ? (
        <button
            onClick={() => setTab('credits')}
            className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${
                account.isEmpty
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : account.isLow
                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-violet-50 text-violet-700 border-violet-200'
            } hover:brightness-95`}
        >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="tabular-nums">{account.balance}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-75">créditos</span>
            {(account.isLow || account.isEmpty) && (
                <span className="text-[10px] font-bold">· {account.isEmpty ? 'comprar!' : 'baixo'}</span>
            )}
        </button>
    ) : null;

    const current = TABS.find((t) => t.id === tab) ?? TABS[0];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.06] flex-wrap">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Brain className="w-5 h-5 text-violet-500" />
                        Inteligência
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        {current.description}
                    </p>
                </div>
                {balancePill}
            </div>

            {/* Tabs nav */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto -mb-px">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = t.id === tab;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                                active
                                    ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Conteúdo */}
            <div>
                {tab === 'chat' && <ChatTab />}
                {tab === 'insights' && <InsightsTab />}
                {tab === 'credits' && (
                    <div className="-mt-1">
                        {/* AiCreditsPage tem header próprio — embarca direto */}
                        <AiCreditsPage />
                    </div>
                )}
                {tab === 'capabilities' && <CapabilitiesTab />}
                {tab === 'agent' && (
                    <div className="-mt-1">
                        <AIAgentPage />
                    </div>
                )}
                {tab === 'howto' && <HowToUseTab />}
            </div>
        </div>
    );
}
