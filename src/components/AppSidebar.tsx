import { Settings, Calendar, CalendarDays, ClipboardList, Crown, Activity } from 'lucide-react';
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
import { PremiumBadge } from '@/components/PremiumBadge';

const menuItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'setup', label: 'Setup', icon: Settings },
  { id: 'annual', label: 'Annual Plan', icon: Calendar },
  { id: 'monthly', label: 'Bulanan', icon: CalendarDays },
  { id: 'tests', label: 'Tes & Pengukuran', icon: ClipboardList },
];

const premiumItems = [
  { path: '/monitoring-atlet', label: 'Monitoring Atlet', icon: Crown },
  { path: '/monitoring-plan', label: 'Monitoring Plan', icon: Activity },
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
                      "transition-all",
                      activeTab === item.id && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Premium Section */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
            Premium
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {premiumItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    tooltip={`${item.label} (Premium)`}
                    className={cn(
                      "transition-all hover:bg-amber-500/10",
                      location.pathname === item.path && "bg-amber-500/10 text-amber-600 font-medium"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="flex items-center gap-2">
                      {item.label}
                      {!isCollapsed && <PremiumBadge size="sm" />}
                    </span>
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
