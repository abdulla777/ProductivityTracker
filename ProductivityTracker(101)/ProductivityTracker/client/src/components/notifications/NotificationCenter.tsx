import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check, X, AlertCircle, Calendar, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';

interface Notification {
  id: number;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'residence_expiry' | 'system' | 'task_assigned';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: number;
  referenceId?: number;
  referenceType?: string;
  priority: 'low' | 'medium' | 'high';
  user?: {
    fullName: string;
    role: string;
  };
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { hasPermission, canViewResidencyNotifications } = useRBAC();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [showAll, setShowAll] = useState(false);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'تم تحديث الإشعارات',
        description: 'تم تحديد جميع الإشعارات كمقروءة',
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Filter notifications - ensure notifications is always an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  // Debug logging to identify the issue
  console.log('NotificationCenter Debug:', {
    notifications,
    safeNotifications,
    isArray: Array.isArray(notifications),
    type: typeof notifications,
    length: safeNotifications.length
  });
  
  const filteredNotifications = safeNotifications.filter(notification => {
    // First apply RBAC filtering
    if (notification.type === 'residence_expiry' && !canViewResidencyNotifications()) {
      return false;
    }
    
    // Then apply user filters
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'high':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  // Show limited notifications or all based on showAll state
  const displayedNotifications = showAll ? filteredNotifications : filteredNotifications.slice(0, 10);

  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        return <Calendar className="h-4 w-4" />;
      case 'residence_expiry':
        return <AlertCircle className="h-4 w-4" />;
      case 'task_assigned':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600';
    switch (type) {
      case 'leave_approved':
        return 'text-green-600';
      case 'leave_rejected':
        return 'text-red-600';
      case 'residence_expiry':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case 'leave_request':
        if (hasPermission('staff', 'manage')) {
          window.location.href = '/leave-management';
        }
        break;
      case 'leave_approved':
      case 'leave_rejected':
        window.location.href = '/employee-services';
        break;
      case 'residence_expiry':
        if (hasPermission('residency', 'manage')) {
          window.location.href = '/residence-management';
        }
        break;
      case 'task_assigned':
        window.location.href = '/tasks';
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">الإشعارات</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'إظهار أقل' : 'عرض الكل'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          الكل ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          غير مقروء ({unreadCount})
        </Button>
        <Button
          variant={filter === 'high' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('high')}
        >
          عالي الأهمية ({notifications.filter(n => n.priority === 'high').length})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>الإشعارات الحديثة</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : displayedNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">لا توجد إشعارات</div>
            ) : (
              <div className="space-y-3">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    } hover:bg-gray-100`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={getNotificationColor(notification.type, notification.priority)}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                عاجل
                              </Badge>
                            )}
                            {!notification.isRead && (
                              <Badge variant="secondary" className="text-xs">
                                جديد
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.user && (
                              <span>من: {notification.user.fullName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}