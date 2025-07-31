"use client"

import { useState, useEffect } from "react"
import { Dashboard } from "./Dashboard"
import { ProductEntry } from "./ProductEntry"
import { ProductExit } from "./ProductExit"
import { Sidebar } from "./Sidebar"
import { useInventory } from "../hooks/useInventory"
import { CategoriesRegistration } from "./Register/CategoriesRegistration"
import { CustomersRegistration } from "./Register/CustomersRegistration"
import { ProductsRegistration } from "./Register/ProductsRegistration"
import { SupplierRegistration } from "./Register/SupplierRegistration"
import { useAuth } from "../contexts/AuthContext"
import { UpgradeModal } from "./UpgradeModal"

export type View =
    | "dashboard"
    | "cadastros"
    | "estoque"
    | "vendas"
    | "fiscal"
    | "financeiro"
    | "ecommerce"
    | "consultas"

const moduleNames: Record<View, string> = {
    dashboard: "Dashboard",
    cadastros: "Cadastros",
    estoque: "Estoque",
    vendas: "Vendas",
    fiscal: "Fiscal",
    financeiro: "Financeiro",
    ecommerce: "E-commerce",
    consultas: "Consultas",
}

export function AuthenticatedApp() {
    const [currentView, setCurrentView] = useState<View>("dashboard")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const inventory = useInventory()
    const { user, company, logout } = useAuth()
    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; moduleName: string }>({
        isOpen: false,
        moduleName: "",
    })

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
        if (!hasModuleAccess(currentView)) {
            // If current view is not accessible, redirect to dashboard or first available module
            const availableModules: View[] = [
                "dashboard",
                "estoque",
                "vendas",
                "cadastros",
                "fiscal",
                "financeiro",
                "ecommerce",
                "consultas",
            ]
            const firstAvailable = availableModules.find(hasModuleAccess)
            if (firstAvailable) {
                setCurrentView(firstAvailable);
            }
        }
    }, [user, currentView])

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
            case "dashboard":
                return <Dashboard {...inventory} />

            case "estoque":
                return <ProductEntry onAddEntry={inventory.addEntry} />

            case "vendas":
                return <ProductExit onAddExit={inventory.addExit} products={inventory.products} />

            case "cadastros":
                return (
                    <div className="space-y-4">
                        <h1 className="text-xl font-bold">Cadastros</h1>
                        <CategoriesRegistration />
                        <CustomersRegistration />
                        <ProductsRegistration />
                        <SupplierRegistration />
                    </div>
                )

            case "fiscal":
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
                            <p className="text-gray-600">Em desenvolvimento - Em breve disponível!</p>
                        </div>
                    </div>
                )

            case "financeiro":
                return (
                    <div className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="text-green-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo Financeiro</h3>
                            <p className="text-gray-600">Em desenvolvimento - Em breve disponível!</p>
                        </div>
                    </div>
                )

            case "ecommerce":
                return (
                    <div className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="text-purple-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo E-commerce</h3>
                            <p className="text-gray-600">Em desenvolvimento - Em breve disponível!</p>
                        </div>
                    </div>
                )

            case "consultas":
                return (
                    <div className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="text-indigo-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo Consultas</h3>
                            <p className="text-gray-600">Em desenvolvimento - Em breve disponível!</p>
                        </div>
                    </div>
                )

            default:
                return <Dashboard {...inventory} />
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

            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ isOpen: false, moduleName: "" })}
                moduleName={upgradeModal.moduleName}
            />
        </div>
    )
}
