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
import { NotificationsCenterProvider } from './contexts/NotificationsCenterContext';
import { AIAgentProvider } from './contexts/AIAgentContext';
import { AIAgentWidget } from './components/AIAgentWidget';
import { AIAgentPage } from './pages/AI/AIAgentPage';
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
import { BanksPage } from './pages/Banks/BanksPage';
import { AlertsPage } from './pages/Alerts/AlertsPage';
import { AIStudioPage } from './pages/AI/AIStudioPage';
import { DriversPage } from './pages/Drivers/DriversPage';
import { DriverProfilePage } from './pages/Drivers/DriverProfilePage';
import { ConstructionDashboard } from './pages/Construction/ConstructionDashboard';
import { ObrasList } from './pages/Construction/Obras/ObrasList';
import { ObraCreate } from './pages/Construction/Obras/ObraCreate';
import { ObraDetail } from './pages/Construction/Obras/ObraDetail';
import { VersaoEditor } from './pages/Construction/Orcamento/VersaoEditor';
import { TransacoesList } from './pages/Construction/Transacoes/TransacoesList';
import { TransacaoCreate } from './pages/Construction/Transacoes/TransacaoCreate';
import { CentrosCustoList } from './pages/Construction/Cadastros/CentrosCustoList';
import { CategoriasConstrucaoList } from './pages/Construction/Cadastros/CategoriasConstrucaoList';
import { PrevistoVsRealizado } from './pages/Construction/Relatorios/PrevistoVsRealizado';
import { AnaliseDesvio } from './pages/Construction/Relatorios/AnaliseDesvio';
import { FluxoCaixa } from './pages/Construction/Relatorios/FluxoCaixa';
import { QuebraCustos } from './pages/Construction/Relatorios/QuebraCustos';
import { InvoicesListPage } from './pages/Invoices/InvoicesListPage';
import { InvoiceDetailPage } from './pages/Invoices/InvoiceDetailPage';
import { IssueInvoicePage } from './pages/Invoices/IssueInvoicePage';
import { FiscalConfigPage } from './pages/Settings/FiscalConfigPage';
import { AuditPage } from './pages/Audit/AuditPage';
import { SystemParametersPage } from './pages/Settings/SystemParametersPage';
import { ChartOfAccountsPage } from './pages/Settings/ChartOfAccountsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { NotificationTemplatesPage } from './pages/Settings/NotificationTemplatesPage';
import { MessagesCenterPage } from './pages/Communications/MessagesCenterPage';
import { PipelinePage } from './pages/CRM/PipelinePage';
import { OpportunityDetailPage } from './pages/CRM/OpportunityDetailPage';
import { ContractsListPage } from './pages/Contracts/ContractsListPage';
import { ContractDetailPage } from './pages/Contracts/ContractDetailPage';
import { WhatsappPage } from './pages/Communications/WhatsappPage';
import { WhatsappContactsPage } from './pages/Communications/WhatsappContactsPage';
import { WhatsappChatbotPage } from './pages/Communications/WhatsappChatbotPage';
import { TimelinePage } from './pages/TimelinePage';
import { RemindersPage } from './pages/RemindersPage';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth(); // ✅ Pega o user com permissions
  const inventory = useInventory(); // ✅ Dados do estoque

  const isPrintRoute = /\/imprimir(\/|$)/.test(location.pathname);
  const showSidebar = location.pathname !== '/' && !isPrintRoute;

  return (
    <NotificationsCenterProvider>
    <AIAgentProvider>
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

      <div className={showSidebar ? 'flex-1 lg:ml-72 flex flex-col min-w-0' : 'w-full flex flex-col min-w-0'}>
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
            <Route path="/bancos" element={<BanksPage />} />
            <Route path="/alertas" element={<AlertsPage />} />
            <Route path="/ia" element={<AIStudioPage />} />
            <Route path="/agente-ia" element={<AIAgentPage />} />
            <Route path="/motoristas" element={<DriversPage />} />
            <Route path="/motoristas/:id" element={<DriverProfilePage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/empresa" element={<CompanySettings />} />

            <Route path="/whatsapp/relatorio" element={<WhatsAppReportPage />} />

            <Route path='/help' element={<HelpPage />} />

            {/* Construção civil */}
            <Route path="/obras" element={<ObrasList />} />
            <Route path="/obras/painel" element={<ConstructionDashboard />} />
            <Route path="/obras/cadastrar" element={<ObraCreate />} />
            <Route path="/obras/:id" element={<ObraDetail />} />
            <Route path="/obras/:id/orcamento/novo" element={<VersaoEditor />} />
            <Route path="/obras/:id/orcamento/:versaoId" element={<VersaoEditor />} />
            <Route path="/obras/transacoes" element={<TransacoesList />} />
            <Route path="/obras/transacoes/cadastrar" element={<TransacaoCreate />} />
            <Route path="/obras/cadastros/centros-custo" element={<CentrosCustoList />} />
            <Route path="/obras/cadastros/categorias" element={<CategoriasConstrucaoList />} />
            <Route path="/obras/relatorios/previsto-realizado" element={<PrevistoVsRealizado />} />
            <Route path="/obras/relatorios/desvio" element={<AnaliseDesvio />} />
            <Route path="/obras/relatorios/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/obras/relatorios/quebra-custos" element={<QuebraCustos />} />

            {/* Notas fiscais */}
            <Route path="/notas" element={<InvoicesListPage />} />
            <Route path="/notas/nova" element={<IssueInvoicePage />} />
            <Route path="/notas/:id" element={<InvoiceDetailPage />} />
            <Route path="/configuracoes/fiscal" element={<FiscalConfigPage />} />

            {/* Auditoria */}
            <Route path="/auditoria" element={<AuditPage />} />

            {/* Configurações do sistema */}
            <Route path="/configuracoes/parametros" element={<SystemParametersPage />} />
            <Route path="/configuracoes/plano-contas" element={<ChartOfAccountsPage />} />
            <Route path="/configuracoes/templates" element={<NotificationTemplatesPage />} />

            {/* Notificações e comunicações */}
            <Route path="/notificacoes" element={<NotificationsPage />} />
            <Route path="/comunicacoes" element={<MessagesCenterPage />} />
            <Route path="/comunicacoes/whatsapp" element={<WhatsappPage />} />
            <Route path="/comunicacoes/whatsapp/contatos" element={<WhatsappContactsPage />} />
            <Route path="/comunicacoes/whatsapp/chatbot" element={<WhatsappChatbotPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/timeline/:category" element={<TimelinePage />} />
            <Route path="/lembretes" element={<RemindersPage />} />

            {/* CRM */}
            <Route path="/crm" element={<PipelinePage />} />
            <Route path="/crm/oportunidades/:id" element={<OpportunityDetailPage />} />

            {/* Contratos */}
            <Route path="/contratos" element={<ContractsListPage />} />
            <Route path="/contratos/:id" element={<ContractDetailPage />} />

            <Route path="*" element={<div>Página não encontrada</div>} />
          </Routes>
        </NotificationProvider>
        </main>
        {showSidebar && <AIAgentWidget />}
      </div>
    </div>
    </AIAgentProvider>
    </NotificationsCenterProvider>
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