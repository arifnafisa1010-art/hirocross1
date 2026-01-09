import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, Unlink, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Athlete } from '@/hooks/useAthletes';
import { Badge } from '@/components/ui/badge';

interface LinkAthleteDialogProps {
  athlete: Athlete;
  onSuccess: () => void;
}

export function LinkAthleteDialog({ athlete, onSuccess }: LinkAthleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!email.trim()) {
      toast.error('Masukkan email atlet');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Format email tidak valid');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('athletes')
      .update({ pending_link_email: email.toLowerCase().trim() })
      .eq('id', athlete.id);

    if (error) {
      toast.error('Gagal menyimpan link email');
      console.error(error);
    } else {
      toast.success(`Email ${email} akan di-link otomatis saat atlet login`);
      setOpen(false);
      setEmail('');
      onSuccess();
    }

    setLoading(false);
  };

  const handleUnlink = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('athletes')
      .update({ linked_user_id: null, pending_link_email: null })
      .eq('id', athlete.id);

    if (error) {
      toast.error('Gagal memutus link');
      console.error(error);
    } else {
      toast.success('Link atlet berhasil diputus');
      setOpen(false);
      onSuccess();
    }

    setLoading(false);
  };

  const handleCancelPending = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('athletes')
      .update({ pending_link_email: null })
      .eq('id', athlete.id);

    if (error) {
      toast.error('Gagal membatalkan pending link');
      console.error(error);
    } else {
      toast.success('Pending link dibatalkan');
      setOpen(false);
      onSuccess();
    }

    setLoading(false);
  };

  const isLinked = !!athlete.linked_user_id;
  const hasPendingLink = !!athlete.pending_link_email;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          {isLinked ? (
            <Unlink className="h-4 w-4" />
          ) : hasPendingLink ? (
            <Mail className="h-4 w-4 text-yellow-500" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLinked ? 'Putuskan Link Akun' : hasPendingLink ? 'Pending Link' : 'Hubungkan Akun Atlet'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Atlet: <strong>{athlete.name}</strong>
          </p>
          
          {isLinked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">Terhubung</Badge>
              </div>
              <p className="text-sm">
                Atlet ini sudah terhubung dengan akun user. Apakah Anda ingin memutus koneksi?
              </p>
              <Button 
                onClick={handleUnlink} 
                variant="destructive" 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Memproses...' : 'Putuskan Link'}
              </Button>
            </div>
          ) : hasPendingLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Menunggu</Badge>
              </div>
              <p className="text-sm">
                Menunggu <strong>{athlete.pending_link_email}</strong> untuk mendaftar/login.
                Link akan otomatis terhubung saat atlet login dengan email tersebut.
              </p>
              <Button 
                onClick={handleCancelPending} 
                variant="outline" 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Memproses...' : 'Batalkan Pending Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Akun Atlet</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="atlet@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan email yang akan digunakan atlet untuk login. 
                  Link akan aktif otomatis saat atlet mendaftar/login dengan email ini.
                </p>
              </div>
              <Button 
                onClick={handleLink} 
                disabled={loading || !email.trim()}
                className="w-full"
              >
                {loading ? 'Memproses...' : 'Simpan Link Email'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
