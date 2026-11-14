import React, { useState } from 'react';
import {
  Calculator,
  Scale,
  Layers,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Info,
  Maximize2,
} from 'lucide-react';
import { formatBDT } from '../utils/formatters';

export type MetalType =
  | 'Mild Steel (MS)'
  | 'SS 304'
  | 'SS 316'
  | 'Aluminum'
  | 'Zinc'
  | 'Copper'
  | 'Brass';

export type ShapeType =
  | 'Plain Sheet / Plate'
  | 'Round Pipe / Tube'
  | 'Angle (Equal/Unequal)'
  | 'Solid Round Bar';

export interface MetalDensityInfo {
  name: MetalType;
  banglaName: string;
  density: number; // g/cm³ or multiplier
  desc: string;
}

export const METAL_DENSITIES: Record<MetalType, MetalDensityInfo> = {
  'Mild Steel (MS)': {
    name: 'Mild Steel (MS)',
    banglaName: 'মাইল্ড স্টিল (এমএস)',
    density: 7.85,
    desc: 'Standard Structural & Commercial Carbon Steel',
  },
  'SS 304': {
    name: 'SS 304',
    banglaName: 'স্টেইনলেস স্টিল ৩০৪',
    density: 7.93,
    desc: 'Austenitic Food & Industrial Grade Stainless',
  },
  'SS 316': {
    name: 'SS 316',
    banglaName: 'স্টেইনলেস স্টিল ৩১৬',
    density: 7.98,
    desc: 'Marine & Chemical Resistant Stainless Steel',
  },
  Aluminum: {
    name: 'Aluminum',
    banglaName: 'অ্যালুমিনিয়াম',
    density: 2.70,
    desc: 'Lightweight Extruded & Sheet Aluminum',
  },
  Zinc: {
    name: 'Zinc',
    banglaName: 'দস্তা / জিংক',
    density: 7.14,
    desc: 'Galvanizing & Sheet Protection Zinc',
  },
  Copper: {
    name: 'Copper',
    banglaName: 'তামা / কপার',
    density: 8.96,
    desc: 'High Conductivity Electrolytic Copper Busbars',
  },
  Brass: {
    name: 'Brass',
    banglaName: 'পিতল / ব্রাস',
    density: 8.52,
    desc: 'Copper-Zinc Alloy Machinery & Hardware Brass',
  },
};

interface MetalWeightCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWeight?: (weightKg: number) => void;
  isBangla?: boolean;
}

