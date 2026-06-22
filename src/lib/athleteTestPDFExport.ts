import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

export type TestResult = Tables<'test_results'>;
export type TestNorm = Tables<'test_norms'>;
export type Athlete = Tables<'athletes'>;

const BIOMOTOR_CATEGORIES = [
  'Kekuatan',
  'Daya Tahan',
  'Kecepatan',
  'Fleksibilitas',
  'Power',
  'Kelincahan',
  'Keseimbangan',
  'Reaksi',
];

const SCORE_LABEL: Record<number, string> = {
  1: 'Sangat Kurang',
  2: 'Kurang',
  3: 'Cukup',
  4: 'Baik',
  5: 'Baik Sekali',
};

const calculateAge = (birthDate: string | null): number => {
  if (!birthDate) return 20;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatNormRange = (norm: TestNorm | null): string => {
  if (!norm) return '-';
  const lib = norm.lower_is_better;
  const { score_1_max: s1, score_2_max: s2, score_3_max: s3, score_4_max: s4, score_5_max: s5 } = norm;
  const fmt = (v: number | null) => (v === null || v === undefined ? '-' : String(v));
  if (lib) {
    // lower is better (e.g. sprint times). score_5 is best (lowest time).
    return `5:<${fmt(s2)} 4:${fmt(s2)}-${fmt(s3)} 3:${fmt(s3)}-${fmt(s4)} 2:${fmt(s4)}-${fmt(s1)} 1:>=${fmt(s1)}`;
  }
  return `1:<${fmt(s2)} 2:${fmt(s2)}-${fmt(s3)} 3:${fmt(s3)}-${fmt(s4)} 4:${fmt(s4)}-${fmt(s5)} 5:>=${fmt(s5)}`;
};

// Draw radar chart on offscreen canvas, returns dataURL.
function drawRadarChart(scores: Record<string, number>, athleteName: string): string {
  const size = 600;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = size * 0.35;
  const cats = BIOMOTOR_CATEGORIES;
  const angleStep = (Math.PI * 2) / cats.length;
  const maxScore = 5;

  // Background grid
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let g = 1; g <= maxScore; g++) {
    ctx.beginPath();
    for (let i = 0; i < cats.length; i++) {
      const a = -Math.PI / 2 + i * angleStep;
      const r = (radius * g) / maxScore;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Axis lines + labels
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < cats.length; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    const lx = cx + Math.cos(a) * (radius + 30);
    const ly = cy + Math.sin(a) * (radius + 22);
    ctx.fillText(cats[i], lx, ly);
  }

  // Data polygon
  ctx.beginPath();
  for (let i = 0; i < cats.length; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    const score = scores[cats[i]] || 0;
    const r = (radius * score) / maxScore;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Data points
  ctx.fillStyle = '#1d4ed8';
  for (let i = 0; i < cats.length; i++) {
    const a = -Math.PI / 2 + i * angleStep;
    const score = scores[cats[i]] || 0;
    const r = (radius * score) / maxScore;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`Profil Biomotor — ${athleteName}`, cx, 30);

  // Score legend (center scale numbers)
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Arial';
  for (let g = 1; g <= maxScore; g++) {
    const r = (radius * g) / maxScore;
    ctx.fillText(String(g), cx + 4, cy - r);
  }

  return canvas.toDataURL('image/png');
}

export interface AthleteTestPDFParams {
  athlete: Athlete;
  results: TestResult[];
  getNormForItem: (category: string, item: string, gender?: string, age?: number) => TestNorm | null;
}

export function exportAthleteTestPDF(params: AthleteTestPDFParams) {
  const { athlete, results, getNormForItem } = params;
  const athleteResults = results.filter(r => r.athlete_id === athlete.id);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin - 10) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Laporan Tes & Pengukuran Atlet', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Tanggal cetak: ${format(new Date(), 'd MMMM yyyy', { locale: idLocale })}`, margin, 22);
  y = 38;

  // Athlete info
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(athlete.name, margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const age = calculateAge(athlete.birth_date);
  const info = [
    `Jenis Kelamin: ${athlete.gender === 'F' ? 'Perempuan' : 'Laki-laki'}`,
    `Usia: ${age} tahun`,
    athlete.weight ? `Berat: ${athlete.weight} kg` : null,
    athlete.sport ? `Cabor: ${athlete.sport}` : null,
  ].filter(Boolean).join('  •  ');
  doc.text(info, margin, y);
  y += 8;

  // Compute per-category average scores
  const categoryAvg: Record<string, number> = {};
  BIOMOTOR_CATEGORIES.forEach(cat => {
    const list = athleteResults.filter(r => r.category === cat);
    if (list.length > 0) {
      categoryAvg[cat] = list.reduce((s, r) => s + (r.score || 0), 0) / list.length;
    } else {
      categoryAvg[cat] = 0;
    }
  });

  // Radar chart
  ensureSpace(110);
  const radarData = drawRadarChart(categoryAvg, athlete.name);
  const chartSize = 100;
  doc.addImage(radarData, 'PNG', (pageW - chartSize) / 2, y, chartSize, chartSize);
  y += chartSize + 4;

  // Category summary table
  ensureSpace(10 + BIOMOTOR_CATEGORIES.length * 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Ringkasan Skor per Kategori', margin, y);
  y += 5;

  const summaryCols = [
    { label: 'Kategori', w: 50 },
    { label: 'Rata-rata Skor', w: 35 },
    { label: 'Klasifikasi', w: 40 },
    { label: 'Jumlah Tes', w: 30 },
  ];
  const tableX = margin;
  doc.setFillColor(30, 41, 59);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.rect(tableX, y, summaryCols.reduce((s, c) => s + c.w, 0), 7, 'F');
  let cx = tableX + 2;
  summaryCols.forEach(c => {
    doc.text(c.label, cx, y + 5);
    cx += c.w;
  });
  y += 7;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  BIOMOTOR_CATEGORIES.forEach((cat, idx) => {
    const avg = categoryAvg[cat];
    const count = athleteResults.filter(r => r.category === cat).length;
    const rounded = Math.round(avg);
    const label = count > 0 ? (SCORE_LABEL[rounded] || '-') : 'Belum dites';
    if (idx % 2 === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(tableX, y, summaryCols.reduce((s, c) => s + c.w, 0), 6, 'F');
    }
    cx = tableX + 2;
    doc.text(cat, cx, y + 4); cx += summaryCols[0].w;
    doc.text(count > 0 ? avg.toFixed(2) : '-', cx, y + 4); cx += summaryCols[1].w;
    doc.text(label, cx, y + 4); cx += summaryCols[2].w;
    doc.text(String(count), cx, y + 4);
    y += 6;
  });
  y += 6;

  // Detail per kategori
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  ensureSpace(10);
  doc.text('Detail Hasil Tes & Norma', margin, y);
  y += 6;

  const cols = [
    { label: 'Tanggal', w: 22 },
    { label: 'Item', w: 40 },
    { label: 'Nilai', w: 20 },
    { label: 'Unit', w: 14 },
    { label: 'Skor', w: 14 },
    { label: 'Norma (Skor 1-5)', w: 72 },
  ];
  const totalW = cols.reduce((s, c) => s + c.w, 0);

  const drawTableHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.rect(margin, y, totalW, 6, 'F');
    let xx = margin + 2;
    cols.forEach(c => { doc.text(c.label, xx, y + 4); xx += c.w; });
    y += 6;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
  };

  const byCategory: Record<string, TestResult[]> = {};
  BIOMOTOR_CATEGORIES.forEach(c => (byCategory[c] = []));
  athleteResults.forEach(r => {
    if (byCategory[r.category]) byCategory[r.category].push(r);
  });

  if (athleteResults.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada hasil tes untuk atlet ini.', margin, y + 6);
  } else {
    BIOMOTOR_CATEGORIES.forEach(cat => {
      const list = byCategory[cat]
        .slice()
        .sort((a, b) => (a.test_date < b.test_date ? 1 : -1));
      if (list.length === 0) return;

      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.text(cat, margin, y + 4);
      y += 6;
      drawTableHeader();

      list.forEach((r, idx) => {
        ensureSpace(7);
        const norm = getNormForItem(cat, r.item, athlete.gender || 'M', age);
        const normStr = formatNormRange(norm);
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, totalW, 6, 'F');
        }
        let xx = margin + 2;
        doc.setFontSize(8.5);
        doc.text(format(new Date(r.test_date), 'dd/MM/yy'), xx, y + 4); xx += cols[0].w;
        const itemTxt = doc.splitTextToSize(r.item, cols[1].w - 2)[0];
        doc.text(itemTxt, xx, y + 4); xx += cols[1].w;
        doc.text(String(r.value), xx, y + 4); xx += cols[2].w;
        doc.text(r.unit || '', xx, y + 4); xx += cols[3].w;
        const scoreLabel = `${r.score} (${SCORE_LABEL[r.score] || '-'})`;
        doc.text(scoreLabel, xx, y + 4); xx += cols[4].w;
        const normLines = doc.splitTextToSize(normStr, cols[5].w - 2);
        doc.text(normLines[0] || '-', xx, y + 4);
        y += 6;
      });
      y += 3;
    });
  }

  // Footer with page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Halaman ${i} / ${total}`, pageW - margin, pageH - 6, { align: 'right' });
    doc.text('HIROCROSS — Laporan Tes Atlet', margin, pageH - 6);
  }

  const safeName = athlete.name.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Tes_${safeName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
