import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAthletePortal } from '@/hooks/useAthletePortal';
import { useAthleteTrainingLoads } from '@/hooks/useAthleteTrainingLoads';
import { useAuth } from '@/hooks/useAuth';
import { useCoachPremiumStatus } from '@/hooks/useCoachPremiumStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Activity, Calendar, HeartPulse, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AthleteProfileSection } from '@/components/athlete-portal/AthleteProfileSection';
import { AthletePerformanceSection } from '@/components/athlete-portal/AthletePerformanceSection';
import { AthleteTrainingCalendar } from '@/components/athlete-portal/AthleteTrainingCalendar';
import { AthleteReadinessSection } from '@/components/athlete-portal/AthleteReadinessSection';
import { AthleteDashboardSection } from '@/components/athlete-portal/AthleteDashboardSection';
import { motion, AnimatePresence } from 'framer-motion';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';

type TabType = 'dashboard' | 'profil' | 'performa' | 'kalender' | 'readiness';

const AthletePortal = () => {
  const { athleteProfile, programs, loading, isAthlete, refetch } = useAthletePortal();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const { 
    dailyMetrics, 
    acwrData, 
    currentMetrics, 
    loading: metricsLoading 
  } = useAthleteTrainingLoads(athleteProfile?.id || null);

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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Memuat portal atlet...</p>
        </div>
      </div>
    );
  }

  if (!isAthlete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-md w-full border-none shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Portal Atlet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                Akun Anda ({user?.email}) belum terhubung dengan profil atlet. 
                Hubungi pelatih Anda untuk menghubungkan akun.
              </p>
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profil' as const, label: 'Profil', icon: User },
    { id: 'performa' as const, label: 'Performa', icon: Activity },
    { id: 'readiness' as const, label: 'Readiness', icon: HeartPulse },
    { id: 'kalender' as const, label: 'Kalender', icon: Calendar },
  ];

  const initials = athleteProfile?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AT';

  return (
    <>
      <Helmet>
        <title>Portal Atlet - HiroCross</title>
        <meta name="description" content="Portal atlet untuk melihat program latihan dan performa" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Modern Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={hirocrossLogo} alt="HiroCross" className="h-8 w-8 rounded-lg" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Portal Atlet</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={athleteProfile?.photo_url || undefined} />
                  <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{athleteProfile?.name}</span>
              </div>
              <Button onClick={handleSignOut} variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Modern Tab Navigation */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/30">
          <div className="container mx-auto px-4">
            <nav className="flex gap-0.5 -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-colors", isActive && "text-accent")} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content with animation */}
        <main className="container mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && athleteProfile && (
                <AthleteDashboardSection
                  athleteId={athleteProfile.id}
                  athleteData={{
                    name: athleteProfile.name,
                    sport: athleteProfile.sport,
                    position: athleteProfile.position,
                    weight: athleteProfile.weight,
                    height: athleteProfile.height,
                  }}
                  dailyMetrics={dailyMetrics}
                  acwrData={acwrData}
                  currentMetrics={currentMetrics}
                  metricsLoading={metricsLoading}
                  coachHasPremium={coachHasPremium}
                  premiumLoading={premiumLoading}
                />
              )}

              {activeTab === 'profil' && athleteProfile && (
                <AthleteProfileSection
                  athleteId={athleteProfile.id}
                  athleteData={athleteProfile}
                  onProfileUpdate={refetch}
                />
              )}

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

              {activeTab === 'readiness' && athleteProfile && (
                <AthleteReadinessSection
                  athleteId={athleteProfile.id}
                  athleteName={athleteProfile.name}
                  restingHr={athleteProfile.resting_hr}
                  coachHasPremium={coachHasPremium}
                  premiumLoading={premiumLoading}
                />
              )}

              {activeTab === 'kalender' && (
                <AthleteTrainingCalendar
                  programs={programs}
                  athleteId={athleteProfile?.id}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default AthletePortal;
