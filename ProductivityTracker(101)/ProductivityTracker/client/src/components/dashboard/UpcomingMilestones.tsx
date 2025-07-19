import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

// Safe date parsing helper
const safeParseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
};

// Safe date comparison
const isDateInFuture = (dateStr: string | null | undefined): boolean => {
  const date = safeParseDate(dateStr);
  if (!date) return false;
  return date >= new Date();
};
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

interface Milestone {
  id: number;
  date: string;
  title: string;
  subtitle: string;
  type: 'meeting' | 'deadline' | 'site_visit' | 'other';
}

export default function UpcomingMilestones() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  // In a real app, we would fetch upcoming milestones from the API
  // For now we'll create a simple mock that maps project phases due dates
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const { data: phases, isLoading: isLoadingPhases } = useQuery({
    queryKey: ['/api/project-phases'],
    enabled: !!projects,
  });
  
  // Loading state
  const isLoading = isLoadingProjects || isLoadingPhases;
  
  // Get milestone data from projects and phases
  const getMilestonesFromData = () => {
    if (!projects || !phases) return [];
    
    // Define translated phase names
    const getPhaseTranslation = (phase: string) => {
      switch (phase) {
        case 'architectural_design':
          return t('project.phases.architecturalDesign');
        case 'structural_design':
          return t('project.phases.structuralDesign');
        case 'mep_design':
          return t('project.phases.mepDesign');
        case 'official_approval':
          return t('project.phases.officialApproval');
        default:
          return t('project.phases.siteSupervision');
      }
    };
    
    // Get upcoming phase end dates as milestones
    const phaseMilestones = (phases as any[])
      .filter(phase => phase.endDate && isDateInFuture(phase.endDate))
      .map(phase => {
        const project = (projects as any[]).find(p => p.id === phase.projectId);
        return {
          id: phase.id,
          date: phase.endDate,
          title: `${t('dashboard.appointments.delivery')} ${getPhaseTranslation(phase.phase)} ${t('dashboard.appointments.forProject')} ${project?.title}`,
          subtitle: t('dashboard.appointments.deadline'),
          type: 'deadline',
        };
      });
    
    // For simplicity, we'll add some mock meetings based on project start dates
    const meetingMilestones = (projects as any[])
      .filter(project => isDateInFuture(project.startDate))
      .map(project => ({
        id: project.id + 1000, // Avoid ID collision
        date: project.startDate,
        title: `${t('dashboard.appointments.meetingWith')} ${project.title}`,
        subtitle: t('dashboard.appointments.companyHeadquarters'),
        type: 'meeting',
      }));
    
    // Combine and sort by date
    return [...phaseMilestones, ...meetingMilestones]
      .sort((a, b) => {
        const dateA = safeParseDate(a.date);
        const dateB = safeParseDate(b.date);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3); // Only show 3 upcoming milestones
  };
  
  const milestones = getMilestonesFromData();
  
  // Function to determine background color based on milestone type
  const getMilestoneBgColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-primary-100 text-primary-700';
      case 'deadline':
        return 'bg-warning-100 text-warning-700';
      case 'site_visit':
        return 'bg-secondary-100 text-secondary-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  return (
    <Card className="border border-secondary-200">
      <CardHeader className="px-6 py-4 border-b border-secondary-200">
        <CardTitle className="font-bold text-secondary-800">{t('dashboard.appointments.upcoming')}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary-50 rounded-md">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : milestones.length > 0 ? (
          milestones.map((milestone) => {
            const date = safeParseDate(milestone.date);
            const day = date ? date.getDate() : '?';
            const month = date ? date.toLocaleString(language === 'ar' ? 'ar' : 'en', { month: 'short' }) : '---';
            
            return (
              <div key={milestone.id} className="flex items-start gap-3 p-3 bg-secondary-50 rounded-md">
                <div className={`w-12 h-12 rounded-md ${getMilestoneBgColor(milestone.type)} flex flex-col items-center justify-center font-medium text-center`}>
                  <span>{day}</span>
                  <span className="text-xs">{month}</span>
                </div>
                <div>
                  <p className="font-medium text-secondary-800">{milestone.title}</p>
                  <p className="text-xs text-secondary-500 mt-1">{milestone.subtitle}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center">
            <p className="text-secondary-500">{t('dashboard.appointments.noUpcoming')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
