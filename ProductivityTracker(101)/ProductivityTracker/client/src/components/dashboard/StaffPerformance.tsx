import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface StaffPerformanceProps {
  limit?: number;
}

export default function StaffPerformance({ limit = 3 }: StaffPerformanceProps) {
  const { t } = useTranslation();
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // In a real app, we would fetch evaluations for each user
  // Here we'll generate some mock data based on the users we fetched
  const staffWithPerformance = users && Array.isArray(users) ? users.slice(0, limit).map((user: any, index: number) => {
    // Mock performance data
    const mockPerformance = {
      projectCount: Math.floor(Math.random() * 5) + 1,
      completionPercentage: Math.floor(Math.random() * 50) + 50, // 50-100%
      rating: Math.floor(Math.random() * 2) + 3, // 3-5 stars
    };
    
    return {
      ...user,
      ...mockPerformance
    };
  }) : [];

  return (
    <Card className="border border-secondary-200">
      <CardHeader className="px-6 py-4 border-b border-secondary-200 flex-row justify-between items-center">
        <CardTitle className="font-bold text-secondary-800">{t('dashboard.staffPerformance.title')}</CardTitle>
        <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700" asChild>
          <Link href="/staff">{t('dashboard.staffPerformance.viewAll')}</Link>
        </Button>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">{t('dashboard.staffPerformance.columns.employee')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">{t('dashboard.staffPerformance.columns.projects')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">{t('dashboard.staffPerformance.columns.completionRate')}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">{t('dashboard.staffPerformance.columns.rating')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {isLoadingUsers ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ms-4">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-2 w-full mb-1" />
                    <Skeleton className="h-3 w-8" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))
            ) : staffWithPerformance?.length > 0 ? (
              staffWithPerformance.map((staff: any) => (
                <tr key={staff.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={staff.fullName} />
                        <AvatarFallback>{getInitials(staff.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="ms-4">
                        <div className="text-sm font-medium text-secondary-900">{staff.fullName}</div>
                        <div className="text-sm text-secondary-500">
                          {staff.role === "engineer" 
                            ? t('dashboard.staffPerformance.roles.engineer') 
                            : staff.role === "admin" 
                              ? t('dashboard.staffPerformance.roles.admin') 
                              : t('dashboard.staffPerformance.roles.admin_staff')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{staff.projectCount} {t('dashboard.staffPerformance.projects')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className={`h-full ${staff.completionPercentage > 80 ? 'bg-success-500' : 'bg-primary-500'} rounded-full`} style={{ width: `${staff.completionPercentage}%` }}></div>
                    </div>
                    <div className="text-xs text-secondary-500 mt-1">{staff.completionPercentage}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < staff.rating ? 'text-warning-400 fill-warning-400' : 'text-secondary-300'}`} 
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-secondary-500">
                  {t('dashboard.staffPerformance.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
