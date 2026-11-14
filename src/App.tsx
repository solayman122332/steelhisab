import React, { useState, useEffect } from 'react';
import {
  ActiveModule,
  BankAccount,
  GoogleSheetsConfig,
  InventoryLC,
  Party,
  PartnerCapital,
  PartnerDrawing,
  Transaction,
  TransactionType,
  Product,
  CompanyProfile,
  MetalDensityInfo,
} from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_DRAWINGS,
  INITIAL_INVENTORY_LC,
  INITIAL_PARTIES,
  INITIAL_PARTNERS,
  INITIAL_TRANSACTIONS,
  INITIAL_PRODUCTS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_METAL_DENSITIES,
} from './data/initialData';
import { GoogleSheetsService } from './services/googleSheetsService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuickActionGrid } from './components/QuickActionGrid';
import { BankLedgerWidget } from './components/BankLedgerWidget';
import { TotalHisabDashboard } from './components/TotalHisabDashboard';
import { InventoryLCView } from './components/InventoryLCView';
import { PartiesView } from './components/PartiesView';
import { TransactionListView } from './components/TransactionListView';
import { TransactionModal } from './components/TransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { PosModeView } from './components/PosModeView';
import { ChallanModal } from './components/ChallanModal';
import { ProductsView } from './components/ProductsView';
import { DashboardCharts } from './components/DashboardCharts';
import { MetalWeightCalculatorModal } from './components/MetalWeightCalculatorModal';
import { formatBDT } from './utils/formatters';
import {
  TrendingUp,
  Receipt,
  Boxes,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_tx_v2');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_parties_v2');
      return saved ? JSON.parse(saved) : INITIAL_PARTIES;
    } catch {
      return INITIAL_PARTIES;
    }
  });

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_accounts_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((acc: any) => {
            const matchedInit = INITIAL_ACCOUNTS.find((init) => init.id === acc.id);
            return {
              ...acc,
              openingBalanceBdt:
                acc.openingBalanceBdt !== undefined
                  ? Number(acc.openingBalanceBdt)
                  : (matchedInit?.openingBalanceBdt ?? Number(acc.balanceBdt) ?? 0),
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_ACCOUNTS;
  });

  const [inventoryLCs, setInventoryLCs] = useState<InventoryLC[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_inventory_v2');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY_LC;
    } catch {
      return INITIAL_INVENTORY_LC;
    }
  });

  const [drawings, setDrawings] = useState<PartnerDrawing[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_drawings_v2');
      return saved ? JSON.parse(saved) : INITIAL_DRAWINGS;
    } catch {
      return INITIAL_DRAWINGS;
    }
  });

  const [partners, setPartners] = useState<PartnerCapital[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_partners_v2');
      return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
    } catch {
      return INITIAL_PARTNERS;
    }
  });

  const [products, setProducts] = useState<ProductSpec[]>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_products_v2');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('steelhisab_company_profile_v2');
      return saved ? JSON.parse(saved) : INITIAL_COMPANY_PROFILE;
    } catch {
      return INITIAL_COMPANY_PROFILE;
    }
  });

  // Sync settings
  const [syncConfig, setSyncConfig] = useState<GoogleSheetsConfig>(() =>
    GoogleSheetsService.getConfig()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // UI Navigation states
  const [activeModule, setActiveModule] = useState<ActiveModule>('Dashboard');
  const [isPosMode, setIsPosMode] = useState(false);
  const [isBangla, setIsBangla] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('Sale');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedChallanTx, setSelectedChallanTx] = useState<Transaction | null>(null);
  const [isStandaloneMetalCalcOpen, setIsStandaloneMetalCalcOpen] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('steelhisab_tx_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('steelhisab_parties_v2', JSON.stringify(parties));
  }, [parties]);

  useEffect(() => {
    localStorage.setItem('steelhisab_accounts_v2', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('steelhisab_inventory_v2', JSON.stringify(inventoryLCs));
  }, [inventoryLCs]);

  useEffect(() => {
    localStorage.setItem('steelhisab_drawings_v2', JSON.stringify(drawings));
  }, [drawings]);

  useEffect(() => {
    localStorage.setItem('steelhisab_partners_v2', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('steelhisab_products_v2', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('steelhisab_company_profile_v2', JSON.stringify(companyProfile));
  }, [companyProfile]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Live total liquid funds
  const totalLiquidFunds = accounts.reduce((sum, a) => sum + (a.balanceBdt || 0), 0);

  // Helper to dynamically calculate current balance for all accounts:
  // Current_Balance_BDT = Opening_Balance_BDT + Total_Credits - Total_Debits
  const computeLiveAccountBalances = (
    accountList: BankAccount[],
    txList: Transaction[],
    drawingList: PartnerDrawing[]
  ): BankAccount[] => {
    return accountList.map((acc) => {
      const opening = acc.openingBalanceBdt !== undefined ? acc.openingBalanceBdt : (acc.balanceBdt || 0);
      let credits = 0;
      let debits = 0;

      txList.forEach((tx) => {
        const isAccount = tx.account === acc.name || (acc.shortName && tx.account === acc.shortName);
        const isToAccount = tx.toAccount === acc.name || (acc.shortName && tx.toAccount === acc.shortName);

        if (isAccount) {
          if (tx.type === 'Sale' || tx.type === 'Receipt') {
            credits += tx.totalBdt || 0;
          } else if (tx.type === 'Expense' || tx.type === 'Purchase' || tx.type === 'Payment') {
            debits += tx.totalBdt || 0;
          } else if (tx.type === 'Fund Transfer') {
            debits += tx.totalBdt || 0;
          }
        }

        if (isToAccount && tx.type === 'Fund Transfer') {
          credits += tx.totalBdt || 0;
        }
      });

      drawingList.forEach((drw) => {
        if (drw.account === acc.name || (acc.shortName && drw.account === acc.shortName)) {
          debits += drw.amountBdt || 0;
        }
      });

      return {
        ...acc,
        openingBalanceBdt: opening,
        balanceBdt: opening + credits - debits,
      };
    });
  };

  // 1. Add New Account
  const handleAddAccount = async (newAccountData: Omit<BankAccount, 'id' | 'balanceBdt'>) => {
    const newId = `acc-${Date.now()}`;
    const newAccount: BankAccount = {
      ...newAccountData,
      id: newId,
      openingBalanceBdt: newAccountData.openingBalanceBdt || 0,
      balanceBdt: newAccountData.openingBalanceBdt || 0,
    };

    const nextAccounts = [...accounts, newAccount];
    const balancedAccounts = computeLiveAccountBalances(nextAccounts, transactions, drawings);
    setAccounts(balancedAccounts);

    if (syncConfig.webAppUrl) {
      await GoogleSheetsService.syncAccountAction('add', newAccount);
    }

    showToast(
      'success',
      isBangla
        ? `অ্যাকাউন্ট "${newAccount.name}" সফলভাবে তৈরি হয়েছে!`
        : `Account "${newAccount.name}" added successfully!`
    );
  };

  // 2. Edit Account (with transaction & drawing name cascade)
  const handleEditAccount = async (id: string, updatedFields: Partial<BankAccount>) => {
    const existing = accounts.find((a) => a.id === id);
    if (!existing) return;

    const oldName = existing.name;
    const newName = updatedFields.name ? updatedFields.name.trim() : oldName;
    const nameChanged = oldName !== newName;

    // Update historical transactions if name changed
    let nextTransactions = transactions;
    if (nameChanged) {
      nextTransactions = transactions.map((tx) => {
        let changed = false;
        let acc = tx.account;
        let toAcc = tx.toAccount;
        if (tx.account === oldName || (existing.shortName && tx.account === existing.shortName)) {
          acc = newName;
          changed = true;
        }
        if (tx.toAccount === oldName || (existing.shortName && tx.toAccount === existing.shortName)) {
          toAcc = newName;
          changed = true;
        }
        return changed ? { ...tx, account: acc, toAccount: toAcc } : tx;
      });
      setTransactions(nextTransactions);
    }

    // Update historical partner drawings if name changed
    let nextDrawings = drawings;
    if (nameChanged) {
      nextDrawings = drawings.map((drw) => {
        if (drw.account === oldName || (existing.shortName && drw.account === existing.shortName)) {
          return { ...drw, account: newName };
        }
        return drw;
      });
      setDrawings(nextDrawings);
    }

    const nextAccounts = accounts.map((acc) => {
      if (acc.id === id) {
        return {
          ...acc,
          ...updatedFields,
          name: newName,
          shortName: newName,
        };
      }
      return acc;
    });

    const balancedAccounts = computeLiveAccountBalances(nextAccounts, nextTransactions, nextDrawings);
    setAccounts(balancedAccounts);

    const editedAcc = balancedAccounts.find((a) => a.id === id);
    if (syncConfig.webAppUrl && editedAcc) {
      await GoogleSheetsService.syncAccountAction('edit', editedAcc);
    }

    showToast(
      'success',
      isBangla
        ? `অ্যাকাউন্ট "${newName}" সফলভাবে আপডেট হয়েছে!`
        : `Account "${newName}" updated successfully!`
    );
  };

  // 3. Delete Account (with transaction & drawing reassignment)
  const handleDeleteAccount = async (id: string, reassignToAccountId?: string) => {
    const accountToDelete = accounts.find((a) => a.id === id);
    if (!accountToDelete) return;

    const targetAccount = reassignToAccountId
      ? accounts.find((a) => a.id === reassignToAccountId)
      : undefined;

    let nextTransactions = transactions;
    let nextDrawings = drawings;

    if (targetAccount) {
      nextTransactions = transactions.map((tx) => {
        let changed = false;
        let acc = tx.account;
        let toAcc = tx.toAccount;
        if (tx.account === accountToDelete.name || (accountToDelete.shortName && tx.account === accountToDelete.shortName)) {
          acc = targetAccount.name;
          changed = true;
        }
        if (tx.toAccount === accountToDelete.name || (accountToDelete.shortName && tx.toAccount === accountToDelete.shortName)) {
          toAcc = targetAccount.name;
          changed = true;
        }
        return changed ? { ...tx, account: acc, toAccount: toAcc } : tx;
      });
      setTransactions(nextTransactions);

      nextDrawings = drawings.map((drw) => {
        if (drw.account === accountToDelete.name || (accountToDelete.shortName && drw.account === accountToDelete.shortName)) {
          return { ...drw, account: targetAccount.name };
        }
        return drw;
      });
      setDrawings(nextDrawings);
    }

    const remainingAccounts = accounts.filter((a) => a.id !== id);
    const balancedAccounts = computeLiveAccountBalances(remainingAccounts, nextTransactions, nextDrawings);
    setAccounts(balancedAccounts);

    if (syncConfig.webAppUrl) {
      await GoogleSheetsService.syncAccountAction('delete', { id });
    }

    showToast(
      'success',
      isBangla
        ? `অ্যাকাউন্ট "${accountToDelete.name}" সফলভাবে মুছে ফেলা হয়েছে!`
        : `Account "${accountToDelete.name}" deleted successfully!`
    );
  };

  // Open transaction modal for new entry
  const handleOpenTransaction = (type: TransactionType = 'Sale') => {
    setEditingTransaction(null);
    setTxModalType(type);
    setIsTxModalOpen(true);
  };

  // Open transaction modal for editing existing transaction
  const handleStartEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalType(tx.type);
    setIsTxModalOpen(true);
  };

  // Handle Edit Transaction with reverse accounting math
  const handleUpdateTransaction = async (
    id: string,
    updatedFields: Partial<Transaction>
  ) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = {
      ...oldTx,
      ...updatedFields,
      id,
    };

    // 1. Inventory LC weight reversal & re-application:
    setInventoryLCs((prevLCs) => {
      let modifiedLCs = [...prevLCs];

      // Reverse old transaction impact on LC
      if (oldTx.lcNo && (oldTx.type === 'Sale' || oldTx.type === 'Sale Order')) {
        modifiedLCs = modifiedLCs.map((lc) => {
          if (lc.lcNo === oldTx.lcNo) {
            const restoredSold = Math.max(0, (lc.soldWeightKg || 0) - (oldTx.weightKg || 0));
            const restoredRem = Math.max(0, (lc.scaleCopyWeightKg || 0) - restoredSold);
            return {
              ...lc,
              soldWeightKg: restoredSold,
              remainingWeightKg: restoredRem,
              status: restoredRem <= 0 ? 'Liquidated' : 'Partially Sold',
            };
          }
          return lc;
        });
      } else if (oldTx.lcNo && (oldTx.type === 'Purchase' || oldTx.type === 'Purchase Order')) {
        modifiedLCs = modifiedLCs.map((lc) => {
          if (lc.lcNo === oldTx.lcNo) {
            const restoredScale = Math.max(0, (lc.scaleCopyWeightKg || 0) - (oldTx.weightKg || 0));
            const restoredRem = Math.max(0, (lc.remainingWeightKg || 0) - (oldTx.weightKg || 0));
            return {
              ...lc,
              scaleCopyWeightKg: restoredScale,
              remainingWeightKg: restoredRem,
            };
          }
          return lc;
        });
      }

      // Apply new updated transaction impact to LC
      if (newTx.lcNo && (newTx.type === 'Sale' || newTx.type === 'Sale Order')) {
        modifiedLCs = modifiedLCs.map((lc) => {
          if (lc.lcNo === newTx.lcNo) {
            const nextSold = (lc.soldWeightKg || 0) + (newTx.weightKg || 0);
            const nextRem = Math.max(0, (lc.scaleCopyWeightKg || 0) - nextSold);
            return {
              ...lc,
              soldWeightKg: nextSold,
              remainingWeightKg: nextRem,
              status: nextRem <= 0 ? 'Liquidated' : 'Partially Sold',
            };
          }
          return lc;
        });
      } else if (newTx.lcNo && (newTx.type === 'Purchase' || newTx.type === 'Purchase Order')) {
        modifiedLCs = modifiedLCs.map((lc) => {
          if (lc.lcNo === newTx.lcNo) {
            const nextScale = (lc.scaleCopyWeightKg || 0) + (newTx.weightKg || 0);
            const nextRem = (lc.remainingWeightKg || 0) + (newTx.weightKg || 0);
            return {
              ...lc,
              scaleCopyWeightKg: nextScale,
              remainingWeightKg: nextRem,
            };
          }
          return lc;
        });
      }

      return modifiedLCs;
    });

    // 2. Party Balance Reversal & Re-application
    setParties((prevParties) =>
      prevParties.map((p) => {
        let currentBal = p.balanceBdt;

        // Revert old transaction
        if (oldTx.party && p.name.toLowerCase() === oldTx.party.toLowerCase()) {
          if (oldTx.type === 'Sale') {
            currentBal -= oldTx.totalBdt; // Revert customer bill
          } else if (oldTx.type === 'Receipt') {
            currentBal += oldTx.totalBdt; // Revert customer receipt
          } else if (oldTx.type === 'Purchase') {
            currentBal += oldTx.totalBdt; // Revert supplier payable
          } else if (oldTx.type === 'Payment') {
            currentBal -= oldTx.totalBdt; // Revert supplier payment
          }
        }

        // Apply new transaction
        if (newTx.party && p.name.toLowerCase() === newTx.party.toLowerCase()) {
          if (newTx.type === 'Sale') {
            currentBal += newTx.totalBdt;
          } else if (newTx.type === 'Receipt') {
            currentBal -= newTx.totalBdt;
          } else if (newTx.type === 'Purchase') {
            currentBal -= newTx.totalBdt;
          } else if (newTx.type === 'Payment') {
            currentBal += newTx.totalBdt;
          }
        }

        return { ...p, balanceBdt: currentBal, lastActive: newTx.date };
      })
    );

    // 3. Update transactions array
    const nextTransactions = transactions.map((t) => (t.id === id ? newTx : t));
    setTransactions(nextTransactions);

    // 4. Recalculate Live Bank & Cash Balances with formula:
    // Current_Balance_BDT = Opening_Balance_BDT + Total_Credits - Total_Debits
    const balancedAccounts = computeLiveAccountBalances(accounts, nextTransactions, drawings);
    setAccounts(balancedAccounts);

    // 5. Database Sync Routing (action: "edit")
    if (syncConfig.webAppUrl) {
      try {
        await GoogleSheetsService.syncTransactionAction('edit', newTx);
        showToast(
          'success',
          isBangla
            ? 'লেনদেন সফলভাবে আপডেট ও গুগল শিটে সিঙ্ক হয়েছে!'
            : 'Transaction updated & recalculated in Google Sheets!'
        );
      } catch (err) {
        showToast('info', 'Updated locally. Google Sheet sync queued.');
      }
    } else {
      showToast(
        'success',
        isBangla
          ? 'লেনদেন আপডেট ও লেজার রিক্যালকুলেট সম্পন্ন হয়েছে!'
          : 'Transaction updated & all balances recalculated!'
      );
    }

    setEditingTransaction(null);
    setIsTxModalOpen(false);
  };

  // Handle Delete Transaction with reverse accounting math
  const handleDeleteTransaction = async (tx: Transaction) => {
    // 1. Inventory LC weight reversal:
    // Deleting a Sale: restore Weight KG back into Inventory LC
    // Deleting a Purchase: remove Weight KG from Inventory LC
    if (tx.lcNo && (tx.type === 'Sale' || tx.type === 'Sale Order')) {
      setInventoryLCs((prevLCs) =>
        prevLCs.map((lc) => {
          if (lc.lcNo === tx.lcNo) {
            const restoredSold = Math.max(0, (lc.soldWeightKg || 0) - (tx.weightKg || 0));
            const restoredRem = Math.max(0, (lc.scaleCopyWeightKg || 0) - restoredSold);
            return {
              ...lc,
              soldWeightKg: restoredSold,
              remainingWeightKg: restoredRem,
              status: restoredRem <= 0 ? 'Liquidated' : 'Partially Sold',
            };
          }
          return lc;
        })
      );
    } else if (tx.lcNo && (tx.type === 'Purchase' || tx.type === 'Purchase Order')) {
      setInventoryLCs((prevLCs) =>
        prevLCs.map((lc) => {
          if (lc.lcNo === tx.lcNo) {
            const restoredScale = Math.max(0, (lc.scaleCopyWeightKg || 0) - (tx.weightKg || 0));
            const restoredRem = Math.max(0, (lc.remainingWeightKg || 0) - (tx.weightKg || 0));
            return {
              ...lc,
              scaleCopyWeightKg: restoredScale,
              remainingWeightKg: restoredRem,
            };
          }
          return lc;
        })
      );
    }

    // 2. Reverse Party Balance impact
    if (tx.party) {
      setParties((prevParties) =>
        prevParties.map((p) => {
          if (p.name.toLowerCase() === tx.party.toLowerCase()) {
            let nextBal = p.balanceBdt;
            if (tx.type === 'Sale') {
              nextBal -= tx.totalBdt; // Customer owes less
            } else if (tx.type === 'Receipt') {
              nextBal += tx.totalBdt; // Customer paid less
            } else if (tx.type === 'Purchase') {
              nextBal += tx.totalBdt; // We owe supplier less
            } else if (tx.type === 'Payment') {
              nextBal -= tx.totalBdt; // We paid supplier less
            }
            return { ...p, balanceBdt: nextBal };
          }
          return p;
        })
      );
    }

    // 3. Remove transaction from ledger
    const nextTransactions = transactions.filter((t) => t.id !== tx.id);
    setTransactions(nextTransactions);

    // 4. Recalculate Live Bank & Cash Balances with formula:
    // Current_Balance_BDT = Opening_Balance_BDT + Total_Credits - Total_Debits
    const balancedAccounts = computeLiveAccountBalances(accounts, nextTransactions, drawings);
    setAccounts(balancedAccounts);

    // 5. Database Sync Routing (action: "delete")
    if (syncConfig.webAppUrl) {
      try {
        await GoogleSheetsService.syncTransactionAction('delete', tx);
        showToast(
          'success',
          isBangla
            ? 'লেনদেন মুছে ফেলা হয়েছে এবং গুগল শিটে আপডেট হয়েছে!'
            : 'Transaction deleted & updated in Google Sheets!'
        );
      } catch (err) {
        showToast('info', 'Deleted locally. Google Sheet sync queued.');
      }
    } else {
      showToast(
        'success',
        isBangla
          ? 'লেনদেন মুছে আর্থিক হিসাব সফলভাবে রিভার্স করা হয়েছে!'
          : 'Transaction deleted & accounting math reversed successfully!'
      );
    }
  };

  // Handle Save Transaction with local ledger & live Google Sheet append
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // 1. Update Transactions list
    const nextTransactions = [newTx, ...transactions];
    setTransactions(nextTransactions);

    // 2. Adjust Bank & Cash balances with exact formula:
    // Current_Balance_BDT = Opening_Balance_BDT + Total_Credits - Total_Debits
    const balancedAccounts = computeLiveAccountBalances(accounts, nextTransactions, drawings);
    setAccounts(balancedAccounts);

    // 3. Adjust Inventory LC weight if linked
    if (newTx.lcNo && (newTx.type === 'Sale' || newTx.type === 'Sale Order')) {
      setInventoryLCs((prevLCs) =>
        prevLCs.map((lc) => {
          if (lc.lcNo === newTx.lcNo) {
            const nextSold = (lc.soldWeightKg || 0) + (newTx.weightKg || 0);
            const nextRem = Math.max(0, (lc.scaleCopyWeightKg || 0) - nextSold);
            return {
              ...lc,
              soldWeightKg: nextSold,
              remainingWeightKg: nextRem,
              status: nextRem <= 0 ? 'Liquidated' : 'Partially Sold',
            };
          }
          return lc;
        })
      );
    }

    // 4. Update Party Balance
    if (newTx.party) {
      setParties((prevParties) =>
        prevParties.map((p) => {
          if (p.name.toLowerCase() === newTx.party.toLowerCase()) {
            let nextBal = p.balanceBdt;
            if (newTx.type === 'Sale') {
              nextBal += newTx.totalBdt; // Customer owes us more
            } else if (newTx.type === 'Receipt') {
              nextBal -= newTx.totalBdt; // Customer paid us
            } else if (newTx.type === 'Purchase') {
              nextBal -= newTx.totalBdt; // We owe supplier
            } else if (newTx.type === 'Payment') {
              nextBal += newTx.totalBdt; // We paid supplier
            }
            return { ...p, balanceBdt: nextBal, lastActive: newTx.date };
          }
          return p;
        })
      );
    }

    // 5. Append row to Google Sheets via text/plain;charset=utf-8 POST (bypassing CORS)
    if (syncConfig.webAppUrl) {
      try {
        const res = await GoogleSheetsService.appendRowToSheet(
          syncConfig.sheetTabs.transactions,
          newTx
        );
        if (res.success) {
          showToast(
            'success',
            isBangla
              ? 'লেনদেন সংরক্ষিত এবং গুগল শিটে যোগ হয়েছে!'
              : 'Transaction recorded & appended to Google Sheet!'
          );
        } else {
          showToast('info', `Saved locally. Sheet note: ${res.message}`);
        }
      } catch (err: any) {
        showToast('info', 'Saved locally. Google Sheet sync queued.');
      }
    } else {
      showToast(
        'success',
        isBangla
          ? 'লেনদেন সফলভাবে স্থানীয় লেজারে সংরক্ষিত হয়েছে!'
          : 'Transaction saved to local ledger.'
      );
    }
  };

  // Add Partner Drawing
  const handleAddDrawing = async (drawingData: Omit<PartnerDrawing, 'id'>) => {
    const newDrawing: PartnerDrawing = {
      ...drawingData,
      id: `drw-${Date.now()}`,
    };

    const nextDrawings = [newDrawing, ...drawings];
    setDrawings(nextDrawings);

    // Live balance update via formula: Opening + Credits - Debits
    const balancedAccounts = computeLiveAccountBalances(accounts, transactions, nextDrawings);
    setAccounts(balancedAccounts);

    // Append to Google Sheet Partner_Drawings tab
    if (syncConfig.webAppUrl) {
      await GoogleSheetsService.appendRowToSheet(
        syncConfig.sheetTabs.partnerDrawings,
        newDrawing
      );
    }

    showToast(
      'success',
      isBangla
        ? `${newDrawing.partnerName} সাহেবের ${formatBDT(newDrawing.amountBdt)} উত্তোলন সংরক্ষিত!`
        : `Drawing of ${formatBDT(newDrawing.amountBdt)} for ${newDrawing.partnerName} recorded!`
    );
  };

  // Add New LC Stock
  const handleAddLC = async (lcData: Omit<InventoryLC, 'id'>) => {
    const newLC: InventoryLC = {
      ...lcData,
      id: `lc-${Date.now()}`,
    };
    setInventoryLCs((prev) => [newLC, ...prev]);

    if (syncConfig.webAppUrl) {
      await GoogleSheetsService.appendRowToSheet(
        syncConfig.sheetTabs.inventoryLc,
        newLC
      );
    }

    showToast(
      'success',
      isBangla
        ? `নতুন এলসি ${newLC.lcNo} ইনভেন্টরিতে সফলভাবে যোগ হয়েছে!`
        : `New LC ${newLC.lcNo} added to Inventory!`
    );
  };

  // Add New Party
  const handleAddParty = async (partyData: Omit<Party, 'id'>) => {
    const newParty: Party = {
      ...partyData,
      id: `party-${Date.now()}`,
    };
    setParties((prev) => [newParty, ...prev]);

    if (syncConfig.webAppUrl) {
      await GoogleSheetsService.appendRowToSheet(
        syncConfig.sheetTabs.parties,
        newParty
      );
    }

    showToast(
      'success',
      isBangla ? 'নতুন পার্টি সফলভাবে সংরক্ষিত হয়েছে!' : 'New Party saved successfully!'
    );
  };

  // Edit Party
  const handleEditParty = (id: string, updated: Partial<Party>) => {
    const existing = parties.find((p) => p.id === id);
    if (!existing) return;

    const oldName = existing.name;
    const newName = updated.name ? updated.name.trim() : oldName;

    // If party name changed, cascade to transactions
    if (oldName !== newName) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.party?.toLowerCase() === oldName.toLowerCase()
            ? { ...t, party: newName }
            : t
        )
      );
    }

    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated, name: newName } : p))
    );

    showToast(
      'success',
      isBangla ? 'পার্টির তথ্য সফলভাবে আপডেট হয়েছে!' : 'Party details updated successfully!'
    );
  };

  // Delete Party
  const handleDeleteParty = (id: string) => {
    const partyToDelete = parties.find((p) => p.id === id);
    if (!partyToDelete) return;

    setParties((prev) => prev.filter((p) => p.id !== id));
    showToast(
      'success',
      isBangla ? 'পার্টি মুছে ফেলা হয়েছে!' : `Party "${partyToDelete.name}" removed!`
    );
  };

  // Edit Inventory LC
  const handleEditInventoryLC = (id: string, updated: Partial<InventoryLC>) => {
    setInventoryLCs((prev) =>
      prev.map((lc) => {
        if (lc.id === id) {
          const merged = { ...lc, ...updated };
          const coilWeight = merged.coilWeightKg || 0;
          const scaleWeight = merged.scaleCopyWeightKg || 0;
          const shortage = coilWeight - scaleWeight;
          const sold = merged.soldWeightKg || 0;
          const rem = Math.max(0, scaleWeight - sold);
          return {
            ...merged,
            shortageKg: shortage,
            remainingWeightKg: rem,
            totalCostBdt: scaleWeight * (merged.landedCostBdtPerKg || 0),
            status: rem <= 0 ? 'Liquidated' : sold > 0 ? 'Partially Sold' : 'In Stock',
          };
        }
        return lc;
      })
    );
    showToast('success', isBangla ? 'এলসি স্টক সফলভাবে আপডেট হয়েছে!' : 'LC shipment updated!');
  };

  // Delete Inventory LC
  const handleDeleteInventoryLC = (id: string) => {
    setInventoryLCs((prev) => prev.filter((lc) => lc.id !== id));
    showToast('success', isBangla ? 'এলসি স্টক মুছে ফেলা হয়েছে!' : 'LC shipment removed!');
  };

  // Partner Management Handlers
  const handleAddPartner = (partnerData: Omit<PartnerCapital, 'id'>) => {
    const newPartner: PartnerCapital = {
      ...partnerData,
      id: `prt-${Date.now()}`,
    };
    setPartners((prev) => [...prev, newPartner]);
    showToast(
      'success',
      isBangla
        ? `নতুন অংশীদার "${newPartner.partnerName}" যুক্ত করা হয়েছে!`
        : `New partner "${newPartner.partnerName}" added successfully!`
    );
  };

  const handleEditPartner = (id: string, updated: Partial<PartnerCapital>) => {
    const existing = partners.find((p) => p.id === id);
    if (!existing) return;

    const oldName = existing.partnerName;
    const newName = updated.partnerName ? updated.partnerName.trim() : oldName;

    // If partner name changed, update drawings as well
    if (oldName !== newName) {
      setDrawings((prev) =>
        prev.map((d) => (d.partnerName === oldName ? { ...d, partnerName: newName } : d))
      );
    }

    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated, partnerName: newName } : p))
    );
    showToast('success', isBangla ? 'অংশীদারের তথ্য আপডেট হয়েছে!' : 'Partner details updated!');
  };

  const handleDeletePartner = (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    showToast('success', isBangla ? 'অংশীদার তালিকা থেকে বাদ দেওয়া হয়েছে!' : 'Partner removed!');
  };

  const handleDeleteDrawing = (id: string) => {
    const nextDrawings = drawings.filter((d) => d.id !== id);
    setDrawings(nextDrawings);
    const balancedAccounts = computeLiveAccountBalances(accounts, transactions, nextDrawings);
    setAccounts(balancedAccounts);
    showToast('success', isBangla ? 'উত্তোলনের রেকর্ড মুছে ফেলা হয়েছে!' : 'Drawing record deleted!');
  };

  // Product Management Handlers
  const handleAddProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prd-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
    showToast(
      'success',
      isBangla ? 'নতুন পণ্য স্পেসিফিকেশন যোগ হয়েছে!' : `Product "${newProd.name}" added!`
    );
  };

  const handleEditProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    showToast('success', isBangla ? 'পণ্য তথ্য আপডেট হয়েছে!' : 'Product specification updated!');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('success', isBangla ? 'পণ্য মুছে ফেলা হয়েছে!' : 'Product removed!');
  };

  // Company Profile Update
  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    showToast(
      'success',
      isBangla ? 'প্রতিষ্ঠানের তথ্য ও চালান সেটিংস সংরক্ষিত!' : 'Company profile & Challan settings saved!'
    );
  };

  // Sync with Google Sheets
  const handleSync = async () => {
    if (!syncConfig.webAppUrl && !syncConfig.spreadsheetId) {
      setIsSettingsOpen(true);
      showToast(
        'info',
        isBangla
          ? 'অনুগ্রহ করে প্রথমে গুগল শিটের ওয়েব অ্যাপ URL প্রদান করুন।'
          : 'Please configure your Google Sheet Web App URL in settings.'
      );
      return;
    }

    setIsSyncing(true);
    try {
      const res = await GoogleSheetsService.fetchAllData();
      if (res.success && res.data) {
        if (res.data.transactions && Array.isArray(res.data.transactions) && res.data.transactions.length > 0) {
          setTransactions(res.data.transactions);
        }
        if (res.data.parties && Array.isArray(res.data.parties) && res.data.parties.length > 0) {
          setParties(res.data.parties);
        }
        if (res.data.accounts && Array.isArray(res.data.accounts) && res.data.accounts.length > 0) {
          setAccounts(res.data.accounts);
        }
        if (res.data.inventoryLc && Array.isArray(res.data.inventoryLc) && res.data.inventoryLc.length > 0) {
          setInventoryLCs(res.data.inventoryLc);
        }
        if (res.data.partnerDrawings && Array.isArray(res.data.partnerDrawings) && res.data.partnerDrawings.length > 0) {
          setDrawings(res.data.partnerDrawings);
        }

        const now = new Date().toLocaleTimeString();
        const updatedConfig = { ...syncConfig, lastSyncedAt: now };
        setSyncConfig(updatedConfig);
        GoogleSheetsService.saveConfig(updatedConfig);

        showToast(
          'success',
          isBangla
            ? `গুগল শিট থেকে ৬টি ট্যাব সফলভাবে সিঙ্ক হয়েছে (${now})`
            : `All 6 Sheet tabs synced successfully (${now})`
        );
      } else {
        showToast(
          'info',
          res.error || 'Connection checked. Offline data preserved.'
        );
      }
    } catch (err: any) {
      showToast('error', `Sync error: ${err?.message || 'Check network'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Test sync connection
  const handleTestSync = async () => {
    setIsTestingSync(true);
    try {
      const res = await GoogleSheetsService.fetchAllData();
      if (res.success) {
        showToast(
          'success',
          'Connection verified! Google Sheet responded successfully.'
        );
      } else {
        showToast(
          'info',
          res.error || 'Endpoint responded. Confirm tab names and permissions.'
        );
      }
    } catch (e: any) {
      showToast('error', `Connection failed: ${e?.message}`);
    } finally {
      setIsTestingSync(false);
    }
  };

  // Reset to default authentic steel sample data
  const handleResetData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setParties(INITIAL_PARTIES);
    setAccounts(INITIAL_ACCOUNTS);
    setInventoryLCs(INITIAL_INVENTORY_LC);
    setDrawings(INITIAL_DRAWINGS);
    setPartners(INITIAL_PARTNERS);
    setProducts(INITIAL_PRODUCTS);
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    localStorage.removeItem('steelhisab_tx_v2');
    localStorage.removeItem('steelhisab_parties_v2');
    localStorage.removeItem('steelhisab_accounts_v2');
    localStorage.removeItem('steelhisab_inventory_v2');
    localStorage.removeItem('steelhisab_drawings_v2');
    localStorage.removeItem('steelhisab_partners_v2');
    localStorage.removeItem('steelhisab_products_v2');
    localStorage.removeItem('steelhisab_company_profile_v2');
    showToast('success', 'Data reset to default steel partnership sample!');
  };

  const handleSaveConfig = (newCfg: GoogleSheetsConfig) => {
    setSyncConfig(newCfg);
    GoogleSheetsService.saveConfig(newCfg);
    showToast('success', 'Google Sheets settings saved!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md animate-slideUp border border-slate-700 bg-slate-900/95">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-slate-100">{notification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
        syncConfig={syncConfig}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isPosMode={isPosMode}
        onTogglePosMode={() => setIsPosMode((prev) => !prev)}
        totalLiquidFunds={totalLiquidFunds}
        isBangla={isBangla}
        onToggleLanguage={() => setIsBangla((prev) => !prev)}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Collapsible Sidebar */}
        <Sidebar
          currentModule={activeModule}
          onSelectModule={(mod) => {
            if (mod === 'POS Mode') {
              setIsPosMode(true);
            } else {
              setIsPosMode(false);
              setActiveModule(mod);
            }
          }}
          onOpenMetalCalculator={() => setIsStandaloneMetalCalcOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isBangla={isBangla}
        />

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden min-w-0">
          {isPosMode ? (
            /* POS Counter Screen */
            <PosModeView
              onExitPos={() => setIsPosMode(false)}
              accounts={accounts}
              parties={parties}
              products={products}
              companyProfile={companyProfile}
              onCompleteSale={handleSaveTransaction}
              isBangla={isBangla}
            />
          ) : (
            /* Standard Accounting Modules */
            <div className="space-y-6">
              {/* Top 4x3 Quick Action Grid (Always accessible on Dashboard & quick entry) */}
              <QuickActionGrid
                onSelectAction={(mod) => setActiveModule(mod)}
                onOpenNewTransaction={(type) => handleOpenTransaction(type)}
                onOpenMetalCalculator={() => setIsStandaloneMetalCalcOpen(true)}
                onSwitchToPos={() => setIsPosMode(true)}
                isBangla={isBangla}
                salesCount={transactions.filter((t) => t.type === 'Sale').length}
                expensesCount={transactions.filter((t) => t.type === 'Expense').length}
                partiesCount={parties.length}
                inventoryCount={inventoryLCs.length}
              />

              {/* Module Switcher */}
              {activeModule === 'Dashboard' && (
                <>
                  {/* Live Bank & Cash Ledger Widget */}
                  <BankLedgerWidget
                    accounts={accounts}
                    transactions={transactions}
                    drawings={drawings}
                    onOpenTransfer={() => handleOpenTransaction('Fund Transfer')}
                    onAddAccount={handleAddAccount}
                    onEditAccount={handleEditAccount}
                    onDeleteAccount={handleDeleteAccount}
                    isBangla={isBangla}
                  />

                  {/* Outstanding Dues Overview & Monthly Financial Trends Charts */}
                  <DashboardCharts
                    parties={parties}
                    transactions={transactions}
                    isBangla={isBangla}
                    onSelectPartyModule={() => setActiveModule('Parties')}
                  />

                  {/* Partner Profit TOTAL HISAB Dashboard */}
                  <TotalHisabDashboard
                    transactions={transactions}
                    drawings={drawings}
                    partners={partners}
                    onAddDrawing={handleAddDrawing}
                    onDeleteDrawing={handleDeleteDrawing}
                    onAddPartner={handleAddPartner}
                    onEditPartner={handleEditPartner}
                    onDeletePartner={handleDeletePartner}
                    isBangla={isBangla}
                  />

                  {/* Recent Transactions List */}
                  <TransactionListView
                    transactions={transactions}
                    onOpenNewTransaction={handleOpenTransaction}
                    onEditTransaction={handleStartEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onPrintChallan={(tx) => setSelectedChallanTx(tx)}
                    isBangla={isBangla}
                    selectedFilterType="All"
                  />
                </>
              )}

              {activeModule === 'Sale' && (
                <TransactionListView
                  transactions={transactions}
                  onOpenNewTransaction={handleOpenTransaction}
                  onEditTransaction={handleStartEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onPrintChallan={(tx) => setSelectedChallanTx(tx)}
                  isBangla={isBangla}
                  selectedFilterType="Sale"
                />
              )}

              {activeModule === 'Purchase' && (
                <TransactionListView
                  transactions={transactions}
                  onOpenNewTransaction={handleOpenTransaction}
                  onEditTransaction={handleStartEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onPrintChallan={(tx) => setSelectedChallanTx(tx)}
                  isBangla={isBangla}
                  selectedFilterType="Purchase"
                />
              )}

              {activeModule === 'Expense' && (
                <TransactionListView
                  transactions={transactions}
                  onOpenNewTransaction={handleOpenTransaction}
                  onEditTransaction={handleStartEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onPrintChallan={(tx) => setSelectedChallanTx(tx)}
                  isBangla={isBangla}
                  selectedFilterType="Expense"
                />
              )}

              {activeModule === 'Total Hisab' && (
                <TotalHisabDashboard
                  transactions={transactions}
                  drawings={drawings}
                  partners={partners}
                  onAddDrawing={handleAddDrawing}
                  onDeleteDrawing={handleDeleteDrawing}
                  onAddPartner={handleAddPartner}
                  onEditPartner={handleEditPartner}
                  onDeletePartner={handleDeletePartner}
                  isBangla={isBangla}
                />
              )}

              {activeModule === 'Bank Ledger' && (
                <BankLedgerWidget
                  accounts={accounts}
                  transactions={transactions}
                  drawings={drawings}
                  onOpenTransfer={() => handleOpenTransaction('Fund Transfer')}
                  onAddAccount={handleAddAccount}
                  onEditAccount={handleEditAccount}
                  onDeleteAccount={handleDeleteAccount}
                  isBangla={isBangla}
                />
              )}

              {activeModule === 'Payment' && (
                <>
                  <BankLedgerWidget
                    accounts={accounts}
                    transactions={transactions}
                    drawings={drawings}
                    onOpenTransfer={() => handleOpenTransaction('Fund Transfer')}
                    onAddAccount={handleAddAccount}
                    onEditAccount={handleEditAccount}
                    onDeleteAccount={handleDeleteAccount}
                    isBangla={isBangla}
                  />
                  <TransactionListView
                    transactions={transactions}
                    onOpenNewTransaction={handleOpenTransaction}
                    onEditTransaction={handleStartEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onPrintChallan={(tx) => setSelectedChallanTx(tx)}
                    isBangla={isBangla}
                    selectedFilterType="Payment"
                  />
                </>
              )}

              {activeModule === 'Inventory' && (
                <InventoryLCView
                  inventoryLCs={inventoryLCs}
                  onAddLC={handleAddLC}
                  onEditLC={handleEditInventoryLC}
                  onDeleteLC={handleDeleteInventoryLC}
                  isBangla={isBangla}
                />
              )}

              {activeModule === 'Parties' && (
                <PartiesView
                  parties={parties}
                  transactions={transactions}
                  onAddParty={handleAddParty}
                  onEditParty={handleEditParty}
                  onDeleteParty={handleDeleteParty}
                  onEditTransaction={handleStartEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  isBangla={isBangla}
                />
              )}

              {activeModule === 'Products' && (
                <ProductsView
                  products={products}
                  onAddProduct={handleAddProduct}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onSelectProductForSale={(name, rate) => {
                    handleOpenTransaction('Sale');
                  }}
                  isBangla={isBangla}
                />
              )}

              {(activeModule === 'Fund Transfer' ||
                activeModule === 'Journal' ||
                activeModule === 'Sale Order' ||
                activeModule === 'Purchase Order' ||
                activeModule === 'Quotation' ||
                activeModule === 'Receipts') && (
                <TransactionListView
                  transactions={transactions}
                  onOpenNewTransaction={handleOpenTransaction}
                  onEditTransaction={handleStartEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onPrintChallan={(tx) => setSelectedChallanTx(tx)}
                  isBangla={isBangla}
                  selectedFilterType={
                    activeModule === 'Receipts'
                      ? 'Receipt'
                      : (activeModule as any)
                  }
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Transaction Entry & Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        type={txModalType}
        onSave={handleSaveTransaction}
        onUpdate={handleUpdateTransaction}
        editingTransaction={editingTransaction}
        accounts={accounts}
        parties={parties}
        inventoryLCs={inventoryLCs}
        isBangla={isBangla}
      />

      {/* Settings Modal (Google Sheets API Config & Script Copy & Company Profile) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={syncConfig}
        onSaveConfig={handleSaveConfig}
        onTestSync={handleTestSync}
        isTesting={isTestingSync}
        onResetData={handleResetData}
        companyProfile={companyProfile}
        onSaveCompanyProfile={handleSaveCompanyProfile}
        isBangla={isBangla}
      />

      {/* Printable Challan Modal */}
      <ChallanModal
        transaction={selectedChallanTx}
        onClose={() => setSelectedChallanTx(null)}
        companyProfile={companyProfile}
        isBangla={isBangla}
      />

      {/* Standalone Multi-Metal Weight Calculator Modal */}
      <MetalWeightCalculatorModal
        isOpen={isStandaloneMetalCalcOpen}
        onClose={() => setIsStandaloneMetalCalcOpen(false)}
        onApplyWeight={(calculatedWeight) => {
          setIsStandaloneMetalCalcOpen(false);
          handleOpenTransaction('Sale');
        }}
        isBangla={isBangla}
      />
    </div>
  );
}
