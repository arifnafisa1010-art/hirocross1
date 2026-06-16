import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { DaySession, PlanWeek } from '@/types/training';
import { calculateSessionLoad } from '@/hooks/useTrainingLoads';

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Kekuatan',
  speed: 'Kecepatan',
  endurance: 'Daya Tahan',
  technique: 'Teknik',
  tactic: 'Taktik',
  power: 'Power',
  agility: 'Agility',
  flexibility: 'Fleksibilitas',
  balance: 'Keseimbangan',
  reaction: 'Reaksi',
};

const INTENSITY_LABELS: Record<string, string> = {
  Rest: 'Istirahat',
  Low: 'Rendah',
  Med: 'Sedang',
  High: 'Tinggi',
};

export interface WeeklyExportSession {
  number: number;
  session: DaySession;
}

export interface WeeklyExportDay {
  day: string;
  date: Date | null;
  sessions: WeeklyExportSession[];
  marker?: string | null;
}

export interface WeeklyExportParams {
  planName: string;
  weekNumber: number;
  weekData?: PlanWeek;
  days: WeeklyExportDay[];
  athleteNames?: string[];
}

export function exportWeeklyProgramPDF(params: WeeklyExportParams) {
  const { planName, weekNumber, weekData, days, athleteNames } = params;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, x: number, options: { size?: number; bold?: boolean; maxWidth?: number; lineHeight?: number } = {}) => {
    const size = options.size ?? 10;
    const bold = options.bold ?? false;
    const maxWidth = options.maxWidth ?? pageW - margin * 2;
    const lineHeight = options.lineHeight ?? size * 0.45;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  // Table helpers
  type TableCell = string | { text: string; bold?: boolean; align?: 'left' | 'center' | 'right' };

  const drawTable = (
    headers: string[],
    rows: TableCell[][],
    colWidths: number[],
    options: {
      x?: number;
      headerFill?: [number, number, number];
      headerTextColor?: [number, number, number];
      bodyFill?: [number, number, number];
      fontSize?: number;
      lineHeight?: number;
      padding?: number;
    } = {}
  ) => {
    const fontSize = options.fontSize ?? 9;
    const lineHeight = options.lineHeight ?? fontSize * 0.45;
    const padding = options.padding ?? 2;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const x = options.x ?? margin + (pageW - margin * 2 - totalWidth) / 2;
    const startY = y;

    const cellText = (cell: TableCell) => (typeof cell === 'string' ? cell : cell.text);
    const cellBold = (cell: TableCell) => (typeof cell === 'object' ? cell.bold : false);
    const cellAlign = (cell: TableCell) => (typeof cell === 'object' ? cell.align : 'left');

    const measureCellHeight = (cell: TableCell, width: number) => {
      doc.setFont('helvetica', cellBold(cell) ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const text = cellText(cell);
      const lines = doc.splitTextToSize(text, Math.max(1, width - padding * 2));
      return Math.max(lineHeight, lines.length * lineHeight) + padding * 2;
    };

    const rowHeights = rows.map(row =>
      Math.max(
        lineHeight + padding * 2,
        ...row.map((cell, i) => measureCellHeight(cell, colWidths[i]))
      )
    );
    const headerHeight = Math.max(
      lineHeight + padding * 2,
      ...headers.map((h, i) => measureCellHeight(h, colWidths[i]))
    );

    const tableHeight = headerHeight + rowHeights.reduce((a, b) => a + b, 0);
    ensureSpace(tableHeight + 1);

    let cx = x;
    // Header
    doc.setFillColor(...(options.headerFill ?? [15, 23, 42]));
    doc.setDrawColor(180, 180, 180);
    doc.rect(x, y, totalWidth, headerHeight, 'FD');
    doc.setTextColor(...(options.headerTextColor ?? [255, 255, 255]));
    headers.forEach((h, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(h, Math.max(1, colWidths[i] - padding * 2));
      const textY = y + headerHeight / 2 + (lines.length * lineHeight) / 2 - lineHeight / 2 + padding / 2;
      doc.text(lines, cx + padding, textY, { align: 'left' });
      cx += colWidths[i];
    });
    y += headerHeight;

    // Body rows
    rows.forEach((row, rowIdx) => {
      const rowHeight = rowHeights[rowIdx];
      cx = x;
      doc.setFillColor(...(options.bodyFill ?? (rowIdx % 2 === 0 ? [255, 255, 255] : [248, 250, 252])));
      doc.rect(x, y, totalWidth, rowHeight, 'FD');
      doc.setTextColor(0, 0, 0);
      row.forEach((cell, i) => {
        doc.setFont('helvetica', cellBold(cell) ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        const text = cellText(cell);
        const align = cellAlign(cell);
        const availW = Math.max(1, colWidths[i] - padding * 2);
        const lines = doc.splitTextToSize(text, availW);
        const textY = y + rowHeight / 2 + (lines.length * lineHeight) / 2 - lineHeight / 2 + padding / 2;
        const textX = align === 'center' ? cx + colWidths[i] / 2 : align === 'right' ? cx + colWidths[i] - padding : cx + padding;
        doc.text(lines, textX, textY, { align });
        cx += colWidths[i];
      });
      y += rowHeight;
    });

    // Outer border + vertical lines
    doc.setDrawColor(180, 180, 180);
    doc.rect(x, startY, totalWidth, tableHeight, 'S');
    cx = x;
    colWidths.slice(0, -1).forEach(w => {
      cx += w;
      doc.line(cx, startY, cx, startY + tableHeight);
    });

    y += 1.5;
  };

  // Header
  doc.setFillColor(15, 23, 42); // slate-950
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(planName || 'Program Latihan', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Program Mingguan - Minggu ${weekNumber}`, margin, 18);
  if (weekData) {
    doc.setFontSize(9);
    const meta = [
      weekData.meso,
      weekData.fase,
      `Vol ${weekData.vol}%`,
      `Int ${weekData.int}%`,
    ].filter(Boolean).join(' • ');
    doc.text(meta, margin, 23);
  }
  doc.setTextColor(0, 0, 0);
  y = 32;

  if (athleteNames && athleteNames.length > 0) {
    writeWrapped(`Atlet: ${athleteNames.join(', ')}`, margin, { size: 9 });
    y += 1;
  }

  // Weekly objectives
  if (weekData) {
    const goals: string[] = [];
    if (weekData.tujuanKekuatan) goals.push(`Kekuatan: ${weekData.tujuanKekuatan}`);
    if (weekData.tujuanKecepatan) goals.push(`Kecepatan: ${weekData.tujuanKecepatan}`);
    if (weekData.tujuanDayaTahan) goals.push(`Daya Tahan: ${weekData.tujuanDayaTahan}`);
    if (weekData.tujuanFleksibilitas) goals.push(`Fleksibilitas: ${weekData.tujuanFleksibilitas}`);
    if (weekData.tujuanMental) goals.push(`Mental: ${weekData.tujuanMental}`);
    if (goals.length > 0) {
      writeWrapped('Tujuan Minggu Ini', margin, { size: 11, bold: true });
      goals.forEach(g => writeWrapped(`• ${g}`, margin + 2, { size: 9 }));
      y += 2;
    }
  }

  // Per day
  days.forEach(({ day, date, sessions, marker }) => {
    ensureSpace(20);
    // Day header bar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const dateLabel = date ? ` — ${format(date, 'd MMM yyyy', { locale: idLocale })}` : '';
    doc.text(`${day}${dateLabel}`, margin + 2, y + 1.5);
    if (marker) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`[${marker}]`, pageW - margin - 2, y + 1.5, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0);
    y += 7;

    if (sessions.length === 0) {
      writeWrapped('Istirahat / tidak ada sesi.', margin + 2, { size: 9 });
      y += 2;
      return;
    }

    let dayDuration = 0;
    let dayLoad = 0;
    let dayRpeSum = 0;
    let dayRpeCount = 0;

    sessions.forEach(({ number, session }) => {
      const sessionLoad = session.rpe && session.duration ? calculateSessionLoad(session.duration, session.rpe) : undefined;
      const status = session.isDone ? 'Selesai' : 'Belum';
      const rpeText = session.rpe ? String(session.rpe) : '-';
      const durationText = session.duration ? `${session.duration} mnt` : '-';
      const loadText = sessionLoad !== undefined ? `${sessionLoad} AU` : '-';

      // Session summary table
      drawTable(
        ['Sesi', 'Intensitas', 'Durasi', 'RPE', 'Load', 'Status'],
        [
          [
            { text: `Sesi ${number}`, bold: true, align: 'center' },
            INTENSITY_LABELS[session.int] || session.int,
            { text: durationText, align: 'center' },
            { text: rpeText, align: 'center' },
            { text: loadText, align: 'center' },
            { text: status, align: 'center' },
          ],
        ],
        [22, 32, 30, 20, 28, 30],
        { fontSize: 9 }
      );

      if (session.rpe) {
        dayRpeSum += session.rpe;
        dayRpeCount += 1;
      }
      if (session.duration) dayDuration += session.duration;
      if (sessionLoad !== undefined) dayLoad += sessionLoad;

      if (session.warmup) {
        writeWrapped(`Pemanasan: ${session.warmup}`, margin + 2, { size: 9 });
      }

      if (session.exercises && session.exercises.length > 0) {
        const rows = session.exercises.map((ex, i) => {
          const cat = CATEGORY_LABELS[ex.cat] || ex.cat;
          return [
            { text: String(i + 1), align: 'center' as const },
            ex.name,
            cat,
            { text: String(ex.set), align: 'center' as const },
            { text: String(ex.rep), align: 'center' as const },
            { text: ex.load ? `${ex.load} kg/unit` : '-', align: 'center' as const },
          ];
        });
        drawTable(
          ['No', 'Latihan', 'Kategori', 'Set', 'Rep', 'Beban'],
          rows,
          [12, 70, 34, 20, 20, 26],
          { fontSize: 9, headerFill: [71, 85, 105], headerTextColor: [255, 255, 255] }
        );
      }

      if (session.cooldown) {
        writeWrapped(`Pendinginan: ${session.cooldown}`, margin + 2, { size: 9 });
      }
      if (session.recovery) {
        writeWrapped(`Recovery: ${session.recovery}`, margin + 2, { size: 9 });
      }
      y += 1;
    });

    // Day results summary
    if (dayRpeCount > 0 || dayDuration > 0 || dayLoad > 0) {
      const avgRpe = dayRpeCount > 0 ? (dayRpeSum / dayRpeCount).toFixed(1) : '-';
      const summaryText = `Hasil hari ini: Rata-rata RPE ${avgRpe}  •  Total Durasi ${dayDuration} mnt  •  Total Load ${dayLoad} AU`;
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225);
      const summaryW = pageW - margin * 2;
      doc.rect(margin, y, summaryW, 7, 'FD');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(summaryText, margin + 3, y + 4.5);
      doc.setTextColor(0, 0, 0);
      y += 9;
    }
    y += 2;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Dibuat: ${format(new Date(), 'd MMM yyyy HH:mm', { locale: idLocale })}  •  Halaman ${i}/${pageCount}`,
      pageW / 2,
      pageH - 6,
      { align: 'center' }
    );
  }

  const fileName = `${(planName || 'program').replace(/[^a-z0-9]+/gi, '_')}_W${weekNumber}.pdf`;
  doc.save(fileName);
}
