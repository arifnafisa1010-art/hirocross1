import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Trash2, Loader2, Calendar, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';

interface TrainingLoad {
  id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  session_load: number;
  training_type: string;
  notes: string | null;
}

interface TrainingLoadHistoryProps {
  loads: TrainingLoad[];
  loading: boolean;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const TRAINING_TYPE_LABELS: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } } = {
  training: { label: 'Latihan', variant: 'default' },
  match: { label: 'Pertandingan', variant: 'destructive' },
  recovery: { label: 'Recovery', variant: 'outline' },
  strength: { label: 'Kekuatan', variant: 'secondary' },
  conditioning: { label: 'Conditioning', variant: 'secondary' },
  technical: { label: 'Teknik', variant: 'secondary' },
  tactical: { label: 'Taktik', variant: 'secondary' },
};

export function TrainingLoadHistory({ loads, loading, onDelete }: TrainingLoadHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await onDelete(id);
    if (result.success) {
      toast.success('Data berhasil dihapus');
    } else {
      toast.error('Gagal menghapus: ' + result.error);
    }
    setDeletingId(null);
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (rpe <= 5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (rpe <= 7) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  // Get last 14 days of data
  const recentLoads = loads.slice(-14).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Riwayat Training Load
        </CardTitle>
        <CardDescription>
          14 sesi terakhir yang tercatat
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : recentLoads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada data training load</p>
            <p className="text-sm mt-1">Mulai input data sesi latihan Anda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-center">Durasi</TableHead>
                  <TableHead className="text-center">RPE</TableHead>
                  <TableHead className="text-center">Load</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLoads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">
                      {format(new Date(load.session_date), 'dd MMM yyyy', { locale: idLocale })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={TRAINING_TYPE_LABELS[load.training_type]?.variant || 'default'}>
                        {TRAINING_TYPE_LABELS[load.training_type]?.label || load.training_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {load.duration_minutes} min
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRpeColor(load.rpe)}`}>
                        {load.rpe}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {load.session_load} AU
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === load.id}
                        onClick={() => handleDelete(load.id)}
                      >
                        {deletingId === load.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
