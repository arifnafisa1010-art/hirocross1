import { Settings, Calendar, CalendarDays, BarChart3, ClipboardList } from 'lucide-react';
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
  { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
  { id: 'tests', label: 'Tes & Pengukuran', icon: ClipboardList },
];

export function AppSidebar() {
  const { activeTab, setActiveTab } = useTrainingStore();
  const { state } = useSidebar();
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
      </SidebarContent>
    </Sidebar>
  );
}
