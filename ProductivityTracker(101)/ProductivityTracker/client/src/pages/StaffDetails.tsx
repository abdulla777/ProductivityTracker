import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Edit, Trash, Briefcase, Clock, Star } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { useTranslation } from "react-i18next";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import StaffForm from "@/components/staff/StaffForm";
import AttendanceForm from "@/components/staff/AttendanceForm";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTimeString, formatRelativeTime, getInitials, getRoleLabel } from "@/lib/utils";

// Layout
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";

interface StaffDetailsPageProps {
  staffId?: number;
}

export default function StaffDetailsPage({ staffId: propStaffId }: StaffDetailsPageProps = {}) {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { canAccessStaffProfile } = useRBAC();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  
  // Use prop staffId if provided, otherwise use the id from the URL
  const userId = propStaffId || (id ? parseInt(id) : 0);
  
  // Verify access to this staff profile
  useEffect(() => {
    if (userId && currentUser && !canAccessStaffProfile(userId)) {
      toast({
        title: t('common.unauthorized'),
        description: t('common.noAccessToFeature'),
        variant: "destructive",
      });
      navigate('/'); // Redirect to dashboard
    }
  }, [currentUser, userId, canAccessStaffProfile, navigate, toast, t]);
  
  // Fetch staff details
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
  });
  
  // Fetch staff projects
  const { data: projects } = useQuery({
    queryKey: [`/api/users/${userId}/projects`],
    enabled: !!userId,
  });
  
  // Fetch staff attendance records
  const { data: attendance } = useQuery({
    queryKey: [
      `/api/users/${userId}/attendance`, 
      { 
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
        endDate: new Date().toISOString().split('T')[0] 
      }
    ],
    enabled: !!userId,
  });
  
  // Fetch staff evaluations
  const { data: evaluations } = useQuery({
    queryKey: [`/api/users/${userId}/evaluations`],
    enabled: !!userId,
  });
  
  const handleDeleteStaff = async () => {
    try {
      await apiRequest('PATCH', `/api/users/${userId}`, { isActive: false });
      
      toast({
        title: "تم تعطيل حساب الموظف",
        description: "تم تعطيل حساب الموظف بنجاح",
      });
      
      // Invalidate users query and navigate back to staff list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      navigate('/staff');
    } catch (error) {
      console.error("Error disabling staff:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم تعطيل حساب الموظف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Calculate average rating from evaluations
  const averageRating = evaluations?.length 
    ? evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / evaluations.length 
    : 0;

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
          <a href="/staff" className="hover:text-primary-600">الموظفين</a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-secondary-800">{isLoading ? 'جار التحميل...' : user?.fullName}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-8 w-1/3" />
          ) : (
            <h1 className="text-2xl font-bold text-secondary-800">{user?.fullName}</h1>
          )}
          
          <div className="flex gap-2">
            <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>تسجيل حضور</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl mb-4">تسجيل حضور الموظف</DialogTitle>
                </DialogHeader>
                <AttendanceForm 
                  userId={userId} 
                  onSuccess={() => setIsAttendanceDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>تعديل</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl mb-4">تعديل بيانات الموظف</DialogTitle>
                </DialogHeader>
                <StaffForm 
                  userId={userId} 
                  onSuccess={() => setIsEditDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash className="h-4 w-4" />
                  <span>تعطيل</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من تعطيل حساب الموظف؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تعطيل حساب الموظف ولن يتمكن من الوصول إلى النظام. يمكنك إعادة تفعيل الحساب لاحقًا.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteStaff}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    تعطيل الحساب
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : user ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="" alt={user.fullName} />
                    <AvatarFallback className="text-2xl">{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold text-secondary-800 mb-1">{user.fullName}</h2>
                  <Badge variant="outline" className="mb-4">
                    {getRoleLabel(user.role)}
                  </Badge>
                  
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">اسم المستخدم</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">البريد الإلكتروني</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-secondary-500">رقم الهاتف</span>
                        <span className="font-medium">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">تاريخ الإضافة</span>
                      <span className="font-medium">{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">الحالة</span>
                      <span className={`font-medium ${user.isActive ? 'text-success-600' : 'text-error-600'}`}>
                        {user.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>ملخص الأداء</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <div className="bg-primary-50 rounded-lg p-4 text-center">
                    <Briefcase className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                    <h3 className="text-xl font-bold text-primary-600">{projects?.length || 0}</h3>
                    <p className="text-sm text-secondary-600">المشاريع المسندة</p>
                  </div>
                  
                  <div className="bg-success-50 rounded-lg p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-success-600" />
                    <h3 className="text-xl font-bold text-success-600">
                      {attendance?.filter(a => a.isPresent).length || 0}
                    </h3>
                    <p className="text-sm text-secondary-600">أيام الحضور</p>
                  </div>
                  
                  <div className="bg-warning-50 rounded-lg p-4 text-center">
                    <Star className="h-6 w-6 mx-auto mb-2 text-warning-600" />
                    <h3 className="text-xl font-bold text-warning-600">
                      {averageRating.toFixed(1)}
                    </h3>
                    <p className="text-sm text-secondary-600">متوسط التقييم</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-secondary-800 mb-2">إنجازات الموظف</h3>
                  {projects && projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.slice(0, 3).map(project => (
                        <div key={project.id} className="flex justify-between items-center p-3 bg-secondary-50 rounded-md">
                          <div>
                            <p className="font-medium text-secondary-800">{project.title}</p>
                            <p className="text-sm text-secondary-500">
                              {project.status === 'completed' ? 'مكتمل' : 
                               project.status === 'delayed' ? 'متأخر' : 
                               project.status === 'in_progress' ? 'قيد التنفيذ' : 'جديد'}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round(project.completionPercentage || 0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500 text-center py-4">لم يتم تعيين أي مشاريع لهذا الموظف بعد</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="projects">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>المشاريع</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>سجل الحضور</span>
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>التقييمات</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>المشاريع المسندة</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects && projects.length > 0 ? (
                    <div className="divide-y divide-secondary-100">
                      {projects.map(project => (
                        <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-secondary-800">{project.title}</h3>
                              <p className="text-sm text-secondary-500">
                                تاريخ البدء: {formatDate(project.startDate)}
                                {project.targetEndDate && ` - تاريخ الانتهاء المتوقع: ${formatDate(project.targetEndDate)}`}
                              </p>
                            </div>
                            <Badge className={
                              project.status === 'completed' ? 'bg-success-100 text-success-800 hover:bg-success-100' : 
                              project.status === 'delayed' ? 'bg-error-100 text-error-800 hover:bg-error-100' : 
                              project.status === 'in_progress' ? 'bg-warning-100 text-warning-800 hover:bg-warning-100' : 
                              'bg-primary-100 text-primary-800 hover:bg-primary-100'
                            }>
                              {project.status === 'completed' ? 'مكتمل' : 
                               project.status === 'delayed' ? 'متأخر' : 
                               project.status === 'in_progress' ? 'قيد التنفيذ' : 'جديد'}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-secondary-600">نسبة الإنجاز</span>
                              <span className="font-medium">{Math.round(project.completionPercentage || 0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  project.status === 'completed' ? 'bg-success-500' : 
                                  project.status === 'delayed' ? 'bg-error-500' : 'bg-primary-500'
                                }`}
                                style={{ width: `${project.completionPercentage || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/projects/${project.id}`}>عرض المشروع</a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary-500 mb-4">لم يتم تعيين أي مشاريع لهذا الموظف بعد</p>
                      <Button variant="outline">تعيين مشروع جديد</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="attendance" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>سجل الحضور والانصراف</CardTitle>
                  <Button size="sm" onClick={() => setIsAttendanceDialogOpen(true)}>
                    تسجيل حضور جديد
                  </Button>
                </CardHeader>
                <CardContent>
                  {attendance && attendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">التاريخ</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">وقت الحضور</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">وقت الانصراف</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الحالة</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                          {attendance.map(record => (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                {formatTimeString(record.clockInTime || record.checkIn)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                {formatTimeString(record.clockOutTime || record.checkOut)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  !record.isPresent ? 'bg-error-100 text-error-800' : 
                                  record.isLate ? 'bg-warning-100 text-warning-800' : 
                                  'bg-success-100 text-success-800'
                                }`}>
                                  {!record.isPresent ? 'غائب' : record.isLate ? 'متأخر' : 'حاضر'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                {record.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary-500 mb-4">لا يوجد سجل حضور لهذا الموظف خلال الفترة الأخيرة</p>
                      <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                        تسجيل حضور جديد
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="evaluations" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>تقييمات الأداء</CardTitle>
                  <Button size="sm">إضافة تقييم جديد</Button>
                </CardHeader>
                <CardContent>
                  {evaluations && evaluations.length > 0 ? (
                    <div className="space-y-4">
                      {evaluations.map(evaluation => (
                        <div key={evaluation.id} className="p-4 bg-secondary-50 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium text-secondary-800">
                                {evaluation.projectId ? `تقييم لمشروع رقم ${evaluation.projectId}` : 'تقييم عام'}
                              </h3>
                              <p className="text-sm text-secondary-500">
                                {formatRelativeTime(evaluation.evaluatedAt)}
                              </p>
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-5 w-5 ${i < evaluation.rating ? 'text-warning-400 fill-warning-400' : 'text-secondary-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          {evaluation.comments && (
                            <div className="bg-white p-3 rounded-md text-sm">
                              {evaluation.comments}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary-500 mb-4">لا توجد تقييمات لهذا الموظف حتى الآن</p>
                      <Button>إضافة تقييم جديد</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-secondary-600 mb-2">لم يتم العثور على الموظف</h3>
          <p className="text-secondary-500 mb-6">قد يكون الموظف غير موجود أو تم حذفه</p>
          <Button asChild>
            <a href="/staff">العودة إلى قائمة الموظفين</a>
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
