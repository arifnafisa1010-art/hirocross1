import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

interface ReadinessChartProps {
  chartData: { date: string; score: number }[];
}

export function ReadinessChart({ chartData }: ReadinessChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Trend Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[1.2, 2.4]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val: number) => [val.toFixed(2), 'Readiness']} />
              <ReferenceArea y1={2.0} y2={2.4} fill="hsl(var(--chart-2))" fillOpacity={0.08} />
              <ReferenceArea y1={1.8} y2={2.0} fill="hsl(var(--chart-1))" fillOpacity={0.08} />
              <ReferenceArea y1={1.6} y2={1.8} fill="hsl(var(--chart-4))" fillOpacity={0.08} />
              <ReferenceArea y1={1.2} y2={1.6} fill="hsl(var(--chart-5))" fillOpacity={0.08} />
              <ReferenceLine y={2.0} stroke="hsl(var(--chart-2))" strokeDasharray="3 3" />
              <ReferenceLine y={1.8} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" />
              <ReferenceLine y={1.6} stroke="hsl(var(--chart-5))" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
