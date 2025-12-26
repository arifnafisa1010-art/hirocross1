import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mesocycle, PlanWeek, DaySession, ProgramSetup, TestResult, TabId } from '@/types/training';

interface TrainingStore {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  
  setup: ProgramSetup;
  setSetup: (setup: Partial<ProgramSetup>) => void;
  
  mesocycles: Mesocycle[];
  setMesocycles: (mesocycles: Mesocycle[]) => void;
  addMesocycle: () => void;
  removeMesocycle: (index: number) => void;
  updateMesocycle: (index: number, data: Partial<Mesocycle>) => void;
  
  planData: PlanWeek[];
  setPlanData: (data: PlanWeek[]) => void;
  updatePlanWeek: (index: number, data: Partial<PlanWeek>) => void;
  
  sessions: Record<string, DaySession>;
  updateSession: (key: string, session: DaySession) => void;
  
  tests: TestResult[];
  addTest: (test: TestResult) => void;
  removeTest: (id: string) => void;
  
  totalWeeks: number;
  setTotalWeeks: (weeks: number) => void;
  
  generatePlan: () => void;
}

const phaseColors = {
  'Umum': 'phase-umum',
  'Khusus': 'phase-khusus',
  'Pra-Komp': 'phase-prakomp',
  'Kompetisi': 'phase-kompetisi',
};

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      activeTab: 'setup',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
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
        const { startDate, matchDate } = state.setup;
        
        if (!startDate || !matchDate) return;
        
        const start = new Date(startDate);
        const match = new Date(matchDate);
        const totalWks = Math.ceil((match.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
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
        
        // Generate plan data
        const plan: PlanWeek[] = [];
        let wkCount = 1;
        
        newMesos.forEach((m) => {
          for (let i = 1; i <= m.weeks; i++) {
            if (wkCount > totalWks) break;
            const prog = wkCount / totalWks;
            
            let fase: PlanWeek['fase'] = prog <= 0.4 ? 'Umum' : 
                                          prog <= 0.7 ? 'Khusus' : 
                                          prog <= 0.9 ? 'Pra-Komp' : 'Kompetisi';
            
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
            
            plan.push({ wk: wkCount, meso: m.name, fase, vol: v, int });
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
