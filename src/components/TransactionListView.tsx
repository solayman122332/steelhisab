import React, { useState } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Printer,
  FileSpreadsheet,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  Download,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatBDT, formatDate } from '../utils/formatters';

interface TransactionListViewProps {
  transactions: Transaction[];
  onOpenNewTransaction: (type?: TransactionType) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onPrintChallan: (tx: Transaction) => void;
  isBangla: boolean;
  selectedFilterType?: TransactionType | 'All';
}

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onPrintChallan,
  isBangla,
  selectedFilterType = 'All',
}) => {
  const [filterType, setFilterType] = useState<string>(selectedFilterType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLc, setSelectedLc] = useState<string>('All');
  const [selectedAccount, setSelectedAccount] = useState<string>('All');
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    const matchesType = filterType === 'All' || tx.type === filterType;
    const matchesLc = selectedLc === 'All' || tx.lcNo === selectedLc;
    const matchesAccount =
      selectedAccount === 'All' ||
      tx.account === selectedAccount ||
      tx.toAccount === selectedAccount;
    const matchesSearch =
      tx.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.refNo && tx.refNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.truckNo && tx.truckNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.coilNo && tx.coilNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesLc && matchesAccount && matchesSearch;
  });

  // Calculate totals
  const totalAmountBdt = filtered.reduce((sum, t) => sum + (t.totalBdt || 0), 0);
  const totalWeightKg = filtered.reduce((sum, t) => sum + (t.weightKg || 0), 0);
  const totalProfitBdt = filtered
    .filter((t) => t.type === 'Sale')
    .reduce((sum, t) => sum + (t.profitBdt || 0), 0);

  const distinctLCs = Array.from(
    new Set(transactions.map((t) => t.lcNo).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-4">
      {/* Top Filter & Summary Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <span>
                {filterType === 'All'
                  ? isBangla ? 'সাধারণ লেনদেন খাতা (General Ledger)' : 'Transactions Ledger'
                  : `${filterType} Register`}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? 'স্টিল ক্রয়-বিক্রয়, কয়েল ও স্কেল ওজন, লেস কর্তন ও মুনাফা বিবরণী'
                : 'Steel sales, purchases, coil weights vs scale slips, less deductions & profits'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewTransaction('Sale')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all hover:scale-105"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isBangla ? '+ বিক্রয়' : '+ Sale'}</span>
            </button>
            <button
              onClick={() => onOpenNewTransaction('Expense')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all hover:scale-105"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isBangla ? '+ খরচ' : '+ Expense'}</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isBangla ? 'পার্টি, চালান, ট্রাক বা কয়েল...' : 'Party, Challan, Truck, Coil...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">{isBangla ? 'সকল প্রকার (All Types)' : 'All Types'}</option>
              <option value="Sale">Sale (বিক্রয়)</option>
              <option value="Purchase">Purchase (ক্রয়)</option>
              <option value="Expense">Expense (খরচ)</option>
              <option value="Payment">Payment (প্রদান)</option>
              <option value="Receipt">Receipt (জমা)</option>
              <option value="Fund Transfer">Fund Transfer (স্থানান্তর)</option>
              <option value="Journal">Journal (জার্নাল)</option>
              <option value="Sale Order">Sale Order (বিক্রয় অর্ডার)</option>
              <option value="Purchase Order">Purchase Order (ক্রয় অর্ডার)</option>
              <option value="Quotation">Quotation (কোটেশন)</option>
            </select>
          </div>

          {/* LC Filter */}
          <div>
            <select
              value={selectedLc}
              onChange={(e) => setSelectedLc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="All">{isBangla ? 'সকল এলসি (All LCs)' : 'All LCs'}</option>
              {distinctLCs.map((lc) => (
                <option key={lc} value={lc}>
                  LC: {lc}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Total Filtered:</span>
            <span className="font-mono font-bold text-amber-300">
              {formatBDT(totalAmountBdt)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {isBangla ? 'কোন লেনদেন পাওয়া যায়নি।' : 'No transactions match the selected filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Party & Details</th>
                  <th className="py-3 px-3">LC No.</th>
                  <th className="py-3 px-3">Weight (KG)</th>
                  <th className="py-3 px-3">Scale (KG)</th>
                  <th className="py-3 px-3">Rate/KG</th>
                  <th className="py-3 px-3">Less</th>
                  <th className="py-3 px-3 text-right">Total (BDT)</th>
                  <th className="py-3 px-3 text-right">Profit (BDT)</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-3 text-center">{isBangla ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((tx) => {
                  const isSale = tx.type === 'Sale';
                  const isExpense = tx.type === 'Expense';
                  const isPurchase = tx.type === 'Purchase';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-slate-300">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSale
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isExpense
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isPurchase
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-slate-100 max-w-xs truncate">
                          {tx.party}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {tx.refNo && <span>Ref: {tx.refNo}</span>}
                          {tx.truckNo && <span>🚛 {tx.truckNo}</span>}
                          {tx.coilNo && <span>Coil: {tx.coilNo}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {tx.lcNo ? (
                          <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {tx.lcNo}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {tx.weightKg > 0 ? (
                          <span>
                            {tx.weightKg.toLocaleString()}
                            <span className="text-[10px] text-slate-500 ml-1">
                              ({(tx.weightKg / 1000).toFixed(2)}MT)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {tx.scaleWeightKg ? (
                          <span className="text-emerald-400">
                            {tx.scaleWeightKg.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {tx.rateBdt > 0 ? `৳${tx.rateBdt}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-rose-400">
                        {tx.lessBdt > 0 ? `-${formatBDT(tx.lessBdt, false)}` : '0'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        <span
                          className={
                            isExpense
                              ? 'text-rose-400'
                              : isSale
                              ? 'text-emerald-400'
                              : 'text-slate-100'
                          }
                        >
                          {formatBDT(tx.totalBdt)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        {isSale ? (
                          <span
                            className={
                              tx.profitBdt >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {tx.profitBdt >= 0 ? '+' : ''}
                            {formatBDT(tx.profitBdt)}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans text-[11px] text-slate-300">
                        <div className="truncate max-w-[130px]">{tx.account}</div>
                        {tx.toAccount && (
                          <div className="text-[10px] text-indigo-400">
                            ➔ {tx.toAccount}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditTransaction && (
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                              title={isBangla ? 'সম্পাদনা করুন' : 'Edit Transaction'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTransaction && (
                            <button
                              onClick={() => setDeletingTx(tx)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 transition-colors"
                              title={isBangla ? 'মুছে ফেলুন ও হিসাব রিভার্স করুন' : 'Delete & Recalculate'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onPrintChallan(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
                            title="Print Delivery Challan / Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog with Reverse Accounting Warning */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scaleUp text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100">
                    {isBangla ? 'লেনদেন মুছে ফেলা নিশ্চিত করুন' : 'Confirm Transaction Deletion'}
                  </h3>
                  <span className="text-[11px] text-rose-400">
                    {isBangla ? 'স্বয়ংক্রিয় রিভার্স অ্যাকাউন্টিং প্রয়োগ হবে' : 'Automatic reverse accounting math will apply'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDeletingTx(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Transaction Summary */}
            <div className="my-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Ref / Date:</span>
                <span className="text-slate-200">{deletingTx.refNo || deletingTx.id} • {formatDate(deletingTx.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Type:</span>
                <span className="text-amber-400 font-bold font-sans">{deletingTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Party:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{deletingTx.party}</span>
              </div>
              {deletingTx.weightKg > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Weight:</span>
                  <span className="text-slate-200">{deletingTx.weightKg.toLocaleString()} KG {deletingTx.lcNo ? `(${deletingTx.lcNo})` : ''}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-slate-800 text-slate-100">
                <span className="font-sans">Amount:</span>
                <span className="text-emerald-400">{formatBDT(deletingTx.totalBdt)}</span>
              </div>
            </div>

            {/* Reversal Impact Explanation */}
            <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-[11px] text-rose-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-200">
                <span>⚠️ {isBangla ? 'যেসব হিসাব রিভার্স হবে:' : 'Financial Impacts to be Reversed:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {deletingTx.type === 'Sale' && (
                  <>
                    <li>Deduct <strong>{formatBDT(deletingTx.totalBdt)}</strong> from <strong>{deletingTx.account}</strong></li>
                    <li>Reduce <strong>{deletingTx.party}</strong> customer due balance by <strong>{formatBDT(deletingTx.totalBdt)}</strong></li>
                    {deletingTx.lcNo && deletingTx.weightKg > 0 && (
                      <li>Restore <strong>{deletingTx.weightKg.toLocaleString()} KG</strong> back into <strong>LC {deletingTx.lcNo}</strong> inventory</li>
                    )}
                  </>
                )}
                {deletingTx.type === 'Purchase' && (
                  <>
                    <li>Add <strong>{formatBDT(deletingTx.totalBdt)}</strong> back to <strong>{deletingTx.account}</strong></li>
                    <li>Reduce payable balance to <strong>{deletingTx.party}</strong></li>
                    {deletingTx.lcNo && deletingTx.weightKg > 0 && (
                      <li>Remove <strong>{deletingTx.weightKg.toLocaleString()} KG</strong> from inventory</li>
                    )}
                  </>
                )}
                {deletingTx.type === 'Expense' && (
                  <li>Add <strong>{formatBDT(deletingTx.totalBdt)}</strong> back to <strong>{deletingTx.account}</strong></li>
                )}
                {deletingTx.type === 'Payment' && (
                  <>
                    <li>Add <strong>{formatBDT(deletingTx.totalBdt)}</strong> back to <strong>{deletingTx.account}</strong></li>
                    <li>Restore payable debt to <strong>{deletingTx.party}</strong></li>
                  </>
                )}
                {deletingTx.type === 'Receipt' && (
                  <>
                    <li>Deduct <strong>{formatBDT(deletingTx.totalBdt)}</strong> from <strong>{deletingTx.account}</strong></li>
                    <li>Restore customer receivable due for <strong>{deletingTx.party}</strong></li>
                  </>
                )}
                {deletingTx.type === 'Fund Transfer' && (
                  <li>Reverse funds between source and destination accounts</li>
                )}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-3.5 mt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTransaction && deletingTx) {
                    onDeleteTransaction(deletingTx);
                  }
                  setDeletingTx(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              >
                {isBangla ? 'মুছুন ও রিক্যালকুলেট করুন' : 'Confirm Delete & Recalculate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
