import { useState, useEffect } from 'react';
import {
  BusinessConfig,
  Product,
  Category,
  Brand,
  Unit,
  Customer,
  Supplier,
  Sale,
  StockMovement,
  Expense,
  ExpenseCategory,
  CashRegisterSession,
  AuditLog,
  User,
  CartItem,
  HeldCart,
  PurchaseOrder,
  SalesReturn,
  SaleCancellation,
  SaleItem,
  SalesReturnItem,
} from '../types';
import {
  INITIAL_BUSINESS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_UNITS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_EXPENSES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_REGISTER_SESSION,
  INITIAL_AUDIT_LOGS,
} from './initialData';

const STORAGE_KEY_PREFIX = 'smartpos_inr_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export function generateInvoiceNumber(existingSales: Sale[]): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `POS-${yyyy}${mm}${dd}-`;

  const todaySales = existingSales.filter((s) => s.invoiceNumber.startsWith(datePrefix));
  const nextSeq = todaySales.length + 1;
  return `${datePrefix}${String(nextSeq).padStart(6, '0')}`;
}

export function generateReturnNumber(existingReturns: SalesReturn[]): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `RET-${yyyy}${mm}${dd}-`;
  const todayReturns = existingReturns.filter((r) => r.returnNumber.startsWith(datePrefix));
  const nextSeq = todayReturns.length + 1;
  return `${datePrefix}${String(nextSeq).padStart(6, '0')}`;
}

