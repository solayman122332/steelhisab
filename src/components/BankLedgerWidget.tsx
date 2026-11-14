import React, { useState } from 'react';
import {
  Landmark,
  Wallet,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  DollarSign,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import { BankAccount, AccountType, Transaction, PartnerDrawing } from '../types';
import { formatBDT, formatDate } from '../utils/formatters';

interface BankLedgerWidgetProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  drawings?: PartnerDrawing[];
  onOpenTransfer: () => void;
  onAddAccount: (account: Omit<BankAccount, 'id' | 'balanceBdt'>) => Promise<void>;
  onEditAccount: (id: string, updatedFields: Partial<BankAccount>) => Promise<void>;
  onDeleteAccount: (id: string, reassignToAccountId?: string) => Promise<void>;
  isBangla: boolean;
}

export const BankLedgerWidget: React.FC<BankLedgerWidgetProps> = ({
  accounts,
  transactions,
  drawings = [],
  onOpenTransfer,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  isBangla,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formAccountNo, setFormAccountNo] = useState('');
  const [formType, setFormType] = useState<AccountType>('Bank');
  const [formOpeningBalance, setFormOpeningBalance] = useState('');
  const [formHolderName, setFormHolderName] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Filter transactions for selected account
  const accountTransactions = selectedAccount
    ? transactions.filter(
        (t) =>
          t.account === selectedAccount.name ||
          (selectedAccount.shortName && t.account === selectedAccount.shortName) ||
          t.toAccount === selectedAccount.name ||
          (selectedAccount.shortName && t.toAccount === selectedAccount.shortName)
      )
    : [];

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balanceBdt || 0), 0);

  // Helper to open Add Modal
  const openAddModal = () => {
    setFormName('');
    setFormAccountNo('');
    setFormType('Bank');
    setFormOpeningBalance('0');
    setFormHolderName('');
    setFormBranch('');
    setIsAddModalOpen(true);
  };

  // Helper to open Edit Modal
  const openEditModal = (acc: BankAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormAccountNo(acc.accountNo);
    setFormType(acc.type);
    setFormOpeningBalance(String(acc.openingBalanceBdt ?? acc.balanceBdt ?? 0));
    setFormHolderName(acc.holderName || '');
    setFormBranch(acc.branch || '');
  };

  // Helper to open Delete Modal
  const openDeleteModal = (acc: BankAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingAccount(acc);
    const otherAccount = accounts.find((a) => a.id !== acc.id);
    setReassignTargetId(otherAccount ? otherAccount.id : '');
  };

  // Calculate credits and debits for an account
  const getAccountCreditsAndDebits = (acc: BankAccount) => {
    let credits = 0;
    let debits = 0;

    transactions.forEach((tx) => {
      const isPrimary = tx.account === acc.name || (acc.shortName && tx.account === acc.shortName);
      const isDestination = tx.toAccount === acc.name || (acc.shortName && tx.toAccount === acc.shortName);

      if (isPrimary) {
        if (tx.type === 'Sale' || tx.type === 'Receipt') {
          credits += tx.totalBdt || 0;
        } else if (tx.type === 'Expense' || tx.type === 'Purchase' || tx.type === 'Payment') {
          debits += tx.totalBdt || 0;
        } else if (tx.type === 'Fund Transfer') {
          debits += tx.totalBdt || 0;
        }
      }

      if (isDestination && tx.type === 'Fund Transfer') {
        credits += tx.totalBdt || 0;
      }
    });

    drawings.forEach((drw) => {
      if (drw.account === acc.name || (acc.shortName && drw.account === acc.shortName)) {
        debits += drw.amountBdt || 0;
      }
    });

    return { credits, debits };
  };

  // Handle Save (Add or Edit)
  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    const openingBal = parseFloat(formOpeningBalance) || 0;

    try {
      if (editingAccount) {
        await onEditAccount(editingAccount.id, {
          name: formName.trim(),
          shortName: formName.trim(),
          accountNo: formAccountNo.trim() || 'N/A',
          type: formType,
          openingBalanceBdt: openingBal,
          holderName: formHolderName.trim() || 'Partnership',
          branch: formBranch.trim() || 'General',
        });
        setEditingAccount(null);
      } else {
        await onAddAccount({
          name: formName.trim(),
          shortName: formName.trim(),
          accountNo: formAccountNo.trim() || 'N/A',
          type: formType,
          openingBalanceBdt: openingBal,
          holderName: formHolderName.trim() || 'Partnership',
          branch: formBranch.trim() || 'General',
        });
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setIsSubmitting(true);
    try {
      await onDeleteAccount(deletingAccount.id, reassignTargetId || undefined);
      if (selectedAccountId === deletingAccount.id) {
        setSelectedAccountId(null);
      }
      setDeletingAccount(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check how many transactions are linked to the account being deleted
  const getLinkedTransactionsCount = (acc: BankAccount) => {
    return transactions.filter(
      (t) =>
        t.account === acc.name ||
        (acc.shortName && t.account === acc.shortName) ||
        t.toAccount === acc.name ||
        (acc.shortName && t.toAccount === acc.shortName)
    ).length;
  };

  const getTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'Cash':
        return <Wallet className="w-4 h-4" />;
      case 'Mobile Wallet':
        return <Smartphone className="w-4 h-4" />;
      case 'Bank':
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              {isBangla ? 'ব্যাংক ও ক্যাশ লেজার (অ্যাকাউন্টস মডিউল)' : 'Bank & Cash Ledgers'}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {accounts.length} {isBangla ? 'টি অ্যাকাউন্ট' : 'Accounts'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBangla
              ? 'সকল ব্যাংক, নগদ ক্যাশ ও মোবাইল ওয়ালেট পরিচালনা করুন (যুক্ত, পরিবর্তন ও মুছে ফেলুন)'
              : 'Manage live balances, accounts, and inter-bank transfers with full Add, Edit & Delete support'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="text-right mr-1">
            <span className="text-[11px] text-slate-400 block">
              {isBangla ? 'সর্বমোট স্থিতি' : 'Total Portfolio Balance'}
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">
              {formatBDT(totalBalance)}
            </span>
          </div>

          {/* Add Account Button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95"
            title="Add a new Bank, Cash or Mobile Wallet account"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isBangla ? '+ নতুন অ্যাকাউন্ট' : '+ Add Account'}</span>
          </button>

          {/* Fund Transfer Button */}
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Transfer between Cash & Banks"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-300" />
            <span>{isBangla ? 'তহবিল স্থানান্তর' : 'Fund Transfer'}</span>
          </button>
        </div>
      </div>

      {/* Accounts Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mt-4">
        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const isCash = acc.type === 'Cash';
          const isMobile = acc.type === 'Mobile Wallet';

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(isSelected ? null : acc.id)}
              className={`group cursor-pointer relative p-3.5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Account Top Row: Icon, Type Badge & Edit/Delete Action Buttons */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    isCash
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isMobile
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {getTypeIcon(acc.type)}
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      acc.balanceBdt >= 0
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {acc.type}
                  </span>

                  {/* Edit Pencil Button */}
                  <button
                    onClick={(e) => openEditModal(acc, e)}
                    className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors ml-1"
                    title={isBangla ? 'অ্যাকাউন্ট সম্পাদনা করুন' : 'Edit Account'}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>

                  {/* Delete Trash Button */}
                  <button
                    onClick={(e) => openDeleteModal(acc, e)}
                    className="p-1 rounded bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors"
                    title={isBangla ? 'অ্যাকাউন্ট মুছে ফেলুন' : 'Delete Account'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                {acc.name}
              </h3>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                {acc.accountNo}
              </p>

              {/* Balance */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{isBangla ? 'বর্তমান স্থিতি' : 'Live Balance'}</span>
                  {acc.openingBalanceBdt !== undefined && (
                    <span className="font-mono">
                      Op: {formatBDT(acc.openingBalanceBdt, false)}
                    </span>
                  )}
                </div>
                <div className="text-sm font-mono font-bold text-slate-100 group-hover:text-amber-300">
                  {formatBDT(acc.balanceBdt)}
                </div>
              </div>

              {/* Holder & Branch */}
              <p className="text-[9px] text-slate-500 truncate mt-1">
                {acc.holderName || 'Partnership'} {acc.branch ? `• ${acc.branch}` : ''}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Account Drilldown Statement */}
      {selectedAccount && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 animate-fadeIn">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                {selectedAccount.name} — {isBangla ? 'লেনদেনের বিবরণী' : 'Account Statement'}
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {isBangla ? 'প্রারম্ভিক স্থিতি: ' : 'Opening Balance: '}
                <strong className="text-slate-200">{formatBDT(selectedAccount.openingBalanceBdt || 0)}</strong>
              </span>
              <button
                onClick={() => setSelectedAccountId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ {isBangla ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>

          {accountTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              {isBangla
                ? 'এই অ্যাকাউন্টে এখনও কোন সরাসরি লেনদেন রেকর্ড করা হয়নি।'
                : 'No recent transactions recorded under this specific account yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="py-2 px-2">{isBangla ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2 px-2">{isBangla ? 'ধরণ' : 'Type'}</th>
                    <th className="py-2 px-2">{isBangla ? 'পার্টি / বিবরণ' : 'Party / Note'}</th>
                    <th className="py-2 px-2">{isBangla ? 'রেফারেন্স' : 'Ref / Slip'}</th>
                    <th className="py-2 px-2 text-right">{isBangla ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {accountTransactions.slice(0, 10).map((tx) => {
                    const isCredit =
                      tx.type === 'Sale' ||
                      tx.type === 'Receipt' ||
                      tx.toAccount === selectedAccount.name ||
                      (selectedAccount.shortName && tx.toAccount === selectedAccount.shortName);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-900/60">
                        <td className="py-2 px-2 text-slate-300">{formatDate(tx.date)}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                              isCredit
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-sans text-slate-200">
                          <div className="font-medium truncate max-w-xs">{tx.party}</div>
                          {tx.note && <div className="text-[10px] text-slate-500 truncate">{tx.note}</div>}
                        </td>
                        <td className="py-2 px-2 text-slate-400">{tx.refNo || '-'}</td>
                        <td
                          className={`py-2 px-2 text-right font-bold ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatBDT(tx.totalBdt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT ACCOUNT MODAL */}
      {(isAddModalOpen || editingAccount) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  {editingAccount ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100">
                    {editingAccount
                      ? isBangla ? 'অ্যাকাউন্ট সম্পাদনা' : 'Edit Account'
                      : isBangla ? 'নতুন অ্যাকাউন্ট যুক্ত করুন' : 'Add New Account'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingAccount
                      ? isBangla ? 'নাম পরিবর্তন করলে পূর্বের লেনদেন স্বয়ংক্রিয়ভাবে আপডেট হবে' : 'Updates live ledgers and linked transactions'
                      : isBangla ? 'ব্যাংক, ক্যাশ বা মোবাইল ওয়ালেট (bKash/Nagad)' : 'Bank, Cash, or Mobile Wallet (bKash/Nagad)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingAccount(null);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAccount} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'অ্যাকাউন্টের নাম' : 'Account Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NRBC 925, DBBL 1328, Cash, bKash"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'অ্যাকাউন্টের ধরণ' : 'Account Type'} *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccountType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="Bank">Bank (ব্যাংক অ্যাকাউন্ট)</option>
                    <option value="Cash">Cash (নগদ ক্যাশ)</option>
                    <option value="Mobile Wallet">Mobile Wallet (bKash / Nagad / Rocket)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'প্রারম্ভিক স্থিতি (Opening Balance BDT)' : 'Opening Balance (BDT)'} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500000"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'অ্যাকাউন্ট নম্বর / বিবরণ' : 'Account Number / Details'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01021000925 or 01711-XXXXXX"
                  value={formAccountNo}
                  onChange={(e) => setFormAccountNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">
                    {isBangla ? 'অ্যাকাউন্ট হোল্ডার' : 'Holder Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Huzaifa Steel Trading"
                    value={formHolderName}
                    onChange={(e) => setFormHolderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    {isBangla ? 'শাখা / গোডাউন' : 'Branch / Location'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jubilee Road, Ctg"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Dynamic Balance Preview Card */}
              {editingAccount && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                  {(() => {
                    const { credits, debits } = getAccountCreditsAndDebits(editingAccount);
                    const opening = parseFloat(formOpeningBalance) || 0;
                    const calculatedLive = opening + credits - debits;

                    return (
                      <>
                        <div className="flex justify-between text-slate-400 font-sans">
                          <span>{isBangla ? 'ব্যালেন্সের সূত্র:' : 'Balance Formula:'}</span>
                          <span>Opening + Credits - Debits</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Opening Balance:</span>
                          <span>{formatBDT(opening)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Total Credits (Inflow):</span>
                          <span>+{formatBDT(credits)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Total Debits (Outflow):</span>
                          <span>-{formatBDT(debits)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-amber-300 pt-1 border-t border-slate-800">
                          <span>Current Balance (BDT):</span>
                          <span>{formatBDT(calculatedLive)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingAccount(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting
                    ? isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'
                    : editingAccount
                    ? isBangla ? 'আপডেট করুন' : 'Update Account'
                    : isBangla ? 'অ্যাকাউন্ট যুক্ত করুন' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100">
                  {isBangla ? 'অ্যাকাউন্ট মুছে ফেলা নিশ্চিত করুন' : 'Confirm Account Deletion'}
                </h3>
                <p className="text-xs text-slate-400">
                  {deletingAccount.name} ({formatBDT(deletingAccount.balanceBdt)})
                </p>
              </div>
            </div>

            {(() => {
              const linkedCount = getLinkedTransactionsCount(deletingAccount);

              return (
                <div className="space-y-3 text-xs text-slate-300">
                  {linkedCount > 0 ? (
                    <>
                      <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300">
                        <p className="font-bold mb-1">
                          ⚠️ {isBangla ? 'সতর্কতা: লেনদেন সংযুক্ত রয়েছে!' : 'Warning: Linked Transactions Detected!'}
                        </p>
                        <p>
                          {isBangla
                            ? `এই অ্যাকাউন্টের সাথে মোট ${linkedCount} টি লেনদেন সংযুক্ত রয়েছে। অ্যাকাউন্ট মুছে ফেলার আগে এই লেনদেনগুলোকে অন্য কোনো অ্যাকাউন্টে স্থানান্তর (Reassign) করুন:`
                            : `This account is linked to ${linkedCount} transaction(s). Please choose another active account to safely reassign those records to:`}
                        </p>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isBangla ? 'স্থানান্তরের জন্য অ্যাকাউন্ট নির্বাচন করুন (Reassign To)' : 'Reassign Transactions To:'}
                        </label>
                        <select
                          value={reassignTargetId}
                          onChange={(e) => setReassignTargetId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                        >
                          {accounts
                            .filter((a) => a.id !== deletingAccount.id)
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({formatBDT(a.balanceBdt)})
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400">
                      {isBangla
                        ? 'এই অ্যাকাউন্টের সাথে কোন সক্রিয় লেনদেন সংযুক্ত নেই। আপনি এটি নিরাপদে মুছে ফেলতে পারেন।'
                        : 'No active transactions are tied to this account. It can be safely deleted.'}
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingAccount(null)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      {isBangla ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? isBangla ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'
                        : isBangla ? 'স্থায়ীভাবে মুছুন' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
