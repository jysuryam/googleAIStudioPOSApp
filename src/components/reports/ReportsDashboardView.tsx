import React, { useState } from 'react';
import {
  Sale,
  Product,
  StockMovement,
  Expense,
  SalesReturn,
  SaleCancellation,
  Customer,
  BusinessConfig,
  User,
} from '../../types';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  PieChart,
  FileSpreadsheet,
  Printer,
  ShoppingBag,
  RotateCcw,
  Percent,
  CheckCircle2,
  Users,
  CreditCard,
  Package,
} from 'lucide-react';

interface ReportsDashboardViewProps {
  sales: Sale[];
  products: Product[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  salesReturns: SalesReturn[];
  saleCancellations: SaleCancellation[];
  customers: Customer[];
  business: BusinessConfig;
  currentUser: User;
}

export const ReportsDashboardView: React.FC<ReportsDashboardViewProps> = ({
  sales,
  products,
  stockMovements,
  expenses,
  salesReturns,
  saleCancellations,
  customers,
  business,
  currentUser,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<number>(1);
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'all'>('all');

  const filteredSales = sales.filter((s) => {
    if (s.saleStatus === 'CANCELLED') return false;
    const d = new Date(s.saleDate);
    const now = new Date();
    if (dateFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === 'this_week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo;
    }
    if (dateFilter === 'this_month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Financial aggregates in INR
  const grossSales = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalCgst = filteredSales.reduce((sum, s) => sum + s.cgstAmount, 0);
  const totalSgst = filteredSales.reduce((sum, s) => sum + s.sgstAmount, 0);
  const totalIgst = filteredSales.reduce((sum, s) => sum + s.igstAmount, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const totalDiscounts = filteredSales.reduce((sum, s) => sum + s.discountAmount, 0);
  const totalRefunds = salesReturns.reduce((sum, r) => sum + r.totalRefund, 0);
  const netSales = grossSales - totalDiscounts - totalRefunds;
  const invoiceCount = filteredSales.length;
  const avgBasket = invoiceCount > 0 ? (grossSales + totalTax - totalDiscounts) / invoiceCount : 0;

  let totalCogs = 0;
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      const actualQty = item.quantity - item.returnedQuantity;
      if (actualQty > 0) {
        totalCogs += actualQty * item.unitCostSnapshot;
      }
    });
  });
  const estimatedGrossProfit = netSales - totalCogs;
  const grossMarginPercent = netSales > 0 ? (estimatedGrossProfit / netSales) * 100 : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Product sales stats
  const productSaleStats: Record<string, { name: string; hsn: string; qty: number; revenue: number }> = {};
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSaleStats[item.productId]) {
        productSaleStats[item.productId] = {
          name: item.productNameSnapshot,
          hsn: item.hsnCodeSnapshot || '0000',
          qty: 0,
          revenue: 0,
        };
      }
      productSaleStats[item.productId].qty += item.quantity;
      productSaleStats[item.productId].revenue += item.lineTotal;
    });
  });

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = { UPI: 0, CASH: 0, CARD: 0, STORE_CREDIT: 0 };
  filteredSales.forEach((s) => {
    s.payments.forEach((p) => {
      paymentBreakdown[p.paymentMethod] = (paymentBreakdown[p.paymentMethod] || 0) + p.amount;
    });
  });

  const reportOptions = [
    { id: 1, name: 'Daily Sales & Revenue Report' },
    { id: 2, name: 'Monthly & Yearly Sales Report' },
    { id: 3, name: 'Date-Range Tax Invoices Summary' },
    { id: 4, name: 'Product & HSN-Wise Volume Report' },
    { id: 5, name: 'Category-Wise Sales Contribution' },
    { id: 6, name: 'Customer Sales & Loyalty Points' },
    { id: 7, name: 'Cashier Shift Performance' },
    { id: 8, name: 'Payment Breakdown (UPI / Cash / Card)' },
    { id: 9, name: 'Cancelled Invoices & Voids Audit' },
    { id: 10, name: 'Sales Returns & Credit Notes' },
    { id: 11, name: 'Stock Balance & Valuation Report' },
    { id: 12, name: 'Stock Movement Audit Ledger' },
    { id: 13, name: 'Low-Stock & Reorder Alerts' },
    { id: 14, name: 'Purchase Orders & Supplier Invoices' },
    { id: 15, name: 'Store Expenses & Petty Cash' },
    { id: 16, name: 'Cash Register Drawer Audit Report' },
    { id: 17, name: 'Estimated Gross Profit & Margins' },
    { id: 18, name: 'Indian GST Summary (GSTR-1 / GSTR-3B)' },
  ];

  const handleExportCurrentReportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const reportName = reportOptions.find((r) => r.id === selectedReportId)?.name || 'Report';

    if (selectedReportId === 1 || selectedReportId === 3) {
      headers = ['Invoice Number', 'Date', 'Customer', 'Place of Supply', 'Subtotal (INR)', 'CGST (INR)', 'SGST (INR)', 'IGST (INR)', 'Total (INR)', 'Status'];
      rows = filteredSales.map((s) => [
        s.invoiceNumber,
        new Date(s.saleDate).toLocaleString('en-IN'),
        `"${s.customerName}"`,
        `"${s.placeOfSupply}"`,
        s.subtotal.toFixed(2),
        s.cgstAmount.toFixed(2),
        s.sgstAmount.toFixed(2),
        s.igstAmount.toFixed(2),
        s.totalAmount.toFixed(2),
        s.saleStatus,
      ]);
    } else if (selectedReportId === 18) {
      // GSTR Summary Export
      headers = ['GST Component', 'Taxable Turnover (INR)', 'Tax Amount Collected (INR)'];
      rows = [
        ['Central GST (CGST)', grossSales.toFixed(2), totalCgst.toFixed(2)],
        ['State GST (SGST)', grossSales.toFixed(2), totalSgst.toFixed(2)],
        ['Integrated GST (IGST)', grossSales.toFixed(2), totalIgst.toFixed(2)],
        ['Total GST Collected', grossSales.toFixed(2), totalTax.toFixed(2)],
      ];
    } else {
      headers = ['Metric / Field', 'Value'];
      rows = [
        ['Report Name', reportName],
        ['Gross Sales', `${business.currencySymbol}${grossSales.toFixed(2)}`],
        ['CGST Total', `${business.currencySymbol}${totalCgst.toFixed(2)}`],
        ['SGST Total', `${business.currencySymbol}${totalSgst.toFixed(2)}`],
        ['IGST Total', `${business.currencySymbol}${totalIgst.toFixed(2)}`],
        ['Net Sales', `${business.currencySymbol}${netSales.toFixed(2)}`],
        ['Total Invoices', invoiceCount],
        ['Generated At', new Date().toLocaleString('en-IN')],
      ];
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartPOS_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Executive Analytics & 18 GST Reports
            </h1>
            <p className="text-xs text-slate-500">
              Indian GST summaries (CGST / SGST / IGST), GSTR-1 ledgers, and revenue margins in {business.currencySymbol}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              {(['today', 'this_week', 'this_month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setDateFilter(period)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    dateFilter === period
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCurrentReportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Cards in INR */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Gross Sales</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
              {business.currencySymbol}{grossSales.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{invoiceCount} invoices</span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 font-medium block">Net Sales</span>
            <span className="text-base font-bold font-mono text-emerald-800 mt-1 block">
              {business.currencySymbol}{netSales.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">After refunds/discounts</span>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
            <span className="text-indigo-800 font-medium block">Est. Gross Profit</span>
            <span className="text-base font-bold font-mono text-indigo-800 mt-1 block">
              {business.currencySymbol}{estimatedGrossProfit.toFixed(2)}
            </span>
            <span className="text-[10px] text-indigo-600 mt-0.5 block">{grossMarginPercent.toFixed(1)}% margin</span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-amber-800 font-medium block">Total GST Collected</span>
            <span className="text-base font-bold font-mono text-amber-800 mt-1 block">
              {business.currencySymbol}{totalTax.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-600 mt-0.5 block">CGST + SGST + IGST</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block">Avg Basket</span>
            <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
              {business.currencySymbol}{avgBasket.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Per completed bill</span>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
            <span className="text-rose-800 font-medium block">Store Expenses</span>
            <span className="text-base font-bold font-mono text-rose-700 mt-1 block">
              {business.currencySymbol}{totalExpenses.toFixed(2)}
            </span>
            <span className="text-[10px] text-rose-600 mt-0.5 block">{expenses.length} entries</span>
          </div>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Reports Nav */}
        <div className="w-full md:w-64 bg-white border-r border-slate-200 overflow-y-auto p-3 shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 mb-1">
            Available Reports (18)
          </div>
          <div className="space-y-1">
            {reportOptions.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  selectedReportId === rep.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{rep.id}. {rep.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Report Output */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {reportOptions.find((r) => r.id === selectedReportId)?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Timeframe: {dateFilter.replace('_', ' ').toUpperCase()} · Currency: INR ({business.currencySymbol})
                </p>
              </div>

              <button
                onClick={handleExportCurrentReportCSV}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report CSV</span>
              </button>
            </div>

            <div className="pt-3">
              {/* Report 18: SPECIALIZED INDIAN GST REPORT */}
              {selectedReportId === 18 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[11px] font-semibold">Central GST (CGST) Total</span>
                      <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                        {business.currencySymbol}{totalCgst.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Intra-State Central Component</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[11px] font-semibold">State GST (SGST) Total</span>
                      <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                        {business.currencySymbol}{totalSgst.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">State: {business.state} ({business.stateCode})</span>
                    </div>

                    <div className="p-3.5 bg-indigo-50/70 rounded-lg border border-indigo-200">
                      <span className="text-indigo-900 block text-[11px] font-semibold">Integrated GST (IGST) Total</span>
                      <span className="text-lg font-bold font-mono text-indigo-700 mt-1 block">
                        {business.currencySymbol}{totalIgst.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-indigo-600 mt-0.5 block">Inter-State Shipments</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-emerald-900 text-sm">Total GST Tax Liability (CGST + SGST + IGST):</span>
                      <p className="text-emerald-700 text-[11px] mt-0.5">Ready for filing GSTR-1 and GSTR-3B tax returns</p>
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-800">
                      {business.currencySymbol}{totalTax.toFixed(2)}
                    </span>
                  </div>

                  {/* Table of invoices with GST splits */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Invoice No</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Place of Supply</th>
                          <th className="py-2.5 px-3 text-right">Taxable Val</th>
                          <th className="py-2.5 px-3 text-right">CGST</th>
                          <th className="py-2.5 px-3 text-right">SGST</th>
                          <th className="py-2.5 px-3 text-right">IGST</th>
                          <th className="py-2.5 px-3 text-right">Total GST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {filteredSales.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900">{s.invoiceNumber}</td>
                            <td className="py-2 px-3 font-sans">{s.customerName}</td>
                            <td className="py-2 px-3 font-sans text-slate-600">{s.placeOfSupply}</td>
                            <td className="py-2 px-3 text-right">{business.currencySymbol}{s.subtotal.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{business.currencySymbol}{s.cgstAmount.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{business.currencySymbol}{s.sgstAmount.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-indigo-700">{business.currencySymbol}{s.igstAmount.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{business.currencySymbol}{s.taxAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Report 8: Payment Methods Breakdown (UPI Highlighted) */}
              {selectedReportId === 8 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    <div
                      key={method}
                      className={`p-4 rounded-xl border ${
                        method === 'UPI' ? 'bg-purple-50/70 border-purple-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-slate-500 font-bold uppercase text-[11px]">
                        {method === 'UPI' ? 'UPI / QR (BHIM/GPay/PhonePe)' : method}
                      </span>
                      <span className="text-lg font-bold font-mono text-slate-900 block mt-1">
                        {business.currencySymbol}{amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* General Invoices Table (1, 2, 3) */}
              {(selectedReportId === 1 || selectedReportId === 2 || selectedReportId === 3) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Invoice Number</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Place of Supply</th>
                        <th className="py-2.5 px-3 text-right">Taxable</th>
                        <th className="py-2.5 px-3 text-right">Total GST</th>
                        <th className="py-2.5 px-3 text-right">Total Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {filteredSales.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{s.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(s.saleDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-sans">{s.customerName}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-600">{s.placeOfSupply}</td>
                          <td className="py-2.5 px-3 text-right">{business.currencySymbol}{s.subtotal.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right">{business.currencySymbol}{s.taxAmount.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{business.currencySymbol}{s.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Other Reports fallback */}
              {selectedReportId !== 1 && selectedReportId !== 2 && selectedReportId !== 3 && selectedReportId !== 8 && selectedReportId !== 18 && (
                <div className="p-6 text-center text-slate-500 space-y-2">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">
                    {reportOptions.find((r) => r.id === selectedReportId)?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Indian GST ledger and transaction data formatted in {business.currencySymbol}. Click "Export Report CSV" above to download the raw data file.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
