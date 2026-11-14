import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Receipt,
  ShoppingCart,
  ArrowRightLeft,
  CreditCard,
  BookOpen,
  Download,
  Calculator,
  Scale,
  Truck,
  Hash,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  BankAccount,
  InventoryLC,
  Party,
  Transaction,
  TransactionType,
} from '../types';
import {
  calculateSaleProfit,
  calculateSaleTotal,
  calculateShortage,
  formatBDT,
  formatWeight,
} from '../utils/formatters';
import { MetalWeightCalculatorModal } from './MetalWeightCalculatorModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  editingTransaction?: Transaction | null;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate?: (id: string, updatedTx: Partial<Transaction>) => Promise<void>;
  accounts: BankAccount[];
  parties: Party[];
  inventoryLCs: InventoryLC[];
  isBangla: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  editingTransaction,
  onSave,
  onUpdate,
  accounts,
  parties,
  inventoryLCs,
  isBangla,
}) => {
  if (!isOpen) return null;

  // Form states
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [lcNo, setLcNo] = useState<string>('OMI 169');
  const [weightKg, setWeightKg] = useState<string>('');
  const [scaleWeightKg, setScaleWeightKg] = useState<string>('');
  const [rateBdt, setRateBdt] = useState<string>('');
  const [lessBdt, setLessBdt] = useState<string>('0');
  const [costBdt, setCostBdt] = useState<string>('');
  const [account, setAccount] = useState<string>(accounts[0]?.name || 'Cash (নগদ ক্যাশ)');
  const [toAccount, setToAccount] = useState<string>(accounts[1]?.name || 'NRBC 925 (Huzaifa)');
  const [refNo, setRefNo] = useState<string>(`CH-${Date.now().toString().slice(-5)}`);
  const [truckNo, setTruckNo] = useState<string>('');
  const [coilNo, setCoilNo] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMetalCalcOpen, setIsMetalCalcOpen] = useState(false);

  // Sync state if editing
  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setSelectedParty(editingTransaction.party || '');
      setLcNo(editingTransaction.lcNo || 'OMI 169');
      setWeightKg(editingTransaction.weightKg ? String(editingTransaction.weightKg) : '');
      setScaleWeightKg(editingTransaction.scaleWeightKg ? String(editingTransaction.scaleWeightKg) : '');
      setRateBdt(
        editingTransaction.rateBdt
          ? String(editingTransaction.rateBdt)
          : editingTransaction.totalBdt
          ? String(editingTransaction.totalBdt)
          : ''
      );
      setLessBdt(editingTransaction.lessBdt !== undefined ? String(editingTransaction.lessBdt) : '0');
      setCostBdt(editingTransaction.costBdt ? String(editingTransaction.costBdt) : '');
      setAccount(editingTransaction.account || accounts[0]?.name || 'Cash (নগদ ক্যাশ)');
      setToAccount(editingTransaction.toAccount || accounts[1]?.name || 'NRBC 925 (Huzaifa)');
      setRefNo(editingTransaction.refNo || '');
      setTruckNo(editingTransaction.truckNo || '');
      setCoilNo(editingTransaction.coilNo || '');
      setNote(editingTransaction.note || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedParty('');
      setLcNo('OMI 169');
      setWeightKg('');
      setScaleWeightKg('');
      setRateBdt('');
      setLessBdt('0');
      setCostBdt('');
      setAccount(accounts[0]?.name || 'Cash (নগদ ক্যাশ)');
      setToAccount(accounts[1]?.name || 'NRBC 925 (Huzaifa)');
      setRefNo(`CH-${Date.now().toString().slice(-5)}`);
      setTruckNo('');
      setCoilNo('');
      setNote('');
    }
  }, [editingTransaction, isOpen, accounts]);

  // Auto-fill cost if LC is selected for Sales (only if not already editing existing cost)
  useEffect(() => {
    if (!editingTransaction && (type === 'Sale' || type === 'Sale Order') && lcNo) {
      const matchedLC = inventoryLCs.find((item) => item.lcNo === lcNo);
      if (matchedLC && matchedLC.landedCostBdtPerKg) {
        const wt = parseFloat(weightKg) || 0;
        if (wt > 0 && !costBdt) {
          setCostBdt((wt * matchedLC.landedCostBdtPerKg).toFixed(0));
        }
      }
    }
  }, [lcNo, weightKg, type, inventoryLCs, editingTransaction, costBdt]);

  // Numeric parsed values
  const numWeight = parseFloat(weightKg) || 0;
  const numScaleWeight = parseFloat(scaleWeightKg) || 0;
  const numRate = parseFloat(rateBdt) || 0;
  const numLess = parseFloat(lessBdt) || 0;
  const numCost = parseFloat(costBdt) || 0;

  // Steel Formulas:
  // Total = (Weight_KG * Rate) - Less_BDT
  const totalBdt = type === 'Sale' || type === 'Purchase' || type === 'Sale Order' || type === 'Purchase Order' || type === 'Quotation'
    ? calculateSaleTotal(numWeight, numRate, numLess)
    : parseFloat(lessBdt) || parseFloat(rateBdt) || 0; // For flat expense/payment

  // Profit = Total - Purchase_Cost_BDT
  const profitBdt = calculateSaleProfit(totalBdt, numCost);

  // Shortage = Coil_Weight - Scale_Copy_Weight
  const shortageKg = calculateShortage(numWeight, numScaleWeight);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const txPayload = {
      date,
      type,
      party: selectedParty || 'Cash Customer / General',
      lcNo: (type === 'Sale' || type === 'Purchase' || type === 'Sale Order' || type === 'Purchase Order') ? lcNo : undefined,
      weightKg: numWeight,
      scaleWeightKg: numScaleWeight > 0 ? numScaleWeight : undefined,
      rateBdt: numRate,
      lessBdt: numLess,
      totalBdt,
      costBdt: numCost,
      profitBdt,
      account,
      toAccount: type === 'Fund Transfer' ? toAccount : undefined,
      refNo,
      truckNo,
      coilNo,
      note,
      status: editingTransaction?.status || 'Completed',
    };

    try {
      if (editingTransaction && onUpdate) {
        await onUpdate(editingTransaction.id, txPayload);
      } else {
        await onSave(txPayload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const isSteelWeightType = ['Sale', 'Purchase', 'Sale Order', 'Purchase Order', 'Quotation'].includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl my-auto p-4 sm:p-6 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                type === 'Sale'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : type === 'Expense'
                  ? 'bg-rose-500/20 text-rose-400'
                  : type === 'Purchase'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                <span>{editingTransaction ? (isBangla ? 'সম্পাদনা: ' : 'Edit ') : ''}{type} Entry</span>
                <span className="text-xs font-normal text-amber-400">
                  {isBangla ? (type === 'Sale' ? 'বিক্রয় চালান' : type === 'Purchase' ? 'ক্রয় এন্ট্রি' : 'ভাউচার') : ''}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {editingTransaction
                  ? (isBangla ? 'পূর্ববর্তী হিসাব স্বয়ংক্রিয়ভাবে রিভার্স করে নতুন মান অনুযায়ী ব্যালেন্স আপডেট হবে' : 'Reverses previous financial impact & updates live balances')
                  : isSteelWeightType
                  ? 'Total = (Weight_KG * Rate) - Less_BDT | Profit = Total - Cost'
                  : 'Record financial ledger entry with live Google Sheets append'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Row 1: Date & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'তারিখ' : 'Date'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {type === 'Fund Transfer'
                  ? isBangla ? 'উৎস অ্যাকাউন্ট (From)' : 'Transfer From'
                  : isBangla ? 'পেমেন্ট / ডিপোজিট অ্যাকাউন্ট' : 'Account'}
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name} ({formatBDT(acc.balanceBdt)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fund Transfer Destination Account */}
          {type === 'Fund Transfer' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'গন্তব্য অ্যাকাউন্ট (To Account)' : 'Transfer To'}
              </label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                {accounts
                  .filter((acc) => acc.name !== account)
                  .map((acc) => (
                    <option key={acc.id} value={acc.name}>
                      {acc.name} ({formatBDT(acc.balanceBdt)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Row 2: Party & LC No */}
          {type !== 'Fund Transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {type === 'Sale' || type === 'Sale Order'
                    ? isBangla ? 'গ্রাহক / কাস্টমার পার্টি' : 'Customer Party'
                    : type === 'Purchase' || type === 'Purchase Order'
                    ? isBangla ? 'সরবরাহকারী / মিল মহাজন' : 'Supplier / Mill'
                    : isBangla ? 'পার্টি / প্রাপক' : 'Party / Recipient'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="parties-list"
                    placeholder="e.g. Kabir Steel & Hardware"
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="parties-list">
                    {parties.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* LC Number Selector */}
              {isSteelWeightType && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'এলসি নম্বর (LC No)' : 'Link to LC No.'}
                  </label>
                  <select
                    value={lcNo}
                    onChange={(e) => setLcNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-300"
                  >
                    <option value="">None / Local Stock</option>
                    {inventoryLCs.map((lc) => (
                      <option key={lc.id} value={lc.lcNo}>
                        {lc.lcNo} — {lc.grade} (Rem: {(lc.remainingWeightKg / 1000).toFixed(1)} MT)
                      </option>
                    ))}
                    <option value="CUSTOM">+ New / Other LC</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Steel Specific: Coil Weight vs Scale Copy Weight */}
          {isSteelWeightType && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  {isBangla ? 'ওজন হিসাব (কয়েল ওজন বনাম স্কেল কপি)' : 'Weight Tracking (Coil vs Scale Copy)'}
                </span>
                {numWeight > 0 && numScaleWeight > 0 && (
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      shortageKg > 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {isBangla ? 'শর্টেজ: ' : 'Shortage: '} {shortageKg} KG
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400">
                      {isBangla ? 'কয়েল / বিল ওজন (Qty kg)' : 'Qty / Coil Weight (KG)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsMetalCalcOpen(true)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                      title="Open Multi-Metal Weight Calculator (Sheet, Pipe, Angle, Bar)"
                    >
                      <Scale className="w-3 h-3 text-amber-400" />
                      <span>{isBangla ? 'মেটাল ক্যালকুলেটর' : 'Metal Calculator'}</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 22400"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  {numWeight >= 1000 && (
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      = {(numWeight / 1000).toFixed(3)} Metric Ton
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    {isBangla ? 'স্কেল কপি ওজন (Scale Copy Weight KG)' : 'Scale Copy Weight (KG)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 22280"
                    value={scaleWeightKg}
                    onChange={(e) => setScaleWeightKg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  {numScaleWeight >= 1000 && (
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      = {(numScaleWeight / 1000).toFixed(3)} Metric Ton
                    </span>
                  )}
                </div>
              </div>

              {/* Steel Rate, Less & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">
                    {isBangla ? 'দর প্রতি কেজি (Rate/KG BDT)' : 'Rate / KG (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 91.50"
                    value={rateBdt}
                    onChange={(e) => setRateBdt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    {isBangla ? 'লেস / ডিসকাউন্ট (Less BDT)' : 'Less / Deduction (BDT)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 15000"
                    value={lessBdt}
                    onChange={(e) => setLessBdt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    {isBangla ? 'ক্রয় খরচ (Cost BDT)' : 'Purchase Cost (BDT)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1848000"
                    value={costBdt}
                    onChange={(e) => setCostBdt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Live Calculation Output Card */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-400">
                    Formula: (Weight {numWeight.toLocaleString()} KG × Rate ৳{numRate}) - Less ৳{numLess.toLocaleString()}
                  </div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {isBangla ? 'মোট বিল (Total): ' : 'Total: '}
                    <span className="text-amber-400">{formatBDT(totalBdt)}</span>
                  </div>
                </div>

                {type === 'Sale' && (
                  <div className="sm:text-right">
                    <div className="text-[11px] text-slate-400">
                      Profit: Total - Cost ৳{numCost.toLocaleString()}
                    </div>
                    <div
                      className={`text-base font-bold font-mono ${
                        profitBdt >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {profitBdt >= 0 ? '+' : ''}{formatBDT(profitBdt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simple Amount Input for Flat Expenses/Payments/Transfers */}
          {!isSteelWeightType && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'টাকার পরিমাণ (Amount BDT)' : 'Amount (BDT)'}
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 45000"
                value={rateBdt}
                onChange={(e) => {
                  setRateBdt(e.target.value);
                  setLessBdt('0');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Row 3: Truck No, Coil No, Ref/Challan No */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">
                {isBangla ? 'ট্রাক নম্বর' : 'Truck / Fleet No.'}
              </label>
              <input
                type="text"
                placeholder="Chatto-Metro-Ta-11-8942"
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {isBangla ? 'কয়েল / বান্ডিল নং' : 'Coil / Heat / Mark'}
              </label>
              <input
                type="text"
                placeholder="COIL-OMI-08"
                value={coilNo}
                onChange={(e) => setCoilNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                {isBangla ? 'চালান / ভাউচার নং' : 'Challan / Ref No.'}
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-slate-400 mb-1">
              {isBangla ? 'মন্তব্য ও স্কেল বিবরণ' : 'Note & Godown / Scale Remarks'}
            </label>
            <input
              type="text"
              placeholder={isBangla ? 'ওজন স্লিপ নং, ড্রাইভার ফোন, মিল বিবরণ' : 'Scale slip number, driver phone, delivery note'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {isBangla
                  ? 'গুগল শিটে স্বয়ংক্রিয়ভাবে অ্যাপেন্ড হবে'
                  : 'Appends directly to Google Sheets via text/plain POST'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSaving
                  ? isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'
                  : editingTransaction
                  ? isBangla ? 'আপডেট ও রিক্যালকুলেট' : 'Update & Recalculate'
                  : isBangla ? 'সংরক্ষণ ও চালান এন্ট্রি' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Embedded Multi-Metal Weight Calculator */}
      <MetalWeightCalculatorModal
        isOpen={isMetalCalcOpen}
        onClose={() => setIsMetalCalcOpen(false)}
        onApplyWeight={(calculatedWeight) => {
          setWeightKg(String(calculatedWeight));
        }}
        isBangla={isBangla}
      />
    </div>
  );
};
