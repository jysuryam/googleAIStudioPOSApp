import React, { useState } from 'react';
import {
  Product,
  Category,
  Brand,
  Unit,
  BusinessConfig,
  User,
  ProductImage,
} from '../../types';
import { ProductImageEditorModal } from './ProductImageEditorModal';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Eye,
  Sliders,
  DollarSign,
  Package,
} from 'lucide-react';

interface ProductManagementViewProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  units: Unit[];
  business: BusinessConfig;
  currentUser: User;
  onSaveProduct: (prod: Partial<Product>) => { success: boolean; product?: Product; error?: string };
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  products,
  categories,
  brands,
  units,
  business,
  currentUser,
  onSaveProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [formError, setFormError] = useState('');

  // Image editor modal state
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);

  const canEdit =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'MANAGER' ||
    currentUser.role === 'INVENTORY_MANAGER';

  const filteredProducts = products
    .filter((p) => {
      if (filterCategory !== 'all' && p.categoryId !== filterCategory) return false;
      if (filterBrand !== 'all' && p.brandId !== filterBrand) return false;

      if (filterStockStatus === 'low') {
        if (p.availableStock > p.reorderLevel || p.availableStock <= 0) return false;
      } else if (filterStockStatus === 'out') {
        if (p.availableStock > 0) return false;
      } else if (filterStockStatus === 'in') {
        if (p.availableStock <= 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.productName.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = p.barcode.toLowerCase().includes(q);
        const matchHsn = p.hsnCode?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode && !matchHsn) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'stock') return a.availableStock - b.availableStock;
      return a.productName.localeCompare(b.productName);
    });

  const handleAddNew = () => {
    setEditingProduct({
      sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000),
      barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000),
      hsnCode: '08081000',
      productName: '',
      description: '',
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      unitId: units[0]?.id || '',
      costPrice: 0,
      sellingPrice: 0,
      taxRate: 5.0, // Standard 5% GST slab
      reorderLevel: 10,
      quantityOnHand: 0,
      active: true,
      images: [],
      primaryImagePath: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct({ ...prod });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError('');

    const res = onSaveProduct(editingProduct);
    if (res.success) {
      setIsModalOpen(false);
      setEditingProduct(null);
    } else {
      setFormError(res.error || 'Failed to save product');
    }
  };

  const handleSaveImageFromEditor = (dataUrl: string, originalFilename: string) => {
    if (!editingProduct) return;
    const newImage: ProductImage = {
      id: 'img-' + Date.now(),
      productId: editingProduct.id || 'new',
      imagePath: dataUrl,
      originalFilename,
      displayOrder: (editingProduct.images?.length || 0) + 1,
      isPrimary: !editingProduct.primaryImagePath,
    };

    const updatedImages = [...(editingProduct.images || []), newImage];
    setEditingProduct({
      ...editingProduct,
      images: updatedImages,
      primaryImagePath: editingProduct.primaryImagePath || dataUrl,
    });
    setIsImageEditorOpen(false);
  };

  const handleSetPrimaryImage = (imagePath: string) => {
    if (!editingProduct) return;
    const updatedImages = (editingProduct.images || []).map((img) => ({
      ...img,
      isPrimary: img.imagePath === imagePath,
    }));
    setEditingProduct({
      ...editingProduct,
      images: updatedImages,
      primaryImagePath: imagePath,
    });
  };

  const handleRemoveImage = (imageId: string) => {
    if (!editingProduct) return;
    const remaining = (editingProduct.images || []).filter((i) => i.id !== imageId);
    const newPrimary = remaining[0]?.imagePath || '';
    setEditingProduct({
      ...editingProduct,
      images: remaining,
      primaryImagePath: newPrimary,
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Barcode',
      'HSN Code',
      'Product Name',
      'Category',
      'Cost Price (INR)',
      'Selling Price (INR)',
      'GST Slab (%)',
      'CGST (%)',
      'SGST (%)',
      'Stock On Hand',
      'Available Stock',
      'Reorder Level',
      'Status',
    ];

    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || '';
      return [
        p.sku,
        p.barcode,
        p.hsnCode || '0000',
        `"${p.productName.replace(/"/g, '""')}"`,
        `"${cat}"`,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        p.taxRate,
        (p.taxRate / 2).toFixed(1),
        (p.taxRate / 2).toFixed(1),
        p.quantityOnHand,
        p.availableStock,
        p.reorderLevel,
        p.active ? 'ACTIVE' : 'INACTIVE',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartPOS_GST_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Action Bar */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Product Master & GST Rate Directory
            </h1>
            <p className="text-xs text-slate-500">
              Manage Indian HSN codes, GST tax slabs (0%, 5%, 12%, 18%, 28%), SKU barcodes, and pricing in {business.currencySymbol}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export GST CSV</span>
            </button>

            {canEdit && (
              <button
                onClick={handleAddNew}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, Barcode, or HSN code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value as any)}
            className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="all">All Stock Levels</option>
            <option value="in">In Stock Only</option>
            <option value="low">Low Stock Alerts</option>
            <option value="out">Out of Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="stock">Sort by Stock</option>
          </select>
        </div>
      </div>

      {/* Product Table with HSN Column */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4 text-center">HSN Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">GST Slab</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No products match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const isLowStock = p.availableStock <= p.reorderLevel && p.availableStock > 0;
                    const isOutOfStock = p.availableStock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Photo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {p.primaryImagePath ? (
                                <img
                                  src={p.primaryImagePath}
                                  alt={p.productName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                  {p.productName.slice(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate max-w-xs">
                                {p.productName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                {p.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* SKU & Barcode */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="font-medium text-slate-800">{p.sku}</div>
                          <div className="text-slate-400 text-[10px]">{p.barcode}</div>
                        </td>

                        {/* HSN Code */}
                        <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 text-[11px]">
                          {p.hsnCode || '—'}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="text-slate-700 font-medium">{cat?.name || 'Unassigned'}</span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                          {business.currencySymbol}{p.costPrice.toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {business.currencySymbol}{p.sellingPrice.toFixed(2)}
                        </td>

                        {/* GST Slab Rate */}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded font-mono font-semibold bg-emerald-50 text-emerald-800 text-[11px]">
                            {p.taxRate}% GST
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            ({p.taxRate / 2}% C + {p.taxRate / 2}% S)
                          </span>
                        </td>

                        {/* Available Stock */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] tabular-nums ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {p.availableStock}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Min: {p.reorderLevel}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-semibold ${
                              p.active ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {p.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit / Add Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingProduct.id ? 'Edit Product & GST Parameters' : 'Create New Inventory Product'}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure Indian HSN codes, GST slab rates, and retail pricing
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.productName || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    placeholder="e.g. Royal Gala Apples (1kg Box)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              {/* Barcode, HSN Code, Category, Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Barcode / EAN *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.hsnCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    placeholder="e.g. 08081000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unit of Measure</label>
                  <select
                    value={editingProduct.unitId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & GST Slab Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cost Price ({business.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingProduct.costPrice ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Selling Price ({business.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.sellingPrice ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Indian GST Tax Slab *</label>
                  <select
                    value={editingProduct.taxRate ?? 5}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, taxRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  >
                    <option value="0">0% (Nil / Exempted)</option>
                    <option value="5">5% (2.5% CGST + 2.5% SGST)</option>
                    <option value="12">12% (6% CGST + 6% SGST)</option>
                    <option value="18">18% (9% CGST + 9% SGST)</option>
                    <option value="28">28% (14% CGST + 14% SGST)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reorder Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.reorderLevel ?? 10}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, reorderLevel: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Initial stock */}
              {!editingProduct.id && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className="font-semibold text-slate-700">Initial Opening Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.quantityOnHand ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, quantityOnHand: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full sm:w-48 mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              {/* Product Images */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Product Images ({editingProduct.images?.length || 0} attached)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsImageEditorOpen(true)}
                    className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Optimize Photo...</span>
                  </button>
                </div>

                {editingProduct.images && editingProduct.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {editingProduct.images.map((img) => (
                      <div
                        key={img.id}
                        className={`relative group w-24 h-24 rounded-lg overflow-hidden border-2 bg-white ${
                          img.imagePath === editingProduct.primaryImagePath
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={img.imagePath}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        {img.imagePath === editingProduct.primaryImagePath && (
                          <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded shadow-xs">
                            Primary
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          {img.imagePath !== editingProduct.primaryImagePath && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(img.imagePath)}
                              className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] rounded font-semibold hover:bg-emerald-700"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] rounded font-semibold hover:bg-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prod-active"
                  checked={editingProduct.active ?? true}
                  onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                <label htmlFor="prod-active" className="font-semibold text-slate-700">
                  Product is Active for POS Billing
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImageEditorOpen && (
        <ProductImageEditorModal
          isOpen={isImageEditorOpen}
          initialImageUrl={editingProduct?.primaryImagePath}
          onClose={() => setIsImageEditorOpen(false)}
          onSaveImage={handleSaveImageFromEditor}
        />
      )}
    </div>
  );
};
