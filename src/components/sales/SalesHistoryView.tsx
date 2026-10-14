import React, { useState } from 'react';
import {
  Sale,
  BusinessConfig,
  User,
  SalesReturn,
  SaleCancellation,
} from '../../types';
import {
  Search,
  Filter,
  Printer,
  RotateCcw,
  Ban,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  User as UserIcon,
  CreditCard,
} from 'lucide-react';

interface SalesHistoryViewProps {
  sales: Sale[];
  business: BusinessConfig;
  currentUser: User;
  salesReturns: SalesReturn[];
  saleCancellations: SaleCancellation[];
  onOpenReceipt: (sale: Sale) => void;
  onCancelSale: (saleId: string, reason: string) => { success: boolean; error?: string };
  onProcessReturn: (payload: {
    saleId: string;
    itemsToReturn: { saleItemId: string; quantity: number; restock: boolean }[];
    reason: string;
    refundMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT';
  }) => { success: boolean; salesReturn?: SalesReturn; error?: string };
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  business,
  currentUser,
  salesReturns,
  saleCancellations,
  onOpenReceipt,
  onCancelSale,
  onProcessReturn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'CANCELLED' | 'RETURNED'>('all');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Cancellation Modal State
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Return Modal State
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [restockDecisions, setRestockDecisions] = useState<Record<string, boolean>>({});
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT'>('UPI');
  const [returnError, setReturnError] = useState('');

  const canCancel = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canReturn = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'CASHIER';

  const filteredSales = sales.filter((s) => {
    if (statusFilter !== 'all' && s.saleStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInv = s.invoiceNumber.toLowerCase().includes(q);
      const matchCust = s.customerName.toLowerCase().includes(q);
      const matchCashier = s.cashierName.toLowerCase().includes(q);
      const matchGstin = s.customerGstin?.toLowerCase().includes(q);
      if (!matchInv && !matchCust && !matchCashier && !matchGstin) return false;
    }
    return true;
  });

  const handleOpenCancel = (sale: Sale) => {
    setCancelModalSale(sale);
    setCancelReason('');
    setCancelError('');
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSale) return;
    if (!cancelReason.trim()) {
      setCancelError('Please provide a valid cancellation reason.');
      return;
    }

