export type TransactionType =
  | 'Sale'
  | 'Purchase'
  | 'Expense'
  | 'Fund Transfer'
  | 'Payment'
  | 'Receipt'
  | 'Journal'
  | 'Sale Order'
  | 'Purchase Order'
  | 'Quotation';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  party: string;
  partyType?: 'Customer' | 'Supplier' | 'Partner' | 'Other';
  lcNo?: string;
  weightKg: number;
  scaleWeightKg?: number; // Scale Copy Weight
  rateBdt: number;
  lessBdt: number;
  totalBdt: number; // (weightKg * rateBdt) - lessBdt
  costBdt: number; // Purchase_Cost_BDT
  profitBdt: number; // totalBdt - costBdt
  account: string; // Cash or Bank name
  toAccount?: string; // For Fund Transfer
  note?: string;
  refNo?: string; // Challan / Voucher / Invoice No
  truckNo?: string;
  coilNo?: string;
  status?: 'Completed' | 'Pending' | 'Draft';
  createdAt: string;
}

export interface Party {
  id: string;
  name: string;
  type: 'Customer' | 'Supplier' | 'Both';
  phone: string;
  address: string;
  creditLimit: number;
  openingBalanceBdt?: number;
  balanceBdt: number; // Positive = Customer owes us, Negative = We owe supplier
  lastActive?: string;
}

export type AccountType = 'Bank' | 'Cash' | 'Mobile Wallet';

export interface BankAccount {
  id: string;
  name: string; // e.g. Cash, NRBC 925 (Huzaifa), DBBL 1328 (Aksara), DBBL 21708 (Yousuf), DBBL 17052 (Rafi), bKash
  shortName?: string;
  accountNo: string;
  holderName?: string;
  branch?: string;
  openingBalanceBdt: number;
  balanceBdt: number; // Opening_Balance_BDT + Total_Credits - Total_Debits
  type: AccountType;
}

export interface InventoryLC {
  id: string;
  lcNo: string; // e.g. OMI 169, SABBIR 156, TUFFA 158
  description: string;
  grade: string; // e.g. 500W, Prime CR, MS Billet
  coilWeightKg: number; // As per LC / BL document
  scaleCopyWeightKg: number; // As per weighbridge scale copy
  shortageKg: number; // coilWeightKg - scaleCopyWeightKg
  landedCostBdtPerKg: number;
  totalCostBdt: number;
  soldWeightKg: number;
  remainingWeightKg: number;
  status: 'In Stock' | 'Partially Sold' | 'Liquidated';
  arrivedDate: string;
}

export interface PartnerDrawing {
  id: string;
  partnerName: string;
  date: string;
  amountBdt: number;
  account: string;
  note: string;
  refVoucher?: string;
}

export interface PartnerCapital {
  id: string;
  partnerName: string;
  banglaName: string;
  role: string;
  capitalBdt: number;
  capitalRatio: number; // e.g. 0.40 (40%)
  workingRatio?: number; // Share of the 2/3 working pool, e.g. 0.50
}

export interface TotalHisabSummary {
  grossSalesBdt: number;
  totalSalesWeightKg: number;
  grossProfitBdt: number;
  totalExpensesBdt: number;
  netProfitBdt: number;

  // 3-Pool Split
  pool1_yousufWorkingBdt: number; // Working Share pool 1
  pool2_litonMilonWorkingBdt: number; // Working Share pool 2
  pool2_litonWorkingBdt: number;
  pool2_milonWorkingBdt: number;
  pool3_capitalPoolBdt: number; // Capital Pool

  // Partner specific totals
  partners: {
    partnerName: string;
    banglaName: string;
    workingShareBdt: number;
    capitalShareBdt: number;
    totalProfitShareBdt: number;
    drawingsBdt: number;
    remainingDueBdt: number; // Paona (Net Payable)
  }[];
}

export interface ProductItem {
  id: string;
  name: string;
  size: string;
  standard: string;
  category: 'Rebar / Rod' | 'Sheet & Coil' | 'Section / Angle / Channel' | 'Billet / Raw' | 'Corrugated / Roofing' | 'Other';
  unit: string;
  unitWeight: string; // e.g. '0.395 kg/m'
  weightKgPerUnit: number; // e.g. 47.4
  bundlePcs: number;
  bundleWeightKg: number;
  marketRatePerKg: number;
  application: string;
}

export type Product = ProductItem;
export type ProductSpec = ProductItem;

export interface MetalDensityInfo {
  name: string;
  banglaName: string;
  density: number;
  desc: string;
}

export interface CompanyProfile {
  companyName: string;
  banglaName: string;
  tagline: string;
  headOffice: string;
  branchOffice: string;
  phone: string;
  email: string;
  vatTin: string;
  tradeLicense: string;
  challanTerms: string;
  currencySymbol: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  spreadsheetId: string;
  apiKey?: string;
  sheetTabs: {
    transactions: string;
    parties: string;
    accounts: string;
    inventoryLc: string;
    partnerDrawings: string;
    totalHisab: string;
  };
  lastSyncedAt?: string;
  isAutoSync: boolean;
}

export type ActiveModule =
  | 'Dashboard'
  | 'Sale'
  | 'Expense'
  | 'Parties'
  | 'Products'
  | 'Purchase'
  | 'Fund Transfer'
  | 'Payment'
  | 'Journal'
  | 'Sale Order'
  | 'Purchase Order'
  | 'Quotation'
  | 'Receipts'
  | 'Inventory'
  | 'Total Hisab'
  | 'POS Mode'
  | 'Bank Ledger';
