import { useTrainingStore } from '@/stores/trainingStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function SetupSection() {
  const { setup, setSetup, generatePlan, setActiveTab } = useTrainingStore();

  const handleGenerate = () => {
    if (!setup.startDate || !setup.matchDate) {
      toast.error('Pilih tanggal mulai dan target tanding!');
      return;
    }

    const start = new Date(setup.startDate);
    const match = new Date(setup.matchDate);
    
    if (match <= start) {
      toast.error('Tanggal target harus setelah tanggal mulai!');
      return;
    }

    generatePlan();
    setActiveTab('annual');
    toast.success('Program berhasil di-generate!');
  };

  return (
    <div className="animate-fade-in">
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-extrabold">Parameter Master Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Nama Program
              </Label>
              <Input
                value={setup.planName}
                onChange={(e) => setSetup({ planName: e.target.value })}
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Mulai Tanggal
              </Label>
              <Input
                type="date"
                value={setup.startDate}
                onChange={(e) => setSetup({ startDate: e.target.value })}
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Target Tanding
              </Label>
              <Input
                type="date"
                value={setup.matchDate}
                onChange={(e) => setSetup({ matchDate: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Kekuatan (kg)
              </Label>
              <Input
                type="number"
                value={setup.targets.strength}
                onChange={(e) => setSetup({ 
                  targets: { ...setup.targets, strength: Number(e.target.value) }
                })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Kecepatan (m)
              </Label>
              <Input
                type="number"
                value={setup.targets.speed}
                onChange={(e) => setSetup({ 
                  targets: { ...setup.targets, speed: Number(e.target.value) }
                })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Daya Tahan (km)
              </Label>
              <Input
                type="number"
                value={setup.targets.endurance}
                onChange={(e) => setSetup({ 
                  targets: { ...setup.targets, endurance: Number(e.target.value) }
                })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Teknik (rep)
              </Label>
              <Input
                type="number"
                value={setup.targets.technique}
                onChange={(e) => setSetup({ 
                  targets: { ...setup.targets, technique: Number(e.target.value) }
                })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                Taktik (rep)
              </Label>
              <Input
                type="number"
                value={setup.targets.tactic}
                onChange={(e) => setSetup({ 
                  targets: { ...setup.targets, tactic: Number(e.target.value) }
                })}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full mt-6 h-12 text-sm font-extrabold bg-primary hover:bg-primary/90"
          >
            GENERATE PROGRAM
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
