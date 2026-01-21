import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity, RefreshCw, Loader2, Target } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAthletes, Athlete } from '@/hooks/useAthletes';
import { useAuth } from '@/hooks/useAuth';
import { PremiumBadge } from './PremiumBadge';

interface AthleteLoadProfile {
  athleteId: string;
  athleteName: string;
  color: string;
  profile: {
    strength: number;
    conditioning: number;
    technical: number;
    tactical: number;
    recovery: number;
  };
  total: number;
}

// Training type mapping from training_type field
const TRAINING_TYPE_MAP: Record<string, keyof AthleteLoadProfile['profile']> = {
  'training': 'conditioning',
  'strength': 'strength',
  'conditioning': 'conditioning',
  'technical': 'technical',
  'tactical': 'tactical',
  'recovery': 'recovery',
  'match': 'tactical',
  'competition': 'tactical',
};

const PROFILE_LABELS: Record<string, string> = {
  strength: 'Kekuatan',
  conditioning: 'Kondisi Fisik',
  technical: 'Teknik',
  tactical: 'Taktik',
  recovery: 'Pemulihan',
};

const ATHLETE_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)', // Green
  'hsl(48, 96%, 53%)',  // Yellow
  'hsl(0, 84%, 60%)',   // Red
  'hsl(262, 83%, 58%)', // Purple
  'hsl(199, 89%, 48%)', // Blue
  'hsl(25, 95%, 53%)',  // Orange
  'hsl(173, 80%, 40%)', // Teal
];

const RPE_LOAD_MAP: Record<number, number> = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140
};

const calculateTSS = (rpe: number, duration: number): number => {
  const baseLoad = RPE_LOAD_MAP[rpe] || rpe * 10;
  return Math.round(baseLoad * (duration / 60));
};

