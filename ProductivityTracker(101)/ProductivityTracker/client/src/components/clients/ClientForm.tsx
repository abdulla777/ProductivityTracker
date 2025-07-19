import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertClientSchema } from "@shared/schema";

// Extended schema with additional validation
const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(2, "اسم العميل لا يمكن أن يكون أقل من حرفين"),
  contactPerson: z.string().min(2, "اسم شخص الاتصال مطلوب"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون على الأقل 10 أرقام"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
});

interface ClientFormProps {
  clientId?: number;
  onSuccess?: () => void;
}

export default function ClientForm({ clientId, onSuccess }: ClientFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editing, fetch client data
  const fetchClientData = async () => {
    if (!clientId) return null;
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch client: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "لم نتمكن من جلب بيانات العميل. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create form
  const form = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: async () => {
      if (clientId) {
        const clientData = await fetchClientData();
        if (clientData) {
          return {
            name: clientData.name || "",
            contactPerson: clientData.contactPerson || "",
            email: clientData.email || "",
            phone: clientData.phone || "",
            address: clientData.address || "",
            notes: clientData.notes || "",
          };
        }
      }
      
      return {
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      };
    },
  });

  // Handle form submission
  async function onSubmit(data: z.infer<typeof clientFormSchema>) {
    try {
      setIsSubmitting(true);
      
      if (clientId) {
        // Update client
        await apiRequest(`/api/clients/${clientId}`, 'PATCH', data);
        toast({
          title: "تم تحديث العميل",
          description: "تم تحديث بيانات العميل بنجاح",
        });
      } else {
        // Create new client
        await apiRequest('/api/clients', 'POST', data);
        toast({
          title: "تم إضافة العميل",
          description: "تم إضافة العميل الجديد بنجاح",
        });
        form.reset();
      }

      // Invalidate clients query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting client form:", error);
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      toast({
        title: "حدث خطأ في حفظ العميل",
        description: `${errorMessage}. يرجى المحاولة مرة أخرى.`,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم العميل</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسم العميل / الشركة" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شخص الاتصال</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسم شخص الاتصال" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العنوان</FormLabel>
              <FormControl>
                <Input placeholder="أدخل العنوان" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="أي ملاحظات إضافية حول العميل"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting 
            ? "جاري الحفظ..." 
            : clientId 
              ? "تحديث بيانات العميل" 
              : "إضافة عميل جديد"
          }
        </Button>
      </form>
    </Form>
  );
}
