import React, { useState } from 'react';
import {
  PieChart,
  UserCheck,
  TrendingUp,
  Receipt,
  Scale,
  MinusCircle,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Coins,
  ArrowDownRight,
  Briefcase,
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Edit2,
  Trash2,
} from 'lucide-react';
import { PartnerCapital, PartnerDrawing, Transaction } from '../types';
import { formatBDT, formatDate } from '../utils/formatters';

interface TotalHisabDashboardProps {
  transactions: Transaction[];
  drawings: PartnerDrawing[];
  partners: PartnerCapital[];
  onAddDrawing: (drawing: Omit<PartnerDrawing, 'id'>) => void;
  onAddPartner: (partner: Omit<PartnerCapital, 'id'>) => void;
  onEditPartner: (id: string, updated: Partial<PartnerCapital>) => void;
  onDeletePartner: (id: string) => void;
  onDeleteDrawing: (id: string) => void;
  isBangla: boolean;
}

export const TotalHisabDashboard: React.FC<TotalHisabDashboardProps> = ({
  transactions,
  drawings,
  partners,
  onAddDrawing,
  onAddPartner,
  onEditPartner,
  onDeletePartner,
  onDeleteDrawing,
  isBangla,
}) => {
  const [showAddDrawingModal, setShowAddDrawingModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerCapital | null>(null);

  // Drawing Form State
  const [drawingPartner, setDrawingPartner] = useState<string>(partners[0]?.partnerName || 'Yousuf');
  const [drawingAmount, setDrawingAmount] = useState<string>('');
  const [drawingAccount, setDrawingAccount] = useState<string>('Cash (নগদ ক্যাশ)');
  const [drawingNote, setDrawingNote] = useState<string>('');
  const [drawingDate, setDrawingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Partner Form State
  const [partnerName, setPartnerName] = useState('');
  const [partnerBanglaName, setPartnerBanglaName] = useState('');
  const [partnerRole, setPartnerRole] = useState('');
  const [partnerCapital, setPartnerCapital] = useState('');
  const [partnerRatio, setPartnerRatio] = useState('');
  const [partnerWorkingRatio, setPartnerWorkingRatio] = useState('');

  const openAddPartner = () => {
    setEditingPartner(null);
    setPartnerName('');
    setPartnerBanglaName('');
    setPartnerRole('Investor & Partner');
    setPartnerCapital('');
    setPartnerRatio('');
    setPartnerWorkingRatio('');
    setShowPartnerModal(true);
  };

  const openEditPartner = (p: PartnerCapital) => {
    setEditingPartner(p);
    setPartnerName(p.partnerName);
    setPartnerBanglaName(p.banglaName);
    setPartnerRole(p.role);
    setPartnerCapital(p.capitalBdt.toString());
    setPartnerRatio((p.capitalRatio * 100).toString());
    setPartnerWorkingRatio(p.workingRatio ? (p.workingRatio * 100).toString() : '');
    setShowPartnerModal(true);
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseFloat(partnerCapital) || 0;
    const ratioVal = parseFloat(partnerRatio);
    const ratio = !isNaN(ratioVal) ? ratioVal / 100 : 0;
    const workRatioVal = parseFloat(partnerWorkingRatio);
    const workRatio = !isNaN(workRatioVal) ? workRatioVal / 100 : undefined;

    if (editingPartner) {
      onEditPartner(editingPartner.id, {
        partnerName: partnerName.trim(),
        banglaName: partnerBanglaName.trim(),
        role: partnerRole.trim(),
        capitalBdt: cap,
        capitalRatio: ratio,
        workingRatio: workRatio,
      });
    } else {
      onAddPartner({
        partnerName: partnerName.trim(),
        banglaName: partnerBanglaName.trim(),
        role: partnerRole.trim(),
        capitalBdt: cap,
        capitalRatio: ratio,
        workingRatio: workRatio,
      });
    }
    setShowPartnerModal(false);
  };

  // 1. Calculate Gross Profit from Sales
  const saleTransactions = transactions.filter((t) => t.type === 'Sale');
  const grossProfitBdt = saleTransactions.reduce(
    (acc, t) => acc + (t.profitBdt || (t.totalBdt - t.costBdt) || 0),
    0
  );
  const totalSalesRevenueBdt = saleTransactions.reduce((acc, t) => acc + (t.totalBdt || 0), 0);
  const totalSalesWeightKg = saleTransactions.reduce((acc, t) => acc + (t.weightKg || 0), 0);

  // 2. Calculate Expenses
  const expenseTransactions = transactions.filter((t) => t.type === 'Expense');
  const totalExpensesBdt = expenseTransactions.reduce((acc, t) => acc + (t.totalBdt || 0), 0);

  // 3. Net Profit = Gross Profit - Expenses
  const netProfitBdt = Math.max(0, grossProfitBdt - totalExpensesBdt);

  // 4. Split Net Profit into 3 EQUAL POOLS (1/3 each):
  // Pool 1: 1/3 Working Share to Yousuf
  const pool1_yousufWorkingBdt = netProfitBdt * (1 / 3);

  // Pool 2: 1/3 Working Share split equally between Liton and Milon (1/6 each)
  const pool2_litonMilonPoolBdt = netProfitBdt * (1 / 3);
  const pool2_litonWorkingBdt = pool2_litonMilonPoolBdt / 2; // 1/6
  const pool2_milonWorkingBdt = pool2_litonMilonPoolBdt / 2; // 1/6

  // Pool 3: 1/3 Capital Pool ("Taka Wala") allocated by capital ratio
  const pool3_capitalPoolBdt = netProfitBdt * (1 / 3);
  const totalCapitalBdt = partners.reduce((sum, p) => sum + p.capitalBdt, 0);

  // Calculate per-partner breakdown
  const partnerBreakdown = partners.map((p) => {
    // Working Share
    let workingShare = 0;
    if (p.partnerName.toLowerCase().includes('yousuf')) {
      workingShare = pool1_yousufWorkingBdt;
    } else if (p.workingRatio !== undefined) {
      workingShare = pool2_litonMilonPoolBdt * p.workingRatio;
    } else if (p.partnerName.toLowerCase().includes('liton')) {
      workingShare = pool2_litonWorkingBdt;
    } else if (p.partnerName.toLowerCase().includes('milon')) {
      workingShare = pool2_milonWorkingBdt;
    }

    // Capital Share based on capital ratio in total capital
    const capitalRatio = totalCapitalBdt > 0 ? p.capitalBdt / totalCapitalBdt : p.capitalRatio;
    const capitalShare = pool3_capitalPoolBdt * capitalRatio;

    // Total Profit
    const totalProfitShare = workingShare + capitalShare;

    // Partner Drawings
    const partnerDrawings = drawings
      .filter((d) => d.partnerName === p.partnerName)
      .reduce((sum, d) => sum + (d.amountBdt || 0), 0);

    // Remaining Due (Paona) = Total Profit Share - Drawings
    const remainingDueBdt = totalProfitShare - partnerDrawings;

    return {
      ...p,
      capitalRatio,
      workingShare,
      capitalShare,
      totalProfitShare,
      partnerDrawings,
      remainingDueBdt,
    };
  });

  const handleSaveDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(drawingAmount);
    if (isNaN(amount) || amount <= 0) return;

    onAddDrawing({
      partnerName: drawingPartner,
      amountBdt: amount,
      account: drawingAccount,
      note: drawingNote || 'Partner drawing / withdrawal',
      date: drawingDate,
      refVoucher: `VR-DRW-${Date.now().toString().slice(-4)}`,
    });

    setDrawingAmount('');
    setDrawingNote('');
    setShowAddDrawingModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Net Profit Formula */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/80 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <PieChart className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {isBangla ? 'টোটাল হিসাব — পার্টনার লাভ ও পাওনা খাতা' : 'TOTAL HISAB — Partner Profit Distribution'}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isBangla
                ? 'নেট প্রফিট = গ্রস প্রফিট - খরচ। নেট প্রফিট ৩টি সমান পুলে বিভক্ত: ১/৩ ইউসুফ ওয়ার্কিং, ১/৩ লিটন ও মিলন সমান (১/৬ করে), এবং ১/৩ মূলধন পুল (টাকা ওয়ালা মূলধন অনুপাতে)।'
                : 'Net Profit = Gross Profit - Expenses. Split into 3 equal pools (1/3 Yousuf Working, 1/3 Liton & Milon, 1/3 Capital Pool by ratio), minus partner drawings to calculate Remaining Due (Paona).'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openAddPartner}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all hover:scale-105 active:scale-95"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{isBangla ? 'পার্টনার যোগ করুন' : 'Add Partner'}</span>
            </button>
            <button
              onClick={() => setShowAddDrawingModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isBangla ? 'উত্তোলন / হাওয়ালা এন্ট্রি' : 'Record Partner Drawing'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards: Sales, Gross Profit, Expenses, Net Profit */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Total Sales */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isBangla ? 'মোট বিক্রয় ভলিউম' : 'Total Sales Turnover'}</span>
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-white">
              {formatBDT(totalSalesRevenueBdt)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {(totalSalesWeightKg / 1000).toFixed(2)} MT {isBangla ? 'স্টিল' : 'Steel Sold'}
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isBangla ? 'গ্রস প্রফিট (বিক্রয় লাভ)' : 'Gross Profit'}</span>
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">
              {formatBDT(grossProfitBdt)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Total - Purchase Cost
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{isBangla ? 'ব্যবসা ও ঘাট খরচ' : 'Total Expenses'}</span>
              <Receipt className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-rose-400">
              {formatBDT(totalExpensesBdt)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {expenseTransactions.length} {isBangla ? 'টি ভাউচার' : 'Vouchers'}
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 rounded-xl p-3.5 border border-emerald-500/40 ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
              <span className="font-bold">{isBangla ? 'নেট প্রফিট (বণ্টনযোগ্য)' : 'Net Profit (Distributable)'}</span>
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-mono font-extrabold text-emerald-300">
              {formatBDT(netProfitBdt)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Gross Profit - Expenses
            </div>
          </div>
        </div>

        {/* 3 Pools Visual Representation Bar */}
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {isBangla ? '৩টি সমান পুলের বিভাজন (১/৩ অংশ প্রতি পুলে)' : 'The 3 Equal Pools Breakdown (1/3 each)'}
            </h4>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {formatBDT(pool1_yousufWorkingBdt)} {isBangla ? 'প্রতি পুলে' : 'per pool'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pool 1 */}
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40">
              <div className="flex items-center justify-between text-blue-300 text-xs font-bold mb-1">
                <span>{isBangla ? 'পুল ১: ইউসুফ ওয়ার্কিং (১/৩)' : 'Pool 1: Yousuf Working (1/3)'}</span>
                <span className="font-mono">33.33%</span>
              </div>
              <div className="text-base font-mono font-bold text-blue-200">
                {formatBDT(pool1_yousufWorkingBdt)}
              </div>
              <p className="text-[10px] text-blue-400/80 mt-1">
                {isBangla ? 'ইউসুফ সাহেবের একক পরিশ্রমিক শেয়ার' : 'Dedicated to Yousuf (Managing)'}
              </p>
            </div>

            {/* Pool 2 */}
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40">
              <div className="flex items-center justify-between text-purple-300 text-xs font-bold mb-1">
                <span>{isBangla ? 'পুল ২: লিটন ও মিলন (১/৩)' : 'Pool 2: Liton & Milon (1/3)'}</span>
                <span className="font-mono">33.33%</span>
              </div>
              <div className="text-base font-mono font-bold text-purple-200">
                {formatBDT(pool2_litonMilonPoolBdt)}
              </div>
              <p className="text-[10px] text-purple-400/80 mt-1">
                {isBangla ? 'লিটন ও মিলন প্রত্যেকে ১/৬ করে (৳ ' + (pool2_litonWorkingBdt).toFixed(0) + ')' : 'Split 50/50: Liton 1/6, Milon 1/6'}
              </p>
            </div>

            {/* Pool 3 */}
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
              <div className="flex items-center justify-between text-amber-300 text-xs font-bold mb-1">
                <span>{isBangla ? 'পুল ৩: টাকা ওয়ালা মূলধন (১/৩)' : 'Pool 3: Capital "Taka Wala" (1/3)'}</span>
                <span className="font-mono">33.33%</span>
              </div>
              <div className="text-base font-mono font-bold text-amber-200">
                {formatBDT(pool3_capitalPoolBdt)}
              </div>
              <p className="text-[10px] text-amber-400/80 mt-1">
                {isBangla ? 'মূলধন অনুপাত: ইউসুফ ৪০%, লিটন ৩০%, মিলন ৩০%' : 'Allocated strictly by Capital Ratio'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Hisab Cards (Remaining Due / Paona) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              {isBangla ? 'পার্টনারদের পাওনা ও উত্তোলন বিবরণী (হিসাব খাতা)' : 'Partners Net Due & Drawing Ledger'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isBangla ? 'মোট মূলধন: ' : 'Total Capital: '} {formatBDT(totalCapitalBdt)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {partnerBreakdown.map((p) => {
            const hasSurplus = p.remainingDueBdt >= 0;

            return (
              <div
                key={p.partnerName}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Partner Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-slate-100">
                          {p.partnerName}
                        </span>
                        <span className="text-xs text-amber-400 font-medium">
                          ({p.banglaName})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.role}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Cap: {(p.capitalRatio * 100).toFixed(0)}%
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditPartner(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(isBangla ? 'আপনি কি নিশ্চিতভাবে এই পার্টনারকে বাদ দিতে চান?' : 'Are you sure you want to delete this partner?')) {
                              onDeletePartner(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calculations details */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{isBangla ? 'বিনিয়োগকৃত মূলধন' : 'Capital Contribution'}:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {formatBDT(p.capitalBdt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>{isBangla ? 'ওয়ার্কিং শেয়ার (পরিশ্রমিক)' : 'Working Share'}:</span>
                      <span className="font-mono font-semibold text-blue-400">
                        +{formatBDT(p.workingShare)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>{isBangla ? 'মূলধন শেয়ার (টাকা ওয়ালা)' : 'Capital Pool Share'}:</span>
                      <span className="font-mono font-semibold text-amber-400">
                        +{formatBDT(p.capitalShare)}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-medium">
                      <span className="text-slate-300">
                        {isBangla ? 'সর্বমোট লাভ শেয়ার' : 'Total Profit Share'}:
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatBDT(p.totalProfitShare)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-rose-400 font-medium">
                      <span>{isBangla ? 'ব্যক্তিগত উত্তোলন (হাওয়ালা)' : 'Minus Total Drawings'}:</span>
                      <span className="font-mono font-bold">
                        -{formatBDT(p.partnerDrawings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Net Due (Paona) Box */}
                <div
                  className={`mt-4 p-3 rounded-xl border ${
                    hasSurplus
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-rose-950/40 border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider text-slate-300 block">
                        {hasSurplus
                          ? isBangla ? 'নেট পাওনা (Remaining Due)' : 'Net Due to Partner (Paona)'
                          : isBangla ? 'অতিরিক্ত উত্তোলন (Overdrawn)' : 'Overdrawn Balance'}
                      </span>
                      <span className="text-lg font-mono font-extrabold text-white">
                        {formatBDT(p.remainingDueBdt)}
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded-lg ${
                        hasSurplus
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {hasSurplus ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawings Ledger Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MinusCircle className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold text-slate-200">
              {isBangla ? 'পার্টনার ড্রয়িংস / ব্যক্তিগত উত্তোলন খাতা' : 'Partner Drawings History'}
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isBangla ? 'মোট উত্তোলন: ' : 'Total Withdrawn: '}
            {formatBDT(drawings.reduce((s, d) => s + d.amountBdt, 0))}
          </span>
        </div>

        {drawings.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            {isBangla ? 'কোন উত্তোলন রেকর্ড নেই।' : 'No partner drawings recorded.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2">{isBangla ? 'তারিখ' : 'Date'}</th>
                  <th className="py-2 px-2">{isBangla ? 'পার্টনার' : 'Partner'}</th>
                  <th className="py-2 px-2">{isBangla ? 'অ্যাকাউন্ট' : 'Account'}</th>
                  <th className="py-2 px-2">{isBangla ? 'বিবরণ' : 'Purpose / Note'}</th>
                  <th className="py-2 px-2">{isBangla ? 'ভাউচার নং' : 'Voucher'}</th>
                  <th className="py-2 px-2 text-right">{isBangla ? 'পরিমাণ (BDT)' : 'Amount'}</th>
                  <th className="py-2 px-2 text-right">{isBangla ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {drawings.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 text-slate-300">{formatDate(d.date)}</td>
                    <td className="py-2.5 px-2 font-sans font-bold text-amber-300">
                      {d.partnerName}
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{d.account}</td>
                    <td className="py-2.5 px-2 font-sans text-slate-300">{d.note}</td>
                    <td className="py-2.5 px-2 text-slate-400">{d.refVoucher || '-'}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-rose-400">
                      -{formatBDT(d.amountBdt)}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(isBangla ? 'আপনি কি নিশ্চিতভাবে এই উত্তোলনটি ডিলিট করতে চান?' : 'Are you sure you want to delete this drawing?')) {
                            onDeleteDrawing(d.id);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-900/30 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Partner Drawing Modal */}
      {showAddDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-amber-400" />
                {isBangla ? 'পার্টনার উত্তোলন / হাওয়ালা এন্ট্রি' : 'Record Partner Drawing'}
              </h3>
              <button
                onClick={() => setShowAddDrawingModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDrawing} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'পার্টনার নির্বাচন করুন' : 'Select Partner'}
                </label>
                <select
                  value={drawingPartner}
                  onChange={(e: any) => setDrawingPartner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.partnerName}>
                      {p.partnerName} ({p.banglaName}) - {p.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'উত্তোলনকৃত টাকার পরিমাণ (BDT)' : 'Withdrawal Amount (BDT)'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={drawingAmount}
                  onChange={(e) => setDrawingAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'প্রদানকারী অ্যাকাউন্ট' : 'Paying Account'}
                </label>
                <select
                  value={drawingAccount}
                  onChange={(e) => setDrawingAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Cash (নগদ ক্যাশ)">Cash (নগদ ক্যাশ)</option>
                  <option value="NRBC 925 (Huzaifa)">NRBC 925 (Huzaifa)</option>
                  <option value="DBBL 1328 (Aksara)">DBBL 1328 (Aksara)</option>
                  <option value="DBBL 21708 (Yousuf)">DBBL 21708 (Yousuf)</option>
                  <option value="DBBL 17052 (Rafi)">DBBL 17052 (Rafi)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={drawingDate}
                  onChange={(e) => setDrawingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'বিবরণ / কারণ' : 'Note / Reason'}
                </label>
                <input
                  type="text"
                  placeholder={isBangla ? 'মাসিক হাতখরচ বা অগ্রিম' : 'Monthly withdrawal / personal advance'}
                  value={drawingNote}
                  onChange={(e) => setDrawingNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDrawingModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isBangla ? 'সংরক্ষণ করুন' : 'Save Drawing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingPartner
                  ? (isBangla ? 'পার্টনার তথ্য পরিবর্তন' : 'Edit Partner Information')
                  : (isBangla ? 'নতুন পার্টনার যোগ করুন' : 'Add New Partner')
                }
              </h3>
              <button
                onClick={() => setShowPartnerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'পার্টনারের নাম (English)' : 'Partner Name (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'পার্টনারের নাম (Bangla)' : 'Partner Name (Bangla)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerBanglaName}
                    onChange={(e) => setPartnerBanglaName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'পদবী / দায়িত্ব' : 'Role / Responsibility'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Partner"
                  value={partnerRole}
                  onChange={(e) => setPartnerRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'মূলধন (BDT)' : 'Capital (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={partnerCapital}
                    onChange={(e) => setPartnerCapital(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'মূলধন অনুপাত (%)' : 'Capital Ratio (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={partnerRatio}
                    onChange={(e) => setPartnerRatio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'ওয়ার্কিং শেয়ার (%)' : 'Working Share (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={partnerWorkingRatio}
                    onChange={(e) => setPartnerWorkingRatio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-400">
                <p className="font-bold text-slate-300 mb-1">Distribution Logic:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Pool 1 (1/3): 100% to Yousuf (Fixed legacy logic if name matches).</li>
                  <li>Pool 2 (1/3): Split among partners with Working Share %. If empty, split equally between Liton & Milon (Fixed legacy).</li>
                  <li>Pool 3 (1/3): Split among ALL partners based on Capital Ratio %.</li>
                </ul>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                >
                  {isBangla ? 'সংরক্ষণ করুন' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
