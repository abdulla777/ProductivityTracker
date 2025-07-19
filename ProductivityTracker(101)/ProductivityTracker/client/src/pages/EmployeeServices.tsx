import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CalendarRange, 
  FileText, 
  Clock, 
  UserCircle, 
  MapPin, 
  Navigation,
  Mail as MailIcon, 
  Phone as PhoneIcon
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LeaveRequestEditDialog } from "@/components/leave/LeaveRequestEditDialog";
import { Edit } from "lucide-react";

// Components
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function LeaveRequestsList() {
  const { t } = useTranslation();
  const [editingRequest, setEditingRequest] = useState<any>(null);
  
  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/leave-requests'],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (leaveRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">لا توجد طلبات إجازة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leaveRequests.map((request) => (
        <div key={request.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">طلب إجازة {request.type === 'annual' ? 'سنوية' : request.type === 'sick' ? 'مرضية' : 'طارئة'}</h4>
              <p className="text-sm text-gray-600">
                من {formatDate(request.startDate)} إلى {formatDate(request.endDate)}
              </p>
            </div>
            {getStatusBadge(request.status)}
          </div>
          <p className="text-sm text-gray-700 mb-2">{request.reason}</p>
          {request.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <p className="text-sm font-medium">ملاحظات المدير:</p>
              <p className="text-sm">{request.notes}</p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            تاريخ التقديم: {formatDate(request.createdAt)}
          </p>
          <div className="mt-3 flex justify-end">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setEditingRequest(request)}
            >
              <Edit className="w-4 h-4 mr-1" />
              تعديل / إضافة ملاحظات
            </Button>
          </div>
        </div>
      ))}
      
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
    </div>
  );
}

