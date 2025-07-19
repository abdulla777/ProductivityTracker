import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Calendar, User, Edit } from "lucide-react";
import { LeaveRequestEditDialog } from "@/components/leave/LeaveRequestEditDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { formatDate } from "@/lib/utils";
import MainLayout from "@/components/layout/MainLayout";

interface LeaveRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  notes?: string;
  createdAt: string;
  user?: {
    fullName: string;
    role: string;
  };
}

export default function LeaveManagement() {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  const [actionDialog, setActionDialog] = useState<{ open: boolean; request: LeaveRequest | null; action: 'approve' | 'reject' | null }>({
    open: false,
    request: null,
    action: null
  });
  const [notes, setNotes] = useState('');
  const [editingRequest, setEditingRequest] = useState<any>(null);

  // Check permissions
  if (!hasPermission('staff', 'manage') && !hasPermission('attendance', 'manage')) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">غير مخول</h2>
            <p>ليس لديك صلاحية لعرض إدارة طلبات الإجازة</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Fetch all leave requests
  const { data: allRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests'],
  });

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
        description: variables.action === 'approved' ? 'تم الموافقة على طلب الإجازة وإرسال إشعار للموظف' : 'تم رفض طلب الإجازة وإرسال إشعار للموظف',
        variant: variables.action === 'approved' ? 'default' : 'destructive'
      });
      setActionDialog({ open: false, request: null, action: null });
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في معالجة الطلب',
        description: error.message || 'فشل في معالجة طلب الإجازة',
        variant: 'destructive'
      });
    }
  });

  const handleAction = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setActionDialog({ open: true, request, action });
  };

  const confirmAction = () => {
    if (actionDialog.request && actionDialog.action) {
      const status = actionDialog.action === 'approve' ? 'approved' : 'rejected';
      approvalMutation.mutate({
        requestId: actionDialog.request.id,
        action: status,
        notes
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />قيد المراجعة</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'annual': return 'إجازة سنوية';
      case 'sick': return 'إجازة مرضية';
      case 'emergency': return 'إجازة طارئة';
      default: return type;
    }
  };

  const pendingRequests = allRequests.filter(request => request.status === 'pending');
  const approvedRequests = allRequests.filter(request => request.status === 'approved');
  const rejectedRequests = allRequests.filter(request => request.status === 'rejected');

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">إدارة طلبات الإجازة</h1>
          <p className="text-gray-600">مراجعة والموافقة على طلبات الإجازة المقدمة من الموظفين</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              قيد المراجعة ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              الموافق عليها ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              المرفوضة ({rejectedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              جميع الطلبات ({allRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>طلبات الإجازة قيد المراجعة</CardTitle>
                <CardDescription>طلبات الإجازة التي تحتاج موافقة</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">لا توجد طلبات قيد المراجعة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{request.user?.fullName || 'غير محدد'}</span>
                              {getStatusBadge(request.status)}
                            </div>
                            <h4 className="font-medium mb-1">{getTypeLabel(request.type)}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Calendar className="w-4 h-4" />
                              من {formatDate(request.startDate)} إلى {formatDate(request.endDate)}
                            </div>
                            <p className="text-sm text-gray-700">{request.reason}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              تاريخ التقديم: {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleAction(request, 'approve')}
                              disabled={approvalMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              موافقة
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleAction(request, 'reject')}
                              disabled={approvalMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              رفض
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRequest(request)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              تعديل
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات الموافق عليها</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">لا توجد طلبات موافق عليها</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>نوع الإجازة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>ملاحظات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.user?.fullName || 'غير محدد'}</TableCell>
                          <TableCell>{getTypeLabel(request.type)}</TableCell>
                          <TableCell>
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                          <TableCell>{request.notes || '-'}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRequest(request)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              تعديل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات المرفوضة</CardTitle>
              </CardHeader>
              <CardContent>
                {rejectedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">لا توجد طلبات مرفوضة</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>نوع الإجازة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>ملاحظات الرفض</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.user?.fullName || 'غير محدد'}</TableCell>
                          <TableCell>{getTypeLabel(request.type)}</TableCell>
                          <TableCell>
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                          <TableCell>{request.notes || '-'}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRequest(request)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              تعديل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>جميع طلبات الإجازة</CardTitle>
                <CardDescription>سجل كامل بجميع طلبات الإجازة</CardDescription>
              </CardHeader>
              <CardContent>
                {allRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">لا توجد طلبات إجازة</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>نوع الإجازة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ التقديم</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.user?.fullName || 'غير محدد'}</TableCell>
                          <TableCell>{getTypeLabel(request.type)}</TableCell>
                          <TableCell>
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRequest(request)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              تعديل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

        {/* Action Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'approve' ? 'الموافقة على الطلب' : 'رفض الطلب'}
              </DialogTitle>
              <DialogDescription>
                هل أنت متأكد من {actionDialog.action === 'approve' ? 'الموافقة على' : 'رفض'} طلب الإجازة لـ {actionDialog.request?.user?.fullName}؟
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="أضف ملاحظات (اختياري)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, request: null, action: null })}>
                إلغاء
              </Button>
              <Button 
                variant={actionDialog.action === 'approve' ? 'default' : 'destructive'}
                onClick={confirmAction}
                disabled={approvalMutation.isPending}
              >
                {actionDialog.action === 'approve' ? 'موافقة' : 'رفض'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}