export function TrainingLoadRadar() {
  const { user } = useAuth();
  const { athletes, loading: athletesLoading } = useAthletes();
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [athleteProfiles, setAthleteProfiles] = useState<AthleteLoadProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewDays, setViewDays] = useState(28);

  // Toggle athlete selection
  const toggleAthlete = (athleteId: string) => {
    setSelectedAthleteIds(prev => 
      prev.includes(athleteId) 
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId].slice(0, 6) // Max 6 athletes for radar
    );
  };

  // Fetch load profiles for selected athletes
  const fetchProfiles = async () => {
    if (selectedAthleteIds.length === 0 || !user) return;

    setLoading(true);
    try {
      const startDate = format(subDays(new Date(), viewDays), 'yyyy-MM-dd');
      
      const profilePromises = selectedAthleteIds.map(async (athleteId, index) => {
        const athlete = athletes.find(a => a.id === athleteId);
        if (!athlete) return null;

        const { data: loads } = await supabase
          .from('training_loads')
          .select('*')
          .eq('athlete_id', athleteId)
          .gte('session_date', startDate)
          .order('session_date', { ascending: true });

        const loadData = loads || [];
        
        // Initialize profile
        const profile: AthleteLoadProfile['profile'] = {
          strength: 0,
          conditioning: 0,
          technical: 0,
          tactical: 0,
          recovery: 0,
        };

        // Aggregate loads by training type
        loadData.forEach(l => {
          const load = l.session_load || calculateTSS(l.rpe, l.duration_minutes);
          const trainingType = l.training_type || 'training';
          const profileKey = TRAINING_TYPE_MAP[trainingType] || 'conditioning';
          profile[profileKey] += load;
        });

        // Normalize to percentage (0-100) for radar chart
        const maxLoad = Math.max(...Object.values(profile), 1);
        const normalizedProfile: AthleteLoadProfile['profile'] = {
          strength: Math.round((profile.strength / maxLoad) * 100),
          conditioning: Math.round((profile.conditioning / maxLoad) * 100),
          technical: Math.round((profile.technical / maxLoad) * 100),
          tactical: Math.round((profile.tactical / maxLoad) * 100),
          recovery: Math.round((profile.recovery / maxLoad) * 100),
        };

        return {
          athleteId,
          athleteName: athlete.name,
          color: ATHLETE_COLORS[index % ATHLETE_COLORS.length],
          profile: normalizedProfile,
          total: loadData.reduce((sum, l) => sum + (l.session_load || calculateTSS(l.rpe, l.duration_minutes)), 0),
        };
      });

      const results = await Promise.all(profilePromises);
      setAthleteProfiles(results.filter(Boolean) as AthleteLoadProfile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [selectedAthleteIds, viewDays]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (athleteProfiles.length === 0) return [];

    const categories = ['strength', 'conditioning', 'technical', 'tactical', 'recovery'];
    
    return categories.map(category => {
      const dataPoint: Record<string, string | number> = {
        category: PROFILE_LABELS[category],
      };
      
      athleteProfiles.forEach(profile => {
        dataPoint[profile.athleteName] = profile.profile[category as keyof AthleteLoadProfile['profile']];
      });
      
      return dataPoint;
    });
  }, [athleteProfiles]);

  // Calculate profile balance score
  const getBalanceScore = (profile: AthleteLoadProfile['profile']): { score: number; label: string; color: string } => {
    const values = Object.values(profile);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower std dev = more balanced
    const balanceScore = Math.max(0, 100 - stdDev);
    
    if (balanceScore >= 80) return { score: balanceScore, label: 'Sangat Seimbang', color: 'text-green-600' };
    if (balanceScore >= 60) return { score: balanceScore, label: 'Cukup Seimbang', color: 'text-amber-600' };
    return { score: balanceScore, label: 'Kurang Seimbang', color: 'text-red-600' };
  };

  if (athletesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <PremiumBadge size="sm" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Radar Profil Beban Latihan
        </CardTitle>
        <CardDescription>
          Bandingkan profil beban latihan antar atlet (strength, conditioning, technical, tactical, recovery)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Athlete Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pilih Atlet (maks. 6)</p>
            <div className="flex items-center gap-2">
              {[14, 28, 60].map(days => (
                <Button
                  key={days}
                  variant={viewDays === days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewDays(days)}
                >
                  {days}H
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchProfiles}
                disabled={loading || selectedAthleteIds.length === 0}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg max-h-28 overflow-y-auto">
            {athletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada atlet terdaftar</p>
            ) : (
              athletes.map(athlete => (
                <label
                  key={athlete.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                    selectedAthleteIds.includes(athlete.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={selectedAthleteIds.includes(athlete.id)}
                    onCheckedChange={() => toggleAthlete(athlete.id)}
                    className="hidden"
                  />
                  <span className="text-sm">{athlete.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {selectedAthleteIds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Pilih atlet untuk membandingkan profil beban latihan mereka</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Radar Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    tickCount={5}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend />
                  {athleteProfiles.map((profile, index) => (
                    <Radar
                      key={profile.athleteId}
                      name={profile.athleteName}
                      dataKey={profile.athleteName}
                      stroke={profile.color}
                      fill={profile.color}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Profile Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {athleteProfiles.map(profile => {
                const balance = getBalanceScore(profile.profile);
                return (
                  <div 
                    key={profile.athleteId}
                    className="p-3 bg-muted/50 rounded-lg border space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: profile.color }}
                      />
                      <p className="font-medium text-sm">{profile.athleteName}</p>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {Object.entries(profile.profile).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <p className="font-bold">{value}%</p>
                          <p className="text-muted-foreground text-[10px] truncate">
                            {key.slice(0, 3).toUpperCase()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Load</p>
                        <p className="font-bold">{profile.total} AU</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Keseimbangan</p>
                        <p className={`text-sm font-medium ${balance.color}`}>
                          {balance.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Profile Analysis */}
            {athleteProfiles.length > 1 && (
              <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border">
                <p className="font-medium text-sm mb-2">📊 Analisis Profil Tim</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  {(() => {
                    // Find dominant category across team
                    const categoryTotals: Record<string, number> = {
                      strength: 0, conditioning: 0, technical: 0, tactical: 0, recovery: 0
                    };
                    athleteProfiles.forEach(p => {
                      Object.entries(p.profile).forEach(([k, v]) => {
                        categoryTotals[k] += v;
                      });
                    });
                    const sortedCategories = Object.entries(categoryTotals)
                      .sort((a, b) => b[1] - a[1]);
                    const dominant = sortedCategories[0];
                    const weakest = sortedCategories[sortedCategories.length - 1];
                    
                    return (
                      <>
                        <p>• Fokus latihan tim: <strong>{PROFILE_LABELS[dominant[0]]}</strong></p>
                        <p>• Area yang perlu ditingkatkan: <strong>{PROFILE_LABELS[weakest[0]]}</strong></p>
                        <p>• Total {athleteProfiles.length} atlet dengan rata-rata {Math.round(athleteProfiles.reduce((s, p) => s + p.total, 0) / athleteProfiles.length)} AU/atlet</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}