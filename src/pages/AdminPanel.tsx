import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  UserMinus
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: 'admin' | 'user' | null;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading, fetchAllUsers, addRole, removeRole, sendPasswordResetEmail } = useAdmin();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast.error('Akses ditolak. Anda bukan admin.');
      navigate('/app', { replace: true });
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

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

  const handleSendResetEmail = async (email: string) => {
    setActionLoading(email);
    try {
      await sendPasswordResetEmail(email);
      toast.success(`Link reset password berhasil dikirim ke ${email}`);
    } catch (error: any) {
      toast.error('Gagal mengirim link reset: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAdmin = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      await addRole(userId, 'admin');
      toast.success(`${email} sekarang menjadi Admin`);
      await loadUsers();
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
      await removeRole(userId, 'admin');
      toast.success(`Role admin dihapus dari ${email}`);
      await loadUsers();
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
                                <DropdownMenuItem onClick={() => handleSendResetEmail(u.email)}>
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
        </main>
      </div>
    </>
  );
}
