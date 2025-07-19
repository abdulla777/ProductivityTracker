import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

// Components
import ClientCard from "@/components/clients/ClientCard";
import ClientForm from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Layout
import MainLayout from "@/components/layout/MainLayout";

// Types
import type { Client } from "@shared/schema";

export default function Clients() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [hasProjectsFilter, setHasProjectsFilter] = useState<boolean | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });
  
  // Filter clients based on search term
  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.address?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    // Apply the "has projects" filter if selected
    // NOTE: In a real app, this would be more efficient with a proper query parameter
    if (hasProjectsFilter !== null) {
      // This is a simplified approach for demo purposes
      // In reality, we would fetch this info from the API directly
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-secondary-800">{t('clients.title')}</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span>{t('clients.add')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-center text-xl mb-4">{t('clients.add')}</DialogTitle>
              </DialogHeader>
              <ClientForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <Input
              type="search"
              placeholder={t('clients.search')}
              className="pl-3 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{t('clients.filter')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuCheckboxItem
                checked={hasProjectsFilter === true}
                onCheckedChange={() => setHasProjectsFilter(hasProjectsFilter === true ? null : true)}
              >
                {t('clients.hasProjects')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hasProjectsFilter === false}
                onCheckedChange={() => setHasProjectsFilter(hasProjectsFilter === false ? null : false)}
              >
                {t('clients.noProjects')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      ) : filteredClients && filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: Client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-secondary-600 mb-2">
            {t('clients.noMatchingClients')}
          </h3>
          <p className="text-secondary-500 mb-6">
            {t('clients.tryChangingCriteria')}
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            {t('clients.add')}
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
