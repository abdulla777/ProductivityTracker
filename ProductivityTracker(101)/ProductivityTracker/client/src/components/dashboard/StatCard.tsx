import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPercentage } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  progress?: number;
  progressText?: string;
  progressBg?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  progress,
  progressText,
  progressBg = "bg-primary-500"
}: StatCardProps) {
  return (
    <Card className="border border-secondary-200">
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-secondary-500 text-sm mb-1">{title}</p>
            <h2 className="text-2xl font-bold text-secondary-900">{value}</h2>
          </div>
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", iconBg, iconColor)}>
            {icon}
          </div>
        </div>
        
        {typeof progress === 'number' && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary-600">
                {progressText || 'نسبة الإنجاز'}
              </span>
              <span className={cn("font-medium", iconColor)}>
                {formatPercentage(progress)}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full progress-bar", progressBg)}
                style={{ "--progress-width": `${progress}%` } as any}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
