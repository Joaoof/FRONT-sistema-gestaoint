import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../hooks/useInventory';
import { Sidebar } from '../components/Sidebar';
import { useNotification } from '../hooks/useNotification'; // ✅ Hook adicionado

// Páginas
import { Dashboard } from './Dashboard';
import { ProductEntry } from './ProductEntry';
import { ProductExit } from './ProductExit';
import { EntryMovement } from './EntryMovement';
import { FiscalPage } from './Tax';
import { FinancialManagement } from './FinancialManagement';
import { HomeMovement } from './Movement/HomeMovements';
import { NewEntryMovement } from './Movement/NewEntryMovement';
import { NewExitMovement } from './Movement/NewExitMovement';
import { MovementHistory } from './Movement/MovementHistory';
import { SettingsPage } from './SettingsPage';
import { Footer } from '../components/Footer';



// Tipos
export type View =
    | 'dashboard'
    | 'cadastros'
    | 'estoque'
    | 'vendas'
    | 'fiscal'
    | 'fiscal-receber'
    | 'fiscal-receber-criar'
    | 'fiscal-pagar'
    | 'fiscal-pagar-criar'
    | 'financeiro'
    | 'ecommerce'
    | 'consultas'
    | 'entrada'
    | 'movimentacoes'
    | 'movimentacoes-entrada'
    | 'movimentacoes-saida'
    | 'movimentacoes-saida-despesas'
    | 'movimentacoes-saida-retiradas'
    | 'movimentacoes-saida-pagamentos'
    | 'historico'
    | 'configuracoes';

const moduleNames: Record<View, string> = {
    dashboard: 'Dashboard',
    cadastros: 'Cadastros',
    estoque: 'Estoque',
    entrada: 'Entrada de Produtos',
    'movimentacoes-entrada': 'Nova Entrada',
    'movimentacoes-saida': 'Nova Saída',
    'movimentacoes-saida-despesas': 'Despesas',
    historico: 'Histórico',
    vendas: 'Vendas',
    fiscal: 'Fiscal',
    'fiscal-receber': 'Receber',
    'fiscal-receber-criar': 'Criar',
    'fiscal-pagar': 'Pagar',
    'fiscal-pagar-criar': 'Criar',
    financeiro: 'Financeiro',
    ecommerce: 'E-commerce',
    consultas: 'Consultas',
    configuracoes: 'Configurações',
} as any;

// Dados mockados (substitua com GraphQL depois)
const mockMovements = [
    { id: '1', value: 1500, description: 'Venda de produtos', type: 'venda', date: '2025-04-05T10:30' },
    { id: '2', value: 50, description: 'Troco de cliente', type: 'troco', date: '2025-04-05T11:15' },
];

export function AuthenticatedApp() {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const inventory = useInventory();
    const { user, company, logout } = useAuth();
    const { addNotification } = useNotification(); // ✅ Hook usado
    const navigate = useNavigate();
    const location = useLocation();


    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; moduleName: string }>({
        isOpen: false,
        moduleName: '',
    });

    // Verifica acesso ao módulo
    const hasModuleAccess = (moduleId: string) => {
        return user?.plan?.modules?.some(
            (module) => module.module_key === moduleId && module.isActive
        ) ?? false;
    };

    // Sincroniza currentView com a URL
    useEffect(() => {
        const path = location.pathname.split('/').pop();
        if (path && (path in moduleNames)) {
            const view = path as View;
            if (hasModuleAccess(view)) {
                setCurrentView(view);
            } else if (view !== 'dashboard') {
                navigate('/dashboard');
            }
        }
    }, [location.pathname, hasModuleAccess, navigate]);

    const handleViewChange = (view: View) => {
        if (!hasModuleAccess(view)) {
            setUpgradeModal({
                isOpen: true,
                moduleName: moduleNames[view],
            });
            return;
        }
        setCurrentView(view);
        navigate(`${view}`);
    };

    // ✅ Backup de dados
    const handleBackup = () => {
        const backupData = {
            timestamp: new Date().toISOString(),
            user: { name: user?.name, email: user?.email, role: user?.role },
            company: { name: company?.name, cnpj: company?.cnpj },
            inventory: inventory.products,
            movements: mockMovements,
            settings: { darkMode },
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-estoque-nuvem-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        addNotification('success', 'Backup exportado com sucesso!');
    };

    // ✅ Restaurar backup
    const handleRestore = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event: any) => {
                try {
                    const data = JSON.parse(event.target.result as string);
                    console.log('Backup restaurado:', data);
                    addNotification('success', 'Dados restaurados com sucesso!');
                    // Aqui você atualizaria o estado global (ex: inventory.setProducts(data.inventory))
                } catch (err) {
                    addNotification('error', 'Erro ao ler o arquivo de backup.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // ✅ Atalhos de teclado
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        if (hasModuleAccess('movimentacoes-entrada')) {
                            handleViewChange('movimentacoes-entrada');
                            navigate('/app/movimentacoes-entrada');
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        if (hasModuleAccess('movimentacoes-saida')) {
                            handleViewChange('movimentacoes-saida');
                            navigate('/movimentacoes-saida');
                        }
                        break;
                    case 'f':
                        e.preventDefault();
                        if (hasModuleAccess('consultas')) {
                            handleViewChange('consultas');
                            navigate('/consultas');
                        }
                        break;
                    case 'b':
                        e.preventDefault();
                        addNotification('info', 'Pressione Ctrl+Shift+B para exportar backup');
                        break;
                }
            }

            // Ctrl + Shift + B → Backup
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                handleBackup();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [hasModuleAccess, navigate, handleViewChange, addNotification]);

    // Renderiza conteúdo
    const renderContent = () => {
        if (!hasModuleAccess(currentView)) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo não disponível</h3>
                        <p className="text-gray-600">Este módulo não está disponível no seu plano atual.</p>
                    </div>
                </div>
            );
        }

        switch (currentView) {
            case 'dashboard':
                return <Dashboard {...inventory} />;
            case 'estoque':
                return <ProductEntry onAddEntry={inventory.addEntry} />;
            case 'vendas':
                return <ProductExit onAddExit={inventory.addExit} products={inventory.products} />;
            case 'entrada':
                return <EntryMovement />;
            case 'fiscal':
                return <FiscalPage />;
            case 'financeiro':
                return <FinancialManagement />;
            case 'movimentacoes':
                return <HomeMovement />;
            case 'movimentacoes-entrada':
                return <NewEntryMovement />;
            case 'movimentacoes-saida':
                return <NewExitMovement />;
            case 'historico':
                return <MovementHistory />;
            case 'configuracoes':
                return <SettingsPage />;
            default:
                return <div>Página não encontrada</div>;
        }
    };

    return (

        <div className={`flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
            <Sidebar
                currentView={currentView}
                onViewChange={handleViewChange}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="flex-1 lg:ml-64 transition-all duration-300">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => addNotification('info', 'Você tem 3 contas a vencer esta semana!')}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white relative"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17H4l5-5v5z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                        </button>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                            {darkMode ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        <span className="text-xs text-gray-500 dark:text-gray-400">{company?.name || 'ESTOQUE NUVEM'}</span>
                    </div>
                </div>

                {/* Página */}
                <div className="p-6">
                    {renderContent()}
                </div>
                <Footer />
            </main>
        </div>
    );
}