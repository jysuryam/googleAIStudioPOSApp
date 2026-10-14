import React, { useState } from 'react';
import {
  Supplier,
  PurchaseOrder,
  Product,
  BusinessConfig,
  User,
  PurchaseItem,
  INDIAN_STATES,
} from '../../types';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface PurchasesViewProps {
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  products: Product[];
  business: BusinessConfig;
  currentUser: User;
  onReceivePO: (poId: string) => { success: boolean; error?: string };
  onCreatePO: (po: PurchaseOrder) => void;
  onAddSupplier: (sup: Supplier) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  suppliers,
  purchases,
  products,
  business,
  currentUser,
  onReceivePO,
  onCreatePO,
  onAddSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [searchQuery, setSearchQuery] = useState('');

  // New PO Modal
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);
  const [poNotes, setPoNotes] = useState('');
  const [poError, setPoError] = useState('');

  // New Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierStateCode, setNewSupplierStateCode] = useState('27');
  const [newSupplierGstin, setNewSupplierGstin] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');

  const canManage =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'MANAGER' ||
    currentUser.role === 'INVENTORY_MANAGER';

  // Add line to PO
  const handleAddPoLine = () => {
    if (products.length === 0) return;
    setPoItems((prev) => [
      ...prev,
      { productId: products[0].id, quantity: 10, unitCost: products[0].costPrice },
    ]);
  };

  const handleUpdatePoLine = (index: number, field: string, val: any) => {
    setPoItems((prev) => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        updated[index] = {
          ...updated[index],
          productId: val,
          unitCost: prod?.costPrice || updated[index].unitCost,
        };
      } else {
        (updated[index] as any)[field] = val;
      }
      return updated;
    });
  };

  const handleRemovePoLine = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit PO (with Indian CGST/SGST vs IGST)
  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      setPoError('Please add at least one line item to the purchase order.');
      return;
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    const isInterState = sup ? sup.stateCode !== business.stateCode : false;

    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const items: PurchaseItem[] = poItems.map((pi) => {
      const prod = products.find((p) => p.id === pi.productId)!;
      const lineSub = pi.unitCost * pi.quantity;
      let lineCgst = 0;
      let lineSgst = 0;
      let lineIgst = 0;

      if (isInterState) {
        lineIgst = Number(((lineSub * prod.taxRate) / 100).toFixed(2));
        igstAmount += lineIgst;
      } else {
        lineCgst = Number(((lineSub * (prod.taxRate / 2)) / 100).toFixed(2));
        lineSgst = Number(((lineSub * (prod.taxRate / 2)) / 100).toFixed(2));
        cgstAmount += lineCgst;
        sgstAmount += lineSgst;
      }

      subtotal += lineSub;
      const lineTax = isInterState ? lineIgst : lineCgst + lineSgst;

      return {
        productId: prod.id,
        productName: prod.productName,
        sku: prod.sku,
        hsnCode: prod.hsnCode || '0000',
        quantity: pi.quantity,
        unitCost: pi.unitCost,
        taxRate: prod.taxRate,
        cgstAmount: lineCgst,
        sgstAmount: lineSgst,
        igstAmount: lineIgst,
        lineTotal: lineSub + lineTax,
      };
    });

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = subtotal + totalTax;

    const newPO: PurchaseOrder = {
      id: 'po-' + Date.now(),
      purchaseNumber: 'PO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900),
      supplierId: selectedSupplierId,
      supplierName: sup?.supplierName || 'Unknown Supplier',
      purchaseDate: new Date().toISOString(),
      status: 'PENDING',
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount: totalTax,
      totalAmount,
      paidAmount: totalAmount,
      notes: poNotes,
      items,
      createdBy: currentUser.fullName,
    };

    onCreatePO(newPO);
    setIsPoModalOpen(false);
    setPoItems([]);
    setPoNotes('');
  };

  // Save Supplier with GSTIN & Indian State
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    const stateObj = INDIAN_STATES.find((s) => s.code === newSupplierStateCode);

    const sup: Supplier = {
      id: 'sup-' + Date.now(),
      supplierName: newSupplierName,
      phone: newSupplierPhone,
      email: newSupplierEmail,
      address: newSupplierAddress,
      state: stateObj?.name || 'Maharashtra',
      stateCode: newSupplierStateCode,
      gstin: newSupplierGstin.toUpperCase().trim(),
      contactPerson: newSupplierContact,
      active: true,
    };

    onAddSupplier(sup);
    setIsSupplierModalOpen(false);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierEmail('');
    setNewSupplierAddress('');
    setNewSupplierGstin('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Bar */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Suppliers & Purchase Order Management
            </h1>
            <p className="text-xs text-slate-500">
              Procurement, incoming goods verification, and supplier invoice tracking
            </p>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              {activeTab === 'purchases' ? (
                <button
                  onClick={() => {
                    setIsPoModalOpen(true);
                    setPoItems([{ productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.costPrice || 0 }]);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Supplier</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit text-xs font-semibold">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'purchases'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Orders ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'purchases' ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {po.purchaseNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {po.supplierName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(po.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {po.items.length} items ({po.items.reduce((s, i) => s + i.quantity, 0)} units)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${po.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            po.status === 'RECEIVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{po.createdBy}</td>
                      <td className="py-3 px-4 text-right">
                        {po.status === 'PENDING' && canManage && (
                          <button
                            onClick={() => onReceivePO(po.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                          >
                            Receive Goods
                          </button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="text-[11px] text-slate-400 font-medium">Stock Received</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{sup.supplierName}</h3>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">Active</span>
                </div>
                <p className="text-slate-500">Contact: <strong className="text-slate-700">{sup.contactPerson}</strong></p>
                <p className="text-slate-500">Phone: {sup.phone}</p>
                <p className="text-slate-500">Email: {sup.email}</p>
                <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-100">{sup.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Purchase Order Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Supplier Purchase Order</h3>
                <p className="text-xs text-slate-500">Order inventory goods to restock warehouse</p>
              </div>
              <button onClick={() => setIsPoModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {poError && (
              <div className="px-6 py-2 bg-rose-50 text-rose-700 text-xs border-b border-rose-200">
                {poError}
              </div>
            )}

            <form onSubmit={handleSavePO} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierName} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Order Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddPoLine}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdatePoLine(index, 'productId', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productName} ({p.sku})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdatePoLine(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Cost:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) => handleUpdatePoLine(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-right bg-white border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePoLine(index)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Purchase Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Delivery terms, batch details, expected shipment date..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add New Supplier</h3>
            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Contact Person</label>
                <input
                  type="text"
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">State of Supply *</label>
                  <select
                    value={newSupplierStateCode}
                    onChange={(e) => setNewSupplierStateCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Supplier GSTIN (15-digit)</label>
                  <input
                    type="text"
                    value={newSupplierGstin}
                    onChange={(e) => setNewSupplierGstin(e.target.value)}
                    placeholder="e.g. 27AABCS1234F1Z8"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Address</label>
                <textarea
                  rows={2}
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
