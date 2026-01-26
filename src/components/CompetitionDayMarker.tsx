import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flag, Dumbbell, Calendar, Trash2, Plus } from 'lucide-react';

export type DayMarkerType = 'competition' | 'test' | 'recovery' | 'deload';

export interface DayMarker {
  id: string;
  date: string;
  type: DayMarkerType;
  name: string;
}

interface CompetitionDayMarkerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existingMarkers: DayMarker[];
  onSave: (marker: Omit<DayMarker, 'id'>) => void;
  onDelete: (markerId: string) => void;
}

const markerTypeConfig: Record<DayMarkerType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  competition: { label: 'Kompetisi', icon: Trophy, color: 'bg-yellow-500 text-yellow-950' },
  test: { label: 'Tes/Pengukuran', icon: Flag, color: 'bg-blue-500 text-white' },
  recovery: { label: 'Recovery', icon: Dumbbell, color: 'bg-green-500 text-white' },
  deload: { label: 'Deload', icon: Calendar, color: 'bg-purple-500 text-white' },
};

export function CompetitionDayMarker({ 
  open, 
  onOpenChange, 
  date, 
  existingMarkers, 
  onSave, 
  onDelete 
}: CompetitionDayMarkerProps) {
  const [markerType, setMarkerType] = useState<DayMarkerType>('competition');
  const [markerName, setMarkerName] = useState('');

  const handleSave = () => {
    if (!markerName.trim()) return;
    
    onSave({
      date,
      type: markerType,
      name: markerName.trim(),
    });
    
    setMarkerName('');
    setMarkerType('competition');
  };

  const markersForDate = existingMarkers.filter(m => m.date === date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tandai Hari Penting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date display */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{date}</span>
          </div>

          {/* Existing markers for this date */}
          {markersForDate.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Penanda Saat Ini</Label>
              <div className="space-y-2">
                {markersForDate.map((marker) => {
                  const config = markerTypeConfig[marker.type];
                  const Icon = config.icon;
                  return (
                    <div 
                      key={marker.id} 
                      className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="text-sm font-medium">{marker.name}</span>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(marker.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new marker */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-xs text-muted-foreground uppercase">Tambah Penanda Baru</Label>
            
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="marker-type">Tipe</Label>
                <Select value={markerType} onValueChange={(v) => setMarkerType(v as DayMarkerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(markerTypeConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marker-name">Nama Event</Label>
                <Input
                  id="marker-name"
                  placeholder="Contoh: Kejuaraan Nasional, Tes Fisik..."
                  value={markerName}
                  onChange={(e) => setMarkerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={handleSave} disabled={!markerName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Penanda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component to display markers on calendar
export function DayMarkerBadge({ marker }: { marker: DayMarker }) {
  const config = markerTypeConfig[marker.type];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${config.color}`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="truncate max-w-[60px]">{marker.name}</span>
    </div>
  );
}
