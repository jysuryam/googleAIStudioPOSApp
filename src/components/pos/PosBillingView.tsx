import React, { useState, useRef, useEffect } from 'react';
import {
  Product,
  CartItem,
  Customer,
  BusinessConfig,
  User,
  Sale,
  HeldCart,
} from '../../types';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  CreditCard,
  Banknote,
  QrCode,
  PauseCircle,
  RotateCcw,
  CheckCircle2,
  Printer,
  AlertTriangle,
  History,
  Layers,
  Sparkles,
  Smartphone,
  Scale,
  Calculator,
  Check,
  ArrowRight,
  ShoppingCart,
  Package,
  ArrowLeft,
} from 'lucide-react';

interface PosBillingViewProps {
  products: Product[];
  categories: { id: string; name: string }[];
  units: { id: string; name: string; abbreviation: string }[];
  customers: Customer[];
  business: BusinessConfig;
  currentUser: User;
  heldCarts: HeldCart[];
  recentSales: Sale[];
  onCheckout: (payload: {
    items: CartItem[];
    customer: Customer | null;
    payments: { paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT'; amount: number; referenceNumber?: string }[];
    discountTotal: number;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  onHoldCart: (items: CartItem[], customer: Customer | null, note: string) => void;
  onRemoveHeldCart: (id: string) => void;
  onOpenReceipt: (sale: Sale) => void;
}

export const PosBillingView: React.FC<PosBillingViewProps> = ({
  products,
  categories,
  units,
  customers,
  business,
  currentUser,
  heldCarts,
  recentSales,
  onCheckout,
  onHoldCart,
  onRemoveHeldCart,
  onOpenReceipt,
}) => {
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartNotes, setCartNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // UoM Weight & Value Billing Calculator Modal State
  const [uomModalOpen, setUomModalOpen] = useState<boolean>(false);
  const [activeUomItem, setActiveUomItem] = useState<{
    productId: string;
    productName: string;
    unitPrice: number;
    costPrice: number;
    unit: string;
    taxRate: number;
    maxStock: number;
    sku: string;
    barcode: string;
    hsnCode: string;
    imagePath?: string;
    currentQtyInCart: number;
  } | null>(null);

  const [uomMode, setUomMode] = useState<'WEIGHT' | 'AMOUNT'>('WEIGHT');
  const [uomWeightInput, setUomWeightInput] = useState<string>('100'); // 100 grams
  const [uomUnitChoice, setUomUnitChoice] = useState<'g' | 'kg'>('g');
  const [uomAmountInput, setUomAmountInput] = useState<string>('100'); // ₹100 target amount

  // Payment checkout state
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT'>('UPI');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');
  const [upiRef, setUpiRef] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');

  // UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [heldCartsModalOpen, setHeldCartsModalOpen] = useState<boolean>(false);
  const [holdNoteInput, setHoldNoteInput] = useState<string>('');
  const [showHoldPrompt, setShowHoldPrompt] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const getProductUnit = (prod: Product): string => {
    const matched = units.find((u) => u.id === prod.unitId);
    return matched?.abbreviation || 'pcs';
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // Inter-state check (different State Code from Store)
  const isInterState = selectedCustomer
    ? selectedCustomer.stateCode !== business.stateCode
    : false;

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.productName.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      const matchHsn = p.hsnCode?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBarcode && !matchHsn) return false;
    }
    return true;
  });

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => {
    if (item.targetAmount !== undefined) {
      // In specified target amount mode, line total is targetAmount
      const taxComponent = (item.targetAmount * item.taxRate) / (100 + item.taxRate);
      return acc + (item.targetAmount - taxComponent);
    }
    return acc + item.unitPrice * item.quantity - item.discountAmount;
  }, 0);

  // GST calculations
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  cartItems.forEach((item) => {
    let lineSub = 0;
    if (item.targetAmount !== undefined) {
      const taxComponent = (item.targetAmount * item.taxRate) / (100 + item.taxRate);
      lineSub = item.targetAmount - taxComponent;
    } else {
      lineSub = item.unitPrice * item.quantity - item.discountAmount;
    }

    if (isInterState) {
      igstTotal += (lineSub * item.taxRate) / 100;
    } else {
      cgstTotal += (lineSub * (item.taxRate / 2)) / 100;
      sgstTotal += (lineSub * (item.taxRate / 2)) / 100;
    }
  });

  const totalGst = isInterState ? igstTotal : cgstTotal + sgstTotal;
  const rawGrandTotal = subtotal + totalGst - cartDiscount;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOffAmount = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // Change calculation
  const numTendered = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, numTendered - roundedGrandTotal);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (paymentMethod === 'CASH' && roundedGrandTotal > 0 && !tenderedAmount) {
      setTenderedAmount(roundedGrandTotal.toFixed(2));
    }
  }, [roundedGrandTotal, paymentMethod, tenderedAmount]);

  // ADD TO CART
  const addToCart = (
    product: Product,
    qtyToAdd = 1,
    options?: { displayUom?: string; targetAmount?: number; overrideQty?: boolean }
  ) => {
    setErrorMessage('');
    const currentInCart = cartItems.find((i) => i.productId === product.id)?.quantity || 0;
    const finalQty = options?.overrideQty
      ? Number(qtyToAdd.toFixed(4))
      : Number((currentInCart + qtyToAdd).toFixed(4));

    if (!business.allowNegativeInventory && product.availableStock < finalQty) {
      setErrorMessage(`Insufficient stock for "${product.productName}". Available: ${product.availableStock}`);
      return;
    }

    const prodUnit = getProductUnit(product);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const old = updated[existingIndex];
        const updatedQty = options?.overrideQty
          ? Number(qtyToAdd.toFixed(4))
          : Number((old.quantity + qtyToAdd).toFixed(4));
        const lineSub = old.unitPrice * updatedQty - old.discountAmount;
        const lineTax = (lineSub * old.taxRate) / 100;

        updated[existingIndex] = {
          ...old,
          quantity: updatedQty,
          lineTotal: options?.targetAmount !== undefined ? options.targetAmount : Number((lineSub + lineTax).toFixed(2)),
          displayUom: options?.displayUom || old.displayUom,
          targetAmount: options?.targetAmount,
        };
        return updated;
      } else {
        const lineSub = product.sellingPrice * qtyToAdd;
        const lineTax = (lineSub * product.taxRate) / 100;
        const newItem: CartItem = {
          productId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          hsnCode: product.hsnCode,
          productName: product.productName,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: qtyToAdd,
          taxRate: product.taxRate,
          discountAmount: 0,
          lineTotal: options?.targetAmount !== undefined ? options.targetAmount : Number((lineSub + lineTax).toFixed(2)),
          imagePath: product.primaryImagePath,
          unit: prodUnit,
          displayUom: options?.displayUom,
          targetAmount: options?.targetAmount,
          maxStock: product.availableStock,
        };
        return [...prev, newItem];
      }
    });

    showToast(`Added "${product.productName}" to cart`);
  };

  // DIRECT EXACT QUANTITY UPDATE (Supports decimal e.g. 0.1, 0.25, 1.5)
  const setItemExactQty = (productId: string, exactQty: number) => {
    setErrorMessage('');
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (exactQty <= 0) {
      removeItem(productId);
      return;
    }

    if (!business.allowNegativeInventory && prod.availableStock < exactQty) {
      setErrorMessage(`Cannot exceed available stock (${prod.availableStock}) for ${prod.productName}`);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const lineSub = item.unitPrice * exactQty - item.discountAmount;
        const lineTax = (lineSub * item.taxRate) / 100;
        return {
          ...item,
          quantity: Number(exactQty.toFixed(4)),
          lineTotal: Number((lineSub + lineTax).toFixed(2)),
          targetAmount: undefined,
          displayUom: undefined,
        };
      })
    );
  };

  // UPDATE CART ITEM QUANTITY with smart fractional delta
  const updateQuantity = (productId: string, delta: number) => {
    setErrorMessage('');
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.productId !== productId) return item;
          // If weight based (kg) and quantity is small, use 0.1 or 0.25 steps
          let step = delta;
          if (item.unit === 'kg') {
            if (delta > 0 && item.quantity < 1) step = 0.1;
            else if (delta < 0 && item.quantity <= 1) step = -0.1;
          }
          const newQty = Number((item.quantity + step).toFixed(4));
          if (newQty <= 0) return null;

          if (!business.allowNegativeInventory && prod.availableStock < newQty) {
            setErrorMessage(`Cannot exceed available stock (${prod.availableStock}) for ${prod.productName}`);
            return item;
          }

          const lineSub = item.unitPrice * newQty - item.discountAmount;
          const lineTax = (lineSub * item.taxRate) / 100;
          return {
            ...item,
            quantity: newQty,
            lineTotal: Number((lineSub + lineTax).toFixed(2)),
            targetAmount: undefined,
            displayUom: undefined,
          };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // OPEN UOM / WEIGHT / TARGET AMOUNT MODAL
  const openUomModalForCartItem = (item: CartItem) => {
    setActiveUomItem({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      unit: item.unit,
      taxRate: item.taxRate,
      maxStock: item.maxStock,
      sku: item.sku,
      barcode: item.barcode,
      hsnCode: item.hsnCode,
      imagePath: item.imagePath,
      currentQtyInCart: item.quantity,
    });

    if (item.targetAmount) {
      setUomMode('AMOUNT');
      setUomAmountInput(item.targetAmount.toString());
      setUomWeightInput((item.quantity * (item.unit === 'kg' ? 1000 : 1)).toFixed(0));
      setUomUnitChoice(item.unit === 'kg' ? 'g' : 'kg');
    } else {
      setUomMode('WEIGHT');
      if (item.unit === 'kg') {
        if (item.quantity < 1) {
          setUomUnitChoice('g');
          setUomWeightInput((item.quantity * 1000).toFixed(0));
        } else {
          setUomUnitChoice('kg');
          setUomWeightInput(item.quantity.toString());
        }
      } else {
        setUomUnitChoice('g');
        setUomWeightInput(item.quantity.toString());
      }
      setUomAmountInput((item.lineTotal || 100).toFixed(2));
    }

    setUomModalOpen(true);
  };

  const openUomModalForProduct = (prod: Product) => {
    const prodUnit = getProductUnit(prod);
    const existing = cartItems.find((i) => i.productId === prod.id);

    setActiveUomItem({
      productId: prod.id,
      productName: prod.productName,
      unitPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      unit: prodUnit,
      taxRate: prod.taxRate,
      maxStock: prod.availableStock,
      sku: prod.sku,
      barcode: prod.barcode,
      hsnCode: prod.hsnCode,
      imagePath: prod.primaryImagePath,
      currentQtyInCart: existing?.quantity || 0,
    });

    setUomMode('WEIGHT');
    if (prodUnit === 'kg') {
      setUomUnitChoice('g');
      setUomWeightInput('100'); // default 100 grams
    } else {
      setUomUnitChoice('g');
      setUomWeightInput('1');
    }
    setUomAmountInput('100'); // default ₹100
    setUomModalOpen(true);
  };

  // APPLY UOM / WEIGHT / AMOUNT CHANGES TO CART
  const handleApplyUomModal = () => {
    if (!activeUomItem) return;
    setErrorMessage('');

    let finalQty = 0;
    let finalDisplayUom = '';
    let finalTargetAmount: number | undefined = undefined;

    if (uomMode === 'WEIGHT') {
      const inputVal = parseFloat(uomWeightInput) || 0;
      if (inputVal <= 0) {
        setErrorMessage('Please enter a valid weight or quantity.');
        return;
      }
      if (uomUnitChoice === 'g' && activeUomItem.unit === 'kg') {
        finalQty = Number((inputVal / 1000).toFixed(4));
        finalDisplayUom = `${inputVal}g (${finalQty}kg)`;
      } else {
        finalQty = Number(inputVal.toFixed(4));
        finalDisplayUom = `${inputVal} ${activeUomItem.unit}`;
      }
    } else {
      // AMOUNT MODE: User wants to sell for exact specified amount e.g. ₹100
      const targetVal = parseFloat(uomAmountInput) || 0;
      if (targetVal <= 0) {
        setErrorMessage('Please enter a valid target amount.');
        return;
      }
      finalTargetAmount = targetVal;
      // Tax calculation: Base taxable amount = targetVal / (1 + taxRate/100)
      const baseTaxable = targetVal / (1 + activeUomItem.taxRate / 100);
      finalQty = Number((baseTaxable / activeUomItem.unitPrice).toFixed(4));
      const gramsEquiv = Number((finalQty * 1000).toFixed(0));
      finalDisplayUom = activeUomItem.unit === 'kg'
        ? `₹${targetVal.toFixed(2)} (${gramsEquiv}g @ ₹${activeUomItem.unitPrice}/kg)`
        : `₹${targetVal.toFixed(2)} (${finalQty} ${activeUomItem.unit})`;
    }

    if (!business.allowNegativeInventory && activeUomItem.maxStock < finalQty) {
      setErrorMessage(`Cannot exceed available stock (${activeUomItem.maxStock} ${activeUomItem.unit})`);
      return;
    }

    const prod = products.find((p) => p.id === activeUomItem.productId);
    if (!prod) return;

    addToCart(prod, finalQty, {
      displayUom: finalDisplayUom,
      targetAmount: finalTargetAmount,
      overrideQty: true,
    });

    setUomModalOpen(false);
    setActiveUomItem(null);
  };

  // REMOVE ITEM
  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('Clear all items from current cart?')) {
      setCartItems([]);
      setCartDiscount(0);
      setTenderedAmount('');
      setErrorMessage('');
    }
  };

  // ITEM SEARCH ENTER-KEY & SELECTION HANDLER
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredProducts.length > 0) {
      const matched = filteredProducts[0];
      addToCart(matched, 1);
      setSearchQuery('');
      setSearchDropdownOpen(false);
    } else {
      setErrorMessage(`No product found matching "${searchQuery}"`);
    }
  };

  // BARCODE SCAN HANDLER
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const matchedProduct = products.find(
      (p) => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase()
    );

    if (matchedProduct) {
      addToCart(matchedProduct, 1);
      setBarcodeInput('');
    } else {
      setErrorMessage(`No product found with Barcode/SKU: "${query}"`);
    }
  };

  const handleConfirmHold = () => {
    if (cartItems.length === 0) return;
    onHoldCart(cartItems, selectedCustomer, holdNoteInput);
    setCartItems([]);
    setCartDiscount(0);
    setHoldNoteInput('');
    setShowHoldPrompt(false);
  };

  const handleResumeCart = (held: HeldCart) => {
    if (cartItems.length > 0) {
      if (!window.confirm('Current cart has items. Replace with held cart?')) return;
    }
    setCartItems(held.items);
    if (held.customer) {
      setSelectedCustomerId(held.customer.id);
    }
    onRemoveHeldCart(held.id);
    setHeldCartsModalOpen(false);
  };

  // COMPLETE CHECKOUT
  const handleCheckoutSubmit = () => {
    setErrorMessage('');
    if (cartItems.length === 0) {
      setErrorMessage('Cart is empty. Please add items.');
      return;
    }

    if (roundedGrandTotal > 0 && paymentMethod === 'CASH') {
      if (numTendered < roundedGrandTotal) {
        setErrorMessage(
          `Cash tendered (${business.currencySymbol}${numTendered.toFixed(2)}) is less than total payable (${business.currencySymbol}${roundedGrandTotal.toFixed(2)}).`
        );
        return;
      }
    }

    let payments: { paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'STORE_CREDIT'; amount: number; referenceNumber?: string }[] = [];

    if (paymentMethod === 'UPI') {
      payments = [{ paymentMethod: 'UPI', amount: roundedGrandTotal, referenceNumber: upiRef || `UPI/${Date.now().toString().slice(-8)}` }];
    } else if (paymentMethod === 'CASH') {
      payments = [{ paymentMethod: 'CASH', amount: numTendered || roundedGrandTotal }];
    } else if (paymentMethod === 'CARD') {
      payments = [{ paymentMethod: 'CARD', amount: roundedGrandTotal, referenceNumber: cardRef || 'POS-CARD' }];
    } else if (paymentMethod === 'SPLIT') {
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      if (c + u < roundedGrandTotal) {
        setErrorMessage(`Split sum (${business.currencySymbol}${(c + u).toFixed(2)}) does not cover bill total (${business.currencySymbol}${roundedGrandTotal.toFixed(2)}).`);
        return;
      }
      payments = [
        { paymentMethod: 'CASH', amount: c },
        { paymentMethod: 'UPI', amount: u, referenceNumber: 'SPLIT-UPI' },
      ];
    }

    setIsProcessing(true);

    try {
      const result = onCheckout({
        items: cartItems,
        customer: selectedCustomer,
        payments,
        discountTotal: cartDiscount,
        notes: cartNotes,
      });

      if (result.success && result.sale) {
        setCartItems([]);
        setCartDiscount(0);
        setTenderedAmount('');
        setCartNotes('');
        onOpenReceipt(result.sale);
      } else {
        setErrorMessage(result.error || 'Failed to complete checkout');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Checkout error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100/70 relative">
      {/* MOBILE & TABLET SEGMENTED VIEW SWITCHER (< lg) */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-2 flex items-center gap-2 shrink-0 z-30 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog & Products</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            mobileTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart & Bill</span>
          {cartItems.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                mobileTab === 'cart'
                  ? 'bg-white text-emerald-700'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      {/* LEFT: Product Catalog & Search (Visible on desktop OR when mobileTab === 'catalog') */}
      <div
        className={`${
          mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col h-full border-r border-slate-200 overflow-hidden bg-white relative`}
      >
        {/* Top Search & Barcode Row */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Barcode Fast Reader */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-72 shrink-0">
              <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan / Type Barcode or SKU + Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </form>

            {/* Keyword Search with Instant Suggestion Dropdown & Enter-to-Add */}
            <div className="relative flex-1">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products by title, SKU, or HSN (Press Enter to Add)..."
                  value={searchQuery}
                  onFocus={() => setSearchDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-14 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <div className="absolute right-2 top-1.5 flex items-center gap-1">
                    <button
                      type="submit"
                      title="Add top match to cart"
                      className="px-2 py-1 text-[10px] font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-0.5"
                    >
                      <span>Add</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchDropdownOpen(false);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </form>

              {/* Instant Search Suggestions Floating Menu */}
              {searchDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex justify-between items-center">
                    <span>Search Results ({filteredProducts.length} items)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Press Enter to add first item</span>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No products matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredProducts.slice(0, 8).map((prod) => {
                      const uom = getProductUnit(prod);
                      return (
                        <div
                          key={prod.id}
                          className="p-2.5 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div
                            onClick={() => {
                              addToCart(prod, 1);
                              setSearchQuery('');
                              setSearchDropdownOpen(false);
                            }}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded bg-slate-100 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs uppercase overflow-hidden">
                              {prod.primaryImagePath ? (
                                <img src={prod.primaryImagePath} alt={prod.productName} className="w-full h-full object-cover" />
                              ) : (
                                prod.productName.slice(0, 2)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{prod.productName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                SKU: {prod.sku} · HSN: {prod.hsnCode} · Stock: {prod.availableStock} {uom}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-slate-900 font-mono">
                                {business.currencySymbol}{prod.sellingPrice.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                per {uom} · GST {prod.taxRate}%
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openUomModalForProduct(prod);
                                setSearchDropdownOpen(false);
                              }}
                              title="Adjust loose weight or specified amount (e.g., 100g or ₹100)"
                              className="px-2 py-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Scale className="w-3.5 h-3.5 text-amber-600" />
                              <span>Loose / UOM</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                addToCart(prod, 1);
                                setSearchQuery('');
                                setSearchDropdownOpen(false);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Held Carts Badge */}
            {heldCarts.length > 0 && (
              <button
                onClick={() => setHeldCartsModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>Held ({heldCarts.length})</span>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors font-medium ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Bar */}
        {errorMessage && (
          <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Search className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-medium text-slate-600">No matching products found</p>
              <p className="text-xs text-slate-400 mt-1">Try another search term or HSN code</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((prod) => {
                const inCartQty = cartItems.find((i) => i.productId === prod.id)?.quantity || 0;
                const isLowStock = prod.availableStock <= prod.reorderLevel;
                const isOutOfStock = prod.availableStock <= 0;

                return (
                  <div
                    key={prod.id}
                    className={`group relative text-left bg-white border rounded-xl p-2.5 flex flex-col justify-between transition-all duration-150 hover:shadow-md hover:border-slate-300 ${
                      inCartQty > 0 ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'
                    } ${isOutOfStock && !business.allowNegativeInventory ? 'opacity-50 bg-slate-50' : ''}`}
                  >
                    {/* Thumbnail & Upper info clickable */}
                    <div
                      onClick={() => !isOutOfStock && addToCart(prod, 1)}
                      className="cursor-pointer"
                    >
                      <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden bg-slate-100 mb-2">
                        {prod.primaryImagePath ? (
                          <img
                            src={prod.primaryImagePath}
                            alt={prod.productName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-lg uppercase bg-gradient-to-br from-slate-50 to-slate-100">
                            {prod.productName.slice(0, 2)}
                          </div>
                        )}

                        <div className="absolute top-1 right-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight shadow-xs ${
                              isOutOfStock
                                ? 'bg-rose-600 text-white'
                                : isLowStock
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-900/80 text-white'
                            }`}
                          >
                            {prod.availableStock} in stock
                          </span>
                        </div>

                        {inCartQty > 0 && (
                          <div className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            {inCartQty} in cart
                          </div>
                        )}
                      </div>

                      {/* Product Meta */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span className="truncate">{prod.sku}</span>
                          <span className="text-slate-500 font-semibold">HSN: {prod.hsnCode}</span>
                        </div>
                        <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                          {prod.productName}
                        </h3>
                      </div>
                    </div>

                    {/* Price & GST */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {business.currencySymbol}{prod.sellingPrice.toFixed(2)}
                        <span className="text-[10px] text-slate-500 font-normal font-sans"> /{getProductUnit(prod)}</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        GST {prod.taxRate}%
                      </span>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="mt-2 pt-1 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addToCart(prod, 1)}
                        disabled={isOutOfStock && !business.allowNegativeInventory}
                        className="flex-1 py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openUomModalForProduct(prod)}
                        title="Adjust loose weight (e.g. 100g) or sell for specified amount (e.g. ₹100)"
                        className="py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 border border-amber-200 transition-colors cursor-pointer"
                      >
                        <Scale className="w-3 h-3 text-amber-700" />
                        <span>Loose / UOM</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile & Tablet Persistent Bottom Action Bar */}
        {cartItems.length > 0 && (
          <div className="lg:hidden p-3 bg-white border-t border-slate-200 shadow-xl flex items-center justify-between gap-3 shrink-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold relative shrink-0">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-slate-900 font-mono">
                  {business.currencySymbol}{roundedGrandTotal.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in billing cart
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <span>View Cart & Bill</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Cart & Indian GST Checkout Panel (Visible on desktop OR when mobileTab === 'cart') */}
      <div
        className={`${
          mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
        } w-full lg:w-[430px] xl:w-[470px] flex-col h-full bg-white border-l border-slate-200 shrink-0 overflow-hidden`}
      >
        {/* Mobile-only back button banner */}
        <div className="lg:hidden p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Add More Products</span>
          </button>
          <span className="text-xs font-semibold text-slate-600 font-mono">
            {cartItems.length} items · {business.currencySymbol}{roundedGrandTotal.toFixed(2)}
          </span>
        </div>
        {/* Customer & Place of Supply Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Cashier: <strong className="text-slate-900">{currentUser.fullName}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              {cartItems.length > 0 && (
                <>
                  <button
                    onClick={() => setShowHoldPrompt(true)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-200 rounded transition-colors"
                    title="Park / Hold current cart"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearCart}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-200 rounded transition-colors"
                    title="Clear cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer Selection & Place of Supply Indicator */}
          <div className="space-y-1">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} {c.gstin ? `[GSTIN: ${c.gstin}]` : ''} · {c.state} ({c.stateCode})
                </option>
              ))}
            </select>

            <div className="flex justify-between text-[11px] text-slate-500 px-0.5">
              <span>Place of Supply: <strong className="text-slate-800">{selectedCustomer?.state || business.state} ({selectedCustomer?.stateCode || business.stateCode})</strong></span>
              <span className={`font-semibold ${isInterState ? 'text-indigo-700' : 'text-emerald-700'}`}>
                {isInterState ? 'IGST Applicable' : 'CGST + SGST'}
              </span>
            </div>
          </div>
        </div>

        {/* Hold Cart Prompt */}
        {showHoldPrompt && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-col gap-2 text-xs">
            <span className="font-semibold text-amber-900">Hold this cart session:</span>
            <input
              type="text"
              placeholder="Add reference note (e.g. Customer fetching more items)..."
              value={holdNoteInput}
              onChange={(e) => setHoldNoteInput(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowHoldPrompt(false)}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHold}
                className="px-3 py-1 bg-amber-700 text-white rounded font-medium hover:bg-amber-800"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Barcode className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan barcode or select items from catalog to start billing
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.productId} className="py-2.5 px-1.5 flex items-center justify-between gap-2 text-xs border-b border-slate-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {item.productName}
                  </div>
                  {item.displayUom ? (
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mt-0.5">
                      <Scale className="w-3 h-3 text-emerald-600" />
                      <span>{item.displayUom}</span>
                    </div>
                  ) : null}
                  <div className="text-[10px] text-slate-500 font-mono">
                    HSN: {item.hsnCode} · {business.currencySymbol}{item.unitPrice.toFixed(2)}/{item.unit} × {item.quantity} · GST {item.taxRate}%
                  </div>
                </div>

                {/* Direct UOM & Loose Quantity Adjust Button */}
                <button
                  type="button"
                  onClick={() => openUomModalForCartItem(item)}
                  title="Adjust weight (e.g. 100g) or sell for specified amount (e.g. ₹100)"
                  className="px-1.5 py-1 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md flex items-center gap-0.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Scale className="w-3 h-3 text-amber-600" />
                  <span>UOM/₹</span>
                </button>

                <div className="flex items-center gap-1 shrink-0 bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openUomModalForCartItem(item)}
                    title="Click to adjust quantity / weight"
                    className="w-8 text-center font-bold font-mono text-slate-800 text-xs hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    {item.quantity}
                  </button>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-16 text-right font-mono font-bold text-slate-900 text-xs shrink-0">
                  {business.currencySymbol}{item.lineTotal.toFixed(2)}
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* GST Billing Summary & Payment Panel */}
        <div className="border-t border-slate-200 bg-slate-50/90 p-4 space-y-3">
          {/* Tax Breakdown */}
          <div className="space-y-1 text-xs tabular-nums">
            <div className="flex justify-between text-slate-500">
              <span>Taxable Subtotal:</span>
              <span>{business.currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            {/* Intra-State vs Inter-State GST Display */}
            {isInterState ? (
              <div className="flex justify-between text-indigo-700">
                <span>Integrated GST (IGST):</span>
                <span>+{business.currencySymbol}{igstTotal.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span>+{business.currencySymbol}{cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST):</span>
                  <span>+{business.currencySymbol}{sgstTotal.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-slate-500 pt-0.5">
              <span>Bill Discount:</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">{business.currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cartDiscount || ''}
                  placeholder="0.00"
                  onChange={(e) => setCartDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 px-2 py-0.5 text-xs text-right bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            {roundOffAmount !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>{roundOffAmount > 0 ? '+' : ''}{business.currencySymbol}{roundOffAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
              <span className="text-xs uppercase font-bold text-slate-600">Total Payable:</span>
              <span className="text-xl font-bold font-mono tracking-tight text-emerald-700">
                {business.currencySymbol}{roundedGrandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector (Prominent UPI!) */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs font-semibold">
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 border transition-colors ${
                paymentMethod === 'UPI'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI / QR</span>
            </button>

            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 border transition-colors ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash</span>
            </button>

            <button
              onClick={() => setPaymentMethod('CARD')}
              className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 border transition-colors ${
                paymentMethod === 'CARD'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>

            <button
              onClick={() => setPaymentMethod('SPLIT')}
              className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 border transition-colors ${
                paymentMethod === 'SPLIT'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Split</span>
            </button>
          </div>

          {/* Payment method specific details */}
          {paymentMethod === 'UPI' && (
            <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-purple-900 font-semibold">
                <span>VPA: {business.upiId}</span>
                <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-mono">GPay / PhonePe / Paytm</span>
              </div>
              <input
                type="text"
                placeholder="Optional UPI UTR / Ref Number..."
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded text-xs font-mono"
              />
            </div>
          )}

          {paymentMethod === 'CASH' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Cash Tendered:</span>
                <input
                  type="number"
                  step="1"
                  placeholder={roundedGrandTotal.toFixed(2)}
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Indian Currency Cash Denominations (₹50, ₹100, ₹200, ₹500) */}
              <div className="flex gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTenderedAmount(roundedGrandTotal.toFixed(2))}
                  className="px-2 py-1 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 font-mono text-[11px]"
                >
                  Exact
                </button>
                {[50, 100, 200, 500].map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => setTenderedAmount(denom.toString())}
                    className="flex-1 py-1 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 font-mono text-[11px]"
                  >
                    ₹{denom}
                  </button>
                ))}
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span>Change Returnable:</span>
                  <span className="font-mono text-sm">{business.currencySymbol}{changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="pt-1">
              <input
                type="text"
                placeholder="POS Machine Transaction / Approval Auth Code..."
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          )}

          {paymentMethod === 'SPLIT' && (
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-600">Cash (₹):</span>
                <input
                  type="number"
                  placeholder="Cash portion"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-600">UPI (₹):</span>
                <input
                  type="number"
                  placeholder="UPI portion"
                  value={splitUpi}
                  onChange={(e) => setSplitUpi(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckoutSubmit}
            disabled={cartItems.length === 0 || isProcessing}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
              cartItems.length === 0 || isProcessing
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <span>Generating GST Invoice...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete GST Bill ({business.currencySymbol}{roundedGrandTotal.toFixed(2)})</span>
              </>
            )}
          </button>

          {recentSales.length > 0 && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => onOpenReceipt(recentSales[0])}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reprint Last Bill ({recentSales[0].invoiceNumber})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Held Carts Modal */}
      {heldCartsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Parked Customer Carts</span>
              </h3>
              <button onClick={() => setHeldCartsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="py-3 divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {heldCarts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No held carts available.</p>
              ) : (
                heldCarts.map((h) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{h.note}</p>
                      <p className="text-[11px] text-slate-400">
                        {h.items.length} items · Cashier: {h.cashierName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResumeCart(h)}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => onRemoveHeldCart(h.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setHeldCartsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UOM / Weight & Specified Amount Billing Calculator Modal */}
      {uomModalOpen && activeUomItem && (() => {
        const uom = activeUomItem.unit;
        const rate = activeUomItem.unitPrice;
        const taxRate = activeUomItem.taxRate;

        // Weight mode calculations
        const wVal = parseFloat(uomWeightInput) || 0;
        const calcWeightKg = (uomUnitChoice === 'g' && uom === 'kg') ? wVal / 1000 : wVal;
        const weightSubtotal = calcWeightKg * rate;
        const weightTax = (weightSubtotal * taxRate) / 100;
        const weightLineTotal = weightSubtotal + weightTax;

        // Specified Amount mode calculations
        const aVal = parseFloat(uomAmountInput) || 0;
        const baseTaxable = aVal / (1 + taxRate / 100);
        const calcQtyFromAmount = rate > 0 ? baseTaxable / rate : 0;
        const gramsFromAmount = Math.round(calcQtyFromAmount * 1000);
        const amountTax = aVal - baseTaxable;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Adjust UOM & Loose Quantity</h3>
                    <p className="text-[11px] text-slate-300">
                      Standard Rate: <span className="font-mono font-bold text-emerald-400">{business.currencySymbol}{rate.toFixed(2)}</span> per {uom}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUomModalOpen(false);
                    setActiveUomItem(null);
                  }}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Product Info Banner */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="font-semibold text-slate-800 truncate mr-2">
                  {activeUomItem.productName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono shrink-0">
                  Stock: <strong className="text-slate-800">{activeUomItem.maxStock} {uom}</strong> · GST {taxRate}%
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUomMode('WEIGHT')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uomMode === 'WEIGHT'
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>Sell by Weight / Grams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUomMode('AMOUNT')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uomMode === 'AMOUNT'
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Sell by Specified ₹ Amount</span>
                  </button>
                </div>

                {/* TAB 1: WEIGHT MODE */}
                {uomMode === 'WEIGHT' && (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">Enter Weight / Quantity:</label>
                        {uom === 'kg' && (
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => setUomUnitChoice('g')}
                              className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-colors cursor-pointer ${
                                uomUnitChoice === 'g' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              Grams (g)
                            </button>
                            <button
                              type="button"
                              onClick={() => setUomUnitChoice('kg')}
                              className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-colors cursor-pointer ${
                                uomUnitChoice === 'kg' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              Kilograms (kg)
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={uomWeightInput}
                          onChange={(e) => setUomWeightInput(e.target.value)}
                          placeholder={uomUnitChoice === 'g' ? 'e.g. 100 for 100g' : 'e.g. 0.5 for 500g'}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 uppercase font-mono">
                          {uomUnitChoice === 'g' ? 'Grams' : uom}
                        </span>
                      </div>
                    </div>

                    {/* Quick presets for weight */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {[
                          { label: '50g', val: '50', unit: 'g' as const },
                          { label: '100g', val: '100', unit: 'g' as const },
                          { label: '200g', val: '200', unit: 'g' as const },
                          { label: '250g', val: '250', unit: 'g' as const },
                          { label: '500g', val: '500', unit: 'g' as const },
                          { label: '750g', val: '750', unit: 'g' as const },
                          { label: '1 kg', val: '1', unit: 'kg' as const },
                          { label: '2 kg', val: '2', unit: 'kg' as const },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              setUomUnitChoice(p.unit);
                              setUomWeightInput(p.val);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Weight Calculation Box */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Effective Weight in Bill:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {uomUnitChoice === 'g' && uom === 'kg'
                            ? `${wVal}g (${calcWeightKg.toFixed(3)} kg)`
                            : `${wVal} ${uom}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Value:</span>
                        <span className="font-mono">{business.currencySymbol}{weightSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST ({taxRate}%):</span>
                        <span className="font-mono">{business.currencySymbol}{weightTax.toFixed(2)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-emerald-200 flex justify-between items-center text-sm font-bold text-emerald-900">
                        <span>Total Payable:</span>
                        <span className="text-base font-mono font-extrabold text-emerald-700">
                          {business.currencySymbol}{weightLineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SPECIFIED AMOUNT MODE */}
                {uomMode === 'AMOUNT' && (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">Enter Specified Sale Amount (₹):</label>
                        <span className="text-[11px] text-emerald-700 font-medium">Customer pays exact amount</span>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400 font-mono">
                          {business.currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={uomAmountInput}
                          onChange={(e) => setUomAmountInput(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Quick presets for amounts */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Quick Amount Presets:</span>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {['10', '20', '50', '100', '200', '300', '500'].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setUomAmountInput(amt)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Amount Calculation Box */}
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Calculated Quantity:</span>
                        <span className="font-mono font-bold text-purple-950 text-sm">
                          {uom === 'kg'
                            ? `${gramsFromAmount} grams (${calcQtyFromAmount.toFixed(3)} kg)`
                            : `${calcQtyFromAmount.toFixed(3)} ${uom}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Base Taxable Subtotal:</span>
                        <span className="font-mono">{business.currencySymbol}{baseTaxable.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST ({taxRate}%):</span>
                        <span className="font-mono">{business.currencySymbol}{amountTax.toFixed(2)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-purple-200 flex justify-between items-center text-sm font-bold text-purple-950">
                        <span>Specified Bill Amount:</span>
                        <span className="text-base font-mono font-extrabold text-purple-700">
                          {business.currencySymbol}{aVal.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-800 bg-purple-100/70 px-2 py-1 rounded mt-1">
                        Receipt Label: <strong>{business.currencySymbol}{aVal.toFixed(2)} ({gramsFromAmount}g @ {business.currencySymbol}{rate}/kg)</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUomModalOpen(false);
                    setActiveUomItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplyUomModal}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Apply to Cart & Bill (
                    {uomMode === 'WEIGHT'
                      ? `${business.currencySymbol}${weightLineTotal.toFixed(2)}`
                      : `${business.currencySymbol}${aVal.toFixed(2)}`}
                    )
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Action Toast Notification for instant feedback on mobile & desktop */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shrink-0 cursor-pointer lg:hidden flex items-center gap-1"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
