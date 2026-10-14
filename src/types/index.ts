export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER' | 'REPORT_VIEWER';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string;
}

export interface BusinessConfig {
  id: string;
  businessName: string;
  tagline: string;
  address: string;
  city: string;
  state: string; // Indian State, e.g. "Maharashtra"
  stateCode: string; // GST State Code e.g. "27"
  pincode: string;
  phone: string;
  email: string;
  gstin: string; // Indian 15-digit GSTIN e.g. 27AABCN8942Q1Z8
  panNumber: string;
  fssaiNumber?: string; // Food Safety standard for groceries/supermarkets
  upiId: string; // UPI VPA e.g. storename@okhdfcbank
  logoPath: string;
  currency: string; // INR
  currencySymbol: string; // ₹
  receiptFooter: string;
  returnPolicy: string;
  defaultReceiptWidth: '58mm' | '80mm' | 'A4';
  allowNegativeInventory: boolean;
  taxInclusive: boolean;
  timezone: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  color?: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imagePath: string;
  originalFilename: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  hsnCode: string; // Indian HSN/SAC code (e.g. 0808, 0901, 8518, 4820)
  productName: string;
  description: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number; // GST slab: 0, 5, 12, 18, 28%
  reorderLevel: number;
  active: boolean;
  primaryImagePath: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
  // Computed / Joined
  quantityOnHand: number;
  reservedQuantity: number;
  availableStock: number;
}

export type MovementType =
  | 'OPENING_STOCK'
  | 'PURCHASE_RECEIPT'
  | 'SALE'
  | 'CUSTOMER_RETURN'
  | 'SUPPLIER_RETURN'
  | 'CANCELLATION_REVERSAL'
  | 'DAMAGE'
  | 'LOSS'
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: MovementType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: 'SALE' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'INITIAL';
  referenceId: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  stateCode: string;
  gstin?: string; // B2B customer GSTIN
  loyaltyPoints: number;
  creditBalance: number;
  active: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  stateCode: string;
  gstin: string;
  contactPerson: string;
  active: boolean;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  status: 'RECEIVED' | 'PENDING' | 'CANCELLED';
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string;
  items: PurchaseItem[];
  createdBy: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  barcode: string;
  hsnCode: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  taxRate: number; // e.g. 5, 12, 18, 28
  discountAmount: number;
  lineTotal: number;
  imagePath?: string;
  unit: string;
  displayUom?: string; // e.g. 'kg' or 'g'
  targetAmount?: number; // if set via "Sell by Amount"
  maxStock: number;
}

export interface HeldCart {
  id: string;
  customer: Customer | null;
  items: CartItem[];
  createdAt: string;
  note: string;
  cashierName: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT' | 'SPLIT';

export interface SalePayment {
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT';
  amount: number;
  referenceNumber?: string; // UPI UTR or Card Auth
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  hsnCodeSnapshot: string;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  unitCostSnapshot: number;
  discountAmount: number;
  taxRate: number;
  taxableAmount: number;
  cgstRate: number; // e.g. 9% if 18% intra-state
  cgstAmount: number;
  sgstRate: number; // e.g. 9% if 18% intra-state
  sgstAmount: number;
  igstRate: number; // e.g. 18% if inter-state
  igstAmount: number;
  taxAmount: number; // total tax
  lineTotal: number;
  unit?: string;
  displayUom?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string; // e.g. "27 - Maharashtra"
  isInterState: boolean; // true if IGST, false if CGST+SGST
  saleDate: string;
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  roundOffAmount?: number;
  amountPaid: number;
  changeAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'REFUNDED';
  saleStatus: 'COMPLETED' | 'CANCELLED' | 'RETURNED';
  cashierId: string;
  cashierName: string;
  notes?: string;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: string;
}

export interface SalesReturnItem {
  id: string;
  saleItemId: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  refundUnitPrice: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  restock: boolean;
  lineTotal: number;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  originalSaleId: string;
  originalInvoiceNumber: string;
  returnDate: string;
  reason: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalRefund: number;
  refundMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT';
  items: SalesReturnItem[];
  processedBy: string;
}

export interface SaleCancellation {
  id: string;
  saleId: string;
  cancellationNumber: string;
  invoiceNumber: string;
  reason: string;
  cancelledBy: string;
  cancelledAt: string;
  refundAmount: number;
  status: 'CANCELLED';
}

export interface ExpenseCategory {
  id: string;
  categoryName: string;
  active: boolean;
}

export interface Expense {
  id: string;
  expenseCategoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
  expenseDate: string;
  createdBy: string;
  createdAt: string;
}

export interface CashRegisterSession {
  id: string;
  cashierId: string;
  cashierName: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  discrepancy?: number;
  cashSalesTotal: number;
  cashPayoutTotal: number;
  openedAt: string;
  closedAt?: string;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '19', name: 'West Bengal' },
  { code: '21', name: 'Odisha' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];
