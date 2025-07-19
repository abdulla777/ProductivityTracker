import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate } from "@/lib/utils";
import { CalendarIcon, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Report types
const REPORT_TYPES = {
  PROJECT_STATUS: "project_status",
  STAFF_PERFORMANCE: "staff_performance",
  ATTENDANCE: "attendance",
  CLIENT_PROJECTS: "client_projects",
};

export default function ReportGenerator() {
  const [reportType, setReportType] = useState(REPORT_TYPES.PROJECT_STATUS);
  const [clientId, setClientId] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() + 1))
  );

  // Fetch data based on report type
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    enabled: reportType === REPORT_TYPES.CLIENT_PROJECTS,
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: reportType === REPORT_TYPES.STAFF_PERFORMANCE || reportType === REPORT_TYPES.ATTENDANCE,
  });

  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: reportType === REPORT_TYPES.PROJECT_STATUS,
  });

  const { data: clientProjects } = useQuery({
    queryKey: [`/api/clients/${clientId}/projects`],
    enabled: reportType === REPORT_TYPES.CLIENT_PROJECTS && !!clientId,
  });

  const { data: staffProjects } = useQuery({
    queryKey: [`/api/users/${userId}/projects`],
    enabled: reportType === REPORT_TYPES.STAFF_PERFORMANCE && !!userId && userId !== "all",
  });

  const { data: attendanceRecords } = useQuery({
    queryKey: [
      `/api/users/${userId}/attendance`, 
      { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') }
    ],
    enabled: reportType === REPORT_TYPES.ATTENDANCE && !!userId && userId !== "all",
  });

  const handleGeneratePDF = () => {
    try {
      const printContent = document.querySelector('[data-report-content]')?.innerHTML;
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>تقرير - ${new Date().toLocaleDateString()}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
                  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                  th { background-color: #f5f5f5; font-weight: bold; }
                  h1, h2, h3 { color: #333; }
                  @media print { body { margin: 0; } }
                </style>
              </head>
              <body>${printContent}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleGenerateExcel = () => {
    try {
      const content = document.querySelector('[data-report-content]');
      if (content) {
        const tables = content.querySelectorAll('table');
        let csvContent = '';
        
        tables.forEach((table, index) => {
          if (index > 0) csvContent += '\n\n';
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            const rowData = Array.from(cells).map(cell => cell.textContent?.trim() || '').join(',');
            csvContent += rowData + '\n';
          });
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating Excel:", error);
    }
  };

  const handlePrint = () => {
    try {
      // Create print-friendly styles
      const printStyles = `
        <style>
          @media print {
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; margin: 20mm; direction: rtl; }
            .no-print, .print-hide { display: none !important; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: right; }
            th { background-color: #f5f5f5; font-weight: bold; }
            h1, h2, h3 { color: #333; margin: 15px 0 10px 0; }
            .page-break { page-break-before: always; }
          }
        </style>
      `;
      
      // Add styles to head temporarily
      const styleElement = document.createElement('div');
      styleElement.innerHTML = printStyles;
      document.head.appendChild(styleElement.firstChild);
      
      // Print and then remove styles
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          if (styleElement.firstChild && document.head.contains(styleElement.firstChild)) {
            document.head.removeChild(styleElement.firstChild);
          }
        }, 1000);
      }, 100);
    } catch (error) {
      console.error("Error printing:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التقرير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع التقرير</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={REPORT_TYPES.PROJECT_STATUS}>حالة المشاريع</SelectItem>
                <SelectItem value={REPORT_TYPES.STAFF_PERFORMANCE}>أداء الموظفين</SelectItem>
                <SelectItem value={REPORT_TYPES.ATTENDANCE}>تقرير الحضور</SelectItem>
                <SelectItem value={REPORT_TYPES.CLIENT_PROJECTS}>مشاريع العملاء</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === REPORT_TYPES.CLIENT_PROJECTS && (
            <div className="space-y-2">
              <label className="text-sm font-medium">العميل</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(reportType === REPORT_TYPES.STAFF_PERFORMANCE || reportType === REPORT_TYPES.ATTENDANCE) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">الموظف</label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الموظفين</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType === REPORT_TYPES.ATTENDANCE && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">من تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full text-right font-normal justify-between`}
                    >
                      {formatDate(startDate)}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ar}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">إلى تاريخ</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full text-right font-normal justify-between`}
                    >
                      {formatDate(endDate)}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ar}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div id="report-preview" className="print:p-4" data-report-content>
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="text-center border-b">
            <div className="mx-auto mb-2">
              <h1 className="text-2xl font-bold text-primary-700">شركة الهندسة والتصميم</h1>
              <p className="text-sm text-secondary-500">نظام إدارة المشاريع</p>
            </div>
            <CardTitle className="text-xl">
              {reportType === REPORT_TYPES.PROJECT_STATUS && "تقرير حالة المشاريع"}
              {reportType === REPORT_TYPES.STAFF_PERFORMANCE && "تقرير أداء الموظفين"}
              {reportType === REPORT_TYPES.ATTENDANCE && "تقرير الحضور"}
              {reportType === REPORT_TYPES.CLIENT_PROJECTS && "تقرير مشاريع العملاء"}
            </CardTitle>
            <p className="text-sm text-secondary-500 mt-1">
              تاريخ التقرير: {formatDate(new Date())}
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Project Status Report */}
            {reportType === REPORT_TYPES.PROJECT_STATUS && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-primary-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-secondary-500">إجمالي المشاريع</p>
                    <p className="text-2xl font-bold text-primary-600">{projects?.length || 0}</p>
                  </div>
                  <div className="bg-success-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-secondary-500">مكتملة</p>
                    <p className="text-2xl font-bold text-success-600">
                      {projects?.filter(p => p.status === 'completed').length || 0}
                    </p>
                  </div>
                  <div className="bg-warning-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-secondary-500">قيد التنفيذ</p>
                    <p className="text-2xl font-bold text-warning-600">
                      {projects?.filter(p => p.status === 'in_progress').length || 0}
                    </p>
                  </div>
                  <div className="bg-error-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-secondary-500">متأخرة</p>
                    <p className="text-2xl font-bold text-error-600">
                      {projects?.filter(p => p.status === 'delayed').length || 0}
                    </p>
                  </div>
                </div>
                
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">المشروع</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">العميل</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">تاريخ البدء</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">تاريخ الانتهاء المتوقع</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الحالة</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {projects?.map(project => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{project.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {`عميل رقم ${project.clientId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{formatDate(project.startDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {project.targetEndDate ? formatDate(project.targetEndDate) : 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.status === 'completed' ? 'bg-success-100 text-success-800' : 
                            project.status === 'delayed' ? 'bg-error-100 text-error-800' : 
                            project.status === 'in_progress' ? 'bg-warning-100 text-warning-800' : 
                            'bg-secondary-100 text-secondary-800'
                          }`}>
                            {project.status === 'completed' ? 'مكتمل' :
                             project.status === 'delayed' ? 'متأخر' :
                             project.status === 'in_progress' ? 'قيد التنفيذ' : 
                             project.status === 'new' ? 'جديد' : 'ملغي'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {Math.round(project.completionPercentage || 0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Staff Performance Report */}
            {reportType === REPORT_TYPES.STAFF_PERFORMANCE && (
              <div className="space-y-6">
                {userId && userId !== "all" ? (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-secondary-800 mb-2">
                        {users?.find(u => u.id.toString() === userId)?.fullName || 'الموظف'}
                      </h3>
                      <p className="text-sm text-secondary-500 mb-4">
                        إجمالي المشاريع المسندة: {staffProjects?.length || 0}
                      </p>
                    </div>
                    
                    <table className="min-w-full divide-y divide-secondary-200">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">المشروع</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">تاريخ البدء</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الحالة</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">نسبة الإنجاز</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-secondary-200">
                        {staffProjects?.map(project => (
                          <tr key={project.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{project.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{formatDate(project.startDate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                project.status === 'completed' ? 'bg-success-100 text-success-800' : 
                                project.status === 'delayed' ? 'bg-error-100 text-error-800' : 
                                project.status === 'in_progress' ? 'bg-warning-100 text-warning-800' : 
                                'bg-secondary-100 text-secondary-800'
                              }`}>
                                {project.status === 'completed' ? 'مكتمل' :
                                 project.status === 'delayed' ? 'متأخر' :
                                 project.status === 'in_progress' ? 'قيد التنفيذ' : 
                                 project.status === 'new' ? 'جديد' : 'ملغي'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                              {Math.round(project.completionPercentage || 0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الموظف</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الدور</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">البريد الإلكتروني</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">المشاريع</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {users?.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-secondary-900">{user.fullName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-secondary-500">
                              {user.role === 'engineer' ? 'مهندس' : 
                               user.role === 'project_manager' ? 'مدير مشروع' : 
                               user.role === 'admin' ? 'مدير النظام' : 'موظف إداري'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {/* In a real app, we would count projects per user */}
                            {Math.floor(Math.random() * 5) + 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Attendance Report */}
            {reportType === REPORT_TYPES.ATTENDANCE && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-secondary-800 mb-2">
                    {userId 
                      ? `تقرير حضور: ${users?.find(u => u.id.toString() === userId)?.fullName}` 
                      : 'تقرير حضور جميع الموظفين'}
                  </h3>
                  <p className="text-sm text-secondary-500">
                    الفترة: {formatDate(startDate)} - {formatDate(endDate)}
                  </p>
                </div>
                
                {userId && userId !== "all" ? (
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">التاريخ</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">وقت الحضور</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">وقت المغادرة</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الحالة</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {attendanceRecords?.map(record => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {record.checkIn 
                              ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {record.checkOut 
                              ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              !record.isPresent ? 'bg-error-100 text-error-800' : 
                              record.isLate ? 'bg-warning-100 text-warning-800' : 
                              'bg-success-100 text-success-800'
                            }`}>
                              {!record.isPresent ? 'غائب' : 
                               record.isLate ? 'متأخر' : 'حاضر'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-4 text-secondary-500">
                    يرجى اختيار موظف لعرض سجل الحضور
                  </div>
                )}
              </div>
            )}

            {/* Client Projects Report */}
            {reportType === REPORT_TYPES.CLIENT_PROJECTS && (
              <div className="space-y-6">
                {clientId ? (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-secondary-800 mb-2">
                        {clients?.find(c => c.id.toString() === clientId)?.name || 'العميل'}
                      </h3>
                      <p className="text-sm text-secondary-500 mb-4">
                        إجمالي المشاريع: {clientProjects?.length || 0}
                      </p>
                    </div>
                    
                    <table className="min-w-full divide-y divide-secondary-200">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">المشروع</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">تاريخ البدء</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">تاريخ الانتهاء المتوقع</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">الحالة</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">نسبة الإنجاز</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-secondary-200">
                        {clientProjects?.map(project => (
                          <tr key={project.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{project.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{formatDate(project.startDate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                              {project.targetEndDate ? formatDate(project.targetEndDate) : 'غير محدد'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                project.status === 'completed' ? 'bg-success-100 text-success-800' : 
                                project.status === 'delayed' ? 'bg-error-100 text-error-800' : 
                                project.status === 'in_progress' ? 'bg-warning-100 text-warning-800' : 
                                'bg-secondary-100 text-secondary-800'
                              }`}>
                                {project.status === 'completed' ? 'مكتمل' :
                                 project.status === 'delayed' ? 'متأخر' :
                                 project.status === 'in_progress' ? 'قيد التنفيذ' : 
                                 project.status === 'new' ? 'جديد' : 'ملغي'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                              {Math.round(project.completionPercentage || 0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-secondary-500">
                    يرجى اختيار عميل لعرض المشاريع
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
