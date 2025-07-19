import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, Plus, UserCheck, UserX, AlertCircle, Edit3, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { format } from "date-fns";

// Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AttendanceForm from "@/components/staff/AttendanceForm";
import ManualAttendanceForm from "@/components/staff/ManualAttendanceForm";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTimeString, getInitials, getRoleTranslationKey } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ar } from "date-fns/locale";

// Layout
import MainLayout from "@/components/layout/MainLayout";

type AttendanceRecord = {
  id: number;
  userId: number;
  date: string;
  isPresent: boolean;
  isLate: boolean;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  user: {
    id: number;
    fullName: string;
    role: string;
  };
};

type UserRecord = {
  id: number;
  fullName: string;
  role: string;
  username: string;
};

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { hasFeatureAccess, hasPermission } = useRBAC();
  const { toast } = useToast();
  
  // Check if user has access to attendance feature
  const canAccessAttendance = hasFeatureAccess('attendance');
  
  // Check specific permissions
  const canViewAllAttendance = hasPermission('attendance', 'view') && (user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'general_manager');
  const canCreateAttendance = hasPermission('attendance', 'create');
  const canManageAttendance = hasPermission('attendance', 'manage');
  
  // Helper function to translate role
  const translateRole = (role: string) => {
    return t(getRoleTranslationKey(role));
  };
  
  // Format date for API request
  const formattedDate = selectedDate.toISOString().split('T')[0];
  
  // Fetch attendance data based on role
  const { data: attendance, isLoading } = useQuery({
    queryKey: [
      canViewAllAttendance ? `/api/attendance/daily` : `/api/users/${user?.id}/attendance`, 
      canViewAllAttendance ? { date: formattedDate } : { startDate: formattedDate, endDate: formattedDate }
    ],
    enabled: canAccessAttendance && !!user,
  });
  
  // Fetch all staff for reference (admin only)
  const { data: staff } = useQuery({
    queryKey: ['/api/users'],
    enabled: canViewAllAttendance,
  });
  
  // Calculate attendance statistics based on available data
  const attendanceData: AttendanceRecord[] = Array.isArray(attendance) ? attendance : [];
  const presentCount = attendanceData.filter(record => record.isPresent).length || 0;
  const lateCount = attendanceData.filter(record => record.isPresent && record.isLate).length || 0;
  const absentCount = attendanceData.filter(record => !record.isPresent).length || 0;
  
  // Total staff count (only relevant for admin)
  const totalStaffCount = staff?.length || 0;
  const recordedStaffCount = canViewAllAttendance ? attendanceData.length || 0 : 0;
  const unrecordedStaffCount = canViewAllAttendance ? totalStaffCount - recordedStaffCount : 0;
  
  // Separate attendance records by status
  const presentStaff = attendanceData.filter(record => record.isPresent && !record.isLate) || [];
  const lateStaff = attendanceData.filter(record => record.isPresent && record.isLate) || [];
  const absentStaff = attendanceData.filter(record => !record.isPresent) || [];
  
  // Staff without attendance records today (admin only)
  const unrecordedStaff: UserRecord[] = canViewAllAttendance && staff 
    ? staff.filter(user => !attendanceData.some(record => record.userId === user.id))
    : [];

  // Additional queries for management functionality
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: canManageAttendance,
  });

  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['/api/attendance/today'],
    enabled: canManageAttendance,
  });

  // Record attendance mutation for management
  const recordAttendanceMutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      date: string;
      clockInTime: string;
      clockOutTime?: string;
      notes?: string;
      isPresent: boolean;
    }) => {
      return await apiRequest('/api/attendance', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      toast({
        title: 'تم تسجيل الحضور بنجاح',
        description: 'تم تسجيل بيانات الحضور للموظف المحدد',
      });
      // Reset form
      setSelectedUserId('');
      setCheckInTime('');
      setCheckOutTime('');
      setNotes('');
      setIsManualDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تسجيل الحضور',
        description: error.message || 'فشل في تسجيل الحضور',
        variant: 'destructive',
      });
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/attendance/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      toast({
        title: 'تم تحديث الحضور بنجاح',
        description: 'تم تحديث بيانات الحضور',
      });
    },
  });

  // Handle manual attendance submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !checkInTime) {
      toast({
        title: 'بيانات مطلوبة',
        description: 'يجب تحديد الموظف ووقت الحضور',
        variant: 'destructive',
      });
      return;
    }

    const attendanceData = {
      userId: parseInt(selectedUserId),
      date: format(selectedDate, 'yyyy-MM-dd'),
      clockInTime: checkInTime,
      clockOutTime: checkOutTime || undefined,
      notes: notes || "", // Ensure notes is always a string
      isPresent: true,
    };

    recordAttendanceMutation.mutate(attendanceData);
  };

  // Handle check out
  const handleCheckOut = (attendanceId: number) => {
    const currentTime = format(new Date(), 'HH:mm');
    updateAttendanceMutation.mutate({
      id: attendanceId,
      data: { clockOutTime: currentTime },
    });
  };

  // Filter users for dropdown (exclude admin unless viewing user is admin)
  const filteredUsers = users.filter(u => {
    if (user?.role === 'admin') return true;
    return u.role !== 'admin';
  });

  // If the user doesn't have access to the attendance feature, show access denied
  if (!canAccessAttendance) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h1 className="text-2xl font-bold text-secondary-800 mb-4">{t('common.accessDenied')}</h1>
          <p className="text-secondary-500 text-center max-w-md">
            {t('common.noPermission')}
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-800 mb-1">
              {canManageAttendance ? 'إدارة الحضور المتكاملة' : t('attendance.title')}
            </h1>
            <p className="text-secondary-500">
              {canManageAttendance 
                ? 'نظام شامل لتسجيل ومتابعة وإدارة حضور الموظفين'
                : canViewAllAttendance 
                  ? t('attendance.dailyAttendance')
                  : t('attendance.myAttendance')}
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            {canCreateAttendance && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span>{t('attendance.markAttendance')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl mb-4">{t('attendance.markAttendance')}</DialogTitle>
                  </DialogHeader>
                  <AttendanceForm 
                    date={selectedDate}
                    onSuccess={() => setIsDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            )}
            
            {canManageAttendance && (
              <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    <span>إدارة الحضور</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl mb-4">تسجيل حضور إداري</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employee">الموظف *</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUsers.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName} - {translateRole(user.role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="checkIn">وقت الحضور *</Label>
                        <Input
                          id="checkIn"
                          type="time"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="checkOut">وقت الانصراف</Label>
                        <Input
                          id="checkOut"
                          type="time"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Input
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="أدخل ملاحظات إضافية"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsManualDialogOpen(false)}
                      >
                        إلغاء
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={recordAttendanceMutation.isPending}
                      >
                        {recordAttendanceMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الحضور'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {canViewAllAttendance && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>تسجيل حضور يدوي</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl mb-4">تسجيل حضور يدوي</DialogTitle>
                  </DialogHeader>
                  <ManualAttendanceForm 
                    onSuccess={() => {
                      // Refresh attendance data after manual record is added
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Card className="w-full">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary-600" />
                <span className="font-medium">{t('attendance.selectDate')}:</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-right font-normal"
                  >
                    {formatDate(selectedDate)}
                    <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={language === 'ar' ? ar : undefined}
                    className="border-none"
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t('attendance.present')}</p>
                <h2 className="text-2xl font-bold text-green-700">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : presentCount}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-amber-600">{t('attendance.late')}</p>
                <h2 className="text-2xl font-bold text-amber-700">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : lateCount}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-red-600">{t('attendance.absent')}</p>
                <h2 className="text-2xl font-bold text-red-700">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : absentCount}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="present" className="mb-6">
        <TabsList className={`grid ${canViewAllAttendance ? 'grid-cols-4' : 'grid-cols-3'} w-full max-w-lg mx-auto`}>
          <TabsTrigger value="present" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>{t('attendance.present')}</span>
          </TabsTrigger>
          <TabsTrigger value="late" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span>{t('attendance.late')}</span>
          </TabsTrigger>
          <TabsTrigger value="absent" className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>{t('attendance.absent')}</span>
          </TabsTrigger>
          {canViewAllAttendance && (
            <TabsTrigger value="unrecorded" className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <span>{t('attendance.unrecorded')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Management Panel for Today's Attendance (for managers) */}
        {canManageAttendance && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  إدارة الحضور اليومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayAttendance.length > 0 ? (
                  <div className="space-y-3">
                    {todayAttendance.map(record => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(record.user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">{record.user.fullName}</h3>
                            <p className="text-sm text-gray-500">{translateRole(record.user.role)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <span className="text-green-600">
                              دخول: {formatTimeString(record.clockInTime || record.checkIn)}
                            </span>
                            {(record.clockOutTime || record.checkOut) && (
                              <span className="text-blue-600 mr-4">
                                خروج: {formatTimeString(record.clockOutTime || record.checkOut)}
                              </span>
                            )}
                          </div>
                          {!(record.clockOutTime || record.checkOut) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(record.id)}
                              disabled={updateAttendanceMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              تسجيل خروج
                            </Button>
                          )}
                          {(record.clockOutTime || record.checkOut) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              مكتمل
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد سجلات حضور لليوم
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <TabsContent value="present" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('attendance.presentStaff')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : presentStaff.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {presentStaff.map(record => (
                    <div key={record.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" alt={record.user.fullName} />
                          <AvatarFallback>{getInitials(record.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{record.user.fullName}</h3>
                          <p className="text-sm text-gray-500">
                            {translateRole(record.user.role)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {(record.clockInTime || record.checkIn) && (
                          <span>
                            {t('attendance.checkIn')}: {formatTimeString(record.clockInTime || record.checkIn)}
                          </span>
                        )}
                        {(record.clockOutTime || record.checkOut) && (
                          <span className="mr-4">
                            {t('attendance.checkOut')}: {formatTimeString(record.clockOutTime || record.checkOut)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('attendance.noStaffPresent')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="late" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('attendance.lateStaff')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lateStaff.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {lateStaff.map(record => (
                    <div key={record.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" alt={record.user.fullName} />
                          <AvatarFallback>{getInitials(record.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{record.user.fullName}</h3>
                          <p className="text-sm text-gray-500">
                            {translateRole(record.user.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-md">
                          {t('attendance.checkIn')}: {formatTimeString(record.checkIn)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('attendance.noStaffLate')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="absent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('attendance.absentStaff')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : absentStaff.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {absentStaff.map(record => (
                    <div key={record.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" alt={record.user.fullName} />
                          <AvatarFallback>{getInitials(record.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{record.user.fullName}</h3>
                          <p className="text-sm text-gray-500">
                            {translateRole(record.user.role)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {record.notes ? (
                          <span className="text-red-600 text-sm">
                            {record.notes}
                          </span>
                        ) : (
                          <span className="text-red-600 text-sm bg-red-50 px-2 py-1 rounded-md">
                            {t('attendance.absent')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('attendance.noStaffAbsent')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {canViewAllAttendance && (
          <TabsContent value="unrecorded" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('attendance.unrecordedStaff')}</CardTitle>
                {unrecordedStaff.length > 0 && canCreateAttendance && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex gap-1 items-center">
                        <AlertCircle className="h-4 w-4" />
                        <span>{t('attendance.markAll')}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-center text-xl mb-4">{t('attendance.batchAttendance')}</DialogTitle>
                      </DialogHeader>
                      <p className="text-center text-secondary-500 mb-4">
                        {t('attendance.batchAttendanceDesc')}
                      </p>
                      {/* Batch attendance form would go here */}
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : unrecordedStaff.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {unrecordedStaff.map(user => (
                      <div key={user.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="" alt={user.fullName} />
                            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                            <p className="text-sm text-gray-500">
                              {translateRole(user.role)}
                            </p>
                          </div>
                        </div>
                        <div>
                          {canCreateAttendance && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="h-8">
                                  {t('attendance.record')}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle className="text-center text-xl mb-4">{t('attendance.markAttendance')}</DialogTitle>
                                </DialogHeader>
                                <AttendanceForm 
                                  userId={user.id}
                                  date={selectedDate}
                                  onSuccess={() => {}}
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t('attendance.allStaffRecorded')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
}