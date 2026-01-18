import { useState } from 'react';
import { useAthletes } from '@/hooks/useAthletes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, User, ChevronRight, Loader2 } from 'lucide-react';
import { Athlete } from '@/hooks/useAthletes';

interface AthleteMonitoringSelectorProps {
  selectedAthleteId: string | null;
  onSelectAthlete: (athlete: Athlete | null) => void;
}

export function AthleteMonitoringSelector({ 
  selectedAthleteId, 
  onSelectAthlete 
}: AthleteMonitoringSelectorProps) {
  const { athletes, loading } = useAthletes();
  const [showList, setShowList] = useState(false);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);

  if (loading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (athletes.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Belum ada atlet. Tambahkan atlet di menu Tes & Pengukuran.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Pilih Atlet untuk Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Selection Display */}
        <div 
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
          onClick={() => setShowList(!showList)}
        >
          {selectedAthlete ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedAthlete.photo_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedAthlete.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedAthlete.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAthlete.sport || 'Olahraga tidak diset'} • {selectedAthlete.position || '-'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Pilih Atlet</p>
                <p className="text-xs text-muted-foreground">Klik untuk memilih atlet</p>
              </div>
            </div>
          )}
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showList ? 'rotate-90' : ''}`} />
        </div>

        {/* Athletes List */}
        {showList && (
          <ScrollArea className="h-[200px] border rounded-lg">
            <div className="p-2 space-y-1">
              {/* Option to view own data (coach) */}
              <Button
                variant={selectedAthleteId === null ? 'secondary' : 'ghost'}
                className="w-full justify-start h-auto py-2"
                onClick={() => {
                  onSelectAthlete(null);
                  setShowList(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Data Saya (Coach)</p>
                    <p className="text-xs text-muted-foreground">Lihat data training load sendiri</p>
                  </div>
                </div>
                {selectedAthleteId === null && (
                  <Badge className="ml-auto bg-primary/20 text-primary">Aktif</Badge>
                )}
              </Button>

              {/* Athletes */}
              {athletes.map((athlete) => (
                <Button
                  key={athlete.id}
                  variant={selectedAthleteId === athlete.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-auto py-2"
                  onClick={() => {
                    onSelectAthlete(athlete);
                    setShowList(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={athlete.photo_url || undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {athlete.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-sm">{athlete.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {athlete.sport || '-'} • {athlete.position || '-'}
                      </p>
                    </div>
                  </div>
                  {selectedAthleteId === athlete.id && (
                    <Badge className="ml-auto bg-primary/20 text-primary">Aktif</Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {athletes.length} atlet terdaftar
        </p>
      </CardContent>
    </Card>
  );
}
