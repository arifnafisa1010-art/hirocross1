import { useTrainingStore } from '@/stores/trainingStore';
import { TabId } from '@/types/training';
import { cn } from '@/lib/utils';
import logo from '@/assets/hirocross-logo.png';

const tabs: { id: TabId; label: string }[] = [
  { id: 'setup', label: 'SETUP' },
  { id: 'annual', label: 'ANNUAL PLAN' },
  { id: 'monthly', label: 'BULANAN' },
  { id: 'monitoring', label: 'MONITORING' },
  { id: 'tests', label: 'TES & PENGUKURAN' },
];

export function Header() {
  const { activeTab, setActiveTab } = useTrainingStore();

  return (
    <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <img src={logo} alt="HiroCross Logo" className="w-10 h-10 rounded-lg object-contain" />
        <h1 className="text-lg font-extrabold tracking-wider uppercase text-primary-foreground">
          Hiro Cross
        </h1>
      </div>

      <nav className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === tab.id
                ? "bg-primary-foreground/10 text-primary-foreground"
                : "text-muted hover:text-primary-foreground hover:bg-primary-foreground/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted text-xs font-semibold">Demo User</span>
        <button className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
          LOGOUT
        </button>
      </div>
    </header>
  );
}
