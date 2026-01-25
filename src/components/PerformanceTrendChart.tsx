import { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TrendingUp, Info, Download, Image, FileText, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface DailyMetric {
  date: string;
  load: number;
  fitness: number;
  fatigue: number;
  form: number;
}

interface PerformanceTrendChartProps {
  dailyMetrics: DailyMetric[];
}

type PeriodOption = '7' | '14' | '28' | '60';

export function PerformanceTrendChart({ dailyMetrics }: PerformanceTrendChartProps) {
  const [animatedData, setAnimatedData] = useState<DailyMetric[]>([]);
  const [period, setPeriod] = useState<PeriodOption>('28');
  const [showFitness, setShowFitness] = useState(true);
  const [showFatigue, setShowFatigue] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [showLoad, setShowLoad] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const periodDays = parseInt(period);

  // Generate baseline data if no metrics
  const metricsToUse = useMemo(() => {
    if (dailyMetrics.length > 0) return dailyMetrics;
    
    const baseline: DailyMetric[] = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      baseline.push({
        date: format(date, 'yyyy-MM-dd'),
        load: 0,
        fitness: 0,
        fatigue: 0,
        form: 0,
      });
    }
    return baseline;
  }, [dailyMetrics]);

  // Animation effect
  useEffect(() => {
    setAnimatedData([]);
    const timer = setTimeout(() => {
      setAnimatedData(metricsToUse);
    }, 100);

    return () => clearTimeout(timer);
  }, [metricsToUse]);

  // Get data based on selected period
  const displayData = animatedData.slice(-periodDays).map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), periodDays <= 14 ? 'dd/MM' : 'dd', { locale: idLocale }),
    fullDate: format(parseISO(d.date), 'dd MMMM yyyy', { locale: idLocale }),
  }));

  const hasRealData = dailyMetrics.length > 0 && dailyMetrics.some(m => m.load > 0);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `trend-performa-${period}hari-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Chart berhasil diexport ke PNG');
    } catch (error) {
      toast.error('Gagal export chart');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.setFontSize(16);
      pdf.text(`Trend Performa (${period} Hari Terakhir)`, 14, 15);
      pdf.setFontSize(10);
      pdf.text(`Tanggal Export: ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}`, 14, 22);
      
      pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, pdfHeight * 0.8);
      pdf.save(`trend-performa-${period}hari-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Chart berhasil diexport ke PDF');
    } catch (error) {
      toast.error('Gagal export chart');
    } finally {
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            {showFitness && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[hsl(142,76%,36%)]" />
                  Fitness (CTL):
                </span>
                <span className="font-medium">{data.fitness}</span>
              </div>
            )}
            {showFatigue && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
                  Fatigue (ATL):
                </span>
                <span className="font-medium">{data.fatigue}</span>
              </div>
            )}
            {showForm && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[hsl(45,93%,47%)]" />
                  Form (TSB):
                </span>
                <span className="font-medium">{data.form}</span>
              </div>
            )}
            {showLoad && (
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-primary/70" />
                  Load (AU):
                </span>
                <span className="font-medium">{data.load}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const xAxisInterval = periodDays <= 7 ? 0 : periodDays <= 14 ? 1 : periodDays <= 28 ? 2 : 4;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trend Performa ({period} Hari Terakhir)
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Monitoring Fitness, Fatigue, Form & Training Load
              {!hasRealData && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Info className="w-3 h-3" />
                  <span className="text-xs">Input data untuk melihat tren</span>
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Hari</SelectItem>
                <SelectItem value="14">14 Hari</SelectItem>
                <SelectItem value="28">28 Hari</SelectItem>
                <SelectItem value="60">60 Hari</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPNG}>
                  <Image className="w-4 h-4 mr-2" />
                  Export PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Metric Toggles */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Toggle 
            size="sm" 
            pressed={showFitness} 
            onPressedChange={setShowFitness}
            className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:bg-green-900/30 dark:data-[state=on]:text-green-400"
          >
            {showFitness ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Fitness
          </Toggle>
          <Toggle 
            size="sm" 
            pressed={showFatigue} 
            onPressedChange={setShowFatigue}
            className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-900/30 dark:data-[state=on]:text-red-400"
          >
            {showFatigue ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Fatigue
          </Toggle>
          <Toggle 
            size="sm" 
            pressed={showForm} 
            onPressedChange={setShowForm}
            className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700 dark:data-[state=on]:bg-amber-900/30 dark:data-[state=on]:text-amber-400"
          >
            {showForm ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Form
          </Toggle>
          <Toggle 
            size="sm" 
            pressed={showLoad} 
            onPressedChange={setShowLoad}
            className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
          >
            {showLoad ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            Load
          </Toggle>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="bg-background p-2 rounded-lg">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData}>
                <defs>
                  <linearGradient id="loadBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 9 }} 
                  interval={xAxisInterval}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 10 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'CTL/ATL/TSB', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Load (AU)', angle: 90, position: 'insideRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <ReferenceLine yAxisId="left" y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                
                {/* Training Load as Bars */}
                {showLoad && (
                  <Bar
                    yAxisId="right"
                    dataKey="load"
                    name="Training Load"
                    fill="url(#loadBarGradient)"
                    radius={[2, 2, 0, 0]}
                    opacity={0.7}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
                
                {/* Fitness Line */}
                {showFitness && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="fitness"
                    name="Fitness (CTL)"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
                
                {/* Fatigue Line */}
                {showFatigue && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="fatigue"
                    name="Fatigue (ATL)"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
                
                {/* Form Line */}
                {showForm && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="form"
                    name="Form (TSB)"
                    stroke="hsl(45, 93%, 47%)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend Explanation */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded-lg text-center transition-opacity ${showFitness ? 'bg-green-100 dark:bg-green-900/30' : 'opacity-40 bg-muted'}`}>
              <span className="font-semibold text-green-600 dark:text-green-400">Fitness (CTL)</span>
              <p className="text-muted-foreground">Rata-rata 42 hari</p>
            </div>
            <div className={`p-2 rounded-lg text-center transition-opacity ${showFatigue ? 'bg-red-100 dark:bg-red-900/30' : 'opacity-40 bg-muted'}`}>
              <span className="font-semibold text-red-600 dark:text-red-400">Fatigue (ATL)</span>
              <p className="text-muted-foreground">Rata-rata 7 hari</p>
            </div>
            <div className={`p-2 rounded-lg text-center transition-opacity ${showForm ? 'bg-amber-100 dark:bg-amber-900/30' : 'opacity-40 bg-muted'}`}>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Form (TSB)</span>
              <p className="text-muted-foreground">Fitness - Fatigue</p>
            </div>
            <div className={`p-2 rounded-lg text-center transition-opacity ${showLoad ? 'bg-primary/10' : 'opacity-40 bg-muted'}`}>
              <span className="font-semibold text-primary">Training Load</span>
              <p className="text-muted-foreground">Beban harian (AU)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
