import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { LayoutDashboard, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";

// Components
import StatCard from "@/components/dashboard/StatCard";
import ProjectProgress from "@/components/dashboard/ProjectProgress";
import StaffPerformance from "@/components/dashboard/StaffPerformance";
import Notifications from "@/components/dashboard/Notifications";
import AttendanceRecord from "@/components/dashboard/AttendanceRecord";
import UpcomingMilestones from "@/components/dashboard/UpcomingMilestones";
import LeaveRequestsWidget from "@/components/dashboard/LeaveRequestsWidget";
import ResidenceNotificationTrigger from "@/components/staff/ResidenceNotificationTrigger";
import { Skeleton } from "@/components/ui/skeleton";

// Layout
import MainLayout from "@/components/layout/MainLayout";

// Logo path
const logoPath = "/images/logo.png";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState("");
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { canViewResidencyNotifications } = useRBAC();
  const [, navigate] = useLocation();
  
  // Redirect engineers to projects page
  useEffect(() => {
    if (user && user.role === 'engineer') {
      navigate('/projects');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    // Format current date based on the selected language
    const dateLocale = language === 'ar' ? ar : enUS;
    const dateFormat = language === 'ar' ? "EEEE، d MMMM yyyy" : "EEEE, d MMMM yyyy";
    const date = format(new Date(), dateFormat, { locale: dateLocale });
    setCurrentDate(date);
  }, [language]);
  
  // Fetch dashboard stats
  const { data: projects = [], isLoading: loadingProjects } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });
  
  const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });
  
  const { data: attendance = [], isLoading: loadingAttendance } = useQuery<any[]>({
    queryKey: ['/api/attendance/daily'],
  });
  
  // Calculate dashboard statistics
  const activeProjects = projects?.filter(project => 
    project.status === 'in_progress' || project.status === 'new'
  ).length || 0;
  
  const completedProjects = projects?.filter(project => 
    project.status === 'completed'
  ).length || 0;
  
  const delayedProjects = projects?.filter(project => 
    project.status === 'delayed'
  ).length || 0;
  
  const presentStaff = attendance?.filter(record => 
    record.isPresent && (record.clockInTime || record.checkIn)
  ).length || 0;
  
  const totalStaff = users?.filter(user => 
    user.isActive
  ).length || 0;
  
  const attendancePercentage = totalStaff > 0 
    ? Math.round((presentStaff / totalStaff) * 100) 
    : 0;
  
  const projectPercentage = projects && projects.length > 0
    ? Math.round((activeProjects / projects.length) * 100)
    : 0;
  
  const completionGrowth = "12"; // Example value, in a real app this would be calculated

  return (
    <MainLayout>
      {/* Residence Notification Trigger - Only for authorized roles */}
      {canViewResidencyNotifications() && <ResidenceNotificationTrigger />}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-secondary-800 mb-1">{t('dashboard.title')}</h2>
        <p className="text-secondary-500">{currentDate}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingProjects ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          <StatCard
            title={t('dashboard.stats.activeProjects')}
            value={activeProjects}
            icon={<LayoutDashboard className="h-5 w-5" />}
            iconBg="bg-primary-100"
            iconColor="text-primary-600"
            progress={projectPercentage}
            progressText={t('dashboard.stats.totalProjects')}
            progressBg="bg-primary-500"
          />
        )}
        
        {loadingProjects ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          <StatCard
            title={t('dashboard.stats.completedProjects')}
            value={completedProjects}
            icon={<CheckCircle className="h-5 w-5" />}
            iconBg="bg-success-100"
            iconColor="text-success-600"
            progress={78} // Example value
            progressText={t('dashboard.stats.growthRate')}
            progressBg="bg-success-500"
          />
        )}
        
        {loadingAttendance || loadingUsers ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          <StatCard
            title={t('dashboard.stats.presentStaff')}
            value={presentStaff}
            icon={<Users className="h-5 w-5" />}
            iconBg="bg-secondary-100"
            iconColor="text-secondary-600"
            progress={attendancePercentage}
            progressText={t('dashboard.stats.attendanceRate')}
            progressBg="bg-secondary-500"
          />
        )}
        
        {loadingProjects ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          <StatCard
            title={t('dashboard.stats.delayedTasks')}
            value={delayedProjects}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBg="bg-error-100"
            iconColor="text-error-600"
            progress={delayedProjects > 0 && projects ? Math.round((delayedProjects / projects.length) * 100) : 0}
            progressText={t('dashboard.stats.ofTotalTasks')}
            progressBg="bg-error-500"
          />
        )}
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (takes 2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectProgress />
          <StaffPerformance />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <Notifications />
          <LeaveRequestsWidget />
          <AttendanceRecord />
          <UpcomingMilestones />
        </div>
      </div>
    </MainLayout>
  );
}
