import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatRelativeTime } from "@/lib/utils";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle, Clock, UserPlus, Bell } from "lucide-react";

import { useTranslation } from "react-i18next";

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canViewResidencyNotifications } = useRBAC();
  
  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: user ? [`/api/users/${user?.id}/notifications`] : [],
    enabled: !!user,
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/notifications`] });
    }
  });
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Function to render the appropriate icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_delay':
        return <AlertTriangle className="h-5 w-5 text-error-600" />;
      case 'project_completion':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'attendance_issue':
        return <Clock className="h-5 w-5 text-warning-600" />;
      case 'client_note':
        return <UserPlus className="h-5 w-5 text-primary-600" />;
      case 'residence_expiry':
      case 'residence_expiry_alert':
        return <AlertTriangle className="h-5 w-5 text-error-600" />;
      default:
        return <Bell className="h-5 w-5 text-secondary-600" />;
    }
  };
  
  // Function to get the background color class based on notification type
  const getNotificationBgClass = (type: string) => {
    switch (type) {
      case 'project_delay':
        return 'bg-error-100';
      case 'project_completion':
        return 'bg-success-100';
      case 'attendance_issue':
        return 'bg-warning-100';
      case 'client_note':
        return 'bg-primary-100';
      case 'residence_expiry':
      case 'residence_expiry_alert':
        return 'bg-error-100';
      default:
        return 'bg-secondary-100';
    }
  };

  return (
    <Card className="border border-secondary-200">
      <CardHeader className="px-6 py-4 border-b border-secondary-200">
        <CardTitle className="font-bold text-secondary-800">{t('dashboard.notifications.title')}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 divide-y divide-secondary-100">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-4 flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))
        ) : notifications?.length > 0 ? (
          notifications
            .filter((notification) => {
              // Filter out residency notifications for users without permission
              if (notification.type === 'residence_expiry' || notification.type === 'residence_expiry_alert') {
                return canViewResidencyNotifications();
              }
              return true;
            })
            .slice(0, 4).map((notification) => (
            <div 
              key={notification.id} 
              className="p-4 flex items-start gap-3"
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
            >
              <div className={`rounded-full ${getNotificationBgClass(notification.type)} p-2 mt-0.5`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={notification.isRead ? 'text-secondary-500' : ''}>
                <p className="font-medium text-secondary-800">{notification.title}</p>
                <p className="text-sm text-secondary-500">{notification.message}</p>
                <p className="text-xs text-secondary-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-secondary-500">{t('dashboard.notifications.noNotifications')}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-3 bg-secondary-50 border-t border-secondary-200">
        <Button variant="link" className="w-full text-primary-600 hover:text-primary-700" asChild>
          <Link href="/notifications">{t('dashboard.notifications.viewAll')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
