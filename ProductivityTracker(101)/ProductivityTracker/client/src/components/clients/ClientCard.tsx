import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building, Phone, Mail, MapPin } from "lucide-react";
import { Client } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const { t } = useTranslation();
  
  // Get project count for this client
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: [`/api/clients/${client.id}/projects`],
  });

  const projectCount = projects.length || 0;

  return (
    <Card className="border border-secondary-200 transition-shadow hover:shadow-md">
      <CardContent className="pt-6 px-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-lg text-secondary-800">{client.name}</h3>
          </div>
          <p className="text-sm text-secondary-500">{t('clients.contactPerson')}: {client.contactPerson}</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-secondary-500 mt-0.5" />
            <span className="text-sm text-secondary-700">
              {client.phone}
            </span>
          </div>
          
          {client.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-secondary-500 mt-0.5" />
              <span className="text-sm text-secondary-700 break-all">
                {client.email}
              </span>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-secondary-500 mt-0.5" />
              <span className="text-sm text-secondary-700">
                {client.address}
              </span>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-secondary-100">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-500">{t('clients.projectCount')}</span>
              <span className="text-sm font-medium text-primary-600">{projectCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/clients/${client.id}`}>{t('clients.viewDetails')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
