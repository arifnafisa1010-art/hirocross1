import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReadinessZoneInfo() {
  const zones = [
    { min: '> 2.00', label: 'Sangat siap (supercompensation)', rec: 'Latihan intensitas tinggi', color: 'bg-green-100 text-green-800 border-green-200' },
    { min: '1.80 – 2.00', label: 'Kondisi normal', rec: 'Latihan sesuai program', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { min: '1.60 – 1.79', label: 'Mulai fatigue', rec: 'Kurangi intensitas', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { min: '< 1.60', label: 'Fatigue tinggi', rec: 'Recovery / rest', color: 'bg-red-100 text-red-800 border-red-200' },
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Zona Readiness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {zones.map(z => (
            <div key={z.min} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${z.color}`}>
              <span className="font-mono font-medium">{z.min}</span>
              <span>{z.label}</span>
              <span className="text-xs opacity-75">{z.rec}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
