import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import AdminPrivacyProtection from '@/components/system/AdminPrivacyProtection';

interface SecurityAuditLog {
  id: number;
  action: string;
  userId: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
  user: {
    fullName: string;
    role: string;
  };
}

interface SecurityMetrics {
  totalLogins: number;
  failedLogins: number;
  suspiciousActivity: number;
  adminAccess: number;
  lastSecurityScan: string;
  vulnerabilities: number;
}

export default function SystemSecurityManager() {
  const { user } = useAuth();
  const { userRole } = useRBAC();
  const { toast } = useToast();
  
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [auditFilter, setAuditFilter] = useState<'all' | 'admin' | 'security' | 'login'>('all');

  // Only admin can access system security
  if (userRole !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">ليس لديك صلاحية للوصول إلى إدارة أمان النظام</p>
      </div>
    );
  }

  const { data: securityMetrics } = useQuery<SecurityMetrics>({
    queryKey: ['/api/security/metrics'],
    refetchInterval: 30000,
  });

  const { data: auditLogs = [] } = useQuery<SecurityAuditLog[]>({
    queryKey: ['/api/security/audit-logs'],
    refetchInterval: 60000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Force security scan
  const securityScanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/security/scan', 'POST');
    },
    onSuccess: () => {
      toast({
        title: 'تم بدء فحص الأمان',
        description: 'جاري فحص النظام للثغرات الأمنية',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/security/metrics'] });
    },
  });

  // Lock user account
  const lockUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/users/${userId}/lock`, 'PATCH');
    },
    onSuccess: () => {
      toast({
        title: 'تم قفل الحساب',
        description: 'تم قفل الحساب لأسباب أمنية',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    switch (auditFilter) {
      case 'admin':
        return log.user.role === 'admin';
      case 'security':
        return log.severity === 'high';
      case 'login':
        return log.action.includes('login');
      default:
        return true;
    }
  });

  const adminUsers = users.filter(u => u.role === 'admin');
  const securityScore = securityMetrics ? Math.max(0, 100 - (securityMetrics.vulnerabilities * 10) - (securityMetrics.suspiciousActivity * 5)) : 85;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">إدارة أمان النظام</h1>
            <p className="text-sm text-gray-500">مراقبة وإدارة الأمان والحماية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSensitiveData ? 'إخفاء' : 'إظهار'} البيانات الحساسة
          </Button>
          <Button
            onClick={() => securityScanMutation.mutate()}
            disabled={securityScanMutation.isPending}
          >
            فحص أمني شامل
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">درجة الأمان</p>
                <p className="text-2xl font-bold text-green-600">{securityScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={securityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">نشاط مشبوه</p>
                <p className="text-2xl font-bold text-yellow-600">{securityMetrics?.suspiciousActivity || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">عمليات دخول فاشلة</p>
                <p className="text-2xl font-bold text-red-600">{securityMetrics?.failedLogins || 0}</p>
              </div>
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">وصول الإداريين</p>
                <p className="text-2xl font-bold text-blue-600">{adminUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {securityMetrics && (securityMetrics.vulnerabilities > 0 || securityMetrics.suspiciousActivity > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيه أمني</AlertTitle>
          <AlertDescription>
            تم اكتشاف {securityMetrics.vulnerabilities} ثغرة أمنية و {securityMetrics.suspiciousActivity} نشاط مشبوه.
            يرجى مراجعة سجل الأمان واتخاذ الإجراءات اللازمة.
          </AlertDescription>
        </Alert>
      )}

      {/* Admin User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إدارة المستخدمين الإداريين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adminUsers.map((admin) => (
              <AdminPrivacyProtection key={admin.id} targetUserId={admin.id} targetUserRole={admin.role}>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{showSensitiveData ? admin.fullName : '*** مخفي ***'}</p>
                      <p className="text-sm text-gray-500">{admin.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={admin.isActive ? 'default' : 'destructive'}>
                      {admin.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                    {admin.id !== user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => lockUserMutation.mutate(admin.id)}
                        disabled={lockUserMutation.isPending}
                      >
                        قفل الحساب
                      </Button>
                    )}
                  </div>
                </div>
              </AdminPrivacyProtection>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              سجل الأمان
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={auditFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuditFilter('all')}
              >
                الكل
              </Button>
              <Button
                variant={auditFilter === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuditFilter('admin')}
              >
                الإداريين
              </Button>
              <Button
                variant={auditFilter === 'security' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuditFilter('security')}
              >
                أمني
              </Button>
              <Button
                variant={auditFilter === 'login' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuditFilter('login')}
              >
                تسجيل الدخول
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAuditLogs.slice(0, 20).map((log) => (
              <AdminPrivacyProtection key={log.id} targetUserId={log.userId} targetUserRole={log.user.role}>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      log.severity === 'high' ? 'bg-red-500' :
                      log.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-500">
                        {showSensitiveData ? log.user.fullName : '*** مخفي ***'} - {log.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.severity === 'high' ? 'destructive' : 'outline'}>
                      {log.severity === 'high' ? 'عالي' : log.severity === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                    {showSensitiveData && (
                      <p className="text-xs text-gray-500 mt-1">{log.ipAddress}</p>
                    )}
                  </div>
                </div>
              </AdminPrivacyProtection>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}