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

  const addRole = async (userId: string, role: 'admin' | 'user') => {
    const { data, error } = await supabase.rpc('admin_add_role', {
      _target_user_id: userId,
      _role: role
    });
    if (error) throw error;
    return data;
  };

  const removeRole = async (userId: string, role: 'admin' | 'user') => {
    const { data, error } = await supabase.rpc('admin_remove_role', {
      _target_user_id: userId,
      _role: role
    });
    if (error) throw error;
    return data;
  };

  const sendPasswordResetEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
  };

  return {
    isAdmin,
    loading,
    fetchAllUsers,
    addRole,
    removeRole,
    sendPasswordResetEmail
  };
}
