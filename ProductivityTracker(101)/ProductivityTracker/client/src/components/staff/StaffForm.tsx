import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";

// Extended schema with additional validation including residence fields
const staffFormSchema = insertUserSchema.extend({
  username: z.string().min(3, "اسم المستخدم لا يمكن أن يكون أقل من 3 أحرف"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  role: z.enum(["admin", "project_manager", "engineer", "admin_staff", "hr_manager", "general_manager"]),
  nationality: z.enum(["saudi", "resident"]).default("saudi"),
  residenceNumber: z.string().optional(),
  residenceExpiryDate: z.string().optional(),
}).refine((data) => {
  if (data.nationality === 'resident') {
    return data.residenceNumber && data.residenceExpiryDate;
  }
  return true;
}, {
  message: "رقم الإقامة وتاريخ الانتهاء مطلوبان للمقيمين",
  path: ["residenceNumber"],
});

interface StaffFormProps {
  userId?: number;
  onSuccess?: () => void;
}

export default function StaffForm({ userId, onSuccess }: StaffFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editing, fetch user data
  const fetchUserData = async () => {
    if (!userId) return null;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "لم نتمكن من جلب بيانات الموظف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create form
  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: async () => {
      if (userId) {
        const userData = await fetchUserData();
        if (userData) {
          return {
            username: userData.username || "",
            password: "", // Don't populate password field
            fullName: userData.fullName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            role: userData.role || "admin_staff",
            nationality: userData.nationality || "saudi",
            residenceNumber: userData.residenceNumber || "",
            residenceExpiryDate: userData.residenceExpiryDate || "",
          };
        }
      }
      
      return {
        username: "",
        password: "",
        fullName: "",
        email: "",
        phone: "",
        role: "admin_staff",
        nationality: "saudi",
        residenceNumber: "",
        residenceExpiryDate: "",
      };
    },
  });

  // Handle form submission
  async function onSubmit(data: z.infer<typeof staffFormSchema>) {
    try {
      setIsSubmitting(true);
      console.log("Submitting staff form with data:", data);
      
      if (userId) {
        // Remove password if it's empty (not updating password)
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        // Update user
        const response = await apiRequest(`/api/users/${userId}`, 'PATCH', updateData);
        console.log("User update response:", response);
        toast({
          title: "تم تحديث الموظف",
          description: "تم تحديث بيانات الموظف بنجاح",
        });
      } else {
        // Create new user with explicit API call
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log("User creation response:", result);
        
        toast({
          title: "تم إضافة الموظف",
          description: "تم إضافة الموظف الجديد بنجاح",
        });
        form.reset();
      }

      // Invalidate users query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting staff form:", error);
      toast({
        title: "حدث خطأ",
        description: "لم يتم حفظ بيانات الموظف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المستخدم</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسم المستخدم" {...field} />
              </FormControl>
              <FormDescription>
                اسم المستخدم الذي سيتم استخدامه لتسجيل الدخول
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{userId ? "كلمة المرور الجديدة (اترك فارغًا للإبقاء على الحالية)" : "كلمة المرور"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل</FormLabel>
              <FormControl>
                <Input placeholder="أدخل الاسم الكامل" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الهاتف</FormLabel>
              <FormControl>
                <Input placeholder="أدخل رقم الهاتف" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الدور الوظيفي</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور الوظيفي" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="project_manager">مدير مشروع</SelectItem>
                  <SelectItem value="engineer">مهندس</SelectItem>
                  <SelectItem value="admin_staff">موظف إداري</SelectItem>
                  <SelectItem value="hr_manager">مدير الموارد البشرية</SelectItem>
                  <SelectItem value="general_manager">المدير العام</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الجنسية</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنسية" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="saudi">سعودي</SelectItem>
                  <SelectItem value="resident">مقيم</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("nationality") === "resident" && (
          <>
            <FormField
              control={form.control}
              name="residenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الإقامة</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل رقم الإقامة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="residenceExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ انتهاء الإقامة</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting 
            ? "جاري الحفظ..." 
            : userId 
              ? "تحديث بيانات الموظف" 
              : "إضافة موظف جديد"
          }
        </Button>
      </form>
    </Form>
  );
}
