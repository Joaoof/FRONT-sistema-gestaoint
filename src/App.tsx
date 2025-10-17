// src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProductEntry } from './pages/ProductEntry';
import { ProductExit } from './pages/ProductExit';
import { CategoriesRegistration, CustomersRegistration, SupplierRegistration } from './pages/Register';
import { Sidebar } from './components/Sidebar';
import { useInventory } from './hooks/useInventory';
import { LoginForm } from './pages/LoginForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FinancialManagement } from './pages/FinancialManagement';
import { MovementHistory } from './pages/Movement/MovementHistory';
import { MovementDashboard } from './components/MovementDashboard';
import { CreatePayable } from './pages/Tax/AccountsPayable/Create';
import { AccountsReceivableDashboard } from './pages/Tax/AccountsReceivable/Dashboard';
import { CreateReceivable } from './pages/Tax/AccountsReceivable/Create';
import { AccountsPayableDashboard } from './pages/Tax/AccountsPayable/Dashboard';
import { ReceivablesList } from './pages/Tax/AccountsReceivable/List';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { PrivateRoute } from './components/ProtectedRoute';
import { CompanyProvider } from './contexts/CompanyContext';
import { CashMovementForm } from './pages/CashMovementForm';
import { PayablesList } from './pages/Tax/AccountsPayable/List';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { NewDeliveryPage } from './pages/NewDeliveryPage';
import { ScheduleRoutePage } from './pages/ScheduleRoutePage';
import { DeliveryReportsPage } from './pages/DeliveryReportsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import HelpPage from './pages/Help';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth(); // ✅ Pega o user com permissions
  const inventory = useInventory(); // ✅ Dados do estoque

  const showSidebar = location.pathname !== '/';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showSidebar && (
        <PrivateRoute>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            currentView={location.pathname.slice(1) as any}
            onViewChange={() => { }}
            userPermissions={user?.permissions || []} // ✅ ESSE CAMPO É OBRIGATÓRIO
          />
        </PrivateRoute>
      )}

      <main className={showSidebar ? 'flex-1 lg:ml-64 p-6' : 'w-full p-6'}>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard {...inventory} />
              }
            />
            <Route path='/entregas' element={<DeliveriesPage />} />
            <Route path="/entregas/cadastrar" element={<NewDeliveryPage />} />
            <Route
              path="/entregas/agendar"
              element={
                <ErrorBoundary fallback={<div>Ocorreu um erro ao carregar a página de rotas.</div>}>
                  <ScheduleRoutePage />
                </ErrorBoundary>
              }
            />
            <Route path="/entregas/relatorios" element={<DeliveryReportsPage />} />
            <Route path="/estoque" element={<ProductEntry onAddEntry={inventory.addEntry} />} />
            <Route path="/vendas" element={<ProductExit onAddExit={inventory.addExit} products={inventory.products} />} />
            <Route path="/fiscal-receber" element={<AccountsReceivableDashboard />} />
            <Route path="/fiscal-receber-cria" element={<CreateReceivable />} />
            <Route path="/fiscal-pagar" element={<AccountsPayableDashboard />} />
            <Route path="/fiscal-pagar-criar" element={<CreatePayable />} />
            <Route path="/listar-contas-pagas" element={<ReceivablesList />} />
            <Route path="/listar-contas-receber" element={<PayablesList />} />
            <Route path="/financeiro" element={<FinancialManagement />} />
            <Route path="/consultas" element={<SearchPage />} />
          // src/App.tsx
            <Route path="/movimentacoes" element={<MovementDashboard />} />
            <Route path="/formulario-movimentacao" element={<CashMovementForm />} />
            <Route path="/historico-movimentacao" element={<MovementHistory />} />
            <Route path="/historico" element={<MovementHistory />} />

            <Route
              path="/cadastros"
              element={
                <div className="space-y-4">
                  <h1 className="text-xl font-['Rajdhani'] font-bold">Cadastros</h1>
                  <CategoriesRegistration />
                  <CustomersRegistration />
                  <SupplierRegistration />
                </div>
              }
            />

            <Route path="/configuracoes" element={<SettingsPage />} />

            <Route path='/help' element={<HelpPage />} />

            <Route path="*" element={<div>Página não encontrada</div>} />
          </Routes>
        </NotificationProvider>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary fallback={<div>Erro no carregamento da aplicação</div>}>
        <AuthProvider>
          <NotificationProvider>
            <CompanyProvider>
              <AppContent />
            </CompanyProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}