export function useSmartPOS() {
  const [currentUser, setCurrentUser] = useState<User>(() =>
    loadFromStorage<User>('current_user', INITIAL_USERS[0])
  );

  const [business, setBusiness] = useState<BusinessConfig>(() =>
    loadFromStorage<BusinessConfig>('business', INITIAL_BUSINESS)
  );

  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage<User[]>('users', INITIAL_USERS)
  );

  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage<Category[]>('categories', INITIAL_CATEGORIES)
  );

  const [brands, setBrands] = useState<Brand[]>(() =>
    loadFromStorage<Brand[]>('brands', INITIAL_BRANDS)
  );

  const [units, setUnits] = useState<Unit[]>(() =>
    loadFromStorage<Unit[]>('units', INITIAL_UNITS)
  );

  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage<Product[]>('products', INITIAL_PRODUCTS)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage<Customer[]>('customers', INITIAL_CUSTOMERS)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage<Supplier[]>('suppliers', INITIAL_SUPPLIERS)
  );

  const [sales, setSales] = useState<Sale[]>(() =>
    loadFromStorage<Sale[]>('sales', INITIAL_SALES)
  );

  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() =>
    loadFromStorage<SalesReturn[]>('sales_returns', [])
  );

  const [saleCancellations, setSaleCancellations] = useState<SaleCancellation[]>(() =>
    loadFromStorage<SaleCancellation[]>('sale_cancellations', [])
  );

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadFromStorage<StockMovement[]>('stock_movements', INITIAL_STOCK_MOVEMENTS)
  );

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() =>
    loadFromStorage<PurchaseOrder[]>('purchases', [
      {
        id: 'po-101',
        purchaseNumber: 'PO-20261001-001',
        supplierId: 'sup-1',
        supplierName: 'Verdant Orchards & Agro Co-op',
        purchaseDate: '2026-10-01T08:00:00Z',
        status: 'RECEIVED',
        subtotal: 12000.00,
        cgstAmount: 300.00,
        sgstAmount: 300.00,
        igstAmount: 0.00,
        taxAmount: 600.00,
        totalAmount: 12600.00,
        paidAmount: 12600.00,
        notes: 'Monthly farm delivery of fresh Royal Gala Apples',
        createdBy: 'Kiran Patel',
        items: [
          {
            productId: 'prod-1',
            productName: 'Shimla Fresh Royal Gala Apples (1kg Box)',
            sku: 'PROD-APP-001',
            hsnCode: '08081000',
            quantity: 100,
            unitCost: 120.00,
            taxRate: 5.0,
            cgstAmount: 300.00,
            sgstAmount: 300.00,
            igstAmount: 0.00,
            lineTotal: 12600.00,
          },
        ],
      },
    ])
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage<Expense[]>('expenses', INITIAL_EXPENSES)
  );

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() =>
    loadFromStorage<ExpenseCategory[]>('expense_categories', INITIAL_EXPENSE_CATEGORIES)
  );

  const [registerSession, setRegisterSession] = useState<CashRegisterSession>(() =>
    loadFromStorage<CashRegisterSession>('register_session', INITIAL_REGISTER_SESSION)
  );

  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() =>
    loadFromStorage<HeldCart[]>('held_carts', [])
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS)
  );

  // Sync to local storage
  useEffect(() => saveToStorage('current_user', currentUser), [currentUser]);
  useEffect(() => saveToStorage('business', business), [business]);
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('categories', categories), [categories]);
  useEffect(() => saveToStorage('brands', brands), [brands]);
  useEffect(() => saveToStorage('units', units), [units]);
  useEffect(() => saveToStorage('products', products), [products]);
  useEffect(() => saveToStorage('customers', customers), [customers]);
  useEffect(() => saveToStorage('suppliers', suppliers), [suppliers]);
  useEffect(() => saveToStorage('sales', sales), [sales]);
  useEffect(() => saveToStorage('sales_returns', salesReturns), [salesReturns]);
  useEffect(() => saveToStorage('sale_cancellations', saleCancellations), [saleCancellations]);
  useEffect(() => saveToStorage('stock_movements', stockMovements), [stockMovements]);
  useEffect(() => saveToStorage('purchases', purchases), [purchases]);
  useEffect(() => saveToStorage('expenses', expenses), [expenses]);
  useEffect(() => saveToStorage('expense_categories', expenseCategories), [expenseCategories]);
  useEffect(() => saveToStorage('register_session', registerSession), [registerSession]);
  useEffect(() => saveToStorage('held_carts', heldCarts), [heldCarts]);
  useEffect(() => saveToStorage('audit_logs', auditLogs), [auditLogs]);

  // Log an audit trail entry
  const logAudit = (action: string, entityType: string, entityId: string, details: string) => {
    const newEntry: AuditLog = {
      id: 'aud-' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // CHECKOUT TRANSACTION (Indian GST: CGST + SGST if Intra-State, IGST if Inter-State)
  const checkoutSale = (payload: {
    items: CartItem[];
    customer: Customer | null;
    payments: { paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT'; amount: number; referenceNumber?: string }[];
    discountTotal: number;
    notes?: string;
  }): { success: boolean; sale?: Sale; error?: string } => {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // 1. Stock verification
    for (const item of payload.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product not found: ${item.productName}` };
      }
      if (!business.allowNegativeInventory && prod.availableStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.productName}". Available: ${prod.availableStock}, Requested: ${item.quantity}`,
        };
      }
    }

    // 2. GST State Determination:
    // Store State vs Customer State
    const customerState = payload.customer?.state || business.state;
    const customerStateCode = payload.customer?.stateCode || business.stateCode;
    const isInterState = customerStateCode !== business.stateCode;
    const placeOfSupply = `${customerStateCode} - ${customerState}`;

    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    const saleId = 'sale-' + Date.now();
    const invoiceNumber = generateInvoiceNumber(sales);

    const saleItems: SaleItem[] = payload.items.map((ci, index) => {
      const lineSub = ci.unitPrice * ci.quantity - ci.discountAmount;
      subtotal += lineSub;

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (isInterState) {
        // Inter-State: Full rate as IGST
        igstRate = ci.taxRate;
        igstAmount = Number(((lineSub * igstRate) / 100).toFixed(2));
        igstTotal += igstAmount;
      } else {
        // Intra-State: Split into CGST (half) + SGST (half)
        cgstRate = ci.taxRate / 2;
        sgstRate = ci.taxRate / 2;
        cgstAmount = Number(((lineSub * cgstRate) / 100).toFixed(2));
        sgstAmount = Number(((lineSub * sgstRate) / 100).toFixed(2));
        cgstTotal += cgstAmount;
        sgstTotal += sgstAmount;
      }

      const totalLineTax = isInterState ? igstAmount : cgstAmount + sgstAmount;

      return {
        id: `si-${saleId}-${index + 1}`,
        saleId,
        productId: ci.productId,
        skuSnapshot: ci.sku,
        productNameSnapshot: ci.productName,
        hsnCodeSnapshot: ci.hsnCode || '0000',
        quantity: ci.quantity,
        returnedQuantity: 0,
        unitPrice: ci.unitPrice,
        unitCostSnapshot: ci.costPrice,
        discountAmount: ci.discountAmount,
        taxRate: ci.taxRate,
        taxableAmount: lineSub,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        taxAmount: totalLineTax,
        lineTotal: ci.targetAmount !== undefined ? ci.targetAmount : Number((lineSub + totalLineTax).toFixed(2)),
        unit: ci.unit,
        displayUom: ci.displayUom,
      };
    });

    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const rawTotal = subtotal + totalTax - payload.discountTotal;
    // Standard Indian Round-off
    const roundedTotal = Math.round(rawTotal);
    const roundOffAmount = Number((roundedTotal - rawTotal).toFixed(2));

    const totalPaid = payload.payments.reduce((acc, p) => acc + p.amount, 0);
    const changeAmount = Math.max(0, totalPaid - roundedTotal);

    const newSale: Sale = {
      id: saleId,
      invoiceNumber,
      businessId: business.id,
      customerId: payload.customer?.id || 'cust-walkin',
      customerName: payload.customer?.customerName || 'Walk-in Retail Customer',
      customerPhone: payload.customer?.phone || '',
      customerGstin: payload.customer?.gstin || '',
      customerState,
      customerStateCode,
      placeOfSupply,
      isInterState,
      saleDate: new Date().toISOString(),
      subtotal,
      discountAmount: payload.discountTotal,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      taxAmount: totalTax,
      totalAmount: roundedTotal,
      roundOffAmount,
      amountPaid: totalPaid,
      changeAmount,
      paymentStatus: totalPaid >= roundedTotal ? 'PAID' : 'PARTIAL',
      saleStatus: 'COMPLETED',
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      notes: payload.notes || '',
      items: saleItems,
      payments: payload.payments,
      createdAt: new Date().toISOString(),
    };

    // 3. Update Inventory & create StockMovements
    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const cartItem = payload.items.find((ci) => ci.productId === prod.id);
      if (!cartItem) return prod;

      const qtyBefore = prod.quantityOnHand;
      const qtyAfter = qtyBefore - cartItem.quantity;

      newMovements.push({
        id: 'sm-' + Date.now() + '-' + prod.id,
        productId: prod.id,
        productName: prod.productName,
        sku: prod.sku,
        movementType: 'SALE',
        quantityChange: -cartItem.quantity,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        referenceType: 'SALE',
        referenceId: invoiceNumber,
        reason: `Checkout GST invoice ${invoiceNumber}`,
        createdBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      });

      return {
        ...prod,
        quantityOnHand: qtyAfter,
        availableStock: qtyAfter - prod.reservedQuantity,
      };
    });

    setProducts(updatedProducts);
    setStockMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => [newSale, ...prev]);

    // 4. Update Cash Register if cash was paid
    const cashPaid = payload.payments
      .filter((p) => p.paymentMethod === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);

    if (cashPaid > 0 && registerSession.status === 'OPEN') {
      const netCashAdded = cashPaid - changeAmount;
      setRegisterSession((prev) => ({
        ...prev,
        cashSalesTotal: prev.cashSalesTotal + netCashAdded,
      }));
    }

    // 5. Update Customer loyalty points (1 point per ₹100 spent)
    if (payload.customer && payload.customer.id !== 'cust-walkin') {
      const earnedPoints = Math.floor(roundedTotal / 100);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === payload.customer!.id
            ? { ...c, loyaltyPoints: c.loyaltyPoints + earnedPoints }
            : c
        )
      );
    }

    logAudit(
      'CHECKOUT_SALE',
      'SALE',
      newSale.id,
      `Completed GST Invoice ${invoiceNumber} for ${newSale.customerName} - Total: ₹${roundedTotal.toFixed(2)} (CGST: ₹${cgstTotal.toFixed(2)}, SGST: ₹${sgstTotal.toFixed(2)}, IGST: ₹${igstTotal.toFixed(2)})`
    );

    return { success: true, sale: newSale };
  };

  // SALE CANCELLATION
  const cancelSale = (saleId: string, reason: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return { success: false, error: 'Only Managers and Admins can cancel completed sales.' };
    }

    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, error: 'Sale not found.' };
    if (sale.saleStatus === 'CANCELLED') return { success: false, error: 'Sale has already been cancelled.' };

    const reversalMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const saleItem = sale.items.find((si) => si.productId === prod.id);
      if (!saleItem) return prod;

      const unreturned = saleItem.quantity - saleItem.returnedQuantity;
      if (unreturned <= 0) return prod;

      const qtyBefore = prod.quantityOnHand;
      const qtyAfter = qtyBefore + unreturned;

      reversalMovements.push({
        id: 'sm-rev-' + Date.now() + '-' + prod.id,
        productId: prod.id,
        productName: prod.productName,
        sku: prod.sku,
        movementType: 'CANCELLATION_REVERSAL',
        quantityChange: unreturned,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        referenceType: 'SALE',
        referenceId: sale.invoiceNumber,
        reason: `Reversal for cancelled GST invoice ${sale.invoiceNumber}: ${reason}`,
        createdBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      });

      return {
        ...prod,
        quantityOnHand: qtyAfter,
        availableStock: qtyAfter - prod.reservedQuantity,
      };
    });

    const cancellationRecord: SaleCancellation = {
      id: 'canc-' + Date.now(),
      saleId: sale.id,
      cancellationNumber: 'CAN-' + Date.now(),
      invoiceNumber: sale.invoiceNumber,
      reason,
      cancelledBy: currentUser.fullName,
      cancelledAt: new Date().toISOString(),
      refundAmount: sale.totalAmount,
      status: 'CANCELLED',
    };

    setSaleCancellations((prev) => [cancellationRecord, ...prev]);
    setProducts(updatedProducts);
    setStockMovements((prev) => [...reversalMovements, ...prev]);
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, saleStatus: 'CANCELLED', notes: `CANCELLED: ${reason}` } : s))
    );

    logAudit(
      'CANCEL_SALE',
      'SALE',
      sale.id,
      `Cancelled GST invoice ${sale.invoiceNumber} by ${currentUser.fullName}. Reason: ${reason}`
    );

    return { success: true };
  };

  // CUSTOMER RETURN
  const processCustomerReturn = (payload: {
    saleId: string;
    itemsToReturn: { saleItemId: string; quantity: number; restock: boolean }[];
    reason: string;
    refundMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT';
  }): { success: boolean; salesReturn?: SalesReturn; error?: string } => {
    const sale = sales.find((s) => s.id === payload.saleId);
    if (!sale) return { success: false, error: 'Sale record not found.' };
    if (sale.saleStatus === 'CANCELLED') return { success: false, error: 'Cannot process returns on a cancelled invoice.' };

    const returnItems: SalesReturnItem[] = [];
    let subtotalRefund = 0;
    let cgstRefund = 0;
    let sgstRefund = 0;
    let igstRefund = 0;
    const stockReversals: StockMovement[] = [];

    const productQtyDeltaMap: Record<string, number> = {};

    for (const ret of payload.itemsToReturn) {
      if (ret.quantity <= 0) continue;
      const saleItem = sale.items.find((si) => si.id === ret.saleItemId);
      if (!saleItem) continue;

      const remainingUnreturned = saleItem.quantity - saleItem.returnedQuantity;
      if (ret.quantity > remainingUnreturned) {
        return {
          success: false,
          error: `Cannot return ${ret.quantity} units of "${saleItem.productNameSnapshot}". Only ${remainingUnreturned} unreturned.`,
        };
      }

      const unitRefund = saleItem.unitPrice;
      const lineSub = unitRefund * ret.quantity;
      subtotalRefund += lineSub;

      let lineCgst = 0;
      let lineSgst = 0;
      let lineIgst = 0;

      if (sale.isInterState) {
        lineIgst = Number(((lineSub * saleItem.igstRate) / 100).toFixed(2));
        igstRefund += lineIgst;
      } else {
        lineCgst = Number(((lineSub * saleItem.cgstRate) / 100).toFixed(2));
        lineSgst = Number(((lineSub * saleItem.sgstRate) / 100).toFixed(2));
        cgstRefund += lineCgst;
        sgstRefund += lineSgst;
      }

      const lineTax = lineCgst + lineSgst + lineIgst;

      returnItems.push({
        id: 'ri-' + Date.now() + '-' + ret.saleItemId,
        saleItemId: saleItem.id,
        productId: saleItem.productId,
        productName: saleItem.productNameSnapshot,
        hsnCode: saleItem.hsnCodeSnapshot,
        quantity: ret.quantity,
        refundUnitPrice: unitRefund,
        cgstAmount: lineCgst,
        sgstAmount: lineSgst,
        igstAmount: lineIgst,
        taxAmount: lineTax,
        restock: ret.restock,
        lineTotal: lineSub + lineTax,
      });

      if (ret.restock) {
        productQtyDeltaMap[saleItem.productId] =
          (productQtyDeltaMap[saleItem.productId] || 0) + ret.quantity;
      }
    }

    if (returnItems.length === 0) {
      return { success: false, error: 'No valid items selected for return.' };
    }

    const totalRefund = subtotalRefund + cgstRefund + sgstRefund + igstRefund;
    const returnNumber = generateReturnNumber(salesReturns);

    const updatedProducts = products.map((prod) => {
      const addedQty = productQtyDeltaMap[prod.id];
      if (!addedQty) return prod;

      const qtyBefore = prod.quantityOnHand;
      const qtyAfter = qtyBefore + addedQty;

      stockReversals.push({
        id: 'sm-ret-' + Date.now() + '-' + prod.id,
        productId: prod.id,
        productName: prod.productName,
        sku: prod.sku,
        movementType: 'CUSTOMER_RETURN',
        quantityChange: addedQty,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        referenceType: 'RETURN',
        referenceId: returnNumber,
        reason: `Customer return ${returnNumber} for GST invoice ${sale.invoiceNumber} (${payload.reason})`,
        createdBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      });

      return {
        ...prod,
        quantityOnHand: qtyAfter,
        availableStock: qtyAfter - prod.reservedQuantity,
      };
    });

    const newSalesReturn: SalesReturn = {
      id: 'ret-' + Date.now(),
      returnNumber,
      originalSaleId: sale.id,
      originalInvoiceNumber: sale.invoiceNumber,
      returnDate: new Date().toISOString(),
      reason: payload.reason,
      subtotal: subtotalRefund,
      cgstAmount: cgstRefund,
      sgstAmount: sgstRefund,
      igstAmount: igstRefund,
      taxAmount: cgstRefund + sgstRefund + igstRefund,
      totalRefund,
      refundMethod: payload.refundMethod,
      items: returnItems,
      processedBy: currentUser.fullName,
    };

    const updatedSales = sales.map((s) => {
      if (s.id !== sale.id) return s;
      const updatedItems = s.items.map((item) => {
        const ret = payload.itemsToReturn.find((r) => r.saleItemId === item.id);
        if (!ret) return item;
        return {
          ...item,
          returnedQuantity: item.returnedQuantity + ret.quantity,
        };
      });

      const allReturned = updatedItems.every((item) => item.returnedQuantity >= item.quantity);
      return {
        ...s,
        saleStatus: allReturned ? ('RETURNED' as const) : s.saleStatus,
        items: updatedItems,
      };
    });

    setProducts(updatedProducts);
    setStockMovements((prev) => [...stockReversals, ...prev]);
    setSalesReturns((prev) => [newSalesReturn, ...prev]);
    setSales(updatedSales);

    if (payload.refundMethod === 'CASH' && registerSession.status === 'OPEN') {
      setRegisterSession((prev) => ({
        ...prev,
        cashPayoutTotal: prev.cashPayoutTotal + totalRefund,
      }));
    }

    logAudit(
      'CUSTOMER_RETURN',
      'RETURN',
      newSalesReturn.id,
      `Processed return ${returnNumber} for GST invoice ${sale.invoiceNumber} - Refund: ₹${totalRefund.toFixed(2)}`
    );

    return { success: true, salesReturn: newSalesReturn };
  };

  // STOCK ADJUSTMENT
  const adjustStock = (payload: {
    productId: string;
    countedQuantity: number;
    reason: string;
    movementType: 'MANUAL_ADJUSTMENT' | 'DAMAGE' | 'LOSS';
  }): { success: boolean; error?: string } => {
    if (
      currentUser.role !== 'ADMIN' &&
      currentUser.role !== 'MANAGER' &&
      currentUser.role !== 'INVENTORY_MANAGER'
    ) {
      return { success: false, error: 'Unauthorized to perform stock adjustments.' };
    }

    const prod = products.find((p) => p.id === payload.productId);
    if (!prod) return { success: false, error: 'Product not found.' };

    const qtyBefore = prod.quantityOnHand;
    const diff = payload.countedQuantity - qtyBefore;
    if (diff === 0) return { success: true };

    const adjNumber = 'ADJ-' + Date.now();
    const newMovement: StockMovement = {
      id: 'sm-adj-' + Date.now(),
      productId: prod.id,
      productName: prod.productName,
      sku: prod.sku,
      movementType: payload.movementType,
      quantityChange: diff,
      quantityBefore: qtyBefore,
      quantityAfter: payload.countedQuantity,
      referenceType: 'ADJUSTMENT',
      referenceId: adjNumber,
      reason: `${payload.movementType}: ${payload.reason}`,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) =>
      prev.map((p) =>
        p.id === prod.id
          ? {
              ...p,
              quantityOnHand: payload.countedQuantity,
              availableStock: payload.countedQuantity - p.reservedQuantity,
            }
          : p
      )
    );

    setStockMovements((prev) => [newMovement, ...prev]);
    logAudit(
      'STOCK_ADJUSTMENT',
      'PRODUCT',
      prod.id,
      `Stock adjusted for "${prod.productName}" from ${qtyBefore} to ${payload.countedQuantity} - Reason: ${payload.reason}`
    );

    return { success: true };
  };

  // PRODUCT CRUD
  const saveProduct = (productData: Partial<Product>): { success: boolean; product?: Product; error?: string } => {
    if (
      currentUser.role !== 'ADMIN' &&
      currentUser.role !== 'MANAGER' &&
      currentUser.role !== 'INVENTORY_MANAGER'
    ) {
      return { success: false, error: 'Unauthorized to modify products.' };
    }

    if (!productData.productName?.trim()) return { success: false, error: 'Product name is required.' };
    if (!productData.sku?.trim()) return { success: false, error: 'SKU is required.' };
    if (!productData.barcode?.trim()) return { success: false, error: 'Barcode is required.' };

    const existingSku = products.find((p) => p.sku === productData.sku && p.id !== productData.id);
    if (existingSku) return { success: false, error: `SKU "${productData.sku}" is already in use.` };

    const existingBarcode = products.find((p) => p.barcode === productData.barcode && p.id !== productData.id);
    if (existingBarcode) return { success: false, error: `Barcode "${productData.barcode}" is already in use.` };

    if (productData.id) {
      const oldProd = products.find((p) => p.id === productData.id);
      if (oldProd && oldProd.sellingPrice !== productData.sellingPrice) {
        logAudit(
          'PRICE_CHANGE',
          'PRODUCT',
          productData.id,
          `Price changed for "${productData.productName}" from ₹${oldProd.sellingPrice.toFixed(2)} to ₹${Number(productData.sellingPrice).toFixed(2)}`
        );
      }

      const updated: Product = {
        ...(oldProd as Product),
        ...productData,
        hsnCode: productData.hsnCode || oldProd?.hsnCode || '0000',
        updatedAt: new Date().toISOString(),
      };

      setProducts((prev) => prev.map((p) => (p.id === productData.id ? updated : p)));
      logAudit('UPDATE_PRODUCT', 'PRODUCT', updated.id, `Updated product "${updated.productName}"`);
      return { success: true, product: updated };
    } else {
      const newId = 'prod-' + Date.now();
      const initialQty = Number(productData.quantityOnHand) || 0;

      const newProduct: Product = {
        id: newId,
        sku: productData.sku!,
        barcode: productData.barcode!,
        hsnCode: productData.hsnCode || '0000',
        productName: productData.productName!,
        description: productData.description || '',
        categoryId: productData.categoryId || categories[0]?.id || 'cat-1',
        brandId: productData.brandId || brands[0]?.id || 'br-1',
        unitId: productData.unitId || units[0]?.id || 'unit-1',
        costPrice: Number(productData.costPrice) || 0,
        sellingPrice: Number(productData.sellingPrice) || 0,
        taxRate: Number(productData.taxRate) || 0,
        reorderLevel: Number(productData.reorderLevel) || 10,
        active: productData.active !== undefined ? productData.active : true,
        primaryImagePath: productData.primaryImagePath || '',
        images: productData.images || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quantityOnHand: initialQty,
        reservedQuantity: 0,
        availableStock: initialQty,
      };

      setProducts((prev) => [newProduct, ...prev]);

      if (initialQty > 0) {
        const initMovement: StockMovement = {
          id: 'sm-init-' + Date.now(),
          productId: newId,
          productName: newProduct.productName,
          sku: newProduct.sku,
          movementType: 'OPENING_STOCK',
          quantityChange: initialQty,
          quantityBefore: 0,
          quantityAfter: initialQty,
          referenceType: 'INITIAL',
          referenceId: 'INIT-NEW',
          reason: 'Initial stock on product creation',
          createdBy: currentUser.fullName,
          createdAt: new Date().toISOString(),
        };
        setStockMovements((prev) => [initMovement, ...prev]);
      }

      logAudit('CREATE_PRODUCT', 'PRODUCT', newId, `Created product "${newProduct.productName}" (HSN: ${newProduct.hsnCode})`);
      return { success: true, product: newProduct };
    }
  };

  // RECEIVE PURCHASE ORDER
  const receivePurchaseOrder = (purchaseId: string): { success: boolean; error?: string } => {
    const po = purchases.find((p) => p.id === purchaseId);
    if (!po) return { success: false, error: 'Purchase order not found.' };
    if (po.status === 'RECEIVED') return { success: false, error: 'PO has already been marked as received.' };

    const newMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const item = po.items.find((i) => i.productId === prod.id);
      if (!item) return prod;

      const qtyBefore = prod.quantityOnHand;
      const qtyAfter = qtyBefore + item.quantity;

      newMovements.push({
        id: 'sm-po-' + Date.now() + '-' + prod.id,
        productId: prod.id,
        productName: prod.productName,
        sku: prod.sku,
        movementType: 'PURCHASE_RECEIPT',
        quantityChange: item.quantity,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        referenceType: 'PURCHASE',
        referenceId: po.purchaseNumber,
        reason: `Goods receipt from supplier ${po.supplierName} (${po.purchaseNumber})`,
        createdBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      });

      return {
        ...prod,
        quantityOnHand: qtyAfter,
        availableStock: qtyAfter - prod.reservedQuantity,
      };
    });

    setProducts(updatedProducts);
    setStockMovements((prev) => [...newMovements, ...prev]);
    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, status: 'RECEIVED' } : p))
    );

    logAudit('RECEIVE_PO', 'PURCHASE', po.id, `Received stock from PO ${po.purchaseNumber}`);
    return { success: true };
  };

  // CASH REGISTER ACTIONS
  const openCashRegister = (openingBalance: number, notes?: string) => {
    const session: CashRegisterSession = {
      id: 'reg-' + Date.now(),
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      openingBalance,
      cashSalesTotal: 0,
      cashPayoutTotal: 0,
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      notes,
    };
    setRegisterSession(session);
    logAudit('OPEN_REGISTER', 'REGISTER_SESSION', session.id, `Opened drawer with ₹${openingBalance.toFixed(2)} float`);
  };

  const closeCashRegister = (countedBalance: number, notes?: string) => {
    const expected = registerSession.openingBalance + registerSession.cashSalesTotal - registerSession.cashPayoutTotal;
    const discrepancy = countedBalance - expected;

    const closed: CashRegisterSession = {
      ...registerSession,
      closingBalance: countedBalance,
      expectedBalance: expected,
      discrepancy,
      closedAt: new Date().toISOString(),
      status: 'CLOSED',
      notes: notes ? `${registerSession.notes || ''} | Closing note: ${notes}` : registerSession.notes,
    };
    setRegisterSession(closed);
    logAudit(
      'CLOSE_REGISTER',
      'REGISTER_SESSION',
      closed.id,
      `Closed drawer. Expected: ₹${expected.toFixed(2)}, Counted: ₹${countedBalance.toFixed(2)}, Discrepancy: ₹${discrepancy.toFixed(2)}`
    );
  };

  const addExpense = (payload: {
    expenseCategoryId: string;
    description: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'UPI';
  }) => {
    const cat = expenseCategories.find((c) => c.id === payload.expenseCategoryId);
    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      expenseCategoryId: payload.expenseCategoryId,
      categoryName: cat?.categoryName || 'General',
      description: payload.description,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      expenseDate: new Date().toISOString(),
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);

    if (payload.paymentMethod === 'CASH' && registerSession.status === 'OPEN') {
      setRegisterSession((prev) => ({
        ...prev,
        cashPayoutTotal: prev.cashPayoutTotal + payload.amount,
      }));
    }

    logAudit('RECORD_EXPENSE', 'EXPENSE', newExp.id, `Expense ₹${payload.amount.toFixed(2)}: ${payload.description}`);
  };

  const holdCart = (items: CartItem[], customer: Customer | null, note: string) => {
    const held: HeldCart = {
      id: 'held-' + Date.now(),
      customer,
      items,
      createdAt: new Date().toISOString(),
      note: note || `Cart with ${items.length} items`,
      cashierName: currentUser.fullName,
    };
    setHeldCarts((prev) => [held, ...prev]);
    return held;
  };

  const removeHeldCart = (id: string) => {
    setHeldCarts((prev) => prev.filter((c) => c.id !== id));
  };

  const resetToFactoryDefaults = () => {
    localStorage.clear();
    setBusiness(INITIAL_BUSINESS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setCategories(INITIAL_CATEGORIES);
    setBrands(INITIAL_BRANDS);
    setUnits(INITIAL_UNITS);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSales(INITIAL_SALES);
    setSalesReturns([]);
    setSaleCancellations([]);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setExpenses(INITIAL_EXPENSES);
    setRegisterSession(INITIAL_REGISTER_SESSION);
    setHeldCarts([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  return {
    currentUser,
    setCurrentUser,
    business,
    setBusiness,
    users,
    setUsers,
    categories,
    setCategories,
    brands,
    setBrands,
    units,
    setUnits,
    products,
    setProducts,
    customers,
    setCustomers,
    suppliers,
    setSuppliers,
    sales,
    setSales,
    salesReturns,
    saleCancellations,
    stockMovements,
    purchases,
    setPurchases,
    expenses,
    expenseCategories,
    registerSession,
    heldCarts,
    auditLogs,
    checkoutSale,
    cancelSale,
    processCustomerReturn,
    adjustStock,
    saveProduct,
    receivePurchaseOrder,
    openCashRegister,
    closeCashRegister,
    addExpense,
    holdCart,
    removeHeldCart,
    resetToFactoryDefaults,
  };
}
