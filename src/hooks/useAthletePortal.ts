import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface AthleteProgram {
  id: string;
  name: string;
  start_date: string;
  match_date: string;
  plan_data: any[] | null;
  mesocycles: any[] | null;
  competitions: any[] | null;
}

interface AthleteProfile {
  id: string;
  name: string;
  sport: string | null;
  position: string | null;
  birth_date: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  resting_hr: number | null;
  photo_url: string | null;
}

export function useAthletePortal() {
  const { user } = useAuth();
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [programs, setPrograms] = useState<AthleteProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAthlete, setIsAthlete] = useState(false);

  const fetchAthleteData = async () => {
    if (!user) {
      setAthleteProfile(null);
      setPrograms([]);
      setIsAthlete(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Check if user is linked as an athlete
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .select('id, name, sport, position, birth_date, gender, height, weight, resting_hr, photo_url')
      .eq('linked_user_id', user.id)
      .maybeSingle();

    if (athleteError) {
      console.error('Error fetching athlete profile:', athleteError);
      setLoading(false);
      return;
    }

    if (!athleteData) {
      setIsAthlete(false);
      setLoading(false);
      return;
    }

    setAthleteProfile(athleteData);
    setIsAthlete(true);

    // Fetch programs assigned to this athlete
    const { data: programsData, error: programsError } = await supabase
      .from('training_programs')
      .select('id, name, start_date, match_date, plan_data, mesocycles, competitions')
      .contains('athlete_ids', [athleteData.id]);

    if (programsError) {
      console.error('Error fetching programs:', programsError);
      toast.error('Gagal memuat program latihan');
    } else {
      setPrograms((programsData || []).map(p => ({
        ...p,
        plan_data: (p.plan_data as any[] | null) || [],
        mesocycles: (p.mesocycles as any[] | null) || [],
        competitions: (p.competitions as any[] | null) || [],
      })));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAthleteData();
  }, [user?.id]);

  return {
    athleteProfile,
    programs,
    loading,
    isAthlete,
    refetch: fetchAthleteData,
  };
}
