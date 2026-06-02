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

const menuItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'setup', label: 'Setup', icon: Settings },
  { id: 'annual', label: 'Annual Plan', icon: Calendar },
  { id: 'monthly', label: 'Bulanan', icon: CalendarDays },
  { id: 'tests', label: 'Tes & Pengukuran', icon: ClipboardList },
];

const premiumItems = [
  { path: '/monitoring-atlet', label: 'Monitoring Atlet', icon: Crown },
  { path: '/monitoring-plan', label: 'Monitoring Plan', icon: Activity },
  { path: '/readiness', label: 'Readiness Check', icon: HeartPulse },
];

export function AppSidebar() {
  const { activeTab, setActiveTab } = useTrainingStore();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                    className={cn(
                      "transition-all hover:bg-amber-500/10",
                      activeTab === item.id && "bg-amber-500/10 text-amber-600 font-medium"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {premiumItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    tooltip={item.label}
                    className={cn(
                      "transition-all hover:bg-amber-500/10",
                      location.pathname === item.path && "bg-amber-500/10 text-amber-600 font-medium"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
