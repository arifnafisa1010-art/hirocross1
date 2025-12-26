import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type TestNorm = Tables<'test_norms'>;

export function useTestNorms() {
  const [norms, setNorms] = useState<TestNorm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNorms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('test_norms')
      .select('*');
    
    if (error) {
      console.error('Error fetching norms:', error);
    } else {
      setNorms(data || []);
    }
    setLoading(false);
  };

  const calculateScore = (
    category: string, 
    item: string, 
    value: number, 
    gender: string = 'M'
  ): number => {
    // Find matching norm
    const norm = norms.find(n => 
      n.category === category && 
      n.item === item && 
      (n.gender === gender || n.gender === 'ALL')
    );

    if (!norm) {
      // Default to score 3 if no norm found
      return 3;
    }

    const lowerIsBetter = norm.lower_is_better || false;
    const s1 = norm.score_1_max || 0;
    const s2 = norm.score_2_max || 0;
    const s3 = norm.score_3_max || 0;
    const s4 = norm.score_4_max || 0;
    const s5 = norm.score_5_max || 999;

    if (lowerIsBetter) {
      // For time-based tests (lower is better)
      if (value <= s5) return 5;
      if (value <= s4) return 4;
      if (value <= s3) return 3;
      if (value <= s2) return 2;
      return 1;
    } else {
      // For distance/reps tests (higher is better)
      if (value >= s5) return 5;
      if (value >= s4) return 4;
      if (value >= s3) return 3;
      if (value >= s2) return 2;
      return 1;
    }
  };

  const getNormForItem = (category: string, item: string, gender: string = 'M'): TestNorm | null => {
    return norms.find(n => 
      n.category === category && 
      n.item === item && 
      (n.gender === gender || n.gender === 'ALL')
    ) || null;
  };

  useEffect(() => {
    fetchNorms();
  }, []);

  return {
    norms,
    loading,
    calculateScore,
    getNormForItem,
    refetch: fetchNorms,
  };
}
