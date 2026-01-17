import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import hirocrossLogo from '@/assets/hirocross-logo-new.png';

// Function to check if user is admin
async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Function to auto-link athlete when user logs in and check if they are an athlete
async function checkAndLinkAthlete(userId: string, email: string): Promise<boolean> {
  try {
    // First, try to auto-link if there's a pending link
    // Use the secure view that only exposes the id (no sensitive data)
    const { data: pendingAthlete } = await supabase
      .from('athletes_pending_links')
      .select('id')
      .maybeSingle();
    
    if (pendingAthlete) {
      // Link the athlete to this user using the UPDATE policy
      // The policy allows updating only records where pending_link_email matches user's email
      await supabase
        .from('athletes')
        .update({ linked_user_id: userId, pending_link_email: null })
        .eq('id', pendingAthlete.id);
      
      return true; // User is now linked as athlete
    }
    
    // Check if user is already linked as an athlete
    const { data: linkedAthlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('linked_user_id', userId)
      .maybeSingle();
    
    return !!linkedAthlete;
  } catch (error) {
    console.error('Error checking/linking athlete:', error);
    return false;
  }
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);

  // Function to determine user role and redirect
  const handleUserRedirect = useCallback(async (userId: string, userEmail: string) => {
    if (checkingRole) return;
    setCheckingRole(true);
    
    try {
      // Check if admin first
      const isAdmin = await checkIsAdmin(userId);
      
      if (isAdmin) {
        console.log('User is admin, redirecting to /admin');
        navigate('/admin', { replace: true });
        return;
      }
      
      // Check if athlete
      const isAthlete = await checkAndLinkAthlete(userId, userEmail);
      
      if (isAthlete) {
        console.log('User is athlete, redirecting to /athlete');
        navigate('/athlete', { replace: true });
      } else {
        console.log('User is regular user, redirecting to /app');
        navigate('/app', { replace: true });
      }
    } catch (error) {
      console.error('Error during redirect:', error);
      navigate('/app', { replace: true });
    } finally {
      setCheckingRole(false);
    }
  }, [checkingRole, navigate]);

  // Check user role and redirect accordingly
  useEffect(() => {
    if (user && !loading && !checkingRole) {
      handleUserRedirect(user.id, user.email || '');
    }
  }, [user, loading, checkingRole, handleUserRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email wajib diisi!');
      return;
    }

    setSubmitting(true);

    if (mode === 'reset') {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Link reset password telah dikirim ke email Anda.');
        setMode('login');
      }
      setSubmitting(false);
      return;
    }

    if (!password) {
      toast.error('Password wajib diisi!');
      setSubmitting(false);
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        toast.error('Password minimal 6 karakter!');
        setSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Password tidak cocok!');
        setSubmitting(false);
        return;
      }
      
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email sudah terdaftar. Silakan login.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Akun berhasil dibuat! Silakan login.');
        setMode('login');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email atau password salah!');
        } else {
          toast.error(error.message);
        }
      }
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login - HiroCross Plan</title>
        <meta name="description" content="Login atau daftar untuk mengakses HiroCross Training Periodization App" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <img 
              src={hirocrossLogo} 
              alt="HiroCross Logo" 
              className="w-20 h-20 mx-auto object-contain"
            />
            <div>
              <CardTitle className="text-2xl font-extrabold">HIROCROSS PLAN</CardTitle>
              <CardDescription className="mt-2">
                {mode === 'login' && 'Login untuk akses program latihan Anda'}
                {mode === 'signup' && 'Daftar akun baru untuk memulai'}
                {mode === 'reset' && 'Masukkan email untuk reset password'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="mt-1.5"
                  autoComplete="email"
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="mt-1.5"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="mt-1.5"
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-12 font-extrabold" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' && 'LOGIN'}
                    {mode === 'signup' && 'DAFTAR'}
                    {mode === 'reset' && 'KIRIM LINK RESET'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm">
              {mode === 'login' && (
                <>
                  <p>
                    Belum punya akun?{' '}
                    <button 
                      onClick={() => setMode('signup')} 
                      className="text-accent font-bold hover:underline"
                    >
                      Daftar
                    </button>
                  </p>
                  <button 
                    onClick={() => setMode('reset')} 
                    className="text-muted-foreground hover:underline"
                  >
                    Lupa password?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <p>
                  Sudah punya akun?{' '}
                  <button 
                    onClick={() => setMode('login')} 
                    className="text-accent font-bold hover:underline"
                  >
                    Login
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <button 
                  onClick={() => setMode('login')} 
                  className="text-accent font-bold hover:underline"
                >
                  Kembali ke Login
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
