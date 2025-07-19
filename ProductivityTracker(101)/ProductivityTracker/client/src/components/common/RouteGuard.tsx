import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC, Feature, Permission } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface RouteGuardProps {
  children: ReactNode;
  feature: Feature;
  requiredPermissions?: Permission[];
}

/**
 * RouteGuard component to protect routes based on user role and permissions
 * 
 * @param children - The protected route content
 * @param feature - The feature to check access for
 * @param requiredPermissions - Optional specific permissions required for this route
 */
export default function RouteGuard({ 
  children, 
  feature, 
  requiredPermissions 
}: RouteGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const { hasFeatureAccess, hasPermission } = useRBAC();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login page
      navigate('/login');
      return;
    }

    // Check if user has access to this feature
    if (!hasFeatureAccess(feature)) {
      // Show unauthorized access toast
      toast({
        title: t('common.unauthorized'),
        description: t('common.noAccessToFeature'),
        variant: "destructive",
      });
      
      // Redirect to dashboard
      navigate('/');
      return;
    }

    // Check specific permissions if provided
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(
        permission => hasPermission(feature, permission)
      );

      if (!hasAllPermissions) {
        // Show insufficient permissions toast
        toast({
          title: t('common.unauthorized'),
          description: t('common.insufficientPermissions'),
          variant: "destructive",
        });
        
        // Redirect to dashboard
        navigate('/');
        return;
      }
    }
  }, [
    isAuthenticated,
    hasFeatureAccess,
    hasPermission,
    feature,
    requiredPermissions,
    navigate,
    toast,
    t
  ]);

  // Only render children if user is authenticated
  return isAuthenticated ? <>{children}</> : null;
}