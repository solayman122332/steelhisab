import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Phone,
  MapPin,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Briefcase,
  FileText,
  Pencil,
  Trash2,
  AlertTriangle,
  Scale,
  Calendar,
  X,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Party, Transaction } from '../types';
import { formatBDT, formatDate } from '../utils/formatters';

interface PartiesViewProps {
  parties: Party[];
  transactions: Transaction[];
  onAddParty: (party: Omit<Party, 'id'>) => Promise<void>;
  onEditParty?: (id: string, updated: Partial<Party>) => void;
  onDeleteParty?: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  isBangla: boolean;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  parties,
  transactions,
  onAddParty,
  onEditParty,
  onDeleteParty,
  onEditTransaction,
  onDeleteTransaction,
  isBangla,
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Customer' | 'Supplier'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // New party form
  const [name, setName] = useState('');
  const [type, setType] = useState<'Customer' | 'Supplier' | 'Both'>('Customer');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to calculate live party balance from opening balance + transactions
  const getPartyLiveBalance = (party: Party): number => {
    const opening =
      party.openingBalanceBdt !== undefined
        ? party.openingBalanceBdt
        : Math.abs(party.balanceBdt || 0);

    const partyTx = transactions.filter(
      (t) => t.party && t.party.toLowerCase() === party.name.toLowerCase()
    );

    if (party.type === 'Customer') {
      let due = opening;
      partyTx.forEach((t) => {
        if (t.type === 'Sale') {
          due += t.totalBdt || 0;
        } else if (t.type === 'Receipt' || t.type === 'Payment') {
          due -= t.totalBdt || 0;
        }
      });
      return due;
    } else if (party.type === 'Supplier') {
      let due = opening;
      partyTx.forEach((t) => {
        if (t.type === 'Purchase') {
          due += t.totalBdt || 0;
        } else if (t.type === 'Payment' || t.type === 'Receipt') {
          due -= t.totalBdt || 0;
        }
      });
      return -due; // Negative indicates payable to supplier
    } else {
      let due = opening;
      partyTx.forEach((t) => {
        if (t.type === 'Sale') due += t.totalBdt || 0;
        else if (t.type === 'Purchase') due -= t.totalBdt || 0;
        else if (t.type === 'Receipt') due -= t.totalBdt || 0;
        else if (t.type === 'Payment') due += t.totalBdt || 0;
      });
      return due;
    }
  };

  const filteredParties = parties.filter((p) => {
    const matchesFilter = filterType === 'All' || p.type === filterType || p.type === 'Both';
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || null;

  const totalReceivables = parties
    .filter((p) => p.type === 'Customer' || getPartyLiveBalance(p) > 0)
    .reduce((sum, p) => {
      const bal = getPartyLiveBalance(p);
      return sum + (bal > 0 ? bal : 0);
    }, 0);

  const totalPayables = parties
    .filter((p) => p.type === 'Supplier' || getPartyLiveBalance(p) < 0)
    .reduce((sum, p) => {
      const bal = getPartyLiveBalance(p);
      return sum + (bal < 0 ? Math.abs(bal) : 0);
    }, 0);

  const openAddParty = () => {
    setEditingParty(null);
    setName('');
    setType('Customer');
    setPhone('');
    setAddress('');
    setCreditLimit('');
    setInitialBalance('');
    setShowAddModal(true);
  };

  const openEditParty = (party: Party, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingParty(party);
    setName(party.name);
    setType(party.type);
    setPhone(party.phone);
    setAddress(party.address);
    setCreditLimit(party.creditLimit?.toString() || '');
    setInitialBalance((party.openingBalanceBdt ?? Math.abs(party.balanceBdt || 0)).toString());
    setShowAddModal(true);
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSaving(true);
    try {
      const openingNum = parseFloat(initialBalance) || 0;
      const payload = {
        name: name.trim(),
        type,
        phone: phone.trim(),
        address: address.trim(),
        creditLimit: parseFloat(creditLimit) || 0,
        openingBalanceBdt: openingNum,
        balanceBdt: type === 'Supplier' ? -Math.abs(openingNum) : openingNum,
        lastActive: new Date().toISOString().split('T')[0],
      };

      if (editingParty && onEditParty) {
        onEditParty(editingParty.id, payload);
      } else {
        await onAddParty(payload);
      }
      setShowAddModal(false);
      setEditingParty(null);
      setName('');
      setPhone('');
      setAddress('');
      setCreditLimit('');
      setInitialBalance('');
    } finally {
      setIsSaving(false);
    }
  };

  // Selected party transactions & running balance calculation
  const partyTransactions = selectedParty
    ? transactions.filter((t) => t.party && t.party.toLowerCase() === selectedParty.name.toLowerCase())
    : [];

  const sortedPartyTransactions = [...partyTransactions].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.id.localeCompare(b.id);
  });

