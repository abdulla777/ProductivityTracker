import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import MainLayout from '@/components/layout/MainLayout';
import BackupRestore from '@/components/system/BackupRestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Database } from 'lucide-react';

export default function SystemManagement() {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();

  // Only admin can access system management
  if (!user || user.role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <Shield className="h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">غير مصرح بالوصول</h1>
          <p className="text-gray-600 text-center max-w-md">
            هذه الصفحة مخصصة لمدير النظام فقط
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">إدارة النظام</h1>
          <p className="text-gray-600">
            أدوات إدارة النظام والنسخ الاحتياطي
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <BackupRestore />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">إصدار النظام:</span>
                    <span className="text-sm text-gray-600">v1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">قاعدة البيانات:</span>
                    <span className="text-sm text-gray-600">PostgreSQL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">المستخدم الحالي:</span>
                    <span className="text-sm text-gray-600">{user.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">صلاحيات المستخدم:</span>
                    <span className="text-sm text-gray-600">مدير النظام</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  حالة قاعدة البيانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">الاتصال:</span>
                    <span className="text-sm text-green-600">متصل</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">آخر نسخة احتياطية:</span>
                    <span className="text-sm text-gray-600">اليوم</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">مساحة التخزين:</span>
                    <span className="text-sm text-gray-600">متاحة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}