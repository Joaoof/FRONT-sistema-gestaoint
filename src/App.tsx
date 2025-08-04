// src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProductEntry } from './pages/ProductEntry';
import { ProductExit } from './pages/ProductExit';
import { EntryMovement } from './pages/EntryMovement';
import { CategoriesRegistration, CustomersRegistration, ProductsRegistration, SupplierRegistration } from './pages/Register';
import { Sidebar } from './components/Sidebar';
import { useInventory } from './hooks/useInventory';
import { LoginForm } from './pages/LoginForm';
import { AuthProvider } from './contexts/AuthContext';
import { FiscalPage } from './pages/Tax';
import { FinancialManagement } from './pages/FinancialManagement';
import { HomeMovement } from './pages/Movement/HomeMovements';
import { NewEntryMovement } from './pages/Movement/NewEntryMovement';
import { NewExitMovement } from './pages/Movement/NewExitMovement';
import { MovementHistory } from './pages/Movement/MovementHistory';
import { MovementDashboard } from './components/MovementDashboard';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const inventory = useInventory(); // ✅ Dados do estoque

  const showSidebar = location.pathname !== '/';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentView={location.pathname.slice(1) as any}
          onViewChange={() => { }}
        />
      )}

      <main className={showSidebar ? 'flex-1 lg:ml-64 p-6' : 'w-full p-6'}>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/dashboard" element={<Dashboard {...inventory} />} />
          <Route path="/estoque" element={<ProductEntry onAddEntry={inventory.addEntry} />} />
          <Route path="/saida" element={<ProductExit onAddExit={inventory.addExit} products={inventory.products} />} />
          <Route path="/fiscal" element={<FiscalPage />} />
          <Route path="/financeiro" element={<FinancialManagement />} />
          // src/App.tsx
          <Route path="/movimentacoes" element={<MovementDashboard />} />
          <Route path="/movimentacoes-entrada" element={<NewEntryMovement />} />
          <Route path="/movimentacoes-saida" element={<NewExitMovement />} />
          <Route path="/historico" element={<MovementHistory />} />

          <Route
            path="/cadastros"
            element={
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Cadastros</h1>
                <CategoriesRegistration />
                <CustomersRegistration />
                <ProductsRegistration />
                <SupplierRegistration />
              </div>
            }
          />


          <Route path="*" element={<div>Página não encontrada</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider> {/* ✅ Esse é o problema principal */}
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}