  const openingBalance = selectedParty
    ? selectedParty.openingBalanceBdt !== undefined
      ? selectedParty.openingBalanceBdt
      : Math.abs(selectedParty.balanceBdt || 0)
    : 0;

  let runningCalc = openingBalance;
  let totalBilledSum = 0;
  let totalPaidSum = 0;

  const ledgerRows = sortedPartyTransactions.map((tx) => {
    let billAmount = 0;
    let paidAmount = 0;

    if (selectedParty?.type === 'Customer') {
      // Customer: Opening Balance + Sales (Total Bill) - Receipts (Amount Paid) = Running Due
      if (tx.type === 'Sale') {
        billAmount = tx.totalBdt || 0;
        runningCalc += billAmount;
      } else if (tx.type === 'Receipt' || tx.type === 'Payment') {
        paidAmount = tx.totalBdt || 0;
        runningCalc -= paidAmount;
      } else {
        billAmount = tx.totalBdt || 0;
        runningCalc += billAmount;
      }
    } else if (selectedParty?.type === 'Supplier') {
      // Supplier: Opening Balance + Purchases (Total Bill) - Payments (Amount Sent) = Running Due
      if (tx.type === 'Purchase') {
        billAmount = tx.totalBdt || 0;
        runningCalc += billAmount;
      } else if (tx.type === 'Payment' || tx.type === 'Receipt') {
        paidAmount = tx.totalBdt || 0;
        runningCalc -= paidAmount;
      } else {
        billAmount = tx.totalBdt || 0;
        runningCalc += billAmount;
      }
    } else {
      if (tx.type === 'Sale') {
        billAmount = tx.totalBdt || 0;
        runningCalc += billAmount;
      } else if (tx.type === 'Purchase') {
        paidAmount = tx.totalBdt || 0;
        runningCalc -= paidAmount;
      } else if (tx.type === 'Receipt') {
        paidAmount = tx.totalBdt || 0;
        runningCalc -= paidAmount;
      } else {
        billAmount = tx.totalBdt || 0;
        runningCalc += billAmount;
      }
    }

    totalBilledSum += billAmount;
    totalPaidSum += paidAmount;

    return {
      tx,
      billAmount,
      paidAmount,
      runningDue: runningCalc,
    };
  });

  const finalRunningDue = runningCalc;

