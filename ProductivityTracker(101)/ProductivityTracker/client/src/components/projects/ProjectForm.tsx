import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { type Project, type Client } from "@shared/schema";

// Form schema with Date objects for internal use
const projectFormSchema = z.object({
  title: z.string().min(3, "عنوان المشروع لا يمكن أن يكون أقل من 3 أحرف"),
  description: z.string().optional(),
  clientId: z.string().or(z.number()).transform(val => Number(val)),
  location: z.string().optional(),
  status: z.enum(["new", "in_progress", "delayed", "completed", "cancelled"]).optional(),
  startDate: z.date(),
  targetEndDate: z.date().optional(),
  createdBy: z.number(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  projectId?: number;
  onSuccess?: () => void;
}

export default function ProjectForm({ projectId, onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients for the dropdown
  const { data: clients = [], isLoading: loadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Fetch project data if editing
  const { data: project, isLoading: loadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Create form
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: 1,
      location: "",
      status: "new",
      startDate: new Date(),
      targetEndDate: undefined,
      createdBy: user?.id || 1,
    },
  });

  // Update form values when project data is loaded
  useEffect(() => {
    if (project && !loadingProject && typeof project === 'object') {
      form.reset({
        title: (project as any).title || "",
        description: (project as any).description || "",
        clientId: (project as any).clientId || 1,
        location: (project as any).location || "",
        status: (project as any).status || "new",
        startDate: (project as any).startDate ? new Date((project as any).startDate) : new Date(),
        targetEndDate: (project as any).targetEndDate ? new Date((project as any).targetEndDate) : undefined,
        createdBy: (project as any).createdBy || user?.id || 1,
      });
    }
  }, [project, loadingProject, form, user?.id]);

  // Handle form submission
  async function onSubmit(data: ProjectFormData) {
    try {
      setIsSubmitting(true);
      
      // Transform date objects to YYYY-MM-DD strings before sending to API
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString().split('T')[0],
        targetEndDate: data.targetEndDate ? data.targetEndDate.toISOString().split('T')[0] : undefined,
        completionPercentage: 0.0,
      };
      
      if (projectId) {
        // Update existing project
        await apiRequest('PATCH', `/api/projects/${projectId}`, formattedData);
        toast({
          title: "تم تحديث المشروع",
          description: "تم تحديث بيانات المشروع بنجاح",
        });
      } else {
        // Create new project
        await apiRequest('POST', '/api/projects', formattedData);
        toast({
          title: "تم إنشاء المشروع",
          description: "تم إنشاء المشروع الجديد بنجاح",
        });
        form.reset();
      }

      // Invalidate projects query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting project form:", error);
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      toast({
        title: "حدث خطأ في حفظ المشروع",
        description: `${errorMessage}. يرجى المحاولة مرة أخرى.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingProject && projectId) {
    return <div className="p-4 text-center">جاري تحميل بيانات المشروع...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان المشروع</FormLabel>
              <FormControl>
                <Input placeholder="أدخل عنوان المشروع" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف المشروع</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل وصف المشروع" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العميل</FormLabel>
              <Select 
                disabled={loadingClients}
                onValueChange={field.onChange} 
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients?.map((client: any) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الموقع</FormLabel>
              <FormControl>
                <Input placeholder="أدخل موقع المشروع" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>حالة المشروع</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "new"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="delayed">متأخر</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ البدء</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full text-right font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        {field.value ? formatDate(field.value) : "اختر التاريخ"}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الانتهاء المستهدف</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full text-right font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                      >
                        {field.value ? formatDate(field.value) : "اختر التاريخ"}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01") || 
                        (form.getValues("startDate") && date < form.getValues("startDate"))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "جاري الحفظ..." : (projectId ? "تحديث المشروع" : "إنشاء المشروع")}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            إعادة تعيين
          </Button>
        </div>
      </form>
    </Form>
  );
}