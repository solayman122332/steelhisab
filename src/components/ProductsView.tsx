import React, { useState } from 'react';
import {
  Package,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  ShoppingCart,
  Info,
  Layers,
  Tag,
  Scale,
} from 'lucide-react';
import { ProductItem } from '../types';
import { formatBDT } from '../utils/formatters';

interface ProductsViewProps {
  products: ProductItem[];
  onAddProduct: (product: Omit<ProductItem, 'id'>) => void;
  onEditProduct: (id: string, updated: Partial<ProductItem>) => void;
  onDeleteProduct: (id: string) => void;
  isBangla: boolean;
  onSelectProductForSale?: (name: string, rate: number) => void;
}

const CATEGORIES = [
  'All',
  'Rebar / Rod',
  'Sheet & Coil',
  'Section / Angle / Channel',
  'Billet / Raw',
  'Corrugated / Roofing',
  'Other',
] as const;

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  isBangla,
  onSelectProductForSale,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [standard, setStandard] = useState('');
  const [category, setCategory] = useState<ProductItem['category']>('Rebar / Rod');
  const [unit, setUnit] = useState('KG');
  const [unitWeight, setUnitWeight] = useState('');
  const [weightKgPerUnit, setWeightKgPerUnit] = useState('');
  const [bundlePcs, setBundlePcs] = useState('1');
  const [bundleWeightKg, setBundleWeightKg] = useState('0');
  const [marketRatePerKg, setMarketRatePerKg] = useState('90');
  const [application, setApplication] = useState('');

  const openAdd = () => {
    setEditingProduct(null);
    setName('');
    setSize('');
    setStandard('BDS ISO 6935-2 / 500W');
    setCategory('Rebar / Rod');
    setUnit('KG');
    setUnitWeight('');
    setWeightKgPerUnit('');
    setBundlePcs('1');
    setBundleWeightKg('0');
    setMarketRatePerKg('92');
    setApplication('');
    setShowModal(true);
  };

  const openEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSize(prod.size);
    setStandard(prod.standard);
    setCategory(prod.category);
    setUnit(prod.unit || 'KG');
    setUnitWeight(prod.unitWeight);
    setWeightKgPerUnit(prod.weightKgPerUnit?.toString() || '');
    setBundlePcs(prod.bundlePcs?.toString() || '1');
    setBundleWeightKg(prod.bundleWeightKg?.toString() || '0');
    setMarketRatePerKg(prod.marketRatePerKg?.toString() || '0');
    setApplication(prod.application || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(marketRatePerKg) || 0;
    const pcs = parseInt(bundlePcs, 10) || 1;
    const bWeight = parseFloat(bundleWeightKg) || 0;
    const wPerUnit = parseFloat(weightKgPerUnit) || 0;

    const payload: Omit<ProductItem, 'id'> = {
      name: name.trim() || size.trim(),
      size: size.trim(),
      standard: standard.trim(),
      category,
      unit,
      unitWeight: unitWeight.trim() || `${wPerUnit} kg/unit`,
      weightKgPerUnit: wPerUnit,
      bundlePcs: pcs,
      bundleWeightKg: bWeight,
      marketRatePerKg: rate,
      application: application.trim(),
    };

    if (editingProduct) {
      onEditProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }
    setShowModal(false);
  };

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const query = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.size.toLowerCase().includes(query) ||
      p.standard.toLowerCase().includes(query) ||
      p.application.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>
                {isBangla ? 'কাস্টমাইজড স্টিল পণ্য ও সাইজ তালিকা' : 'Customizable Steel Catalog & Specs'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? 'রড, শিট, কয়েল ও এঙ্গেল সাইজ, বান্ডিল ওজন এবং পাইকারি বাজার রেট নির্ধারণ ও পরিচালনা করুন'
                : 'Manage rebar sizes, sheets, coils, unit weights, bundle sizes and live market BDT rates'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isBangla ? '+ নতুন পণ্য যোগ' : '+ Add Product'}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isBangla ? 'পণ্য, সাইজ বা গ্রেড খুঁজুন...' : 'Search product or size...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Informative Trade Banner */}
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isBangla
              ? 'টিপস: এখানে যুক্ত বা পরিবর্তন করা প্রতিটি পণ্যের সাইজ ও রেট সাথে সাথে সেলস ও পিওএস (POS) মোডে সক্রিয় হয়ে যায়।'
              : 'Real-time Sync: Any product added or edited here automatically updates POS quick-buttons, sale forms, and inventory LC items.'}
          </span>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    {item.size || item.name}
                  </h3>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400 block">
                    {formatBDT(item.marketRatePerKg)}/KG
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatBDT(item.marketRatePerKg * 1000)}/Ton
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Grade / Standard:</span>
                  <span className="font-semibold text-amber-300">{item.standard || '500W'}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Unit Weight:</span>
                  <span>{item.unitWeight || `${item.weightKgPerUnit} kg`}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Bundle Packaging:</span>
                  <span>
                    {item.bundlePcs} Pcs ≈ {item.bundleWeightKg} KG
                  </span>
                </div>
                {item.application && (
                  <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
                    <span className="text-slate-500">Application: </span>
                    {item.application}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(item)}
                  title={isBangla ? 'পণ্য সম্পাদনা' : 'Edit Product'}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        isBangla
                          ? `আপনি কি নিশ্চিতভাবে "${item.size || item.name}" মুছে ফেলতে চান?`
                          : `Are you sure you want to delete "${item.size || item.name}"?`
                      )
                    ) {
                      onDeleteProduct(item.id);
                    }
                  }}
                  title={isBangla ? 'মুছে ফেলুন' : 'Delete Product'}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {onSelectProductForSale && (
                <button
                  onClick={() => onSelectProductForSale(item.size || item.name, item.marketRatePerKg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{isBangla ? 'বিক্রয়ে নিন' : 'Sell This'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            {isBangla ? 'কোন পণ্য পাওয়া যায়নি।' : 'No products matched your search.'}
          </p>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                {editingProduct
                  ? isBangla ? 'পণ্য স্পেসিফিকেশন এডিট' : 'Edit Product Specification'
                  : isBangla ? 'নতুন পণ্য যুক্ত করুন' : 'Add New Steel Product'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'পণ্যের সাইজ / নাম' : 'Product Size / Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12mm (4 Suta)"
                    value={size}
                    onChange={(e) => {
                      setSize(e.target.value);
                      if (!name) setName(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Rebar / Rod">Rebar / Rod</option>
                    <option value="Sheet & Coil">Sheet & Coil</option>
                    <option value="Section / Angle / Channel">Section / Angle / Channel</option>
                    <option value="Billet / Raw">Billet / Raw</option>
                    <option value="Corrugated / Roofing">Corrugated / Roofing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'স্ট্যান্ডার্ড / গ্রেড' : 'Standard / Grade'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BDS ISO 6935-2 / 500W"
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'পাইকারি বাজার রেট (BDT/KG)' : 'Market Rate (BDT/KG)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 92.5"
                    value={marketRatePerKg}
                    onChange={(e) => setMarketRatePerKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'ওজন প্রতি মিটার' : 'Unit Weight (kg/m)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0.888 kg/m"
                    value={unitWeight}
                    onChange={(e) => setUnitWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'বান্ডিলে পিস' : 'Bundle Pcs'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bundlePcs}
                    onChange={(e) => setBundlePcs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'বান্ডিল ওজন (KG)' : 'Bundle Wt (KG)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 53.3"
                    value={bundleWeightKg}
                    onChange={(e) => setBundleWeightKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'ব্যবহারের ক্ষেত্র / বিবরণ' : 'Application / Description'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main slab bars, column ties, grade beams"
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isBangla ? 'সংরক্ষণ করুন' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
