import { useState } from "react";
import { Printer, FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportGenerator from "@/components/reports/ReportGenerator";

// Layout
import MainLayout from "@/components/layout/MainLayout";

export default function Reports() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-800 mb-1">{t('reports.title')}</h1>
            <p className="text-secondary-500">
              {t('reports.description')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => {
              // Create print-friendly styles
              const printStyles = `
                <style>
                  @media print {
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; margin: 20mm; }
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
            }}>
              <Printer className="h-4 w-4" />
              <span>{t('reports.actions.print')}</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => {
              const content = document.querySelector('[data-report-content]');
              if (content) {
                // Create a CSV-style export from table data
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
            }}>
              <FileDown className="h-4 w-4" />
              <span>{t('reports.actions.excel')}</span>
            </Button>

          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('reports.welcome')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600">
              {t('reports.welcomeMessage')}
            </p>
          </CardContent>
        </Card>
        
        <ReportGenerator />
      </div>
    </MainLayout>
  );
}
