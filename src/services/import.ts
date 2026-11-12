import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Transaction, TransactionKind, Category } from '../types/database';

export interface RawRowData {
  [columnName: string]: string | number | undefined;
}

export interface ColumnMapping {
  dateCol: string;
  descriptionCol?: string;
  amountMode: 'split' | 'single'; // split: debit + credit, single: one amount column
  debitCol?: string; // pengeluaran
  creditCol?: string; // pemasukan
  amountCol?: string; // single nominal
  typeCol?: string; // optional: indicator of income/expense in single amount mode
  categoryCol?: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
}

export interface ParsedImportRow {
  index: number;
  occurred_on: string;
  note: string;
  amount_original: number;
  kind: TransactionKind;
  category_id: string | null;
  category_name?: string;
  import_hash: string;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
  rawData: RawRowData;
}

export const IMPORT_MAPPING_STORAGE_KEY = 'np_import_mapping';

/**
 * SHA-256 Hash generator for duplicate detection (PRD 4.5)
 * import_hash = sha256(user_id + tanggal + nominal + keterangan_normal + index_hari)
 */
export async function generateImportHash(
  userId: string,
  tanggal: string,
  nominal: number,
  keterangan: string,
  indexHari: number = 0
): Promise<string> {
  const normNote = keterangan.trim().toLowerCase().replace(/\s+/g, ' ');
  const payload = `${userId}_${tanggal}_${Math.round(nominal)}_${normNote}_${indexHari}`;

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}\n
  // Simple string fallback hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash-${Math.abs(hash)}-${Date.now()}`;
}

/**
 * Parse CSV or Excel file into array of column headers and row objects
 */
export async function parseFileToRawRows(file: File): Promise<{
  headers: string[];
  rows: RawRowData[];
  fileName: string;
  rowCount: number;
}> {
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  if (isCsv) {
    return new Promise((resolve, reject) => {
      Papa.parse<RawRowData>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data.filter((r) => Object.values(r).some((v) => v !== '' && v !== undefined));
          resolve({
            headers,
            rows,
            fileName: file.name,
            rowCount: rows.length,
          });
        },
        error: (err) => reject(new Error(err.message)),
      });
    });
  }

  // Handle Excel (.xlsx, .xls)
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<RawRowData>(worksheet, { defval: '' });

  const headers: string[] = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
  return {
    headers,
    rows: jsonData,
    fileName: file.name,
    rowCount: jsonData.length,
  };
}

/**
 * Parse a raw date string into standard ISO format (YYYY-MM-DD)
 */
