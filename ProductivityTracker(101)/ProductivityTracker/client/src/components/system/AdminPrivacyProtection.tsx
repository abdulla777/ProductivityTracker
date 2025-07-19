import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';

interface AdminPrivacyProtectionProps {
  targetUserId?: number;
  targetUserRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Admin Privacy Protection Component
 * Prevents access to admin user data by non-admin users
 */
export default function AdminPrivacyProtection({
  targetUserId,
  targetUserRole,
  children,
  fallback = <div className="text-center py-4 text-gray-500">غير مسموح بالوصول</div>
}: AdminPrivacyProtectionProps) {
  const { user } = useAuth();
  const { userRole } = useRBAC();

  // If no user is logged in, deny access
  if (!user) {
    return <>{fallback}</>;
  }

  // If current user is admin, allow access to everything
  if (userRole === 'admin') {
    return <>{children}</>;
  }

  // If target user is admin and current user is not admin, deny access
  if (targetUserRole === 'admin' || (targetUserId && targetUserId !== user.id)) {
    // Check if we're trying to access admin data
    // This would need to be enhanced with actual role checking from API
    return <>{fallback}</>;
  }

  // If accessing own data, allow
  if (targetUserId === user.id) {
    return <>{children}</>;
  }

  // For other cases, show children (HR/General Manager accessing non-admin data)
  return <>{children}</>;
}