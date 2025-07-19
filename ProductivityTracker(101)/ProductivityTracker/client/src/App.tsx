import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useLanguage } from "@/context/LanguageContext";
import RouteGuard from "@/components/common/RouteGuard";

// Import pages
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Staff from "@/pages/Staff";
import StaffDetails from "@/pages/StaffDetails";
import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import Attendance from "@/pages/Attendance";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import EmployeeServices from "@/pages/EmployeeServices";
import Opportunities from "@/pages/Opportunities";
import Notifications from "@/pages/Notifications";

import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import ResidenceManagement from "@/pages/ResidenceManagement";
import SystemManagement from "@/pages/SystemManagement";
import LeaveManagement from "@/pages/LeaveManagement";

function Router() {
  return (
    <Switch>
      {/* Dashboard - redirect engineers to projects page */}
      <Route path="/">
        <RouteGuard feature="projects">
          <Dashboard />
        </RouteGuard>
      </Route>
      
      {/* Login page - accessible to everyone */}
      <Route path="/login" component={Login} />
      
      {/* Projects related routes */}
      <Route path="/projects">
        <RouteGuard feature="projects">
          <Projects />
        </RouteGuard>
      </Route>
      
      <Route path="/projects/:id">
        {(params) => (
          <RouteGuard feature="projects">
            <ProjectDetails projectId={parseInt(params.id)} />
          </RouteGuard>
        )}
      </Route>
      
      {/* Staff related routes */}
      <Route path="/staff">
        <RouteGuard feature="staff">
          <Staff />
        </RouteGuard>
      </Route>
      
      <Route path="/staff/:id">
        {(params) => (
          <RouteGuard feature="staff">
            <StaffDetails staffId={parseInt(params.id)} />
          </RouteGuard>
        )}
      </Route>
      
      {/* Client related routes */}
      <Route path="/clients">
        <RouteGuard feature="clients">
          <Clients />
        </RouteGuard>
      </Route>
      
      <Route path="/clients/:id">
        {(params) => (
          <RouteGuard feature="clients">
            <ClientDetails clientId={parseInt(params.id)} />
          </RouteGuard>
        )}
      </Route>
      
      {/* Unified Attendance Management - combines viewing and management */}
      <Route path="/attendance">
        <RouteGuard feature="attendance" requiredPermissions={['view']}>
          <Attendance />
        </RouteGuard>
      </Route>
      

      
      {/* Tasks - all users have task access, but with different permissions */}
      <Route path="/tasks">
        <RouteGuard feature="tasks">
          <Tasks />
        </RouteGuard>
      </Route>
      
      {/* Reports - restricted to admin and project managers */}
      <Route path="/reports">
        <RouteGuard feature="reports">
          <Reports />
        </RouteGuard>
      </Route>
      
      {/* Analytics Dashboard - restricted to admin and project managers */}
      <Route path="/analytics">
        <RouteGuard feature="reports">
          <Analytics />
        </RouteGuard>
      </Route>
      
      {/* Settings - accessible to all authenticated users for language/profile, admin features restricted within component */}
      <Route path="/settings">
        <RouteGuard feature="projects">
          <Settings />
        </RouteGuard>
      </Route>
      
      {/* Employee Services - accessible to all authenticated users */}
      <Route path="/employee-services">
        <RouteGuard feature="projects">
          <EmployeeServices />
        </RouteGuard>
      </Route>
      
      {/* Opportunities - Business Development module accessible to project managers and admins */}
      <Route path="/opportunities">
        <RouteGuard feature="projects">
          <Opportunities />
        </RouteGuard>
      </Route>
      
      {/* Notifications - accessible to all authenticated users */}
      <Route path="/notifications">
        <RouteGuard feature="projects">
          <Notifications />
        </RouteGuard>
      </Route>
      
      {/* Residence Management - HR and Admin only */}
      <Route path="/residence-management">
        <RouteGuard feature="residency" requiredPermissions={['manage']}>
          <ResidenceManagement />
        </RouteGuard>
      </Route>
      
      {/* Leave Management - HR and Admin only */}
      <Route path="/leave-management">
        <RouteGuard feature="staff" requiredPermissions={['manage']}>
          <LeaveManagement />
        </RouteGuard>
      </Route>
      
      {/* System Management - Admin only */}
      <Route path="/system-management">
        <RouteGuard feature="settings">
          <SystemManagement />
        </RouteGuard>
      </Route>
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

// App content with language context
function AppContent() {
  const { dir } = useLanguage();
  
  return (
    <TooltipProvider>
      <div dir={dir} className="font-sans">
        <Toaster />
        <Router />
      </div>
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
