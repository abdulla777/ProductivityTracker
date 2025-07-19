import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { checkAndCreateResidenceNotifications } from '@/components/residence/NotificationService';

export default function ResidenceNotificationTrigger() {
  const { user } = useAuth();
  
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && (user.role === 'admin' || user.role === 'hr_manager' || user.role === 'general_manager' || user.role === 'project_manager'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (users && Array.isArray(users)) {
      console.log('Triggering residence notification check for', users.length, 'users');
      checkAndCreateResidenceNotifications(users);
    }
  }, [users]);

  return null; // This component doesn't render anything visible
}