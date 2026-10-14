import React, { useState } from 'react';
import {
  CashRegisterSession,
  Expense,
  ExpenseCategory,
  BusinessConfig,
  User,
} from '../../types';
import {
  DollarSign,
  Plus,
  Lock,
  Unlock,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface CashRegisterViewProps {
  session: CashRegisterSession;
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  business: BusinessConfig;
  currentUser: User;
  onOpenSession: (floatAmount: number, notes?: string) => void;
  onCloseSession: (countedAmount: number, notes?: string) => void;
  onAddExpense: (payload: {
    expenseCategoryId: string;
    description: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'UPI';
  }) => void;
}

export const CashRegisterView: React.FC<CashRegisterViewProps> = ({
  session,
  expenses,
  expenseCategories,
  business,
  currentUser,
  onOpenSession,
  onCloseSession,
  onAddExpense,
}) => {
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [openFloat, setOpenFloat] = useState<number>(2000.0);
  const [openNotes, setOpenNotes] = useState('2x₹500, 5x₹100, 10x₹50 float count verified');

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCatId, setExpenseCatId] = useState(expenseCategories[0]?.id || '');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');

  const expectedDrawerCash =
    session.openingBalance + session.cashSalesTotal - session.cashPayoutTotal;

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSession(openFloat, openNotes);
    setIsOpenModalOpen(false);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseSession(countedCash, closeNotes);
    setIsCloseModalOpen(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDesc.trim()) return;

    onAddExpense({
      expenseCategoryId: expenseCatId,
      description: expenseDesc,
      amount: expenseAmount,
      paymentMethod: expensePaymentMethod,
    });

    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    setExpenseAmount(0);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Cash Register Drawer & Petty Cash Expenses ({business.currencySymbol})
          </h1>
          <p className="text-xs text-slate-500">
            Monitor drawer cash float, cash sales, paid-out expenses, and shift closing reconciliations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session.status === 'OPEN' ? (
            <>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record Store Expense</span>
              </button>

              <button
                onClick={() => {
                  setCountedCash(expectedDrawerCash);
                  setIsCloseModalOpen(true);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Close Register Drawer</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>Open New Cash Drawer Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  session.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <h2 className="text-sm font-bold text-slate-900">
                Register Drawer Session: {session.status}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Cashier: <strong className="text-slate-800">{session.cashierName}</strong> · Opened: {new Date(session.openedAt).toLocaleTimeString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block font-medium">Opening Cash Float</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {business.currencySymbol}{session.openingBalance.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-emerald-800 block font-medium">+ Cash Sales Collected</span>
              <span className="text-lg font-bold font-mono text-emerald-700 mt-1 block">
                {business.currencySymbol}{session.cashSalesTotal.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
              <span className="text-rose-800 block font-medium">- Cash Payouts / Expenses</span>
              <span className="text-lg font-bold font-mono text-rose-700 mt-1 block">
                {business.currencySymbol}{session.cashPayoutTotal.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-lg">
              <span className="text-slate-400 block font-medium">Expected Drawer Cash</span>
              <span className="text-lg font-bold font-mono text-white mt-1 block">
                {business.currencySymbol}{expectedDrawerCash.toFixed(2)}
              </span>
            </div>
          </div>

          {session.notes && (
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <strong>Session Log:</strong> {session.notes}
            </p>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Store Expenses & Petty Cash Log ({expenses.length} records)
            </h3>
            <span className="text-xs font-bold font-mono text-slate-700">
              Total Expenses: {business.currencySymbol}
              {expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Expense Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Authorized By</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expense transactions recorded today.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(exp.expenseDate).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {exp.categoryName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {exp.description}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{exp.createdBy}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                        -{business.currencySymbol}{exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Open Session Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Open Register Session</h3>
            <form onSubmit={handleOpenSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Starting Cash Float ({business.currencySymbol}) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={openFloat}
                  onChange={(e) => setOpenFloat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Opening Denominations / Note</label>
                <textarea
                  rows={2}
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="e.g. 2x₹500, 5x₹100, 10x₹50 float count verified..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  Confirm & Open Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Close Cash Drawer & Reconcile</h3>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Expected Drawer Cash:</span>
                <span className="font-mono font-bold text-slate-800">
                  {business.currencySymbol}{expectedDrawerCash.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                <span>Discrepancy:</span>
                <span
                  className={`font-mono ${
                    countedCash - expectedDrawerCash === 0
                      ? 'text-emerald-700'
                      : countedCash - expectedDrawerCash > 0
                      ? 'text-blue-700'
                      : 'text-rose-700'
                  }`}
                >
                  {countedCash - expectedDrawerCash > 0 ? '+' : ''}
                  {business.currencySymbol}{(countedCash - expectedDrawerCash).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Actual Physically Counted Cash ({business.currencySymbol}) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Closing Notes</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. End of shift drawer count completed..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                >
                  Close & Reconcile Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Record Store Expense</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Expense Category</label>
                <select
                  value={expenseCatId}
                  onChange={(e) => setExpenseCatId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Amount ({business.currencySymbol}) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Payment Method</label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="CASH">Cash (Deducts from Drawer)</option>
                  <option value="UPI">UPI / Store Account</option>
                  <option value="CARD">Company Card</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Description / Receipt Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 rolls thermal paper purchase..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
