import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type User, type ProjectStaff } from "@shared/schema";

interface ProjectStaffAssignmentProps {
  projectId: number;
}

interface ProjectStaffWithUser extends ProjectStaff {
  user: User;
}

export function ProjectStaffAssignment({ projectId }: ProjectStaffAssignmentProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch current project staff
  const { data: projectStaff = [], refetch: refetchStaff } = useQuery<ProjectStaffWithUser[]>({
    queryKey: [`/api/projects/${projectId}/staff`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/staff`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch("/api/project-staff", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, userId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      refetchStaff();
      setSelectedUserId("");
      toast({
        title: "نجح",
        description: "تم إضافة الموظف للمشروع بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الموظف للمشروع",
        variant: "destructive",
      });
    },
  });

  // Remove staff mutation
  const removeStaffMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/projects/${projectId}/staff/${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      refetchStaff();
      toast({
        title: "نجح",
        description: "تم إزالة الموظف من المشروع بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إزالة الموظف من المشروع",
        variant: "destructive",
      });
    },
  });

  const handleAddStaff = () => {
    if (!selectedUserId) return;
    addStaffMutation.mutate(parseInt(selectedUserId));
  };

  const handleRemoveStaff = (userId: number) => {
    if (confirm("هل أنت متأكد من إزالة هذا الموظف من المشروع؟")) {
      removeStaffMutation.mutate(userId);
    }
  };

  // Filter out users who are already assigned
  const assignedUserIds = projectStaff.map(ps => ps.userId);
  const availableUsers = users.filter(user => !assignedUserIds.includes(user.id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">فريق عمل المشروع</CardTitle>
        <div className="text-sm text-muted-foreground">
          {projectStaff.length} موظف
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new staff member */}
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="اختر موظف للإضافة" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.fullName} ({user.role === 'engineer' ? 'مهندس' : 
                   user.role === 'project_manager' ? 'مدير مشروع' : 
                   user.role === 'admin' ? 'مدير النظام' : 'موظف إداري'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddStaff}
            disabled={!selectedUserId || addStaffMutation.isPending}
            className="px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة
          </Button>
        </div>

        {/* Current staff members */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium border-b pb-2">أعضاء الفريق الحالي</h4>
          {projectStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لم يتم تعيين موظفين لهذا المشروع بعد</p>
              <p className="text-sm">استخدم القائمة أعلاه لإضافة أعضاء الفريق</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectStaff.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg border">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="h-10 w-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-medium">
                      {staff.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{staff.user.fullName}</p>
                      <p className="text-sm text-secondary-600">
                        {staff.user.role === 'engineer' ? 'مهندس' : 
                         staff.user.role === 'project_manager' ? 'مدير مشروع' : 
                         staff.user.role === 'admin' ? 'مدير النظام' : 'موظف إداري'}
                      </p>
                      <p className="text-xs text-secondary-500">
                        تم التعيين: {new Date(staff.assignedAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                    onClick={() => handleRemoveStaff(staff.userId)}
                    disabled={removeStaffMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}