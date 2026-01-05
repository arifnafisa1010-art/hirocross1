import { useState, useEffect, useRef, useCallback } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Trophy, Star } from 'lucide-react';
import { Mesocycle, PlanWeek, Competition, TrainingBlocks } from '@/types/training';
import { cn } from '@/lib/utils';

const emptyTrainingBlocks: TrainingBlocks = {
  kekuatan: [],
  kecepatan: [],
  dayaTahan: [],
  fleksibilitas: [],
  mental: [],
};

export function SetupSection() {
  const { 
    setup, 
    setSetup, 
    generatePlan, 
    setActiveTab, 
    mesocycles, 
    planData, 
    setMesocycles, 
    setPlanData, 
    setTotalWeeks,
    competitions,
    setCompetitions,
    addCompetition,
    removeCompetition,
    updateCompetition,
    setTrainingBlocks,
    selectedAthleteIds,
  } = useTrainingStore();
  
  const { programs, currentProgram, loading, saveProgram, loadProgram, deleteProgram, createNewProgram } = useTrainingPrograms();
  const [saving, setSaving] = useState(false);
  const [loadingProgramId, setLoadingProgramId] = useState<string | null>(null);
  const lastLoadedProgramIdRef = useRef<string | null>(null);

  // Load current program data into store when program changes - with deduplication
  useEffect(() => {
    if (currentProgram && currentProgram.id !== lastLoadedProgramIdRef.current) {
      lastLoadedProgramIdRef.current = currentProgram.id;
      
      setSetup({
        planName: currentProgram.name,
        startDate: currentProgram.start_date,
        matchDate: currentProgram.match_date,
        targets: {
          strength: Number(currentProgram.target_strength) || 100,
          speed: Number(currentProgram.target_speed) || 1000,
          endurance: Number(currentProgram.target_endurance) || 10,
          technique: Number(currentProgram.target_technique) || 500,
          tactic: Number(currentProgram.target_tactic) || 200,
        }
      });
      
      const loadedMeso = currentProgram.mesocycles as unknown as Mesocycle[] || [];
      const loadedPlan = currentProgram.plan_data as unknown as PlanWeek[] || [];
      const loadedCompetitions = (currentProgram as any).competitions as unknown as Competition[] || [];
      const loadedBlocks = (currentProgram as any).training_blocks as unknown as TrainingBlocks || emptyTrainingBlocks;
      
      setMesocycles(loadedMeso);
      setPlanData(loadedPlan);
      setCompetitions(loadedCompetitions.length > 0 ? loadedCompetitions : [
        { id: crypto.randomUUID(), name: 'Kompetisi Utama', date: currentProgram.match_date, isPrimary: true }
      ]);
      setTrainingBlocks(loadedBlocks);
      
      if (loadedPlan.length > 0) {
        setTotalWeeks(loadedPlan.length);
      }
    }
  }, [currentProgram?.id, setSetup, setMesocycles, setPlanData, setCompetitions, setTrainingBlocks, setTotalWeeks]);

  const handleGenerate = async () => {
    if (!setup.startDate || competitions.length === 0) {
      toast.error('Pilih tanggal mulai dan minimal satu kompetisi!');
      return;
    }

    const start = new Date(setup.startDate);
    const hasValidCompetition = competitions.some(c => {
      const compDate = new Date(c.date);
      return compDate > start;
    });
    
    if (!hasValidCompetition) {
      toast.error('Minimal satu kompetisi harus setelah tanggal mulai!');
      return;
    }

    generatePlan();
    setActiveTab('annual');
    toast.success('Program berhasil di-generate!');
  };

  const handleSave = async () => {
    if (!setup.startDate || competitions.length === 0) {
      toast.error('Lengkapi data program terlebih dahulu!');
      return;
    }

    const { trainingBlocks } = useTrainingStore.getState();
    setSaving(true);
    await saveProgram(setup, mesocycles, planData, competitions, selectedAthleteIds, trainingBlocks);
    setSaving(false);
  };

  const handleLoadProgram = useCallback(async (programId: string) => {
    if (loadingProgramId || programId === currentProgram?.id) return;
    
    setLoadingProgramId(programId);
    try {
      await loadProgram(programId);
    } finally {
      setLoadingProgramId(null);
    }
  }, [loadingProgramId, currentProgram?.id, loadProgram]);

  const handleNewProgram = useCallback(() => {
    lastLoadedProgramIdRef.current = null;
    createNewProgram();
    setSetup({
      planName: 'New Program',
      startDate: '',
      matchDate: '',
      targets: {
        strength: 100,
        speed: 1000,
        endurance: 10,
        technique: 500,
        tactic: 200,
      }
    });
    setMesocycles([]);
    setPlanData([]);
    setTotalWeeks(0);
    setCompetitions([]);
    setTrainingBlocks(emptyTrainingBlocks);
  }, [createNewProgram, setSetup, setMesocycles, setPlanData, setTotalWeeks, setCompetitions, setTrainingBlocks]);

  const handleDeleteProgram = async (programId: string) => {
    if (confirm('Yakin ingin menghapus program ini?')) {
      await deleteProgram(programId);
    }
  };

  const setPrimaryCompetition = (id: string) => {
    competitions.forEach(c => {
      if (c.id === id) {
        updateCompetition(c.id, { isPrimary: true });
      } else if (c.isPrimary) {
        updateCompetition(c.id, { isPrimary: false });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Program List */}
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Program Tersimpan</CardTitle>
          <Button onClick={handleNewProgram} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Program Baru
          </Button>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada program tersimpan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {programs.map(program => (
                <div 
                  key={program.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    currentProgram?.id === program.id 
                      ? 'border-accent bg-accent/10' 
                      : 'border-border hover:border-accent/50',
                    loadingProgramId === program.id && 'opacity-50 pointer-events-none'
                  )}
                  onClick={() => handleLoadProgram(program.id)}
                >
                  <div className="flex items-start justify-between relative">
                    {loadingProgramId === program.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{program.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(program.start_date).toLocaleDateString('id-ID')} - {new Date(program.match_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id); }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Form */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-extrabold">
            {currentProgram ? 'Edit Program' : 'Parameter Master Program'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            
            <div className="col-span-2">
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
          </div>

          {/* Competitions Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Daftar Kompetisi
              </Label>
              <Button onClick={addCompetition} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kompetisi
              </Button>
            </div>
            
            {competitions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                Belum ada kompetisi. Tambahkan minimal satu kompetisi.
              </p>
            ) : (
              <div className="space-y-3">
                {competitions.map((comp, index) => (
                  <div 
                    key={comp.id} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      comp.isPrimary ? "border-accent bg-accent/5" : "border-border"
                    )}
                  >
                    <button
                      onClick={() => setPrimaryCompetition(comp.id)}
                      className={cn(
                        "p-1.5 rounded-full transition-colors",
                        comp.isPrimary 
                          ? "text-accent bg-accent/20" 
                          : "text-muted-foreground hover:text-accent"
                      )}
                      title={comp.isPrimary ? "Kompetisi Utama" : "Jadikan Kompetisi Utama"}
                    >
                      <Star className={cn("w-4 h-4", comp.isPrimary && "fill-current")} />
                    </button>
                    
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={comp.name}
                        onChange={(e) => updateCompetition(comp.id, { name: e.target.value })}
                        placeholder="Nama Kompetisi"
                        className="h-9"
                      />
                      <Input
                        type="date"
                        value={comp.date}
                        onChange={(e) => updateCompetition(comp.id, { date: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    
                    <button 
                      onClick={() => removeCompetition(comp.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      disabled={competitions.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target Section */}
          <div>
            <Label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-3 block">
              Target Biomotor
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Kekuatan (kg)</Label>
                <Input
                  type="number"
                  value={setup.targets.strength}
                  onChange={(e) => setSetup({ 
                    targets: { ...setup.targets, strength: Number(e.target.value) }
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Kecepatan (m)</Label>
                <Input
                  type="number"
                  value={setup.targets.speed}
                  onChange={(e) => setSetup({ 
                    targets: { ...setup.targets, speed: Number(e.target.value) }
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Daya Tahan (km)</Label>
                <Input
                  type="number"
                  value={setup.targets.endurance}
                  onChange={(e) => setSetup({ 
                    targets: { ...setup.targets, endurance: Number(e.target.value) }
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Teknik (rep)</Label>
                <Input
                  type="number"
                  value={setup.targets.technique}
                  onChange={(e) => setSetup({ 
                    targets: { ...setup.targets, technique: Number(e.target.value) }
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Taktik (rep)</Label>
                <Input
                  type="number"
                  value={setup.targets.tactic}
                  onChange={(e) => setSetup({ 
                    targets: { ...setup.targets, tactic: Number(e.target.value) }
                  })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              className="flex-1 h-12 text-sm font-extrabold bg-primary hover:bg-primary/90"
              disabled={competitions.length === 0}
            >
              GENERATE PROGRAM
            </Button>
            <Button
              onClick={handleSave}
              variant="outline"
              className="h-12 text-sm font-extrabold px-8"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SIMPAN'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
