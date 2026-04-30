// src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProductEntry } from './pages/ProductEntry';
import { ProductExit } from './pages/ProductExit';
import { NewSale } from './pages/Sales/NewSale';
import { InventoryHub } from './pages/Inventory/InventoryHub';
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
import { Topbar } from './components/Topbar';
import { CreateProduct } from './pages/Products/CreateProduct';
import { ProductsList } from './pages/Products/ProductsList';
import { ProductDetail } from './pages/Products/ProductDetail';
import { StockAlertsReport } from './pages/Products/StockAlertsReport';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { BusinessOverview } from './pages/Reports/BusinessOverview';
import { WhatsAppReportPage } from './pages/WhatsAppReportPage';
import { OrdersListPage } from './pages/Orders/OrdersListPage';
import { PrintableOrder } from './pages/Orders/PrintableOrder';
import { CompanySettings } from './pages/Company/CompanySettings';
import { DeliveriesDashboard } from './pages/Deliveries/DeliveriesDashboard';
import { NewDeliveryFromOrder } from './pages/Deliveries/NewDeliveryFromOrder';
import { SellersPage } from './pages/Sellers/SellersPage';
import { AIStudioPage } from './pages/AI/AIStudioPage';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth(); // ✅ Pega o user com permissions
  const inventory = useInventory(); // ✅ Dados do estoque

  const isPrintRoute = /\/imprimir(\/|$)/.test(location.pathname);
  const showSidebar = location.pathname !== '/' && !isPrintRoute;

  return (
    <div className="flex min-h-screen bg-surface text-ink antialiased">
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

      <div className={showSidebar ? 'flex-1 lg:ml-64 flex flex-col min-w-0' : 'w-full flex flex-col min-w-0'}>
        {showSidebar && <Topbar />}
        <main
          key={location.pathname}
          className={
            isPrintRoute
              ? 'flex-1'
              : 'flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in'
          }
        >
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard {...inventory} />
              }
            />
            <Route path='/entregas' element={<DeliveriesDashboard />} />
            <Route path="/entregas/cadastrar" element={<NewDeliveryFromOrder />} />
            <Route path="/entregas/legado" element={<DeliveriesPage />} />
            <Route path="/entregas/legado/cadastrar" element={<NewDeliveryPage />} />
            <Route
              path="/entregas/agendar"
              element={
                <ErrorBoundary fallback={<div>Ocorreu um erro ao carregar a página de rotas.</div>}>
                  <ScheduleRoutePage />
                </ErrorBoundary>
              }
            />
            <Route path="/entregas/relatorios" element={<DeliveryReportsPage />} />
            <Route path="/estoque" element={<InventoryHub />} />
            <Route path="/estoque/entrada-rapida" element={<ProductEntry onAddEntry={inventory.addEntry} />} />
            <Route path="/estoque/alertas" element={<StockAlertsReport />} />
            <Route path="/produtos" element={<ProductsList />} />
            <Route path="/produtos/cadastrar" element={<CreateProduct />} />
            <Route path="/produtos/:id" element={<ProductDetail />} />
            <Route path="/categorias" element={<CategoriesRegistration />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/relatorios/visao-geral" element={<BusinessOverview />} />
            <Route path="/vendas" element={<NewSale />} />
            <Route path="/vendas/saida-rapida" element={<ProductExit onAddExit={inventory.addExit} products={inventory.products} />} />
            <Route path="/pedidos" element={<OrdersListPage />} />
            <Route path="/pedidos/:id/imprimir" element={<PrintableOrder />} />
            <Route path="/fiscal-receber" element={<AccountsReceivableDashboard />} />
            <Route path="/fiscal-receber-cria" element={<CreateReceivable />} />
            <Route path="/fiscal-pagar" element={<AccountsPayableDashboard />} />
            <Route path="/fiscal-pagar-criar" element={<CreatePayable />} />
            <Route path="/listar-contas-pagas" element={<PayablesList />} />
            <Route path="/listar-contas-receber" element={<ReceivablesList />} />
            <Route path="/financeiro" element={<FinancialManagement />} />
            <Route path="/consultas" element={<SearchPage />} />
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

            <Route path="/vendedores" element={<SellersPage />} />
            <Route path="/ia" element={<AIStudioPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/empresa" element={<CompanySettings />} />

            <Route path="/whatsapp/relatorio" element={<WhatsAppReportPage />} />

            <Route path='/help' element={<HelpPage />} />

            <Route path="*" element={<div>Página não encontrada</div>} />
          </Routes>
        </NotificationProvider>
        </main>
      </div>
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