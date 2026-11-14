import React, { useState } from 'react';
import {
  X,
  Settings,
  Cloud,
  FileSpreadsheet,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  Building2,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';

import { CompanyProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  onTestSync: () => Promise<void>;
  isTesting: boolean;
  onResetData: () => void;
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  isBangla: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestSync,
  isTesting,
  onResetData,
  companyProfile,
  onSaveCompanyProfile,
  isBangla,
}) => {
  if (!isOpen) return null;

  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'script' | 'data' | 'profile'>('config');

  // Profile form state
  const [profile, setProfile] = useState<CompanyProfile>(companyProfile);

  const scriptCode = GoogleSheetsService.getAppsScriptTemplate();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      webAppUrl: webAppUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      apiKey: apiKey.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-auto p-5 sm:p-6 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
                {isBangla ? 'গুগল শিট সিঙ্ক সেটিংস' : 'Google Sheets API Storage Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBangla
                  ? 'গুগল অ্যাপস স্ক্রিপ্ট বা শিটস REST API v4 এর মাধ্যমে রিয়েল-টাইম ডাটা সংরক্ষণ'
                  : 'Configure Google Apps Script Web App URL & REST API v4 endpoint'}
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

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'config'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBangla ? '১. এপিআই ইউআরএল সেটআপ' : '1. Endpoint Config'}
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'script'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBangla ? '২. গুগল স্ক্রিপ্ট কোড কপি' : '2. Apps Script Code'}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'data'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBangla ? '৩. ব্যাকআপ ও ডেটা রিস্টোর' : '3. Backup & Reset'}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              activeTab === 'profile'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isBangla ? '৪. কোম্পানি প্রোফাইল ও চালান' : '4. Company Profile & Challan'}
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === 'config' && (
          <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
            {/* Google Apps Script Web App URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  <span>Google Apps Script Web App URL (Recommended)</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Bypasses CORS via text/plain POST
                </span>
              </div>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {isBangla
                  ? 'আপনার গুগল শিটের Extensions > Apps Script থেকে Web App পাবলিশ করে প্রাপ্ত URL টি এখানে পেস্ট করুন।'
                  : 'Paste the published Web App URL from your Google Sheet (Extensions > Apps Script > Deploy > Web App).'}
              </p>
            </div>

            {/* Google Sheets Spreadsheet ID & API Key (Alternative) */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-slate-200 font-bold block mb-1">
                Spreadsheet ID (Optional / REST API v4)
              </label>
              <input
                type="text"
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-200 font-bold block mb-1">
                Google Sheets API Key (Optional for v4 reads)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 6 Tabs info badge */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                {isBangla ? 'স্বয়ংক্রিয়ভাবে সংযুক্ত ৬টি শিট ট্যাব:' : 'Auto-synced 6 Sheet Tabs:'}
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  Transactions
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                  Parties
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                  Accounts
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                  Inventory_LC
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                  Partner_Drawings
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                  TOTAL_HISAB
                </span>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onTestSync}
                disabled={isTesting}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isTesting ? 'সংযোগ পরীক্ষা হচ্ছে...' : 'Test Sync Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বন্ধ করুন' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isBangla ? 'সেটিংস সংরক্ষণ করুন' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Copy Apps Script */}
        {activeTab === 'script' && (
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-slate-300">
                {isBangla
                  ? 'এই কোডটি কপি করে আপনার গুগল শিটের Apps Script এ পেস্ট করে Deploy Web App করুন।'
                  : 'Copy this backend script into your Google Sheet (Extensions > Apps Script) to enable automatic 6-tab sync:'}
              </p>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 transition-all hover:scale-105"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'কপি হয়েছে!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-slate-300 h-64 overflow-y-auto">
                {scriptCode}
              </pre>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-amber-300">Quick 1-Minute Steps:</div>
              <div>1. Open your Google Sheet &gt; Click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</div>
              <div>2. Delete sample code, paste the above script, and save (Ctrl+S).</div>
              <div>3. Click <strong>Deploy</strong> &gt; <strong>New deployment</strong> &gt; Select <strong>Web app</strong>.</div>
              <div>4. Set <em>Execute as: Me</em> and <em>Who has access: Anyone</em> &gt; Click <strong>Deploy</strong>.</div>
              <div>5. Copy the Web App URL and paste it into the <strong>Endpoint Config</strong> tab!</div>
            </div>
          </div>
        )}

        {/* Tab 3: Data Backup & Reset */}
        {activeTab === 'data' && (
          <div className="mt-4 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                {isBangla ? 'নমুনা ডেটা রিসেট' : 'Reset to Bangladeshi Steel Partnership Data'}
              </h4>
              <p className="text-slate-400 text-[11px] mb-3">
                {isBangla
                  ? 'আসল লেনদেন, ৫টি ব্যাংক অ্যাকাউন্ট, ৩টি এলসি (OMI 169, SABBIR 156, TUFFA 158) এবং পার্টনার ড্রয়িংস সমৃদ্ধ ডেমো ডেটা লোড করুন।'
                  : 'Restores default sample dataset with realistic Chattogram / Dhaka steel trading accounts, coil shortages, and 3-pool partner hisab.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all accounts, inventory, and transactions to default steel partnership sample data?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold transition-colors"
              >
                {isBangla ? 'ডিফল্ট ডেটায় রিসেট করুন' : 'Reset Data to Default Steel Sample'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Company Profile & Challan Settings */}
        {activeTab === 'profile' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveCompanyProfile(profile);
              onClose();
            }}
            className="mt-4 space-y-3.5 text-xs"
          >
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <p className="text-[11px] text-slate-400">
                {isBangla
                  ? 'এখানে নির্ধারিত তথ্য আপনার সমস্ত ডেলিভারি চালান, ক্যাশ মেমো, পিওএস স্লিপ এবং রিপোর্ট প্রিন্টে স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।'
                  : 'These company details and terms will automatically reflect on all Delivery Challans, POS thermal receipts, and printouts in real time.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'প্রতিষ্ঠানের নাম (English)' : 'Company Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'প্রতিষ্ঠানের নাম (বাংলা)' : 'Company Name (Bangla)'}
                </label>
                <input
                  type="text"
                  value={profile.banglaName}
                  onChange={(e) => setProfile({ ...profile, banglaName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'ট্যাগলাইন / ব্যবসার ধরন' : 'Tagline / Business Nature'}
              </label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'প্রধান কার্যালয় / মিলস গোডাউন' : 'Head Office / Godown'}
                </label>
                <input
                  type="text"
                  value={profile.headOffice}
                  onChange={(e) => setProfile({ ...profile, headOffice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'শাখা অফিস / শো-রুম' : 'Branch Office'}
                </label>
                <input
                  type="text"
                  value={profile.branchOffice}
                  onChange={(e) => setProfile({ ...profile, branchOffice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'যোগাযোগের ফোন নম্বর' : 'Phone Numbers'}
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'ইমেইল এড্রেস' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'ভ্যাট / বিন (BIN)' : 'VAT / BIN'}
                </label>
                <input
                  type="text"
                  value={profile.vatTin}
                  onChange={(e) => setProfile({ ...profile, vatTin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'ট্রেড লাইসেন্স নং' : 'Trade License No'}
                </label>
                <input
                  type="text"
                  value={profile.tradeLicense}
                  onChange={(e) => setProfile({ ...profile, tradeLicense: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'মুদ্রার প্রতীক' : 'Currency Symbol'}
                </label>
                <input
                  type="text"
                  value={profile.currencySymbol}
                  onChange={(e) => setProfile({ ...profile, currencySymbol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'চালানের সাধারণ শর্তাবলী' : 'Challan Terms & Conditions'}
              </label>
              <textarea
                rows={2}
                value={profile.challanTerms}
                onChange={(e) => setProfile({ ...profile, challanTerms: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. বিক্রিত মাল ফেরত যোগ্য নহে..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
              >
                {isBangla ? 'কোম্পানি প্রোফাইল সংরক্ষণ' : 'Save Company Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
