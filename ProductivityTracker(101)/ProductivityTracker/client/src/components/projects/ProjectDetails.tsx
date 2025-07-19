import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor, formatPercentage, getPhaseTranslationKey, getStatusTranslationKey } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectPhase } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pencil, FileUp, Users } from "lucide-react";
import { ProjectStaffAssignment } from "./ProjectStaffAssignment";
import ProjectFileUpload from "./ProjectFileUpload";

interface ProjectDetailsProps {
  projectId: number;
}

interface PhaseUpdateDialogProps {
  phase: ProjectPhase;
  onClose: () => void;
}

function PhaseUpdateDialog({ phase, onClose }: PhaseUpdateDialogProps) {
  const [status, setStatus] = useState(phase.status);
  const [completion, setCompletion] = useState(phase.completionPercentage?.toString() || "0");
  const [remarks, setRemarks] = useState(phase.remarks || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      await apiRequest('PATCH', `/api/project-phases/${phase.id}`, {
        status,
        completionPercentage: parseFloat(completion),
        remarks
      });
      
      toast({
        title: "تم تحديث المرحلة",
        description: "تم تحديث حالة المرحلة بنجاح",
      });
      
      // Invalidate queries to reflect changes
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${phase.projectId}/phases`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${phase.projectId}`] });
      
      onClose();
    } catch (error) {
      console.error("Error updating phase:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم تحديث المرحلة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">حالة المرحلة</label>
        <select 
          className="w-full py-2 px-3 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="not_started">لم يبدأ</option>
          <option value="in_progress">قيد التنفيذ</option>
          <option value="delayed">متأخر</option>
          <option value="completed">مكتمل</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">نسبة الإنجاز</label>
        <div className="flex items-center">
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
            value={completion}
            onChange={(e) => setCompletion(e.target.value)}
          />
          <span className="mr-2 text-sm font-medium text-secondary-700">{completion}%</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">ملاحظات</label>
        <textarea 
          className="w-full py-2 px-3 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button variant="outline" type="button" onClick={onClose}>إلغاء</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "جاري الحفظ..." : "تحديث المرحلة"}
        </Button>
      </div>
    </form>
  );
}

export default function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const { t } = useTranslation();
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  
  // Fetch project details
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  // Fetch project phases
  const { data: phases, isLoading: loadingPhases } = useQuery({
    queryKey: [`/api/projects/${projectId}/phases`],
  });
  
  // Fetch client info
  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: project ? [`/api/clients/${project.clientId}`] : [],
    enabled: !!project,
  });
  
  // Fetch project staff
  const { data: projectStaff, isLoading: loadingStaff } = useQuery({
    queryKey: [`/api/projects/${projectId}/staff`],
  });
  
  // Fetch project files
  const { data: files, isLoading: loadingFiles } = useQuery({
    queryKey: [`/api/projects/${projectId}/files`],
  });
  
  const selectedPhase = phases?.find(phase => phase.id === selectedPhaseId) || null;
  
  if (loadingProject) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }
  
  if (!project) {
    return <div className="p-6 text-center text-error-500">لم يتم العثور على المشروع</div>;
  }
  
  const statusColors = getStatusColor(project.status);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">{project.title}</h1>
          <p className="text-secondary-500">
            العميل: {client?.name || `عميل رقم ${project.clientId}`}
          </p>
        </div>
        <Badge className={`${statusColors.bg} ${statusColors.text} hover:${statusColors.bg} border-0`}>
          {t(getStatusTranslationKey(project.status))}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل المشروع</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-secondary-500">تاريخ البدء</p>
              <p className="font-medium">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-500">تاريخ الانتهاء المتوقع</p>
              <p className="font-medium">{project.targetEndDate ? formatDate(project.targetEndDate) : 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-500">الموقع</p>
              <p className="font-medium">{project.location || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-500">نسبة الإنجاز</p>
              <p className="font-medium">{formatPercentage(project.completionPercentage)}</p>
            </div>
            {project.description && (
              <div className="col-span-2">
                <p className="text-sm text-secondary-500">الوصف</p>
                <p className="font-medium">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">تقدم المشروع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-secondary-600">نسبة الإنجاز الكلية</span>
                  <span className="font-medium">{formatPercentage(project.completionPercentage)}</span>
                </div>
                <div className="w-full h-3 bg-secondary-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full progress-bar ${
                      project.status === 'completed' ? 'bg-success-500' : 
                      project.status === 'delayed' ? 'bg-error-500' : 'bg-primary-500'
                    }`}
                    style={{ "--progress-width": `${project.completionPercentage}%` } as any}
                  ></div>
                </div>
              </div>
              
              {loadingPhases ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : phases && phases.length > 0 ? (
                <div className="space-y-3">
                  {phases.map(phase => (
                    <div key={phase.id} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{t(getPhaseTranslationKey(phase.phase))}</span>
                        <Dialog open={isPhaseDialogOpen && selectedPhaseId === phase.id} onOpenChange={(open) => {
                          if (!open) setIsPhaseDialogOpen(false);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => {
                                setSelectedPhaseId(phase.id);
                                setIsPhaseDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تحديث مرحلة المشروع</DialogTitle>
                            </DialogHeader>
                            {selectedPhase && (
                              <PhaseUpdateDialog 
                                phase={selectedPhase} 
                                onClose={() => setIsPhaseDialogOpen(false)} 
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`px-2 py-0.5 rounded-full ${
                          phase.status === 'completed' ? 'bg-success-100 text-success-700' : 
                          phase.status === 'delayed' ? 'bg-error-100 text-error-700' : 
                          phase.status === 'in_progress' ? 'bg-primary-100 text-primary-700' : 
                          'bg-secondary-100 text-secondary-700'
                        }`}>
                          {t(getStatusTranslationKey(phase.status))}
                        </span>
                        <span>{formatPercentage(phase.completionPercentage)}</span>
                      </div>
                      <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            phase.status === 'completed' ? 'bg-success-500' : 
                            phase.status === 'delayed' ? 'bg-error-500' : 
                            phase.status === 'in_progress' ? 'bg-primary-500' : 
                            'bg-secondary-300'
                          }`}
                          style={{ width: `${phase.completionPercentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-secondary-500">
                  لم يتم إضافة مراحل لهذا المشروع بعد
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>فريق العمل</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span>الملفات</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="staff" className="mt-6">
          <ProjectStaffAssignment projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">ملفات المشروع</CardTitle>
              <Button 
                size="sm" 
                onClick={() => setIsFileUploadOpen(true)}
              >
                رفع ملف جديد
              </Button>
            </CardHeader>
            <CardContent>
              {loadingFiles ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : files && files.length > 0 ? (
                <div className="divide-y divide-secondary-100">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center">
                          <FileUp className="h-5 w-5" />
                        </div>
                        <div className="mr-3">
                          <p className="font-medium text-secondary-800">{file.fileName}</p>
                          <p className="text-sm text-secondary-500">{file.fileDescription || 'بدون وصف'}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                          عرض الملف
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary-500">
                  لا توجد ملفات مرفقة لهذا المشروع
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* File Upload Dialog */}
      <ProjectFileUpload
        projectId={projectId}
        open={isFileUploadOpen}
        onOpenChange={setIsFileUploadOpen}
      />
    </div>
  );
}
