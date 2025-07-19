import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

export default function Notifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">مركز الإشعارات</h1>
        <NotificationCenter />
      </div>
    </div>
  );
}