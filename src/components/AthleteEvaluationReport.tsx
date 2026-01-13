import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAthletes } from '@/hooks/useAthletes';
import { useTestResults } from '@/hooks/useTestResults';
import { useTestNorms } from '@/hooks/useTestNorms';
import { Download, Loader2, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const categoryLabels: Record<string, string> = {
  'Strength': 'Kekuatan',
  'Speed': 'Kecepatan',
  'Endurance': 'Daya Tahan',
  'Technique': 'Teknik',
  'Tactic': 'Taktik',
};

const scoreLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Kurang', color: 'bg-destructive/20 text-destructive' },
  2: { label: 'Cukup', color: 'bg-orange-100 text-orange-700' },
  3: { label: 'Sedang', color: 'bg-amber-100 text-amber-700' },
  4: { label: 'Baik', color: 'bg-lime-100 text-lime-700' },
  5: { label: 'Sangat Baik', color: 'bg-success/20 text-success' },
};

export function AthleteEvaluationReport() {
  const { athletes, loading: athletesLoading } = useAthletes();
  const { results, loading: resultsLoading } = useTestResults();
  const { getNormForItem, loading: normsLoading } = useTestNorms();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  // Calculate athlete age
  const athleteAge = useMemo(() => {
    if (!selectedAthlete?.birth_date) return 20;
    const birthDate = new Date(selectedAthlete.birth_date);
    const today = new Date();
    return today.getFullYear() - birthDate.getFullYear();
  }, [selectedAthlete]);

  // Get latest results for selected athlete grouped by category and item
  const athleteResults = useMemo(() => {
    if (!selectedAthleteId) return [];

    const athleteTestResults = results.filter(r => r.athlete_id === selectedAthleteId);
    
    // Group by item and get latest
    const latestByItem: Record<string, typeof results[0]> = {};
    athleteTestResults.forEach(r => {
      const existing = latestByItem[r.item];
      if (!existing || new Date(r.test_date) > new Date(existing.test_date)) {
        latestByItem[r.item] = r;
      }
    });

    return Object.values(latestByItem).sort((a, b) => a.category.localeCompare(b.category));
  }, [selectedAthleteId, results]);

  // Calculate category averages for radar chart
  const categoryScores = useMemo(() => {
    const scores: Record<string, { total: number; count: number }> = {};
    
    athleteResults.forEach(r => {
      if (!scores[r.category]) {
        scores[r.category] = { total: 0, count: 0 };
      }
      scores[r.category].total += r.score;
      scores[r.category].count += 1;
    });

    return Object.entries(scores).map(([category, data]) => ({
      category: categoryLabels[category] || category,
      score: Math.round((data.total / data.count) * 10) / 10,
      fullMark: 5,
    }));
  }, [athleteResults]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (athleteResults.length === 0) return 0;
    const total = athleteResults.reduce((sum, r) => sum + r.score, 0);
    return Math.round((total / athleteResults.length) * 10) / 10;
  }, [athleteResults]);

  // Get comparison with norm
  const getComparisonWithNorm = (result: typeof results[0]) => {
    const norm = getNormForItem(result.category, result.item, selectedAthlete?.gender || 'M', athleteAge);
    if (!norm) return null;

    const lowerIsBetter = norm.lower_is_better || false;
    const targetValue = norm.score_5_max || 0;
    
    let percentageDiff: number;
    if (lowerIsBetter) {
      percentageDiff = ((targetValue - result.value) / targetValue) * 100;
    } else {
      percentageDiff = ((result.value - targetValue) / targetValue) * 100;
    }

    return {
      targetValue,
      percentageDiff: Math.round(percentageDiff),
      lowerIsBetter,
    };
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedAthlete) return;

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
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Laporan_Evaluasi_${selectedAthlete.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  if (athletesLoading || normsLoading) {
    return (
      <Card className="border-border shadow-card">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Laporan Evaluasi Performa
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Perbandingan hasil tes dengan standar norma
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih Atlet..." />
              </SelectTrigger>
              <SelectContent>
                {athletes.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} {a.gender ? `(${a.gender === 'M' ? 'L' : 'P'})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAthleteId && (
              <Button onClick={handleExportPDF} disabled={exporting || athleteResults.length === 0}>
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedAthleteId ? (
          <div className="text-center py-12 text-muted-foreground">
            Pilih atlet untuk melihat laporan evaluasi
          </div>
        ) : athleteResults.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada data tes untuk atlet ini
          </div>
        ) : (
          <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-lg">
            {/* Header */}
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedAthlete?.name}</h2>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Usia: {athleteAge} tahun</span>
                    <span>Gender: {selectedAthlete?.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</span>
                    {selectedAthlete?.sport && <span>Cabor: {selectedAthlete.sport}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tanggal Laporan</p>
                  <p className="font-semibold">{format(new Date(), 'd MMMM yyyy', { locale: idLocale })}</p>
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="flex items-center gap-6 p-4 bg-secondary/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase font-bold">Skor Keseluruhan</p>
                <p className={`text-4xl font-bold mt-1 ${
                  overallScore >= 4 ? 'text-success' :
                  overallScore >= 3 ? 'text-amber-600' :
                  'text-destructive'
                }`}>
                  {overallScore}/5
                </p>
                <Badge className={scoreLabels[Math.round(overallScore)]?.color || 'bg-secondary'}>
                  {scoreLabels[Math.round(overallScore)]?.label || '-'}
                </Badge>
              </div>
              <div className="flex-1 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={categoryScores}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Skor"
                      dataKey="score"
                      stroke="hsl(var(--accent))"
                      fill="hsl(var(--accent))"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Results */}
            <div>
              <h3 className="font-bold mb-3">Detail Hasil Tes</h3>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Kategori</th>
                      <th className="p-3 text-left text-[10px] font-extrabold text-muted-foreground uppercase">Item Tes</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Hasil</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Target (Skor 5)</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Skor</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Status</th>
                      <th className="p-3 text-center text-[10px] font-extrabold text-muted-foreground uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athleteResults.map((result) => {
                      const comparison = getComparisonWithNorm(result);
                      return (
                        <tr key={result.id} className="border-t border-border/50">
                          <td className="p-3 text-sm">{categoryLabels[result.category] || result.category}</td>
                          <td className="p-3 text-sm font-semibold">{result.item}</td>
                          <td className="p-3 text-sm text-center font-bold text-accent">
                            {result.value} {result.unit}
                          </td>
                          <td className="p-3 text-sm text-center text-muted-foreground">
                            {comparison ? `${comparison.lowerIsBetter ? '≤' : '≥'}${comparison.targetValue} ${result.unit}` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={scoreLabels[result.score]?.color || 'bg-secondary'}>
                              {result.score}/5
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-xs">
                            {scoreLabels[result.score]?.label || '-'}
                          </td>
                          <td className="p-3 text-center">
                            {comparison && (
                              <div className="flex items-center justify-center gap-1">
                                {comparison.percentageDiff > 0 ? (
                                  <TrendingUp className="w-4 h-4 text-success" />
                                ) : comparison.percentageDiff < 0 ? (
                                  <TrendingDown className="w-4 h-4 text-destructive" />
                                ) : (
                                  <Minus className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className={`text-xs font-mono ${
                                  comparison.percentageDiff > 0 ? 'text-success' :
                                  comparison.percentageDiff < 0 ? 'text-destructive' :
                                  'text-muted-foreground'
                                }`}>
                                  {comparison.percentageDiff > 0 ? '+' : ''}{comparison.percentageDiff}%
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary by Category */}
            <div>
              <h3 className="font-bold mb-3">Ringkasan per Kategori</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {categoryScores.map((cat) => (
                  <div key={cat.category} className="p-3 bg-secondary/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground font-medium">{cat.category}</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      cat.score >= 4 ? 'text-success' :
                      cat.score >= 3 ? 'text-amber-600' :
                      'text-destructive'
                    }`}>
                      {cat.score}
                    </p>
                    <Badge className={`mt-1 text-[9px] ${scoreLabels[Math.round(cat.score)]?.color || 'bg-secondary'}`}>
                      {scoreLabels[Math.round(cat.score)]?.label || '-'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="border-t border-border pt-4">
              <h3 className="font-bold mb-3">Rekomendasi Pengembangan</h3>
              <div className="space-y-2">
                {athleteResults
                  .filter(r => r.score <= 2)
                  .slice(0, 5)
                  .map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 bg-destructive/10 rounded-lg">
                      <Badge variant="destructive" className="text-[9px]">Prioritas</Badge>
                      <p className="text-sm">
                        <span className="font-semibold">{r.item}</span>: Perlu peningkatan signifikan (skor {r.score}/5)
                      </p>
                    </div>
                  ))}
                {athleteResults
                  .filter(r => r.score === 3)
                  .slice(0, 3)
                  .map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                      <Badge className="bg-amber-100 text-amber-700 text-[9px]">Perhatikan</Badge>
                      <p className="text-sm">
                        <span className="font-semibold">{r.item}</span>: Masih dapat ditingkatkan (skor {r.score}/5)
                      </p>
                    </div>
                  ))}
                {athleteResults.filter(r => r.score <= 3).length === 0 && (
                  <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                    <Badge className="bg-success/20 text-success text-[9px]">Excellent</Badge>
                    <p className="text-sm">Performa atlet sudah sangat baik di semua aspek yang diuji!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-muted-foreground pt-4 border-t border-border">
              <p>Laporan dibuat oleh HiroCross Plan - Sports Training Periodization System</p>
              <p className="mt-1">© {new Date().getFullYear()} HiroCross Plan</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
