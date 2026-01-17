import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: 'admin' | 'user' | null;
}

interface ActivityLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  details: string | null;
  created_at: string;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
        if (error) throw error;
        setIsAdmin(data === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  const logActivity = async (action: string, targetUserId?: string, targetUserEmail?: string, details?: string) => {
    try {
      await supabase.rpc('log_admin_activity', {
        _action: action,
        _target_user_id: targetUserId || null,
        _target_user_email: targetUserEmail || null,
        _details: details || null
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const fetchAllUsers = async (): Promise<UserWithRole[]> => {
    try {
      // Get all users
      const { data: users, error: usersError } = await supabase.rpc('get_all_users');
      if (usersError) throw usersError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase.rpc('get_user_roles_admin');
      if (rolesError) throw rolesError;

      // Combine users with roles
      const rolesMap = new Map<string, 'admin' | 'user'>();
      roles?.forEach((r: { user_id: string; role: 'admin' | 'user' }) => {
        rolesMap.set(r.user_id, r.role);
      });

      return (users || []).map((u: { id: string; email: string; created_at: string; last_sign_in_at: string | null }) => ({
        ...u,
        role: rolesMap.get(u.id) || null
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchActivityLogs = async (limit: number = 50): Promise<ActivityLog[]> => {
    try {
      const { data, error } = await supabase.rpc('get_admin_activity_logs', { _limit: limit });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  };

  const addRole = async (userId: string, role: 'admin' | 'user', userEmail: string) => {
    const { data, error } = await supabase.rpc('admin_add_role', {
      _target_user_id: userId,
      _role: role
    });
    if (error) throw error;
    
    // Log activity
    await logActivity('ADD_ROLE', userId, userEmail, `Menambahkan role: ${role}`);
    
    return data;
  };

  const removeRole = async (userId: string, role: 'admin' | 'user', userEmail: string) => {
    const { data, error } = await supabase.rpc('admin_remove_role', {
      _target_user_id: userId,
      _role: role
    });
    if (error) throw error;
    
    // Log activity
    await logActivity('REMOVE_ROLE', userId, userEmail, `Menghapus role: ${role}`);
    
    return data;
  };

  const sendPasswordResetEmail = async (email: string, userId?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
    
    // Log activity
    await logActivity('PASSWORD_RESET', userId || null, email, 'Mengirim link reset password');
  };

  return {
    isAdmin,
    loading,
    fetchAllUsers,
    fetchActivityLogs,
    addRole,
    removeRole,
    sendPasswordResetEmail
  };
}
