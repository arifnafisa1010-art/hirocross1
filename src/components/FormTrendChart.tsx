import { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Activity, Download, Image, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ComposedChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea,
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

interface FormTrendChartProps {
  dailyMetrics: DailyMetric[];
  period: number;
}

export function FormTrendChart({ dailyMetrics, period }: FormTrendChartProps) {
  const [animatedData, setAnimatedData] = useState<DailyMetric[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

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
  const displayData = animatedData.slice(-period).map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), period <= 14 ? 'dd/MM' : 'dd', { locale: idLocale }),
    fullDate: format(parseISO(d.date), 'dd MMMM yyyy', { locale: idLocale }),
  }));

  // Calculate min/max for Y axis
  const formValues = displayData.map(d => d.form);
  const minForm = Math.min(...formValues, -40);
  const maxForm = Math.max(...formValues, 30);
  const yMin = Math.floor(minForm / 10) * 10 - 10;
  const yMax = Math.ceil(maxForm / 10) * 10 + 10;

  // Get current form status
  const currentForm = displayData.length > 0 ? displayData[displayData.length - 1].form : 0;
  const getFormStatus = (form: number) => {
    if (form <= -30) return { label: 'High Risk', color: 'text-red-600' };
    if (form <= -10) return { label: 'Optimal', color: 'text-green-600' };
    if (form <= 5) return { label: 'Grey Zone', color: 'text-gray-600' };
    if (form <= 20) return { label: 'Fresh', color: 'text-blue-600' };
    return { label: 'Transition', color: 'text-amber-600' };
  };
  const formStatus = getFormStatus(currentForm);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `form-trend-${period}hari-${format(new Date(), 'yyyy-MM-dd')}.png`;
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
      pdf.text(`Form (TSB) - ${period} Hari Terakhir`, 14, 15);
      pdf.setFontSize(10);
      pdf.text(`Tanggal Export: ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}`, 14, 22);
      
      pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, pdfHeight * 0.8);
      pdf.save(`form-trend-${period}hari-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
      const status = getFormStatus(data.form);
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Form (TSB):
              </span>
              <span className="font-medium">{data.form}</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
              <span>Status:</span>
              <span className={`font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const xAxisInterval = period <= 7 ? 0 : period <= 14 ? 1 : period <= 28 ? 2 : 4;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Form (TSB) - {period} Hari Terakhir
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Status saat ini: 
              <span className={`font-semibold ${formStatus.color}`}>
                {currentForm} ({formStatus.label})
              </span>
            </CardDescription>
          </div>
          
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
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="bg-background p-2 rounded-lg">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData}>
                <defs>
                  <linearGradient id="formLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(45, 93%, 47%)" />
                    <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
                  </linearGradient>
                </defs>
                
                {/* Background Zones - Transition (≥20) */}
                <ReferenceArea 
                  y1={20} 
                  y2={yMax} 
                  fill="hsl(45, 93%, 77%)" 
                  fillOpacity={0.5}
                />
                
                {/* Background Zones - Fresh (5 to 20) */}
                <ReferenceArea 
                  y1={5} 
                  y2={20} 
                  fill="hsl(210, 79%, 85%)" 
                  fillOpacity={0.5}
                />
                
                {/* Background Zones - Grey Zone (-10 to 5) */}
                <ReferenceArea 
                  y1={-10} 
                  y2={5} 
                  fill="hsl(0, 0%, 85%)" 
                  fillOpacity={0.5}
                />
                
                {/* Background Zones - Optimal (-30 to -10) */}
                <ReferenceArea 
                  y1={-30} 
                  y2={-10} 
                  fill="hsl(142, 76%, 80%)" 
                  fillOpacity={0.5}
                />
                
                {/* Background Zones - High Risk (≤-30) */}
                <ReferenceArea 
                  y1={yMin} 
                  y2={-30} 
                  fill="hsl(0, 84%, 85%)" 
                  fillOpacity={0.5}
                />
                
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 9 }} 
                  interval={xAxisInterval}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[yMin, yMax]}
                  tick={{ fontSize: 10 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Form, %', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference lines for zone boundaries */}
                <ReferenceLine y={20} stroke="hsl(45, 93%, 47%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                <ReferenceLine y={5} stroke="hsl(210, 79%, 55%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                <ReferenceLine y={-10} stroke="hsl(0, 0%, 60%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                <ReferenceLine y={-30} stroke="hsl(142, 76%, 36%)" strokeDasharray="3 3" strokeOpacity={0.7} />
                
                {/* Form Line */}
                <Line
                  type="monotone"
                  dataKey="form"
                  name="Form (TSB)"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: 'hsl(38, 92%, 50%)' }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Zone Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-300" />
              <span>High Risk (≤-30)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-300" />
              <span>Optimal (-30 to -10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Grey Zone (-10 to 5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-300" />
              <span>Fresh (5 to 20)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-200" />
              <span>Transition (≥20)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
