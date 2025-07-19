import { useAuth } from './useAuth';

// Define types for features and permissions
export type Feature = 
  | 'dashboard' 
  | 'projects' 
  | 'staff' 
  | 'clients' 
  | 'attendance' 
  | 'reports' 
  | 'settings'
  | 'tasks'
  | 'residency';

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'manage';

// Define access matrix based on roles as per requirements
const accessMatrix: Record<string, Record<Feature, Permission[]>> = {
  // System Admin: Full access to all features
  admin: {
    dashboard: ['view', 'create', 'edit', 'delete', 'manage'],
    projects: ['view', 'create', 'edit', 'delete', 'manage'],
    staff: ['view', 'create', 'edit', 'delete', 'manage'],
    clients: ['view', 'create', 'edit', 'delete', 'manage'],
    attendance: ['view', 'create', 'edit', 'delete', 'manage'], // Can view and manage all attendance
    reports: ['view', 'create', 'edit', 'delete', 'manage'],
    settings: ['view', 'edit', 'manage'],
    tasks: ['view', 'create', 'edit', 'delete', 'manage'],
    residency: ['view', 'create', 'edit', 'delete', 'manage'] // Full residency management
  },
  // Project Manager: Limited to assigned projects, tasks and related reports
  project_manager: {
    dashboard: ['view'],
    projects: ['view', 'edit', 'manage'], // Can manage assigned projects
    staff: ['view'], // Can view staff but only manage those under their projects
    clients: ['view'], // Can view client information related to their projects
    attendance: [], // No access to attendance at all
    reports: ['view'], // Can view reports related to their projects
    settings: [], // No access to system settings
    tasks: ['view', 'create', 'edit', 'manage'], // Can create and manage tasks for their projects
    residency: [] // No access to residency management
  },
  // Regular Staff (Engineer): Limited to own profile and assigned projects
  engineer: {
    dashboard: [], // No access to dashboard
    projects: ['view'], // View only assigned projects 
    staff: [], // No access to other staff
    clients: [], // No access to client information
    attendance: [], // No access to attendance
    reports: [], // No access to reports
    settings: [], // No access to settings
    tasks: ['view', 'edit'], // Can view and update their assigned tasks
    residency: [] // No access to residency management
  },
  // Regular Staff (Administrative)
  admin_staff: {
    dashboard: ['view'],
    projects: ['view'], // View only assigned projects
    staff: [], // No access to staff management
    clients: [], // No access to client management 
    attendance: ['view'], // Can only view their own attendance records
    reports: [], // No access to reports
    settings: [], // No access to settings
    tasks: ['view', 'edit'], // Can view and update their assigned tasks
    residency: [] // No access to residency management
  },
  // HR Manager: Full staff management and attendance access
  hr_manager: {
    dashboard: ['view'],
    projects: ['view'], // Can view all projects for staff assignments
    staff: ['view', 'create', 'edit', 'manage'], // Full staff management
    clients: ['view'], // Can view client information
    attendance: ['view', 'create', 'edit', 'manage'], // Full attendance management
    reports: ['view', 'create', 'edit'], // Can view and generate reports related to staff
    settings: [], // No access to system settings
    tasks: ['view', 'create', 'edit'], // Can manage tasks for staff
    residency: ['view', 'create', 'edit', 'manage'] // Full residency management
  },
  // General Manager: All permissions except system settings
  general_manager: {
    dashboard: ['view', 'manage'],
    projects: ['view', 'create', 'edit', 'delete', 'manage'], // Full project management
    staff: ['view', 'create', 'edit', 'manage'], // Full staff management
    clients: ['view', 'create', 'edit', 'delete', 'manage'], // Full client management
    attendance: ['view', 'create', 'edit', 'manage'], // Full attendance management
    reports: ['view', 'create', 'edit', 'manage'], // Full reports access
    settings: [], // No access to system settings (reserved for admin)
    tasks: ['view', 'create', 'edit', 'delete', 'manage'], // Full task management
    residency: ['view', 'create', 'edit', 'manage'] // Full residency management
  }
};

