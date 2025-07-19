import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeString } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export function AttendanceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState('');
  const [isPresent, setIsPresent] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: users = [] } = useQuery<any[]>({ 
    queryKey: ['/api/users']
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: t('attendance.error'),
        description: t('attendance.selectStaffError'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await apiRequest('POST', '/api/attendance', {
        userId: parseInt(userId),
        date: new Date(),
        checkIn: isPresent ? new Date() : null,
        isPresent,
        notes,
        recordedBy: user?.id,
      });
      
      toast({
        title: t('attendance.success'),
        description: t('attendance.successMessage'),
      });
      
      // Reset form
      setUserId('');
      setIsPresent(true);
      setNotes('');
      
      // Refresh attendance data
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/daily'] });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: t('attendance.error'),
        description: t('attendance.errorMessage'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">{t('attendance.staff')}</label>
        <select 
          className="w-full py-2 px-3 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        >
          <option value="">{t('attendance.selectStaff')}</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.fullName}</option>
          ))}
        </select>
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
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">{t('common.notes')}</label>
        <textarea 
          className="w-full py-2 px-3 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
          rows={3}
          placeholder={t('attendance.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? t('common.saving') : t('attendance.markAttendance')}
      </Button>
    </form>
  );
}

export default function AttendanceRecord() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const today = new Date();
  
  const { data: attendance = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/attendance/daily'],
  });
  
  return (
    <Card className="border border-secondary-200">
      <CardHeader className="px-6 py-4 border-b border-secondary-200">
        <CardTitle className="font-bold text-secondary-800">{t('attendance.dailyAttendance')}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-secondary-900">{t('attendance.today')}</p>
            <p className="text-xs text-secondary-500">{formatDate(today)}</p>
          </div>
          
          <div className="flex gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              <span className="w-2 h-2 mr-1 bg-success-500 rounded-full"></span>
              {t('attendance.present')}: {attendance?.filter(a => a.isPresent && (a.clockInTime || a.checkIn)).length || 0}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
              <span className="w-2 h-2 mr-1 bg-error-500 rounded-full"></span>
              {t('attendance.absent')}: {attendance?.filter(a => !a.isPresent || (!a.clockInTime && !a.checkIn)).length || 0}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-secondary-50 rounded-md">
                <div className="flex items-center">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="mx-3 h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : attendance?.length > 0 ? (
            attendance.slice(0, 4).map((record) => (
              <div key={record.id} className="flex items-center justify-between px-3 py-2 bg-secondary-50 rounded-md">
                <div className="flex items-center">
                  <span className={`w-2 h-2 ${record.isPresent ? (record.isLate ? 'bg-warning-500' : 'bg-success-500') : 'bg-error-500'} rounded-full`}></span>
                  <span className="mx-3 text-sm font-medium text-secondary-700">{record.user.fullName}</span>
                </div>
                <span className={`text-xs ${record.isPresent ? (record.isLate ? 'text-warning-500' : 'text-secondary-500') : 'text-error-500'}`}>
                  {record.isPresent 
                    ? (record.clockInTime || record.checkIn
                      ? (record.isLate 
                        ? `${formatTimeString(record.clockInTime || record.checkIn)} (${t('attendance.late')})`
                        : formatTimeString(record.clockInTime || record.checkIn))
                      : t('attendance.present')) 
                    : t('attendance.absent')}
                </span>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-secondary-500">
              {t('attendance.noRecords')}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-primary-300 text-primary-700 hover:bg-primary-50">
                {t('attendance.markAttendance')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center text-lg font-bold mb-4">{t('attendance.markAttendance')}</DialogTitle>
              </DialogHeader>
              <AttendanceForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}