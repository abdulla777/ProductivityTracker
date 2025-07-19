import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getStatusColor, formatPercentage } from "@/lib/utils";
import { Link } from "wouter";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ProjectProgressProps {
  limit?: number;
}

export default function ProjectProgress({ limit = 4 }: ProjectProgressProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Filter projects based on selection
  const filteredProjects = projects && Array.isArray(projects) ? projects
    .filter((project: any) => {
      if (filter === "all") return true;
      if (filter === "active") return project.status === "in_progress";
      if (filter === "delayed") return project.status === "delayed";
      if (filter === "completed") return project.status === "completed";
      return true;
    })
    .slice(0, limit) : [];

  return (
    <Card className="border border-secondary-200">
      <CardHeader className="px-6 py-4 border-b border-secondary-200 flex-row justify-between items-center">
        <CardTitle className="font-bold text-secondary-800">{t('dashboard.projectProgress.title')}</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder={t('dashboard.projectProgress.filter.allProjects')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.projectProgress.filter.allProjects')}</SelectItem>
              <SelectItem value="active">{t('dashboard.projectProgress.filter.activeProjects')}</SelectItem>
              <SelectItem value="delayed">{t('dashboard.projectProgress.filter.delayedProjects')}</SelectItem>
              <SelectItem value="completed">{t('dashboard.projectProgress.filter.completedProjects')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700" asChild>
            <Link href="/projects">{t('dashboard.projectProgress.viewAll')}</Link>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-5">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="border-b border-secondary-100 pb-5 last:border-0 last:pb-0 space-y-2">
              <div className="flex justify-between mb-2">
                <div>
                  <Skeleton className="h-5 w-40 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : (
          filteredProjects.length > 0 ? (
            filteredProjects.map((project: any) => {
              const statusColors = getStatusColor(project.status);
              
              return (
                <div key={project.id} className="border-b border-secondary-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-secondary-800">{project.title}</h3>
                      <p className="text-sm text-secondary-500">
                        {t('dashboard.projectProgress.client')}: {project.clientName || 'Client #' + project.clientId}
                      </p>
                    </div>
                    <span className={`text-sm px-2.5 py-1 ${statusColors.bg} ${statusColors.text} rounded-full`}>
                      {project.status === 'in_progress' ? t('dashboard.projectProgress.status.inProgress') : 
                       project.status === 'delayed' ? t('dashboard.projectProgress.status.delayed') : 
                       project.status === 'completed' ? t('dashboard.projectProgress.status.completed') : 
                       project.status === 'new' ? t('dashboard.projectProgress.status.new') : t('dashboard.projectProgress.status.cancelled')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-secondary-600">{t('dashboard.projectProgress.progressPercentage')}</span>
                    <span className="text-secondary-900 font-medium">{formatPercentage(project.completionPercentage)}</span>
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
              );
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-secondary-500">{t('dashboard.projectProgress.noProjects')}</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
