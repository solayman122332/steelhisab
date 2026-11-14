/**
 * Utility functions for currency, weight, and partnership calculations
 * Uses standard Bangladeshi Lakh / Crore currency notation & Metric Ton calculations.
 */

// Formats number to BDT currency with Bangladeshi comma separation (e.g., ৳ 12,50,000)
export function formatBDT(amount: number, showSymbol = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showSymbol ? '৳ 0' : '0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Custom Bangladeshi comma separation (last 3 digits, then groups of 2 digits)
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${groupedRest},${lastThree}`;
  } else {
    result = integerPart;
  }

  // If decimal is 00, we can omit or keep based on size
  const formattedDecimal = decimalPart === '00' ? '' : `.${decimalPart}`;
  const finalString = `${isNegative ? '-' : ''}${showSymbol ? '৳ ' : ''}${result}${formattedDecimal}`;
  return finalString;
}

// Format KG to Metric Ton or KG string
export function formatWeight(kg: number, includeTon = true): string {
  if (isNaN(kg) || kg === null) return '0 KG';
  const formattedKg = kg.toLocaleString('en-US');
  if (includeTon && Math.abs(kg) >= 1000) {
    const tons = (kg / 1000).toFixed(3);
    return `${formattedKg} KG (${tons} MT)`;
  }
  return `${formattedKg} KG`;
}

// Convert input value to safe number
export function parseSafeNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Calculate Total = (Weight_KG * Rate) - Less_BDT
export function calculateSaleTotal(weightKg: number, rateBdt: number, lessBdt: number): number {
  const gross = (weightKg || 0) * (rateBdt || 0);
  return Math.max(0, gross - (lessBdt || 0));
}

// Calculate Profit = Total - Purchase_Cost_BDT
export function calculateSaleProfit(totalBdt: number, purchaseCostBdt: number): number {
  return (totalBdt || 0) - (purchaseCostBdt || 0);
}

// Calculate Shortage = Coil_Weight - Scale_Copy_Weight
export function calculateShortage(coilWeightKg: number, scaleCopyWeightKg: number): number {
  return (coilWeightKg || 0) - (scaleCopyWeightKg || 0);
}

// Format Date YYYY-MM-DD to DD MMM YYYY
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
