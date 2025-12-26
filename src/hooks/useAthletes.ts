import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Athlete = Tables<'athletes'>;
export type AthleteInsert = TablesInsert<'athletes'>;

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAthletes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Gagal memuat data atlet');
      console.error(error);
    } else {
      setAthletes(data || []);
    }
    setLoading(false);
  };

  const addAthlete = async (athlete: AthleteInsert) => {
    const { data, error } = await supabase
      .from('athletes')
      .insert(athlete)
      .select()
      .single();
    
    if (error) {
      toast.error('Gagal menambahkan atlet');
      console.error(error);
      return null;
    }
    
    setAthletes(prev => [...prev, data]);
    toast.success('Atlet berhasil ditambahkan!');
    return data;
  };

  const updateAthlete = async (id: string, updates: Partial<Athlete>) => {
    const { error } = await supabase
      .from('athletes')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast.error('Gagal memperbarui atlet');
      console.error(error);
      return false;
    }
    
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    toast.success('Atlet berhasil diperbarui!');
    return true;
  };

  const deleteAthlete = async (id: string) => {
    const { error } = await supabase
      .from('athletes')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Gagal menghapus atlet');
      console.error(error);
      return false;
    }
    
    setAthletes(prev => prev.filter(a => a.id !== id));
    toast.success('Atlet berhasil dihapus!');
    return true;
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  return {
    athletes,
    loading,
    addAthlete,
    updateAthlete,
    deleteAthlete,
    refetch: fetchAthletes,
  };
}
