import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mesocycle, PlanWeek, DaySession, ProgramSetup, TestResult, TabId, Competition, TrainingBlocks } from '@/types/training';

const emptyTrainingBlocks: TrainingBlocks = {
  kekuatan: [],
  kecepatan: [],
  dayaTahan: [],
  fleksibilitas: [],
  mental: [],
};

interface TrainingStore {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  
  selectedAthleteIds: string[];
  setSelectedAthleteIds: (ids: string[]) => void;
  
  setup: ProgramSetup;
  setSetup: (setup: Partial<ProgramSetup>) => void;
  
  competitions: Competition[];
  setCompetitions: (competitions: Competition[]) => void;
  addCompetition: () => void;
  removeCompetition: (id: string) => void;
  updateCompetition: (id: string, data: Partial<Competition>) => void;
  
  mesocycles: Mesocycle[];
  setMesocycles: (mesocycles: Mesocycle[]) => void;
  addMesocycle: () => void;
  removeMesocycle: (index: number) => void;
  updateMesocycle: (index: number, data: Partial<Mesocycle>) => void;
  
  planData: PlanWeek[];
  setPlanData: (data: PlanWeek[]) => void;
  updatePlanWeek: (index: number, data: Partial<PlanWeek>) => void;
  
  trainingBlocks: TrainingBlocks;
  setTrainingBlocks: (blocks: TrainingBlocks) => void;
  
  sessions: Record<string, DaySession>;
  updateSession: (key: string, session: DaySession) => void;
  
  tests: TestResult[];
  addTest: (test: TestResult) => void;
  removeTest: (id: string) => void;
  
  totalWeeks: number;
  setTotalWeeks: (weeks: number) => void;
  
  generatePlan: () => void;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      activeTab: 'setup',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      selectedAthleteIds: [],
      setSelectedAthleteIds: (ids) => set({ selectedAthleteIds: ids }),
      
      setup: {
        planName: 'Annual Plan 2025',
        startDate: '',
        matchDate: '',
        targets: {
          strength: 100,
          speed: 1000,
          endurance: 10,
          technique: 500,
          tactic: 200,
        },
      },
      setSetup: (newSetup) => set((state) => ({
        setup: { ...state.setup, ...newSetup },
      })),
      
      competitions: [],
      setCompetitions: (competitions) => set({ competitions }),
      addCompetition: () => set((state) => ({
        competitions: [...state.competitions, { 
          id: crypto.randomUUID(), 
          name: `Kompetisi ${state.competitions.length + 1}`, 
          date: state.setup.matchDate || '', 
          isPrimary: state.competitions.length === 0 
        }],
      })),
      removeCompetition: (id) => set((state) => ({
        competitions: state.competitions.filter((c) => c.id !== id),
      })),
      updateCompetition: (id, data) => set((state) => ({
        competitions: state.competitions.map((c) => c.id === id ? { ...c, ...data } : c),
      })),
      
      mesocycles: [],
      setMesocycles: (mesocycles) => set({ mesocycles }),
      addMesocycle: () => set((state) => ({
        mesocycles: [...state.mesocycles, { name: `MESO ${state.mesocycles.length + 1}`, weeks: 4 }],
      })),
      removeMesocycle: (index) => set((state) => ({
        mesocycles: state.mesocycles.filter((_, i) => i !== index),
      })),
      updateMesocycle: (index, data) => set((state) => ({
        mesocycles: state.mesocycles.map((m, i) => i === index ? { ...m, ...data } : m),
      })),
      
      planData: [],
      setPlanData: (data) => set({ planData: data }),
      updatePlanWeek: (index, data) => set((state) => ({
        planData: state.planData.map((p, i) => i === index ? { ...p, ...data } : p),
      })),
      
      trainingBlocks: emptyTrainingBlocks,
      setTrainingBlocks: (blocks) => set({ trainingBlocks: blocks }),
      
      sessions: {},
      updateSession: (key, session) => set((state) => ({
        sessions: { ...state.sessions, [key]: session },
      })),
      
      tests: [],
      addTest: (test) => set((state) => ({ tests: [...state.tests, test] })),
      removeTest: (id) => set((state) => ({
        tests: state.tests.filter((t) => t.id !== id),
      })),
      
      totalWeeks: 0,
      setTotalWeeks: (weeks) => set({ totalWeeks: weeks }),
      
      generatePlan: () => {
        const state = get();
        const { startDate } = state.setup;
        const competitions = state.competitions;
        
        if (!startDate || competitions.length === 0) return;
        
        // Find the latest competition date
        const sortedCompetitions = [...competitions].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const lastDate = sortedCompetitions[0].date;
        
        const start = new Date(startDate);
        const end = new Date(lastDate);
        const totalWks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
        if (totalWks <= 0) return;
        
        // Generate default mesocycles
        const newMesos: Mesocycle[] = [];
        let rem = totalWks;
        let c = 1;
        while (rem > 0) {
          const wk = rem >= 4 ? 4 : rem;
          newMesos.push({ name: `MESO ${c}`, weeks: wk });
          rem -= wk;
          c++;
        }
        
        // Generate plan data with competition markers
        const plan: PlanWeek[] = [];
        let wkCount = 1;
        
        newMesos.forEach((m) => {
          for (let i = 1; i <= m.weeks; i++) {
            if (wkCount > totalWks) break;
            const prog = wkCount / totalWks;
            const weekDate = new Date(start);
            weekDate.setDate(weekDate.getDate() + (wkCount - 1) * 7);
            
            // Check if any competition falls in this week
            const competitionThisWeek = competitions.find(comp => {
              const compDate = new Date(comp.date);
              const weekEnd = new Date(weekDate);
              weekEnd.setDate(weekEnd.getDate() + 6);
              return compDate >= weekDate && compDate <= weekEnd;
            });
            
            let fase: PlanWeek['fase'] = prog <= 0.4 ? 'Umum' : 
                                          prog <= 0.7 ? 'Khusus' : 
                                          prog <= 0.9 ? 'Pra-Komp' : 'Kompetisi';
            
            // Force Kompetisi phase for competition weeks
            if (competitionThisWeek) {
              fase = 'Kompetisi';
            }
            
            let v = fase === 'Umum' ? 90 : 
                    fase === 'Khusus' ? 75 : 
                    fase === 'Pra-Komp' ? 55 : 35;
            
            let int = fase === 'Umum' ? 30 : 
                      fase === 'Khusus' ? 60 : 
                      fase === 'Pra-Komp' ? 85 : 100;
            
            // Deload on last week of mesocycle
            if (i === m.weeks) {
              v -= 15;
              int -= 5;
            }
            
            plan.push({ 
              wk: wkCount, 
              meso: m.name, 
              fase, 
              vol: v, 
              int,
              competitionId: competitionThisWeek?.id
            });
            wkCount++;
          }
        });
        
        set({
          totalWeeks: totalWks,
          mesocycles: newMesos,
          planData: plan,
        });
      },
    }),
    {
      name: 'hirocross-storage',
    }
  )
);
