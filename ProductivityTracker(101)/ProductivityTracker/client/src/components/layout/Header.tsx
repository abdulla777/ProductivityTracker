import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, X } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';
import CompanyLogo from '@/assets/CompanyLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/lib/utils';
import LanguageSelector from '@/components/common/LanguageSelector';

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user.id}/notifications`] : [],
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length || 0;
  
  // Close notifications panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-secondary-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side: Mobile menu button */}
        <div className="flex items-center">
          <MobileMenuButton onClick={onMobileMenuOpen} />
        </div>
        
        {/* Center: Search */}
        <div className="relative w-full max-w-xs mx-auto">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            type="search"
            className="bg-secondary-50 py-2 ps-10 pe-3 text-sm rounded-lg border border-secondary-200"
            placeholder="ابحث عن مشروع أو موظف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative" 
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={t('dashboard.notifications.title')}
            >
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-0.5 right-0.5 w-2.5 h-2.5 p-0 min-w-0 min-h-0"
                />
              )}
              <Bell className="h-6 w-6" />
            </Button>
            
            {/* Notifications dropdown */}
            {showNotifications && (
              <Card className="absolute right-0 mt-2 w-80 overflow-hidden z-50 shadow-lg">
                <div className="p-3 bg-primary-100/50 flex justify-between items-center">
                  <h3 className="font-medium">{t('dashboard.notifications.title')}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="space-y-0">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-3 hover:bg-secondary-50">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <span className="text-xs text-secondary-500">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-600">{notification.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-secondary-500">{t('dashboard.notifications.noNotifications')}</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      {t('dashboard.notifications.viewAll')}
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
          
          {/* Language Selector */}
          <LanguageSelector />
          
          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2" 
            onClick={() => navigate('/settings')}
            aria-label={t('navigation.settings')}
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
