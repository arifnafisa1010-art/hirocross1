import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type TestResult = Tables<'test_results'>;
export type TestResultInsert = TablesInsert<'test_results'>;

export function useTestResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    if (!user) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false });
    
    if (error) {
      toast.error('Gagal memuat hasil tes');
      console.error(error);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  const addResult = async (result: Omit<TestResultInsert, 'user_id'>) => {
    if (!user) {
      toast.error('Anda harus login!');
      return null;
    }

    const { data, error } = await supabase
      .from('test_results')
      .insert({ ...result, user_id: user.id })
      .select()
      .single();
    
    if (error) {
      toast.error('Gagal menyimpan hasil tes');
      console.error(error);
      return null;
    }
    
    setResults(prev => [data, ...prev]);
    toast.success('Hasil tes berhasil disimpan!');
    return data;
  };

  const deleteResult = async (id: string) => {
    const { error } = await supabase
      .from('test_results')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Gagal menghapus hasil tes');
      console.error(error);
      return false;
    }
    
    setResults(prev => prev.filter(r => r.id !== id));
    toast.success('Hasil tes berhasil dihapus!');
    return true;
  };

  useEffect(() => {
    fetchResults();
  }, [user?.id]);

  return {
    results,
    loading,
    addResult,
    deleteResult,
    refetch: fetchResults,
  };
}
