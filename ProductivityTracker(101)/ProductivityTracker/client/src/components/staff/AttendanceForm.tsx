import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Clock, CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface AttendanceFormProps {
  userId?: number;
  date?: Date;
  onSuccess?: () => void;
}

export default function AttendanceForm({ userId, date = new Date(), onSuccess }: AttendanceFormProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState<string>(userId?.toString() || "");
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [isPresent, setIsPresent] = useState(true);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [notes, setNotes] = useState("");

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/attendance', data);
    },
    onSuccess: () => {
      toast({
        title: t('attendance.success'),
        description: t('attendance.successMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/daily'] });
      
      // Reset form or close dialog
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('attendance.error'),
        description: t('attendance.errorMessage'),
        variant: "destructive",
      });
      console.error("Error recording attendance:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      toast({
        title: t('attendance.error'),
        description: t('attendance.selectStaffError'),
        variant: "destructive",
      });
      return;
    }
    
    const attendanceData = {
      userId: parseInt(selectedUserId),
      date: format(selectedDate, "yyyy-MM-dd"),
      isPresent,
      recordedBy: currentUser?.id,
      notes: notes || "", // Ensure notes is always a string
    };
    
    if (isPresent) {
      // Send simple HH:MM format directly to API for better compatibility
      attendanceData.clockInTime = checkInTime;
      attendanceData.clockOutTime = checkOutTime;
    }
    
    attendanceMutation.mutate(attendanceData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Staff Selection */}
      {!userId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-secondary-700">{t('attendance.staff')}</Label>
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            disabled={loadingUsers}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('attendance.selectStaff')} />
            </SelectTrigger>
            <SelectContent>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">{t('attendance.date')}</label>
        <div className="border border-secondary-200 rounded-md p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={language === 'ar' ? ar : undefined}
            className="mx-auto"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">{t('attendance.status')}</label>
        <div className="flex space-x-4 space-x-reverse">
          <div className="flex items-center">
            <input 
              type="radio" 
              id="present" 
              name="attendance-status" 
              className="ml-2 focus:ring-primary-500 h-4 w-4 text-primary-600 border-secondary-300"
              checked={isPresent}
              onChange={() => setIsPresent(true)}
            />
            <label htmlFor="present" className="text-sm text-secondary-700">{t('attendance.present')}</label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              id="absent" 
              name="attendance-status" 
              className="ml-2 focus:ring-primary-500 h-4 w-4 text-primary-600 border-secondary-300"
              checked={!isPresent}
              onChange={() => setIsPresent(false)}
            />
            <label htmlFor="absent" className="text-sm text-secondary-700">{t('attendance.absent')}</label>
          </div>
        </div>
      </div>
      
      {isPresent && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">{t('attendance.checkIn')}</label>
            <div className="relative">
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input 
                type="time" 
                className="w-full py-2 pr-10 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">{t('attendance.checkOut')}</label>
            <div className="relative">
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input 
                type="time" 
                className="w-full py-2 pr-10 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">{t('common.notes')}</label>
        <Textarea 
          placeholder={t('attendance.notesPlaceholder')} 
          className="min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={attendanceMutation.isPending || !selectedUserId}
      >
        {attendanceMutation.isPending ? t('common.saving') : t('attendance.markAttendance')}
      </Button>
    </form>
  );
}
