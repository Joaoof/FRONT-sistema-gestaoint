import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProductEntry } from './components/ProductEntry';
import { ProductExit } from './components/ProductExit';
import { Sidebar } from './components/Sidebar';
import { useInventory } from './hooks/useInventory';

import { CategoriesRegistration } from './components/Register/CategoriesRegistration';
import { CustomersRegistration } from './components/Register/CustomersRegistration';
import { ProductsRegistration } from './components/Register/ProductsRegistration';
import { SupplierRegistration } from './components/Register/SupplierRegistration';

export type View = 'dashboard' | 'cadastros' | 'estoque' | 'vendas' | 'fiscal' | 'financeiro' | 'ecommerce' | 'consultas';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inventory = useInventory();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...inventory} />;
      case 'estoque':
        return <ProductEntry onAddEntry={inventory.addEntry} />;
      case 'vendas':
        return <ProductExit
          onAddExit={inventory.addExit}
          products={inventory.products}
        />;
      case 'cadastros':
        return (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Cadastros</h1>
            <CategoriesRegistration />
            <CustomersRegistration />
            <ProductsRegistration />
            <SupplierRegistration />
          </div>
        );
      default:
        return <Dashboard {...inventory} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
              <span className="text-xs text-gray-500 hidden sm:block">ESTOQUE NUVEM</span>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
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

        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;