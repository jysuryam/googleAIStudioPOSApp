import React, { useState } from 'react';
import { Customer, BusinessConfig, User, Sale, INDIAN_STATES } from '../../types';
import { Users, Plus, Search, Award, Phone, Mail, MapPin, Building } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  sales: Sale[];
  business: BusinessConfig;
  currentUser: User;
  onAddCustomer: (cust: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  sales,
  business,
  currentUser,
  onAddCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('27'); // Default Maharashtra
  const [gstin, setGstin] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchCode = c.customerCode.toLowerCase().includes(q);
      const matchGstin = c.gstin?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCode && !matchGstin) return false;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const stateObj = INDIAN_STATES.find((s) => s.code === selectedStateCode);

    const newCustomer: Customer = {
      id: 'cust-' + Date.now(),
      customerCode: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
      customerName: name,
      phone,
      email,
      address,
      state: stateObj?.name || 'Maharashtra',
      stateCode: selectedStateCode,
      gstin: gstin.toUpperCase().trim(),
      loyaltyPoints: 0,
      creditBalance: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCustomer);
    setIsModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstin('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Customer Master & GSTIN Directory
          </h1>
          <p className="text-xs text-slate-500">
            Manage Indian B2C & B2B customers, state of supply, and loyalty points
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, GSTIN, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const customerSales = sales.filter((s) => s.customerId === cust.id && s.saleStatus !== 'CANCELLED');
            const totalSpent = customerSales.reduce((acc, s) => acc + s.totalAmount, 0);
            const isInterState = cust.stateCode !== business.stateCode;

            return (
              <div key={cust.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cust.customerName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400">{cust.customerCode}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${isInterState ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {cust.state} ({cust.stateCode}) · {isInterState ? 'IGST' : 'CGST+SGST'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{cust.loyaltyPoints} pts</span>
                  </div>
                </div>

                {cust.gstin && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Registered GSTIN (B2B)</span>
                    <span className="font-mono font-bold text-slate-800 tracking-wider">{cust.gstin}</span>
                  </div>
                )}

                <div className="space-y-1 text-slate-600 text-[11px]">
                  {cust.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cust.address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                  <span>Purchases: <strong className="text-slate-800">{customerSales.length} bills</strong></span>
                  <span className="font-mono font-bold text-emerald-700">Total: {business.currencySymbol}{totalSpent.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Add New Indian Customer</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Customer Name / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  placeholder="e.g. Rahul Sharma or ABC Retailers Pvt Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Phone (Mobile)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    placeholder="+91 98200 00000"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Customer State (Place of Supply) *</label>
                  <select
                    value={selectedStateCode}
                    onChange={(e) => setSelectedStateCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">GSTIN (Optional for B2C, Required for B2B Tax Credit)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                  placeholder="e.g. 27AAACA9812M1Z2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  placeholder="customer@domain.in"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Billing Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                  placeholder="Street, City, Pincode"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
