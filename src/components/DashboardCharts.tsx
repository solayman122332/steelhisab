import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Party, Transaction } from '../types';
import { formatBDT } from '../utils/formatters';

interface DashboardChartsProps {
  parties: Party[];
  transactions: Transaction[];
  isBangla: boolean;
  onSelectPartyModule?: () => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  parties,
  transactions,
  isBangla,
  onSelectPartyModule,
}) => {
  const [chartView, setChartView] = useState<'Bar' | 'Donut'>('Bar');

  // 1. Calculate live customer receivables (Top 5 Customers by Due / Baki)
  const customersWithDue = parties
    .filter((p) => p.type === 'Customer' || p.type === 'Both')
    .map((customer) => {
      const opening =
        customer.openingBalanceBdt !== undefined
          ? customer.openingBalanceBdt
          : Math.max(0, customer.balanceBdt || 0);

      const pTx = transactions.filter(
        (t) => t.party && t.party.toLowerCase() === customer.name.toLowerCase()
      );

      let due = opening;
      pTx.forEach((t) => {
        if (t.type === 'Sale') due += t.totalBdt || 0;
        else if (t.type === 'Receipt' || t.type === 'Payment') due -= t.totalBdt || 0;
      });

      return {
        id: customer.id,
        name: customer.name,
        dueBdt: Math.max(0, due),
        phone: customer.phone,
      };
    })
    .filter((c) => c.dueBdt > 0)
    .sort((a, b) => b.dueBdt - a.dueBdt);

  const top5Customers = customersWithDue.slice(0, 5);

  // 2. Calculate live supplier payables (Top 5 Suppliers by Payable / Dena)
  const suppliersWithPayable = parties
    .filter((p) => p.type === 'Supplier' || p.type === 'Both')
    .map((supplier) => {
      const opening =
        supplier.openingBalanceBdt !== undefined
          ? supplier.openingBalanceBdt
          : Math.abs(supplier.balanceBdt || 0);

      const pTx = transactions.filter(
        (t) => t.party && t.party.toLowerCase() === supplier.name.toLowerCase()
      );

      let payable = opening;
      pTx.forEach((t) => {
        if (t.type === 'Purchase') payable += t.totalBdt || 0;
        else if (t.type === 'Payment' || t.type === 'Receipt') payable -= t.totalBdt || 0;
      });

      return {
        id: supplier.id,
        name: supplier.name,
        payableBdt: Math.max(0, payable),
        phone: supplier.phone,
      };
    })
    .filter((s) => s.payableBdt > 0)
    .sort((a, b) => b.payableBdt - a.payableBdt);

  const top5Suppliers = suppliersWithPayable.slice(0, 5);

  // 3. Monthly Financial Aggregation: Sales vs Expenses vs Net Profit
  const monthlyDataMap: Record<
    string,
    { monthKey: string; monthLabel: string; sales: number; expenses: number; grossProfit: number }
  > = {};

  // Group transactions by YYYY-MM
  transactions.forEach((tx) => {
    if (!tx.date) return;
    const dateObj = new Date(tx.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });

    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = {
        monthKey,
        monthLabel,
        sales: 0,
        expenses: 0,
        grossProfit: 0,
      };
    }

    if (tx.type === 'Sale') {
      monthlyDataMap[monthKey].sales += tx.totalBdt || 0;
      monthlyDataMap[monthKey].grossProfit += tx.profitBdt || 0;
    } else if (tx.type === 'Expense') {
      monthlyDataMap[monthKey].expenses += tx.totalBdt || 0;
    }
  });

  // Convert map to sorted array
  const monthlyData = Object.values(monthlyDataMap)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((item) => ({
      ...item,
      netProfit: item.grossProfit - item.expenses,
    }));

  // Aggregate totals
  const totalReceivables = customersWithDue.reduce((sum, c) => sum + c.dueBdt, 0);
  const totalPayables = suppliersWithPayable.reduce((sum, s) => sum + s.payableBdt, 0);

  // Colors for charts
  const customerColors = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'];
  const supplierColors = ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#be123c'];

  // Custom Dark Mode Tooltip for Outstanding Dues
  const CustomDueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCustomer = 'dueBdt' in data;
      const val = isCustomer ? data.dueBdt : data.payableBdt;
      const total = isCustomer ? totalReceivables : totalPayables;
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';

      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs">
          <p className="font-bold text-slate-100 mb-1">{data.name}</p>
          <div className="flex items-center justify-between gap-4 font-mono">
            <span className={isCustomer ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {formatBDT(val)}
            </span>
            <span className="text-[10px] text-slate-400">{pct}% of total</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Dark Mode Tooltip for Monthly Overview
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
          <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1 font-mono">
            {label} Performance
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-100">{formatBDT(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. OUTSTANDING DUES OVERVIEW SECTION */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
                {isBangla ? 'বকেয়া ও দেনা পাওনা বিশ্লেষণ (Outstanding Dues)' : 'Outstanding Dues Overview'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? 'টপ ৫ কাস্টমার বাকি পাওনা এবং মিল মহাজনদের প্রদেয় দেনা খাতার চিত্র'
                : 'Top 5 Customer Receivables (Baki) & Top 5 Mill Payables (Dena) with exact BDT balances'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartView('Bar')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  chartView === 'Bar'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartView('Donut')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  chartView === 'Donut'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Donut
              </button>
            </div>

            {onSelectPartyModule && (
              <button
                onClick={onSelectPartyModule}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <span>{isBangla ? 'লেজার খাতা' : 'All Parties'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Top 5 Dues Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
          {/* Customer Receivables Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  {isBangla ? 'টপ ৫ কাস্টমার বাকি পাওনা (Baki)' : 'Top 5 Customers by Due (Receivables)'}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-300">
                  {formatBDT(totalReceivables)}
                </span>
              </div>

              {top5Customers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {isBangla ? 'কোনো বকেয়া পাওনা নেই।' : 'No outstanding customer dues recorded.'}
                </div>
              ) : chartView === 'Bar' ? (
                <div className="h-60 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={top5Customers}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                        fontSize={10}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={10}
                        width={110}
                        tickFormatter={(name) =>
                          name.length > 14 ? `${name.slice(0, 14)}...` : name
                        }
                      />
                      <Tooltip content={<CustomDueTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }} />
                      <Bar dataKey="dueBdt" radius={[0, 6, 6, 0]}>
                        {top5Customers.map((_, index) => (
                          <Cell
                            key={`cell-cust-${index}`}
                            fill={customerColors[index % customerColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 mt-3 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip content={<CustomDueTooltip />} />
                      <Pie
                        data={top5Customers}
                        dataKey="dueBdt"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {top5Customers.map((_, index) => (
                          <Cell
                            key={`pie-cust-${index}`}
                            fill={customerColors[index % customerColors.length]}
                          />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Micro list breakdown */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
              {top5Customers.slice(0, 3).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between text-slate-400">
                  <span className="truncate max-w-[170px] text-slate-300">
                    {i + 1}. {c.name}
                  </span>
                  <span className="text-emerald-400 font-bold">{formatBDT(c.dueBdt)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Payables Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-rose-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  {isBangla ? 'টপ ৫ মিল দেনা (Payables / Dena)' : 'Top 5 Suppliers by Payable (Dena)'}
                </span>
                <span className="font-mono text-xs font-bold text-rose-300">
                  {formatBDT(totalPayables)}
                </span>
              </div>

              {top5Suppliers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {isBangla ? 'কোনো সরবরাহকারী দেনা নেই।' : 'No outstanding supplier payables recorded.'}
                </div>
              ) : chartView === 'Bar' ? (
                <div className="h-60 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={top5Suppliers}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                        fontSize={10}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={10}
                        width={110}
                        tickFormatter={(name) =>
                          name.length > 14 ? `${name.slice(0, 14)}...` : name
                        }
                      />
                      <Tooltip content={<CustomDueTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }} />
                      <Bar dataKey="payableBdt" radius={[0, 6, 6, 0]}>
                        {top5Suppliers.map((_, index) => (
                          <Cell
                            key={`cell-supp-${index}`}
                            fill={supplierColors[index % supplierColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 mt-3 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip content={<CustomDueTooltip />} />
                      <Pie
                        data={top5Suppliers}
                        dataKey="payableBdt"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {top5Suppliers.map((_, index) => (
                          <Cell
                            key={`pie-supp-${index}`}
                            fill={supplierColors[index % supplierColors.length]}
                          />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Micro list breakdown */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
              {top5Suppliers.slice(0, 3).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-slate-400">
                  <span className="truncate max-w-[170px] text-slate-300">
                    {i + 1}. {s.name}
                  </span>
                  <span className="text-rose-400 font-bold">{formatBDT(s.payableBdt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MONTHLY FINANCIAL OVERVIEW GROUPED BAR CHART */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
                {isBangla ? 'মাসিক আর্থিক ওভারভিউ (Monthly Overview)' : 'Monthly Overview & Profitability'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? 'মোট বিক্রয়, মোট পরিচালন ব্যয় এবং নেট মুনাফার তুলনামূলক বার চার্ট'
                : 'Grouped bar chart comparing Total Sales, Total Expenses, and Net Profit'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Sales
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              Expenses
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              Net Profit
            </span>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {isBangla ? 'পর্যাপ্ত লেনদেন ডাটা পাওয়া যায়নি।' : 'No transaction records found to generate monthly chart.'}
          </div>
        ) : (
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  name={isBangla ? 'মোট বিক্রয়' : 'Total Sales'}
                  dataKey="sales"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name={isBangla ? 'মোট খরচ' : 'Total Expenses'}
                  dataKey="expenses"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name={isBangla ? 'নেট মুনাফা' : 'Net Profit'}
                  dataKey="netProfit"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
