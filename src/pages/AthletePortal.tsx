import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAthletePortal } from '@/hooks/useAthletePortal';
import { useAthleteTrainingLoads } from '@/hooks/useAthleteTrainingLoads';
import { useAuth } from '@/hooks/useAuth';
import { useCoachPremiumStatus } from '@/hooks/useCoachPremiumStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, LogOut, Dumbbell, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AthleteProfileSection } from '@/components/athlete-portal/AthleteProfileSection';
import { AthletePerformanceSection } from '@/components/athlete-portal/AthletePerformanceSection';
import { AthleteTrainingCalendar } from '@/components/athlete-portal/AthleteTrainingCalendar';

type TabType = 'profil' | 'performa' | 'kalender';

const AthletePortal = () => {
  const { athleteProfile, programs, loading, isAthlete } = useAthletePortal();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profil');

  // Fetch training loads for the current athlete
  const { 
    dailyMetrics, 
    acwrData, 
    currentMetrics, 
    loading: metricsLoading 
  } = useAthleteTrainingLoads(athleteProfile?.id || null);

  // Check if the coach has premium access
  const { 
    coachHasPremium, 
    loading: premiumLoading 
  } = useCoachPremiumStatus(athleteProfile?.id || null);

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

  const tabs = [
    { id: 'profil' as const, label: 'Profil', icon: User },
    { id: 'performa' as const, label: 'Performa', icon: Activity },
    { id: 'kalender' as const, label: 'Kalender', icon: Calendar },
  ];

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

        {/* Navigation Tabs */}
        <div className="border-b bg-card sticky top-[73px] z-40">
          <div className="container mx-auto px-4">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Profile Tab */}
          {activeTab === 'profil' && athleteProfile && (
            <AthleteProfileSection
              athleteId={athleteProfile.id}
              athleteData={athleteProfile}
            />
          )}

          {/* Performance Tab */}
          {activeTab === 'performa' && (
            <AthletePerformanceSection
              dailyMetrics={dailyMetrics}
              acwrData={acwrData}
              currentMetrics={currentMetrics}
              loading={metricsLoading}
              coachHasPremium={coachHasPremium}
              premiumLoading={premiumLoading}
            />
          )}

          {/* Calendar Tab */}
          {activeTab === 'kalender' && (
            <AthleteTrainingCalendar
              programs={programs}
              athleteId={athleteProfile?.id}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default AthletePortal;
