import React, { useState } from 'react';
import { useSmartPOS } from './data/dbStore';
import { UserRole, Sale } from './types';
import { PosBillingView } from './components/pos/PosBillingView';
import { ProductManagementView } from './components/products/ProductManagementView';
import { InventoryLedgerView } from './components/inventory/InventoryLedgerView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersView } from './components/customers/CustomersView';
import { CashRegisterView } from './components/cashier/CashRegisterView';
import { ReportsDashboardView } from './components/reports/ReportsDashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { MavenProjectView } from './components/maven/MavenProjectView';
import { ReceiptModal } from './components/receipt/ReceiptModal';

import {
  ShoppingCart,
  Package,
  Layers,
  History,
  Truck,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Code2,
  Menu,
  X,
  UserCheck,
  Printer,
  ChevronDown,
} from 'lucide-react';

export default function App() {
  const store = useSmartPOS();

  // Navigation state
  const [activeTab, setActiveTab] = useState<
    'pos' | 'products' | 'inventory' | 'sales' | 'purchases' | 'customers' | 'cashier' | 'reports' | 'settings' | 'maven'
  >('pos');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active receipt modal
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  // Switch Role
  const handleRoleChange = (role: UserRole) => {
    const matched = store.users.find((u) => u.role === role);
    if (matched) {
      store.setCurrentUser(matched);
    }
  };

  const navItems = [
    { id: 'pos' as const, label: 'POS Billing', icon: ShoppingCart },
    { id: 'products' as const, label: 'Products', icon: Package },
    { id: 'inventory' as const, label: 'Inventory & Ledger', icon: Layers },
    { id: 'sales' as const, label: 'Sales History', icon: History },
    { id: 'purchases' as const, label: 'Purchases', icon: Truck },
    { id: 'customers' as const, label: 'Customers', icon: Users },
    { id: 'cashier' as const, label: 'Cash Register', icon: DollarSign },
    { id: 'reports' as const, label: '18 Reports', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'maven' as const, label: 'Maven & Spring Boot', icon: Code2 },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* TOP BAR CONTRACT: Brand Wordmark — Concise Nav Links — Primary Action & Role Switcher */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between gap-4 px-4 sm:px-6 shrink-0 z-30">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('pos');
            }}
            className="flex items-center gap-2 group whitespace-nowrap shrink-0"
          >
            {store.business.logoPath ? (
              <img
                src={store.business.logoPath}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-contain border border-slate-200"
              />
            ) : (
              <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                SP
              </div>
            )}
            <span className="font-bold text-base tracking-tight text-slate-900">
              SmartPOS
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (Desktop 1440px / Large Viewport) */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-2 text-xs font-semibold overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Role Switcher & Profile CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={store.currentUser.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ADMIN">Admin (Full Control)</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier (Billing)</option>
              <option value="INVENTORY_MANAGER">Inventory Mgr</option>
              <option value="REPORT_VIEWER">Report Viewer</option>
            </select>
          </div>

          {activeTab !== 'pos' && (
            <button
              onClick={() => setActiveTab('pos')}
              className="hidden sm:flex px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>POS Terminal</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-white/95 backdrop-blur-sm p-4 overflow-y-auto border-b border-slate-200">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT CANVAS */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && (
          <PosBillingView
            products={store.products}
            categories={store.categories}
            units={store.units}
            customers={store.customers}
            business={store.business}
            currentUser={store.currentUser}
            heldCarts={store.heldCarts}
            recentSales={store.sales}
            onCheckout={store.checkoutSale}
            onHoldCart={store.holdCart}
            onRemoveHeldCart={store.removeHeldCart}
            onOpenReceipt={(sale) => setReceiptSale(sale)}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagementView
            products={store.products}
            categories={store.categories}
            brands={store.brands}
            units={store.units}
            business={store.business}
            currentUser={store.currentUser}
            onSaveProduct={store.saveProduct}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryLedgerView
            products={store.products}
            stockMovements={store.stockMovements}
            business={store.business}
            currentUser={store.currentUser}
            onAdjustStock={store.adjustStock}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryView
            sales={store.sales}
            business={store.business}
            currentUser={store.currentUser}
            salesReturns={store.salesReturns}
            saleCancellations={store.saleCancellations}
            onOpenReceipt={(sale) => setReceiptSale(sale)}
            onCancelSale={store.cancelSale}
            onProcessReturn={store.processCustomerReturn}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesView
            suppliers={store.suppliers}
            purchases={store.purchases}
            products={store.products}
            business={store.business}
            currentUser={store.currentUser}
            onReceivePO={store.receivePurchaseOrder}
            onCreatePO={(po) => store.setPurchases((prev) => [po, ...prev])}
            onAddSupplier={(s) => store.setSuppliers((prev) => [...prev, s])}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={store.customers}
            sales={store.sales}
            business={store.business}
            currentUser={store.currentUser}
            onAddCustomer={(c) => store.setCustomers((prev) => [...prev, c])}
          />
        )}

        {activeTab === 'cashier' && (
          <CashRegisterView
            session={store.registerSession}
            expenses={store.expenses}
            expenseCategories={store.expenseCategories}
            business={store.business}
            currentUser={store.currentUser}
            onOpenSession={store.openCashRegister}
            onCloseSession={store.closeCashRegister}
            onAddExpense={store.addExpense}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsDashboardView
            sales={store.sales}
            products={store.products}
            stockMovements={store.stockMovements}
            expenses={store.expenses}
            salesReturns={store.salesReturns}
            saleCancellations={store.saleCancellations}
            customers={store.customers}
            business={store.business}
            currentUser={store.currentUser}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            business={store.business}
            currentUser={store.currentUser}
            onUpdateBusiness={store.setBusiness}
            onResetFactory={store.resetToFactoryDefaults}
          />
        )}

        {activeTab === 'maven' && <MavenProjectView />}
      </main>

      {/* Global Thermal Receipt Modal */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          business={store.business}
          isOpen={!!receiptSale}
          onClose={() => setReceiptSale(null)}
        />
      )}
    </div>
  );
}
