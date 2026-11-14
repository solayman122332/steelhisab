import React, { useState } from 'react';
import {
  Store,
  Printer,
  Trash2,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  CreditCard,
  User,
  Scale,
  Hash,
  ArrowLeft,
  Truck,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { BankAccount, Party, Transaction, ProductItem, CompanyProfile } from '../types';
import { formatBDT } from '../utils/formatters';

interface PosModeViewProps {
  onExitPos: () => void;
  accounts: BankAccount[];
  parties: Party[];
  products?: ProductItem[];
  companyProfile?: CompanyProfile;
  onCompleteSale: (sale: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  isBangla: boolean;
}

interface CartItem {
  id: string;
  name: string;
  grade: string;
  unit: string;
  weightKgPerUnit: number;
  quantity: number;
  ratePerKg: number;
  totalKg: number;
  grossAmount: number;
}

const DEFAULT_CATALOG = [
  { id: 'p1', name: 'BSRM 8mm Deformed Bar (500W)', size: '8mm', standard: '500W', unit: 'Bundle (10 pcs)', weightKgPerUnit: 47.4, marketRatePerKg: 94.0 },
  { id: 'p2', name: 'BSRM 10mm Deformed Bar (500W)', size: '10mm', standard: '500W', unit: 'Bundle (7 pcs)', weightKgPerUnit: 50.8, marketRatePerKg: 92.5 },
  { id: 'p3', name: 'BSRM 12mm Deformed Bar (500W)', size: '12mm', standard: '500W', unit: 'Bundle (5 pcs)', weightKgPerUnit: 52.6, marketRatePerKg: 91.5 },
  { id: 'p4', name: 'BSRM 16mm Deformed Bar (500W)', size: '16mm', standard: '500W', unit: 'Bundle (3 pcs)', weightKgPerUnit: 56.8, marketRatePerKg: 91.0 },
  { id: 'p5', name: 'BSRM 20mm Heavy Rod (500W)', size: '20mm', standard: '500W', unit: 'Piece', weightKgPerUnit: 29.6, marketRatePerKg: 91.0 },
  { id: 'p6', name: 'KSRM 10mm Deformed Bar (500W)', size: '10mm', standard: '500W', unit: 'Bundle (7 pcs)', weightKgPerUnit: 50.8, marketRatePerKg: 89.5 },
  { id: 'p7', name: 'Prime CR Sheet 0.45mm Coil', size: 'CR Sheet', standard: 'SPCC', unit: 'Roll', weightKgPerUnit: 120.0, marketRatePerKg: 98.0 },
  { id: 'p8', name: 'Galvanized Corrugated Sheet (টিন 0.35mm)', size: 'Corrugated', standard: 'SGCC', unit: 'Bundle', weightKgPerUnit: 34.5, marketRatePerKg: 110.0 },
  { id: 'p9', name: 'MS Angle 2" x 2" x 5mm', size: 'MS Angle', standard: 'Commercial', unit: 'Piece', weightKgPerUnit: 22.0, marketRatePerKg: 88.0 },
  { id: 'p10', name: 'MS Channel 4" x 2"', size: 'MS Channel', standard: 'Commercial', unit: 'Piece', weightKgPerUnit: 48.0, marketRatePerKg: 88.5 },
];

export const PosModeView: React.FC<PosModeViewProps> = ({
  onExitPos,
  accounts,
  parties,
  products = [],
  companyProfile,
  onCompleteSale,
  isBangla,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Counter Cash Customer');
  const [customerPhone, setCustomerPhone] = useState('01700-000000');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.name || 'Cash (নগদ ক্যাশ)');
  const [lessBdt, setLessBdt] = useState<string>('0');
  const [truckNo, setTruckNo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  const activeCatalog = products.length > 0 ? products : DEFAULT_CATALOG;

  const filteredCatalog = activeCatalog.filter(
    (item) =>
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.size || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.standard || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add item to cart
  const addToCart = (product: ProductItem | typeof DEFAULT_CATALOG[0]) => {
    const id = product.id;
    const name = product.name || product.size;
    const grade = product.standard || '500W';
    const unit = product.unit || 'KG';
    const weightPerUnit = product.weightKgPerUnit || 50;
    const rate = 'marketRatePerKg' in product ? product.marketRatePerKg : (product as any).defaultRate || 90;

    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        const totalKg = nextQty * existing.weightKgPerUnit;
        const grossAmount = totalKg * existing.ratePerKg;
        return prev.map((item) =>
          item.id === id
            ? { ...item, quantity: nextQty, totalKg, grossAmount }
            : item
        );
      } else {
        const totalKg = 1 * weightPerUnit;
        const grossAmount = totalKg * rate;
        return [
          ...prev,
          {
            id,
            name,
            grade,
            unit,
            weightKgPerUnit: weightPerUnit,
            quantity: 1,
            ratePerKg: rate,
            totalKg,
            grossAmount,
          },
        ];
      }
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = Math.max(1, item.quantity + delta);
            const totalKg = nextQty * item.weightKgPerUnit;
            const grossAmount = totalKg * item.ratePerKg;
            return { ...item, quantity: nextQty, totalKg, grossAmount };
          }
          return item;
        })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const totalWeightKg = cart.reduce((sum, item) => sum + item.totalKg, 0);
  const subtotalBdt = cart.reduce((sum, item) => sum + item.grossAmount, 0);
  const discountBdt = parseFloat(lessBdt) || 0;
  const netTotalBdt = Math.max(0, subtotalBdt - discountBdt);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const refNo = `POS-${Date.now().toString().slice(-6)}`;
      const dateStr = new Date().toISOString().split('T')[0];

      const saleData: Omit<Transaction, 'id' | 'createdAt'> = {
        date: dateStr,
        type: 'Sale',
        party: customerName,
        partyType: 'Customer',
        weightKg: totalWeightKg,
        rateBdt: totalWeightKg > 0 ? subtotalBdt / totalWeightKg : 0,
        lessBdt: discountBdt,
        totalBdt: netTotalBdt,
        costBdt: totalWeightKg * 78, // Est cost
        profitBdt: netTotalBdt - totalWeightKg * 78,
        account: selectedAccount,
        note: `POS Counter Sale. Truck: ${truckNo || 'N/A'}`,
        refNo,
        truckNo,
        status: 'Completed',
      };

      await onCompleteSale(saleData);

      setLastInvoice({
        ...saleData,
        items: [...cart],
        customerPhone,
      });

      setShowReceiptModal(true);
      clearCart();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100">
      {/* POS Top Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitPos}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isBangla ? 'ড্যাশবোর্ডে ফিরুন' : 'Exit POS'}</span>
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              {companyProfile?.companyName || 'SteelHisab POS Counter'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isBangla ? 'পণ্য খুঁজুন...' : 'Search product...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono text-emerald-400 font-bold">
              {new Date().toLocaleDateString()}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Counter POS Active</div>
          </div>
        </div>
      </div>

      {/* POS Main Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Product Catalog Grid */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 overflow-y-auto bg-slate-950/60 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredCatalog.map((prod) => {
            const displayName = prod.name || prod.size;
            const rate = 'marketRatePerKg' in prod ? prod.marketRatePerKg : (prod as any).defaultRate || 90;
            return (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition-all text-left flex flex-col justify-between shadow-lg group active:scale-95"
              >
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    {prod.standard || 'Standard'}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-slate-100 mt-1 line-clamp-2 group-hover:text-amber-300">
                    {displayName}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatBDT(rate)}/KG
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {prod.unitWeight || `${prod.weightKgPerUnit}kg`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Cart & Billing Summary */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col justify-between p-4 shadow-2xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  {isBangla ? 'বর্তমান কার্ট (বilling Cart)' : 'Current Billing Cart'}
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  {isBangla ? 'খালি করুন' : 'Clear'}
                </button>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-0.5">{isBangla ? 'গ্রাহক' : 'Customer'}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">{isBangla ? 'মোবাইল' : 'Phone'}</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {isBangla ? 'কার্ট খালি। বাম পাশের ক্যাটালগ থেকে পণ্য সিলেক্ট করুন।' : 'Cart is empty. Select products on the left to add items.'}
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-200 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {item.totalKg.toFixed(1)} KG @ ৳{item.ratePerKg}/KG
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:text-amber-400 text-slate-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold px-1 text-slate-200 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:text-amber-400 text-slate-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-amber-300">
                        {formatBDT(item.grossAmount)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 block ml-auto mt-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Totals & Submit */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{isBangla ? 'মোট স্টিল ওজন' : 'Total Steel Weight'}:</span>
              <span className="font-mono font-bold text-slate-200">
                {totalWeightKg.toLocaleString()} KG ({(totalWeightKg / 1000).toFixed(3)} MT)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>{isBangla ? 'উপমোট মূল্য' : 'Subtotal'}:</span>
              <span className="font-mono font-semibold text-slate-200">
                {formatBDT(subtotalBdt)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>{isBangla ? 'কমিশন / লেস (Less)' : 'Discount / Less'}:</span>
              <input
                type="number"
                value={lessBdt}
                onChange={(e) => setLessBdt(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right text-rose-400 font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>{isBangla ? 'অ্যাকাউন্ট / পেমেন্ট মাধ্যম' : 'Payment Account'}:</span>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>{isBangla ? 'ট্রাক / গাড়ি নম্বর' : 'Truck No'}:</span>
              <input
                type="text"
                placeholder="e.g. Dhaka Metro-T-13-5882"
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
                className="w-40 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">
                {isBangla ? 'সর্বমোট প্রদেয়' : 'Grand Total'}:
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-amber-400">
                {formatBDT(netTotalBdt)}
              </span>
            </div>

            <button
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
              className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>{isBangla ? 'বিল সম্পন্ন করুন ও চালান প্রিন্ট' : 'Complete Sale & Print Challan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {showReceiptModal && lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl font-mono text-xs">
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <h2 className="font-black text-sm uppercase">
                {companyProfile?.companyName || 'STEELHISAB TRADING'}
              </h2>
              <p className="text-[10px] text-slate-600">
                {companyProfile?.headOffice || 'Steel & Rod Wholesaler, Dhaka'}
              </p>
              <p className="text-[10px] text-slate-600">
                Phone: {companyProfile?.phone || '01700-000000'} | TIN: {companyProfile?.vatTin || 'N/A'}
              </p>
              <div className="mt-2 font-bold text-[11px] bg-slate-100 py-1 rounded">
                CASH SALE / DELIVERY CHALLAN
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Ref: {lastInvoice.refNo} | {lastInvoice.date}</div>
            </div>

            {/* Customer & Truck */}
            <div className="py-2 border-b border-slate-300 text-[11px] font-sans">
              <div>Customer: <strong>{lastInvoice.party}</strong></div>
              <div>Phone: {lastInvoice.customerPhone}</div>
              <div>Truck No: {lastInvoice.truckNo || 'N/A'}</div>
            </div>

            {/* Items */}
            <div className="py-2 border-b-2 border-dashed border-slate-400 space-y-1.5 font-sans">
              {lastInvoice.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start text-[11px]">
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-600">
                      {item.quantity} {item.unit} • {item.totalKg.toFixed(1)} KG @ ৳{item.ratePerKg}
                    </div>
                  </div>
                  <div className="font-bold font-mono">{formatBDT(item.grossAmount, false)}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b-2 border-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Weight:</span>
                <strong>{lastInvoice.weightKg.toLocaleString()} KG</strong>
              </div>
              <div className="flex justify-between">
                <span>Discount / Less:</span>
                <span>-{formatBDT(lastInvoice.lessBdt, false)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>TOTAL (BDT):</span>
                <span>{formatBDT(lastInvoice.totalBdt)}</span>
              </div>
              <div className="text-[10px] text-slate-600 pt-1">
                Settled Account: {lastInvoice.account}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              <p>{companyProfile?.challanTerms || 'Weighbridge slip verified. Goods once sold are not returnable.'}</p>
              <p className="mt-1 font-bold">Thank you for business with us!</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between no-print">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 flex items-center gap-1.5 shadow text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
