import React, { useState } from 'react';
import { BusinessConfig, User, INDIAN_STATES } from '../../types';
import {
  Building2,
  Printer,
  DollarSign,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  Sliders,
  QrCode,
  FileCheck,
} from 'lucide-react';

interface SettingsViewProps {
  business: BusinessConfig;
  currentUser: User;
  onUpdateBusiness: (updated: BusinessConfig) => void;
  onResetFactory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  business,
  currentUser,
  onUpdateBusiness,
  onResetFactory,
}) => {
  const [formData, setFormData] = useState<BusinessConfig>({ ...business });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  const handleChange = (field: keyof BusinessConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (stateCode: string) => {
    const matched = INDIAN_STATES.find((s) => s.code === stateCode);
    setFormData((prev) => ({
      ...prev,
      stateCode,
      state: matched?.name || prev.state,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusiness(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetConfirm = () => {
    if (window.confirm('WARNING: Reset all demo data back to Indian GST factory defaults?')) {
      onResetFactory();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Indian Store Profile, GSTIN & POS Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure GSTIN, State code (Place of Supply), UPI VPA, and thermal receipt parameters
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Changes Saved!' : 'Save GST Configuration'}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-6 text-xs">
        {/* Business & GST Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span>Store Identity & Statutory GSTIN Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store / Firm Trade Name *</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tagline</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store Home State (Place of Business) *</label>
              <select
                disabled={!canEdit}
                value={formData.stateCode}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Goods & Services Tax ID (GSTIN) *</label>
              <input
                type="text"
                maxLength={15}
                disabled={!canEdit}
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold tracking-wider"
                placeholder="e.g. 27AABCN8942Q1Z8"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">PAN Number</label>
              <input
                type="text"
                maxLength={10}
                disabled={!canEdit}
                value={formData.panNumber}
                onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">FSSAI License No. (Food & Grocery)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.fssaiNumber || ''}
                onChange={(e) => handleChange('fssaiNumber', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                placeholder="e.g. 11522004000123"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Registered Address & Pincode</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Telephone Contact</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Billing Support Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* UPI & Currency Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-purple-700" />
            <span>UPI Payments & Currency Configuration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Store UPI VPA / ID (For QR Code)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-purple-800 font-semibold"
                placeholder="storename@okhdfcbank"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Currency Code</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg uppercase font-mono font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Currency Symbol</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-base"
              />
            </div>
          </div>
        </div>

        {/* Thermal Printer Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Thermal Printer Defaults & Receipt Text</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default Receipt Width</label>
              <select
                disabled={!canEdit}
                value={formData.defaultReceiptWidth}
                onChange={(e) => handleChange('defaultReceiptWidth', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="80mm">80mm Thermal Roll (Standard Retail POS)</option>
                <option value="58mm">58mm Thermal Roll (Compact Handheld Bluetooth)</option>
                <option value="A4">A4 Full Sheet GST Tax Invoice</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Timezone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bill Footer Message</label>
            <input
              type="text"
              disabled={!canEdit}
              value={formData.receiptFooter}
              onChange={(e) => handleChange('receiptFooter', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Return & Warranty Policy</label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={formData.returnPolicy}
              onChange={(e) => handleChange('returnPolicy', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Factory Reset */}
        {currentUser.role === 'ADMIN' && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-rose-900 text-sm">Reset System to Indian GST Initial Seed</h3>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Restores standard Indian GST slabs, HSN catalog, and INR sample invoices.
              </p>
            </div>
            <button
              onClick={handleResetConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0"
            >
              Reset to Factory Defaults
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
