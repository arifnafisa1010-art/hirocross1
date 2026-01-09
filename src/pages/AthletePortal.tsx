import { Helmet } from 'react-helmet-async';
import { useAthletePortal } from '@/hooks/useAthletePortal';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, Trophy, User, LogOut, Dumbbell } from 'lucide-react';
import { format, parseISO, differenceInWeeks, addWeeks, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const AthletePortal = () => {
  const { athleteProfile, programs, loading, isAthlete } = useAthletePortal();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
    const currentPlan = planData.find((p: any) => p.week === currentWeek);
    return currentPlan?.phase || '-';
  };

  return (
    <>
      <Helmet>
        <title>Portal Atlet - HiroCross</title>
        <meta name="description" content="Portal atlet untuk melihat program latihan" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
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
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Saya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{athleteProfile?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cabang Olahraga</p>
                  <p className="font-medium">{athleteProfile?.sport || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posisi</p>
                  <p className="font-medium">{athleteProfile?.position || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Programs */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Program Latihan Saya
            </h2>

            {programs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Belum ada program latihan yang di-assign ke Anda.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {programs.map((program) => (
                  <Card key={program.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{program.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(parseISO(program.start_date), 'd MMMM yyyy', { locale: id })} - {format(parseISO(program.match_date), 'd MMMM yyyy', { locale: id })}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          Minggu {getCurrentWeek(program)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="overview">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
                          <TabsTrigger value="schedule">Jadwal</TabsTrigger>
                          <TabsTrigger value="competitions">Kompetisi</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground">Fase Saat Ini</p>
                              <p className="font-semibold text-primary">{getCurrentPhase(program)}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground">Total Minggu</p>
                              <p className="font-semibold">{program.plan_data?.length || 0}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground">Sisa Minggu</p>
                              <p className="font-semibold">
                                {Math.max(0, (program.plan_data?.length || 0) - getCurrentWeek(program) + 1)}
                              </p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground">Kompetisi</p>
                              <p className="font-semibold">{program.competitions?.length || 0}</p>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="mt-4">
                          <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-background">
                                <tr className="border-b">
                                  <th className="text-left p-2">Minggu</th>
                                  <th className="text-left p-2">Fase</th>
                                  <th className="text-left p-2">Volume</th>
                                  <th className="text-left p-2">Intensitas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(program.plan_data || []).map((week: any) => {
                                  const isCurrentWeek = week.week === getCurrentWeek(program);
                                  return (
                                    <tr 
                                      key={week.week} 
                                      className={`border-b ${isCurrentWeek ? 'bg-primary/10' : ''}`}
                                    >
                                      <td className="p-2">
                                        {week.week}
                                        {isCurrentWeek && <Badge className="ml-2" variant="default">Sekarang</Badge>}
                                      </td>
                                      <td className="p-2">{week.phase}</td>
                                      <td className="p-2">{week.volume}%</td>
                                      <td className="p-2">{week.intensity}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>

                        <TabsContent value="competitions" className="mt-4">
                          {(program.competitions || []).length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              Tidak ada kompetisi terjadwal
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(program.competitions || []).map((comp: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                                >
                                  <Trophy className="h-5 w-5 text-yellow-500" />
                                  <div className="flex-1">
                                    <p className="font-medium">{comp.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(parseISO(comp.date), 'd MMMM yyyy', { locale: id })}
                                    </p>
                                  </div>
                                  {comp.isPrimary && (
                                    <Badge variant="default">Utama</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AthletePortal;
