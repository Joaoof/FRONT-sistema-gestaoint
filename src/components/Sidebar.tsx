import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  ShoppingBag,
  Search
} from 'lucide-react';
import { View } from './AuthenticatedApp';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cadastros' as View, label: 'Cadastros', icon: Users },
    { id: 'estoque' as View, label: 'Estoque', icon: Package },
    { id: 'vendas' as View, label: 'Vendas', icon: ShoppingCart },
    { id: 'fiscal' as View, label: 'Fiscal', icon: FileText },
    { id: 'financeiro' as View, label: 'Financeiro', icon: DollarSign },
    { id: 'ecommerce' as View, label: 'E-commerce', icon: ShoppingBag },
    { id: 'consultas' as View, label: 'Consultas', icon: Search },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-semibold text-gray-900">Estoque Nuvem</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm transition-colors ${isActive
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
              {(item.id === 'cadastros' || item.id === 'estoque') && (
                <span className="ml-auto text-gray-400">›</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}