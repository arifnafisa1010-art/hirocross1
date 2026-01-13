import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAthletes } from '@/hooks/useAthletes';
import { useTestResults } from '@/hooks/useTestResults';
import { useTestNorms } from '@/hooks/useTestNorms';
import { Download, Loader2, ArrowUp, ArrowDown, Minus, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PeriodResult {
  item: string;
  category: string;
  value: number;
  score: number;
  unit: string;
  date: string;
}

export function PeriodComparisonReport() {
  const { athletes, loading: athletesLoading } = useAthletes();
  const { results, loading: resultsLoading } = useTestResults();
  const { getNormForItem } = useTestNorms();
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [period1Start, setPeriod1Start] = useState('');
  const [period1End, setPeriod1End] = useState('');
  const [period2Start, setPeriod2Start] = useState('');
  const [period2End, setPeriod2End] = useState('');

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  // Get results for each period
  const getResultsInPeriod = (start: string, end: string): PeriodResult[] => {
    if (!start || !end || !selectedAthleteId) return [];

    const startDate = new Date(start);
    const endDate = new Date(end);

    const periodResults = results.filter(r => {
      if (r.athlete_id !== selectedAthleteId) return false;
      const testDate = new Date(r.test_date);
      return testDate >= startDate && testDate <= endDate;
    });

    // Get latest result per item
    const itemMap: Record<string, PeriodResult> = {};
    periodResults.forEach(r => {
      const existing = itemMap[r.item];
      if (!existing || new Date(r.test_date) > new Date(existing.date)) {
        itemMap[r.item] = {
          item: r.item,
          category: r.category,
          value: r.value,
          score: r.score,
          unit: r.unit,
          date: r.test_date,
        };
      }
    });

    return Object.values(itemMap);
  };

  const period1Results = useMemo(() => getResultsInPeriod(period1Start, period1End), 
    [results, selectedAthleteId, period1Start, period1End]);
  
  const period2Results = useMemo(() => getResultsInPeriod(period2Start, period2End), 
    [results, selectedAthleteId, period2Start, period2End]);

  // Create comparison data
  const comparisonData = useMemo(() => {
    const allItems = new Set([
      ...period1Results.map(r => r.item),
      ...period2Results.map(r => r.item),
    ]);

    return Array.from(allItems).map(item => {
      const p1 = period1Results.find(r => r.item === item);
      const p2 = period2Results.find(r => r.item === item);
      
      const p1Value = p1?.value ?? null;
      const p2Value = p2?.value ?? null;
      const p1Score = p1?.score ?? null;
      const p2Score = p2?.score ?? null;
      
      let change: number | null = null;
      let changePercent: number | null = null;
      let scoreChange: number | null = null;
      
      if (p1Value !== null && p2Value !== null) {
        change = p2Value - p1Value;
        changePercent = p1Value !== 0 ? ((p2Value - p1Value) / p1Value) * 100 : 0;
      }
      
      if (p1Score !== null && p2Score !== null) {
        scoreChange = p2Score - p1Score;
      }

      // Check if lower is better for this item
      const norm = getNormForItem(p1?.category || p2?.category || '', item, selectedAthlete?.gender || 'M');
      const lowerIsBetter = norm?.lower_is_better || false;

      return {
        item,
        category: p1?.category || p2?.category || '',
        unit: p1?.unit || p2?.unit || '',
        period1Value: p1Value,
        period2Value: p2Value,
        period1Score: p1Score,
        period2Score: p2Score,
        change,
        changePercent,
        scoreChange,
        lowerIsBetter,
        isImproved: change !== null ? (lowerIsBetter ? change < 0 : change > 0) : null,
      };
    }).sort((a, b) => a.category.localeCompare(b.category));
  }, [period1Results, period2Results, getNormForItem, selectedAthlete]);

  // Chart data for visualization
  const chartData = useMemo(() => {
    return comparisonData
      .filter(d => d.period1Score !== null && d.period2Score !== null)
      .map(d => ({
        item: d.item.length > 15 ? d.item.slice(0, 15) + '...' : d.item,
        fullItem: d.item,
        'Periode 1': d.period1Score,
        'Periode 2': d.period2Score,
        change: d.scoreChange,
      }));
  }, [comparisonData]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const validItems = comparisonData.filter(d => d.isImproved !== null);
    const improved = validItems.filter(d => d.isImproved === true).length;
    const declined = validItems.filter(d => d.isImproved === false).length;
    const unchanged = validItems.filter(d => d.change === 0).length;
    
    const avgScoreP1 = period1Results.length > 0 
      ? period1Results.reduce((sum, r) => sum + r.score, 0) / period1Results.length 
      : 0;
    const avgScoreP2 = period2Results.length > 0 
      ? period2Results.reduce((sum, r) => sum + r.score, 0) / period2Results.length 
      : 0;

    return {
      improved,
      declined,
      unchanged,
      total: validItems.length,
      avgScoreP1: avgScoreP1.toFixed(2),
      avgScoreP2: avgScoreP2.toFixed(2),
      avgScoreChange: (avgScoreP2 - avgScoreP1).toFixed(2),
    };
  }, [comparisonData, period1Results, period2Results]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 20) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const athleteName = selectedAthlete?.name || 'Atlet';
      pdf.save(`Perbandingan_Periode_${athleteName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  if (athletesLoading || resultsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const canCompare = selectedAthleteId && period1Start && period1End && period2Start && period2End;

  return (
    <div className="space-y-6">
      {/* Period Selection Card */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Perbandingan Hasil Tes Antar Periode
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Bandingkan hasil tes atlet antara dua periode waktu berbeda untuk melihat perkembangan
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase">
                Pilih Atlet
              </Label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pilih atlet..." />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Periode 1 (Awal)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Mulai</Label>
                  <Input
                    type="date"
                    value={period1Start}
                    onChange={(e) => setPeriod1Start(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Sampai</Label>
                  <Input
                    type="date"
                    value={period1End}
                    onChange={(e) => setPeriod1End(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Periode 2 (Akhir)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Mulai</Label>
                  <Input
                    type="date"
                    value={period2Start}
                    onChange={(e) => setPeriod2Start(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Sampai</Label>
                  <Input
                    type="date"
                    value={period2End}
                    onChange={(e) => setPeriod2End(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Report */}
      {canCompare && comparisonData.length > 0 && (
        <Card className="border-border shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Laporan Perbandingan
              </CardTitle>
              <Button onClick={handleExportPDF} disabled={exporting} variant="outline" size="sm">
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={reportRef} className="bg-white p-6 rounded-lg space-y-6">
              {/* Header */}
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-xl font-bold">Laporan Perbandingan Hasil Tes</h2>
                <p className="text-lg font-semibold text-accent mt-1">{selectedAthlete?.name}</p>
                <div className="flex justify-center gap-6 mt-2 text-sm text-muted-foreground">
                  <span>
                    <strong className="text-blue-600">Periode 1:</strong> {format(new Date(period1Start), 'd MMM yyyy', { locale: idLocale })} - {format(new Date(period1End), 'd MMM yyyy', { locale: idLocale })}
                  </span>
                  <span>
                    <strong className="text-green-600">Periode 2:</strong> {format(new Date(period2Start), 'd MMM yyyy', { locale: idLocale })} - {format(new Date(period2End), 'd MMM yyyy', { locale: idLocale })}
                  </span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <ArrowUp className="w-5 h-5" />
                    <span className="text-2xl font-bold">{summaryStats.improved}</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">Meningkat</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <ArrowDown className="w-5 h-5" />
                    <span className="text-2xl font-bold">{summaryStats.declined}</span>
                  </div>
                  <p className="text-xs text-red-700 mt-1">Menurun</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-600">
                    <Minus className="w-5 h-5" />
                    <span className="text-2xl font-bold">{summaryStats.unchanged}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">Tetap</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-blue-700">Rata-rata Skor P1</p>
                  <span className="text-2xl font-bold text-blue-600">{summaryStats.avgScoreP1}</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-green-700">Rata-rata Skor P2</p>
                  <span className="text-2xl font-bold text-green-600">{summaryStats.avgScoreP2}</span>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ({parseFloat(summaryStats.avgScoreChange) >= 0 ? '+' : ''}{summaryStats.avgScoreChange})
                  </p>
                </div>
              </div>

              {/* Score Comparison Chart */}
              {chartData.length > 0 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="item" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip 
                        formatter={(value, name) => [`${value}/5`, name]}
                        labelFormatter={(label) => chartData.find(d => d.item === label)?.fullItem || label}
                      />
                      <Legend />
                      <Bar dataKey="Periode 1" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Periode 2" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Detailed Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Kategori</th>
                      <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Item Tes</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                        <span className="text-blue-600">Nilai P1</span>
                      </th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                        <span className="text-green-600">Nilai P2</span>
                      </th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Perubahan</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                        <span className="text-blue-600">Skor P1</span>
                      </th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">
                        <span className="text-green-600">Skor P2</span>
                      </th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} className="border-t border-border/50 hover:bg-secondary/30">
                        <td className="p-3 text-sm text-muted-foreground">{row.category}</td>
                        <td className="p-3 text-sm font-medium">{row.item}</td>
                        <td className="p-3 text-sm text-center text-blue-600 font-semibold">
                          {row.period1Value !== null ? `${row.period1Value} ${row.unit}` : '-'}
                        </td>
                        <td className="p-3 text-sm text-center text-green-600 font-semibold">
                          {row.period2Value !== null ? `${row.period2Value} ${row.unit}` : '-'}
                        </td>
                        <td className="p-3 text-sm text-center">
                          {row.change !== null ? (
                            <span className={`font-bold ${
                              row.isImproved ? 'text-green-600' : 
                              row.change === 0 ? 'text-slate-500' : 'text-red-600'
                            }`}>
                              {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)} {row.unit}
                              <br />
                              <span className="text-[10px] font-normal">
                                ({row.changePercent !== null && row.changePercent >= 0 ? '+' : ''}{row.changePercent?.toFixed(1)}%)
                              </span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {row.period1Score !== null ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              row.period1Score >= 4 ? 'bg-green-100 text-green-700' :
                              row.period1Score >= 3 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {row.period1Score}/5
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {row.period2Score !== null ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              row.period2Score >= 4 ? 'bg-green-100 text-green-700' :
                              row.period2Score >= 3 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {row.period2Score}/5
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {row.isImproved === true && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              <ArrowUp className="w-3 h-3" /> Naik
                            </span>
                          )}
                          {row.isImproved === false && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                              <ArrowDown className="w-3 h-3" /> Turun
                            </span>
                          )}
                          {row.change === 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                              <Minus className="w-3 h-3" /> Tetap
                            </span>
                          )}
                          {row.isImproved === null && row.change !== 0 && '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
                Dicetak pada: {format(new Date(), 'd MMMM yyyy HH:mm', { locale: idLocale })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canCompare && comparisonData.length === 0 && (
        <Card className="border-border shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Tidak ada data tes ditemukan pada periode yang dipilih.</p>
            <p className="text-sm mt-2">Pastikan atlet memiliki hasil tes dalam rentang tanggal tersebut.</p>
          </CardContent>
        </Card>
      )}

      {!canCompare && (
        <Card className="border-border shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Pilih atlet dan tentukan dua periode waktu untuk membandingkan hasil tes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
