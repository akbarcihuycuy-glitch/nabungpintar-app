import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Category, Transaction, SavingsGoal } from '../types/database';
import { formatCurrency } from '../utils/formatters';

interface GeneratePdfReportParams {
  monthLabel: string;
  userFullName: string;
  userEmail?: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRatio: number | null;
  healthScore?: number;
  categories: Category[];
  monthTransactions: Transaction[];
  goals: SavingsGoal[];
}

export function generateFinancialReportPdf({
  monthLabel,
  userFullName,
  userEmail,
  totalIncome,
  totalExpense,
  netSavings,
  savingsRatio,
  healthScore = 75,
  categories,
  monthTransactions,
  goals,
}: GeneratePdfReportParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const printDate = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'short',
  }) + ' WIB';

  // 1. Header Banner & Branding
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line
  doc.setFillColor(45, 212, 167); // Mint Primary
  doc.rect(0, 36, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);\n  doc.setTextColor(255, 255, 255);
  doc.text('NabungPintar', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('LAPORAN FINANSIAL & EVALUASI ANGGARAN BULANAN', 14, 22);
  doc.text(`Periode: ${monthLabel}`, 14, 27);

  // User details on right side
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(userFullName || 'Pengguna NabungPintar', pageWidth - 14, 16, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  if (userEmail) {
    doc.text(userEmail, pageWidth - 14, 21, { align: 'right' });
  }
  doc.text(`Dicetak: ${printDate}`, pageWidth - 14, 27, { align: 'right' });

  // 2. Section 1: Ringkasan Eksekutif (Cards / Mini Table)
  let currentY = 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ringkasan Eksekutif Keuangan', 14, currentY);

  currentY += 4;

  const summaryData = [
    ['Total Pemasukan', formatCurrency(totalIncome), 'Rasio Menabung', savingsRatio !== null ? `${savingsRatio}%` : '-'],
    ['Total Pengeluaran', formatCurrency(totalExpense), 'Skor Kesehatan', `${healthScore} / 100`],
    ['Arus Kas Bersih', formatCurrency(netSavings), 'Status Arus Kas', netSavings >= 0 ? 'Surplus (Sehat)' : 'Defisit (Perhatian)'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: summaryData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 45 },
      1: { fontStyle: 'bold', cellWidth: 45, textColor: [15, 118, 110] },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 45 },
      3: { fontStyle: 'bold', cellWidth: 45 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Section 2: Anggaran & Realisasi Kategori
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Anggaran & Realisasi Belanja per Kategori', 14, currentY);

  currentY += 4;

  // Calculate expenses per category
  const expenseMap: Record<string, number> = {};
  for (const t of monthTransactions) {
    if (t.kind === 'expense' && t.category_id) {
      expenseMap[t.category_id] = (expenseMap[t.category_id] || 0) + t.amount_base;
    }
  }

  const categoryTableData = categories
    .filter((c) => c.kind === 'expense')
    .map((c) => {
      const spent = expenseMap[c.id] || 0;
      const budget = c.monthly_budget || 0;
      let pctStr = '-';
      let statusStr = 'Normal';

      if (budget > 0) {
        const pct = Math.round((spent / budget) * 100);
        pctStr = `${pct}%`;
        if (pct >= 100) statusStr = 'Lewat Batas!';
        else if (pct >= 75) statusStr = 'Hampir Penuh';
        else statusStr = 'Aman';
      }

      return [
        c.name,
        budget > 0 ? formatCurrency(budget) : 'Tanpa Batas',
        formatCurrency(spent),
        pctStr,
        statusStr,
      ];
    });

  if (categoryTableData.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Kategori Pengeluaran', 'Batas Anggaran', 'Realisasi Belanja', '% Terpakai', 'Status']],
      body: categoryTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.8,
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'Lewat Batas!') {
            data.cell.styles.textColor = [220, 38, 38]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'Hampir Penuh') {
            data.cell.styles.textColor = [217, 119, 6]; // Amber
          } else if (data.cell.raw === 'Aman') {
            data.cell.styles.textColor = [5, 150, 105]; // Green
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 4. Section 3: Progres Target Tabungan
  if (goals.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Pos Celengan & Target Tabungan', 14, currentY);

    currentY += 4;

    const goalsTableData = goals.map((g) => {
      const cur = g.current_amount || 0;
      const pct = g.target_amount > 0 ? Math.min(100, Math.round((cur / g.target_amount) * 100)) : 0;
      return [
        g.name,
        formatCurrency(g.target_amount),
        formatCurrency(cur),
        `${pct}%`,
        g.deadline || 'Bebas',
        pct >= 100 ? 'Tercapai 🏆' : 'Aktif',
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Nama Celengan', 'Target (Rp)', 'Terkumpul (Rp)', 'Capaian', 'Tenggat', 'Status']],
      body: goalsTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 118, 110], // Teal
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.8,
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. Section 4: Rincian Transaksi Bulan Ini
  if (monthTransactions.length > 0) {
    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`4. Rincian Mutasi Transaksi (${monthTransactions.length} Data)`, 14, currentY);

    currentY += 4;

    const txTableData = monthTransactions.map((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return [
        t.occurred_on,
        t.kind === 'income' ? 'Pemasukan' : 'Pengeluaran',
        cat?.name || 'Lainnya',
        t.note || '-',
        formatCurrency(t.amount_base),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal (Rp)']],
      body: txTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      columnStyles: {
        4: { fontStyle: 'bold', halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw === 'Pemasukan') {
            data.cell.styles.textColor = [5, 150, 105];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
  }

  // 6. Page Numbers & Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Finansial Pribadi NabungPintar • Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const cleanFilename = `Laporan_Keuangan_NabungPintar_${monthLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(cleanFilename);
}
