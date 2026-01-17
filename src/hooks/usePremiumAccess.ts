import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PremiumAccessData {
  id: string;
  user_id: string;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

interface PremiumRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  request_date: string;
  processed_by: string | null;
  processed_at: string | null;
  payment_proof_url: string | null;
  notes: string | null;
}

export function usePremiumAccess() {
  const { user } = useAuth();
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [premiumData, setPremiumData] = useState<PremiumAccessData | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PremiumRequest | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setHasPremium(false);
      return;
    }

    const checkPremiumAccess = async () => {
      try {
        // Check if user has premium access via database function
        const { data: hasAccess, error: accessError } = await supabase.rpc(
          'has_premium_access', 
          { _user_id: user.id }
        );

        if (accessError) {
          console.error('Error checking premium access:', accessError);
          setHasPremium(false);
        } else {
          setHasPremium(hasAccess === true);
        }

        // Get premium access details if exists
        const { data: premiumInfo, error: premiumError } = await supabase
          .from('premium_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!premiumError && premiumInfo) {
          setPremiumData(premiumInfo);
        }

        // Check for pending request
        const { data: requestData, error: requestError } = await supabase
          .from('premium_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (!requestError && requestData) {
          setPendingRequest(requestData as PremiumRequest);
        }

      } catch (error) {
        console.error('Error checking premium access:', error);
        setHasPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumAccess();
  }, [user]);

  const requestPremiumAccess = async (paymentProofUrl?: string, notes?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('premium_requests')
        .insert({
          user_id: user.id,
          payment_proof_url: paymentProofUrl || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPendingRequest(data as PremiumRequest);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error requesting premium access:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    hasPremium,
    loading,
    premiumData,
    pendingRequest,
    requestPremiumAccess,
  };
}

// Admin hook for managing premium access
export function usePremiumAccessAdmin() {
  const [premiumUsers, setPremiumUsers] = useState<PremiumAccessData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPremiumData = async () => {
    setLoading(true);
    try {
      // Load all premium access records
      const { data: premiumData, error: premiumError } = await supabase
        .from('premium_access')
        .select('*')
        .order('granted_at', { ascending: false });

      if (premiumError) throw premiumError;
      setPremiumUsers(premiumData || []);

      // Load all pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('premium_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (requestsError) throw requestsError;
      setPendingRequests(requestsData as PremiumRequest[] || []);

    } catch (error) {
      console.error('Error loading premium data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPremiumData();
  }, []);

  const grantPremiumAccess = async (
    userId: string, 
    grantedBy: string, 
    expiresAt?: string,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('premium_access')
        .insert({
          user_id: userId,
          granted_by: grantedBy,
          expires_at: expiresAt || null,
          notes: notes || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      await loadPremiumData();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error granting premium access:', error);
      return { success: false, error: error.message };
    }
  };

  const revokePremiumAccess = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('premium_access')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;
      await loadPremiumData();
      return { success: true };
    } catch (error: any) {
      console.error('Error revoking premium access:', error);
      return { success: false, error: error.message };
    }
  };

  const processRequest = async (
    requestId: string, 
    status: 'approved' | 'rejected',
    processedBy: string,
    userId: string
  ) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('premium_requests')
        .update({
          status,
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, grant premium access
      if (status === 'approved') {
        await grantPremiumAccess(userId, processedBy);
      }

      await loadPremiumData();
      return { success: true };
    } catch (error: any) {
      console.error('Error processing request:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    premiumUsers,
    pendingRequests,
    loading,
    loadPremiumData,
    grantPremiumAccess,
    revokePremiumAccess,
    processRequest,
  };
}
