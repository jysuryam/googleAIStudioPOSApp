import React, { useState } from 'react';
import { Sale, BusinessConfig } from '../../types';
import { ThermalReceipt } from './ThermalReceipt';
import { Printer, Download, Code, X, Check, Copy, QrCode } from 'lucide-react';
import { SquareQRCode } from '../common/SquareQRCode';

interface ReceiptModalProps {
  sale: Sale;
  business: BusinessConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  business,
  isOpen,
  onClose,
}) => {
  const [selectedWidth, setSelectedWidth] = useState<'58mm' | '80mm' | 'A4'>(
    business.defaultReceiptWidth || '80mm'
  );
  const [showJrxml, setShowJrxml] = useState(false);
  const [copiedJrxml, setCopiedJrxml] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoiceTxt = () => {
    const textContent = `
==================================================
                 TAX INVOICE
       ${business.businessName.toUpperCase()}
       ${business.address}, ${business.city}
       State: ${business.state} (${business.stateCode})
       GSTIN: ${business.gstin}
       FSSAI: ${business.fssaiNumber || 'N/A'}
==================================================
Invoice:      ${sale.invoiceNumber}
Date:         ${new Date(sale.saleDate).toLocaleString('en-IN')}
Place of Sup: ${sale.placeOfSupply}
Cashier:      ${sale.cashierName}
Customer:     ${sale.customerName}
Cust GSTIN:   ${sale.customerGstin || 'Unregistered'}
--------------------------------------------------
Item                  HSN       Qty   Rate   Total
--------------------------------------------------
${sale.items
  .map(
    (i) =>
      `${i.productNameSnapshot.slice(0, 18).padEnd(19)} ${(i.hsnCodeSnapshot || '0000').padEnd(9)} ${String(i.quantity).padStart(3)} ${i.unitPrice
        .toFixed(2)
        .padStart(6)} ${i.lineTotal.toFixed(2).padStart(7)}`
  )
  .join('\n')}
--------------------------------------------------
Taxable Value:              ${business.currencySymbol}${sale.subtotal.toFixed(2)}
${
  sale.isInterState
    ? `Integrated GST (IGST):     ${business.currencySymbol}${sale.igstAmount.toFixed(2)}`
    : `Central GST (CGST):        ${business.currencySymbol}${sale.cgstAmount.toFixed(2)}
State GST (SGST):          ${business.currencySymbol}${sale.sgstAmount.toFixed(2)}`
}
${sale.discountAmount > 0 ? `Discount:                 -${business.currencySymbol}${sale.discountAmount.toFixed(2)}\n` : ''}Round Off:                 ${business.currencySymbol}${(sale.roundOffAmount || 0).toFixed(2)}
GRAND TOTAL:               ${business.currencySymbol}${sale.totalAmount.toFixed(2)}
--------------------------------------------------
${sale.payments.map((p) => `Paid via ${p.paymentMethod.padEnd(12)}:     ${business.currencySymbol}${p.amount.toFixed(2)}`).join('\n')}
${sale.changeAmount > 0 ? `Change Returned:           ${business.currencySymbol}${sale.changeAmount.toFixed(2)}\n` : ''}==================================================
Certified that particulars given above are true.
${business.returnPolicy}
${business.receiptFooter}
==================================================
    `;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Invoice_${sale.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sampleJrxml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- SmartPOS Indian GST Tax Invoice Template (JasperReports) -->
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
              name="gst_tax_invoice_${selectedWidth}"
              pageWidth="${selectedWidth === '58mm' ? '164' : selectedWidth === '80mm' ? '226' : '595'}"
              pageHeight="842"
              columnWidth="${selectedWidth === '58mm' ? '144' : selectedWidth === '80mm' ? '206' : '555'}"
              leftMargin="10" rightMargin="10" topMargin="10" bottomMargin="10"
              isIgnorePagination="true">

  <parameter name="STORE_NAME" class="java.lang.String"/>
  <parameter name="STORE_GSTIN" class="java.lang.String"/>
  <parameter name="PLACE_OF_SUPPLY" class="java.lang.String"/>
  <parameter name="INVOICE_NUMBER" class="java.lang.String"/>
  <parameter name="CGST_TOTAL" class="java.math.BigDecimal"/>
  <parameter name="SGST_TOTAL" class="java.math.BigDecimal"/>
  <parameter name="IGST_TOTAL" class="java.math.BigDecimal"/>
  <parameter name="TOTAL_AMOUNT" class="java.math.BigDecimal"/>

  <field name="productName" class="java.lang.String"/>
  <field name="hsnCode" class="java.lang.String"/>
  <field name="quantity" class="java.math.BigDecimal"/>
  <field name="unitPrice" class="java.math.BigDecimal"/>
  <field name="lineTotal" class="java.math.BigDecimal"/>

  <title>
    <band height="65" splitType="Stretch">
      <textField>
        <reportElement x="0" y="0" width="${selectedWidth === '58mm' ? '144' : '206'}" height="14"/>
        <textElement textAlignment="Center"><font size="8" isBold="true"/></textElement>
        <textFieldExpression><![CDATA["TAX INVOICE - " + $P{STORE_NAME}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="16" width="${selectedWidth === '58mm' ? '144' : '206'}" height="12"/>
        <textElement textAlignment="Center"><font size="7"/></textElement>
        <textFieldExpression><![CDATA["GSTIN: " + $P{STORE_GSTIN}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="30" width="${selectedWidth === '58mm' ? '144' : '206'}" height="12"/>
        <textElement textAlignment="Center"><font size="7"/></textElement>
        <textFieldExpression><![CDATA["Inv: " + $P{INVOICE_NUMBER} + " | POS: " + $P{PLACE_OF_SUPPLY}]]></textFieldExpression>
      </textField>
    </band>
  </title>
</jasperReport>`;

  const copyJrxml = () => {
    navigator.clipboard.writeText(sampleJrxml);
    setCopiedJrxml(true);
    setTimeout(() => setCopiedJrxml(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  GST Tax Invoice Receipt
                </h2>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                  {sale.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {sale.invoiceNumber} · {sale.placeOfSupply}
              </p>
            </div>
          </div>

          {/* Width Selector Segmented Controls */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedWidth('58mm')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedWidth === '58mm'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm Roll
            </button>
            <button
              onClick={() => setSelectedWidth('80mm')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedWidth === '80mm'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm Roll
            </button>
            <button
              onClick={() => setSelectedWidth('A4')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedWidth === 'A4'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Invoice
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpiModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
              title="Show Dynamic UPI QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI QR</span>
            </button>

            <button
              onClick={() => setShowJrxml(!showJrxml)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                showJrxml
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="View JasperReports JRXML template"
            >
              <Code className="w-3.5 h-3.5" />
              <span>JRXML</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 flex justify-center">
          {showJrxml ? (
            <div className="w-full max-w-2xl bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto relative">
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-800 text-slate-400">
                <span>Template: gst_tax_invoice_{selectedWidth}.jrxml</span>
                <button
                  onClick={copyJrxml}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  {copiedJrxml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJrxml ? 'Copied' : 'Copy JRXML'}</span>
                </button>
              </div>
              <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                {sampleJrxml}
              </pre>
            </div>
          ) : (
            <div className="shadow-lg border border-slate-200 rounded-lg overflow-hidden bg-white">
              <ThermalReceipt
                sale={sale}
                business={business}
                receiptWidth={selectedWidth}
              />
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Compliant with Indian GST Section 31 rules. Target roll:{' '}
            <strong className="text-slate-800">{selectedWidth}</strong>.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadInvoiceTxt}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Text Invoice</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print {selectedWidth}</span>
            </button>
          </div>
        </div>
      </div>

      {/* UPI QR Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full p-6 text-center space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Scan UPI QR to Pay</h3>
            <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
              <SquareQRCode
                value={`upi://pay?pa=${business.upiId || 'naturaretail@okhdfcbank'}&pn=${encodeURIComponent(business.businessName)}&am=${sale.totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + sale.invoiceNumber)}`}
                size={180}
                label="BHIM / PhonePe / GPay / Paytm"
              />
            </div>
            <div>
              <p className="font-bold font-mono text-base text-slate-900">
                {business.currencySymbol}{sale.totalAmount.toFixed(2)}
              </p>
              <p className="text-[11px] font-mono text-purple-700 mt-0.5">
                {business.upiId}
              </p>
            </div>
            <button
              onClick={() => setShowUpiModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
