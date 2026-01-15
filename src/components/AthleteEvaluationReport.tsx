import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAthletes } from '@/hooks/useAthletes';
import { useTestResults } from '@/hooks/useTestResults';
import { useTestNorms } from '@/hooks/useTestNorms';
import { Download, Loader2, FileText, TrendingUp, TrendingDown, Minus, Sparkles, Brain } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categoryLabels: Record<string, string> = {
  'Kekuatan': 'Kekuatan',
  'Daya Tahan': 'Daya Tahan',
  'Kecepatan': 'Kecepatan',
  'Fleksibilitas': 'Fleksibilitas',
  'Power': 'Power',
  'Kelincahan': 'Kelincahan',
  'Keseimbangan': 'Keseimbangan',
  'Reaksi': 'Reaksi',
  // Legacy mappings
  'Strength': 'Kekuatan',
  'Speed': 'Kecepatan',
  'Endurance': 'Daya Tahan',
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
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
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

  // Calculate scores for radar chart - use test item names (not categories)
  const radarScores = useMemo(() => {
    return athleteResults.map(r => ({
      item: r.item,
      category: categoryLabels[r.category] || r.category,
      score: r.score,
      fullMark: 5,
    }));
  }, [athleteResults]);

  // Calculate category averages for summary
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

  // AI Analysis function
  const handleAIAnalysis = useCallback(async () => {
    if (!selectedAthlete || athleteResults.length === 0) return;

    setAnalyzing(true);
    setAiAnalysis('');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-athlete', {
        body: {
          athleteData: {
            name: selectedAthlete.name,
            age: athleteAge,
            gender: selectedAthlete.gender,
            sport: selectedAthlete.sport,
            weight: selectedAthlete.weight,
            height: selectedAthlete.height,
          },
          testResults: athleteResults.map(r => ({
            item: r.item,
            category: categoryLabels[r.category] || r.category,
            value: r.value,
            unit: r.unit,
            score: r.score,
          })),
          categoryScores: categoryScores,
          overallScore: overallScore,
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        setAiAnalysis(data.analysis);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Gagal melakukan analisis AI');
    } finally {
      setAnalyzing(false);
    }
  }, [selectedAthlete, athleteResults, categoryScores, overallScore, athleteAge]);

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
              <>
                <Button 
                  onClick={handleAIAnalysis} 
                  disabled={analyzing || athleteResults.length === 0}
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analisis AI
                </Button>
                <Button onClick={handleExportPDF} disabled={exporting || athleteResults.length === 0}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              </>
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
            {/* Header with Logo */}
            <div className="border-b-2 border-accent pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-black text-white">HC</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-accent">LAPORAN TES BIOMOTOR</h1>
                    <p className="text-sm text-muted-foreground">HiroCross Plan - Sports Training System</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tanggal Laporan</p>
                  <p className="font-bold text-lg">{format(new Date(), 'd MMMM yyyy', { locale: idLocale })}</p>
                </div>
              </div>
            </div>

            {/* Athlete Info Card */}
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 rounded-xl border border-accent/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Nama Atlet</p>
                  <p className="text-lg font-bold">{selectedAthlete?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Usia</p>
                  <p className="text-lg font-bold">{athleteAge} Tahun</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Jenis Kelamin</p>
                  <p className="text-lg font-bold">{selectedAthlete?.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Cabang Olahraga</p>
                  <p className="text-lg font-bold">{selectedAthlete?.sport || '-'}</p>
                </div>
              </div>
              {selectedAthlete?.weight && (
                <div className="mt-3 pt-3 border-t border-accent/20 flex gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Berat Badan</p>
                    <p className="font-semibold">{selectedAthlete.weight} kg</p>
                  </div>
                  {selectedAthlete?.height && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Tinggi Badan</p>
                      <p className="font-semibold">{selectedAthlete.height} cm</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Overall Score with Radar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 p-5 rounded-xl text-center border border-accent/30">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Skor Keseluruhan</p>
                <p className={`text-5xl font-black ${
                  overallScore >= 4 ? 'text-success' :
                  overallScore >= 3 ? 'text-amber-600' :
                  'text-destructive'
                }`}>
                  {overallScore}
                </p>
                <p className="text-lg text-muted-foreground">/5</p>
                <Badge className={`mt-2 text-sm px-3 py-1 ${scoreLabels[Math.round(overallScore)]?.color || 'bg-secondary'}`}>
                  {scoreLabels[Math.round(overallScore)]?.label || '-'}
                </Badge>
              </div>

              {/* Radar Chart - using test item names */}
              <div className="md:col-span-2 h-64">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-2 text-center">Profil Biomotor (Per Item Tes)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarScores} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="item" tick={{ fontSize: 8, fill: 'hsl(var(--foreground))' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} />
                    <Radar
                      name="Skor"
                      dataKey="score"
                      stroke="hsl(var(--accent))"
                      fill="hsl(var(--accent))"
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Summary Cards */}
            <div>
              <h3 className="font-bold text-sm mb-3 uppercase text-muted-foreground">Ringkasan per Kategori Biomotor</h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {categoryScores.map((cat) => (
                  <div key={cat.category} className="p-2 bg-secondary/30 rounded-lg text-center">
                    <p className="text-[9px] text-muted-foreground font-medium truncate">{cat.category}</p>
                    <p className={`text-xl font-bold ${
                      cat.score >= 4 ? 'text-success' :
                      cat.score >= 3 ? 'text-amber-600' :
                      'text-destructive'
                    }`}>
                      {cat.score}
                    </p>
                  </div>
                ))}
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

            {/* Interpretasi Skor */}
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-bold text-sm mb-3 uppercase text-muted-foreground">Interpretasi Skor</h3>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                <div className="p-2 bg-destructive/20 rounded">
                  <p className="font-bold text-destructive">1</p>
                  <p>Sangat Kurang</p>
                </div>
                <div className="p-2 bg-orange-100 rounded">
                  <p className="font-bold text-orange-700">2</p>
                  <p>Kurang</p>
                </div>
                <div className="p-2 bg-amber-100 rounded">
                  <p className="font-bold text-amber-700">3</p>
                  <p>Cukup</p>
                </div>
                <div className="p-2 bg-lime-100 rounded">
                  <p className="font-bold text-lime-700">4</p>
                  <p>Baik</p>
                </div>
                <div className="p-2 bg-success/20 rounded">
                  <p className="font-bold text-success">5</p>
                  <p>Sangat Baik</p>
                </div>
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

            {/* AI Analysis Section */}
            {aiAnalysis && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-accent" />
                  <h3 className="font-bold">Analisis AI</h3>
                  <Badge variant="outline" className="text-[10px] border-accent text-accent">
                    Powered by AI
                  </Badge>
                </div>
                <div className="bg-gradient-to-br from-accent/5 to-accent/10 p-4 rounded-xl border border-accent/20">
                  <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
                    {aiAnalysis.split('\n').map((line, idx) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return (
                          <h4 key={idx} className="font-bold text-accent mt-3 mb-1 first:mt-0">
                            {line.replace(/\*\*/g, '')}
                          </h4>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <p key={idx} className="ml-4 my-0.5">
                            • {line.slice(2)}
                          </p>
                        );
                      }
                      if (line.match(/^\d+\./)) {
                        return (
                          <p key={idx} className="font-medium mt-2 text-accent">
                            {line}
                          </p>
                        );
                      }
                      return line ? <p key={idx} className="my-1">{line}</p> : null;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 mt-4 border-t-2 border-accent/30">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                  <span className="text-sm font-black text-white">HC</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">HiroCross Plan</p>
                  <p className="text-[10px] text-muted-foreground">Sports Training Periodization System</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                © {new Date().getFullYear()} HiroCross Plan | Laporan dibuat pada {format(new Date(), 'd MMMM yyyy, HH:mm', { locale: idLocale })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
