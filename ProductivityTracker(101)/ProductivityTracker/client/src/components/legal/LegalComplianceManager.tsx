import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertTriangle, Shield, FileText, Calendar, Bell, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';

interface ComplianceItem {
  id: string;
  type: 'residence_expiry' | 'work_permit' | 'insurance' | 'safety_training' | 'contract_renewal';
  title: string;
  description: string;
  status: 'compliant' | 'warning' | 'critical' | 'expired';
  dueDate: string;
  lastUpdated: string;
  responsible: string;
  actions: string[];
}

interface LegalAlert {
  id: number;
  type: 'residence_expiry' | 'legal_requirement' | 'documentation' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  dueDate: string;
  isResolved: boolean;
  affectedUsers: number;
}

export default function LegalComplianceManager() {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'warning' | 'compliant'>('all');

  // Only HR Manager, General Manager, and Admin can access legal compliance
  if (!hasPermission('residency', 'manage')) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">ليس لديك صلاحية للوصول إلى إدارة الامتثال القانوني</p>
      </div>
    );
  }

  const { data: residenceData = [] } = useQuery({
    queryKey: ['/api/residence-management'],
  });

  const { data: legalAlerts = [] } = useQuery<LegalAlert[]>({
    queryKey: ['/api/legal-alerts'],
    refetchInterval: 300000, // Check every 5 minutes
  });

  // Create notification for legal compliance
  const createNotificationMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
      userId: number;
    }) => {
      return await apiRequest('/api/notifications', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Auto-generate compliance items from residence data
  const complianceItems: ComplianceItem[] = residenceData.map((resident: any) => {
    const expiryDate = new Date(resident.residenceExpiryDate);
    const today = new Date();
    const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: ComplianceItem['status'] = 'compliant';
    if (daysDiff < 0) {
      status = 'expired';
    } else if (daysDiff <= 30) {
      status = 'critical';
    } else if (daysDiff <= 90) {
      status = 'warning';
    }

    return {
      id: `residence-${resident.id}`,
      type: 'residence_expiry',
      title: `انتهاء إقامة ${resident.fullName}`,
      description: `رقم الإقامة: ${resident.residenceNumber}`,
      status,
      dueDate: resident.residenceExpiryDate,
      lastUpdated: resident.updatedAt || resident.createdAt,
      responsible: 'إدارة الموارد البشرية',
      actions: [
        'تجديد الإقامة',
        'تحديث الوثائق',
        'إشعار الموظف',
        'متابعة الإجراءات'
      ]
    };
  });

  // Filter compliance items
  const filteredItems = complianceItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  // Calculate compliance metrics
  const totalItems = complianceItems.length;
  const compliantCount = complianceItems.filter(item => item.status === 'compliant').length;
  const warningCount = complianceItems.filter(item => item.status === 'warning').length;
  const criticalCount = complianceItems.filter(item => item.status === 'critical').length;
  const expiredCount = complianceItems.filter(item => item.status === 'expired').length;
  
  const compliancePercentage = totalItems > 0 ? Math.round((compliantCount / totalItems) * 100) : 100;

  // Auto-notify for critical compliance issues
  useEffect(() => {
    const criticalItems = complianceItems.filter(item => item.status === 'critical' || item.status === 'expired');
    
    criticalItems.forEach(item => {
      if (item.type === 'residence_expiry') {
        createNotificationMutation.mutate({
          type: 'residence_expiry',
          title: `تنبيه قانوني: ${item.title}`,
          message: `يتطلب اتخاذ إجراء فوري لتجنب المخالفات القانونية. ${item.description}`,
          priority: 'high',
          userId: user?.id || 1,
        });
      }
    });
  }, [complianceItems.length, criticalCount, expiredCount]);

  const getStatusColor = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'compliant': return 'متوافق';
      case 'warning': return 'تحذير';
      case 'critical': return 'حرج';
      case 'expired': return 'منتهي الصلاحية';
      default: return 'غير معروف';
    }
  };

  const handleResolveItem = (itemId: string) => {
    toast({
      title: 'تم تحديث الحالة',
      description: 'تم تحديث حالة الامتثال القانوني',
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: 'تم إنشاء التقرير',
      description: 'تم إنشاء تقرير الامتثال القانوني وسيتم إرساله قريباً',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">إدارة الامتثال القانوني</h1>
            <p className="text-sm text-gray-500">متابعة الالتزامات القانونية والامتثال للوائح</p>
          </div>
        </div>
        <Button onClick={handleGenerateReport} className="gap-2">
          <FileText className="h-4 w-4" />
          إنشاء تقرير شامل
        </Button>
      </div>

      {/* Legal Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">نسبة الامتثال</p>
                <p className="text-2xl font-bold text-green-600">{compliancePercentage}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={compliancePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">حالات حرجة</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">تحذيرات</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">منتهية الصلاحية</p>
                <p className="text-2xl font-bold text-red-800">{expiredCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-800" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {(criticalCount > 0 || expiredCount > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيه قانوني عاجل</AlertTitle>
          <AlertDescription>
            يوجد {criticalCount + expiredCount} حالة تتطلب اتخاذ إجراء فوري لتجنب المخالفات القانونية.
            يرجى مراجعة الحالات أدناه والتصرف وفقاً للوائح المعمول بها.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={selectedFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('all')}
        >
          الكل ({totalItems})
        </Button>
        <Button
          variant={selectedFilter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('critical')}
        >
          حرج ({criticalCount})
        </Button>
        <Button
          variant={selectedFilter === 'warning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('warning')}
        >
          تحذير ({warningCount})
        </Button>
        <Button
          variant={selectedFilter === 'compliant' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('compliant')}
        >
          متوافق ({compliantCount})
        </Button>
      </div>

      {/* Compliance Items */}
      <Card>
        <CardHeader>
          <CardTitle>حالات الامتثال القانوني</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد حالات امتثال في هذه الفئة</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">تاريخ الانتهاء:</span>
                      <span className="mr-2">{formatDate(item.dueDate)}</span>
                    </div>
                    <div>
                      <span className="font-medium">المسؤول:</span>
                      <span className="mr-2">{item.responsible}</span>
                    </div>
                    <div>
                      <span className="font-medium">آخر تحديث:</span>
                      <span className="mr-2">{formatDate(item.lastUpdated)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">الإجراءات المطلوبة:</span>
                    <div className="flex flex-wrap gap-2">
                      {item.actions.map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveItem(item.id)}
                    >
                      تحديث الحالة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/residence-management'}
                    >
                      اتخاذ إجراء
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}