export default function EmployeeServices() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  
  // State for leave request form
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  
  // State for short leave request form
  const [shortLeaveFormOpen, setShortLeaveFormOpen] = useState(false);
  const [shortLeaveFormData, setShortLeaveFormData] = useState({
    reason: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  
  // State for site visit request form
  const [siteVisitFormOpen, setSiteVisitFormOpen] = useState(false);
  const [siteVisitFormData, setSiteVisitFormData] = useState({
    siteName: '',
    location: '',
    reason: '',
    date: ''
  });
  
  // Fetch today's attendance for check-in/check-out status
  const { data: todayAttendance } = useQuery({
    queryKey: [`/api/users/${user?.id}/attendance/today`],
    enabled: !!user?.id,
  });
  
  // Fetch user's attendance records
  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery({
    queryKey: [
      `/api/users/${user?.id}/attendance`,
      {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    ],
    enabled: !!user?.id,
  });

  // Fetch leave requests for the current user
  const { data: leaveRequests = [], isLoading: leaveRequestsLoading } = useQuery({
    queryKey: ["/api/leave-requests"],
    enabled: !!user?.id,
  });
  
  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      setCheckInLoading(true);
      const now = new Date();
      const response = await apiRequest('/api/attendance', 'POST', {
        userId: user?.id,
        date: now.toISOString().split('T')[0],
        checkInTime: now.toTimeString().split(' ')[0],
        recordedBy: user?.id,
        status: 'present'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('employeeServices.attendance.checkInSuccess'),
        description: t('employeeServices.attendance.checkInSuccessMsg')
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/attendance/today`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/attendance`] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('employeeServices.attendance.checkInError'),
        variant: "destructive"
      });
    },
    onSettled: () => {
      setCheckInLoading(false);
    }
  });
  
  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      setCheckOutLoading(true);
      const now = new Date();
      const response = await apiRequest('/api/attendance', 'PATCH', {
        userId: user?.id,
        date: now.toISOString().split('T')[0],
        checkOutTime: now.toTimeString().split(' ')[0],
        recordedBy: user?.id,
        status: 'present'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('employeeServices.attendance.checkOutSuccess'),
        description: t('employeeServices.attendance.checkOutSuccessMsg')
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/attendance/today`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/attendance`] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('employeeServices.attendance.checkOutError'),
        variant: "destructive"
      });
    },
    onSettled: () => {
      setCheckOutLoading(false);
    }
  });
  
  // Submit leave request
  // Leave Request Mutation
  const leaveRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/leave-requests', 'POST', {
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({
        title: t('employeeServices.leave.requestSuccess'),
        description: t('employeeServices.leave.requestSuccessMsg')
      });
      setLeaveFormData({
        type: '',
        startDate: '',
        endDate: '',
        reason: ''
      });
      setLeaveFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('employeeServices.leave.requestError'),
        variant: "destructive",
      });
    },
  });

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveFormData.type || !leaveFormData.startDate || !leaveFormData.endDate || !leaveFormData.reason) {
      toast({
        title: t('common.error'),
        description: t('employeeServices.leave.validation.allFields'),
        variant: "destructive",
      });
      return;
    }

    leaveRequestMutation.mutate({
      leaveType: leaveFormData.type,
      startDate: leaveFormData.startDate,
      endDate: leaveFormData.endDate,
      reason: leaveFormData.reason
    });
  };
  
  // Submit short leave request (create notification to HR manager)
  const handleShortLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create notification to HR manager about permission request
      await apiRequest('/api/notifications', 'POST', {
        userId: 1, // Will be determined by backend for HR managers
        type: 'permission_request',
        title: 'طلب استئذان جديد',
        message: `طلب استئذان من ${user?.fullName}: ${shortLeaveFormData.reason}`,
        priority: 'high'
      });
      
      toast({
        title: t('employeeServices.shortLeave.requestSuccess'),
        description: t('employeeServices.shortLeave.requestSuccessMsg')
      });
      setShortLeaveFormData({
        reason: '',
        date: '',
        startTime: '',
        endTime: ''
      });
      setShortLeaveFormOpen(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'فشل في إرسال طلب الاستئذان',
        variant: "destructive"
      });
    }
  };
  
  // Submit site visit request
  const handleSiteVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: t('employeeServices.siteVisit.requestSuccess'),
      description: t('employeeServices.siteVisit.requestSuccessMsg')
    });
    setSiteVisitFormData({
      siteName: '',
      location: '',
      reason: '',
      date: ''
    });
    setSiteVisitFormOpen(false);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-800 mb-1">{t('employeeServices.title')}</h1>
        <p className="text-secondary-500">{t('employeeServices.description')}</p>
      </div>
      
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t('employeeServices.attendance.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span>{t('employeeServices.leave.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="shortLeave" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t('employeeServices.shortLeave.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="siteVisit" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{t('employeeServices.siteVisit.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>{t('employeeServices.profile.title')}</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Attendance Records Tab */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('employeeServices.attendance.todayAttendance')}</CardTitle>
              <CardDescription>
                {t('employeeServices.attendance.todayDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                  <p className="font-medium text-secondary-700">
                    {new Date().toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-secondary-500">{t('employeeServices.attendance.currentTime')}</p>
                </div>
                
                {/* Show attendance status for all users */}
                <div className="text-secondary-700 p-2 bg-secondary-50 rounded-md">
                  {(todayAttendance && typeof todayAttendance === 'object' && 'checkInTime' in todayAttendance) ? (
                    (todayAttendance && typeof todayAttendance === 'object' && 'checkOutTime' in todayAttendance) ? (
                      <span>{t('employeeServices.attendance.checkedIn')}: {todayAttendance.checkInTime} - {t('employeeServices.attendance.checkedOut')}: {todayAttendance.checkOutTime}</span>
                    ) : (
                      <span>{t('employeeServices.attendance.checkedIn')}: {todayAttendance.checkInTime} - {t('employeeServices.attendance.notCheckedOut')}</span>
                    )
                  ) : (
                    <span>{t('employeeServices.attendance.notCheckedIn')}</span>
                  )}
                </div>
                
              </div>
              
              {todayAttendance && typeof todayAttendance === 'object' && (
                <div className="bg-secondary-50 rounded-md p-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-secondary-500">{t('employeeServices.attendance.checkInTime')}</p>
                      <p className="font-medium">
                        {'checkInTime' in todayAttendance ? 
                          (todayAttendance.checkInTime as string) : 
                          t('employeeServices.attendance.notCheckedIn')}
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary-500">{t('employeeServices.attendance.checkOutTime')}</p>
                      <p className="font-medium">
                        {'checkOutTime' in todayAttendance ? 
                          (todayAttendance.checkOutTime as string) : 
                          t('employeeServices.attendance.notCheckedOut')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Attendance History Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('employeeServices.attendance.myRecords')}</CardTitle>
              <CardDescription>
                {t('employeeServices.attendance.recordsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (attendanceRecords && Array.isArray(attendanceRecords) && attendanceRecords.length > 0) ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-secondary-500">
                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          {t('employeeServices.attendance.date')}
                        </th>
                        <th scope="col" className="px-6 py-3">
                          {t('employeeServices.attendance.checkIn')}
                        </th>
                        <th scope="col" className="px-6 py-3">
                          {t('employeeServices.attendance.checkOut')}
                        </th>
                        <th scope="col" className="px-6 py-3">
                          {t('employeeServices.attendance.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record: any) => (
                        <tr key={record.id} className="bg-white border-b">
                          <td className="px-6 py-4">
                            {formatDate(new Date(record.date))}
                          </td>
                          <td className="px-6 py-4">
                            {record.checkInTime || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {record.checkOutTime || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {record.isLate ? 
                              <span className="text-destructive font-medium">{t('employeeServices.attendance.late')}</span> : 
                              <span className="text-success-600 font-medium">{t('employeeServices.attendance.onTime')}</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary-500 mb-4">{t('employeeServices.attendance.noRecords')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{t('employeeServices.leave.myRequests')}</CardTitle>
                <CardDescription>
                  {t('employeeServices.leave.requestsDescription')}
                </CardDescription>
              </div>
              <Dialog open={leaveFormOpen} onOpenChange={setLeaveFormOpen}>
                <DialogTrigger asChild>
                  <Button>{t('employeeServices.leave.requestLeave')}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('employeeServices.leave.newRequest')}</DialogTitle>
                    <DialogDescription>
                      {t('employeeServices.leave.newRequestDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLeaveSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="leaveType" className="text-right">
                          {t('employeeServices.leave.type')}
                        </Label>
                        <Select
                          value={leaveFormData.type}
                          onValueChange={(value) => setLeaveFormData({...leaveFormData, type: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t('employeeServices.leave.selectType')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="annual">{t('employeeServices.leave.types.annual')}</SelectItem>
                            <SelectItem value="sick">{t('employeeServices.leave.types.sick')}</SelectItem>
                            <SelectItem value="emergency">{t('employeeServices.leave.types.emergency')}</SelectItem>
                            <SelectItem value="unpaid">{t('employeeServices.leave.types.unpaid')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">
                          {t('employeeServices.leave.startDate')}
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          className="col-span-3"
                          value={leaveFormData.startDate}
                          onChange={(e) => setLeaveFormData({...leaveFormData, startDate: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">
                          {t('employeeServices.leave.endDate')}
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          className="col-span-3"
                          value={leaveFormData.endDate}
                          onChange={(e) => setLeaveFormData({...leaveFormData, endDate: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason" className="text-right">
                          {t('employeeServices.leave.reason')}
                        </Label>
                        <Textarea
                          id="reason"
                          className="col-span-3"
                          placeholder={t('employeeServices.leave.reasonPlaceholder')}
                          value={leaveFormData.reason}
                          onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{t('common.submit')}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <LeaveRequestsList />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Short Leave Tab */}
        <TabsContent value="shortLeave" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{t('employeeServices.shortLeave.title')}</CardTitle>
                <CardDescription>
                  {t('employeeServices.shortLeave.description')}
                </CardDescription>
              </div>
              <Dialog open={shortLeaveFormOpen} onOpenChange={setShortLeaveFormOpen}>
                <DialogTrigger asChild>
                  <Button>{t('employeeServices.shortLeave.requestButton')}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('employeeServices.shortLeave.newRequest')}</DialogTitle>
                    <DialogDescription>
                      {t('employeeServices.shortLeave.newRequestDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleShortLeaveSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shortLeaveDate" className="text-right">
                          {t('employeeServices.shortLeave.date')}
                        </Label>
                        <Input
                          id="shortLeaveDate"
                          type="date"
                          className="col-span-3"
                          value={shortLeaveFormData.date}
                          onChange={(e) => setShortLeaveFormData({...shortLeaveFormData, date: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startTime" className="text-right">
                          {t('employeeServices.shortLeave.startTime')}
                        </Label>
                        <Input
                          id="startTime"
                          type="time"
                          className="col-span-3"
                          value={shortLeaveFormData.startTime}
                          onChange={(e) => setShortLeaveFormData({...shortLeaveFormData, startTime: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endTime" className="text-right">
                          {t('employeeServices.shortLeave.endTime')}
                        </Label>
                        <Input
                          id="endTime"
                          type="time"
                          className="col-span-3"
                          value={shortLeaveFormData.endTime}
                          onChange={(e) => setShortLeaveFormData({...shortLeaveFormData, endTime: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shortLeaveReason" className="text-right">
                          {t('employeeServices.shortLeave.reason')}
                        </Label>
                        <Textarea
                          id="shortLeaveReason"
                          className="col-span-3"
                          placeholder={t('employeeServices.shortLeave.reasonPlaceholder')}
                          value={shortLeaveFormData.reason}
                          onChange={(e) => setShortLeaveFormData({...shortLeaveFormData, reason: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{t('common.submit')}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-secondary-500 mb-4">{t('employeeServices.shortLeave.noRequests')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Site Visit Tab */}
        <TabsContent value="siteVisit" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{t('employeeServices.siteVisit.title')}</CardTitle>
                <CardDescription>
                  {t('employeeServices.siteVisit.description')}
                </CardDescription>
              </div>
              <Dialog open={siteVisitFormOpen} onOpenChange={setSiteVisitFormOpen}>
                <DialogTrigger asChild>
                  <Button>{t('employeeServices.siteVisit.requestButton')}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('employeeServices.siteVisit.newRequest')}</DialogTitle>
                    <DialogDescription>
                      {t('employeeServices.siteVisit.newRequestDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSiteVisitSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="siteName" className="text-right">
                          {t('employeeServices.siteVisit.siteName')}
                        </Label>
                        <Input
                          id="siteName"
                          className="col-span-3"
                          value={siteVisitFormData.siteName}
                          onChange={(e) => setSiteVisitFormData({...siteVisitFormData, siteName: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                          {t('employeeServices.siteVisit.location')}
                        </Label>
                        <Input
                          id="location"
                          className="col-span-3"
                          value={siteVisitFormData.location}
                          onChange={(e) => setSiteVisitFormData({...siteVisitFormData, location: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="siteVisitDate" className="text-right">
                          {t('employeeServices.siteVisit.date')}
                        </Label>
                        <Input
                          id="siteVisitDate"
                          type="date"
                          className="col-span-3"
                          value={siteVisitFormData.date}
                          onChange={(e) => setSiteVisitFormData({...siteVisitFormData, date: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="siteVisitReason" className="text-right">
                          {t('employeeServices.siteVisit.reason')}
                        </Label>
                        <Textarea
                          id="siteVisitReason"
                          className="col-span-3"
                          placeholder={t('employeeServices.siteVisit.reasonPlaceholder')}
                          value={siteVisitFormData.reason}
                          onChange={(e) => setSiteVisitFormData({...siteVisitFormData, reason: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{t('common.submit')}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-secondary-500 mb-4">{t('employeeServices.siteVisit.noRequests')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employeeServices.profile.title')}</CardTitle>
              <CardDescription>
                {t('employeeServices.profile.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="space-y-6">
                  {/* User Information Section */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start mb-8">
                    <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-semibold text-primary-600">
                      {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || user.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-secondary-900">{user.fullName}</h2>
                      <p className="text-secondary-500 mb-2">{t(`roles.${user.role}`)}</p>
                      <div className="flex items-center text-secondary-600 text-sm mb-1">
                        <UserCircle className="h-4 w-4 mr-2" />
                        <span>{user.username}</span>
                      </div>
                      <div className="flex items-center text-secondary-600 text-sm mb-1">
                        <MailIcon className="h-4 w-4 mr-2" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-secondary-600 text-sm">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Edit Profile Form */}
                  <div className="border-t border-secondary-200 pt-6">
                    <h3 className="text-lg font-medium mb-4">{t('employeeServices.profile.updateInfo')}</h3>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">{t('employeeServices.profile.fullName')}</Label>
                          <Input id="fullName" defaultValue={user.fullName} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('employeeServices.profile.email')}</Label>
                          <Input id="email" type="email" defaultValue={user.email} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('employeeServices.profile.phone')}</Label>
                          <Input id="phone" defaultValue={user.phone || ''} />
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button type="button" onClick={() => {
                          toast({
                            title: t('employeeServices.profile.updateSuccess'),
                            description: t('employeeServices.profile.updateSuccessMsg')
                          });
                        }}>
                          {t('common.save')}
                        </Button>
                      </div>
                    </form>
                  </div>
                  
                  {/* Password Change Section */}
                  <div className="border-t border-secondary-200 pt-6">
                    <h3 className="text-lg font-medium mb-4">{t('employeeServices.profile.changePassword')}</h3>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">{t('employeeServices.profile.currentPassword')}</Label>
                          <Input id="currentPassword" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">{t('employeeServices.profile.newPassword')}</Label>
                          <Input id="newPassword" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">{t('employeeServices.profile.confirmPassword')}</Label>
                          <Input id="confirmPassword" type="password" />
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button type="button" variant="outline" onClick={() => {
                          toast({
                            title: t('employeeServices.profile.passwordSuccess'),
                            description: t('employeeServices.profile.passwordSuccessMsg')
                          });
                        }}>
                          {t('employeeServices.profile.updatePassword')}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}