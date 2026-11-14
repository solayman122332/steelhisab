import React from 'react';
import { X, Printer, Truck, Scale, ShieldCheck } from 'lucide-react';
import { Transaction, CompanyProfile } from '../types';
import { formatBDT, formatDate } from '../utils/formatters';

interface ChallanModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  companyProfile?: CompanyProfile;
  isBangla: boolean;
}

export const ChallanModal: React.FC<ChallanModalProps> = ({
  transaction,
  onClose,
  companyProfile,
  isBangla,
}) => {
  if (!transaction) return null;

  const profile = companyProfile || {
    companyName: 'STEELHISAB PARTNERSHIP',
    banglaName: 'স্টিলহিসাব পার্টনারশিপ',
    tagline: 'Importers & Stockists: HR/CR Coils, MS Billets, 500W Deformed Bars & Sheet',
    headOffice: 'Head Office: Asadganj / Khatunganj Steel Market, Chattogram',
    branchOffice: 'Branch: Nawabpur, Dhaka',
    phone: '+880 1819-223344, +880 1711-556677',
    email: 'info@steelhisab.com',
    vatTin: 'BIN: 001234567-0203 | TIN: 482910482910',
    tradeLicense: 'TRAD/DSCC/012948/2024',
    challanTerms: 'Goods once sold cannot be returned. Verify weighbridge scale copy before unloading.',
    currencySymbol: '৳',
  };

  const termsList = typeof profile.challanTerms === 'string'
    ? profile.challanTerms.split('\n').filter(Boolean)
    : (Array.isArray(profile.challanTerms) ? profile.challanTerms : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl my-auto p-6 sm:p-8 shadow-2xl animate-scaleUp print:p-0 print:shadow-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Steel Delivery Challan & Invoice Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Challan Body */}
        <div className="border border-slate-300 p-6 rounded-lg font-sans">
          {/* Top Bismillah & Company Branding */}
          <div className="text-center pb-2">
            <span className="text-xs text-slate-600 font-serif font-bold">
              بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {profile.companyName}
            </h1>
            {profile.banglaName && (
              <div className="text-sm font-bold text-slate-800 font-sans">
                {profile.banglaName}
              </div>
            )}
            <p className="text-xs text-slate-600 mt-0.5">
              {profile.tagline}
            </p>
            <p className="text-[11px] text-slate-500">
              {profile.headOffice} {profile.branchOffice ? `| ${profile.branchOffice}` : ''} | Phone: {profile.phone}
            </p>
            {(profile.vatTin || profile.tradeLicense) && (
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {profile.vatTin ? `${profile.vatTin}` : ''} {profile.tradeLicense ? `| Trade Lic: ${profile.tradeLicense}` : ''}
              </p>
            )}
            <div className="mt-2 inline-block px-4 py-0.5 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded">
              DELIVERY CHALLAN & BILL OF SALE
            </div>
          </div>

          {/* Challan Meta */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500">Challan / Invoice No:</div>
              <div className="font-mono font-bold text-sm text-slate-900">
                {transaction.refNo || 'CH-2026-0001'}
              </div>
              <div className="text-slate-500 mt-1">Date:</div>
              <div className="font-bold text-slate-800">{formatDate(transaction.date)}</div>
            </div>

            <div className="text-right">
              <div className="text-slate-500">Party / Buyer:</div>
              <div className="font-bold text-sm text-slate-900">{transaction.party}</div>
              <div className="text-slate-500 mt-1">Settlement Account:</div>
              <div className="font-bold text-slate-800">{transaction.account}</div>
            </div>
          </div>

          {/* Logistics & LC Info */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-100 rounded text-xs font-mono mb-4">
            <div>
              <span className="text-slate-500 block text-[10px]">LC NUMBER:</span>
              <strong className="text-slate-900">{transaction.lcNo || 'Local Warehouse'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TRUCK / FLEET:</span>
              <strong className="text-slate-900">{transaction.truckNo || 'Direct Godown'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">COIL / LOT:</span>
              <strong className="text-slate-900">{transaction.coilNo || 'Batch-A'}</strong>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border border-slate-300 mb-4">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">Description</th>
                <th className="p-2 border-r border-slate-300 text-right">Coil Wt (KG)</th>
                <th className="p-2 border-r border-slate-300 text-right">Scale Wt (KG)</th>
                <th className="p-2 border-r border-slate-300 text-right">Rate/KG (BDT)</th>
                <th className="p-2 text-right">Total (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              <tr>
                <td className="p-2.5 border-r border-slate-300 font-sans">
                  <div className="font-bold text-slate-900">
                    Prime Steel / Deformed Bar ({transaction.lcNo || 'Stock'})
                  </div>
                  {transaction.note && (
                    <div className="text-[10px] text-slate-500 font-normal">
                      Note: {transaction.note}
                    </div>
                  )}
                </td>
                <td className="p-2.5 border-r border-slate-300 text-right">
                  {transaction.weightKg?.toLocaleString()} KG
                </td>
                <td className="p-2.5 border-r border-slate-300 text-right">
                  {transaction.scaleWeightKg?.toLocaleString() || '-'} KG
                </td>
                <td className="p-2.5 border-r border-slate-300 text-right">
                  ৳{transaction.rateBdt}
                </td>
                <td className="p-2.5 text-right font-bold text-slate-900">
                  {formatBDT((transaction.weightKg || 0) * (transaction.rateBdt || 0), false)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Financial Breakdown */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Gross Total:</span>
                <span>
                  {formatBDT(
                    (transaction.weightKg || 0) * (transaction.rateBdt || 0)
                  )}
                </span>
              </div>
              {transaction.lessBdt > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Less / Deduction:</span>
                  <span>-{formatBDT(transaction.lessBdt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-300 text-slate-900">
                <span>NET PAYABLE (BDT):</span>
                <span>{formatBDT(transaction.totalBdt)}</span>
              </div>
            </div>
          </div>

          {/* Challan Terms & Conditions */}
          {profile.challanTerms && profile.challanTerms.length > 0 && (
            <div className="mb-6 p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">
                {isBangla ? 'চালানের শর্তাবলী:' : 'Terms & Conditions:'}
              </span>
              <ul className="list-disc pl-4 space-y-0.5">
                {termsList.map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-4 gap-4 pt-12 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 font-sans">
            <div>
              <div className="border-t border-slate-400 pt-1">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1">Scale Munshi</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1">Partner Signature</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1">Buyer Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
