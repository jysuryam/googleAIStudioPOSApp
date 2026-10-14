import React from 'react';
import { Sale, BusinessConfig } from '../../types';
import { numberToIndianWords } from '../../utils/formatters';
import { SquareQRCode } from '../common/SquareQRCode';

interface ThermalReceiptProps {
  sale: Sale;
  business: BusinessConfig;
  receiptWidth?: '58mm' | '80mm' | 'A4';
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  sale,
  business,
  receiptWidth = '80mm',
}) => {
  const is58mm = receiptWidth === '58mm';
  const isA4 = receiptWidth === 'A4';

  const containerWidthClass = isA4
    ? 'w-full max-w-3xl p-8 bg-white text-slate-900 border border-slate-200'
    : is58mm
    ? 'w-[290px] p-2.5 bg-white text-slate-900 text-[11px] leading-tight font-mono shadow-sm'
    : 'w-[375px] p-4 bg-white text-slate-900 text-[12px] leading-relaxed font-mono shadow-sm';

  const formattedDate = new Date(sale.saleDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      id="printable-receipt-area"
      className={`mx-auto bg-white transition-all duration-200 ${containerWidthClass}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* HEADER: INDIAN GST TAX INVOICE */}
      <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
        <div className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase mb-1.5 rounded">
          TAX INVOICE
        </div>

        {business.logoPath && (
          <div className="flex justify-center mb-1.5">
            <img
              src={business.logoPath}
              alt={business.businessName}
              referrerPolicy="no-referrer"
              className={`rounded-full object-contain ${
                is58mm ? 'w-9 h-9' : isA4 ? 'w-16 h-16' : 'w-11 h-11'
              }`}
            />
          </div>
        )}

        <h1
          className={`font-bold tracking-tight uppercase ${
            isA4 ? 'text-2xl font-sans' : is58mm ? 'text-xs' : 'text-sm'
          }`}
        >
          {business.businessName}
        </h1>
        {business.tagline && (
          <p className="text-slate-500 text-[10px] mt-0.5">{business.tagline}</p>
        )}
        <p className="text-slate-600 text-[10px] mt-1 whitespace-pre-line leading-tight">
          {business.address}, {business.city} - {business.pincode}
        </p>
        <p className="text-slate-600 text-[10px]">
          State: {business.state} (Code: {business.stateCode}) · Ph: {business.phone}
        </p>

        {/* GSTIN & FSSAI (Statutory Indian identifiers) */}
        <div className="mt-1 pt-1 border-t border-dotted border-slate-200 text-[10px] text-slate-800 space-y-0.5">
          <p className="font-bold">
            GSTIN: <span className="font-mono tracking-wider">{business.gstin}</span>
          </p>
          {business.fssaiNumber && (
            <p className="text-slate-500 text-[9px]">
              FSSAI Lic No: {business.fssaiNumber}
            </p>
          )}
        </div>
      </div>

      {/* METADATA ZONE */}
      <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Invoice No:</span>
          <span className="font-bold tabular-nums">{sale.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date & Time:</span>
          <span className="tabular-nums">{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Place of Supply:</span>
          <span className="font-semibold">{sale.placeOfSupply || `${business.stateCode} - ${business.state}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Customer:</span>
          <span className="font-medium truncate max-w-[190px]">{sale.customerName}</span>
        </div>
        {sale.customerGstin && (
          <div className="flex justify-between text-slate-800 font-semibold">
            <span>Customer GSTIN:</span>
            <span className="font-mono">{sale.customerGstin}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-500">
          <span>Cashier:</span>
          <span>{sale.cashierName}</span>
        </div>
        {sale.saleStatus !== 'COMPLETED' && (
          <div className="flex justify-between text-rose-600 font-bold">
            <span>Status:</span>
            <span>*** {sale.saleStatus} ***</span>
          </div>
        )}
      </div>

      {/* ITEM TABLE WITH HSN CODES */}
      <div className="py-2.5 border-b border-dashed border-slate-300">
        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1 pb-1 border-b border-slate-200">
          <span className="w-5/12">Item / HSN</span>
          <span className="w-2/12 text-center">Qty</span>
          <span className="w-2/12 text-right">Rate</span>
          <span className="w-3/12 text-right">Total</span>
        </div>

        <div className="space-y-1.5">
          {sale.items.map((item, idx) => (
            <div key={item.id || idx} className="text-[11px]">
              <div className="font-medium text-slate-800 break-words leading-tight">
                {item.productNameSnapshot}
              </div>
              {item.displayUom && (
                <div className="text-[9px] font-medium text-slate-600 bg-slate-100 inline-block px-1 py-0.5 rounded mt-0.5">
                  {item.displayUom}
                </div>
              )}
              <div className="flex justify-between text-slate-600 tabular-nums text-[10px] mt-0.5">
                <span className="w-5/12 text-slate-500 font-mono text-[9px] truncate">
                  HSN: {item.hsnCodeSnapshot || '0000'}
                </span>
                <span className="w-2/12 text-center font-medium">
                  {item.quantity}
                  {item.returnedQuantity > 0 && (
                    <span className="text-rose-500 text-[9px]"> (-{item.returnedQuantity})</span>
                  )}
                </span>
                <span className="w-2/12 text-right">
                  {business.currencySymbol}{item.unitPrice.toFixed(2)}
                </span>
                <span className="w-3/12 text-right font-medium text-slate-900">
                  {business.currencySymbol}{item.lineTotal.toFixed(2)}
                </span>
              </div>
              {item.discountAmount > 0 && (
                <div className="text-[9px] text-emerald-600 text-right">
                  - Disc {business.currencySymbol}{item.discountAmount.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STATUTORY GST TAX BREAKDOWN (CGST + SGST or IGST) */}
      <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px] tabular-nums">
        <div className="flex justify-between text-slate-600">
          <span>Taxable Subtotal:</span>
          <span>{business.currencySymbol}{sale.subtotal.toFixed(2)}</span>
        </div>

        {sale.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Special Discount:</span>
            <span>-{business.currencySymbol}{sale.discountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* GST Splits */}
        {sale.isInterState ? (
          /* Inter-State: IGST */
          <div className="flex justify-between text-indigo-700 font-medium">
            <span>Integrated GST (IGST):</span>
            <span>+{business.currencySymbol}{sale.igstAmount.toFixed(2)}</span>
          </div>
        ) : (
          /* Intra-State: CGST + SGST */
          <>
            <div className="flex justify-between text-slate-600">
              <span>Central GST (CGST):</span>
              <span>+{business.currencySymbol}{sale.cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>State GST (SGST):</span>
              <span>+{business.currencySymbol}{sale.sgstAmount.toFixed(2)}</span>
            </div>
          </>
        )}

        {sale.roundOffAmount !== undefined && sale.roundOffAmount !== 0 && (
          <div className="flex justify-between text-slate-500 text-[10px]">
            <span>Round Off:</span>
            <span>{sale.roundOffAmount > 0 ? '+' : ''}{business.currencySymbol}{sale.roundOffAmount.toFixed(2)}</span>
          </div>
        )}

        {/* GRAND TOTAL */}
        <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-slate-300 text-slate-900">
          <span>GRAND TOTAL:</span>
          <span className="text-base">{business.currencySymbol}{sale.totalAmount.toFixed(2)}</span>
        </div>

        {/* AMOUNT IN WORDS (Statutory GST Requirement) */}
        <div className="pt-1 text-[10px] text-slate-700 italic border-t border-dotted border-slate-200">
          <span className="font-semibold not-italic text-slate-500">Amount in Words: </span>
          <span>{numberToIndianWords(sale.totalAmount)}</span>
        </div>

        {/* PAYMENTS BREAKDOWN (UPI / Cash / Card) */}
        <div className="pt-2 mt-1 border-t border-dotted border-slate-200 space-y-1 text-[10px]">
          {sale.payments.map((p, idx) => (
            <div key={idx} className="flex justify-between text-slate-600">
              <span>
                Paid via {p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ''}:
              </span>
              <span className="font-medium">{business.currencySymbol}{p.amount.toFixed(2)}</span>
            </div>
          ))}
          {sale.changeAmount > 0 && (
            <div className="flex justify-between font-bold text-slate-800">
              <span>Change Returned:</span>
              <span>{business.currencySymbol}{sale.changeAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* HSN TAX SUMMARY (B2B & Standard Indian GST Invoice Table) */}
      {(!is58mm || isA4) && (
        <div className="py-2 border-b border-dashed border-slate-300 text-[9px] tabular-nums">
          <div className="font-bold text-[10px] text-slate-700 uppercase mb-1">
            GST Tax Computation Summary
          </div>
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-600">
                <th className="p-1 border border-slate-200">HSN/SAC</th>
                <th className="p-1 text-right border border-slate-200">Taxable</th>
                {sale.isInterState ? (
                  <>
                    <th className="p-1 text-right border border-slate-200">IGST %</th>
                    <th className="p-1 text-right border border-slate-200">IGST Amt</th>
                  </>
                ) : (
                  <>
                    <th className="p-1 text-right border border-slate-200">CGST %</th>
                    <th className="p-1 text-right border border-slate-200">CGST Amt</th>
                    <th className="p-1 text-right border border-slate-200">SGST %</th>
                    <th className="p-1 text-right border border-slate-200">SGST Amt</th>
                  </>
                )}
                <th className="p-1 text-right border border-slate-200">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="p-1 font-mono font-medium border border-slate-200">{item.hsnCodeSnapshot || '0000'}</td>
                  <td className="p-1 text-right border border-slate-200">{business.currencySymbol}{item.taxableAmount.toFixed(2)}</td>
                  {sale.isInterState ? (
                    <>
                      <td className="p-1 text-right border border-slate-200">{item.igstRate}%</td>
                      <td className="p-1 text-right border border-slate-200">{business.currencySymbol}{item.igstAmount.toFixed(2)}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-1 text-right border border-slate-200">{item.cgstRate}%</td>
                      <td className="p-1 text-right border border-slate-200">{business.currencySymbol}{item.cgstAmount.toFixed(2)}</td>
                      <td className="p-1 text-right border border-slate-200">{item.sgstRate}%</td>
                      <td className="p-1 text-right border border-slate-200">{business.currencySymbol}{item.sgstAmount.toFixed(2)}</td>
                    </>
                  )}
                  <td className="p-1 text-right font-medium border border-slate-200">{business.currencySymbol}{item.taxAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SQUARE QR CODE ZONE FOR UPI SCAN & STATUTORY GST VERIFICATION */}
      <div className="py-2.5 text-center flex flex-col items-center justify-center">
        <div className="p-2 bg-white rounded-lg border border-slate-300 inline-flex flex-col items-center">
          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1">
            Scan to Pay via UPI / Verify Bill
          </p>
          <SquareQRCode
            value={`upi://pay?pa=${business.upiId || 'naturaretail@okhdfcbank'}&pn=${encodeURIComponent(business.businessName)}&am=${sale.totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + sale.invoiceNumber)}`}
            size={is58mm ? 95 : 120}
            label={business.upiId ? `VPA: ${business.upiId}` : undefined}
          />
          <p className="text-[9px] text-slate-500 font-mono mt-1">
            GPay · PhonePe · Paytm · BHIM
          </p>
        </div>

        {/* 1D Barcode below QR code */}
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-[2px] h-6 mb-0.5">
            {sale.invoiceNumber.split('').map((char, i) => {
              const code = char.charCodeAt(0);
              const width = (code % 3) + 1.2;
              return (
                <div
                  key={i}
                  className="bg-slate-900 h-full"
                  style={{ width: `${width}px` }}
                />
              );
            })}
          </div>
          <p className="text-[9px] tracking-widest text-slate-600 font-mono">
            *{sale.invoiceNumber}*
          </p>
        </div>
      </div>

      {/* STATUTORY DECLARATION & FOOTER */}
      <div className="text-center text-[10px] text-slate-500 space-y-1 pt-1">
        <p className="italic text-[9px]">
          Certified that the particulars given above are true and correct.
        </p>
        <p className="leading-tight">{business.returnPolicy}</p>
        <p className="font-semibold text-slate-700">{business.receiptFooter}</p>
      </div>

      {/* SERRATED TEAR-OFF LINE */}
      {!isA4 && (
        <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-200 text-center text-[9px] text-slate-300">
          ✄ - - - - - - - - - - - - - - - - - - - - - - - - ✄
        </div>
      )}
    </div>
  );
};
