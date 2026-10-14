import React, { useState } from 'react';
import {
  Product,
  StockMovement,
  BusinessConfig,
  User,
  MovementType,
} from '../../types';
import {
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Download,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

interface InventoryLedgerViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  business: BusinessConfig;
  currentUser: User;
  onAdjustStock: (payload: {
    productId: string;
    countedQuantity: number;
    reason: string;
    movementType: 'MANUAL_ADJUSTMENT' | 'DAMAGE' | 'LOSS';
  }) => { success: boolean; error?: string };
}

export const InventoryLedgerView: React.FC<InventoryLedgerViewProps> = ({
  products,
  stockMovements,
  business,
  currentUser,
  onAdjustStock,
}) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'ledger'>('balance');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('all');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newCount, setNewCount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'MANUAL_ADJUSTMENT' | 'DAMAGE' | 'LOSS'>('MANUAL_ADJUSTMENT');
  const [adjustError, setAdjustError] = useState('');

  // Can adjust stock?
  const canAdjust =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'MANAGER' ||
    currentUser.role === 'INVENTORY_MANAGER';

  // Overall Stock Valuation
  const totalCostValuation = products.reduce((sum, p) => sum + p.quantityOnHand * p.costPrice, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.quantityOnHand * p.sellingPrice, 0);
  const lowStockCount = products.filter((p) => p.availableStock <= p.reorderLevel).length;

  // Filtered Stock Movements
  const filteredMovements = stockMovements.filter((m) => {
    if (movementFilter !== 'all' && m.movementType !== movementFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.productName.toLowerCase().includes(q);
      const matchSku = m.sku.toLowerCase().includes(q);
      const matchRef = m.referenceId.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchRef) return false;
    }
    return true;
  });

  // Filtered Balance
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.productName.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  // Open adjustment modal
  const handleOpenAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setNewCount(prod.quantityOnHand);
    setAdjustmentReason('');
    setAdjustType('MANUAL_ADJUSTMENT');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  // Submit adjustment
  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!adjustmentReason.trim()) {
      setAdjustError('Please specify an audit reason for adjusting this stock.');
      return;
    }

    const res = onAdjustStock({
      productId: selectedProduct.id,
      countedQuantity: newCount,
      reason: adjustmentReason,
      movementType: adjustType,
    });

    if (res.success) {
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
    } else {
      setAdjustError(res.error || 'Failed to adjust stock');
    }
  };

  // Export Ledger CSV
  const handleExportLedgerCSV = () => {
    const headers = [
      'Timestamp',
      'Movement ID',
      'SKU',
      'Product Name',
      'Movement Type',
      'Qty Change',
      'Qty Before',
      'Qty After',
      'Reference Type',
      'Reference ID',
      'Created By',
      'Reason',
    ];

    const rows = stockMovements.map((m) => [
      `"${new Date(m.createdAt).toLocaleString()}"`,
      m.id,
      m.sku,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.movementType,
      m.quantityChange,
      m.quantityBefore,
      m.quantityAfter,
      m.referenceType,
      m.referenceId,
      `"${m.createdBy}"`,
      `"${m.reason.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockMovementLedger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Header & Valuation Cards */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Inventory Balance & Stock Movement Ledger
            </h1>
            <p className="text-xs text-slate-500">
              Audit trails, cycle count reconciliations, and real-time inventory valuations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLedgerCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Total Stock Valuation (Cost)</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
              {business.currencySymbol}{totalCostValuation.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Retail Selling Value</span>
            <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
              {business.currencySymbol}{totalRetailValuation.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Total Stock Units</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
              {products.reduce((acc, p) => acc + p.quantityOnHand, 0)} units
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Low Stock Alert Items</span>
            <span
              className={`text-base font-bold font-mono mt-1 block ${
                lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {lowStockCount} items
            </span>
          </div>
        </div>

        {/* View Switcher Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'balance'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Stock Balance ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movement Ledger History ({stockMovements.length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {activeTab === 'ledger' && (
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="all">All Movement Types</option>
                <option value="SALE">Sales (Out)</option>
                <option value="PURCHASE_RECEIPT">Purchases (In)</option>
                <option value="CUSTOMER_RETURN">Customer Returns (In)</option>
                <option value="CANCELLATION_REVERSAL">Cancellation Reversals (In)</option>
                <option value="MANUAL_ADJUSTMENT">Adjustments</option>
                <option value="DAMAGE">Damaged / Expired</option>
                <option value="OPENING_STOCK">Opening Stock</option>
              </select>
            )}

            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU, product, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'balance' ? (
          /* TAB 1: CURRENT STOCK BALANCE TABLE */
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4 text-center">On Hand</th>
                    <th className="py-3 px-4 text-center">Reserved</th>
                    <th className="py-3 px-4 text-center">Available Stock</th>
                    <th className="py-3 px-4 text-center">Reorder Point</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Valuation (Cost)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {canAdjust && <th className="py-3 px-4 text-right">Adjustment</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.availableStock <= p.reorderLevel && p.availableStock > 0;
                    const isOutOfStock = p.availableStock <= 0;
                    const valuation = p.quantityOnHand * p.costPrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {p.productName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums">
                          {p.quantityOnHand}
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-400">
                          {p.reservedQuantity}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] tabular-nums ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {p.availableStock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">
                          {p.reorderLevel}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                          ${p.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-800">
                          ${valuation.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-semibold ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'OPTIMAL'}
                          </span>
                        </td>
                        {canAdjust && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: CHRONOLOGICAL STOCK MOVEMENTS LEDGER */
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4 text-center">Change</th>
                    <th className="py-3 px-4 text-center">Before → After</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Audit Reason & User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No movement entries match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantityChange > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{m.productName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{m.sku}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-semibold tracking-tight text-slate-700 uppercase">
                              {m.movementType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-mono font-bold text-xs tabular-nums ${
                                isPositive ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] tabular-nums text-slate-500 whitespace-nowrap">
                            {m.quantityBefore} → <strong className="text-slate-900">{m.quantityAfter}</strong>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-slate-400 text-[10px] block">{m.referenceType}:</span>
                            <span className="text-slate-800 font-medium">{m.referenceId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-800 leading-tight">{m.reason}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">By {m.createdBy}</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Stock Adjustment & Reconciliation
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProduct.productName} ({selectedProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {adjustError && (
              <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjust} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current System Stock</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {selectedProduct.quantityOnHand} units
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">New Counted Difference</span>
                  <span className="text-base font-bold font-mono text-indigo-700">
                    {newCount - selectedProduct.quantityOnHand > 0 ? '+' : ''}
                    {newCount - selectedProduct.quantityOnHand} units
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Physical Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCount}
                  onChange={(e) => setNewCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Movement Reason Category</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  <option value="MANUAL_ADJUSTMENT">Regular Cycle Count Reconciliation</option>
                  <option value="DAMAGE">Damaged / Broken in Store</option>
                  <option value="LOSS">Shrinkage / Unaccounted Loss</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Audit Justification Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. End of month physical audit count by supervisor..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Commit Adjustment & Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
