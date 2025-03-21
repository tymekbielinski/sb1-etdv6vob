import { Link, useLocation, Outlet } from 'react-router-dom';
import { BarChart3, Users, FilePlus, Menu, PanelLeftClose, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserMenu } from '@/components/user-menu';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store/ui-store';
import { Toaster } from '@/components/ui/toaster';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Team Settings', href: '/team', icon: Users },
  { name: 'Activity Log', href: '/activity', icon: FilePlus },
];

export default function Layout() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* User menu - visible on mobile */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 flex transition-all duration-300 cursor-pointer",
            isSidebarOpen ? "w-64" : "w-16"
          )}
          onClick={() => !isSidebarOpen && setSidebarOpen(true)}
        >
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-2 pb-4">
            <div className="flex h-16 shrink-0 items-center px-2">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8" />
                {isSidebarOpen && (
                  <span className="ml-2 text-lg font-semibold">GetMyKPI</span>
                )}
              </div>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={cn(
                              'flex items-center rounded-md transition-colors',
                              isSidebarOpen ? 'px-3 py-2' : 'p-2 justify-center',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                            onClick={(e) => e.stopPropagation()} // Prevent sidebar expansion when clicking links
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {isSidebarOpen && (
                              <span className="ml-3">{item.name}</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            </nav>

            {/* Expand button when collapsed */}
            {!isSidebarOpen && (
              <div className="px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(true);
                  }}
                  className="w-full h-8 flex items-center justify-center hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Collapse button when expanded */}
            {isSidebarOpen && (
              <div className="flex justify-end px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(false);
                  }}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <main className={cn(
          "w-full transition-all duration-300",
          isSidebarOpen ? "pl-64" : "pl-16"
        )}>
          <div className="flex justify-end p-4 border-b">
            <UserMenu />
          </div>
          <div className="px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile main content */}
      <main className="md:hidden">
        <div className="px-4 py-16">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}