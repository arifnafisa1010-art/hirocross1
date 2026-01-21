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
    gender: string = 'M',
    age: number = 20
  ): number => {
    // Find matching norm with age range
    const norm = norms.find(n => 
      n.category === category && 
      n.item === item && 
      (n.gender === gender || n.gender === 'ALL') &&
      (n.age_min || 0) <= age &&
      (n.age_max || 99) >= age
    );

    if (!norm) {
      // Try to find norm without age constraint
      const fallbackNorm = norms.find(n => 
        n.category === category && 
        n.item === item && 
        (n.gender === gender || n.gender === 'ALL')
      );
      
      if (!fallbackNorm) {
        // Default to score 3 if no norm found
        return 3;
      }
      
      return calculateScoreFromNorm(fallbackNorm, value);
    }

    return calculateScoreFromNorm(norm, value);
  };

  const calculateScoreFromNorm = (norm: TestNorm, value: number): number => {
    const lowerIsBetter = norm.lower_is_better || false;
    
    // Get threshold values - use null-safe checks
    const s1 = norm.score_1_max;
    const s2 = norm.score_2_max;
    const s3 = norm.score_3_max;
    const s4 = norm.score_4_max;
    const s5 = norm.score_5_max;

    if (lowerIsBetter) {
      // For time-based tests (lower is better)
      // Lower time = better score
      // s1 = worst (highest time), s5 = best (lowest time)
      // But database stores: score_1_max = max time for score 1 (worst)
      // So we check from score 1 (worst/highest time) down to score 5 (best/lowest time)
      
      // For lower_is_better: if value >= threshold, it's in that score range or worse
      // Score 1 (worst): value >= s1 (slowest times)
      // Score 5 (best): value < s2 (fastest times)
      
      if (s1 !== null && s1 !== undefined && value >= s1) return 1;
      if (s2 !== null && s2 !== undefined && value >= s2) return 2;
      if (s3 !== null && s3 !== undefined && value >= s3) return 3;
      if (s4 !== null && s4 !== undefined && value >= s4) return 4;
      return 5; // Fastest times get score 5
    } else {
      // For distance/reps tests (higher is better)
      // Higher value = better score
      // s5 = best (highest value), s1 = worst (lowest value)
      
      if (s5 !== null && s5 !== undefined && value >= s5) return 5;
      if (s4 !== null && s4 !== undefined && value >= s4) return 4;
      if (s3 !== null && s3 !== undefined && value >= s3) return 3;
      if (s2 !== null && s2 !== undefined && value >= s2) return 2;
      return 1;
    }
  };

  const getNormForItem = (
    category: string, 
    item: string, 
    gender: string = 'M',
    age: number = 20
  ): TestNorm | null => {
    // First try to find norm with matching age range
    const normWithAge = norms.find(n => 
      n.category === category && 
      n.item === item && 
      (n.gender === gender || n.gender === 'ALL') &&
      (n.age_min || 0) <= age &&
      (n.age_max || 99) >= age
    );
    
    if (normWithAge) return normWithAge;
    
    // Fallback to any matching norm
    return norms.find(n => 
      n.category === category && 
      n.item === item && 
      (n.gender === gender || n.gender === 'ALL')
    ) || null;
  };

  // Get all unique categories from norms
  const getCategories = (): string[] => {
    const categories = [...new Set(norms.map(n => n.category))];
    return categories.sort();
  };

  // Get all items for a category
  const getItemsForCategory = (category: string): string[] => {
    const items = [...new Set(
      norms
        .filter(n => n.category === category)
        .map(n => n.item)
    )];
    return items.sort();
  };

  // Get unit for an item
  const getUnitForItem = (category: string, item: string): string => {
    const norm = norms.find(n => n.category === category && n.item === item);
    return norm?.unit || '';
  };

  useEffect(() => {
    fetchNorms();
  }, []);

  return {
    norms,
    loading,
    calculateScore,
    getNormForItem,
    getCategories,
    getItemsForCategory,
    getUnitForItem,
    refetch: fetchNorms,
  };
}
