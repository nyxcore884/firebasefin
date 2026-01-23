
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  FileText,
  Search,
  Database,
  Settings,
  ChevronsLeft,
  Sparkles,
  BrainCircuit,
  ShieldCheck
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { useAppState, translations } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { FinsightIcon } from '@/components/FinsightIcon';

export const AppSidebar = () => {
  const { language, isSidebarPinned, toggleSidebarPinned } = useAppState();
  const { setOpen, state } = useSidebar();
  const location = useLocation();
  const t = translations[language];
  const hoverTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSidebarPinned) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isSidebarPinned, setOpen]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (!isSidebarPinned) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isSidebarPinned) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setOpen(false);
      }, 300);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: t.dashboard, path: '/' },
    { icon: BarChart3, label: t.analysis, path: '/analysis' },
    { icon: TrendingUp, label: t.prognostics, path: '/prognostics' },
    { icon: FileText, label: t.reports, path: '/reports' },
    { icon: Search, label: t.queries, path: '/queries' },
    { icon: Database, label: t.dataHub, path: '/datahub' },
    { icon: Sparkles, label: 'Smart Canvas', path: '/workspace' },
    { icon: BrainCircuit, label: 'ML Tuning', path: '/ml-tuning' },
    { icon: ShieldCheck, label: 'AI Management', path: '/ai-management' },
  ];

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      className="glass-sidebar group !bg-transparent border-r-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarRail />

      <SidebarHeader className="p-2">
        <div className={cn("flex items-center w-full transition-all duration-300", isCollapsed ? "justify-center" : "justify-between")}>
          <div className={cn("flex items-center gap-2 overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30 shrink-0">
              <FinsightIcon />
            </div>
            <span className="text-md font-bold tracking-tight text-foreground whitespace-nowrap">FinSight</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarPinned}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <ChevronsLeft className={cn("h-5 w-5 transition-transform duration-300", !isSidebarPinned && "rotate-180")} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    tooltip={{ children: item.label }}
                    isActive={location.pathname === item.path}
                    className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)] transition-all duration-200"
                  >
                    <NavLink to={item.path} end>
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 mt-auto">
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: t.settings }}
                  isActive={location.pathname === '/settings'}
                >
                  <NavLink to="/settings">
                    <Settings className="h-5 w-5 shrink-0" />
                    <span>{t.settings}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
