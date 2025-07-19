import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRBAC } from "@/hooks/useRBAC";

// Components
import StaffCard from "@/components/staff/StaffCard";
import StaffForm from "@/components/staff/StaffForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Layout
import MainLayout from "@/components/layout/MainLayout";

export default function Staff() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { hasPermission } = useRBAC();
  
  // Fetch staff
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Filter staff based on search term and role filter
  const filteredStaff = users?.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(user.role);
    
    return matchesSearch && matchesRole;
  });
  
  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  // Generate mock data for staff cards (in a real app this would come from the API)
  const getStaffCardProps = (userId: number) => {
    return {
      projects: Math.floor(Math.random() * 5) + 1,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
    };
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-secondary-800">{t('staff.title')}</h1>
          
          {/* Only admin users can add new staff */}
          {hasPermission('staff', 'create') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span>{t('staff.add')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl mb-4">{t('staff.add')}</DialogTitle>
                </DialogHeader>
                <StaffForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <Input
              type="search"
              placeholder={t('staff.search')}
              className="pl-3 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{t('staff.role')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("admin")}
                onCheckedChange={() => handleRoleFilterChange("admin")}
              >
                {t('staff.admins')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("project_manager")}
                onCheckedChange={() => handleRoleFilterChange("project_manager")}
              >
                {t('staff.projectManagers')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("engineer")}
                onCheckedChange={() => handleRoleFilterChange("engineer")}
              >
                {t('staff.engineers')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes("admin_staff")}
                onCheckedChange={() => handleRoleFilterChange("admin_staff")}
              >
                {t('staff.administrativeStaff')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      ) : filteredStaff && filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStaff.map(staff => {
            const props = getStaffCardProps(staff.id);
            return (
              <StaffCard 
                key={staff.id} 
                staff={staff}
                projects={props.projects}
                rating={props.rating}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-secondary-600 mb-2">{t('staff.noMatchingStaff')}</h3>
          <p className="text-secondary-500 mb-6">{t('staff.tryChangingCriteria')}</p>
          <Button onClick={() => setIsDialogOpen(true)}>{t('staff.add')}</Button>
        </div>
      )}
    </MainLayout>
  );
}
