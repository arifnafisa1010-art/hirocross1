import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccessAdmin } from '@/hooks/usePremiumAccess';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  UserCog,
  Crown,
  Check,
  X,
  Image
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';
import { supabase } from '@/integrations/supabase/client';
import { PremiumApprovalDialog, GrantPremiumDialog } from '@/components/PremiumApprovalDialog';
import { PremiumStatsCard } from '@/components/PremiumStatsCard';

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
  const { 
    premiumUsers, 
    pendingRequests, 
    loading: premiumLoading, 
    loadPremiumData, 
    grantPremiumAccess,
    revokePremiumAccess,
    processRequest 
  } = usePremiumAccessAdmin();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [premiumActionLoading, setPremiumActionLoading] = useState<string | null>(null);
  
  // Password reset dialog state
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Premium approval dialog state
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<{ requestId: string; userId: string; email: string; notes: string | null; paymentProofUrl: string | null } | null>(null);
  const [proofImageDialog, setProofImageDialog] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [proofImageLoading, setProofImageLoading] = useState(false);
  const [grantDialog, setGrantDialog] = useState(false);
  const [grantUser, setGrantUser] = useState<{ id: string; email: string } | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

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

  // Helper to extract storage path from signed URL
  const getStoragePathFromUrl = (signedUrl: string): string | null => {
    try {
      const url = new URL(signedUrl);
      const match = url.pathname.match(/\/storage\/v1\/object\/sign\/payment-proofs\/(.+)/);
      if (match) return match[1];
      // Also handle public URLs
      const match2 = url.pathname.match(/\/storage\/v1\/object\/public\/payment-proofs\/(.+)/);
      if (match2) return match2[1];
      return null;
    } catch {
      return null;
    }
  };

  const handleViewPaymentProof = async (paymentProofUrl: string) => {
    setProofImageLoading(true);
    setProofImageDialog(true);
    setProofImageUrl(null);
    
    // Try to extract path and create a fresh signed URL
    const path = getStoragePathFromUrl(paymentProofUrl);
    if (path) {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(path, 60 * 60); // 1 hour
      if (!error && data?.signedUrl) {
        setProofImageUrl(data.signedUrl);
        setProofImageLoading(false);
        return;
      }
    }
    // Fallback: use the stored URL directly
    setProofImageUrl(paymentProofUrl);
    setProofImageLoading(false);
  };

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

  // Direct password reset via edge function
  const handleDirectPasswordReset = async () => {
    if (!resetPasswordUser) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Password tidak sama!');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }
    
    setResetLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesi tidak valid. Silakan login ulang.');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: resetPasswordUser.id,
          newPassword: newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal reset password');
      }
      
      await logActivity('PASSWORD_RESET', resetPasswordUser.id, resetPasswordUser.email, 'Reset password langsung oleh admin');
      toast.success(`Password ${resetPasswordUser.email} berhasil diubah!`);
      setResetPasswordDialog(false);
      setResetPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
      await loadActivityLogs();
    } catch (error: any) {
      toast.error('Gagal reset password: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const openResetPasswordDialog = (userId: string, email: string) => {
    setResetPasswordUser({ id: userId, email });
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordDialog(true);
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
              <TabsTrigger value="premium" className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Premium
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
                                    <DropdownMenuItem onClick={() => openResetPasswordDialog(u.id, u.email)}>
                                      <KeyRound className="w-4 h-4 mr-2" />
                                      Reset Password
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
                      <li>• Gunakan "Reset Password" untuk langsung mengubah password user.</li>
                      <li>• Admin dapat langsung membuat password baru tanpa perlu mengirim email.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Premium Management Tab */}
            <TabsContent value="premium">
              <div className="grid gap-6">
                {/* Premium Stats */}
                <PremiumStatsCard />

                {/* Pending Requests */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          Request Premium Pending
                        </CardTitle>
                        <CardDescription>
                          Daftar permintaan akses premium yang menunggu verifikasi
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => loadPremiumData()}
                        disabled={premiumLoading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${premiumLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {premiumLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : pendingRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Tidak ada request pending</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Bukti</TableHead>
                              <TableHead>Catatan</TableHead>
                              <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingRequests
                              .filter(r => r.status === 'pending')
                              .map((request) => {
                                const userEmail = users.find(u => u.id === request.user_id)?.email || request.user_id;
                                return (
                                  <TableRow key={request.id}>
                                    <TableCell className="font-medium">
                                      {userEmail}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {format(new Date(request.request_date), 'dd MMM yyyy', { locale: idLocale })}
                                    </TableCell>
                                    <TableCell>
                                      {request.payment_proof_url ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => handleViewPaymentProof(request.payment_proof_url!)}
                                        >
                                          <Image className="w-3 h-3 mr-1" />
                                          Lihat Bukti
                                        </Button>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">Tidak ada</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[150px] truncate text-sm">
                                      {request.notes || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          disabled={premiumActionLoading === request.id}
                                          onClick={() => {
                                            setApprovalRequest({
                                              requestId: request.id,
                                              userId: request.user_id,
                                              email: userEmail,
                                              notes: request.notes,
                                              paymentProofUrl: request.payment_proof_url
                                            });
                                            setApprovalDialog(true);
                                          }}
                                        >
                                          <Check className="w-4 h-4" />
                                          <span className="ml-1">Verifikasi</span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          disabled={premiumActionLoading === request.id}
                                          onClick={async () => {
                                            setPremiumActionLoading(request.id);
                                            const result = await processRequest(
                                              request.id,
                                              'rejected',
                                              user?.id || '',
                                              request.user_id
                                            );
                                            if (result.success) {
                                              toast.success('Request ditolak');
                                              await logActivity('REJECT_PREMIUM', request.user_id, userEmail, 'Menolak request premium');
                                            } else {
                                              toast.error('Gagal menolak: ' + result.error);
                                            }
                                            setPremiumActionLoading(null);
                                          }}
                                        >
                                          {premiumActionLoading === request.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <X className="w-4 h-4" />
                                          )}
                                          <span className="ml-1">Tolak</span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Premium Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      User Premium Aktif
                    </CardTitle>
                    <CardDescription>
                      Daftar user yang memiliki akses premium aktif
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {premiumLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : premiumUsers.filter(p => p.is_active).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Belum ada user premium</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Diberikan Pada</TableHead>
                              <TableHead>Berlaku Hingga</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {premiumUsers
                              .filter(p => p.is_active)
                              .map((premium) => {
                                const userEmail = users.find(u => u.id === premium.user_id)?.email || premium.user_id;
                                return (
                                  <TableRow key={premium.id}>
                                    <TableCell className="font-medium">
                                      {userEmail}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {format(new Date(premium.granted_at), 'dd MMM yyyy', { locale: idLocale })}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {premium.expires_at 
                                        ? format(new Date(premium.expires_at), 'dd MMM yyyy', { locale: idLocale })
                                        : 'Selamanya'
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-500">
                                        <Check className="w-3 h-3 mr-1" />
                                        Aktif
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={premiumActionLoading === premium.id}
                                        onClick={async () => {
                                          setPremiumActionLoading(premium.id);
                                          const result = await revokePremiumAccess(premium.user_id);
                                          if (result.success) {
                                            toast.success('Akses premium dicabut');
                                            await logActivity('REVOKE_PREMIUM', premium.user_id, userEmail, 'Mencabut akses premium');
                                          } else {
                                            toast.error('Gagal mencabut akses: ' + result.error);
                                          }
                                          setPremiumActionLoading(null);
                                        }}
                                      >
                                        {premiumActionLoading === premium.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <X className="w-4 h-4" />
                                        )}
                                        <span className="ml-1">Cabut Akses</span>
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grant Premium Manually */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Berikan Akses Premium Manual
                    </CardTitle>
                    <CardDescription>
                      Pilih user untuk memberikan akses premium secara langsung
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Status Premium</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users
                            .filter(u => !premiumUsers.some(p => p.user_id === u.id && p.is_active))
                            .map((u) => (
                              <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.email}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">Tidak Premium</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setGrantUser({ id: u.id, email: u.email });
                                      setGrantDialog(true);
                                    }}
                                  >
                                    <Crown className="w-4 h-4 text-amber-500" />
                                    <span className="ml-1">Berikan Premium</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Buat password baru untuk <strong>{resetPasswordUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialog(false)}
              disabled={resetLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleDirectPasswordReset}
              disabled={resetLoading || !newPassword || !confirmPassword}
            >
              {resetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Approval Dialog */}
      {approvalRequest && (
        <PremiumApprovalDialog
          open={approvalDialog}
          onOpenChange={(open) => {
            setApprovalDialog(open);
            if (!open) setApprovalRequest(null);
          }}
          userEmail={approvalRequest.email}
          userId={approvalRequest.userId}
          requestNotes={approvalRequest.notes}
          paymentProofUrl={approvalRequest.paymentProofUrl}
          loading={dialogLoading}
          onApprove={async (userId, expiresAt, notes) => {
            setDialogLoading(true);
            try {
              // Update request status first
              const { error: updateError } = await supabase
                .from('premium_requests')
                .update({
                  status: 'approved',
                  processed_by: user?.id,
                  processed_at: new Date().toISOString(),
                })
                .eq('id', approvalRequest.requestId);

              if (updateError) throw updateError;

              // Grant premium access with expiry
              const result = await grantPremiumAccess(
                userId,
                user?.id || '',
                expiresAt,
                notes
              );

              if (result.success) {
                toast.success(`Akses premium diberikan ke ${approvalRequest.email}`);
                await logActivity('GRANT_PREMIUM', userId, approvalRequest.email, notes);
                await loadPremiumData();
              } else {
                throw new Error(result.error);
              }

              setApprovalDialog(false);
              setApprovalRequest(null);
            } catch (error: any) {
              toast.error('Gagal memberikan akses: ' + error.message);
            } finally {
              setDialogLoading(false);
            }
          }}
        />
      )}

      {/* Grant Premium Dialog */}
      {grantUser && (
        <GrantPremiumDialog
          open={grantDialog}
          onOpenChange={(open) => {
            setGrantDialog(open);
            if (!open) setGrantUser(null);
          }}
          userEmail={grantUser.email}
          userId={grantUser.id}
          loading={dialogLoading}
          onGrant={async (userId, expiresAt, notes) => {
            setDialogLoading(true);
            try {
              const result = await grantPremiumAccess(
                userId,
                user?.id || '',
                expiresAt,
                notes
              );

              if (result.success) {
                toast.success(`Akses premium diberikan ke ${grantUser.email}`);
                await logActivity('GRANT_PREMIUM', userId, grantUser.email, notes);
              } else {
                throw new Error(result.error);
              }

              setGrantDialog(false);
              setGrantUser(null);
            } catch (error: any) {
              toast.error('Gagal memberikan akses: ' + error.message);
            } finally {
              setDialogLoading(false);
            }
          }}
        />
      )}

      {/* Payment Proof Image Dialog */}
      <Dialog open={proofImageDialog} onOpenChange={setProofImageDialog}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Bukti Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {proofImageLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : proofImageUrl ? (
              <img 
                src={proofImageUrl} 
                alt="Bukti pembayaran" 
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            ) : (
              <p className="text-center text-muted-foreground py-12">Gagal memuat gambar</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
