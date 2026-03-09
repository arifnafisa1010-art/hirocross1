import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface ReadinessEntry {
  id: string;
  user_id: string;
  athlete_id: string | null;
  check_date: string;
  vj_today: number;
  vj_baseline: number;
  hr_today: number;
  hr_baseline: number;
  readiness_score: number | null;
  notes: string | null;
  created_at: string;
}

export function useReadiness(athleteId?: string) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReadinessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) { setEntries([]); setLoading(false); return; }
    setLoading(true);

    let query = supabase
      .from('athlete_readiness')
      .select('*')
      .eq('user_id', user.id)
      .order('check_date', { ascending: false })
      .limit(90);

    if (athleteId) {
      query = query.eq('athlete_id', athleteId);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Gagal memuat data readiness');
      console.error(error);
    } else {
      setEntries((data as unknown as ReadinessEntry[]) || []);
    }
    setLoading(false);
  };

  const addEntry = async (entry: {
    athlete_id?: string | null;
    check_date: string;
    vj_today: number;
    vj_baseline: number;
    hr_today: number;
    hr_baseline: number;
    notes?: string;
  }) => {
    if (!user) { toast.error('Anda harus login!'); return null; }

    const { data, error } = await supabase
      .from('athlete_readiness')
      .insert({ ...entry, user_id: user.id } as any)
      .select()
      .single();

    if (error) {
      toast.error('Gagal menyimpan data readiness');
      console.error(error);
      return null;
    }

    setEntries(prev => [data as unknown as ReadinessEntry, ...prev]);
    toast.success('Data readiness berhasil disimpan!');
    return data;
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('athlete_readiness')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus data');
      console.error(error);
      return false;
    }

    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Data readiness berhasil dihapus');
    return true;
  };

  useEffect(() => { fetchEntries(); }, [user?.id, athleteId]);

  return { entries, loading, addEntry, deleteEntry, refetch: fetchEntries };
}
