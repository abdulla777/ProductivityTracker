import { useState } from "react";
import { Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const fileUploadSchema = z.object({
  fileName: z.string().min(1, "اسم الملف مطلوب"),
  fileDescription: z.string().optional(),
  fileType: z.string().optional(),
  fileUrl: z.string().min(1, "رابط الملف مطلوب"),
});

type FileUploadForm = z.infer<typeof fileUploadSchema>;

interface ProjectFileUploadProps {
  projectId: number;
  phaseId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectFileUpload({ 
  projectId, 
  phaseId, 
  open, 
  onOpenChange 
}: ProjectFileUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FileUploadForm>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      fileName: "",
      fileDescription: "",
      fileType: "",
      fileUrl: "",
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("fileName", file.name);
      form.setValue("fileType", file.type);
      
      // For demo purposes, we'll simulate a file upload
      // In production, you would upload to a file storage service
      const simulatedUrl = `https://example.com/files/${Date.now()}-${file.name}`;
      form.setValue("fileUrl", simulatedUrl);
    }
  };

  const onSubmit = async (data: FileUploadForm) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/project-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          phaseId: phaseId || null,
          fileName: data.fileName,
          fileDescription: data.fileDescription || null,
          fileType: data.fileType || null,
          fileUrl: data.fileUrl,
          uploadedBy: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('File upload success:', result);

      toast({
        title: "نجح رفع الملف",
        description: `تم رفع الملف "${data.fileName}" بنجاح`,
      });

      // Refresh files data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
      
      // Reset form and close dialog
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "خطأ في رفع الملف",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع الملف",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl mb-4">رفع ملف جديد</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Selection */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      اختر ملف للرفع
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PDF, DOC, XLS, PNG, JPG (أقل من 10MB)
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </div>
                
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 p-2 bg-primary-50 rounded-md">
                    <span className="text-sm text-primary-700">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        form.setValue("fileName", "");
                        form.setValue("fileUrl", "");
                      }}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* File Name */}
            <FormField
              control={form.control}
              name="fileName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الملف</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="أدخل اسم الملف" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Description */}
            <FormField
              control={form.control}
              name="fileDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف الملف (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="أدخل وصف الملف"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={uploading}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex-1"
              >
                {uploading ? "جار الرفع..." : "رفع الملف"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}