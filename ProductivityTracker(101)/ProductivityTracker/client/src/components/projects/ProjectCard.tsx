import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDate, getStatusColor, formatPercentage } from "@/lib/utils";
import { Project } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useRBAC } from "@/hooks/useRBAC";

interface ProjectCardProps {
  project: Project;
  clientName?: string;
}

export default function ProjectCard({ project, clientName }: ProjectCardProps) {
  const { t } = useTranslation();
  const { canViewDetailedProjectInfo } = useRBAC();
  const statusColors = getStatusColor(project.status);
  
  const getStatusLabel = (status: string) => {
    return t(`projects.status.${status}`);
  };
  
  return (
    <Card className="border border-secondary-200 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-secondary-800">{project.title}</h3>
            <p className="text-sm text-secondary-500">
              {clientName || `عميل رقم ${project.clientId}`}
            </p>
          </div>
          <Badge className={`${statusColors.bg} ${statusColors.text} hover:${statusColors.bg} border-0`}>
            {getStatusLabel(project.status)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          <div>
            <p className="text-xs text-secondary-500">{t('projects.startDate')}</p>
            <p className="text-sm font-medium">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-secondary-500">{t('projects.targetEndDate')}</p>
            <p className="text-sm font-medium">{project.targetEndDate ? formatDate(project.targetEndDate) : t('common.notSpecified')}</p>
          </div>
          <div>
            <p className="text-xs text-secondary-500">{t('projects.location')}</p>
            <p className="text-sm font-medium">{project.location || t('common.notSpecified')}</p>
          </div>
          {canViewDetailedProjectInfo() && (
            <div>
              <p className="text-xs text-secondary-500">{t('projects.completionPercentage')}</p>
              <p className="text-sm font-medium">{formatPercentage(project.completionPercentage)}</p>
            </div>
          )}
        </div>
        
        {canViewDetailedProjectInfo() && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-secondary-600">{t('projects.completionPercentage')}</span>
              <span className="font-medium">{formatPercentage(project.completionPercentage)}</span>
            </div>
            <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full progress-bar ${
                  project.status === 'completed' ? 'bg-success-500' : 
                  project.status === 'delayed' ? 'bg-error-500' : 'bg-primary-500'
                }`}
                style={{ "--progress-width": `${project.completionPercentage}%` } as any}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 px-5 pb-5">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/projects/${project.id}`}>{t('projects.viewDetails')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
