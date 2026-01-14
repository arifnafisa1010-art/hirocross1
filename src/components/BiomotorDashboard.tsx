import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAthletes } from '@/hooks/useAthletes';
import { useTestResults } from '@/hooks/useTestResults';
import { Loader2, Download, Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const biomotorCategories = [
  'Kekuatan',
  'Daya Tahan',
  'Kecepatan',
  'Fleksibilitas',
  'Power',
  'Kelincahan',
  'Keseimbangan',
  'Reaksi',
];

const categoryColors: Record<string, string> = {
  'Kekuatan': 'hsl(0, 70%, 50%)',
  'Daya Tahan': 'hsl(200, 70%, 50%)',
  'Kecepatan': 'hsl(45, 80%, 50%)',
  'Fleksibilitas': 'hsl(280, 60%, 50%)',
  'Power': 'hsl(340, 70%, 50%)',
  'Kelincahan': 'hsl(160, 70%, 40%)',
  'Keseimbangan': 'hsl(220, 70%, 50%)',
  'Reaksi': 'hsl(30, 80%, 50%)',
};

export function BiomotorDashboard() {
  const { athletes, loading: athletesLoading } = useAthletes();
  const { results, loading: resultsLoading } = useTestResults();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__');

  // Calculate average score per category per athlete
  const athleteScores = useMemo(() => {
    const scores: Record<string, Record<string, { total: number; count: number; avgScore: number }>> = {};
    
    athletes.forEach(athlete => {
      scores[athlete.id] = {};
      biomotorCategories.forEach(cat => {
        scores[athlete.id][cat] = { total: 0, count: 0, avgScore: 0 };
      });
    });

    results.forEach(result => {
      if (result.athlete_id && scores[result.athlete_id] && biomotorCategories.includes(result.category)) {
        scores[result.athlete_id][result.category].total += result.score;
        scores[result.athlete_id][result.category].count += 1;
      }
    });

    // Calculate averages
    Object.keys(scores).forEach(athleteId => {
      biomotorCategories.forEach(cat => {
        const data = scores[athleteId][cat];
        if (data.count > 0) {
          data.avgScore = Math.round((data.total / data.count) * 10) / 10;
        }
      });
    });

    return scores;
  }, [athletes, results]);

  // Calculate overall ranking per category
  const categoryRankings = useMemo(() => {
    const rankings: Record<string, Array<{ athleteId: string; athleteName: string; avgScore: number; rank: number }>> = {};

    biomotorCategories.forEach(category => {
      const athleteScoresList = athletes
        .map(athlete => ({
          athleteId: athlete.id,
          athleteName: athlete.name,
          avgScore: athleteScores[athlete.id]?.[category]?.avgScore || 0,
          rank: 0,
        }))
        .filter(a => a.avgScore > 0)
        .sort((a, b) => b.avgScore - a.avgScore);

      // Assign ranks
      athleteScoresList.forEach((item, index) => {
        item.rank = index + 1;
      });

      rankings[category] = athleteScoresList;
    });

    return rankings;
  }, [athletes, athleteScores]);

  // Calculate overall biomotor score per athlete
  const overallScores = useMemo(() => {
    return athletes
      .map(athlete => {
        const scores = athleteScores[athlete.id];
        let totalScore = 0;
        let categoryCount = 0;
        
        biomotorCategories.forEach(cat => {
          if (scores?.[cat]?.avgScore > 0) {
            totalScore += scores[cat].avgScore;
            categoryCount += 1;
          }
        });

        return {
          athleteId: athlete.id,
          athleteName: athlete.name,
          avgScore: categoryCount > 0 ? Math.round((totalScore / categoryCount) * 10) / 10 : 0,
          testedCategories: categoryCount,
        };
      })
      .filter(a => a.avgScore > 0)
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [athletes, athleteScores]);

  // Radar data for all athletes comparison
  const radarData = useMemo(() => {
    return biomotorCategories.map(category => {
      const dataPoint: Record<string, string | number> = { category };
      
      athletes.slice(0, 5).forEach(athlete => {
        dataPoint[athlete.name] = athleteScores[athlete.id]?.[category]?.avgScore || 0;
      });
      
      return dataPoint;
    });
  }, [athletes, athleteScores]);

  // Bar chart data for selected category or overall
  const barChartData = useMemo(() => {
    if (selectedCategory === '__all__') {
      return overallScores.slice(0, 10).map(item => ({
        name: item.athleteName.length > 10 ? item.athleteName.substring(0, 10) + '...' : item.athleteName,
        fullName: item.athleteName,
        score: item.avgScore,
        categories: item.testedCategories,
      }));
    }
    
    return (categoryRankings[selectedCategory] || []).slice(0, 10).map(item => ({
      name: item.athleteName.length > 10 ? item.athleteName.substring(0, 10) + '...' : item.athleteName,
      fullName: item.athleteName,
      score: item.avgScore,
      rank: item.rank,
    }));
  }, [selectedCategory, overallScores, categoryRankings]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-500 text-white';
    if (score >= 3.5) return 'bg-blue-500 text-white';
    if (score >= 2.5) return 'bg-yellow-500 text-white';
    if (score >= 1.5) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth * ratio - 10, imgHeight * ratio - 10);
      pdf.save(`Dashboard_Biomotor_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  if (athletesLoading || resultsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const athleteColors = [
    'hsl(var(--accent))',
    'hsl(220, 70%, 50%)',
    'hsl(340, 70%, 50%)',
    'hsl(160, 70%, 40%)',
    'hsl(45, 80%, 45%)',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Dashboard Biomotor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan hasil tes dan ranking atlet per kategori biomotor
          </p>
        </div>
        <Button onClick={handleExportPDF} disabled={exporting} className="flex items-center gap-2">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </Button>
      </div>

      <div ref={dashboardRef} className="space-y-6 bg-background p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-accent" />
                <div>
                  <div className="text-2xl font-extrabold">{athletes.length}</div>
                  <div className="text-xs text-muted-foreground">Total Atlet</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-extrabold">{results.length}</div>
                  <div className="text-xs text-muted-foreground">Total Tes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-extrabold">
                    {overallScores[0]?.athleteName?.split(' ')[0] || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">Top Performer</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Medal className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-extrabold">
                    {overallScores.length > 0 
                      ? (overallScores.reduce((sum, a) => sum + a.avgScore, 0) / overallScores.length).toFixed(1)
                      : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">Rata-rata Skor</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart - Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Perbandingan Biomotor Antar Atlet</CardTitle>
            </CardHeader>
            <CardContent>
              {athletes.length > 0 && radarData.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0)) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    {athletes.slice(0, 5).map((athlete, index) => (
                      <Radar
                        key={athlete.id}
                        name={athlete.name}
                        dataKey={athlete.name}
                        stroke={athleteColors[index]}
                        fill={athleteColors[index]}
                        fillOpacity={0.1}
                      />
                    ))}
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Belum ada data tes biomotor
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart - Ranking */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Ranking Atlet</CardTitle>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Keseluruhan</SelectItem>
                    {biomotorCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg p-2 shadow-lg">
                              <p className="font-bold text-sm">{data.fullName}</p>
                              <p className="text-xs">Skor: {data.score}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {barChartData.map((_, idx) => (
                        <Cell 
                          key={`cell-${idx}`} 
                          fill={selectedCategory === '__all__' 
                            ? 'hsl(var(--accent))' 
                            : categoryColors[selectedCategory] || 'hsl(var(--accent))'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Belum ada data ranking
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Rankings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {biomotorCategories.map(category => {
            const rankings = categoryRankings[category] || [];
            const topThree = rankings.slice(0, 3);
            
            return (
              <Card key={category} className="overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4" style={{ backgroundColor: `${categoryColors[category]}15` }}>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: categoryColors[category] }}
                    />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {topThree.length > 0 ? (
                    <div className="space-y-2">
                      {topThree.map((item) => (
                        <div 
                          key={item.athleteId} 
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {getRankIcon(item.rank)}
                            <span className="text-sm font-medium truncate max-w-[100px]">
                              {item.athleteName}
                            </span>
                          </div>
                          <Badge className={getScoreBadgeColor(item.avgScore)}>
                            {item.avgScore.toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                      {rankings.length > 3 && (
                        <div className="text-[10px] text-center text-muted-foreground pt-1">
                          +{rankings.length - 3} atlet lainnya
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Belum ada data
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overall Ranking Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Ranking Keseluruhan Biomotor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-bold">Rank</th>
                    <th className="text-left py-2 px-2 font-bold">Atlet</th>
                    {biomotorCategories.map(cat => (
                      <th key={cat} className="text-center py-2 px-1 font-bold text-[10px]">
                        {cat.slice(0, 4)}
                      </th>
                    ))}
                    <th className="text-center py-2 px-2 font-bold">Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {overallScores.slice(0, 10).map((item, index) => {
                    return (
                      <tr key={item.athleteId} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">
                          <div className="flex items-center">{getRankIcon(index + 1)}</div>
                        </td>
                        <td className="py-2 px-2 font-medium">{item.athleteName}</td>
                        {biomotorCategories.map(cat => {
                          const score = athleteScores[item.athleteId]?.[cat]?.avgScore || 0;
                          return (
                            <td key={cat} className="text-center py-2 px-1">
                              {score > 0 ? (
                                <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getScoreBadgeColor(score)}`}>
                                  {score.toFixed(1)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center py-2 px-2">
                          <Badge className={`${getScoreBadgeColor(item.avgScore)} font-bold`}>
                            {item.avgScore.toFixed(1)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {overallScores.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data hasil tes biomotor
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}