export function parseDateString(raw: string, format: 'DD/MM/YYYY' | 'YYYY-MM-DD'): string | null {
  if (!raw) return null;
  const str = String(raw).trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (format === 'DD/MM/YYYY') {
    // Matches DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const parts = str.split(/[/.-]/);
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
        return `${y}-${m}-${d}`;
      }
    }
  } else if (format === 'YYYY-MM-DD') {
    const parts = str.split(/[/.-]/);
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Fallback try standard JS Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Clean and parse nominal currency string like "Rp 1.500.000,00" or "-150000" into positive number
 */
export function cleanNominal(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === '') return 0;
  if (typeof raw === 'number') return Math.abs(raw);

  let str = String(raw).trim();
  // Remove "Rp", "IDR", dots/commas as thousand separators
  str = str.replace(/[^\d.,-]/g, '');

  // Handle Indonesian thousand separator (1.500.000,00) vs Western (1,500,000.00)
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // 1.500.000,50 -> 1500000.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,500,000.50 -> 1500000.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Could be 1.500.000 (thousand) or 15.50 (decimal)
    const dotParts = str.split('.');
    if (dotParts.length > 2 || (dotParts.length === 2 && dotParts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    const commaParts = str.split(',');
    if (commaParts.length > 2 || (commaParts.length === 2 && commaParts[1].length === 3)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Process raw rows into standardized ParsedImportRow objects with duplicate detection
 */
export async function processImportRows(
  rows: RawRowData[],
  mapping: ColumnMapping,
  existingTransactions: Transaction[],
  categories: Category[],
  userId: string = 'local_user'
): Promise<ParsedImportRow[]> {
  const result: ParsedImportRow[] = [];
  const existingHashSet = new Set(existingTransactions.map((t) => t.import_hash).filter(Boolean));
  const batchHashSet = new Set<string>();

  const catNameMap = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c]));

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rawDate = raw[mapping.dateCol];
    const parsedDate = parseDateString(String(rawDate || ''), mapping.dateFormat);

    const rawNote = mapping.descriptionCol ? String(raw[mapping.descriptionCol] || '') : 'Mutasi Impor';
    const note = rawNote.trim() || 'Mutasi Impor';

    let amount = 0;
    let kind: TransactionKind = 'expense';
    let isRowError = false;
    let errorMessage: string | undefined = undefined;

    if (!parsedDate) {
      isRowError = true;
      errorMessage = 'Format tanggal tidak valid';
    }

    if (mapping.amountMode === 'split') {
      const debitRaw = mapping.debitCol ? raw[mapping.debitCol] : 0;
      const creditRaw = mapping.creditCol ? raw[mapping.creditCol] : 0;
      const debitNum = cleanNominal(debitRaw);
      const creditNum = cleanNominal(creditRaw);

      if (creditNum > 0) {
        kind = 'income';
        amount = creditNum;
      } else if (debitNum > 0) {
        kind = 'expense';
        amount = debitNum;
      } else {
        isRowError = true;
        errorMessage = 'Nominal debit/kredit kosong';
      }
    } else {
      // Single amount column
      const amtRaw = mapping.amountCol ? raw[mapping.amountCol] : 0;
      amount = cleanNominal(amtRaw);

      if (amount <= 0) {
        isRowError = true;
        errorMessage = 'Nominal harus lebih dari 0';
      }

      // Check type column if present, or sign
      if (mapping.typeCol && raw[mapping.typeCol]) {
        const typeStr = String(raw[mapping.typeCol]).toLowerCase();
        if (typeStr.includes('cr') || typeStr.includes('in') || typeStr.includes('masuk')) {
          kind = 'income';
        } else {
          kind = 'expense';
        }
      } else {
        // If string had minus sign
        const rawStr = String(amtRaw);
        if (rawStr.includes('-') || rawStr.includes('DR')) {
          kind = 'expense';
        } else {
          kind = 'income';
        }
      }
    }

    // Match category
    let matchedCategoryId: string | null = null;
    let matchedCategoryName: string | undefined = undefined;
    if (mapping.categoryCol && raw[mapping.categoryCol]) {
      const catInput = String(raw[mapping.categoryCol]).toLowerCase().trim();
      const matched = catNameMap.get(catInput);
      if (matched) {
        matchedCategoryId = matched.id;
        matchedCategoryName = matched.name;
      }
    }

    // Generate SHA-256 Hash
    const hash = await generateImportHash(userId, parsedDate || '1970-01-01', amount, note, i);

    let status: 'valid' | 'duplicate' | 'error' = 'valid';
    if (isRowError) {
      status = 'error';
    } else if (existingHashSet.has(hash) || batchHashSet.has(hash)) {
      status = 'duplicate';
      errorMessage = 'Duplikat dengan transaksi tersimpan';
    } else {
      batchHashSet.add(hash);
    }

    result.push({
      index: i + 1,
      occurred_on: parsedDate || '1970-01-01',
      note,
      amount_original: amount,
      kind,
      category_id: matchedCategoryId,
      category_name: matchedCategoryName,
      import_hash: hash,
      status,
      errorMessage,
      rawData: raw,
    });
  }

  return result;
}

/**
 * Generate a downloadable sample CSV template for the user
 */
export function downloadSampleCsv(): void {
  const sampleData = [
    {
      Tanggal: '28/10/2024',
      Keterangan: 'Gaji Bulanan',
      Debit: '',
      Kredit: '15000000',
      Kategori: 'Gaji',
    },
    {
      Tanggal: '29/10/2024',
      Keterangan: 'Supermarket Belanja Mingguan',
      Debit: '450000',
      Kredit: '',
      Kategori: 'Belanja',
    },
    {
      Tanggal: '30/10/2024',
      Keterangan: 'Kopi & Makan Siang',
      Debit: '75000',
      Kredit: '',
      Kategori: 'Makanan',
    },
    {
      Tanggal: '31/10/2024',
      Keterangan: 'Tagihan Listrik PLN',
      Debit: '320000',
      Kredit: '',
      Kategori: 'Tagihan',
    },
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contoh_mutasi_nabungpintar.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
