import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Loader2, 
  Users, 
  Shield, 
  ShieldCheck, 
  Mail, 
  MoreHorizontal, 
  ArrowLeft,
  RefreshCw,
  UserPlus,
  UserMinus,
  History,
  KeyRound,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';
import { supabase } from '@/integrations/supabase/client';

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

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  // Check admin status directly from database
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false && user) {
      toast.error('Akses ditolak. Anda bukan admin.');
      navigate('/app', { replace: true });
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin === true) {
      loadUsers();
      loadActivityLogs();
    }
  }, [isAdmin]);

  // Admin helper functions
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
    const { data: usersData, error: usersError } = await supabase.rpc('get_all_users');
    if (usersError) throw usersError;

    const { data: roles, error: rolesError } = await supabase.rpc('get_user_roles_admin');
    if (rolesError) throw rolesError;

    const rolesMap = new Map<string, 'admin' | 'user'>();
    roles?.forEach((r: { user_id: string; role: 'admin' | 'user' }) => {
      rolesMap.set(r.user_id, r.role);
    });

    return (usersData || []).map((u: { id: string; email: string; created_at: string; last_sign_in_at: string | null }) => ({
      ...u,
      role: rolesMap.get(u.id) || null
    }));
  };

  const fetchActivityLogsData = async (limit: number = 50): Promise<ActivityLog[]> => {
    const { data, error } = await supabase.rpc('get_admin_activity_logs', { _limit: limit });
    if (error) throw error;
    return data || [];
  };

  const addRole = async (userId: string, role: 'admin' | 'user', userEmail: string) => {
    const { error } = await supabase.rpc('admin_add_role', {
      _target_user_id: userId,
      _role: role
    });
    if (error) throw error;
    await logActivity('ADD_ROLE', userId, userEmail, `Menambahkan role: ${role}`);
  };

  const removeRole = async (userId: string, role: 'admin' | 'user', userEmail: string) => {
    const { error } = await supabase.rpc('admin_remove_role', {
      _target_user_id: userId,
      _role: role
    });
    if (error) throw error;
    await logActivity('REMOVE_ROLE', userId, userEmail, `Menghapus role: ${role}`);
  };

  const sendPasswordResetEmail = async (email: string, userId?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    if (error) throw error;
    await logActivity('PASSWORD_RESET', userId || undefined, email, 'Mengirim link reset password');
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error('Gagal memuat daftar user: ' + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchActivityLogsData(100);
      setActivityLogs(data);
    } catch (error: any) {
      toast.error('Gagal memuat log aktivitas: ' + error.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSendResetEmail = async (userId: string, email: string) => {
    setActionLoading(email);
    try {
      await sendPasswordResetEmail(email, userId);
      toast.success(`Link reset password berhasil dikirim ke ${email}`);
      await loadActivityLogs();
    } catch (error: any) {
      toast.error('Gagal mengirim link reset: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAdmin = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      await addRole(userId, 'admin', email);
      toast.success(`${email} sekarang menjadi Admin`);
      await Promise.all([loadUsers(), loadActivityLogs()]);
    } catch (error: any) {
      toast.error('Gagal menambahkan role admin: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string, email: string) => {
    if (userId === user?.id) {
      toast.error('Anda tidak bisa menghapus role admin dari diri sendiri!');
      return;
    }
    
    setActionLoading(userId);
    try {
      await removeRole(userId, 'admin', email);
      toast.success(`Role admin dihapus dari ${email}`);
      await Promise.all([loadUsers(), loadActivityLogs()]);
    } catch (error: any) {
      toast.error('Gagal menghapus role admin: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PASSWORD_RESET':
        return <KeyRound className="w-4 h-4 text-amber-500" />;
      case 'ADD_ROLE':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'REMOVE_ROLE':
        return <UserMinus className="w-4 h-4 text-red-500" />;
      default:
        return <UserCog className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'PASSWORD_RESET':
        return 'Reset Password';
      case 'ADD_ROLE':
        return 'Tambah Role';
      case 'REMOVE_ROLE':
        return 'Hapus Role';
      default:
        return action;
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Admin Panel - HiroCross Plan</title>
        <meta name="description" content="Admin panel untuk mengelola user HiroCross Plan" />
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={hirocrossLogo} alt="HiroCross" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Admin Panel
                </h1>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/app')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Ke Aplikasi
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manajemen User
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Log Aktivitas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Manajemen User
                      </CardTitle>
                      <CardDescription>
                        Kelola semua user yang terdaftar di aplikasi
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={loadUsers}
                      disabled={loadingUsers}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Terdaftar</TableHead>
                            <TableHead>Login Terakhir</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">
                                {u.email}
                                {u.id === user?.id && (
                                  <Badge variant="outline" className="ml-2 text-xs">Anda</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {u.role === 'admin' ? (
                                  <Badge className="bg-primary">
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">User</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(u.created_at), 'dd MMM yyyy', { locale: idLocale })}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {u.last_sign_in_at 
                                  ? format(new Date(u.last_sign_in_at), 'dd MMM yyyy HH:mm', { locale: idLocale })
                                  : '-'
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      disabled={actionLoading === u.id || actionLoading === u.email}
                                    >
                                      {(actionLoading === u.id || actionLoading === u.email) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <MoreHorizontal className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSendResetEmail(u.id, u.email)}>
                                      <Mail className="w-4 h-4 mr-2" />
                                      Kirim Reset Password
                                    </DropdownMenuItem>
                                    {u.role === 'admin' ? (
                                      <DropdownMenuItem 
                                        onClick={() => handleRemoveAdmin(u.id, u.email)}
                                        disabled={u.id === user?.id}
                                        className="text-destructive"
                                      >
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        Hapus Role Admin
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleAddAdmin(u.id, u.email)}>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Jadikan Admin
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4" />
                      Catatan Keamanan
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Password tidak bisa dilihat karena dienkripsi (standar keamanan).</li>
                      <li>• Gunakan "Kirim Reset Password" untuk mengirim link reset ke email user.</li>
                      <li>• User akan menerima email berisi link untuk membuat password baru.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Log Aktivitas Admin
                      </CardTitle>
                      <CardDescription>
                        Riwayat semua aktivitas admin (reset password, perubahan role)
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={loadActivityLogs}
                      disabled={loadingLogs}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loadingLogs ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada aktivitas tercatat</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Aksi</TableHead>
                            <TableHead>Target User</TableHead>
                            <TableHead>Detail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: idLocale })}
                              </TableCell>
                              <TableCell className="font-medium">
                                {log.admin_email}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getActionIcon(log.action)}
                                  <span>{getActionLabel(log.action)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {log.target_user_email || '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {log.details || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
