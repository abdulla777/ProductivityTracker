import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, User, Lock, Globe, Bell, Database } from "lucide-react";
import { useTranslation } from "react-i18next";

// Context
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";

// Layout
import MainLayout from "@/components/layout/MainLayout";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, setDarkMode } = useTheme();
  const { userRole, canAccessSettings } = useRBAC();
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    projectUpdates: true,
    staffAttendance: true,
    clientNotes: true,
    systemAlerts: true
  });
  
  const [systemSettings, setSystemSettings] = useState({
    language: language,
    darkMode: isDarkMode,
    autoBackup: true
  });
  
  // Backup & Restore mutations
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to create backup');
      }
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تنزيل النسخة الاحتياطية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في النسخ الاحتياطي",
        description: "فشل في إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  });
  
  // Update local state when context values change
  useEffect(() => {
    setSystemSettings(prev => ({
      ...prev,
      language: language,
      darkMode: isDarkMode
    }));
  }, [language, isDarkMode]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("User not found");
      return apiRequest('PATCH', `/api/users/${user.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: t('settings.profile.updateSuccess'),
        description: t('settings.profile.updateSuccessDesc'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('settings.profile.updateError'),
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    }
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("User not found");
      return apiRequest('POST', `/api/auth/change-password`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم التغيير",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم يتم تغيير كلمة المرور. يرجى التأكد من كلمة المرور الحالية.",
        variant: "destructive",
      });
      console.error("Error changing password:", error);
    }
  });
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };
  
  const handleNotificationSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ إعدادات الإشعارات بنجاح",
    });
  };
  
  const handleSystemSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply language change if different from current
    if (systemSettings.language !== language) {
      setLanguage(systemSettings.language);
    }
    
    // Apply dark mode change if different from current
    if (systemSettings.darkMode !== isDarkMode) {
      setDarkMode(systemSettings.darkMode);
    }
    
    toast({
      title: t("common.save"),
      // Using translation service for dynamic content
      description: language === 'ar' ? "تم حفظ إعدادات النظام بنجاح" : "System settings saved successfully",
    });
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-800 mb-1">{t('settings.title')}</h1>
        <p className="text-secondary-500">
          {t('settings.description')}
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="mb-6">
        <TabsList className={`grid w-full max-w-2xl mx-auto ${userRole === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t('settings.profile.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>{t('settings.password.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>{t('settings.system.title')}</span>
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>{t('settings.notifications.title')}</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
              <CardDescription>
                {t('settings.profile.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('settings.profile.fullName')}</Label>
                    <Input 
                      id="fullName" 
                      value={profileForm.fullName} 
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.profile.email')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileForm.email} 
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
                    <Input 
                      id="phone" 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="flex items-center gap-2"
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  {updateProfileMutation.isPending ? t('settings.profile.saving') : t('settings.profile.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.password.title')}</CardTitle>
              <CardDescription>
                {t('settings.password.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('settings.password.current')}</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      value={passwordForm.currentPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('settings.password.new')}</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={passwordForm.newPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('settings.password.confirm')}</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={passwordForm.confirmPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="flex items-center gap-2"
                  disabled={changePasswordMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  {changePasswordMutation.isPending ? t('settings.password.saving') : t('settings.password.change')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {userRole === 'admin' && (
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
                <CardDescription>
                  {t('settings.notifications.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNotificationSettingsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="project-updates">{t('settings.notifications.projectUpdates')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.notifications.projectUpdatesDesc')}
                        </p>
                      </div>
                      <Switch
                        id="project-updates"
                        checked={notificationSettings.projectUpdates}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, projectUpdates: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="staff-attendance">{t('settings.notifications.staffAttendance')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.notifications.staffAttendanceDesc')}
                        </p>
                      </div>
                      <Switch
                        id="staff-attendance"
                        checked={notificationSettings.staffAttendance}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, staffAttendance: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="client-notes">{t('settings.notifications.clientNotes')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.notifications.clientNotesDesc')}
                        </p>
                      </div>
                      <Switch
                        id="client-notes"
                        checked={notificationSettings.clientNotes}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, clientNotes: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="system-alerts">{t('settings.notifications.systemAlerts')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.notifications.systemAlertsDesc')}
                        </p>
                      </div>
                      <Switch
                        id="system-alerts"
                        checked={notificationSettings.systemAlerts}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemAlerts: checked })}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>{t('common.save')}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.system.title')}</CardTitle>
              <CardDescription>
                {t('settings.system.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSystemSettingsSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('settings.system.language')}</Label>
                    <select 
                      id="language" 
                      className="w-full py-2 px-3 border border-secondary-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      value={language}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        setSystemSettings({ ...systemSettings, language: newLang });
                        setLanguage(newLang);
                      }}
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">{t('settings.system.darkMode')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.system.darkModeDesc')}
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={isDarkMode}
                      onCheckedChange={(checked) => {
                        setSystemSettings({ ...systemSettings, darkMode: checked });
                        setDarkMode(checked);
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-backup">{t('settings.system.autoBackup')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.system.autoBackupDesc')}
                      </p>
                    </div>
                    <Switch
                      id="auto-backup"
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Database</Label>
                    <Card className="border border-secondary-200 bg-secondary-50">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-secondary-500" />
                          <p className="text-sm text-secondary-600">Current Database: PostgreSQL</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => backupMutation.mutate()}
                            disabled={backupMutation.isPending}
                          >
                            {backupMutation.isPending ? "Creating Backup..." : "Backup Now"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => {
                              toast({
                                title: "ميزة الاسترداد",
                                description: "للحصول على ميزة الاسترداد الكاملة، يرجى استخدام صفحة إدارة النظام",
                              });
                            }}
                          >
                            Use System Management
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>{t('common.save')}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
