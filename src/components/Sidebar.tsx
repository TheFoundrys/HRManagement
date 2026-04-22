'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { ThemeToggle } from './ThemeToggle';
import { Permission, hasPermission } from '@/lib/auth/rbac';
import {
  LayoutDashboard, Users, Clock, Wallet,
  LogOut, GraduationCap, ChevronLeft, Menu, Fingerprint,
  FileText, UserCircle, Shield,
  MessageSquare, Building2, CalendarOff
} from 'lucide-react';
import { useState, useMemo } from 'react';

const navItems: { href: string; label: string; icon: any; permission?: Permission }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Dashboard is public for all authenticated roles
  { href: '/team', label: 'My Team', icon: Users, permission: 'MANAGE_TEAM' },
  { href: '/employees', label: 'Employees', icon: Users, permission: 'VIEW_ALL_EMPLOYEES' },
  { href: '/attendance', label: 'Attendance', icon: Clock, permission: 'VIEW_ATTENDANCE' },
  { href: '/leave', label: 'Leave', icon: CalendarOff, permission: 'VIEW_LEAVE' },
  { href: '/payslips', label: 'Payslips', icon: FileText, permission: 'VIEW_OWN_PAYSLIP' },
  { href: '/salary-structure', label: 'Salary Structure', icon: Wallet, permission: 'MANAGE_PAYROLL' },
  { href: '/biometric', label: 'Biometric', icon: Fingerprint, permission: 'MANAGE_BIOMETRICS' },
  { href: '/admin/attendance/network', label: 'Network Security', icon: Shield, permission: 'MANAGE_NETWORK_SECURITY' },
  { href: '/admin/requests', label: 'Support Requests', icon: MessageSquare, permission: 'MANAGE_SUPPORT_REQUESTS' },
  { href: '/superadmin/tenants', label: 'Tenants', icon: Building2, permission: 'MANAGE_ADMINS' },
  { href: '/profile', label: 'Profile', icon: UserCircle }, // Profile is public
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(user?.role || 'STAFF', item.permission);
    });
  }, [user?.role]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 flex flex-col
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-64'} shadow-soft
        `}
      >
        <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-foreground tracking-tight">University HR</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group border border-transparent
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-muted/30 space-y-3">
          {!collapsed && (
            <div className="px-2">
              <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mt-1">{user?.role}</p>
            </div>
          )}
          
          <div className="pt-2">
            <ThemeToggle collapsed={collapsed} />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm font-bold">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
