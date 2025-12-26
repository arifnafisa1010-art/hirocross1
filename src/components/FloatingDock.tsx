import { Save, FolderOpen, Printer } from 'lucide-react';
import { toast } from 'sonner';

export function FloatingDock() {
  const handleSave = () => {
    toast.success('Data tersimpan!');
  };

  const handleLoad = () => {
    toast.info('Fitur load data akan segera hadir');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed right-5 bottom-5 flex flex-col gap-3 z-50 print:hidden">
      <button
        onClick={handleSave}
        className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-dock hover:bg-accent hover:scale-110 transition-all"
        title="Simpan ke Database"
      >
        <Save className="w-5 h-5" />
      </button>
      <button
        onClick={handleLoad}
        className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-dock hover:bg-accent hover:scale-110 transition-all"
        title="Buka dari Database"
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
