import React from 'react';
import {
  RefreshCw,
  Settings,
  Flame,
  Layers,
  Menu,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRightLeft,
  Languages,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';
import { formatBDT } from '../utils/formatters';

interface HeaderProps {
  onOpenSettings: () => void;
  onSync: () => void;
  isSyncing: boolean;
  syncConfig: GoogleSheetsConfig;
  onToggleSidebar: () => void;
  isPosMode: boolean;
  onTogglePosMode: () => void;
  totalLiquidFunds: number;
  isBangla: boolean;
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onSync,
  isSyncing,
  syncConfig,
  onToggleSidebar,
  isPosMode,
  onTogglePosMode,
  totalLiquidFunds,
  isBangla,
  onToggleLanguage,
}) => {
  const isConfigured = Boolean(syncConfig.webAppUrl || syncConfig.spreadsheetId);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors md:hidden"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-200 via-white to-slate-200 bg-clip-text text-transparent">
                  SteelHisab
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LC & Steel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isBangla
                  ? 'স্টিল ট্রেডিং ও পার্টনারশিপ হিসাব খাতা (BDT)'
                  : 'Bangladeshi Steel Trading & 3-Pool Partnership'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Bank/Cash Total Pill (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">
            {isBangla ? 'সর্বমোট ব্যাংক ও ক্যাশ তহবিল:' : 'Liquid Funds (Cash + Banks):'}
          </span>
          <span className="text-sm font-bold font-mono text-emerald-400">
            {formatBDT(totalLiquidFunds)}
          </span>
        </div>

        {/* Right: Actions (Language, POS Mode, Sync, Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-semibold text-slate-300 transition-colors"
            title="Toggle Bangla / English"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{isBangla ? 'বাং' : 'EN'}</span>
          </button>

          {/* POS Mode Quick Toggle */}
          <button
            onClick={onTogglePosMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isPosMode
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
            }`}
            title="Switch to Point of Sale counter mode"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isPosMode
                ? isBangla ? 'অ্যাকাউন্টিং মোড' : 'Standard View'
                : isBangla ? 'পিওএস কাউন্টার' : 'POS Mode'}
            </span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSyncing
                ? 'bg-slate-800 border-amber-500/50 text-amber-400'
                : isConfigured
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-amber-950/40 hover:bg-amber-900/40 border-amber-700/50 text-amber-300'
            }`}
            title={
              isConfigured
                ? `Sync with Google Sheet. Last: ${syncConfig.lastSyncedAt || 'Never'}`
                : 'Google Sheets URL not configured. Click to configure!'
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'animate-spin text-amber-400' : 'text-slate-400'
              }`}
            />
            <span className="hidden md:inline">
              {isSyncing
                ? isBangla ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'
                : isBangla ? 'সিঙ্ক' : 'Sync'}
            </span>
            {isConfigured ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Google Sheets & App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
