import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, BarChart4 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

// Components
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Layout
import MainLayout from "@/components/layout/MainLayout";

export default function Projects() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch projects
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Fetch clients to display client names
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });
  
  // Filter projects based on search term and status filter
  const filteredProjects = projects && Array.isArray(projects) ? projects.filter((project: any) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status);
    
    return matchesSearch && matchesStatus;
  }) : [];
  
  const getClientName = (clientId: number) => {
    const client = clients && Array.isArray(clients) 
      ? clients.find((c: any) => c.id === clientId)
      : undefined;
    return client?.name || `${t('projects.client')} #${clientId}`;
  };
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Prepare data for the chart
  const chartData = filteredProjects && filteredProjects.length > 0 ? 
    filteredProjects
      .filter((project: any) => project.status !== 'cancelled')
      .map((project: any) => ({
        name: project.title.length > 20 ? `${project.title.substring(0, 20)}...` : project.title,
        progress: project.completionPercentage || 0,
        status: project.status,
        fullName: project.title
      }))
      .sort((a: any, b: any) => b.progress - a.progress) : [];
      
  // Get color based on project status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#10b981'; // Green
      case 'in_progress': return '#3b82f6'; // Blue
      case 'delayed': return '#f59e0b'; // Amber
      case 'new': return '#6366f1'; // Indigo
      default: return '#9ca3af'; // Gray
    }
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-md rounded-md p-3 border border-gray-200">
          <p className="font-medium">{payload[0].payload.fullName}</p>
          <p className="text-sm">{`${t('projects.completionPercentage')}: ${payload[0].value}%`}</p>
          <p className="text-xs text-gray-500 capitalize">{t(`projects.status.${payload[0].payload.status}`)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-secondary-800">{t('projects.title')}</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span>{t('projects.add')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-center text-xl mb-4">{t('projects.add')}</DialogTitle>
              </DialogHeader>
              <ProjectForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <Input
              type="search"
              placeholder={t('projects.search')}
              className="pl-3 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{t('common.filter')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("new")}
                onCheckedChange={() => handleStatusFilterChange("new")}
              >
                {t('projects.status.new')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("in_progress")}
                onCheckedChange={() => handleStatusFilterChange("in_progress")}
              >
                {t('projects.status.in_progress')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("delayed")}
                onCheckedChange={() => handleStatusFilterChange("delayed")}
              >
                {t('projects.status.delayed')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("completed")}
                onCheckedChange={() => handleStatusFilterChange("completed")}
              >
                {t('projects.status.completed')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("cancelled")}
                onCheckedChange={() => handleStatusFilterChange("cancelled")}
              >
                {t('projects.status.cancelled')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {loadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChart4 className="h-4 w-4" />
              <span>{t('projects.progressChart')}</span>
            </TabsTrigger>
            <TabsTrigger value="cards">
              <span>{t('projects.all')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('projects.progressChartTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        label={{ 
                          value: t('projects.completionPercentage'), 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="progress" name={t('projects.completionPercentage')}>
                        {
                          chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#10b981] mr-2"></div>
                    <span className="text-sm">{t('projects.status.completed')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"></div>
                    <span className="text-sm">{t('projects.status.in_progress')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b] mr-2"></div>
                    <span className="text-sm">{t('projects.status.delayed')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#6366f1] mr-2"></div>
                    <span className="text-sm">{t('projects.status.new')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: any) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  clientName={getClientName(project.clientId)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-secondary-600 mb-2">{t('projects.noMatchingProjects')}</h3>
          <p className="text-secondary-500 mb-6">{t('projects.tryChangingCriteria')}</p>
          <Button onClick={() => setIsDialogOpen(true)}>{t('projects.add')}</Button>
        </div>
      )}
    </MainLayout>
  );
}
