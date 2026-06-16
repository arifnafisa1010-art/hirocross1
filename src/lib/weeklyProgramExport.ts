import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { DaySession, PlanWeek } from '@/types/training';

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
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const dateLabel = date ? ` — ${format(date, 'd MMM yyyy', { locale: idLocale })}` : '';
    doc.text(`${day}${dateLabel}`, margin + 2, y + 1.5);
    if (marker) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`[${marker}]`, pageW - margin - 2, y + 1.5, { align: 'right' });
    }
    y += 7;

    if (sessions.length === 0) {
      writeWrapped('Istirahat / tidak ada sesi.', margin + 2, { size: 9 });
      y += 2;
      return;
    }

    sessions.forEach(({ number, session }) => {
      writeWrapped(
        `Sesi ${number} — Intensitas: ${INTENSITY_LABELS[session.int] || session.int}${session.duration ? ` • Durasi ${session.duration} mnt` : ''}${session.rpe ? ` • RPE ${session.rpe}` : ''}${session.isDone ? ' • SELESAI' : ''}`,
        margin + 2,
        { size: 10, bold: true }
      );

      if (session.warmup) {
        writeWrapped(`Pemanasan: ${session.warmup}`, margin + 4, { size: 9 });
      }

      if (session.exercises && session.exercises.length > 0) {
        writeWrapped('Latihan:', margin + 4, { size: 9, bold: true });
        session.exercises.forEach((ex, i) => {
          const cat = CATEGORY_LABELS[ex.cat] || ex.cat;
          writeWrapped(
            `  ${i + 1}. ${ex.name} — ${cat} • ${ex.set} set × ${ex.rep} rep${ex.load ? ` @ ${ex.load} kg/unit` : ''}`,
            margin + 4,
            { size: 9 }
          );
        });
      }

      if (session.cooldown) {
        writeWrapped(`Pendinginan: ${session.cooldown}`, margin + 4, { size: 9 });
      }
      if (session.recovery) {
        writeWrapped(`Recovery: ${session.recovery}`, margin + 4, { size: 9 });
      }
      y += 1.5;
    });
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
