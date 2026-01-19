import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore } from '@/stores/trainingStore';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Crown, Lock, Loader2, BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#fee2e2', '#fef9c3', '#dcfce7', '#f1f5f9'];

export function MonitoringSection() {
  const navigate = useNavigate();
  const { planData, sessions, setup } = useTrainingStore();
  const { hasPremium, loading: premiumLoading } = usePremiumAccess();

  const stats = useMemo(() => {
    let planCount = 0;
    let realCount = 0;
    let intensityCounts = { High: 0, Med: 0, Low: 0, Rest: 0 };
    let totalReal = { str: 0, spd: 0, end: 0, tek: 0, tak: 0 };

    Object.values(sessions).forEach((s) => {
      if (s.exercises && s.exercises.length > 0) planCount++;
      
      if (s.isDone) {
        realCount++;
        s.exercises.forEach((ex) => {
          const st = ex.set || 0;
          const rp = ex.rep || 1;
          const ld = ex.load || 0;
          
          if (ex.cat === 'strength') totalReal.str += st * rp * ld;
          if (ex.cat === 'speed') totalReal.spd += st * ld;
          if (ex.cat === 'endurance') totalReal.end += st * ld;
          if (ex.cat === 'technique') totalReal.tek += st * rp;
          if (ex.cat === 'tactic') totalReal.tak += st * rp;
        });
      }

      if (s.int) intensityCounts[s.int]++;
    });

    const index = planCount > 0 ? Math.round((realCount / planCount) * 100) : 0;

    return {
      totalWeeks: planData.length,
      planCount,
      realCount,
      index,
      intensityCounts,
      totalReal,
    };
  }, [planData, sessions]);

  // RPE progress data per week
  const rpeProgressData = useMemo(() => {
    const data: { week: string; avgRpe: number; totalDuration: number }[] = [];
    
    planData.forEach((pw) => {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      let totalRpe = 0;
      let rpeCount = 0;
      let totalDur = 0;
      
      days.forEach((d) => {
        const session = sessions[`W${pw.wk}-${d}`];
        if (session?.rpe) {
          totalRpe += session.rpe;
          rpeCount++;
        }
        if (session?.duration) {
          totalDur += session.duration;
        }
      });
      
      data.push({
        week: `W${pw.wk}`,
        avgRpe: rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 10) / 10 : 0,
        totalDuration: totalDur,
      });
    });
    
    return data;
  }, [planData, sessions]);
  const monthlyData = useMemo(() => {
    const data: { name: string; plan: number; real: number }[] = [];
    
    for (let i = 0; i < Math.ceil(planData.length / 4); i++) {
      let planSum = 0;
      let realSum = 0;
      let count = 0;

      for (let j = 0; j < 4; j++) {
        const wkIdx = i * 4 + j;
        if (planData[wkIdx]) {
          planSum += planData[wkIdx].vol;
          
          let wkDone = false;
          ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].forEach((d) => {
            if (sessions[`W${planData[wkIdx].wk}-${d}`]?.isDone) wkDone = true;
          });
          
          realSum += wkDone ? planData[wkIdx].vol : 0;
          count++;
        }
      }

      data.push({
        name: `Bulan ${i + 1}`,
        plan: count ? Math.round(planSum / count) : 0,
        real: count ? Math.round(realSum / count) : 0,
      });
    }

    return data;
  }, [planData, sessions]);

  const pieData = [
    { name: 'High', value: stats.intensityCounts.High || 1 },
    { name: 'Med', value: stats.intensityCounts.Med || 1 },
    { name: 'Low', value: stats.intensityCounts.Low || 1 },
    { name: 'Rest', value: stats.intensityCounts.Rest || 1 },
  ];

  // Component progress stats
  const componentStats = useMemo(() => {
    const targets = setup.targets;
    const real = stats.totalReal;
    
    return [
      { 
        label: 'Kekuatan', 
        icon: '🏋️', 
        target: targets.strength, 
        current: real.str, 
        unit: 'kg',
        percent: targets.strength > 0 ? Math.min(100, Math.round((real.str / targets.strength) * 100)) : 0,
      },
      { 
        label: 'Kecepatan', 
        icon: '⚡', 
        target: targets.speed, 
        current: real.spd, 
        unit: 'm',
        percent: targets.speed > 0 ? Math.min(100, Math.round((real.spd / targets.speed) * 100)) : 0,
      },
      { 
        label: 'Daya Tahan', 
        icon: '🏃', 
        target: targets.endurance, 
        current: real.end, 
        unit: 'km',
        percent: targets.endurance > 0 ? Math.min(100, Math.round((real.end / targets.endurance) * 100)) : 0,
      },
      { 
        label: 'Teknik', 
        icon: '⚽', 
        target: targets.technique, 
        current: real.tek, 
        unit: 'reps',
        percent: targets.technique > 0 ? Math.min(100, Math.round((real.tek / targets.technique) * 100)) : 0,
      },
      { 
        label: 'Taktik', 
        icon: '🧠', 
        target: targets.tactic, 
        current: real.tak, 
        unit: 'reps',
        percent: targets.tactic > 0 ? Math.min(100, Math.round((real.tak / targets.tactic) * 100)) : 0,
      },
    ];
  }, [setup.targets, stats.totalReal]);

  // Loading state for premium check
  if (premiumLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Premium paywall
  if (!hasPremium) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold">Dashboard Analisis & Efektivitas</h2>
          <PremiumBadge size="sm" />
        </div>

        {/* Blurred Preview */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10 flex items-center justify-center">
            <Card className="bg-card/95 backdrop-blur-sm border-amber-300 shadow-xl max-w-md mx-4">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Fitur Premium</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Akses Dashboard Analisis & Efektivitas untuk melihat statistik lengkap program latihan Anda
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-left text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span>Statistik Lengkap</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Tren Volume</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    <span>Distribusi Intensitas</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>Progres RPE</span>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/monitoring')}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade ke Premium
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Blurred content preview */}
          <div className="blur-sm opacity-50 pointer-events-none">
            <div className="grid grid-cols-4 gap-5 mb-6">
              <Card className="bg-primary/30">
                <CardContent className="p-5 text-center">
                  <div className="text-xs font-bold uppercase opacity-80">Total Minggu</div>
                  <div className="text-3xl font-extrabold mt-1">--</div>
                </CardContent>
              </Card>
              <Card className="bg-accent/30">
                <CardContent className="p-5 text-center">
                  <div className="text-xs font-bold uppercase opacity-80">Program Plan</div>
                  <div className="text-3xl font-extrabold mt-1">--</div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/30">
                <CardContent className="p-5 text-center">
                  <div className="text-xs font-bold uppercase opacity-80">Sesi Realisasi</div>
                  <div className="text-3xl font-extrabold mt-1">--</div>
                </CardContent>
              </Card>
              <Card className="bg-destructive/30">
                <CardContent className="p-5 text-center">
                  <div className="text-xs font-bold uppercase opacity-80">Index Kepatuhan</div>
                  <div className="text-3xl font-extrabold mt-1">--%</div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-64 bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  if (planData.length === 0) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground mb-4">Belum ada program. Silakan generate dari tab Setup.</p>
        <Button onClick={() => useTrainingStore.getState().setActiveTab('setup')}>
          Ke Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-extrabold">Dashboard Analisis & Efektivitas</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-5">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-5 text-center">
            <div className="text-xs font-bold uppercase opacity-80">Total Minggu</div>
            <div className="text-3xl font-extrabold mt-1">{stats.totalWeeks}</div>
          </CardContent>
        </Card>
        <Card className="bg-accent text-accent-foreground border-none">
          <CardContent className="p-5 text-center">
            <div className="text-xs font-bold uppercase opacity-80">Program Plan</div>
            <div className="text-3xl font-extrabold mt-1">{stats.planCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-success text-success-foreground border-none">
          <CardContent className="p-5 text-center">
            <div className="text-xs font-bold uppercase opacity-80">Sesi Realisasi</div>
            <div className="text-3xl font-extrabold mt-1">{stats.realCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive text-destructive-foreground border-none">
          <CardContent className="p-5 text-center">
            <div className="text-xs font-bold uppercase opacity-80">Index Kepatuhan</div>
            <div className="text-3xl font-extrabold mt-1">{stats.index}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Total Accumulation */}
      <Card className="bg-accent/5 border-accent/30">
        <CardHeader>
          <CardTitle className="text-accent flex items-center gap-2 text-lg">
            📈 TOTAL AKUMULASI LATIHAN (Year to Date)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {componentStats.map((stat, i) => (
              <div key={i} className="bg-card p-4 rounded-xl border border-border flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-xl">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    {stat.label}
                  </div>
                  <div className="text-lg font-extrabold">
                    {Math.round(stat.current).toLocaleString('id-ID')}
                    <span className="text-xs font-semibold text-muted-foreground ml-1">
                      {stat.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Progress */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Persentase Target Tercapai (Plan vs Real)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {componentStats.map((stat, i) => (
              <div key={i} className="bg-card p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    {stat.label}
                  </span>
                  <span className="text-lg font-extrabold text-primary">
                    {stat.percent}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000"
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-semibold text-muted-foreground">
                  <span>Real: {Math.round(stat.current)}</span>
                  <span>Target: {stat.target}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Chart */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Tren Volume: Plan vs Realisasi</CardTitle>
          <p className="text-xs text-muted-foreground">
            Membandingkan rata-rata volume rencana dengan volume yang benar-benar terlaksana.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="plan" name="Target Plan" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" name="Realisasi" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-xs font-bold text-center">
            Index 100% berarti semua sesi latihan dilaksanakan sesuai rencana.
          </div>
        </CardContent>
      </Card>

      {/* RPE Progress Chart */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">📊 Progres RPE Per Minggu</CardTitle>
          <p className="text-xs text-muted-foreground">
            Rata-rata RPE dan total durasi latihan per minggu
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rpeProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  yAxisId="left"
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'RPE', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Durasi (menit)', angle: 90, position: 'insideRight', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => [
                    name === 'avgRpe' ? `${value}` : `${value} menit`,
                    name === 'avgRpe' ? 'Rata-rata RPE' : 'Total Durasi'
                  ]}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgRpe" 
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalDuration" 
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-xs font-semibold">Rata-rata RPE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <span className="text-xs font-semibold">Total Durasi (menit)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Distribusi Intensitas (Plan)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--border))" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Tingkat Kehadiran Per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="real" 
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fill="hsl(var(--success) / 0.1)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
