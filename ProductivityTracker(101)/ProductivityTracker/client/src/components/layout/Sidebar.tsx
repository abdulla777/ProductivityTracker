import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC, type Feature } from '@/hooks/useRBAC';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import Logo from './Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials, getRoleTranslationKey } from '@/lib/utils';
import {
  Home,
  LayoutPanelLeft,
  Users,
  UserCircle,
  Clock,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  CheckSquare,
  FileHeart,
  TrendingUp,
  Briefcase,
  Calendar
} from 'lucide-react';

// Logo is now directly imported at the top of the file

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { hasFeatureAccess, hasPermission, canAccessSettings } = useRBAC();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && isMobileOpen) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen, onClose]);

  // Apply role-based access control to navigation items
  const allNavigationItems: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    feature: Feature;
    requiresPermission?: string;
    alwaysShow?: boolean;
  }> = [
    {
      name: t('navigation.dashboard'),
      href: '/',
      icon: Home,
      feature: 'projects' // Changed to projects since engineers shouldn't see dashboard
    },
    {
      name: t('navigation.projects'),
      href: '/projects',
      icon: LayoutPanelLeft,
      feature: 'projects'
    },
    {
      name: t('navigation.staff'),
      href: '/staff',
      icon: Users,
      feature: 'staff'
    },
    {
      name: t('navigation.clients'),
      href: '/clients',
      icon: UserCircle,
      feature: 'clients'
    },
    {
      name: t('navigation.attendance'),
      href: '/attendance',
      icon: Clock,
      feature: 'attendance',
      requiresPermission: 'view' // Only show to users with 'view' permission
    },
    {
      name: t('navigation.tasks'),
      href: '/tasks',
      icon: CheckSquare,
      feature: 'tasks'
    },
    {
      name: t('navigation.reports'),
      href: '/reports',
      icon: BarChart3,
      feature: 'reports'
    },
    {
      name: t('navigation.analytics'),
      href: '/analytics',
      icon: BarChart3,
      feature: 'reports'
    },
    {
      name: t('navigation.opportunities'),
      href: '/opportunities',
      icon: Briefcase,
      feature: 'projects' // Restrict to project managers and admins
    },
    {
      name: t('navigation.employeeServices'),
      href: '/employee-services',
      icon: FileHeart,
      feature: 'projects', // Changed to projects feature
      alwaysShow: true // Always show this to all authenticated users
    },
    {
      name: 'إدارة الإقامات',
      href: '/residence-management',
      icon: Users,
      feature: 'residency',
      requiresPermission: 'manage', // HR Manager and Admin can access
    },
    {
      name: 'إدارة طلبات الإجازة',
      href: '/leave-management',
      icon: Calendar,
      feature: 'staff',
      requiresPermission: 'manage', // HR Manager and Admin can access
    }
  ];

  // Filter navigation items based on user's role and permissions
  const navigationItems = allNavigationItems.filter(item => {
    // Always show items that have alwaysShow flag if user is authenticated
    if (item.alwaysShow && user) {
      return true;
    }
    
    // First check if user has access to the feature 
    const hasAccess = hasFeatureAccess(item.feature);
    
    // If this item requires a specific permission, check that too
    if (hasAccess && item.requiresPermission) {
      return hasPermission(item.feature, item.requiresPermission as 'view' | 'create' | 'edit' | 'delete' | 'manage');
    }
    
    return hasAccess;
  });

  const sidebarClass = cn(
    'flex flex-col w-64 bg-white border-l border-secondary-200 shadow-sm transition-all duration-300 z-10',
    {
      'fixed inset-0 z-30 w-3/4': isMobileOpen && isMobile,
      'hidden md:flex': !isMobileOpen && isMobile,
    }
  );

  return (
    <aside className={sidebarClass}>
      <div className="p-4 border-b border-secondary-200">
        <Logo 
          className="h-auto w-full max-w-[200px] mx-auto"
          width={200}
          height={100}
        />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-md font-medium",
                  location === item.href 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-secondary-600 hover:bg-secondary-50"
                )}>
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            </li>
          ))}
          
          {canAccessSettings() && (
            <li className="pt-4 mt-4 border-t border-secondary-200">
              <Link href="/settings">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-md font-medium",
                  location === '/settings' 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-secondary-600 hover:bg-secondary-50"
                )}>
                  <Settings className="h-5 w-5" />
                  {t('navigation.settings')}
                </div>
              </Link>
            </li>
          )}
          
          {/* System Management - Admin only */}
          {user?.role === 'admin' && (
            <li>
              <Link href="/system-management">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-md font-medium",
                  location === '/system-management' 
                    ? "text-primary-700 bg-primary-50" 
                    : "text-secondary-600 hover:bg-secondary-50"
                )}>
                  <Settings className="h-5 w-5" />
                  إدارة النظام
                </div>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      {user && (
        <div className="p-4 border-t border-secondary-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" alt={user.fullName} />
              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-sm font-medium">{user.fullName}</h3>
              <p className="text-xs text-secondary-500">{t(getRoleTranslationKey(user.role))}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2 text-error-600 border-error-200 hover:bg-error-50" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {t('auth.logout')}
          </Button>
        </div>
      )}
    </aside>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="md:hidden" 
      onClick={onClick}
      aria-label={t('navigation.menu')}
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
