import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Users,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  CreditCard,
  BookOpen,
  Boxes,
  PieChart,
  Landmark,
  Store,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Scale,
} from 'lucide-react';
import { ActiveModule } from '../types';

interface SidebarProps {
  currentModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  onOpenMetalCalculator?: () => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isBangla: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  onOpenMetalCalculator,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  isBangla,
}) => {
  const menuItems: { id: ActiveModule; label: string; bnLabel: string; icon: any }[] = [
    { id: 'Dashboard', label: 'Dashboard Overview', bnLabel: 'ড্যাশবোর্ড ওভারভিউ', icon: LayoutDashboard },
    { id: 'Sale', label: 'Sales & Challan', bnLabel: 'বিক্রয় ও চালান', icon: TrendingUp },
    { id: 'Purchase', label: 'Purchases & Inward', bnLabel: 'ক্রয় ও আগমন', icon: ShoppingCart },
    { id: 'Expense', label: 'Expenses & Charges', bnLabel: 'খরচ ও ঘাট চার্জ', icon: Receipt },
    { id: 'Total Hisab', label: 'TOTAL HISAB (Partners)', bnLabel: 'টোটাল হিসাব (পার্টনার লাভ)', icon: PieChart },
    { id: 'Bank Ledger', label: 'Bank & Cash Ledgers', bnLabel: 'ব্যাংক ও ক্যাশ খাতা', icon: Landmark },
    { id: 'Inventory', label: 'Inventory & LC Coils', bnLabel: 'ইনভেন্টরি ও এলসি কয়েল', icon: Boxes },
    { id: 'Parties', label: 'Customer / Supplier', bnLabel: 'গ্রাহক ও মহাজন পার্টি', icon: Users },
    { id: 'Products', label: 'Steel Specifications', bnLabel: 'রড সাইজ ও কয়েল গ্রেড', icon: Package },
    { id: 'POS Mode', label: 'POS Billing Counter', bnLabel: 'পিওএস বিক্রয় কাউন্টার', icon: Store },
    { id: 'Fund Transfer', label: 'Fund Transfers', bnLabel: 'তহবিল স্থানান্তর', icon: ArrowRightLeft },
    { id: 'Receipts', label: 'Receipts Register', bnLabel: 'রসিদ ও জমা খাতা', icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-40 h-full md:h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-18' : 'md:w-64'} w-72`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              SH
            </div>
            <span className="font-bold text-slate-100">SteelHisab</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                } ${isCollapsed ? 'md:justify-center' : ''}`}
                title={item.label}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">
                    {isBangla ? item.bnLabel : item.label}
                  </span>
                )}
              </button>
            );
          })}

          {onOpenMetalCalculator && (
            <button
              onClick={() => {
                onOpenMetalCalculator();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all border border-amber-500/20 mt-2 cursor-pointer ${
                isCollapsed ? 'md:justify-center' : ''
              }`}
              title={isBangla ? 'মাল্টি-মেটাল ওজন ক্যালকুলেটর' : 'Metal Weight Calculator'}
            >
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              {!isCollapsed && (
                <span className="truncate font-bold">
                  {isBangla ? 'মেটাল ক্যালকুলেটর' : 'Metal Calculator'}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Desktop Collapse toggle button */}
        <div className="p-3 border-t border-slate-800 hidden md:flex items-center justify-between">
          {!isCollapsed && (
            <div className="text-[11px] text-slate-500">
              {isBangla ? 'পার্টনারশিপ ৩-পুল ভার্সন' : 'v2.4 Steel Trading'}
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
