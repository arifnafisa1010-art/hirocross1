import { useState } from 'react';
import { format, subDays, parseISO, startOfWeek, subWeeks, endOfWeek, isWithinInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { FileDown, Loader2, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface TrainingLoad {
  id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  session_load: number;
  training_type: string;
  notes: string | null;
}

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface ACWRData {
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  riskZone: 'undertrained' | 'optimal' | 'warning' | 'danger';
}

interface TrainingLoadPDFExportProps {
  loads: TrainingLoad[];
  dailyMetrics: DailyMetric[];
  acwrData: ACWRData;
  currentMetrics: { fitness: number; fatigue: number; form: number };
  userName?: string;
}

const TRAINING_TYPE_LABELS: { [key: string]: string } = {
  training: 'Latihan',
  match: 'Pertandingan',
  recovery: 'Recovery',
  strength: 'Kekuatan',
  conditioning: 'Conditioning',
  technical: 'Teknik',
  tactical: 'Taktik',
};

export function TrainingLoadPDFExport({ 
  loads, 
  dailyMetrics, 
  acwrData, 
  currentMetrics,
  userName = 'Atlet'
}: TrainingLoadPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [includeWeeklyChart, setIncludeWeeklyChart] = useState(true);

  // Calculate weekly TSS data for chart
  const calculateWeeklyData = () => {
    const today = new Date();
    const weeks: { 
      weekLabel: string; 
      totalLoad: number; 
      avgFitness: number;
      avgForm: number;
    }[] = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      
      const weekDays = dailyMetrics.filter(d => {
        const date = parseISO(d.date);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });

      const totalLoad = weekDays.reduce((sum, d) => sum + d.load, 0);
      const avgFitness = weekDays.length > 0 ? weekDays.reduce((sum, d) => sum + d.fitness, 0) / weekDays.length : 0;
      const avgForm = weekDays.length > 0 ? weekDays.reduce((sum, d) => sum + d.form, 0) / weekDays.length : 0;

      weeks.push({
        weekLabel: format(weekStart, 'd MMM', { locale: idLocale }),
        totalLoad: Math.round(totalLoad),
        avgFitness: Math.round(avgFitness),
        avgForm: Math.round(avgForm),
      });
    }

    return weeks;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Helper function for adding text
      const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: 'normal' | 'bold'; color?: number[] }) => {
        doc.setFontSize(options?.fontSize || 10);
        doc.setFont('helvetica', options?.fontStyle || 'normal');
        if (options?.color) {
          doc.setTextColor(options.color[0], options.color[1], options.color[2]);
        } else {
          doc.setTextColor(0, 0, 0);
        }
        doc.text(text, x, y);
      };

      // Header
      addText('LAPORAN TRAINING LOAD & PERFORMA', pageWidth / 2, yPos, { fontSize: 16, fontStyle: 'bold' });
      doc.setFontSize(16);
      const titleWidth = doc.getTextWidth('LAPORAN TRAINING LOAD & PERFORMA');
      doc.text('LAPORAN TRAINING LOAD & PERFORMA', (pageWidth - titleWidth) / 2, yPos);
      
      yPos += 10;
      const periodDays = parseInt(selectedPeriod);
      const periodStart = format(subDays(new Date(), periodDays), 'dd MMMM yyyy', { locale: idLocale });
      const periodEnd = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodText = `Periode: ${periodStart} - ${periodEnd}`;
      const periodWidth = doc.getTextWidth(periodText);
      doc.text(periodText, (pageWidth - periodWidth) / 2, yPos);
      
      yPos += 8;
      const nameText = `Nama: ${userName}`;
      const nameWidth = doc.getTextWidth(nameText);
      doc.text(nameText, (pageWidth - nameWidth) / 2, yPos);
      
      yPos += 15;

      // Summary Box
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
      
      yPos += 8;
      addText('RINGKASAN PERFORMA', margin + 5, yPos, { fontSize: 12, fontStyle: 'bold' });
      
      yPos += 10;
      const summaryCol1 = margin + 5;
      const summaryCol2 = pageWidth / 2;
      
      addText(`Fitness (CTL): ${currentMetrics.fitness}%`, summaryCol1, yPos);
      addText(`ACWR: ${acwrData.acwr}`, summaryCol2, yPos);
      
      yPos += 7;
      addText(`Fatigue (ATL): ${currentMetrics.fatigue}%`, summaryCol1, yPos);
      addText(`Beban Akut (7 hari): ${acwrData.acuteLoad} AU`, summaryCol2, yPos);
      
      yPos += 7;
      addText(`Form (TSB): ${currentMetrics.form}`, summaryCol1, yPos);
      addText(`Beban Kronis (28 hari): ${acwrData.chronicLoad} AU`, summaryCol2, yPos);
      
      yPos += 7;
      const zoneLabels: { [key: string]: string } = {
        undertrained: 'Undertrained',
        optimal: 'Sweet Spot',
        warning: 'Warning Zone',
        danger: 'Danger Zone',
      };
      addText(`Zona Risiko: ${zoneLabels[acwrData.riskZone]}`, summaryCol1, yPos);

      yPos += 20;

      // Weekly TSS Chart Section
      if (includeWeeklyChart) {
        addText('TREN TSS MINGGUAN (8 Minggu)', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
        yPos += 10;

        const weeklyData = calculateWeeklyData();
        const chartWidth = pageWidth - 2 * margin;
        const chartHeight = 50;
        const barWidth = (chartWidth - 20) / weeklyData.length;
        const maxLoad = Math.max(...weeklyData.map(w => w.totalLoad), 100);

        // Chart background
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, chartWidth, chartHeight, 'F');

        // Draw bars
        weeklyData.forEach((week, i) => {
          const barHeight = (week.totalLoad / maxLoad) * (chartHeight - 15);
          const barX = margin + 10 + (i * barWidth);
          const barY = yPos + chartHeight - 10 - barHeight;

          // Bar color based on load
          if (week.totalLoad >= 400) {
            doc.setFillColor(34, 197, 94); // Green
          } else if (week.totalLoad >= 320) {
            doc.setFillColor(234, 179, 8); // Yellow
          } else if (week.totalLoad > 0) {
            doc.setFillColor(239, 68, 68); // Red
          } else {
            doc.setFillColor(200, 200, 200); // Gray
          }

          doc.rect(barX, barY, barWidth - 4, barHeight, 'F');

          // Week label
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(week.weekLabel, barX + (barWidth - 4) / 2, yPos + chartHeight - 2, { align: 'center' });

          // Load value on top of bar
          if (week.totalLoad > 0) {
            doc.setFontSize(6);
            doc.setTextColor(0, 0, 0);
            doc.text(week.totalLoad.toString(), barX + (barWidth - 4) / 2, barY - 2, { align: 'center' });
          }
        });

        yPos += chartHeight + 10;

        // Weekly stats summary
        const nonZeroWeeks = weeklyData.filter(w => w.totalLoad > 0);
        if (nonZeroWeeks.length > 0) {
          const avgWeeklyLoad = Math.round(nonZeroWeeks.reduce((sum, w) => sum + w.totalLoad, 0) / nonZeroWeeks.length);
          const maxWeeklyLoad = Math.max(...nonZeroWeeks.map(w => w.totalLoad));
          const minWeeklyLoad = Math.min(...nonZeroWeeks.map(w => w.totalLoad));

          doc.setFillColor(240, 248, 255);
          doc.rect(margin, yPos, chartWidth, 20, 'F');
          
          yPos += 6;
          addText(`Rata-rata Mingguan: ${avgWeeklyLoad} AU`, margin + 5, yPos);
          addText(`Tertinggi: ${maxWeeklyLoad} AU`, margin + 70, yPos);
          addText(`Terendah: ${minWeeklyLoad} AU`, margin + 120, yPos);
          
          yPos += 20;
        }
      }

      // Training Load Table
      addText('RIWAYAT TRAINING LOAD', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
      yPos += 8;

      // Filter loads by period
      const periodLoads = loads.filter(l => {
        const loadDate = new Date(l.session_date);
        const cutoffDate = subDays(new Date(), parseInt(selectedPeriod));
        return loadDate >= cutoffDate;
      }).sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

      // Table Header
      const colWidths = [35, 35, 25, 20, 30, 35];
      const headers = ['Tanggal', 'Jenis', 'Durasi', 'RPE', 'Load', 'Catatan'];
      
      doc.setFillColor(50, 50, 50);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      
      let xPos = margin + 2;
      headers.forEach((header, i) => {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(header, xPos, yPos + 5.5);
        xPos += colWidths[i];
      });
      
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      // Table Rows
      const maxRows = Math.min(periodLoads.length, 20);
      for (let i = 0; i < maxRows; i++) {
        const load = periodLoads[i];
        
        if (i % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 7, 'F');
        }

        xPos = margin + 2;
        doc.setFontSize(8);
        
        doc.text(format(new Date(load.session_date), 'dd/MM/yyyy'), xPos, yPos);
        xPos += colWidths[0];
        
        doc.text(TRAINING_TYPE_LABELS[load.training_type] || load.training_type, xPos, yPos);
        xPos += colWidths[1];
        
        doc.text(`${load.duration_minutes} min`, xPos, yPos);
        xPos += colWidths[2];
        
        doc.text(load.rpe.toString(), xPos, yPos);
        xPos += colWidths[3];
        
        doc.text(`${load.session_load} AU`, xPos, yPos);
        xPos += colWidths[4];
        
        const notes = load.notes ? (load.notes.length > 15 ? load.notes.substring(0, 15) + '...' : load.notes) : '-';
        doc.text(notes, xPos, yPos);

        yPos += 7;

        // Check for page break
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPos = 20;
        }
      }

      if (periodLoads.length > maxRows) {
        yPos += 5;
        addText(`... dan ${periodLoads.length - maxRows} sesi lainnya`, margin, yPos, { fontSize: 8, color: [128, 128, 128] });
      }

      // Statistics
      yPos += 15;
      if (yPos > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yPos = 20;
      }

      addText('STATISTIK PERIODE', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
      yPos += 10;

      const totalLoad = periodLoads.reduce((sum, l) => sum + l.session_load, 0);
      const avgLoad = periodLoads.length > 0 ? Math.round(totalLoad / periodLoads.length) : 0;
      const totalDuration = periodLoads.reduce((sum, l) => sum + l.duration_minutes, 0);
      const avgRPE = periodLoads.length > 0 
        ? (periodLoads.reduce((sum, l) => sum + l.rpe, 0) / periodLoads.length).toFixed(1) 
        : 0;

      const stats = [
        `Total Sesi: ${periodLoads.length}`,
        `Total Load: ${totalLoad.toLocaleString()} AU`,
        `Rata-rata Load: ${avgLoad} AU/sesi`,
        `Total Durasi: ${totalDuration} menit`,
        `Rata-rata RPE: ${avgRPE}`,
      ];

      stats.forEach((stat, i) => {
        addText(stat, margin + (i % 2) * 90, yPos + Math.floor(i / 2) * 7);
      });

      // Footer
      yPos = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Dibuat: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })}`, margin, yPos);
      doc.text('HiroCross Plan - Premium Dashboard', pageWidth - margin - 60, yPos);

      // Save
      const fileName = `Training-Load-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF berhasil diunduh!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal membuat PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          Export Laporan PDF
        </CardTitle>
        <CardDescription>
          Unduh laporan training load dan performa dalam format PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-2 block">Periode Laporan</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Hari Terakhir</SelectItem>
                <SelectItem value="14">14 Hari Terakhir</SelectItem>
                <SelectItem value="30">30 Hari Terakhir</SelectItem>
                <SelectItem value="60">60 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 pt-6">
            <Checkbox 
              id="includeChart" 
              checked={includeWeeklyChart}
              onCheckedChange={(checked) => setIncludeWeeklyChart(checked as boolean)}
            />
            <Label htmlFor="includeChart" className="text-sm flex items-center gap-1 cursor-pointer">
              <BarChart3 className="w-4 h-4" />
              Sertakan Grafik TSS Mingguan
            </Label>
          </div>
          
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating || loads.length === 0}
            className="mt-6"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Membuat PDF...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
        
        {loads.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Belum ada data training load untuk diekspor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