    const res = onCancelSale(cancelModalSale.id, cancelReason);
    if (res.success) {
      setCancelModalSale(null);
    } else {
      setCancelError(res.error || 'Failed to cancel sale');
    }
  };

  const handleOpenReturn = (sale: Sale) => {
    setReturnModalSale(sale);
    const initialQty: Record<string, number> = {};
    const initialRestock: Record<string, boolean> = {};

    sale.items.forEach((item) => {
      initialQty[item.id] = 0;
      initialRestock[item.id] = true;
    });

    setReturnQuantities(initialQty);
    setRestockDecisions(initialRestock);
    setReturnReason('');
    setRefundMethod('UPI');
    setReturnError('');
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalSale) return;
    if (!returnReason.trim()) {
      setReturnError('Please specify the customer return reason.');
      return;
    }

    const itemsToReturn = returnModalSale.items
      .map((item) => ({
        saleItemId: item.id,
        quantity: returnQuantities[item.id] || 0,
        restock: restockDecisions[item.id] ?? true,
      }))
      .filter((i) => i.quantity > 0);

    if (itemsToReturn.length === 0) {
      setReturnError('Select at least one item quantity to return.');
      return;
    }

    const res = onProcessReturn({
      saleId: returnModalSale.id,
      itemsToReturn,
      reason: returnReason,
      refundMethod,
    });

    if (res.success) {
      setReturnModalSale(null);
    } else {
      setReturnError(res.error || 'Failed to process return');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header Bar */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              GST Tax Invoices & Sales Transaction Ledger
            </h1>
            <p className="text-xs text-slate-500">
              Audit GST invoices, reprint thermal bills, process returns and issue authorized credit note cancellations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Total Invoices: <strong className="text-slate-900">{sales.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, GSTIN, or cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Invoice Statuses</option>
            <option value="COMPLETED">Completed Only</option>
            <option value="RETURNED">Returned (Partial/Full)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Place of Supply</th>
                  <th className="py-3 px-4 text-center">GST Type</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST Total</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No GST sales transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(sale.saleDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {sale.customerName}
                        {sale.customerGstin && (
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">
                            GSTIN: {sale.customerGstin}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.placeOfSupply}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sale.isInterState ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {sale.isInterState ? 'IGST' : 'CGST+SGST'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        {business.currencySymbol}{sale.subtotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        +{business.currencySymbol}{sale.taxAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {business.currencySymbol}{sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${
                            sale.saleStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sale.saleStatus === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {sale.saleStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenReceipt(sale)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Print GST Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedSaleDetail(sale)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                            title="View Invoice Items"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canReturn && sale.saleStatus !== 'CANCELLED' && (
                            <button
                              onClick={() => handleOpenReturn(sale)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                              title="Customer Return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canCancel && sale.saleStatus === 'COMPLETED' && (
                            <button
                              onClick={() => handleOpenCancel(sale)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                              title="Cancel & Reverse Stock"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  TAX INVOICE {selectedSaleDetail.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {selectedSaleDetail.customerName} · POS: {selectedSaleDetail.placeOfSupply}
                </p>
              </div>
              <button onClick={() => setSelectedSaleDetail(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                  <span className="w-5/12">Item / HSN</span>
                  <span className="w-2/12 text-center">Qty</span>
                  <span className="w-2/12 text-right">Rate</span>
                  <span className="w-3/12 text-right">Total</span>
                </div>
                {selectedSaleDetail.items.map((it) => (
                  <div key={it.id} className="p-3 flex justify-between items-center text-slate-800">
                    <div className="w-5/12">
                      <p className="font-semibold text-slate-900">{it.productNameSnapshot}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        HSN: {it.hsnCodeSnapshot} · GST {it.taxRate}%
                      </p>
                    </div>
                    <div className="w-2/12 text-center font-mono">
                      {it.quantity}
                      {it.returnedQuantity > 0 && (
                        <span className="text-rose-500 text-[10px] block">(-{it.returnedQuantity} ret)</span>
                      )}
                    </div>
                    <div className="w-2/12 text-right font-mono text-slate-600">
                      {business.currencySymbol}{it.unitPrice.toFixed(2)}
                    </div>
                    <div className="w-3/12 text-right font-mono font-bold text-slate-900">
                      {business.currencySymbol}{it.lineTotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* GST Breakdown */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div className="font-semibold text-slate-700 pb-1 border-b border-slate-200">
                  GST Tax Assessment ({selectedSaleDetail.isInterState ? 'IGST' : 'CGST + SGST'})
                </div>
                {selectedSaleDetail.isInterState ? (
                  <div className="flex justify-between text-indigo-700">
                    <span>Integrated GST (IGST):</span>
                    <span className="font-mono font-semibold">
                      {business.currencySymbol}{selectedSaleDetail.igstAmount.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Central GST (CGST):</span>
                      <span className="font-mono font-semibold">
                        {business.currencySymbol}{selectedSaleDetail.cgstAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State GST (SGST):</span>
                      <span className="font-mono font-semibold">
                        {business.currencySymbol}{selectedSaleDetail.sgstAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50">
              <button
                onClick={() => {
                  onOpenReceipt(selectedSaleDetail);
                  setSelectedSaleDetail(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open GST Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span>Cancel GST Invoice & Reverse Stock</span>
                </h3>
                <p className="text-xs text-rose-700 font-mono mt-0.5">
                  Invoice {cancelModalSale.invoiceNumber}
                </p>
              </div>
              <button onClick={() => setCancelModalSale(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {cancelError && (
              <div className="px-6 py-2.5 bg-rose-100 text-rose-800 text-xs">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 leading-relaxed">
                Cancelling will issue an internal credit note reversal for <strong>{business.currencySymbol}{cancelModalSale.totalAmount.toFixed(2)}</strong> and automatically reverse all stock movements back to inventory.
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Audit Cancellation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Incorrect GSTIN provided / customer bill correction..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Keep Invoice
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Return Modal */}
      {returnModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>GST Credit Note / Return</span>
                </h3>
                <p className="text-xs text-amber-700 font-mono mt-0.5">
                  Original Invoice {returnModalSale.invoiceNumber}
                </p>
              </div>
              <button onClick={() => setReturnModalSale(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {returnError && (
              <div className="px-6 py-2.5 bg-rose-100 text-rose-800 text-xs">
                {returnError}
              </div>
            )}

            <form onSubmit={handleConfirmReturn} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700">
                  Select Return Quantities:
                </label>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {returnModalSale.items.map((item) => {
                    const remaining = item.quantity - item.returnedQuantity;
                    if (remaining <= 0) return null;

                    return (
                      <div key={item.id} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {item.productNameSnapshot}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            HSN: {item.hsnCodeSnapshot} · {business.currencySymbol}{item.unitPrice.toFixed(2)} each · Max returnable: {remaining}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Qty:</span>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={returnQuantities[item.id] || 0}
                            onChange={(e) =>
                              setReturnQuantities({
                                ...returnQuantities,
                                [item.id]: Math.min(remaining, Math.max(0, parseInt(e.target.value, 10) || 0)),
                              })
                            }
                            className="w-14 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded font-mono font-bold"
                          />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="checkbox"
                            id={`restock-${item.id}`}
                            checked={restockDecisions[item.id] ?? true}
                            onChange={(e) =>
                              setRestockDecisions({
                                ...restockDecisions,
                                [item.id]: e.target.checked,
                              })
                            }
                            className="rounded text-slate-900"
                          />
                          <label htmlFor={`restock-${item.id}`} className="text-[11px] text-slate-600">
                            Restock
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Return Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seal damaged / customer exchange..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Refund Tender Method</label>
                <div className="flex gap-2">
                  {(['UPI', 'CASH', 'CARD', 'STORE_CREDIT'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefundMethod(m)}
                      className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                        refundMethod === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalSale(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                >
                  Process Credit Note & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
