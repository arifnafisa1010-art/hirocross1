import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if the coach (who owns the athlete) has premium access.
 * Used in athlete portal to show/hide premium features based on coach's subscription.
 */
export function useCoachPremiumStatus(athleteId: string | null) {
  const [coachHasPremium, setCoachHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) {
      setLoading(false);
      setCoachHasPremium(false);
      return;
    }

    const checkCoachPremiumStatus = async () => {
      try {
        // First, get the coach (user_id) who owns this athlete
        const { data: athleteData, error: athleteError } = await supabase
          .from('athletes')
          .select('user_id')
          .eq('id', athleteId)
          .maybeSingle();

        if (athleteError || !athleteData?.user_id) {
          console.error('Error fetching athlete coach:', athleteError);
          setCoachHasPremium(false);
          setLoading(false);
          return;
        }

        const coachUserId = athleteData.user_id;
        setCoachId(coachUserId);

        // Check if the coach has premium access
        const { data: hasAccess, error: accessError } = await supabase.rpc(
          'has_premium_access',
          { _user_id: coachUserId }
        );

        if (accessError) {
          console.error('Error checking coach premium access:', accessError);
          setCoachHasPremium(false);
        } else {
          setCoachHasPremium(hasAccess === true);
        }
      } catch (error) {
        console.error('Error checking coach premium status:', error);
        setCoachHasPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkCoachPremiumStatus();
  }, [athleteId]);

  return {
    coachHasPremium,
    loading,
    coachId,
  };
}
