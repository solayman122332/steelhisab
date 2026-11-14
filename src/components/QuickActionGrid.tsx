import {
  TrendingUp,
  Receipt,
  Users,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  CreditCard,
  BookOpen,
  ClipboardList,
  FileCheck,
  FileSpreadsheet,
  Download,
  Boxes,
  Store,
  PieChart,
  Landmark,
  Scale,
} from 'lucide-react';
import { ActiveModule } from '../types';

interface QuickActionGridProps {
  onSelectAction: (module: ActiveModule) => void;
  onOpenNewTransaction: (type: any) => void;
  onOpenMetalCalculator?: () => void;
  onSwitchToPos: () => void;
  isBangla: boolean;
  salesCount: number;
  expensesCount: number;
  partiesCount: number;
  inventoryCount: number;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onSelectAction,
  onOpenNewTransaction,
  onOpenMetalCalculator,
  onSwitchToPos,
  isBangla,
  salesCount,
  expensesCount,
  partiesCount,
  inventoryCount,
}) => {
  // 4x3 Grid modules exactly matching user prompt:
  // 1. Sale, 2. Expense, 3. Customer/Supplier, 4. Product/Services
  // 5. Purchase, 6. Fund Transfer, 7. Payment, 8. Journal
  // 9. Sale Order, 10. Purchase Order, 11. Estimates/Quotations, 12. Receipts
  const actions = [
    {
      id: 'Sale',
      title: isBangla ? 'বিক্রয়' : 'Sale',
      sub: isBangla ? 'কয়েল ও রড বিক্রয়' : 'Invoicing & Weight',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400',
      badge: salesCount,
      onClick: () => onOpenNewTransaction('Sale'),
    },
    {
      id: 'Expense',
      title: isBangla ? 'খরচ' : 'Expense',
      sub: isBangla ? 'ঘাট, পরিবহন, অফিস' : 'Port, Freight & Mill',
      icon: Receipt,
      color: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30 hover:border-rose-400',
      badge: expensesCount,
      onClick: () => onOpenNewTransaction('Expense'),
    },
    {
      id: 'Parties',
      title: isBangla ? 'গ্রাহক / সরবরাহকারী' : 'Customer / Supplier',
      sub: isBangla ? 'পার্টি ও বাকি খাতা' : 'Parties Ledger',
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30 hover:border-blue-400',
      badge: partiesCount,
      onClick: () => onSelectAction('Parties'),
    },
    {
      id: 'Products',
      title: isBangla ? 'পণ্য ও সেবা' : 'Product / Services',
      sub: isBangla ? 'স্টিল সাইজ ও গ্রেড' : 'Rod, Coils, Billets',
      icon: Package,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30 hover:border-amber-400',
      onClick: () => onSelectAction('Products'),
    },
    {
      id: 'Purchase',
      title: isBangla ? 'ক্রয়' : 'Purchase',
      sub: isBangla ? 'স্টিল ও স্ক্র্যাপ ক্রয়' : 'Stock Inward & LC',
      icon: ShoppingCart,
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-400',
      onClick: () => onOpenNewTransaction('Purchase'),
    },
    {
      id: 'Fund Transfer',
      title: isBangla ? 'ফান্ড ট্রান্সফার' : 'Fund Transfer',
      sub: isBangla ? 'ব্যাংক টু ব্যাংক' : 'Inter-Bank Transfer',
      icon: ArrowRightLeft,
      color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30 hover:border-indigo-400',
      onClick: () => onOpenNewTransaction('Fund Transfer'),
    },
    {
      id: 'Payment',
      title: isBangla ? 'পেমেন্ট প্রদান' : 'Payment',
      sub: isBangla ? 'পার্টি বা মিলকে প্রদান' : 'Supplier Payouts',
      icon: CreditCard,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30 hover:border-purple-400',
      onClick: () => onOpenNewTransaction('Payment'),
    },
    {
      id: 'Journal',
      title: isBangla ? 'জার্নাল' : 'Journal',
      sub: isBangla ? 'সমন্বয় দাখিলা' : 'Adjustments & Contra',
      icon: BookOpen,
      color: 'from-slate-500/20 to-slate-600/10 text-slate-300 border-slate-600/40 hover:border-slate-400',
      onClick: () => onOpenNewTransaction('Journal'),
    },
    {
      id: 'Sale Order',
      title: isBangla ? 'বিক্রয় অর্ডার' : 'Sale Order',
      sub: isBangla ? 'বুকিং ও অগ্রিম বায়না' : 'Booking & Advances',
      icon: ClipboardList,
      color: 'from-teal-500/20 to-teal-600/10 text-teal-400 border-teal-500/30 hover:border-teal-400',
      onClick: () => onOpenNewTransaction('Sale Order'),
    },
    {
      id: 'Purchase Order',
      title: isBangla ? 'ক্রয় অর্ডার' : 'Purchase Order',
      sub: isBangla ? 'এলসি বুকিং অর্ডার' : 'Mill Orders / PO',
      icon: FileCheck,
      color: 'from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30 hover:border-sky-400',
      onClick: () => onOpenNewTransaction('Purchase Order'),
    },
    {
      id: 'Quotation',
      title: isBangla ? 'দরপত্র / কোটেশন' : 'Estimates / Quotations',
      sub: isBangla ? 'রেট ও ওজনের প্রস্তাবনা' : 'Price Proposals',
      icon: FileSpreadsheet,
      color: 'from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/30 hover:border-orange-400',
      onClick: () => onOpenNewTransaction('Quotation'),
    },
    {
      id: 'Receipts',
      title: isBangla ? 'রসিদ / জমা' : 'Receipts',
      sub: isBangla ? 'গ্রাহক থেকে টাকা গ্রহণ' : 'Customer Money In',
      icon: Download,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-300',
      onClick: () => onOpenNewTransaction('Receipt'),
    },
  ];

  return (
    <div className="bg-slate-900/80 rounded-2xl p-3 sm:p-5 border border-slate-800 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <h2 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider">
            {isBangla ? 'কুইক অ্যাকশন মেনু (৪x৩ গ্রিড)' : 'Quick Actions (4x3 Grid)'}
          </h2>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            {isBangla ? 'সরাসরি হিসাব ও ভাউচার এন্ট্রি' : 'Direct Accounting Entry'}
          </span>
        </div>

        {/* Featured shortcut to Inventory, Total Hisab & Metal Calculator */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenMetalCalculator && (
            <button
              onClick={onOpenMetalCalculator}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
              title="Calculate steel plate, pipe, angle, or bar weights"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>{isBangla ? 'মেটাল ক্যালকুলেটর' : 'Metal Calculator'}</span>
            </button>
          )}

          <button
            onClick={() => onSelectAction('Inventory')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{isBangla ? 'ইনভেন্টরি ও এলসি স্টক' : 'Inventory & LC'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
              {inventoryCount} LCs
            </span>
          </button>

          <button
            onClick={() => onSelectAction('Total Hisab')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
          >
            <PieChart className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isBangla ? 'টোটাল হিসাব (পার্টনার লাভ)' : 'TOTAL HISAB'}</span>
          </button>
        </div>
      </div>

      {/* 4x3 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`group relative flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-gradient-to-br ${act.color} border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg text-left active:translate-y-0`}
            >
              <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/50 shadow-inner group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-amber-200">
                    {act.title}
                  </span>
                  {typeof act.badge === 'number' && act.badge > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {act.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                  {act.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Switch to POS Mode Toggle as requested */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Store className="w-4 h-4 text-amber-400" />
          <span>
            {isBangla
              ? 'কাউন্টার বিক্রয় ও দ্রুত চালান প্রিন্টের জন্য পিওএস মোড ব্যবহার করুন:'
              : 'Fast rod & coil billing counter with scale ticket & thermal invoice printing:'}
          </span>
        </div>
        <button
          onClick={onSwitchToPos}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <Store className="w-4 h-4" />
          <span>{isBangla ? 'সুইচ টু পিওএস মোড (POS Counter)' : 'Switch to POS Mode'}</span>
        </button>
      </div>
    </div>
  );
};
