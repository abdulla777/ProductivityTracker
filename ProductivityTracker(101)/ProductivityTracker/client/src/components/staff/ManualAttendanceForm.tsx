import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Clock, User, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ManualAttendanceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ManualAttendanceForm({ onSuccess, onCancel }: ManualAttendanceFormProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPresent, setIsPresent] = useState(true);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار الموظف",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const attendanceData = {
        userId: parseInt(selectedUserId),
        date: format(selectedDate, "yyyy-MM-dd"),
        isPresent,
        recordedBy: currentUser?.id,
        notes: notes || "", // Ensure notes is always a string
      };
      
      if (isPresent) {
        // Format times as simple HH:MM strings for the API with correct field names
        attendanceData.clockInTime = checkInTime;
        attendanceData.clockOutTime = checkOutTime;
      }
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(attendanceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to record attendance');
      }
      
      const result = await response.json();
      
      toast({
        title: "تم تسجيل الحضور",
        description: "تم تسجيل الحضور بنجاح",
      });
      
      // Reset form
      setSelectedUserId("");
      setSelectedDate(new Date());
      setIsPresent(true);
      setCheckInTime("09:00");
      setCheckOutTime("17:00");
      setNotes("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast({
        title: "خطأ في تسجيل الحضور",
        description: "فشل في تسجيل الحضور. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          تسجيل حضور يدوي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Staff Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">اختيار الموظف</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الموظف" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {user.fullName} ({user.role})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">التاريخ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: language === 'ar' ? ar : undefined }) : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Attendance Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">حالة الحضور</Label>
            <Select
              value={isPresent ? "present" : "absent"}
              onValueChange={(value) => setIsPresent(value === "present")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Fields - Only show when present */}
          {isPresent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">وقت الدخول</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">وقت الخروج</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ملاحظات</Label>
            <Textarea
              placeholder="إضافة ملاحظات (اختياري)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                إلغاء
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedUserId}
              className="min-w-24"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تسجيل الحضور'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}