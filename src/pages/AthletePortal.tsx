import { Helmet } from 'react-helmet-async';
import { useAthletePortal } from '@/hooks/useAthletePortal';
import { useAthleteTrainingLoads } from '@/hooks/useAthleteTrainingLoads';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, Trophy, User, LogOut, Dumbbell, BarChart3, Activity } from 'lucide-react';
import { format, parseISO, differenceInWeeks } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { AthleteCalendarView } from '@/components/AthleteCalendarView';
import { AthletePerformanceDashboard } from '@/components/AthletePerformanceDashboard';

const AthletePortal = () => {
  const { athleteProfile, programs, loading, isAthlete } = useAthletePortal();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch training loads for the current athlete
  const { 
    dailyMetrics, 
    acwrData, 
    currentMetrics, 
    loading: metricsLoading 
  } = useAthleteTrainingLoads(athleteProfile?.id || null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAthlete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Portal Atlet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Akun Anda ({user?.email}) belum terhubung dengan profil atlet. 
              Hubungi pelatih Anda untuk menghubungkan akun.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCurrentWeek = (program: any) => {
    const startDate = parseISO(program.start_date);
    const now = new Date();
    return Math.max(1, differenceInWeeks(now, startDate) + 1);
  };

  const getCurrentPhase = (program: any) => {
    const currentWeek = getCurrentWeek(program);
    const planData = program.plan_data || [];
    const currentPlan = planData.find((p: any) => p.wk === currentWeek);
    return currentPlan?.fase || '-';
  };

  return (
    <>
      <Helmet>
        <title>Portal Atlet - HiroCross</title>
        <meta name="description" content="Portal atlet untuk melihat program latihan dan performa" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-bold text-lg">Portal Atlet</h1>
                <p className="text-sm text-muted-foreground">{athleteProfile?.name}</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Performance Dashboard */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Dashboard Performa
            </h2>
            <AthletePerformanceDashboard
              dailyMetrics={dailyMetrics}
              acwrData={acwrData}
              currentMetrics={currentMetrics}
              loading={metricsLoading}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Nama</span>
                </div>
                <p className="font-bold">{athleteProfile?.name}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Cabor</span>
                </div>
                <p className="font-bold">{athleteProfile?.sport || '-'}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Program</span>
                </div>
                <p className="font-bold">{programs.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase">Posisi</span>
                </div>
                <p className="font-bold">{athleteProfile?.position || '-'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Programs */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Program Latihan Saya
            </h2>

            {programs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Belum ada program latihan yang di-assign ke Anda.
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Hubungi pelatih untuk mendapatkan program latihan.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {programs.map((program) => {
                  const currentWeek = getCurrentWeek(program);
                  const currentPhase = getCurrentPhase(program);
                  const totalWeeks = program.plan_data?.length || 0;
                  const remainingWeeks = Math.max(0, totalWeeks - currentWeek + 1);

                  return (
                    <Card key={program.id} className="overflow-hidden">
                      {/* Program Header */}
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <h3 className="font-bold text-lg">{program.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(program.start_date), 'd MMM yyyy', { locale: id })} - {format(parseISO(program.match_date), 'd MMM yyyy', { locale: id })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-bold">
                              Minggu {currentWeek}
                            </Badge>
                            <Badge variant="outline" className="border-primary text-primary">
                              {currentPhase}
                            </Badge>
                          </div>
                        </div>

                        {/* Quick stats row */}
                        <div className="grid grid-cols-4 gap-3 mt-4">
                          <div className="bg-background/80 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Total Minggu</p>
                            <p className="font-bold text-primary">{totalWeeks}</p>
                          </div>
                          <div className="bg-background/80 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Minggu ke-</p>
                            <p className="font-bold text-primary">{currentWeek}</p>
                          </div>
                          <div className="bg-background/80 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Sisa Minggu</p>
                            <p className="font-bold text-primary">{remainingWeeks}</p>
                          </div>
                          <div className="bg-background/80 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Kompetisi</p>
                            <p className="font-bold text-primary">{program.competitions?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <Tabs defaultValue="calendar" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="calendar" className="gap-1">
                              <Calendar className="h-4 w-4" />
                              <span className="hidden sm:inline">Kalender</span>
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="gap-1">
                              <BarChart3 className="h-4 w-4" />
                              <span className="hidden sm:inline">Jadwal</span>
                            </TabsTrigger>
                            <TabsTrigger value="competitions" className="gap-1">
                              <Trophy className="h-4 w-4" />
                              <span className="hidden sm:inline">Kompetisi</span>
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="calendar" className="mt-4">
                            <AthleteCalendarView 
                              programId={program.id}
                              programName={program.name}
                              startDate={program.start_date}
                              planData={program.plan_data || []}
                              competitions={program.competitions || []}
                              athleteId={athleteProfile?.id}
                            />
                          </TabsContent>

                          <TabsContent value="schedule" className="mt-4">
                            <div className="rounded-lg border overflow-hidden">
                              <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-muted">
                                    <tr>
                                      <th className="text-left p-3 font-semibold">Minggu</th>
                                      <th className="text-left p-3 font-semibold">Meso</th>
                                      <th className="text-left p-3 font-semibold">Fase</th>
                                      <th className="text-left p-3 font-semibold">Vol</th>
                                      <th className="text-left p-3 font-semibold">Int</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(program.plan_data || []).map((week: any) => {
                                      const isCurrentWeek = week.wk === currentWeek;
                                      return (
                                        <tr 
                                          key={week.wk} 
                                          className={`border-t ${isCurrentWeek ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                        >
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">W{week.wk}</span>
                                              {isCurrentWeek && (
                                                <Badge variant="default" className="text-[10px] px-1.5">
                                                  Sekarang
                                                </Badge>
                                              )}
                                            </div>
                                          </td>
                                          <td className="p-3 text-muted-foreground">{week.meso}</td>
                                          <td className="p-3">
                                            <Badge variant="outline" className="text-xs">
                                              {week.fase}
                                            </Badge>
                                          </td>
                                          <td className="p-3">{week.vol}%</td>
                                          <td className="p-3">{week.int}%</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="competitions" className="mt-4">
                            {(program.competitions || []).length === 0 ? (
                              <div className="text-center py-8">
                                <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-muted-foreground">
                                  Tidak ada kompetisi terjadwal
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {(program.competitions || []).map((comp: any, idx: number) => {
                                  const compDate = parseISO(comp.date);
                                  const isPast = compDate < new Date();
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                                        isPast ? 'bg-muted/50 opacity-60' : 'bg-gradient-to-r from-yellow-500/10 to-transparent'
                                      }`}
                                    >
                                      <div className={`p-2 rounded-full ${isPast ? 'bg-muted' : 'bg-yellow-500/20'}`}>
                                        <Trophy className={`h-5 w-5 ${isPast ? 'text-muted-foreground' : 'text-yellow-500'}`} />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold">{comp.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {format(compDate, 'EEEE, d MMMM yyyy', { locale: id })}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {comp.isPrimary && (
                                          <Badge variant="default" className="bg-yellow-500 text-yellow-950">
                                            Utama
                                          </Badge>
                                        )}
                                        {isPast && (
                                          <Badge variant="outline">Selesai</Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AthletePortal;
