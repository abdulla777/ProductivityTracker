import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { formatDate } from '@/lib/utils';

interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalHours?: number;
  notes?: string;
  user: {
    fullName: string;
    role: string;
  };
}

export default function AttendanceManager() {
  const { user } = useAuth();
  const { hasPermission, userRole, canAccessAttendance } = useRBAC();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');

  // Only allow HR Manager, General Manager, and Admin to manage attendance
  if (!hasPermission('attendance', 'manage')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ليس لديك صلاحية للوصول إلى إدارة الحضور</p>
      </div>
    );
  }

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: todayAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/today'],
  });

  const { data: attendanceRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { date: format(selectedDate, 'yyyy-MM-dd') }],
  });

  // Record attendance mutation
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
      toast({
        title: 'تم تسجيل الحضور بنجاح',
        description: 'تم تسجيل بيانات الحضور للموظف المحدد',
      });
      // Reset form
      setSelectedUserId('');
      setCheckInTime('');
      setCheckOutTime('');
      setNotes('');
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
      toast({
        title: 'تم تحديث الحضور بنجاح',
        description: 'تم تحديث بيانات الحضور',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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
      notes: notes || undefined,
      isPresent: true,
    };

    recordAttendanceMutation.mutate(attendanceData);
  };

  const handleCheckOut = (attendanceId: number) => {
    const currentTime = format(new Date(), 'HH:mm');
    updateAttendanceMutation.mutate({
      id: attendanceId,
      data: { clockOutTime: currentTime },
    });
  };

  // Filter out admin users for privacy (except for admin viewing)
  const filteredUsers = users.filter(u => {
    if (userRole === 'admin') return true;
    return u.role !== 'admin';
  });

  const presentToday = todayAttendance.length;
  const checkedOutToday = todayAttendance.filter(a => a.checkOut).length;

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">الحاضرون اليوم</p>
                <p className="text-2xl font-bold text-green-600">{presentToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">المنصرفون اليوم</p>
                <p className="text-2xl font-bold text-blue-600">{checkedOutToday}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">لم ينصرفوا بعد</p>
                <p className="text-2xl font-bold text-orange-600">{presentToday - checkedOutToday}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Attendance Recording */}
      <Card>
        <CardHeader>
          <CardTitle>تسجيل الحضور يدوياً</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">التاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {formatDate(selectedDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      locale={ar}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">الموظف</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName} - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkin">وقت الحضور</Label>
                <Input
                  id="checkin"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout">وقت الانصراف (اختياري)</Label>
                <Input
                  id="checkout"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Input
                id="notes"
                placeholder="أي ملاحظات إضافية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              disabled={recordAttendanceMutation.isPending}
            >
              {recordAttendanceMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الحضور'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>حضور اليوم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{record.user.fullName}</p>
                    <p className="text-sm text-gray-500">{record.user.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      دخول: {record.checkIn}
                    </Badge>
                    {record.checkOut ? (
                      <Badge variant="secondary">
                        خروج: {record.checkOut}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        لم ينصرف
                      </Badge>
                    )}
                  </div>
                </div>
                {!record.checkOut && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCheckOut(record.id)}
                    disabled={updateAttendanceMutation.isPending}
                  >
                    تسجيل الخروج
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}