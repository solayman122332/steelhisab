import {
  BankAccount,
  GoogleSheetsConfig,
  InventoryLC,
  Party,
  PartnerDrawing,
  TotalHisabSummary,
  Transaction,
} from '../types';

const STORAGE_KEYS = {
  CONFIG: 'steelhisab_sheets_config_v1',
  TRANSACTIONS: 'steelhisab_transactions_v1',
  PARTIES: 'steelhisab_parties_v1',
  ACCOUNTS: 'steelhisab_accounts_v1',
  INVENTORY_LC: 'steelhisab_inventory_lc_v1',
  PARTNER_DRAWINGS: 'steelhisab_partner_drawings_v1',
  LAST_SYNC: 'steelhisab_last_sync_v1',
};

export const DEFAULT_CONFIG: GoogleSheetsConfig = {
  webAppUrl: '',
  spreadsheetId: '',
  apiKey: '',
  sheetTabs: {
    transactions: 'Transactions',
    parties: 'Parties',
    accounts: 'Accounts',
    inventoryLc: 'Inventory_LC',
    partnerDrawings: 'Partner_Drawings',
    totalHisab: 'TOTAL_HISAB',
  },
  isAutoSync: true,
};

export class GoogleSheetsService {
  static getConfig(): GoogleSheetsConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse config from localStorage', e);
    }
    return DEFAULT_CONFIG;
  }

  static saveConfig(config: GoogleSheetsConfig): void {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  /**
   * Append a single row or update an entity to Google Sheet
   * CRITICAL: Uses 'text/plain;charset=utf-8' so browsers do NOT trigger CORS preflight (OPTIONS request),
   * which Google Apps Script Web App redirects would otherwise block!
   */
  static async appendRowToSheet(
    tabName: string,
    rowObject: Record<string, any>
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return {
        success: true,
        message: 'Saved locally. Google Sheet URL not yet configured.',
      };
    }

    try {
      const payload = {
        action: 'appendRow',
        tabName,
        data: rowObject,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, message: `Successfully appended to ${tabName}` };
      } else {
        return {
          success: false,
          message: `Sheet responded with status: ${response.status}`,
        };
      }
    } catch (error: any) {
      console.error('Error appending row to Google Sheet:', error);
      return {
        success: false,
        message: error?.message || 'Network error syncing to Google Sheet',
      };
    }
  }

  /**
   * Dedicated Google Sheet sync for Account Add, Edit, and Delete
   * Sends POST request with text/plain;charset=utf-8 to bypass CORS
   */
  static async syncAccountAction(
    action: 'add' | 'edit' | 'delete',
    account: Partial<BankAccount> & { id: string }
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return {
        success: true,
        message: 'Account saved locally. Google Sheet URL not yet configured.',
      };
    }

    try {
      const payload = {
        action, // "add" | "edit" | "delete"
        tab: 'Accounts',
        tabName: 'Accounts',
        Account_ID: account.id,
        data: account,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, message: `Account ${action}ed in Google Sheet` };
      } else {
        return {
          success: false,
          message: `Sheet returned status ${response.status}`,
        };
      }
    } catch (error: any) {
      console.error(`Error syncing account ${action}:`, error);
      return {
        success: false,
        message: error?.message || `Network error syncing account ${action}`,
      };
    }
  }

  /**
   * Dedicated Google Sheet sync for Transaction Edit and Delete
   * Sends POST request with text/plain;charset=utf-8 to bypass CORS
   */
  static async syncTransactionAction(
    action: 'edit' | 'delete',
    transaction: Partial<Transaction> & { id: string }
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.webAppUrl) {
      return {
        success: true,
        message: 'Transaction saved locally. Google Sheet URL not yet configured.',
      };
    }

    try {
      const payload = {
        action, // "edit" | "delete"
        tab: 'Transactions',
        tabName: 'Transactions',
        Tx_ID: transaction.id,
        data: transaction,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, message: `Transaction ${action}ed in Google Sheet` };
      } else {
        return {
          success: false,
          message: `Sheet returned status ${response.status}`,
        };
      }
    } catch (error: any) {
      console.error(`Error syncing transaction ${action}:`, error);
      return {
        success: false,
        message: error?.message || `Network error syncing transaction ${action}`,
      };
    }
  }

  /**
   * Sync and fetch all 6 sheets: Transactions, Parties, Accounts, Inventory_LC, Partner_Drawings, TOTAL_HISAB
   */
  static async fetchAllData(): Promise<{
    success: boolean;
    data?: {
      transactions?: Transaction[];
      parties?: Party[];
      accounts?: BankAccount[];
      inventoryLc?: InventoryLC[];
      partnerDrawings?: PartnerDrawing[];
      totalHisab?: any;
    };
    error?: string;
  }> {
    const config = this.getConfig();
    if (!config.webAppUrl && !config.spreadsheetId) {
      return {
        success: false,
        error: 'No Google Apps Script URL or Spreadsheet ID configured.',
      };
    }

    // Try Google Apps Script Web App URL first (GET request)
    if (config.webAppUrl) {
      try {
        const url = new URL(config.webAppUrl);
        url.searchParams.set('action', 'getAllData');
        url.searchParams.set('t', Date.now().toString());

        const res = await fetch(url.toString(), {
          method: 'GET',
        });

        if (res.ok) {
          const json = await res.json();
          return { success: true, data: json };
        }
      } catch (err: any) {
        console.warn('Google Apps Script fetch error:', err);
      }
    }

    // Fallback: Google Sheets REST API v4 if apiKey and spreadsheetId are present
    if (config.spreadsheetId && config.apiKey) {
      try {
        const ranges = [
          'Transactions!A2:Z1000',
          'Parties!A2:Z500',
          'Accounts!A2:Z100',
          'Inventory_LC!A2:Z500',
          'Partner_Drawings!A2:Z500',
        ];
        const rangesParam = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values:batchGet?${rangesParam}&key=${config.apiKey}`;
        
        const res = await fetch(apiUrl);
        if (res.ok) {
          const result = await res.json();
          return {
            success: true,
            data: this.parseSheetsV4Response(result.valueRanges),
          };
        }
      } catch (e: any) {
        return { success: false, error: e?.message || 'Sheets v4 fetch failed' };
      }
    }

    return {
      success: false,
      error: 'Unable to connect to Google Sheets with provided credentials.',
    };
  }

  /**
   * Helper to parse raw Google Sheets v4 table rows into typed entities
   */
  private static parseSheetsV4Response(valueRanges: any[]): any {
    const parsed: any = {};
    if (!valueRanges) return parsed;

    // Transactions
    if (valueRanges[0]?.values) {
      parsed.transactions = valueRanges[0].values.map((row: any[], i: number) => ({
        id: row[0] || `tx-${i}`,
        date: row[1] || new Date().toISOString().split('T')[0],
        type: row[2] || 'Sale',
        party: row[3] || 'General Party',
        lcNo: row[4] || '',
        weightKg: parseFloat(row[5]) || 0,
        scaleWeightKg: parseFloat(row[6]) || 0,
        rateBdt: parseFloat(row[7]) || 0,
        lessBdt: parseFloat(row[8]) || 0,
        totalBdt: parseFloat(row[9]) || 0,
        costBdt: parseFloat(row[10]) || 0,
        profitBdt: parseFloat(row[11]) || 0,
        account: row[12] || 'Cash',
        note: row[13] || '',
        refNo: row[14] || '',
        truckNo: row[15] || '',
        coilNo: row[16] || '',
        status: row[17] || 'Completed',
        createdAt: row[18] || new Date().toISOString(),
      }));
    }

    // Accounts
    if (valueRanges[2]?.values) {
      parsed.accounts = valueRanges[2].values.map((row: any[], i: number) => ({
        id: row[0] || `acc-${i}`,
        name: row[1] || `Account ${i}`,
        shortName: row[2] || row[1] || `Account ${i}`,
        accountNo: row[3] || '',
        holderName: row[4] || '',
        branch: row[5] || '',
        openingBalanceBdt: parseFloat(row[6]) || 0,
        balanceBdt: parseFloat(row[7]) || 0,
        type: (row[8] as any) || 'Bank',
      }));
    }

    return parsed;
  }

  /**
   * Generates complete, ready-to-paste Google Apps Script code for the user
   */
  static getAppsScriptTemplate(): string {
    return `/**
 * =========================================================================
 * SteelHisab - Google Apps Script Backend for Bangladeshi Steel Partnership
 * =========================================================================
 * INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Click 'Extensions' > 'Apps Script'
 * 3. Delete any default code, paste this entire file, and click 'Save' (Ctrl+S)
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Set:
 *    - Description: "SteelHisab Sync API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Required for cross-device web/mobile app sync)
 * 7. Click 'Deploy', authorize permissions, and copy the Web App URL into SteelHisab Settings!
 */

function setupSteelSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = {
    'Transactions': ['ID', 'Date', 'Type', 'Party', 'LC_No', 'Weight_KG', 'Scale_Weight_KG', 'Rate_BDT', 'Less_BDT', 'Total_BDT', 'Cost_BDT', 'Profit_BDT', 'Account', 'Note', 'Ref_No', 'Truck_No', 'Coil_No', 'Status', 'Timestamp'],
    'Parties': ['ID', 'Name', 'Type', 'Phone', 'Address', 'Credit_Limit', 'Balance_BDT', 'Last_Active'],
    'Accounts': ['ID', 'Name', 'Short_Name', 'Account_No', 'Holder_Name', 'Branch', 'Opening_Balance_BDT', 'Balance_BDT', 'Type'],
    'Inventory_LC': ['ID', 'LC_No', 'Description', 'Grade', 'Coil_Weight_KG', 'Scale_Copy_KG', 'Shortage_KG', 'Landed_Cost_Per_KG', 'Total_Cost_BDT', 'Sold_KG', 'Remaining_KG', 'Status', 'Arrived_Date'],
    'Partner_Drawings': ['ID', 'Partner_Name', 'Date', 'Amount_BDT', 'Account', 'Note', 'Ref_Voucher'],
    'TOTAL_HISAB': ['Metric', 'Value_BDT', 'Note', 'Updated_At']
  };

  for (var name in tabs) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(tabs[name]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, tabs[name].length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    }
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ADD / APPEND ROW
    if (action === 'appendRow' || action === 'add') {
      var tabName = payload.tabName || payload.tab;
      var data = payload.data;
      var sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        setupSteelSheets();
        sheet = ss.getSheetByName(tabName);
      }

      var rowValues = [];
      if (tabName === 'Accounts') {
        rowValues = [
          data.id || payload.Account_ID || Utilities.getUuid(),
          data.name || '',
          data.shortName || data.name || '',
          data.accountNo || '',
          data.holderName || '',
          data.branch || '',
          data.openingBalanceBdt || 0,
          data.balanceBdt || 0,
          data.type || 'Bank'
        ];
      } else if (tabName === 'Transactions') {
        rowValues = [
          data.id || Utilities.getUuid(),
          data.date || new Date().toISOString().split('T')[0],
          data.type || '',
          data.party || '',
          data.lcNo || '',
          data.weightKg || 0,
          data.scaleWeightKg || 0,
          data.rateBdt || 0,
          data.lessBdt || 0,
          data.totalBdt || 0,
          data.costBdt || 0,
          data.profitBdt || 0,
          data.account || '',
          data.note || '',
          data.refNo || '',
          data.truckNo || '',
          data.coilNo || '',
          data.status || 'Completed',
          new Date().toISOString()
        ];
      } else if (tabName === 'Partner_Drawings') {
        rowValues = [
          data.id || Utilities.getUuid(),
          data.partnerName || '',
          data.date || new Date().toISOString().split('T')[0],
          data.amountBdt || 0,
          data.account || '',
          data.note || '',
          data.refVoucher || ''
        ];
      } else if (tabName === 'Inventory_LC') {
        rowValues = [
          data.id || Utilities.getUuid(),
          data.lcNo || '',
          data.description || '',
          data.grade || '',
          data.coilWeightKg || 0,
          data.scaleCopyWeightKg || 0,
          data.shortageKg || 0,
          data.landedCostBdtPerKg || 0,
          data.totalCostBdt || 0,
          data.soldWeightKg || 0,
          data.remainingWeightKg || 0,
          data.status || 'In Stock',
          data.arrivedDate || ''
        ];
      } else {
        rowValues = Object.keys(data).map(function(k) { return data[k]; });
      }

      sheet.appendRow(rowValues);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Added to " + tabName }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. EDIT (Accounts or Transactions)
    if (action === 'edit') {
      var tabName = payload.tab || payload.tabName;
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var entityId = payload.Tx_ID || payload.Account_ID || (payload.data && payload.data.id);
        var data = payload.data;
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] == entityId) {
            var rowIndex = i + 1;
            if (tabName === 'Accounts') {
              sheet.getRange(rowIndex, 2).setValue(data.name || values[i][1]);
              sheet.getRange(rowIndex, 3).setValue(data.shortName || data.name || values[i][2]);
              sheet.getRange(rowIndex, 4).setValue(data.accountNo || values[i][3]);
              sheet.getRange(rowIndex, 5).setValue(data.holderName || values[i][4]);
              sheet.getRange(rowIndex, 6).setValue(data.branch || values[i][5]);
              sheet.getRange(rowIndex, 7).setValue(data.openingBalanceBdt !== undefined ? data.openingBalanceBdt : values[i][6]);
              sheet.getRange(rowIndex, 8).setValue(data.balanceBdt !== undefined ? data.balanceBdt : values[i][7]);
              sheet.getRange(rowIndex, 9).setValue(data.type || values[i][8]);
            } else if (tabName === 'Transactions') {
              sheet.getRange(rowIndex, 2).setValue(data.date || values[i][1]);
              sheet.getRange(rowIndex, 3).setValue(data.type || values[i][2]);
              sheet.getRange(rowIndex, 4).setValue(data.party || values[i][3]);
              sheet.getRange(rowIndex, 5).setValue(data.lcNo !== undefined ? data.lcNo : values[i][4]);
              sheet.getRange(rowIndex, 6).setValue(data.weightKg !== undefined ? data.weightKg : values[i][5]);
              sheet.getRange(rowIndex, 7).setValue(data.scaleWeightKg !== undefined ? data.scaleWeightKg : values[i][6]);
              sheet.getRange(rowIndex, 8).setValue(data.rateBdt !== undefined ? data.rateBdt : values[i][7]);
              sheet.getRange(rowIndex, 9).setValue(data.lessBdt !== undefined ? data.lessBdt : values[i][8]);
              sheet.getRange(rowIndex, 10).setValue(data.totalBdt !== undefined ? data.totalBdt : values[i][9]);
              sheet.getRange(rowIndex, 11).setValue(data.costBdt !== undefined ? data.costBdt : values[i][10]);
              sheet.getRange(rowIndex, 12).setValue(data.profitBdt !== undefined ? data.profitBdt : values[i][11]);
              sheet.getRange(rowIndex, 13).setValue(data.account || values[i][12]);
              sheet.getRange(rowIndex, 14).setValue(data.note !== undefined ? data.note : values[i][13]);
              sheet.getRange(rowIndex, 15).setValue(data.refNo !== undefined ? data.refNo : values[i][14]);
              sheet.getRange(rowIndex, 16).setValue(data.truckNo !== undefined ? data.truckNo : values[i][15]);
              sheet.getRange(rowIndex, 17).setValue(data.coilNo !== undefined ? data.coilNo : values[i][16]);
            }
            return ContentService.createTextOutput(JSON.stringify({ success: true, message: tabName + " record updated" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }

    // 3. DELETE (Accounts or Transactions)
    if (action === 'delete') {
      var tabName = payload.tab || payload.tabName;
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var entityId = payload.Tx_ID || payload.Account_ID || (payload.data && payload.data.id);
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] == entityId) {
            sheet.deleteRow(i + 1);
            return ContentService.createTextOutput(JSON.stringify({ success: true, message: tabName + " record deleted" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Record deleted or not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSteelSheets();

    var result = {
      transactions: getSheetObjects(ss.getSheetByName('Transactions')),
      parties: getSheetObjects(ss.getSheetByName('Parties')),
      accounts: getSheetObjects(ss.getSheetByName('Accounts')),
      inventoryLc: getSheetObjects(ss.getSheetByName('Inventory_LC')),
      partnerDrawings: getSheetObjects(ss.getSheetByName('Partner_Drawings')),
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}`;
  }
}
