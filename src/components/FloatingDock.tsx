import { Save, FolderOpen, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface FloatingDockProps {
  onSave?: () => void;
  onLoad?: () => void;
}

export function FloatingDock({ onSave, onLoad }: FloatingDockProps) {
  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      toast.success('Data tersimpan ke Cloud!');
    }
  };

  const handleLoad = () => {
    if (onLoad) {
      onLoad();
    } else {
      toast.info('Data dimuat dari Cloud');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed right-5 bottom-5 flex flex-col gap-3 z-50 print:hidden">
      <button
        onClick={handleSave}
        className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-dock hover:bg-accent hover:scale-110 transition-all"
        title="Simpan ke Cloud"
      >
        <Save className="w-5 h-5" />
      </button>
      <button
        onClick={handleLoad}
        className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-dock hover:bg-accent hover:scale-110 transition-all"
        title="Muat dari Cloud"
      >
        <FolderOpen className="w-5 h-5" />
      </button>
      <button
        onClick={handlePrint}
        className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-dock hover:bg-accent hover:scale-110 transition-all"
        title="Print / PDF"
      >
        <Printer className="w-5 h-5" />
      </button>
    </div>
  );
}
