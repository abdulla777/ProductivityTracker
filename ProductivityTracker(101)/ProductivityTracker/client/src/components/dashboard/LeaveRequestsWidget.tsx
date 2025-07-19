import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeaveRequestEditDialog } from "@/components/leave/LeaveRequestEditDialog";
import { FileText, Calendar, Clock, User, Check, X, Edit } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  userId: number;
  createdAt: string;
  user?: {
    fullName: string;
    role: string;
  };
}

export default function LeaveRequestsWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  
  // State for editing requests
  const [editingRequest, setEditingRequest] = useState<any>(null);

  // Only show for HR Manager, Admin, and General Manager
  if (!hasPermission('staff', 'manage') && !hasPermission('attendance', 'manage')) {
    return null;
  }

  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests'],
  });

  // Show all requests, not just pending ones, so managers can edit approved/rejected requests  
  const displayRequests = leaveRequests.slice(0, 5); // Show latest 5 requests of any status

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ requestId, action, notes }: { requestId: number; action: 'approved' | 'rejected'; notes?: string }) => {
      return await apiRequest('/api/leave-requests/' + requestId, 'PATCH', {
        status: action,
        notes: notes || (action === 'approved' ? 'تم الموافقة على الطلب' : 'تم رفض الطلب')
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests'] });
      toast({
        title: variables.action === 'approved' ? 'تم الموافقة على الطلب' : 'تم رفض الطلب',
        description: variables.action === 'approved' ? 'تم الموافقة على طلب الإجازة بنجاح' : 'تم رفض طلب الإجازة',
        variant: variables.action === 'approved' ? 'default' : 'destructive'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في معالجة الطلب',
        description: error.message || 'فشل في معالجة طلب الإجازة',
        variant: 'destructive'
      });
    }
  });

  const handleApproval = (requestId: number, action: 'approved' | 'rejected') => {
    approvalMutation.mutate({ requestId, action });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'annual':
        return 'إجازة سنوية';
      case 'sick':
        return 'إجازة مرضية';
      case 'emergency':
        return 'إجازة طارئة';
      case 'unpaid':
        return 'إجازة بدون راتب';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'approved':
        return 'موافق عليها';
      case 'rejected':
        return 'مرفوضة';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-secondary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            طلبات الإجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Leave Request Edit Dialog */}
      {editingRequest && (
        <LeaveRequestEditDialog
          request={editingRequest}
          open={!!editingRequest}
          onOpenChange={(open) => {
            if (!open) setEditingRequest(null);
          }}
        />
      )}
      <Card className="border border-secondary-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          طلبات الإجازات
          {leaveRequests.filter(r => r.status === 'pending').length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {leaveRequests.filter(r => r.status === 'pending').length}
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a href="/employee-services">عرض الكل</a>
        </Button>
      </CardHeader>
      <CardContent>
        {displayRequests.length > 0 ? (
          <div className="space-y-4">
            {displayRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">
                      {request.user?.fullName || 'غير معروف'}
                    </span>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-3 w-3" />
                    <span>{getTypeLabel(request.type)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDate(request.createdAt)}
                    </span>
                  </div>
                  
                  {request.reason && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {request.reason}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    {/* Approval buttons for pending requests */}
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من الموافقة على طلب الإجازة لـ ${request.user?.fullName || 'هذا الموظف'}؟`)) {
                              handleApproval(request.id, 'approved');
                            }
                          }}
                          disabled={approvalMutation.isPending}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3" />
                          موافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رفض طلب الإجازة لـ ${request.user?.fullName || 'هذا الموظف'}؟`)) {
                              handleApproval(request.id, 'rejected');
                            }
                          }}
                          disabled={approvalMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          رفض
                        </Button>
                      </>
                    )}
                    
                    {/* Edit button - always available for audit trails */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRequest(request)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      تعديل
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>لا توجد طلبات إجازات</p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}