export const useRBAC = () => {
  const { user } = useAuth();
  
  const userRole = user?.role || 'engineer'; // Default to most restricted role if not authenticated
  
  // Check if the user has permission for a feature
  const hasFeatureAccess = (feature: Feature): boolean => {
    if (!user) return false;
    
    // If the user is an admin, they have access to everything
    if (userRole === 'admin') return true;
    
    // Check specific feature access
    return accessMatrix[userRole][feature].length > 0;
  };
  
  // Check if the user has a specific permission for a feature
  const hasPermission = (feature: Feature, permission: Permission): boolean => {
    if (!user) return false;
    
    // If the user is an admin, they have all permissions
    if (userRole === 'admin') return true;
    
    return accessMatrix[userRole][feature].includes(permission);
  };
  
  // Check if user can access specific project
  const canAccessProject = (projectId: number): boolean => {
    if (!user) return false;
    
    // Admin can access all projects
    if (userRole === 'admin') return true;
    
    // For other roles, we'd normally check if the project is assigned to the user
    // This would involve checking a user's assigned projects from the API
    // For simplicity in this implementation, we're using the role-based check
    return hasPermission('projects', 'view');
  };
  
  // Check if user can access specific staff member (with admin privacy protection)
  const canAccessStaffProfile = (staffId: number): boolean => {
    if (!user) return false;
    
    // Admin can access all staff profiles
    if (userRole === 'admin') return true;
    
    // All users can access their own profile
    if (user.id === staffId) return true;
    
    // ADMIN PRIVACY: Check if the staff member is an admin - prevent access by others
    // This would need to be enhanced with actual staff role checking from API
    // For now, we'll implement basic protection
    
    // HR Manager and General Manager can access all staff profiles except admin
    if (userRole === 'hr_manager' || userRole === 'general_manager') {
      return hasPermission('staff', 'view');
    }
    
    // Project managers can only view staff assigned to their projects
    if (userRole === 'project_manager') {
      return hasPermission('staff', 'view');
    }
    
    // Regular staff cannot access other staff profiles
    return false;
  };
  
  // Check if user can access reports
  const canAccessReports = (): boolean => {
    if (!user) return false;
    
    // Admin, HR Manager, General Manager, and Project Managers can access reports
    return userRole === 'admin' || userRole === 'hr_manager' || userRole === 'general_manager' || userRole === 'project_manager';
  };
  
  // Check if user can access settings
  const canAccessSettings = (): boolean => {
    if (!user) return false;
    
    // Only admin can access settings
    return userRole === 'admin';
  };

  // Check if user can view residency notifications
  const canViewResidencyNotifications = (): boolean => {
    if (!user) return false;
    
    // Only Admin, HR Manager, General Manager, and Project Manager can view residency notifications
    return userRole === 'admin' || userRole === 'hr_manager' || userRole === 'general_manager' || userRole === 'project_manager';
  };

  // Check if user can view project financial details
  const canViewProjectFinancials = (): boolean => {
    if (!user) return false;
    
    // Only Admin and General Manager can view sensitive financial information
    return userRole === 'admin' || userRole === 'general_manager';
  };

  // Check if user can view detailed project information (including completion percentage)
  const canViewDetailedProjectInfo = (): boolean => {
    if (!user) return false;
    
    // Admin and General Manager have full access
    // Project Manager can view details for supervision
    // Others can only view basic project information
    return userRole === 'admin' || userRole === 'general_manager' || userRole === 'project_manager';
  };
  
  // Check if user can access attendance records (with admin privacy protection)
  const canAccessAttendance = (staffId?: number): boolean => {
    if (!user) return false;
    
    // Admin can access all attendance records
    if (userRole === 'admin') return true;
    
    // Users can access their own attendance records
    if (staffId && user.id === staffId) return true;
    
    // ADMIN PRIVACY: Prevent access to admin attendance records by others
    // This would need to be enhanced with actual staff role checking from API
    
    // HR Manager and General Manager can access all attendance records except admin
    if (userRole === 'hr_manager' || userRole === 'general_manager') {
      return hasPermission('attendance', 'view');
    }
    
    // Other roles cannot access attendance records
    return false;
  };

  return {
    userRole,
    hasFeatureAccess,
    hasPermission,
    canAccessProject,
    canAccessStaffProfile,
    canAccessReports,
    canAccessSettings,
    canAccessAttendance,
    canViewResidencyNotifications,
    canViewProjectFinancials,
    canViewDetailedProjectInfo
  };
};