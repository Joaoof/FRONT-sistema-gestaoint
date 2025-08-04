"use client"

import { useState, useEffect } from "react"
import { Dashboard } from "./Dashboard"
import { ProductEntry } from "./ProductEntry"
import { ProductExit } from "./ProductExit"
import { Sidebar } from "../components/Sidebar"
import { useInventory } from "../hooks/useInventory"
import { useAuth } from "../contexts/AuthContext"
import { EntryMovement } from "./EntryMovement"
import { NewEntryMovement } from "./Movement/NewEntryMovement"
import { NewExitMovement } from "./Movement/NewExitMovement"
import { MovementHistory } from "./Movement/MovementHistory"
import { HomeMovement } from "./Movement/HomeMovements"
import { useLocation, useNavigate } from "react-router-dom"
import { MovementDashboard } from "../components/MovementDashboard"
// import { UpgradeModal } from "./UpgradeModal"

export type  View =
    | 'dashboard'
    | 'cadastros'
    | 'estoque'
    | 'vendas'
    | 'fiscal'
    | 'fiscal-a-pagar'
    | 'fiscal-a-receber'
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

const moduleNames: Record<View, string> = {
    dashboard: 'Dashboard',
    cadastros: 'Cadastros',
    estoque: 'Estoque',
    entrada: 'Entrada de Produtos',
    'movimentacoes-entrada': 'Nova Entrada',
    'movimentacoes-saida': 'Nova Saída',
    historico: 'Histórico',
    vendas: 'Vendas',
    fiscal: 'Fiscal',
    'fiscal-a-pagar': 'Pagar',
    'fiscal-a-receber': 'Receber',
    financeiro: 'Financeiro',
    ecommerce: 'E-commerce',
    consultas: 'Consultas',
};

export function AuthenticatedApp() {
    const [currentView, setCurrentView] = useState<View>("dashboard")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const inventory = useInventory()
    const { user, company, logout } = useAuth()
    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; moduleName: string }>({
        isOpen: false,
        moduleName: "",
    })
    const navigate = useNavigate();
    const location = useLocation();

    console.log("User completo:", user);
    console.log("Plano do usuário:", user?.plan);
    console.log("Módulos do plano:", user?.plan?.modules);

    // Check if user has access to the current view based on company modules
    const hasModuleAccess = (moduleId: string) => {
        return user?.plan?.modules?.some((module) => {
            return module.module_key === moduleId && module.isActive;
        }) ?? false;
    };

    console.log(hasModuleAccess);

    console.log("User plan:", user?.plan);
    console.log("Current view:", currentView);
    console.log("Has access to estoque:", hasModuleAccess("estoque"));

    const handleViewChange = (newView: View) => {
        if (!hasModuleAccess(newView)) {
            setUpgradeModal({
                isOpen: true,
                moduleName: moduleNames[newView],
            })
            return
        }
        setCurrentView(newView)
    }

    // Check access when component mounts or view changes
    useEffect(() => {
        const path = location.pathname.split("/").pop();
        if (path && (path in moduleNames)) {
            const view = path as View;
            if (hasModuleAccess(view)) {
                setCurrentView(view);
            } else if (view !== "dashboard") {
                // Se não tiver acesso, volta ao dashboard
                navigate("/dashboard");
            }
        }
    }, [location.pathname, hasModuleAccess, navigate]);


    const renderContent = () => {
        // Double check access before rendering
        if (!hasModuleAccess(currentView)) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7m0 0V5m0 2h2m-2 0H10"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo não disponível</h3>
                        <p className="text-gray-600">Este módulo não está disponível no seu plano atual.</p>
                    </div>
                </div>
            )
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

            case 'movimentacoes':
                return <MovementDashboard />

            case 'movimentacoes-entrada':
                return <NewEntryMovement />

            case 'movimentacoes-saida':
                return <NewExitMovement />

            case 'historico':
                return <MovementHistory />

            case 'fiscal':
                return (
                    <div className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="text-blue-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo Fiscal</h3>
                            <p className="text-gray-600">Em breve disponível!</p>
                        </div>
                    </div>
                );

            case 'financeiro':
                return <HomeMovement />;

            case 'ecommerce':
            case 'consultas':
            default:
                return <Dashboard {...inventory} />;
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                currentView={currentView}
                onViewChange={handleViewChange}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <main className="flex-1 lg:ml-64 transition-all duration-300">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
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
                            <span className="text-xs text-gray-500 hidden sm:block">{company?.name || "ESTOQUE NUVEM"}</span>
                        </div>

                        <div className="flex items-center space-x-2 lg:space-x-4">
                            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                                <span>{user?.name}</span>
                                <span className="text-gray-400">•</span>
                                <span className="capitalize">{user?.role}</span>
                            </div>

                            <button
                                onClick={logout}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                                Sair
                            </button>

                            <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                Atualizar
                            </button>

                            <div className="flex items-center space-x-1 lg:space-x-2">
                                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-300 rounded-full"></div>
                                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-300 rounded-full"></div>
                                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-300 rounded-full hidden sm:block"></div>
                                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-300 rounded-full hidden sm:block"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-6">{renderContent()}</div>
            </main>

            {/* <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ isOpen: false, moduleName: "" })}
                moduleName={upgradeModal.moduleName}
            /> */}
        </div>
    )
}
