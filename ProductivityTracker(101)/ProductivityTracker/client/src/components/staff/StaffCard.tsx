import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Link } from "wouter";
import { getInitials, getRoleTranslationKey } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { User } from "@shared/schema";

interface StaffCardProps {
  staff: User;
  projects?: number;
  rating?: number;
}

export default function StaffCard({ staff, projects = 0, rating = 0 }: StaffCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="border border-secondary-200 transition-shadow hover:shadow-md">
      <CardContent className="pt-6 px-6">
        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src="" alt={staff.fullName} />
            <AvatarFallback className="text-lg">{getInitials(staff.fullName)}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg text-secondary-800 text-center">{staff.fullName}</h3>
          <Badge variant="outline" className="mt-1">
            {t(getRoleTranslationKey(staff.role))}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary-500">{t('staff.email')}</span>
            <span className="text-sm font-medium text-secondary-700 truncate max-w-[150px]" title={staff.email}>
              {staff.email}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary-500">{t('staff.phoneNumber')}</span>
            <span className="text-sm font-medium text-secondary-700">
              {staff.phone || t('staff.notAvailable')}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary-500">{t('staff.assignedProjects')}</span>
            <span className="text-sm font-medium text-secondary-700">{projects}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-secondary-500">{t('staff.rating')}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < rating ? 'text-warning-400 fill-warning-400' : 'text-secondary-300'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/staff/${staff.id}`}>{t('staff.viewProfile')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
