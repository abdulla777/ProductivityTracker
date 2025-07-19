import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Close sidebar overlay when clicked
  const handleSidebarClose = () => {
    setIsMobileOpen(false);
  };

  // Close sidebar on route change
  useEffect(() => {
    handleSidebarClose();
  }, [location]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "يرجى تسجيل الدخول للوصول إلى هذه الصفحة",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate, toast]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-secondary-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-secondary-50">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        onClose={handleSidebarClose} 
      />
      
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={handleSidebarClose}
        ></div>
      )}
      
      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMobileMenuOpen={() => setIsMobileOpen(true)} />
        
        {/* Page content */}
        <div className="flex-1 overflow-auto bg-secondary-50 p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
