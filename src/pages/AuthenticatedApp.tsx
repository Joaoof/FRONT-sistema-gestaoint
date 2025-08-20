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
import { MovementHistory } from './Movement/MovementHistory';
import { SettingsPage } from './SettingsPage';
import { Footer } from '../components/Footer';
import { CashMovementForm } from './CashMovementForm';



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
    | 'formulario-movimentacao'
    | 'historico-movimentacao'
    | 'historico'
    | 'configuracoes';

const moduleNames: Record<View, string> = {
    dashboard: 'Dashboard',
    cadastros: 'Cadastros',
    estoque: 'Estoque',
    entrada: 'Entrada de Produtos',
    'formulario-movimentacao': 'Formulário de Movimentação',
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

export function AuthenticatedApp() {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const inventory = useInventory();
    const { user, company } = useAuth();
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


    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

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
    // ✅ Atalhos de teclado
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        if (hasModuleAccess('formulario-movimentacao')) {
                            handleViewChange('formulario-movimentacao');
                            navigate('/app/formulario-movimentacao');
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        if (hasModuleAccess('historico-movimentacao')) {
                            handleViewChange('historico-movimentacao');
                            navigate('historico-movimentacao');
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
            case 'formulario-movimentacao':
                return <CashMovementForm />;
            case 'historico-movimentacao':
                return <MovementHistory />;
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
                userPermissions={user?.permissions || []} // ✅ passa as permissões
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