import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Eye, Trash2, Building2, User, Mail, Phone, Calendar, TrendingUp, FileText, ExternalLink, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { useResponsiveTranslation } from "@/lib/translationUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/MainLayout";

// Types
interface Opportunity {
  id: number;
  title: string;
  clientName: string;
  phone?: string;
  email?: string;
  organization?: string;
  type: 'new_project' | 'partnership' | 'vendor_registration' | 'ongoing_project' | 'project_expansion';
  status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  strength: 'strong' | 'medium' | 'weak';
  estimatedValue?: number;
  description?: string;
  notes?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  createdBy: number;
  assignedTo?: number;
  linkedProjectId?: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  fullName?: string;
  role: string;
}

interface Project {
  id: number;
  title: string;
  status: string;
}

// Validation schema
const opportunitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  organization: z.string().optional(),
  type: z.enum(['new_project', 'partnership', 'vendor_registration', 'ongoing_project', 'project_expansion']),
  status: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  strength: z.enum(['strong', 'medium', 'weak']),
  estimatedValue: z.number().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  assignedTo: z.number().optional(),
  linkedProjectId: z.number().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

export default function Opportunities() {
  const { user } = useAuth();
  const { userRole, hasPermission, canViewProjectFinancials } = useRBAC();
  const { getTranslation } = useResponsiveTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [viewingOpportunity, setViewingOpportunity] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [strengthFilter, setStrengthFilter] = useState<string>("all");

  // Check permissions
  const canCreateOpportunities = userRole === "admin" || userRole === "project_manager";
  const canEditOpportunities = userRole === "admin" || userRole === "project_manager";
  const canDeleteOpportunities = userRole === "admin";

  // Form setup
  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "",
      clientName: "",
      phone: "",
      email: "",
      organization: "",
      type: "new_project",
      status: "lead",
      strength: "medium",
      estimatedValue: undefined,
      description: "",
      notes: "",
      expectedCloseDate: "",
      assignedTo: undefined,
      linkedProjectId: undefined,
    },
  });

  // Queries
  const { data: opportunities = [], isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Mutations
  const createOpportunityMutation = useMutation({
    mutationFn: (data: OpportunityFormData) => {
      const opportunityData = {
        ...data,
        createdBy: user?.id || 1,
        assignedTo: data.assignedTo || user?.id || 1
      };
      console.log("Creating opportunity with data:", opportunityData);
      return apiRequest("/api/opportunities", "POST", opportunityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: getTranslation("opportunities.created", "Opportunity Created"),
        description: getTranslation("opportunities.createdSuccess", "Opportunity has been created successfully"),
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Opportunity creation error:", error);
      toast({
        title: getTranslation("common.error", "Error"),
        description: error.message || getTranslation("opportunities.createError", "Error creating opportunity. Please try again."),
        variant: "destructive",
      });
    }
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OpportunityFormData }) => 
      apiRequest(`/api/opportunities/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: getTranslation("opportunities.updated", "Opportunity Updated"),
        description: getTranslation("opportunities.updatedSuccess", "Opportunity has been updated successfully"),
      });
      setEditingOpportunity(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: getTranslation("common.error", "Error"),
        description: getTranslation("opportunities.updateError", "Error updating opportunity. Please try again."),
        variant: "destructive",
      });
    }
  });

  const deleteOpportunityMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/opportunities/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: getTranslation("opportunities.deleted", "Opportunity Deleted"),
        description: getTranslation("opportunities.deletedSuccess", "Opportunity has been deleted successfully"),
      });
    }
  });

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.organization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
    const matchesType = typeFilter === "all" || opportunity.type === typeFilter;
    const matchesStrength = strengthFilter === "all" || opportunity.strength === strengthFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesStrength;
  });

  // Form handlers
  const resetForm = () => {
    form.reset();
    setEditingOpportunity(null);
  };

  const onSubmit = (data: OpportunityFormData) => {
    if (editingOpportunity) {
      updateOpportunityMutation.mutate({ id: editingOpportunity.id, data });
    } else {
      createOpportunityMutation.mutate(data);
    }
  };

  const handleEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    form.reset({
      title: opportunity.title,
      clientName: opportunity.clientName,
      phone: opportunity.phone || "",
      email: opportunity.email || "",
      organization: opportunity.organization || "",
      type: opportunity.type,
      status: opportunity.status,
      strength: opportunity.strength,
      estimatedValue: opportunity.estimatedValue || undefined,
      description: opportunity.description || "",
      notes: opportunity.notes || "",
      expectedCloseDate: opportunity.expectedCloseDate || "",
      assignedTo: opportunity.assignedTo || undefined,
      linkedProjectId: opportunity.linkedProjectId || undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (opportunity: Opportunity) => {
    if (confirm(getTranslation("opportunities.deleteConfirm", "Are you sure you want to delete this opportunity?"))) {
      deleteOpportunityMutation.mutate(opportunity.id);
    }
  };

  // Helper functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'won': return 'default';
      case 'lost': return 'destructive';
      case 'negotiation': return 'secondary';
      case 'proposal': return 'outline';
      default: return 'secondary';
    }
  };

  const getStrengthBadgeVariant = (strength: string) => {
    switch (strength) {
      case 'strong': return 'default';
      case 'medium': return 'secondary';
      case 'weak': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'new_project': getTranslation("opportunities.types.new_project", "New Project"),
      'partnership': getTranslation("opportunities.types.partnership", "Partnership"),
      'vendor_registration': getTranslation("opportunities.types.vendor_registration", "Vendor Registration"),
      'ongoing_project': getTranslation("opportunities.types.ongoing_project", "Ongoing Project"),
      'project_expansion': getTranslation("opportunities.types.project_expansion", "Project Expansion"),
    };
    return typeMap[type] || type;
  };

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      'lead': getTranslation("opportunities.statuses.lead", "Lead"),
      'qualified': getTranslation("opportunities.statuses.qualified", "Qualified"),
      'proposal': getTranslation("opportunities.statuses.proposal", "Proposal"),
      'negotiation': getTranslation("opportunities.statuses.negotiation", "Negotiation"),
      'won': getTranslation("opportunities.statuses.won", "Won"),
      'lost': getTranslation("opportunities.statuses.lost", "Lost"),
    };
    return statusMap[status] || status;
  };

  const getStrengthName = (strength: string) => {
    const strengthMap: Record<string, string> = {
      'strong': getTranslation("opportunities.strengths.strong", "Strong"),
      'medium': getTranslation("opportunities.strengths.medium", "Medium"),
      'weak': getTranslation("opportunities.strengths.weak", "Weak"),
    };
    return strengthMap[strength] || strength;
  };

  // Check access permissions
  if (!hasPermission('projects', 'view')) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{getTranslation("common.unauthorized", "Unauthorized Access")}</h2>
            <p className="text-muted-foreground">{getTranslation("common.noAccessToFeature", "You don't have access to this feature")}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{getTranslation("opportunities.title", "Opportunity Management")}</h1>
            <p className="text-muted-foreground">{getTranslation("opportunities.description", "Manage leads and business opportunities")}</p>
          </div>
          {canCreateOpportunities && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  {getTranslation("opportunities.newOpportunity", "New Opportunity")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOpportunity ? 
                      getTranslation("opportunities.editOpportunity", "Edit Opportunity") : 
                      getTranslation("opportunities.newOpportunity", "New Opportunity")
                    }
                  </DialogTitle>
                  <DialogDescription>
                    {getTranslation("opportunities.formDescription", "Enter the opportunity details below")}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.title", "Title")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.clientName", "Client Name")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.phone", "Phone")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>{getTranslation("opportunities.email", "Email")}</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="organization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.organization", "Organization")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.type", "Type")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="new_project">{getTranslation("opportunities.types.new_project", "New Project")}</SelectItem>
                                <SelectItem value="partnership">{getTranslation("opportunities.types.partnership", "Partnership")}</SelectItem>
                                <SelectItem value="vendor_registration">{getTranslation("opportunities.types.vendor_registration", "Vendor Registration")}</SelectItem>
                                <SelectItem value="ongoing_project">{getTranslation("opportunities.types.ongoing_project", "Ongoing Project")}</SelectItem>
                                <SelectItem value="project_expansion">{getTranslation("opportunities.types.project_expansion", "Project Expansion")}</SelectItem>
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
                            <FormLabel>{getTranslation("opportunities.status", "Status")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="lead">{getTranslation("opportunities.statuses.lead", "Lead")}</SelectItem>
                                <SelectItem value="qualified">{getTranslation("opportunities.statuses.qualified", "Qualified")}</SelectItem>
                                <SelectItem value="proposal">{getTranslation("opportunities.statuses.proposal", "Proposal")}</SelectItem>
                                <SelectItem value="negotiation">{getTranslation("opportunities.statuses.negotiation", "Negotiation")}</SelectItem>
                                <SelectItem value="won">{getTranslation("opportunities.statuses.won", "Won")}</SelectItem>
                                <SelectItem value="lost">{getTranslation("opportunities.statuses.lost", "Lost")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="strength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.strength", "Strength")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="strong">{getTranslation("opportunities.strengths.strong", "Strong")}</SelectItem>
                                <SelectItem value="medium">{getTranslation("opportunities.strengths.medium", "Medium")}</SelectItem>
                                <SelectItem value="weak">{getTranslation("opportunities.strengths.weak", "Weak")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {canViewProjectFinancials() && (
                        <FormField
                          control={form.control}
                          name="estimatedValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{getTranslation("opportunities.estimatedValue", "Estimated Value")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="expectedCloseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.expectedCloseDate", "Expected Close Date")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.assignedTo", "Assigned To")}</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{getTranslation("opportunities.unassigned", "Unassigned")}</SelectItem>
                                {users.map(user => (
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
                      
                      <FormField
                        control={form.control}
                        name="linkedProjectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getTranslation("opportunities.linkedProject", "Linked Project")}</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{getTranslation("opportunities.noProject", "No Project")}</SelectItem>
                                {projects.map(project => (
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
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getTranslation("opportunities.description", "Description")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
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
                          <FormLabel>{getTranslation("opportunities.notes", "Notes")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {getTranslation("opportunities.fileUpload", "Upload Files")}
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              {getTranslation("opportunities.attachments", "Attachments")} (PDF, DOC, XLS)
                            </span>
                          </label>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                            className="sr-only"
                            onChange={(e) => {
                              // Handle file upload logic here
                              console.log("Files selected:", e.target.files);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        {getTranslation("common.cancel", "Cancel")}
                      </Button>
                      <Button type="submit" disabled={createOpportunityMutation.isPending || updateOpportunityMutation.isPending}>
                        {(createOpportunityMutation.isPending || updateOpportunityMutation.isPending) ? 
                          getTranslation("common.saving", "Saving...") : 
                          getTranslation("common.save", "Save")
                        }
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
              {getTranslation("opportunities.filters", "Filters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={getTranslation("opportunities.searchPlaceholder", "Search opportunities...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={getTranslation("opportunities.filterByStatus", "Filter by Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getTranslation("opportunities.allStatuses", "All Statuses")}</SelectItem>
                  <SelectItem value="lead">{getTranslation("opportunities.statuses.lead", "Lead")}</SelectItem>
                  <SelectItem value="qualified">{getTranslation("opportunities.statuses.qualified", "Qualified")}</SelectItem>
                  <SelectItem value="proposal">{getTranslation("opportunities.statuses.proposal", "Proposal")}</SelectItem>
                  <SelectItem value="negotiation">{getTranslation("opportunities.statuses.negotiation", "Negotiation")}</SelectItem>
                  <SelectItem value="won">{getTranslation("opportunities.statuses.won", "Won")}</SelectItem>
                  <SelectItem value="lost">{getTranslation("opportunities.statuses.lost", "Lost")}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={getTranslation("opportunities.filterByType", "Filter by Type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getTranslation("opportunities.allTypes", "All Types")}</SelectItem>
                  <SelectItem value="new_project">{getTranslation("opportunities.types.new_project", "New Project")}</SelectItem>
                  <SelectItem value="partnership">{getTranslation("opportunities.types.partnership", "Partnership")}</SelectItem>
                  <SelectItem value="vendor_registration">{getTranslation("opportunities.types.vendor_registration", "Vendor Registration")}</SelectItem>
                  <SelectItem value="ongoing_project">{getTranslation("opportunities.types.ongoing_project", "Ongoing Project")}</SelectItem>
                  <SelectItem value="project_expansion">{getTranslation("opportunities.types.project_expansion", "Project Expansion")}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={strengthFilter} onValueChange={setStrengthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={getTranslation("opportunities.filterByStrength", "Filter by Strength")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getTranslation("opportunities.allStrengths", "All Strengths")}</SelectItem>
                  <SelectItem value="strong">{getTranslation("opportunities.strengths.strong", "Strong")}</SelectItem>
                  <SelectItem value="medium">{getTranslation("opportunities.strengths.medium", "Medium")}</SelectItem>
                  <SelectItem value="weak">{getTranslation("opportunities.strengths.weak", "Weak")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities Grid */}
        {opportunitiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" || strengthFilter !== "all" 
                  ? getTranslation("opportunities.noMatchingOpportunities", "No opportunities match your filters")
                  : getTranslation("opportunities.noOpportunities", "No opportunities found")
                }
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" || strengthFilter !== "all"
                  ? getTranslation("opportunities.tryChangingFilters", "Try changing your filters or create a new opportunity")
                  : getTranslation("opportunities.getStarted", "Create your first opportunity to get started")
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => {
              const assignedUser = users.find(u => u.id === opportunity.assignedTo);
              const linkedProject = projects.find(p => p.id === opportunity.linkedProjectId);
              
              return (
                <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{opportunity.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {opportunity.clientName}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={getStatusBadgeVariant(opportunity.status)}>
                          {getStatusName(opportunity.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{getTypeName(opportunity.type)}</span>
                      </div>
                      
                      {opportunity.organization && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{opportunity.organization}</span>
                        </div>
                      )}
                      
                      {opportunity.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{opportunity.email}</span>
                        </div>
                      )}
                      
                      {opportunity.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{opportunity.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <Badge variant={getStrengthBadgeVariant(opportunity.strength)}>
                          {getStrengthName(opportunity.strength)}
                        </Badge>
                        
                        {canViewProjectFinancials() && opportunity.estimatedValue && (
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" />
                            ${opportunity.estimatedValue.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {opportunity.expectedCloseDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {getTranslation("opportunities.expectedClose", "Expected")}: {format(new Date(opportunity.expectedCloseDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      )}
                      
                      {assignedUser && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{assignedUser.fullName || assignedUser.username}</span>
                        </div>
                      )}
                      
                      {linkedProject && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                          <span>{linkedProject.title}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setViewingOpportunity(opportunity)}>
                        <Eye className="h-4 w-4 mr-1" />
                        {getTranslation("common.view", "View")}
                      </Button>
                      {canEditOpportunities && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(opportunity)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {getTranslation("common.edit", "Edit")}
                        </Button>
                      )}
                      {canDeleteOpportunities && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(opportunity)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          {getTranslation("common.delete", "Delete")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* View Opportunity Dialog */}
        {viewingOpportunity && (
          <Dialog open={!!viewingOpportunity} onOpenChange={() => setViewingOpportunity(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewingOpportunity.title}</DialogTitle>
                <DialogDescription>
                  {getTranslation("opportunities.opportunityDetails", "Opportunity details and information")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.clientName", "Client Name")}</label>
                    <p className="text-sm text-muted-foreground">{viewingOpportunity.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.status", "Status")}</label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(viewingOpportunity.status)}>
                        {getStatusName(viewingOpportunity.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {viewingOpportunity.organization && (
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.organization", "Organization")}</label>
                    <p className="text-sm text-muted-foreground">{viewingOpportunity.organization}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {viewingOpportunity.email && (
                    <div>
                      <label className="text-sm font-medium">{getTranslation("opportunities.email", "Email")}</label>
                      <p className="text-sm text-muted-foreground">{viewingOpportunity.email}</p>
                    </div>
                  )}
                  {viewingOpportunity.phone && (
                    <div>
                      <label className="text-sm font-medium">{getTranslation("opportunities.phone", "Phone")}</label>
                      <p className="text-sm text-muted-foreground">{viewingOpportunity.phone}</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.type", "Type")}</label>
                    <p className="text-sm text-muted-foreground">{getTypeName(viewingOpportunity.type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.strength", "Strength")}</label>
                    <div className="mt-1">
                      <Badge variant={getStrengthBadgeVariant(viewingOpportunity.strength)}>
                        {getStrengthName(viewingOpportunity.strength)}
                      </Badge>
                    </div>
                  </div>
                  {canViewProjectFinancials() && viewingOpportunity.estimatedValue && (
                    <div>
                      <label className="text-sm font-medium">{getTranslation("opportunities.estimatedValue", "Estimated Value")}</label>
                      <p className="text-sm text-muted-foreground">${viewingOpportunity.estimatedValue.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                {viewingOpportunity.description && (
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.description", "Description")}</label>
                    <p className="text-sm text-muted-foreground">{viewingOpportunity.description}</p>
                  </div>
                )}
                
                {viewingOpportunity.notes && (
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.notes", "Notes")}</label>
                    <p className="text-sm text-muted-foreground">{viewingOpportunity.notes}</p>
                  </div>
                )}
                
                {viewingOpportunity.expectedCloseDate && (
                  <div>
                    <label className="text-sm font-medium">{getTranslation("opportunities.expectedCloseDate", "Expected Close Date")}</label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(viewingOpportunity.expectedCloseDate), "MMMM dd, yyyy")}
                    </p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {getTranslation("opportunities.createdAt", "Created")}: {format(new Date(viewingOpportunity.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}