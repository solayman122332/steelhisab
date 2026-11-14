import React, { useState } from 'react';
import {
  Boxes,
  PlusCircle,
  Scale,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Truck,
  Pencil,
  Trash2,
} from 'lucide-react';
import { InventoryLC } from '../types';
import { calculateShortage, formatBDT, formatWeight } from '../utils/formatters';

interface InventoryLCViewProps {
  inventoryLCs: InventoryLC[];
  onAddLC: (lc: Omit<InventoryLC, 'id'>) => Promise<void>;
  onEditLC: (lc: InventoryLC) => Promise<void>;
  onDeleteLC: (id: string) => Promise<void>;
  isBangla: boolean;
}

export const InventoryLCView: React.FC<InventoryLCViewProps> = ({
  inventoryLCs,
  onAddLC,
  onEditLC,
  onDeleteLC,
  isBangla,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLC, setEditingLC] = useState<InventoryLC | null>(null);

  // Initialize form state with editingLC if present, otherwise default
  const [lcNo, setLcNo] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState('500W High Tensile');
  const [coilWeightKg, setCoilWeightKg] = useState('');
  const [scaleCopyWeightKg, setScaleCopyWeightKg] = useState('');
  const [landedCostBdtPerKg, setLandedCostBdtPerKg] = useState('');
  const [arrivedDate, setArrivedDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSaving, setIsSaving] = useState(false);

  const numCoil = parseFloat(coilWeightKg) || 0;
  const numScale = parseFloat(scaleCopyWeightKg) || 0;
  const numCostPerKg = parseFloat(landedCostBdtPerKg) || 0;
  const computedShortage = calculateShortage(numCoil, numScale);
  const computedTotalCost = numScale * numCostPerKg;

  const handleOpenEdit = (lc: InventoryLC) => {
    setEditingLC(lc);
    setLcNo(lc.lcNo);
    setDescription(lc.description);
    setGrade(lc.grade);
    setCoilWeightKg(lc.coilWeightKg.toString());
    setScaleCopyWeightKg(lc.scaleCopyWeightKg.toString());
    setLandedCostBdtPerKg(lc.landedCostBdtPerKg.toString());
    setArrivedDate(lc.arrivedDate);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingLC(null);
    setLcNo('');
    setDescription('');
    setGrade('500W High Tensile');
    setCoilWeightKg('');
    setScaleCopyWeightKg('');
    setLandedCostBdtPerKg('');
    setArrivedDate(new Date().toISOString().split('T')[0]);
  };

  const handleSaveLC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lcNo) return;
    setIsSaving(true);
    try {
      const lcData = {
        lcNo,
        description,
        grade,
        coilWeightKg: numCoil,
        scaleCopyWeightKg: numScale,
        shortageKg: computedShortage,
        landedCostBdtPerKg: numCostPerKg,
        totalCostBdt: computedTotalCost,
        soldWeightKg: editingLC ? editingLC.soldWeightKg : 0,
        remainingWeightKg: editingLC ? editingLC.remainingWeightKg : numScale,
        status: editingLC ? editingLC.status : 'In Stock',
        arrivedDate,
      };

      if (editingLC) {
        await onEditLC({ ...lcData, id: editingLC.id });
      } else {
        await onAddLC(lcData);
      }
      handleCloseModal();
    } finally {
      setIsSaving(false);
    }
  };

  const totalRemainingStockKg = inventoryLCs.reduce(
    (sum, lc) => sum + (lc.remainingWeightKg || 0),
    0
  );
  const totalCoilWeightKg = inventoryLCs.reduce((sum, lc) => sum + (lc.coilWeightKg || 0), 0);
  const totalScaleWeightKg = inventoryLCs.reduce(
    (sum, lc) => sum + (lc.scaleCopyWeightKg || 0),
    0
  );
  const totalShortageKg = totalCoilWeightKg - totalScaleWeightKg;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {isBangla ? 'ইনভেন্টরি ও এলসি কয়েল স্টক ট্র্যাকার' : 'Inventory & LC Coil Stocks'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBangla
                ? 'এলসি ওয়াইজ কয়েল ওজন vs স্কেল কপি ওজন, শর্টেজ ঘাটতি এবং অবশিষ্ট স্টক নিরূপণ'
                : 'Track BL Coil Weight vs Weighbridge Scale Copy Weight, dust shortage, and remaining tonnage'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBangla ? 'নতুন এলসি স্টক যুক্ত করুন' : 'Receive New LC Stock'}</span>
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'সর্বমোট অবিক্রিত স্টক' : 'Total Remaining Stock'}
            </span>
            <div className="text-base font-mono font-bold text-amber-400">
              {(totalRemainingStockKg / 1000).toFixed(2)} MT
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {totalRemainingStockKg.toLocaleString()} KG
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'ডকুমেন্ট কয়েল ওজন' : 'BL / Coil Total Weight'}
            </span>
            <div className="text-base font-mono font-bold text-slate-200">
              {(totalCoilWeightKg / 1000).toFixed(2)} MT
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {totalCoilWeightKg.toLocaleString()} KG
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'স্কেল কপি প্রকৃত ওজন' : 'Scale Copy Net Weight'}
            </span>
            <div className="text-base font-mono font-bold text-emerald-400">
              {(totalScaleWeightKg / 1000).toFixed(2)} MT
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {totalScaleWeightKg.toLocaleString()} KG
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isBangla ? 'ঘাটতি / শর্টেজ' : 'Total Dust / Shortage'}
            </span>
            <div className="text-base font-mono font-bold text-rose-400">
              {totalShortageKg.toLocaleString()} KG
            </div>
            <div className="text-[10px] text-rose-400/80 font-mono">
              {totalCoilWeightKg > 0 ? ((totalShortageKg / totalCoilWeightKg) * 100).toFixed(2) : 0}% variance
            </div>
          </div>
        </div>
      </div>

      {/* LC Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventoryLCs.map((lc) => {
          const soldPercentage =
            lc.scaleCopyWeightKg > 0
              ? Math.min(100, (lc.soldWeightKg / lc.scaleCopyWeightKg) * 100)
              : 0;

          return (
            <div
              key={lc.id}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                {/* LC Top */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="font-mono font-black text-lg text-amber-300">
                      LC: {lc.lcNo}
                    </span>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {lc.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lc.status === 'In Stock'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : lc.status === 'Partially Sold'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {lc.status}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(lc)}
                      title={isBangla ? 'এলসি সম্পাদনা' : 'Edit LC'}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            isBangla
                              ? `আপনি কি নিশ্চিতভাবে এলসি "${lc.lcNo}" মুছে ফেলতে চান?`
                              : `Are you sure you want to delete LC "${lc.lcNo}"?`
                          )
                        ) {
                          onDeleteLC(lc.id);
                        }
                      }}
                      title={isBangla ? 'এলসি মুছুন' : 'Delete LC'}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Grade & Date */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Grade: <strong className="text-slate-200">{lc.grade}</strong></span>
                  <span>Arrived: {lc.arrivedDate}</span>
                </div>

                {/* Weight Comparison Box */}
                <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">
                      {isBangla ? 'কয়েল ওজন (BL)' : 'Coil Weight (BL)'}:
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {lc.coilWeightKg.toLocaleString()} KG
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">
                      {isBangla ? 'স্কেল কপি ওজন' : 'Scale Copy Weight'}:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {lc.scaleCopyWeightKg.toLocaleString()} KG
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-rose-400 pt-1 border-t border-slate-800">
                    <span>{isBangla ? 'ঘাটতি (Shortage)' : 'Scale Shortage'}:</span>
                    <span className="font-mono font-bold">
                      -{lc.shortageKg.toLocaleString()} KG (
                      {lc.coilWeightKg > 0
                        ? ((lc.shortageKg / lc.coilWeightKg) * 100).toFixed(2)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                {/* Landed Cost */}
                <div className="mt-2.5 flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">
                    {isBangla ? 'ল্যান্ডেড ক্রয় খরচ' : 'Landed Cost / KG'}:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    ৳ {lc.landedCostBdtPerKg} / KG
                  </span>
                </div>

                {/* Progress Bar of Sold vs Remaining */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">
                      {isBangla ? 'বিক্রয় অগ্রগতি' : 'Stock Progress'}:
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                      {soldPercentage.toFixed(1)}% Sold
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Remaining Tonnage Banner */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">
                    {isBangla ? 'অবশিষ্ট গোডাউন স্টক' : 'Remaining Stock'}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-white">
                    {(lc.remainingWeightKg / 1000).toFixed(2)} MT{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({lc.remainingWeightKg.toLocaleString()} KG)
                    </span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {isBangla ? 'মোট ভ্যালু' : 'Inventory Value'}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatBDT(lc.remainingWeightKg * lc.landedCostBdtPerKg)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New LC Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                {editingLC
                  ? isBangla ? 'এলসি স্টক তথ্য সম্পাদনা' : 'Edit LC Shipment'
                  : isBangla ? 'নতুন এলসি কয়েল স্টক গ্রহণ' : 'Record New LC Stock Arrival'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLC} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'এলসি নম্বর (LC No.)' : 'LC No.'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OMI 170"
                    value={lcNo}
                    onChange={(e) => setLcNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'স্টিল গ্রেড / স্পেসিফিকেশন' : 'Steel Grade'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500W, SPHC, Q235B"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBangla ? 'পণ্যের বিবরণ' : 'Product Description'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hot Rolled Steel Coils 2.50mm Prime"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'কয়েল ওজন (BL Weight KG)' : 'BL / Coil Weight (KG)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 95000"
                    value={coilWeightKg}
                    onChange={(e) => setCoilWeightKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'স্কেল কপি ওজন (Scale Copy KG)' : 'Scale Copy Weight (KG)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 94520"
                    value={scaleCopyWeightKg}
                    onChange={(e) => setScaleCopyWeightKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {numCoil > 0 && numScale > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    {isBangla ? 'গণনাকৃত ঘাটতি:' : 'Calculated Shortage:'}
                  </span>
                  <span className="text-rose-400 font-bold">
                    {computedShortage} KG ({((computedShortage / numCoil) * 100).toFixed(2)}%)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'ল্যান্ডেড খরচ প্রতি কেজি (BDT)' : 'Landed Cost / KG (BDT)'}
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 83.50"
                    value={landedCostBdtPerKg}
                    onChange={(e) => setLandedCostBdtPerKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBangla ? 'আগমন তারিখ' : 'Arrival Date'}
                  </label>
                  <input
                    type="date"
                    value={arrivedDate}
                    onChange={(e) => setArrivedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isSaving
                    ? isBangla ? 'সংরক্ষণ...' : 'Saving...'
                    : editingLC
                    ? isBangla ? 'আপডেট করুন' : 'Update LC'
                    : isBangla ? 'সংরক্ষণ করুন' : 'Save LC Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