export const MetalWeightCalculatorModal: React.FC<MetalWeightCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyWeight,
  isBangla = false,
}) => {
  const [metalType, setMetalType] = useState<MetalType>('Mild Steel (MS)');
  const [shape, setShape] = useState<ShapeType>('Plain Sheet / Plate');

  // Common inputs
  const [pieces, setPieces] = useState<string>('1');
  const [lengthM, setLengthM] = useState<string>('6.0'); // default 6 meters (common in Bangladesh steel trading)

  // Sheet / Plate inputs
  const [sheetWidthM, setSheetWidthM] = useState<string>('1.22'); // 4ft ≈ 1.22m
  const [sheetThicknessMm, setSheetThicknessMm] = useState<string>('2.50');

  // Pipe / Tube inputs
  const [pipeOuterDiaMm, setPipeOuterDiaMm] = useState<string>('48.3'); // 1.5" NB
  const [pipeWallThickMm, setPipeWallThickMm] = useState<string>('3.2');

  // Angle inputs
  const [angleLeg1Mm, setAngleLeg1Mm] = useState<string>('50');
  const [angleLeg2Mm, setAngleLeg2Mm] = useState<string>('50');
  const [angleThicknessMm, setAngleThicknessMm] = useState<string>('5.0');

  // Solid Round Bar inputs
  const [barDiaMm, setBarDiaMm] = useState<string>('16'); // 16mm deformed/round bar

  // Custom density override
  const [customDensity, setCustomDensity] = useState<string>('');

  if (!isOpen) return null;

  const standardDensity = METAL_DENSITIES[metalType].density;
  const currentDensity = parseFloat(customDensity) || standardDensity;
  const numPieces = Math.max(1, parseFloat(pieces) || 1);
  const numLengthM = parseFloat(lengthM) || 0;

  // Formula Calculations:
  let singleUnitWeight = 0;
  let formulaDisplay = '';

  if (shape === 'Plain Sheet / Plate') {
    const width = parseFloat(sheetWidthM) || 0;
    const thick = parseFloat(sheetThicknessMm) || 0;
    // Formula: Length(m) * Width(m) * Thickness(mm) * [Density] * Pieces = Weight (kg)
    singleUnitWeight = numLengthM * width * thick * currentDensity;
    formulaDisplay = `${numLengthM}m × ${width}m × ${thick}mm × ${currentDensity}`;
  } else if (shape === 'Round Pipe / Tube') {
    const od = parseFloat(pipeOuterDiaMm) || 0;
    const wt = parseFloat(pipeWallThickMm) || 0;
    // Formula: (Outer Diameter(mm) - Wall Thickness(mm)) * Wall Thickness(mm) * 0.0031416 * [Density] * Length(m) * Pieces = Weight (kg)
    if (od > wt) {
      singleUnitWeight = (od - wt) * wt * 0.0031416 * currentDensity * numLengthM;
      formulaDisplay = `(${od} - ${wt}) × ${wt} × 0.0031416 × ${currentDensity} × ${numLengthM}m`;
    }
  } else if (shape === 'Angle (Equal/Unequal)') {
    const l1 = parseFloat(angleLeg1Mm) || 0;
    const l2 = parseFloat(angleLeg2Mm) || 0;
    const t = parseFloat(angleThicknessMm) || 0;
    // Formula: (Leg 1(mm) + Leg 2(mm) - Thickness(mm)) * Thickness(mm) * 0.001 * [Density] * Length(m) * Pieces = Weight (kg)
    if (l1 + l2 > t) {
      singleUnitWeight = (l1 + l2 - t) * t * 0.001 * currentDensity * numLengthM;
      formulaDisplay = `(${l1} + ${l2} - ${t}) × ${t} × 0.001 × ${currentDensity} × ${numLengthM}m`;
    }
  } else if (shape === 'Solid Round Bar') {
    const dia = parseFloat(barDiaMm) || 0;
    // Formula: (Diameter(mm) * Diameter(mm)) * 0.0007854 * [Density] * Length(m) * Pieces = Weight (kg)
    singleUnitWeight = dia * dia * 0.0007854 * currentDensity * numLengthM;
    formulaDisplay = `${dia}² × 0.0007854 × ${currentDensity} × ${numLengthM}m`;
  }

  const totalCalculatedWeight = Math.round(singleUnitWeight * numPieces * 100) / 100;

  const handleApply = () => {
    if (onApplyWeight) {
      onApplyWeight(totalCalculatedWeight);
    }
    onClose();
  };

  const handleReset = () => {
    setPieces('1');
    setLengthM('6.0');
    setSheetWidthM('1.22');
    setSheetThicknessMm('2.50');
    setPipeOuterDiaMm('48.3');
    setPipeWallThickMm('3.2');
    setAngleLeg1Mm('50');
    setAngleLeg2Mm('50');
    setAngleThicknessMm('5.0');
    setBarDiaMm('16');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-2xl my-auto p-4 sm:p-6 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                <span>
                  {isBangla ? 'মাল্টি-মেটাল ওজন ক্যালকুলেটর' : 'Multi-Metal Weight Calculator'}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Density Based
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isBangla
                  ? 'শিট, পাইপ, অ্যাঙ্গেল এবং রডের সুনির্দিষ্ট কেজি ওজনের হিসাব'
                  : 'Calculate accurate steel, SS, and non-ferrous metal weights by profile dimensions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Metal Type & Shape Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'ধাতুর ধরন (Metal Type & Density)' : 'Metal Type & Density'}
              </label>
              <select
                value={metalType}
                onChange={(e) => setMetalType(e.target.value as MetalType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                {(Object.keys(METAL_DENSITIES) as MetalType[]).map((key) => {
                  const m = METAL_DENSITIES[key];
                  return (
                    <option key={key} value={key}>
                      {m.name} ({m.density} g/cm³)
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Multiplier: <span className="font-mono text-amber-400 font-bold">{currentDensity}</span> ·{' '}
                {METAL_DENSITIES[metalType].desc}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder={`Custom density (default ${standardDensity})`}
                  value={customDensity}
                  onChange={(e) => setCustomDensity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
                {customDensity && (
                  <button
                    type="button"
                    onClick={() => setCustomDensity('')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                    title="Reset to default density"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBangla ? 'মেটাল প্রোফাইল বা শেপ (Shape)' : 'Metal Profile / Shape'}
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as ShapeType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="Plain Sheet / Plate">Plain Sheet / Plate (শিট ও প্লেট)</option>
                <option value="Round Pipe / Tube">Round Pipe / Tube (পাইপ ও টিউব)</option>
                <option value="Angle (Equal/Unequal)">Angle - Equal / Unequal (অ্যাঙ্গেল)</option>
                <option value="Solid Round Bar">Solid Round Bar (গোলাকার রড ও শ্যাফ্ট)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Shape Profile: <span className="text-slate-300 font-medium">{shape}</span>
              </p>
            </div>
          </div>

          {/* Dimension Inputs based on Selected Shape */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
              <span>{shape} Dimensions</span>
              <span className="text-slate-400 font-normal font-mono lowercase">standard engineering units</span>
            </div>

            {/* 1. Plain Sheet / Plate */}
            {shape === 'Plain Sheet / Plate' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Length (meters / মি.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    placeholder="e.g. 6.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Width (meters / মি.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={sheetWidthM}
                    onChange={(e) => setSheetWidthM(e.target.value)}
                    placeholder="e.g. 1.22"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Thickness (mm / মিমি)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={sheetThicknessMm}
                    onChange={(e) => setSheetThicknessMm(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 2. Round Pipe / Tube */}
            {shape === 'Round Pipe / Tube' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Outer Diameter (mm / মিমি)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={pipeOuterDiaMm}
                    onChange={(e) => setPipeOuterDiaMm(e.target.value)}
                    placeholder="e.g. 48.3"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Wall Thickness (mm / মিমি)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={pipeWallThickMm}
                    onChange={(e) => setPipeWallThickMm(e.target.value)}
                    placeholder="e.g. 3.2"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Length (meters / মি.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    placeholder="e.g. 6.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 3. Angle (Equal/Unequal) */}
            {shape === 'Angle (Equal/Unequal)' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Leg 1 (mm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={angleLeg1Mm}
                    onChange={(e) => setAngleLeg1Mm(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Leg 2 (mm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={angleLeg2Mm}
                    onChange={(e) => setAngleLeg2Mm(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Thickness (mm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={angleThicknessMm}
                    onChange={(e) => setAngleThicknessMm(e.target.value)}
                    placeholder="5.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Length (meters)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    placeholder="6.0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* 4. Solid Round Bar */}
            {shape === 'Solid Round Bar' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Diameter (mm / মিমি ব্যাস)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={barDiaMm}
                    onChange={(e) => setBarDiaMm(e.target.value)}
                    placeholder="e.g. 16 or 20"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Length (meters / মি.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    placeholder="e.g. 12.0 (standard 40ft rod)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Quantity / Pieces Multiplier */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-slate-300 font-medium mb-1">
                  {isBangla ? 'মোট পিস / সংখ্যা (Pieces Quantity)' : 'Pieces / Quantity Multiplier'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={pieces}
                  onChange={(e) => setPieces(e.target.value)}
                  placeholder="1"
                  className="w-full sm:w-44 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="self-end flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Formula Breakdown Banner */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold mb-0.5">
              Active Math Formula:
            </span>
            <span className="text-amber-300/90">{formulaDisplay}</span>
            {numPieces > 1 && (
              <span className="text-emerald-400"> × {numPieces} pcs</span>
            )}
          </div>

          {/* Calculation Result KPI Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                {isBangla ? 'গণনাকৃত মোট ওজন' : 'Calculated Total Weight'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black text-amber-300">
                  {totalCalculatedWeight.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-bold text-slate-400">KG</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Single Piece: <strong className="font-mono text-slate-200">{singleUnitWeight.toFixed(2)} KG</strong>
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onApplyWeight ? (
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBangla ? 'বিলে ওজন যোগ করুন' : 'Apply Weight to Bill'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
