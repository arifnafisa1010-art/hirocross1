import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { DaySession, PlanWeek } from '@/types/training';
import { calculateSessionLoad } from '@/hooks/useTrainingLoads';

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Strength',
  speed: 'Speed',
  endurance: 'Endurance',
  technique: 'Technique',
  tactic: 'Tactic',
  power: 'Power',
  agility: 'Agility',
  flexibility: 'Flexibility',
  balance: 'Balance',
  reaction: 'Reaction',
  core: 'Core',
};

const INTENSITY_LABELS: Record<string, string> = {
  Rest: 'Istirahat',
  Low: 'Rendah',
  Med: 'Sedang',
  High: 'Tinggi',
};

const DAY_ORDER = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];

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
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();   // ~297
  const pageH = doc.internal.pageSize.getHeight();  // ~210
  const margin = 10;

  // Reorder days to Senin..Minggu
  const dayMap = new Map<string, WeeklyExportDay>();
  days.forEach((d) => dayMap.set(d.day.toUpperCase(), d));
  const orderedDays: (WeeklyExportDay & { label: string })[] = DAY_ORDER.map((label) => {
    const found = dayMap.get(label);
    return found ? { ...found, label } : { day: label, label, date: null, sessions: [], marker: null };
  });

  // ============ Header banner ============
  doc.setFillColor(15, 23, 42); // slate-950
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(planName || 'Program Latihan', margin, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Program Mingguan — Minggu ${weekNumber}`, margin, 15);
  if (weekData) {
    doc.setFontSize(8.5);
    const meta = [
      weekData.meso,
      weekData.fase,
      `Vol ${weekData.vol}%`,
      `Int ${weekData.int}%`,
    ].filter(Boolean).join(' • ');
    doc.text(meta, margin, 20);
  }
  if (athleteNames && athleteNames.length > 0) {
    doc.setFontSize(8.5);
    doc.text(`Atlet: ${athleteNames.join(', ')}`, pageW - margin, 15, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);

  let y = 28;

  // ============ Tujuan (compact line) ============
  if (weekData) {
    const goals: string[] = [];
    if (weekData.tujuanKekuatan) goals.push(`Kekuatan: ${weekData.tujuanKekuatan}`);
    if (weekData.tujuanKecepatan) goals.push(`Kecepatan: ${weekData.tujuanKecepatan}`);
    if (weekData.tujuanDayaTahan) goals.push(`Daya Tahan: ${weekData.tujuanDayaTahan}`);
    if (weekData.tujuanFleksibilitas) goals.push(`Fleksibilitas: ${weekData.tujuanFleksibilitas}`);
    if (weekData.tujuanMental) goals.push(`Mental: ${weekData.tujuanMental}`);
    if (goals.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Tujuan Minggu Ini:', margin, y);
      doc.setFont('helvetica', 'normal');
      const text = goals.join('  •  ');
      const lines = doc.splitTextToSize(text, pageW - margin * 2 - 32);
      doc.text(lines, margin + 32, y);
      y += Math.max(lines.length * 4, 4) + 2;
    }
  }

  // ============ Grid Layout ============
  const leftLabelW = 18;
  const totalGridW = pageW - margin * 2;
  const colW = (totalGridW - leftLabelW) / 7;

  const headerH = 7;          // day name
  const subHeaderH = 6;       // Target | Category
  const footRowH = 6;         // Durasi / RPE / TL each
  const totalFootH = footRowH * 3;
  const availForBody = pageH - margin - y - headerH - subHeaderH - totalFootH - 12; // 12 = footer + totalTL line
  const bodyH = Math.max(70, availForBody);

  const gridLeft = margin;
  const gridTop = y;
  const bodyTop = gridTop + headerH + subHeaderH;
  const footTop = bodyTop + bodyH;
  const gridBottom = footTop + totalFootH;
  const gridRight = gridLeft + totalGridW;

  // Day header cells
  doc.setDrawColor(120, 130, 145);
  doc.setLineWidth(0.2);
  doc.setFillColor(191, 219, 254); // light blue (blue-200)
  doc.rect(gridLeft, gridTop, totalGridW, headerH, 'FD');
  doc.setFillColor(226, 232, 240); // slate-200 for left empty
  doc.rect(gridLeft, gridTop, leftLabelW, headerH, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  orderedDays.forEach((d, i) => {
    const cx = gridLeft + leftLabelW + colW * i;
    doc.rect(cx, gridTop, colW, headerH, 'S');
    const dateLabel = d.date ? ` (${format(d.date, 'd/M', { locale: idLocale })})` : '';
    doc.text(`${d.label}${dateLabel}`, cx + colW / 2, gridTop + headerH / 2 + 1.2, { align: 'center' });
  });

  // Subheader: Target | Category (per day)
  doc.setFillColor(219, 234, 254); // blue-100
  doc.rect(gridLeft + leftLabelW, gridTop + headerH, totalGridW - leftLabelW, subHeaderH, 'FD');
  doc.setFillColor(226, 232, 240);
  doc.rect(gridLeft, gridTop + headerH, leftLabelW, subHeaderH, 'FD');

  doc.setFontSize(8);
  orderedDays.forEach((d, i) => {
    const cx = gridLeft + leftLabelW + colW * i;
    const subY = gridTop + headerH;
    doc.rect(cx, subY, colW, subHeaderH, 'S');
    if (d.sessions.length > 0) {
      // Split cell: left "Target", right category label
      const half = colW / 2;
      doc.line(cx + half, subY, cx + half, subY + subHeaderH);
      doc.setFont('helvetica', 'bold');
      doc.text('Target', cx + 1.5, subY + subHeaderH / 2 + 1);
      // Determine primary category from first session's first exercise
      const firstSession = d.sessions[0].session;
      let catLabel = INTENSITY_LABELS[firstSession.int] || firstSession.int || '-';
      if (firstSession.exercises && firstSession.exercises.length > 0) {
        catLabel = CATEGORY_LABELS[firstSession.exercises[0].cat] || firstSession.exercises[0].cat;
      }
      doc.setFont('helvetica', 'normal');
      doc.text(catLabel, cx + half + 1.5, subY + subHeaderH / 2 + 1);
    }
  });

  // Body cells (white)
  doc.setFillColor(255, 255, 255);
  orderedDays.forEach((d, i) => {
    const cx = gridLeft + leftLabelW + colW * i;
    doc.rect(cx, bodyTop, colW, bodyH, 'FD');
  });
  // left empty label column (white)
  doc.rect(gridLeft, bodyTop, leftLabelW, bodyH, 'FD');

  // Body content per day
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.8);
  const bodyPad = 1.5;
  const lineH = 3.2;

  const drawDayBody = (d: WeeklyExportDay, colX: number) => {
    let by = bodyTop + bodyPad + 2.5;
    const maxY = bodyTop + bodyH - bodyPad;
    const innerW = colW - bodyPad * 2;

    const writeLine = (txt: string, opts: { bold?: boolean; size?: number } = {}) => {
      if (by > maxY) return;
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setFontSize(opts.size ?? 7.8);
      const lines = doc.splitTextToSize(txt, innerW);
      for (const ln of lines) {
        if (by > maxY) return;
        doc.text(ln, colX + bodyPad, by);
        by += lineH;
      }
    };

    if (d.sessions.length === 0) {
      writeLine('Istirahat', { bold: true });
      if (d.marker) writeLine(`[${d.marker}]`);
      return;
    }

    if (d.marker) writeLine(`[${d.marker}]`, { bold: true });

    d.sessions.forEach(({ number, session }) => {
      writeLine(`Sesi ${number} — ${INTENSITY_LABELS[session.int] || session.int}`, { bold: true });
      if (session.warmup) writeLine(`WU: ${session.warmup}`);
      if (session.exercises && session.exercises.length > 0) {
        session.exercises.forEach((ex, idx) => {
          const cat = CATEGORY_LABELS[ex.cat] || ex.cat;
          const loadTxt = ex.load ? ` @${ex.load}` : '';
          writeLine(`${idx + 1}. ${ex.name} (${cat}) ${ex.set}x${ex.rep}${loadTxt}`);
        });
      }
      if (session.cooldown) writeLine(`CD: ${session.cooldown}`);
      if (session.recovery) writeLine(`Rec: ${session.recovery}`);
      by += 1; // spacing between sessions
    });
  };

  orderedDays.forEach((d, i) => {
    const cx = gridLeft + leftLabelW + colW * i;
    drawDayBody(d, cx);
  });

  // ============ Foot rows: Durasi / RPE / TL ============
  let totalWeekLoad = 0;
  const footLabels = ['Durasi', 'RPE', 'TL'];
  const footFill: [number, number, number] = [254, 215, 170]; // orange-200
  doc.setFillColor(...footFill);

  for (let r = 0; r < 3; r++) {
    const ry = footTop + r * footRowH;
    // Left label
    doc.setFillColor(241, 245, 249);
    doc.rect(gridLeft, ry, leftLabelW, footRowH, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(footLabels[r], gridLeft + leftLabelW - 2, ry + footRowH / 2 + 1, { align: 'right' });

    // Day cells (orange tint)
    doc.setFillColor(...footFill);
    doc.rect(gridLeft + leftLabelW, ry, totalGridW - leftLabelW, footRowH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    orderedDays.forEach((d, i) => {
      const cx = gridLeft + leftLabelW + colW * i;
      doc.rect(cx, ry, colW, footRowH, 'S');

      let dayDuration = 0;
      let dayLoad = 0;
      let dayRpeSum = 0;
      let dayRpeCount = 0;
      d.sessions.forEach(({ session }) => {
        if (session.duration) dayDuration += session.duration;
        if (session.rpe) {
          dayRpeSum += session.rpe;
          dayRpeCount += 1;
        }
        if (session.rpe && session.duration) {
          dayLoad += calculateSessionLoad(session.duration, session.rpe);
        }
      });

      let txt = '-';
      if (r === 0) txt = dayDuration > 0 ? `${dayDuration} mnt` : '-';
      else if (r === 1) txt = dayRpeCount > 0 ? (dayRpeSum / dayRpeCount).toFixed(1) : '-';
      else if (r === 2) {
        txt = dayLoad > 0 ? `${dayLoad}` : '-';
        totalWeekLoad += dayLoad;
      }
      doc.text(txt, cx + colW / 2, ry + footRowH / 2 + 1, { align: 'center' });
    });
  }

  // Outer border of grid
  doc.setLineWidth(0.4);
  doc.setDrawColor(60, 70, 90);
  doc.rect(gridLeft, gridTop, totalGridW, gridBottom - gridTop, 'S');
  doc.setLineWidth(0.2);

  // Total Training Load label at far right under grid
  const totalY = gridBottom + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Training Load: ${totalWeekLoad} AU`, gridRight, totalY, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Dibuat: ${format(new Date(), 'd MMM yyyy HH:mm', { locale: idLocale })}`,
    margin,
    pageH - 4
  );
  doc.text('HIROCROSS — Weekly Program', pageW - margin, pageH - 4, { align: 'right' });

  const fileName = `${(planName || 'program').replace(/[^a-z0-9]+/gi, '_')}_W${weekNumber}.pdf`;
  doc.save(fileName);
}