  // Construct chronological trend points for Ledger Balance Trend Line Chart
  const trendData = selectedParty
    ? [
        {
          index: 0,
          date: 'Opening',
          rawDate: selectedParty.lastActive || 'Start',
          type: 'Opening',
          ref: 'Initial Ledger Base',
          runningDue: openingBalance,
          billAmount: 0,
          paidAmount: 0,
        },
        ...ledgerRows.map((row, idx) => ({
          index: idx + 1,
          date: formatDate(row.tx.date),
          rawDate: row.tx.date,
          type: row.tx.type,
          ref: row.tx.refNo || row.tx.lcNo || `TX-${row.tx.id.slice(-4)}`,
          runningDue: row.runningDue,
          billAmount: row.billAmount,
          paidAmount: row.paidAmount,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header and Aggregate stats */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isBangla ? 'গ্রাহক ও সরবরাহকারী পার্টি লেজার' : 'Parties & Customers Ledger'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? 'স্টিল ক্রেতা ও মিল মহাজনদের লাইভ লেজার রানিং ব্যালেন্স হিসাব'
                : 'Manage steel buyers, re-rolling mill suppliers, and live chronological running ledgers'}
            </p>
          </div>

          <button
            onClick={openAddParty}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBangla ? 'নতুন পার্টি যুক্ত করুন' : 'Add New Party'}</span>
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'মোট বাজার পাওনা (Receivables)' : 'Total Receivables (Customers)'}
            </span>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {formatBDT(totalReceivables)}
            </div>
            <span className="text-[10px] text-emerald-400/80">
              {isBangla ? 'কাস্টমারদের কাছে মোট পাওনা' : 'Market Due Owed to Us'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'মোট মিল দেনা (Payables)' : 'Total Payables (Suppliers)'}
            </span>
            <div className="text-lg font-mono font-bold text-rose-400">
              {formatBDT(totalPayables)}
            </div>
            <span className="text-[10px] text-rose-400/80">
              {isBangla ? 'মিল ও সরবরাহকারীদের প্রদেয়' : 'Owed to Meghna, Abul Khair, etc.'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'নেট পাওনা / দেনা ব্যালেন্স' : 'Net Market Exposure'}
            </span>
            <div className="text-lg font-mono font-bold text-amber-300">
              {formatBDT(totalReceivables - totalPayables)}
            </div>
            <span className="text-[10px] text-slate-400">Receivables minus Payables</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isBangla ? 'পার্টি নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন...' : 'Search by name, phone, address...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            {(['All', 'Customer', 'Supplier'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === filter
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {filter === 'All'
                  ? isBangla ? 'সকল পার্টি' : 'All'
                  : filter === 'Customer'
                  ? isBangla ? 'কাস্টমার' : 'Customers'
                  : isBangla ? 'মহাজন / সাপ্লায়ার' : 'Suppliers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Party Drilldown Ledger Statement */}
      {selectedParty && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl animate-scaleUp">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    selectedParty.type === 'Customer'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : selectedParty.type === 'Supplier'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {selectedParty.type}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {selectedParty.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {selectedParty.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedParty.address}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={(e) => openEditParty(selectedParty, e)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title={isBangla ? 'পার্টি এডিট করুন' : 'Edit Party'}
              >
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                <span>{isBangla ? 'এডিট' : 'Edit'}</span>
              </button>
              {onDeleteParty && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        isBangla
                          ? `আপনি কি নিশ্চিতভাবে "${selectedParty.name}" পার্টি মুছে ফেলতে চান?`
                          : `Are you sure you want to delete party "${selectedParty.name}"?`
                      )
                    ) {
                      onDeleteParty(selectedParty.id);
                      setSelectedPartyId(null);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors"
                  title={isBangla ? 'পার্টি মুছুন' : 'Delete Party'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBangla ? 'মুছুন' : 'Delete'}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedPartyId(null)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isBangla ? 'লেজার বন্ধ করুন' : 'Close Statement'}</span>
              </button>
            </div>
          </div>

          {/* Master Running KPI Cards (Total Due KPI) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                {isBangla ? 'প্রারম্ভিক ব্যালেন্স' : 'Opening Balance'}
              </span>
              <div className="font-mono text-sm sm:text-base font-bold text-slate-200">
                {formatBDT(openingBalance)}
              </div>
              <span className="text-[9px] text-slate-500">Initial Ledger Base</span>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                {selectedParty.type === 'Customer'
                  ? isBangla ? 'মোট বিক্রয় চালন (বিল)' : 'Total Sales (Debit)'
                  : isBangla ? 'মোট ক্রয় চালন (বিল)' : 'Total Purchases (Debit)'}
              </span>
              <div className="font-mono text-sm sm:text-base font-bold text-amber-300">
                {formatBDT(totalBilledSum)}
              </div>
              <span className="text-[9px] text-amber-400/70">
                {selectedParty.type === 'Customer' ? 'Billed to Customer' : 'Billed from Supplier'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                {selectedParty.type === 'Customer'
                  ? isBangla ? 'মোট প্রাপ্তি (জমা)' : 'Total Receipts (Credit)'
                  : isBangla ? 'মোট পরিশোধ (জমা)' : 'Total Payments (Credit)'}
              </span>
              <div className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                {formatBDT(totalPaidSum)}
              </div>
              <span className="text-[9px] text-emerald-400/70">Liquid funds cleared</span>
            </div>

            {/* Master Total Due KPI */}
            <div className="p-3 bg-gradient-to-br from-amber-950/40 to-slate-950 rounded-xl border-2 border-amber-500/60 shadow-lg">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block mb-1">
                {selectedParty.type === 'Customer'
                  ? isBangla ? 'মোট বকেয়া পাওনা (Current Due)' : 'Master Total Due (Receivable)'
                  : isBangla ? 'মোট প্রদেয় দেনা (Current Payable)' : 'Master Total Due (Payable)'}
              </span>
              <div className="font-mono text-base sm:text-lg font-black text-amber-300">
                {formatBDT(finalRunningDue)}
              </div>
              <span className="text-[9px] text-slate-400 font-mono">
                {selectedParty.type === 'Customer'
                  ? `Opening + Sales - Receipts`
                  : `Opening + Purchases - Payments`}
              </span>
            </div>
          </div>

          {/* Ledger Balance Trend Line Chart */}
          <div className="mb-5 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                {isBangla ? 'লেজার ব্যালেন্স ট্রেন্ড চার্ট (Ledger Trend)' : 'Ledger Balance Trend Timeline'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                X-axis: Timeline Dates · Y-axis: Running Due (BDT)
              </span>
            </div>

            <div className="h-48 sm:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="partyDueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={selectedParty.type === 'Supplier' ? '#c084fc' : '#f59e0b'}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={selectedParty.type === 'Supplier' ? '#c084fc' : '#f59e0b'}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700/90 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
                            <p className="font-bold text-slate-200 flex items-center justify-between gap-3">
                              <span>{data.date}</span>
                              <span className="text-[10px] text-amber-400 font-mono font-bold">
                                {data.type}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">{data.ref}</p>
                            <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-4 font-mono">
                              <span className="text-slate-400">Running Due:</span>
                              <span className="font-bold text-amber-300">
                                {formatBDT(data.runningDue)}
                              </span>
                            </div>
                            {data.billAmount > 0 && (
                              <p className="text-[10px] text-amber-400 font-mono">
                                + Bill: {formatBDT(data.billAmount)}
                              </p>
                            )}
                            {data.paidAmount > 0 && (
                              <p className="text-[10px] text-emerald-400 font-mono">
                                - Paid: {formatBDT(data.paidAmount)}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={openingBalance}
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Opening',
                      fill: '#94a3b8',
                      fontSize: 10,
                      position: 'insideBottomRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="runningDue"
                    stroke={selectedParty.type === 'Supplier' ? '#c084fc' : '#f59e0b'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#partyDueGradient)"
                    dot={{ r: 4, fill: '#0f172a', stroke: '#f59e0b', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chronological Running Ledger Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">LC / Ref / Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Weight (KG)</th>
                  <th className="py-2.5 px-3 text-right">Rate & Less</th>
                  <th className="py-2.5 px-3 text-right text-amber-300">
                    {selectedParty.type === 'Customer' ? 'Sales Bill (Debit)' : 'Purchase Bill (Debit)'}
                  </th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">
                    {selectedParty.type === 'Customer' ? 'Receipt (Credit)' : 'Payment (Credit)'}
                  </th>
                  <th className="py-2.5 px-3 text-right text-amber-400 font-bold bg-amber-500/10">
                    {isBangla ? 'চলমান বাকি (Running Due)' : 'Running Due Balance'}
                  </th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* Initial Opening Balance Row */}
                <tr className="bg-slate-950/40 text-slate-400 font-sans">
                  <td className="py-2 px-3 font-mono text-[11px]">-</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                      {isBangla ? 'প্রারম্ভিক ব্যালেন্স' : 'Opening Balance'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">Initial ledger transfer</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-200 bg-amber-500/5">
                    {formatBDT(openingBalance)}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-600">-</td>
                </tr>

                {ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">
                      {isBangla
                        ? 'এই পার্টির আর কোনো চালান বা ভাউচার রেকর্ড নেই।'
                        : 'No additional transaction vouchers found for this party.'}
                    </td>
                  </tr>
                ) : (
                  ledgerRows.map(({ tx, billAmount, paidAmount, runningDue }) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-300 font-mono whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'Sale'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tx.type === 'Purchase'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : tx.type === 'Payment' || tx.type === 'Receipt'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">
                        <div className="font-bold text-slate-200">
                          {tx.lcNo || tx.refNo || 'General'}
                        </div>
                        {tx.truckNo && (
                          <div className="text-[10px] text-slate-500">{tx.truckNo}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200">
                        {tx.weightKg > 0 ? `${tx.weightKg.toLocaleString()} KG` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {tx.rateBdt > 0 ? (
                          <div>
                            <span>৳{tx.rateBdt}</span>
                            {tx.lessBdt > 0 && (
                              <span className="text-rose-400 block text-[10px]">
                                -{formatBDT(tx.lessBdt, false)}
                              </span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                        {billAmount > 0 ? formatBDT(billAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {paidAmount > 0 ? formatBDT(paidAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-amber-400 bg-amber-500/10">
                        {formatBDT(runningDue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Edit Transaction"
                            onClick={() => onEditTransaction && onEditTransaction(tx)}
                            className="p-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete Transaction"
                            onClick={() => setDeletingTx(tx)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parties Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map((party) => {
          const isSelected = selectedPartyId === party.id;
          const liveBalance = getPartyLiveBalance(party);
          const isOwed = liveBalance > 0;

          return (
            <div
              key={party.id}
              onClick={() => setSelectedPartyId(isSelected ? null : party.id)}
              className={`cursor-pointer bg-slate-900/90 rounded-2xl border p-4 shadow-xl transition-all ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/40 bg-slate-800/95 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-300">
                    {party.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                      party.type === 'Customer'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : party.type === 'Supplier'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {party.type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">
                      {party.type === 'Customer'
                        ? isBangla ? 'বাকি পাওনা (Receivable)' : 'Customer Due'
                        : isBangla ? 'প্রদেয় দেনা (Payable)' : 'Supplier Due'}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        party.type === 'Customer' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatBDT(Math.abs(liveBalance))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => openEditParty(party, e)}
                      title={isBangla ? 'পার্টি এডিট করুন' : 'Edit Party'}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {onDeleteParty && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              isBangla
                                ? `আপনি কি নিশ্চিতভাবে "${party.name}" মুছে ফেলতে চান?`
                                : `Are you sure you want to delete "${party.name}"?`
                            )
                          ) {
                            onDeleteParty(party.id);
                            if (selectedPartyId === party.id) setSelectedPartyId(null);
                          }
                        }}
                        title={isBangla ? 'পার্টি মুছুন' : 'Delete Party'}
                        className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono">{party.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{party.address}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Credit Limit: {formatBDT(party.creditLimit)}</span>
                  <span className="text-amber-400/90 font-medium hover:underline">
                    {isSelected
                      ? isBangla ? 'লেজার খোলা রয়েছে' : 'Ledger Active'
                      : isBangla ? 'লেজার দেখুন →' : 'View Statement →'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Transaction Confirmation Modal */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">
                  {isBangla ? 'লেনদেন মুছে ফেলবেন?' : 'Delete Transaction?'}
                </h3>
                <span className="text-xs text-rose-400/90 font-mono">
                  {deletingTx.refNo || deletingTx.id} • {deletingTx.type}
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-slate-300">
              <p>
                {isBangla
                  ? 'এই লেনদেন মুছে দিলে স্বয়ংক্রিয়ভাবে আর্থিক হিসাব রিভার্স (Reverse Accounting) হবে:'
                  : 'Deleting this transaction will immediately reverse its financial & stock impact:'}
              </p>

              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                {deletingTx.type === 'Sale' && (
                  <>
                    <li>
                      {isBangla ? 'ব্যাংক/ক্যাশ থেকে বিয়োগ:' : 'Subtract'}{' '}
                      <strong className="text-white">{formatBDT(deletingTx.totalBdt)}</strong>{' '}
                      from <strong className="text-white">{deletingTx.account}</strong>
                    </li>
                    <li>
                      {isBangla ? 'পার্টির বকেয়া পাওনা হ্রাস পাবে:' : 'Reduce Customer Receivable Due for'}{' '}
                      <strong className="text-white">{deletingTx.party}</strong>
                    </li>
                    {deletingTx.lcNo && deletingTx.weightKg > 0 && (
                      <li>
                        {isBangla ? 'ইনভেন্টরিতে স্টক ওজন ফেরত যাবে:' : 'Restore'}{' '}
                        <strong className="text-emerald-400 font-mono">
                          {deletingTx.weightKg.toLocaleString()} KG
                        </strong>{' '}
                        back to LC <strong className="text-white">{deletingTx.lcNo}</strong>
                      </li>
                    )}
                  </>
                )}

                {deletingTx.type === 'Purchase' && (
                  <>
                    <li>
                      {isBangla ? 'ব্যাংক/ক্যাশে টাকা ফেরত যোগ হবে:' : 'Add back'}{' '}
                      <strong className="text-white">{formatBDT(deletingTx.totalBdt)}</strong>{' '}
                      to <strong className="text-white">{deletingTx.account}</strong>
                    </li>
                    <li>
                      {isBangla ? 'মহাজনের পাওনা দেনা হ্রাস পাবে:' : 'Reduce Supplier Payable Due to'}{' '}
                      <strong className="text-white">{deletingTx.party}</strong>
                    </li>
                    {deletingTx.lcNo && deletingTx.weightKg > 0 && (
                      <li>
                        {isBangla ? 'ইনভেন্টরি থেকে স্টক বাদ দেওয়া হবে:' : 'Deduct'}{' '}
                        <strong className="text-rose-400 font-mono">
                          {deletingTx.weightKg.toLocaleString()} KG
                        </strong>{' '}
                        from LC <strong className="text-white">{deletingTx.lcNo}</strong>
                      </li>
                    )}
                  </>
                )}

                {deletingTx.type === 'Expense' && (
                  <li>
                    {isBangla ? 'ব্যাংক/ক্যাশে ব্যয়কৃত টাকা ফেরত যোগ হবে:' : 'Refund'}{' '}
                    <strong className="text-emerald-400">{formatBDT(deletingTx.totalBdt)}</strong>{' '}
                    back to <strong className="text-white">{deletingTx.account}</strong>
                  </li>
                )}

                {(deletingTx.type === 'Payment' || deletingTx.type === 'Receipt') && (
                  <li>
                    Reverse payment impact on <strong className="text-white">{deletingTx.account}</strong>{' '}
                    and party balance for <strong className="text-white">{deletingTx.party}</strong>
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-3.5 mt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              >
                {isBangla ? 'মুছুন ও রিক্যালকুলেট করুন' : 'Confirm Delete & Recalculate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Party Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                {isBangla ? 'নতুন পার্টি যুক্ত করুন' : 'Create New Party'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'পার্টির নাম' : 'Party / Company Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Amin Steels & Re-rolling"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'ধরণ' : 'Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Customer">Customer (গ্রাহক)</option>
                    <option value="Supplier">Supplier (মহাজন/মিল)</option>
                    <option value="Both">Both (উভয়)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'মোবাইল নম্বর' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01711-..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'ঠিকানা ও গোডাউন লোকেশন' : 'Address & Godown Location'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asadganj / Jatrabari"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'ক্রেডিট লিমিট (BDT)' : 'Credit Limit'}
                  </label>
                  <input
                    type="number"
                    placeholder="5000000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'প্রারম্ভিক ব্যালেন্স (BDT)' : 'Opening Balance'}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

