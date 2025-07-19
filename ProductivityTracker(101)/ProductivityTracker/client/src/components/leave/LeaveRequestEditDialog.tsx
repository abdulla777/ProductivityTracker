import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, User, FileText, Edit3, MessageSquare, Shield } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface LeaveRequest {
  id: number;
  userId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    fullName: string;
    username: string;
    role: string;
  };
}

interface LeaveRequestEditDialogProps {
  request: LeaveRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveRequestEditDialog({ request, open, onOpenChange }: LeaveRequestEditDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    type: request.type,
    startDate: request.startDate,
    endDate: request.endDate,
    reason: request.reason,
    notes: request.notes || '',
    adminNotes: request.adminNotes || '',
    status: request.status
  });

  // Determine editing permissions
  const isEmployee = request.userId === user?.id;
  const isManager = user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'general_manager';
  const canEditDetails = (
    // Employee can edit their own pending requests
    (isEmployee && request.status === 'pending') ||
    // Managers can edit any request details
    isManager
  );
  const canChangeStatus = isManager;
  const canEditAdminNotes = isManager;

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/leave-requests/${request.id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      toast({
        title: "تم تحديث الطلب",
        description: "تم تحديث طلب الإجازة بنجاح",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث طلب الإجازة",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'موافق عليها';
      case 'rejected': return 'مرفوضة';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'annual': return 'إجازة سنوية';
      case 'sick': return 'إجازة مرضية';
      case 'emergency': return 'إجازة طارئة';
      case 'unpaid': return 'إجازة بدون راتب';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit3 className="h-5 w-5" />
            تعديل طلب الإجازة #{request.id}
          </DialogTitle>
          <DialogDescription>
            تعديل تفاصيل طلب الإجازة وإضافة الملاحظات والتعليقات
          </DialogDescription>
        </DialogHeader>

        {/* Request Info Card */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              معلومات الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">الموظف:</span>
                <span className="font-medium">{request.user?.fullName || 'غير معروف'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                <span className="text-sm">{format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">آخر تحديث:</span>
                <span className="text-sm">{format(new Date(request.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                تفاصيل الطلب
                {!canEditDetails && (
                  <Badge variant="secondary" className="text-xs">للقراءة فقط</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">نوع الإجازة</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    disabled={!canEditDetails}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الإجازة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">إجازة سنوية</SelectItem>
                      <SelectItem value="sick">إجازة مرضية</SelectItem>
                      <SelectItem value="emergency">إجازة طارئة</SelectItem>
                      <SelectItem value="unpaid">إجازة بدون راتب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {canChangeStatus && (
                  <div className="space-y-2">
                    <Label htmlFor="status">حالة الطلب</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر حالة الطلب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="approved">موافق عليها</SelectItem>
                        <SelectItem value="rejected">مرفوضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البداية</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={!canEditDetails}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">تاريخ النهاية</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={!canEditDetails}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">سبب الإجازة</Label>
                <Textarea
                  id="reason"
                  placeholder="اكتب سبب طلب الإجازة..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  disabled={!canEditDetails}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                الملاحظات والتعليقات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات الموظف</Label>
                <Textarea
                  id="notes"
                  placeholder="إضافة ملاحظات إضافية للطلب..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  يمكن لجميع المستخدمين إضافة ملاحظات لتوضيح الطلب أو التصحيحات
                </p>
              </div>

              {canEditAdminNotes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      ملاحظات الإدارة
                    </Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="ملاحظات إدارية خاصة بالموافقة أو الرفض..."
                      value={formData.adminNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                      rows={3}
                      className="border-orange-200 focus:border-orange-500"
                    />
                    <p className="text-sm text-orange-600">
                      ملاحظات خاصة بالإدارة - متاحة فقط للمديرين وقسم الموارد البشرية
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}