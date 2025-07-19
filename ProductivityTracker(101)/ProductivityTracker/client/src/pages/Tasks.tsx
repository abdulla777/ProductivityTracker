import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getTranslationWithFallback, useTranslationWithFallback, useResponsiveTranslation } from "@/lib/translationUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, User, Flag, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { insertTaskSchema } from "@shared/schema";
import type { Task, Project, User as UserType } from "@shared/schema";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

// Enhanced task schema with validation
const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(1, "tasks.validation.nameRequired"),
  description: z.string().optional(),
  projectId: z.number().min(1, "tasks.validation.projectRequired"),
  assignedTo: z.number().min(1, "tasks.validation.assigneeRequired"),
  dueDate: z.string().min(1, "tasks.validation.dueDateRequired"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["not_started", "in_progress", "completed"])
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskWithRelations extends Task {
  project: Project;
  assignee: UserType;
  creator: UserType;
}

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getTranslation, t, language } = useResponsiveTranslation();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Check permissions
  const canCreateTasks = user?.role === "admin" || user?.role === "project_manager";
  const canDeleteTasks = user?.role === "admin" || user?.role === "project_manager";

  // Queries
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      console.log("Creating task with data:", data);
      return apiRequest("/api/tasks", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: t("tasks.createSuccess"),
        description: t("tasks.createSuccess"),
      });
    },
    onError: (error) => {
      console.error("Task creation error:", error);
      toast({
        title: getTranslation("common.error", "Error"),
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaskFormData> }) =>
      apiRequest(`/api/tasks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      toast({
        title: t("tasks.updateSuccess"),
        description: t("tasks.updateSuccess"),
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: t("tasks.deleteSuccess"),
        description: t("tasks.deleteSuccess"),
      });
    },
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: 1, // Will be validated by form
      assignedTo: 1, // Will be validated by form
      dueDate: "",
      priority: "medium",
      status: "not_started",
      createdBy: user?.id || 1,
    },
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || task.projectId.toString() === projectFilter;
    const matchesAssignee = assigneeFilter === "all" || task.assignedTo.toString() === assigneeFilter;
    
    // If showing "My Tasks", filter by current user
    if (assigneeFilter === "mine") {
      return matchesSearch && matchesStatus && matchesPriority && matchesProject && task.assignedTo === user?.id;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  const onSubmit = (data: TaskFormData) => {
    // Validate that required foreign keys are valid
    if (!data.projectId || data.projectId < 1) {
      toast({
        title: getTranslation("common.error", "Error"),
        description: getTranslation("tasks.validation.projectRequired", "Please select a valid project"),
        variant: "destructive",
      });
      return;
    }
    
    if (!data.assignedTo || data.assignedTo < 1) {
      toast({
        title: getTranslation("common.error", "Error"),
        description: getTranslation("tasks.validation.assigneeRequired", "Please select a valid assignee"),
        variant: "destructive",
      });
      return;
    }

    console.log("Task form data:", data); // Debug logging

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      const taskData = { ...data, createdBy: user?.id || 1 };
      console.log("Sending task data:", taskData); // Debug logging
      createTaskMutation.mutate(taskData);
    }
  };

  const handleEdit = (task: TaskWithRelations) => {
    if (task.assignedTo !== user?.id && !canDeleteTasks) {
      toast({
        title: t("common.error"),
        description: t("tasks.permissions.cannotEdit"),
        variant: "destructive",
      });
      return;
    }
    
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || "",
      projectId: task.projectId,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : "",
      priority: task.priority as "low" | "medium" | "high",
      status: task.status as "not_started" | "in_progress" | "completed",
      createdBy: task.createdBy,
    });
  };

  const handleDelete = (task: TaskWithRelations) => {
    if (!canDeleteTasks) {
      toast({
        title: t("common.error"),
        description: t("tasks.permissions.cannotDelete"),
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(t("tasks.deleteConfirm"))) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleQuickStatusUpdate = (task: TaskWithRelations, newStatus: string) => {
    if (task.assignedTo !== user?.id && !canDeleteTasks) {
      toast({
        title: t("common.error"),
        description: t("tasks.permissions.cannotEdit"),
        variant: "destructive",
      });
      return;
    }
    
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: newStatus as "not_started" | "in_progress" | "completed" }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "not_started": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getDateStatus = (dueDate: string | null) => {
    if (!dueDate) return "future";
    const due = new Date(dueDate);
    if (isPast(due) && !isToday(due)) return "overdue";
    if (isToday(due)) return "today";
    if (isTomorrow(due)) return "tomorrow";
    return "future";
  };

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      projectId: projects.length > 0 ? projects[0].id : 1,
      assignedTo: users.length > 0 ? users[0].id : 1,
      dueDate: "",
      priority: "medium",
      status: "not_started",
      createdBy: user?.id || 1,
    });
    setEditingTask(null);
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{getTranslation("tasks.title", "Task Management")}</h1>
        {canCreateTasks && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {getTranslation("tasks.newTask", "New Task")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? getTranslation("tasks.editTask", "Edit Task") : getTranslation("tasks.newTask", "New Task")}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getTranslation("tasks.name", "Task Name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getTranslation("tasks.description", "Description")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getTranslation("tasks.project", "Project")}</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={getTranslation("tasks.project", "Project")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getTranslation("tasks.assignedTo", "Assigned To")}</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={getTranslation("tasks.assignedTo", "Assigned To")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.fullName || user.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getTranslation("tasks.priority", "Priority")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{getTranslation("tasks.priorities.low", "Low")}</SelectItem>
                              <SelectItem value="medium">{getTranslation("tasks.priorities.medium", "Medium")}</SelectItem>
                              <SelectItem value="high">{getTranslation("tasks.priorities.high", "High")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getTranslation("tasks.status", "Status")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="not_started">{getTranslation("tasks.statuses.not_started", "Not Started")}</SelectItem>
                              <SelectItem value="in_progress">{getTranslation("tasks.statuses.in_progress", "In Progress")}</SelectItem>
                              <SelectItem value="completed">{getTranslation("tasks.statuses.completed", "Completed")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getTranslation("tasks.dueDate", "Due Date")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingTask(null);
                      resetForm();
                    }}>
                      {getTranslation("common.cancel", "Cancel")}
                    </Button>
                    <Button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending}>
                      {createTaskMutation.isPending || updateTaskMutation.isPending ? getTranslation("common.saving", "Saving...") : getTranslation("common.save", "Save")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {getTranslation("common.filter", "Filter")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={getTranslation("tasks.searchPlaceholder", "Search tasks...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation("tasks.filters.byStatus", "Filter by Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation("tasks.filters.all", "All")}</SelectItem>
                <SelectItem value="not_started">{getTranslation("tasks.statuses.not_started", "Not Started")}</SelectItem>
                <SelectItem value="in_progress">{getTranslation("tasks.statuses.in_progress", "In Progress")}</SelectItem>
                <SelectItem value="completed">{getTranslation("tasks.statuses.completed", "Completed")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation("tasks.filters.byPriority", "Filter by Priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation("tasks.filters.all", "All")}</SelectItem>
                <SelectItem value="high">{getTranslation("tasks.priorities.high", "High")}</SelectItem>
                <SelectItem value="medium">{getTranslation("tasks.priorities.medium", "Medium")}</SelectItem>
                <SelectItem value="low">{getTranslation("tasks.priorities.low", "Low")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation("tasks.assignedTo", "Filter by Assignee")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation("tasks.filters.all", "All")}</SelectItem>
                <SelectItem value="mine">{getTranslation("tasks.filters.myTasks", "My Tasks")}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.fullName || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all") && (
            <div className="mt-4">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setAssigneeFilter("all");
              }}>
                {getTranslation("common.reset", "Reset")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
                ? getTranslationWithFallback(t, "tasks.emptyFiltered", "No tasks match the current filters")
                : getTranslationWithFallback(t, "tasks.empty", "No tasks found")
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const dateStatus = getDateStatus(task.dueDate);
            const locale = language === "ar" ? ar : enUS;
            
            return (
              <Card key={task.id} className="relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                    <div className="flex space-x-1">
                      {(task.assignedTo === user?.id || canDeleteTasks) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(task)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {getTranslation("common.edit", "Edit")}
                        </Button>
                      )}
                      {canDeleteTasks && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(task)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600"
                        >
                          {getTranslation("common.delete", "Delete")}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      <Flag className="h-3 w-3 mr-1" />
                      {getTranslation(`tasks.priorities.${task.priority}`, task.priority)}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {task.status === "in_progress" && <Clock className="h-3 w-3 mr-1" />}
                      {task.status === "not_started" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {getTranslation(`tasks.statuses.${task.status}`, task.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {task.description || ""}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{getTranslation("tasks.project", "Project")}:</span>
                      <span>{task.project.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{getTranslation("tasks.assignedTo", "Assigned To")}:</span>
                      <span>{task.assignee.fullName || task.assignee.username}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{getTranslation("tasks.dueDate", "Due Date")}:</span>
                      <span className={`${dateStatus === "overdue" ? "text-red-600 font-medium" : ""}`}>
                        {task.dueDate ? format(new Date(task.dueDate), "PPP", { locale }) : getTranslation("common.notSpecified", "Not specified")}
                        {dateStatus === "overdue" && (
                          <span className="ml-1 text-red-600">({getTranslation("tasks.overdue", "Overdue")})</span>
                        )}
                        {dateStatus === "today" && (
                          <span className="ml-1 text-orange-600">({getTranslation("tasks.dueToday", "Due Today")})</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  {(task.assignedTo === user?.id || canDeleteTasks) && task.status !== "completed" && (
                    <div className="mt-4 flex gap-2">
                      {task.status === "not_started" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStatusUpdate(task, "in_progress")}
                          disabled={updateTaskMutation.isPending}
                        >
                          {getTranslation("tasks.markInProgress", "Start Progress")}
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickStatusUpdate(task, "completed")}
                          disabled={updateTaskMutation.isPending}
                        >
                          {getTranslation("tasks.markCompleted", "Mark Completed")}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{getTranslation("tasks.editTask", "Edit Task")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getTranslation("tasks.name", "Task Name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getTranslation("tasks.description", "Description")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getTranslation("tasks.project", "Project")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getTranslation("tasks.assignedTo", "Assigned To")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName || user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getTranslation("tasks.priority", "Priority")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{getTranslation("tasks.priorities.low", "Low")}</SelectItem>
                          <SelectItem value="medium">{getTranslation("tasks.priorities.medium", "Medium")}</SelectItem>
                          <SelectItem value="high">{getTranslation("tasks.priorities.high", "High")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getTranslation("tasks.status", "Status")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_started">{getTranslation("tasks.statuses.not_started", "Not Started")}</SelectItem>
                          <SelectItem value="in_progress">{getTranslation("tasks.statuses.in_progress", "In Progress")}</SelectItem>
                          <SelectItem value="completed">{getTranslation("tasks.statuses.completed", "Completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getTranslation("tasks.dueDate", "Due Date")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  {getTranslation("common.cancel", "Cancel")}
                </Button>
                <Button type="submit" disabled={updateTaskMutation.isPending}>
                  {updateTaskMutation.isPending ? getTranslation("common.saving", "Saving...") : getTranslation("common.save", "Save")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}