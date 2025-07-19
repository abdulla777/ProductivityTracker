import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Edit, Trash } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { useTranslation } from "react-i18next";

// Components
import ProjectDetails from "@/components/projects/ProjectDetails";
import ProjectForm from "@/components/projects/ProjectForm";
import { ProjectStaffAssignment } from "@/components/projects/ProjectStaffAssignment";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Layout
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";

interface ProjectDetailsPageProps {
  projectId?: number;
}

export default function ProjectDetailsPage({ projectId: propProjectId }: ProjectDetailsPageProps = {}) {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { canAccessProject } = useRBAC();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Use prop projectId if provided, otherwise use the id from the URL
  const projectId = propProjectId || (id ? parseInt(id) : 0);
  
  // Verify access to this project
  useEffect(() => {
    if (projectId && currentUser && !canAccessProject(projectId)) {
      toast({
        title: t('common.unauthorized'),
        description: t('common.noAccessToFeature'),
        variant: "destructive",
      });
      navigate('/'); // Redirect to dashboard
    }
  }, [currentUser, projectId, canAccessProject, navigate, toast, t]);
  
  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  const handleDeleteProject = async () => {
    try {
      await apiRequest('DELETE', `/api/projects/${projectId}`, {});
      
      toast({
        title: t('projects.deleted'),
        description: t('projects.deletedSuccess'),
      });
      
      // Invalidate projects query and navigate back to projects list
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      navigate('/projects');
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: t('common.error'),
        description: t('projects.deleteErrorDesc'),
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
          <a href="/projects" className="hover:text-primary-600">المشاريع</a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-secondary-800">{isLoading ? 'جار التحميل...' : project?.title}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-8 w-1/3" />
          ) : (
            <h1 className="text-2xl font-bold text-secondary-800">{project?.title}</h1>
          )}
          
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>تعديل</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl mb-4">تعديل المشروع</DialogTitle>
                </DialogHeader>
                <ProjectForm 
                  projectId={projectId} 
                  onSuccess={() => setIsEditDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
            
            {/* Only admin can delete projects */}
            {currentUser?.role === 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash className="h-4 w-4" />
                    <span>حذف</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد من حذف المشروع؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف المشروع وجميع البيانات المرتبطة به بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteProject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      حذف المشروع
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
      
      <div className="w-full">
        <ProjectDetails projectId={projectId} />
      </div>
    </MainLayout>
  );
}
