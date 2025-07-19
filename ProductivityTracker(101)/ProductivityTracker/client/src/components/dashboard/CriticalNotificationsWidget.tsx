import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Calendar, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  priority: 'low' | 'medium' | 'high';
  referenceId?: number;
  referenceType?: string;
  user?: {
    fullName: string;
    role: string;
  };
}

export default function CriticalNotificationsWidget() {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const [showAll, setShowAll] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter for critical notifications (high priority or unread)
  const criticalNotifications = notifications.filter(n => 
    n.priority === 'high' || !n.isRead
  );

  const displayedNotifications = showAll ? criticalNotifications : criticalNotifications.slice(0, 5);

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'high') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    switch (type) {
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'residence_expiry':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'task_assigned':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'border-red-200 bg-red-50';
    if (!notifications.find(n => n.id === criticalNotifications.find(cn => cn.type === type)?.id)?.isRead) {
      return 'border-blue-200 bg-blue-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  const handleNotificationClick = (notification: Notification) => {
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

  const residenceExpiryCount = notifications.filter(n => n.type === 'residence_expiry' && !n.isRead).length;
  const leaveRequestCount = notifications.filter(n => n.type === 'leave_request' && !n.isRead).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.isRead).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            الإشعارات الهامة
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalNotifications.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalNotifications.length}
              </Badge>
            )}
            {criticalNotifications.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'أقل' : 'المزيد'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">لا توجد إشعارات هامة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getNotificationColor(notification.type, notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type, notification.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                        {notification.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            عاجل
                          </Badge>
                        )}
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                        {notification.user && (
                          <span className="text-xs text-gray-500">{notification.user.fullName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Critical Alerts Summary */}
        {(residenceExpiryCount > 0 || leaveRequestCount > 0 || highPriorityCount > 0) && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">تنبيهات هامة</span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {residenceExpiryCount > 0 && (
                <div className="flex items-center justify-between">
                  <span>إقامات تنتهي قريباً</span>
                  <Badge variant="outline" className="text-xs">
                    {residenceExpiryCount}
                  </Badge>
                </div>
              )}
              {leaveRequestCount > 0 && (
                <div className="flex items-center justify-between">
                  <span>طلبات إجازة جديدة</span>
                  <Badge variant="outline" className="text-xs">
                    {leaveRequestCount}
                  </Badge>
                </div>
              )}
              {highPriorityCount > 0 && (
                <div className="flex items-center justify-between">
                  <span>إشعارات عالية الأولوية</span>
                  <Badge variant="destructive" className="text-xs">
                    {highPriorityCount}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/notifications'}
            className="flex-1"
          >
            عرض جميع الإشعارات
          </Button>
          {hasPermission('staff', 'manage') && leaveRequestCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/leave-management'}
              className="flex-1"
            >
              إدارة الإجازات
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}