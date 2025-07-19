import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertTriangle, User, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { safeFormatDate, safeDateParse } from "@/lib/dateUtils";

interface ResidenceRenewalForm {
  userId: string;
  newExpiryDate: string;
  renewalMonths: string;
}

export default function ResidenceManagement() {
  const { toast } = useToast();
  const [renewalFormOpen, setRenewalFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [renewalForm, setRenewalForm] = useState<ResidenceRenewalForm>({
    userId: '',
    newExpiryDate: '',
    renewalMonths: '12'
  });

  // Fetch expiring residences
  const { data: expiringUsers, isLoading, error } = useQuery({
    queryKey: ['/api/residence/expiring'],
    queryFn: async () => {
      const response = await fetch('/api/residence/expiring', {
        method: 'GET',
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
  });
  
  // Debug logging
  console.log('Residence Management Debug:', {
    isLoading,
    expiringUsers,
    error,
    dataType: typeof expiringUsers,
    isArray: Array.isArray(expiringUsers),
    length: expiringUsers?.length
  });

  // Fetch all notifications for residency alerts
  const { data: notifications } = useQuery({
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
      
      return await response.json();
    },
  });

  // Filter residence notifications
  const residenceNotifications = Array.isArray(notifications) 
    ? notifications.filter(n => n.type === 'residence_expiry' || n.type === 'residence_expiry_alert')
    : [];

  // Ensure expiringUsers is always an array
  const safeExpiringUsers = Array.isArray(expiringUsers) ? expiringUsers : [];

  // Renewal mutation
  const renewalMutation = useMutation({
    mutationFn: async (data: ResidenceRenewalForm) => {
      const response = await fetch('/api/residence/renew', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: parseInt(data.userId),
          newExpiryDate: data.newExpiryDate,
          renewalMonths: parseInt(data.renewalMonths)
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residence/expiring'] });
      toast({
        title: "تم التجديد بنجاح",
        description: "تم تجديد الإقامة وإرسال إشعار للموظف",
      });
      setRenewalFormOpen(false);
      setRenewalForm({ userId: '', newExpiryDate: '', renewalMonths: '12' });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التجديد",
        description: error.message || "فشل في تجديد الإقامة",
        variant: "destructive",
      });
    },
  });

  const handleRenewal = (user: any) => {
    setSelectedUser(user);
    setRenewalForm({
      userId: user.id.toString(),
      newExpiryDate: '',
      renewalMonths: '12'
    });
    setRenewalFormOpen(true);
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!renewalForm.userId || !renewalForm.newExpiryDate || !renewalForm.renewalMonths) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    renewalMutation.mutate(renewalForm);
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: 'منتهية', color: 'bg-red-500' };
    } else if (diffDays <= 7) {
      return { status: 'critical', label: `${diffDays} أيام`, color: 'bg-red-500' };
    } else if (diffDays <= 30) {
      return { status: 'warning', label: `${diffDays} يوم`, color: 'bg-yellow-500' };
    } else if (diffDays <= 90) {
      return { status: 'notice', label: `${Math.floor(diffDays/30)} شهر`, color: 'bg-orange-500' };
    } else {
      return { status: 'active', label: 'نشطة', color: 'bg-green-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل بيانات الإقامة...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          خطأ في تحميل بيانات الإقامة: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">إدارة الإقامات</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{safeExpiringUsers.length} إقامة تنتهي خلال 3 أشهر</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Clock className="h-4 w-4" />
            <span>{residenceNotifications.length} إشعار إقامة</span>
          </div>
        </div>
      </div>

      {/* Residence Notifications Section */}
      {residenceNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              إشعارات الإقامة الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {residenceNotifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!Array.isArray(safeExpiringUsers) || safeExpiringUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد إقامات تنتهي قريباً
              </h3>
              <p className="text-gray-600">
                جميع الإقامات صالحة لأكثر من 3 أشهر
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {safeExpiringUsers.map((user: any) => {
            const expiryStatus = getExpiryStatus(user.residenceExpiryDate);
            
            return (
              <Card key={user.id} className={`border-l-4 ${expiryStatus.color.includes('red') ? 'border-l-red-500' : expiryStatus.color.includes('yellow') ? 'border-l-yellow-500' : expiryStatus.color.includes('orange') ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="flex-shrink-0">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {user.fullName}
                        </h3>
                        <div className="mt-1 flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium ml-2">رقم الإقامة:</span>
                            <span>{user.residenceNumber || 'غير محدد'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium ml-2">تاريخ الانتهاء:</span>
                            <span>{user.residenceExpiryDate}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium ml-2">الوظيفة:</span>
                            <span>
                              {user.role === 'engineer' ? 'مهندس' : 
                               user.role === 'project_manager' ? 'مدير مشروع' : 
                               user.role === 'admin' ? 'مدير النظام' : 'موظف إداري'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Badge className={`${expiryStatus.color} text-white`}>
                        <Clock className="h-3 w-3 ml-1" />
                        {expiryStatus.label}
                      </Badge>
                      <Button
                        onClick={() => handleRenewal(user)}
                        variant="outline"
                        size="sm"
                      >
                        تجديد الإقامة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Renewal Dialog */}
      <Dialog open={renewalFormOpen} onOpenChange={setRenewalFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تجديد الإقامة</DialogTitle>
            <DialogDescription>
              تجديد الإقامة للموظف: {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenewalSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="renewalMonths" className="text-right">
                  مدة التجديد (بالشهور)
                </Label>
                <Select
                  value={renewalForm.renewalMonths}
                  onValueChange={(value) => setRenewalForm({...renewalForm, renewalMonths: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="اختر مدة التجديد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 أشهر</SelectItem>
                    <SelectItem value="12">سنة واحدة</SelectItem>
                    <SelectItem value="24">سنتان</SelectItem>
                    <SelectItem value="36">3 سنوات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newExpiryDate" className="text-right">
                  تاريخ الانتهاء الجديد
                </Label>
                <Input
                  id="newExpiryDate"
                  type="date"
                  className="col-span-3"
                  value={renewalForm.newExpiryDate}
                  onChange={(e) => setRenewalForm({...renewalForm, newExpiryDate: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenewalFormOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={renewalMutation.isPending}
              >
                {renewalMutation.isPending ? "جاري التجديد..." : "تجديد الإقامة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}