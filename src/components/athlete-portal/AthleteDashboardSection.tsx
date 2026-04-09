import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap, Flame, Gauge, HeartPulse, Activity,
  Brain, RefreshCw, TrendingUp, TrendingDown, Minus, Shield,
  AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useReadiness } from '@/hooks/useReadiness';
import { getReadinessInfo } from '@/components/readiness/readinessUtils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

interface CurrentMetrics {
  fitness: number;
  fatigue: number;
  form: number;
}

interface AthleteDashboardSectionProps {
  athleteId: string;
  athleteData: {
    name: string;
    sport: string | null;
    position: string | null;
    weight: number | null;
    height: number | null;
    photo_url: string | null;
  };
  dailyMetrics: DailyMetric[];
  acwrData: ACWRData;
  currentMetrics: CurrentMetrics;
  metricsLoading: boolean;
  coachHasPremium: boolean;
  premiumLoading: boolean;
}

const riskZoneConfig = {
  optimal: { label: 'Optimal', icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
  undertrained: { label: 'Undertrained', icon: Minus, bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  warning: { label: 'Warning', icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
  danger: { label: 'Bahaya', icon: XCircle, bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
};

export function AthleteDashboardSection({
  athleteId,
  athleteData,
  dailyMetrics,
  acwrData,
  currentMetrics,
  metricsLoading,
  coachHasPremium,
  premiumLoading,
}: AthleteDashboardSectionProps) {
  const { entries: readinessEntries, loading: readinessLoading } = useReadiness(athleteId);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch test results for this athlete
  useEffect(() => {
    const fetchTests = async () => {
      setTestLoading(true);
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('test_date', { ascending: false })
        .limit(20);

      if (!error && data) setTestResults(data);
      setTestLoading(false);
    };
    fetchTests();
  }, [athleteId]);

  const latestReadiness = useMemo(() => {
    if (readinessEntries.length === 0) return null;
    const latest = readinessEntries[0];
    return {
      score: latest.readiness_score ? Number(latest.readiness_score) : 0,
      date: latest.check_date,
      vjToday: latest.vj_today,
      hrToday: latest.hr_today,
    };
  }, [readinessEntries]);

  const readinessTrend = useMemo(() => {
    if (readinessEntries.length < 2) return null;
    const curr = Number(readinessEntries[0].readiness_score || 0);
    const prev = Number(readinessEntries[1].readiness_score || 0);
    return curr - prev;
  }, [readinessEntries]);

  const latestTestsByCategory = useMemo(() => {
    const map = new Map<string, any>();
    testResults.forEach(t => {
      if (!map.has(t.category)) map.set(t.category, t);
    });
    return Array.from(map.values());
  }, [testResults]);

  // Overall condition score (simple heuristic)
  const conditionScore = useMemo(() => {
    let score = 50;
    // ACWR contribution
    if (acwrData.riskZone === 'optimal') score += 20;
    else if (acwrData.riskZone === 'warning') score += 5;
    else if (acwrData.riskZone === 'danger') score -= 15;
    else score += 10; // undertrained

    // Readiness contribution
    if (latestReadiness) {
      if (latestReadiness.score >= 2.0) score += 20;
      else if (latestReadiness.score >= 1.8) score += 10;
      else if (latestReadiness.score >= 1.6) score += 0;
      else score -= 10;
    }

    // Form contribution
    if (currentMetrics.form > 5) score += 10;
    else if (currentMetrics.form > -10) score += 5;
    else score -= 5;

    return Math.max(0, Math.min(100, score));
  }, [acwrData, latestReadiness, currentMetrics]);

  const conditionLabel = conditionScore >= 80 ? 'Sangat Baik' : conditionScore >= 60 ? 'Baik' : conditionScore >= 40 ? 'Cukup' : 'Perlu Perhatian';
  const conditionColor = conditionScore >= 80 ? 'text-emerald-600' : conditionScore >= 60 ? 'text-blue-600' : conditionScore >= 40 ? 'text-amber-600' : 'text-red-600';

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const recentScores = readinessEntries.slice(0, 5).map(e => Number(e.readiness_score || 0).toFixed(2));
      const { data, error } = await supabase.functions.invoke('analyze-athlete-condition', {
        body: {
          athleteData,
          trainingMetrics: currentMetrics,
          readinessData: latestReadiness ? {
            latest: latestReadiness,
            recentScores,
          } : null,
          acwrData,
          testResults: latestTestsByCategory.map(t => ({
            item: t.item, category: t.category, value: Number(t.value), unit: t.unit, score: t.score,
          })),
        },
      });

      if (error) throw error;
      setAiAnalysis(data.analysis);
    } catch (err: any) {
      setAiError(err.message || 'Gagal menganalisis');
    } finally {
      setAiLoading(false);
    }
  };

  const isLoading = metricsLoading || readinessLoading || testLoading || premiumLoading;
  const zone = riskZoneConfig[acwrData.riskZone];
  const ZoneIcon = zone.icon;
  const readinessInfo = latestReadiness ? getReadinessInfo(latestReadiness.score) : null;

  return (
    <div className="space-y-6">
      {/* Condition Overview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={athleteData.photo_url || undefined} alt={athleteData.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {athleteData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-bold">{athleteData.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {athleteData.sport && athleteData.position 
                      ? `${athleteData.sport} • ${athleteData.position}` 
                      : athleteData.sport || format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}
                  </p>
                </div>
              </div>
              {!isLoading && (
                <div className="text-right">
                  <p className={cn("text-2xl font-black tabular-nums", conditionColor)}>{conditionScore}</p>
                  <p className={cn("text-xs font-semibold", conditionColor)}>{conditionLabel}</p>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* ACWR */}
                <Card className={cn("border shadow-sm", zone.border)}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={cn("h-4 w-4", zone.text)} />
                      <span className="text-[11px] font-medium text-muted-foreground">ACWR</span>
                    </div>
                    <p className="text-xl font-black tabular-nums">{acwrData.acwr.toFixed(2)}</p>
                    <Badge className={cn("mt-1.5 text-[10px]", zone.bg, zone.text, "border-none")}> 
                      <ZoneIcon className="h-3 w-3 mr-1" />{zone.label}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Fitness */}
                <Card className="border shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-[11px] font-medium text-muted-foreground">Fitness</span>
                    </div>
                    <p className="text-xl font-black tabular-nums">{currentMetrics.fitness}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">CTL (42 hari)</p>
                  </CardContent>
                </Card>

                {/* Fatigue */}
                <Card className="border shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-[11px] font-medium text-muted-foreground">Fatigue</span>
                    </div>
                    <p className="text-xl font-black tabular-nums">{currentMetrics.fatigue}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">ATL (7 hari)</p>
                  </CardContent>
                </Card>

                {/* Readiness */}
                <Card className="border shadow-sm">
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      <span className="text-[11px] font-medium text-muted-foreground">Readiness</span>
                    </div>
                    {latestReadiness ? (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-xl font-black tabular-nums">{latestReadiness.score.toFixed(2)}</p>
                          {readinessTrend !== null && (
                            readinessTrend > 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> :
                            readinessTrend < 0 ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> :
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        {readinessInfo && (
                          <Badge className={cn("mt-1.5 text-[10px] border-none text-white", readinessInfo.color)}>
                            {readinessInfo.label}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada data</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Form & Training Load Summary */}
      {!isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form Status */}
            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold">Status Form (TSB)</span>
                </div>
                <p className={cn(
                  "text-3xl font-black tabular-nums",
                  currentMetrics.form > 5 ? "text-emerald-600" :
                  currentMetrics.form > -10 ? "text-blue-600" :
                  currentMetrics.form > -30 ? "text-amber-600" : "text-red-600"
                )}>
                  {currentMetrics.form > 0 ? '+' : ''}{currentMetrics.form}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentMetrics.form > 5 ? '🌟 Fresh & siap untuk sesi intensitas tinggi' :
                   currentMetrics.form > -10 ? '✅ Kondisi normal, sesuai program' :
                   currentMetrics.form > -30 ? '⚠️ Mulai kelelahan, kurangi intensitas' :
                   '🚨 Fatigue tinggi, prioritaskan istirahat'}
                </p>
              </CardContent>
            </Card>

            {/* Biomotor Summary */}
            <Card className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Profil Biomotor</span>
                </div>
                {latestTestsByCategory.length > 0 ? (
                  <div className="space-y-2">
                    {latestTestsByCategory.slice(0, 4).map(t => (
                      <div key={t.category} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate mr-2">{t.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${(t.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums w-6 text-right">{t.score}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada data tes</p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* AI Analysis */}
      {coachHasPremium && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/5 to-blue-500/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-violet-600" />
                  </div>
                  Analisis AI
                  <Badge className="bg-gradient-to-r from-violet-500 to-blue-500 text-white text-[10px] border-none">
                    Premium
                  </Badge>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAIAnalysis}
                  disabled={aiLoading || isLoading}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", aiLoading && "animate-spin")} />
                  {aiAnalysis ? 'Refresh' : 'Analisis'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {aiLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : aiError ? (
                <div className="text-center py-6">
                  <XCircle className="h-8 w-8 mx-auto text-destructive/50 mb-2" />
                  <p className="text-sm text-destructive">{aiError}</p>
                  <Button size="sm" variant="ghost" onClick={handleAIAnalysis} className="mt-2 text-xs">
                    Coba Lagi
                  </Button>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-headings:font-bold prose-p:text-sm prose-li:text-sm prose-p:leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: markdownToHtml(aiAnalysis) }} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Analisis Kondisi dengan AI</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                    Dapatkan insight dan rekomendasi berdasarkan semua data monitoring Anda
                  </p>
                  <Button onClick={handleAIAnalysis} size="sm" className="gap-2">
                    <Brain className="h-4 w-4" /> Mulai Analisis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Simple markdown to HTML
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return match;
    });
}
