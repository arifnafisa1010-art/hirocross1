import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Diamond, Activity, TrendingUp, Zap, Users, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PremiumPricingPackages } from '@/components/PremiumPricingPackages';
import { ProgramMonitoringSection } from '@/components/ProgramMonitoringSection';
import { supabase } from '@/integrations/supabase/client';
import { DaySession, Exercise, PlanWeek, Mesocycle } from '@/types/training';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ProgramOption {
  id: string;
  name: string;
  start_date: string;
  match_date: string;
  plan_data: any;
  mesocycles: any;
  target_strength: number | null;
  target_speed: number | null;
  target_endurance: number | null;
  target_technique: number | null;
  target_tactic: number | null;
}

export default function MonitoringPlan() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPremium, loading: premiumLoading } = usePremiumAccess();
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programSessions, setProgramSessions] = useState<Record<string, DaySession>>({});
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Fetch programs
  useEffect(() => {
    if (!user) return;
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      const { data, error } = await supabase
        .from('training_programs')
        .select('id, name, start_date, match_date, plan_data, mesocycles, target_strength, target_speed, target_endurance, target_technique, target_tactic')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPrograms(data);
        if (data.length > 0) {
          setSelectedProgramId(data[0].id);
        }
      }
      setLoadingPrograms(false);
    };
    fetchPrograms();
  }, [user]);

  // Load sessions when program changes
  useEffect(() => {
    if (!selectedProgramId) return;
    const loadSessions = async () => {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('program_id', selectedProgramId);
      
      if (!error && data) {
        const sessionsMap: Record<string, DaySession> = {};
        data.forEach(s => {
          sessionsMap[s.session_key] = {
            warmup: s.warmup || '',
            exercises: (s.exercises as unknown as Exercise[]) || [],
            cooldown: s.cooldown || '',
            recovery: s.recovery || '',
            int: (s.intensity as DaySession['int']) || 'Rest',
            isDone: s.is_done || false,
          };
        });
        setProgramSessions(sessionsMap);
      }
      setLoadingSessions(false);
    };
    loadSessions();
  }, [selectedProgramId]);

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const externalSetup = selectedProgram ? {
    planName: selectedProgram.name,
    startDate: selectedProgram.start_date,
    matchDate: selectedProgram.match_date,
    targets: {
      strength: selectedProgram.target_strength || 100,
      speed: selectedProgram.target_speed || 1000,
      endurance: selectedProgram.target_endurance || 10,
      technique: selectedProgram.target_technique || 500,
      tactic: selectedProgram.target_tactic || 200,
    },
  } : undefined;

  const externalPlanData = selectedProgram?.plan_data as PlanWeek[] | undefined;

  if (authLoading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show pricing packages if no premium access
  if (!hasPremium) {
    return (
      <>
        <Helmet>
          <title>Monitoring Plan - HiroCross Plan</title>
        </Helmet>
        <div className="min-h-screen bg-muted/30 p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Monitoring Plan
                  <PremiumBadge size="sm" />
                </h1>
                <p className="text-sm text-muted-foreground">Akses premium diperlukan</p>
              </div>
            </div>

            {/* Feature Preview Card */}
            <Card className="relative overflow-hidden border-amber-300">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-400/10 pointer-events-none" />
              <CardHeader className="text-center">
                <Diamond className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <CardTitle className="text-xl">Fitur Premium Monitoring Plan</CardTitle>
                <CardDescription className="text-base mt-2">
                  Analisis efektifitas program latihan dan performa atlet secara menyeluruh
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Activity className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-medium">Analisis Program</p>
                      <p className="text-xs text-muted-foreground">Evaluasi efektifitas latihan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Progress Tracking</p>
                      <p className="text-xs text-muted-foreground">Pantau perkembangan performa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                    <Zap className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="font-medium">Compliance Index</p>
                      <p className="text-xs text-muted-foreground">Tingkat kepatuhan program</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Packages */}
            <PremiumPricingPackages />

            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Aplikasi
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Monitoring Plan - HiroCross Plan</title>
      </Helmet>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Monitoring Plan
                  <PremiumBadge size="sm" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Analisis efektifitas program latihan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/monitoring-atlet')} className="gap-2">
                <Users className="w-4 h-4" />
                Monitoring Atlet
              </Button>
            </div>
          </div>

          {/* Program Selector */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Program Latihan:</span>
                </div>
                {loadingPrograms ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : programs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada program. Buat program di halaman Setup.</p>
                ) : (
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                    <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                      <SelectTrigger className="w-full sm:w-[320px]">
                        <SelectValue placeholder="Pilih program..." />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({format(new Date(p.start_date), 'MMM yyyy', { locale: localeId })})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProgram && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(selectedProgram.start_date), 'dd MMM yyyy', { locale: localeId })} — {format(new Date(selectedProgram.match_date), 'dd MMM yyyy', { locale: localeId })}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {(externalPlanData as any[])?.length || 0} minggu
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Program Monitoring Content */}
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data program...</span>
            </div>
          ) : (
            <ProgramMonitoringSection 
              externalPlanData={externalPlanData}
              externalSessions={programSessions}
              externalSetup={externalSetup}
            />
          )}
        </div>
      </div>
    </>
  );
}
