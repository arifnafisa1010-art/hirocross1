import { Settings, Calendar, CalendarDays, ClipboardList, Crown, Activity, HeartPulse } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrainingStore } from '@/stores/trainingStore';
import { TabId } from '@/types/training';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Diamond } from 'lucide-react';

const menuItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'setup', label: 'Setup', icon: Settings },
];

const premiumTabItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'annual', label: 'Annual Plan', icon: Calendar },
  { id: 'monthly', label: 'Bulanan', icon: CalendarDays },
  { id: 'tests', label: 'Tes & Pengukuran', icon: ClipboardList },
];

const premiumRouteItems = [
  { path: '/monitoring-atlet', label: 'Monitoring Atlet', icon: Crown },
  { path: '/monitoring-plan', label: 'Monitoring Plan', icon: Activity },
  { path: '/readiness', label: 'Readiness Check', icon: HeartPulse },
];

export function AppSidebar() {
  const { activeTab, setActiveTab } = useTrainingStore();
  const { state, isMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';
  const showText = !isCollapsed || isMobile;

  const renderPremiumItem = (
    key: string,
    label: string,
    Icon: React.ElementType,
    isActive: boolean,
    onClick: () => void,
  ) => (
    <SidebarMenuItem key={key}>
      <SidebarMenuButton
        onClick={onClick}
        isActive={isActive}
        tooltip={`${label} (Premium)`}
        className={cn(
          "group/premium relative h-11 md:h-10 gap-2.5 rounded-lg px-2.5 transition-all",
          "hover:bg-amber-500/10 hover:text-amber-700",
          isActive && "data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-700 data-[active=true]:font-medium",
          isActive && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-amber-500",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0 text-amber-500")} />
        {showText && (
          <>
            <span className="flex-1 min-w-0 truncate text-[13px] md:text-sm leading-tight">{label}</span>
            <Diamond className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarContent className="gap-1 px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel
            className={cn(
              "px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
              !showText && "sr-only",
            )}
          >
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTab(item.id)}
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "relative h-11 md:h-10 gap-2.5 rounded-lg px-2.5 transition-all",
                        isActive && "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium",
                        isActive && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-primary",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {showText && <span className="flex-1 min-w-0 truncate text-[13px] md:text-sm leading-tight">{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel
            className={cn(
              "flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-amber-600",
              !showText && "sr-only",
            )}
          >
            <Diamond className="h-3 w-3 fill-amber-400 text-amber-400" />
            Premium
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {premiumTabItems.map((item) =>
                renderPremiumItem(item.id, item.label, item.icon, activeTab === item.id, () =>
                  setActiveTab(item.id),
                ),
              )}
              {premiumRouteItems.map((item) =>
                renderPremiumItem(
                  item.path,
                  item.label,
                  item.icon,
                  location.pathname === item.path,
                  () => navigate(item.path),
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
