import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, CheckCircle, Clock, Calendar, Target, Award, BarChart3 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { useResponsiveTranslation } from "@/lib/translationUtils";
import MainLayout from "@/components/layout/MainLayout";

// Types
interface Project {
  id: number;
  title: string;
  completionPercentage: number;
  status: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  projectId: number;
  assignedTo: number;
  createdAt: string;
  project: Project;
  assignee: { id: number; fullName: string; username: string };
}

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface Attendance {
  id: number;
  userId: number;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  isLate: boolean;
  user: User;
}

export default function Analytics() {
  const { user } = useAuth();
  const { userRole, canAccessReports } = useRBAC();
  const { getTranslation } = useResponsiveTranslation();
  
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });

  // Data queries
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Check access permissions
  if (!canAccessReports()) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{getTranslation("common.unauthorized", "Unauthorized Access")}</h2>
            <p className="text-muted-foreground">{getTranslation("common.noAccessToFeature", "You don't have access to this feature")}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const inDateRange = taskDate >= startDate && taskDate <= endDate;
    const inProject = selectedProject === "all" || task.projectId.toString() === selectedProject;
    
    return inDateRange && inProject;
  });

  // Analytics calculations
  const projectProgressData = projects.map(project => ({
    name: project.title,
    completion: project.completionPercentage,
    tasksTotal: tasks.filter(t => t.projectId === project.id).length,
    tasksCompleted: tasks.filter(t => t.projectId === project.id && t.status === 'completed').length
  }));

  const taskStatusData = [
    { name: getTranslation("tasks.statuses.not_started", "Not Started"), value: filteredTasks.filter(t => t.status === 'not_started').length, color: '#8884d8' },
    { name: getTranslation("tasks.statuses.in_progress", "In Progress"), value: filteredTasks.filter(t => t.status === 'in_progress').length, color: '#82ca9d' },
    { name: getTranslation("tasks.statuses.completed", "Completed"), value: filteredTasks.filter(t => t.status === 'completed').length, color: '#ffc658' },
    { name: getTranslation("tasks.overdue", "Overdue"), value: filteredTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length, color: '#ff7c7c' }
  ];

  const priorityData = [
    { name: getTranslation("tasks.priorities.high", "High"), value: filteredTasks.filter(t => t.priority === 'high').length },
    { name: getTranslation("tasks.priorities.medium", "Medium"), value: filteredTasks.filter(t => t.priority === 'medium').length },
    { name: getTranslation("tasks.priorities.low", "Low"), value: filteredTasks.filter(t => t.priority === 'low').length }
  ];

  // Top contributors calculation
  const contributorStats = users.map(user => {
    const userTasks = filteredTasks.filter(t => t.assignedTo === user.id);
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return {
      id: user.id,
      name: user.fullName || user.username,
      role: user.role,
      tasksCompleted: completedTasks,
      totalTasks,
      completionRate: Math.round(completionRate)
    };
  }).sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 5);

  // Summary statistics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = filteredTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{getTranslation("analytics.title", "Analytics Dashboard")}</h1>
            <p className="text-muted-foreground">{getTranslation("analytics.description", "Project and team performance insights")}</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {getTranslation("analytics.filters", "Filters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{getTranslation("analytics.project", "Project")}</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{getTranslation("analytics.allProjects", "All Projects")}</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{getTranslation("analytics.startDate", "Start Date")}</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{getTranslation("analytics.endDate", "End Date")}</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getTranslation("analytics.totalTasks", "Total Tasks")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {getTranslation("analytics.inSelectedPeriod", "In selected period")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getTranslation("analytics.completedTasks", "Completed Tasks")}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% {getTranslation("analytics.completion", "completion rate")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getTranslation("analytics.overdueTasks", "Overdue Tasks")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                {getTranslation("analytics.requiresAttention", "Requires attention")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{getTranslation("analytics.activeProjects", "Active Projects")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {getTranslation("analytics.currentlyInProgress", "Currently in progress")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">{getTranslation("analytics.projectProgress", "Project Progress")}</TabsTrigger>
            <TabsTrigger value="tasks">{getTranslation("analytics.taskAnalysis", "Task Analysis")}</TabsTrigger>
            <TabsTrigger value="team">{getTranslation("analytics.teamPerformance", "Team Performance")}</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation("analytics.projectCompletion", "Project Completion")}</CardTitle>
                  <CardDescription>{getTranslation("analytics.completionPercentage", "Completion percentage by project")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completion" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation("analytics.tasksPerProject", "Tasks per Project")}</CardTitle>
                  <CardDescription>{getTranslation("analytics.totalVsCompleted", "Total vs completed tasks")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tasksTotal" fill="#82ca9d" name={getTranslation("analytics.totalTasks", "Total")} />
                      <Bar dataKey="tasksCompleted" fill="#8884d8" name={getTranslation("analytics.completed", "Completed")} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation("analytics.tasksByStatus", "Tasks by Status")}</CardTitle>
                  <CardDescription>{getTranslation("analytics.statusDistribution", "Distribution of task statuses")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation("analytics.tasksByPriority", "Tasks by Priority")}</CardTitle>
                  <CardDescription>{getTranslation("analytics.priorityDistribution", "Distribution of task priorities")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {getTranslation("analytics.topContributors", "Top Contributors")}
                </CardTitle>
                <CardDescription>{getTranslation("analytics.topPerformers", "Top performing team members by task completion")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contributorStats.map((contributor, index) => (
                    <div key={contributor.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{contributor.name}</p>
                          <p className="text-sm text-muted-foreground">{getTranslation(`role.${contributor.role}`, contributor.role)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">
                            {contributor.tasksCompleted}/{contributor.totalTasks} {getTranslation("analytics.tasks", "tasks")}
                          </Badge>
                          <Badge variant={contributor.completionRate >= 80 ? "default" : contributor.completionRate >= 60 ? "secondary" : "destructive"}>
                            {contributor.completionRate}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}