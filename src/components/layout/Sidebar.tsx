
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Database,
  Layers,
  Sparkles,
  LogOut,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Workflow,
  Calculator,
  Network,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { useAppState } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const NavGroup = ({ group, isCollapsed, location }: any) => {
  const hasActiveChild = group.items.some((item: any) => location.pathname.startsWith(item.path));
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  return (
    <div className="flex flex-col mb-4">
      {!isCollapsed && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between px-4 py-2 w-full text-white/30 hover:text-primary transition-all rounded-xl group/trigger",
            isOpen && "text-white/60 font-black"
          )}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">
            {group.title}
          </span>
          <div className="opacity-30 group-hover/trigger:opacity-100 transition-opacity">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
      )}

      {isCollapsed && <div className="h-px bg-white/5 my-4 mx-2" />}

      <AnimatePresence initial={false}>
        {(isOpen || isCollapsed) && (
          <motion.div
            initial={isCollapsed ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-1 mt-1"
          >
            {group.items.map((item: any) => (
              <NavGroupItem key={item.label} item={item} location={location} isCollapsed={isCollapsed} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavGroupItem = ({ item, location, isCollapsed }: any) => {
  const isActive = location.pathname.startsWith(item.path);
  return (
    <NavLink
      to={item.path}
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative overflow-hidden",
        isActive
          ? "bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <item.icon size={18} className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-white/20 group-hover:text-primary")} />
      {!isCollapsed && (
        <span className="text-[11px] font-black uppercase tracking-widest truncate">
          {item.label}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="nav-active-glow"
          className="absolute right-0 w-1 h-1/2 bg-white rounded-l-full shadow-[0_0_15px_white]"
        />
      )}
    </NavLink>
  );
};

export const AppSidebar = () => {
  const { isSidebarPinned } = useAppState();
  const { setOpen, state } = useSidebar();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setOpen(isSidebarPinned);
  }, [isSidebarPinned, setOpen]);

  // Navigation Groups
  const navGroups = [
    {
      title: "Core",
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      ]
    },
    {
      title: "Intelligence",
      items: [
        { icon: Sparkles, label: 'Oracle', path: '/queries' },
        { icon: Calculator, label: 'Engine', path: '/engine' },
        { icon: Database, label: 'Data Hub', path: '/data' },
        { icon: TrendingUp, label: 'Prognostics', path: '/prognostics' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: LayoutDashboard, label: 'Smart Canvas', path: '/canvas' },
      ]
    },
    {
      title: "Operations",
      items: [
        { icon: Shield, label: 'Data Quality', path: '/data/hub?tab=quality' },
        { icon: Network, label: 'Entities', path: '/data/hub?tab=entities' },
        { icon: Workflow, label: 'Workflows', path: '/data/hub?tab=workflows' },
        { icon: Shield, label: 'Governance', path: '/governance' },
        { icon: Calculator, label: 'Financial Engine', path: '/data/hub?tab=engine' },
      ]
    }
  ];

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('finsight_user');
    navigate('/login');
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/5 glass-sidebar"
    >
      <SidebarHeader className="p-8">
        {!isCollapsed ? (
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white font-display uppercase text-glow">
              Nyx<span className="text-primary italic">Intelligence</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mt-1">Global Core Console</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-2xl font-black text-primary italic">N</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="scrollbar-none pb-10 mt-4 px-2">
        <div className="flex flex-col gap-2">
          {navGroups.map((group, idx) => (
            <NavGroup key={idx} group={group} isCollapsed={isCollapsed} location={location} />
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/5 mt-auto bg-black/40 backdrop-blur-3xl">
        {!isCollapsed && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Admin Neural</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgb(16,185,129)]" />
                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em]">Validated</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-white/60 hover:text-white"
                >
                  {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/5 text-[10px] font-black uppercase tracking-[0.3em] h-12 rounded-2xl border border-transparent hover:border-rose-500/10 transition-all"
            >
              <LogOut size={18} className="mr-3" />
              Intelligence Purge
            </Button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-white transition-all shadow-xl"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-rose-500/40 hover:text-rose-500 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar >
  );
};
