import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/hirocross-logo-new.png';
import { toast } from 'sonner';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Gagal logout');
    }
  };

  return (
    <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
        <img src={logo} alt="HiroCross Logo" className="w-8 h-8 rounded-lg object-contain" />
        <h1 className="text-lg font-extrabold tracking-wider uppercase text-primary-foreground">
          Hiro Cross
        </h1>
      </div>

      <button 
        onClick={handleLogout}
        className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
      >
        LOGOUT
      </button>
    </header>
  );
}
