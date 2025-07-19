import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Edit, Trash, Building, Phone, Mail, MapPin, FileText, LayoutPanelLeft } from "lucide-react";
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useTranslation } from 'react-i18next';

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ClientForm from "@/components/clients/ClientForm";
import ProjectCard from "@/components/projects/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Layout
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";

interface ClientDetailsPageProps {
  clientId?: number;
}

export default function ClientDetailsPage({ clientId: propClientId }: ClientDetailsPageProps = {}) {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { hasFeatureAccess } = useRBAC();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  // Use prop clientId if provided, otherwise use the id from the URL
  const clientId = propClientId || (id ? parseInt(id) : 0);
  
  // Verify access to clients feature
  useEffect(() => {
    if (currentUser && !hasFeatureAccess('clients')) {
      toast({
        title: t('common.unauthorized'),
        description: t('common.noAccessToFeature'),
        variant: "destructive",
      });
      navigate('/'); // Redirect to dashboard
    }
  }, [currentUser, hasFeatureAccess, navigate, toast, t]);
  
  // Fetch client details
  const { data: client, isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
  });
  
  // Fetch client projects
  const { data: projects } = useQuery({
    queryKey: [`/api/clients/${clientId}/projects`],
    enabled: !!clientId,
  });
  
  // Fetch client notes
  const { data: notes } = useQuery({
    queryKey: [`/api/clients/${clientId}/notes`],
    enabled: !!clientId,
  });
  
  const handleDeleteClient = async () => {
    try {
      // In a real app with a full database, we would add a "deleted" flag
      // Here we'll just use a PATCH to update some fields to indicate deletion
      await apiRequest('PATCH', `/api/clients/${clientId}`, { 
        notes: client?.notes ? `${client.notes} [DELETED]` : '[DELETED]'
      });
      
      toast({
        title: t('clients.deleted'),
        description: t('clients.deletedSuccess'),
      });
      
      // Invalidate clients query and navigate back to clients list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      navigate('/clients');
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: t('common.error'),
        description: t('clients.deleteError'),
        variant: "destructive",
      });
    }
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await apiRequest('POST', '/api/client-notes', {
        clientId,
        note: newNote,
        createdBy: 1, // In a real app, this would be the current user ID
      });
      
      toast({
        title: t('common.success'),
        description: t('notes.addSuccess'),
      });
      
      // Clear the input and refetch notes
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: t('common.error'),
        description: t('clients.error.noteAddFailed'),
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
          <a href="/clients" className="hover:text-primary-600">{t('clients.backToClients')}</a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-secondary-800">{isLoading ? t('clients.loading') : client?.name}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-8 w-1/3" />
          ) : (
            <h1 className="text-2xl font-bold text-secondary-800">{client?.name}</h1>
          )}
          
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>{t('clients.edit')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl mb-4">{t('clients.editClient')}</DialogTitle>
                </DialogHeader>
                <ClientForm 
                  clientId={clientId} 
                  onSuccess={() => setIsEditDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash className="h-4 w-4" />
                  <span>{t('clients.delete')}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('clients.deleteConfirm.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('clients.deleteConfirm.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('clients.deleteConfirm.cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteClient}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('clients.deleteConfirm.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : client ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-bold text-secondary-800 mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary-600" />
                    {t('clients.clientInfo')}
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-secondary-700 w-24">{t('clients.name')}:</span>
                      <span className="text-secondary-800">{client.name}</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-secondary-700 w-24">{t('clients.contactPerson')}:</span>
                      <span className="text-secondary-800">{client.contactPerson}</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-secondary-500 mt-0.5" />
                      <span className="text-secondary-800">{client.phone}</span>
                    </div>
                    
                    {client.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-secondary-500 mt-0.5" />
                        <span className="text-secondary-800">{client.email}</span>
                      </div>
                    )}
                    
                    {client.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-secondary-500 mt-0.5" />
                        <span className="text-secondary-800">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-secondary-800 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    {t('notes.title')}
                  </h2>
                  
                  <div className="border border-secondary-200 rounded-md p-4 bg-secondary-50 mb-3">
                    {client.notes ? (
                      <p className="text-secondary-800">{client.notes}</p>
                    ) : (
                      <p className="text-secondary-500 italic">{t('notes.empty')}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder={t('notes.placeholder')} 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button className="mt-auto" onClick={handleAddNote}>{t('notes.add')}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="projects">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <LayoutPanelLeft className="h-4 w-4" />
                <span>{t('clients.tabs.projects')}</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{t('clients.tabs.notesLog')}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('clients.projects')}</CardTitle>
                  <Button size="sm" asChild>
                    <a href="/projects">{t('clients.addNewProject')}</a>
                  </Button>
                </CardHeader>
                <CardContent>
                  {projects && projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map(project => (
                        <ProjectCard 
                          key={project.id} 
                          project={project} 
                          clientName={client.name}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary-500 mb-4">{t('clients.noProjects')}</p>
                      <Button asChild>
                        <a href="/projects">{t('clients.addNewProject')}</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('notes.history')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map(note => (
                        <div key={note.id} className="p-4 bg-secondary-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-secondary-500">
                              {formatRelativeTime(note.createdAt)} {t('notes.createdBy')}{" "}
                              <span className="font-medium">{t('notes.byAdmin')}</span>
                            </p>
                            {note.projectId && (
                              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                                {t('notes.projectNumber')} {note.projectId}
                              </span>
                            )}
                          </div>
                          <p className="text-secondary-800">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-secondary-500 mb-4">{t('notes.noNotes')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-secondary-600 mb-2">{t('clients.clientNotFound')}</h3>
          <p className="text-secondary-500 mb-6">{t('clients.clientNotFoundDesc')}</p>
          <Button asChild>
            <a href="/clients">{t('clients.returnToClientList')}</a>
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
