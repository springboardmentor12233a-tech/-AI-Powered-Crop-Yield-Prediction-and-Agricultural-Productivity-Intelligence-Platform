import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const userRole = user.role?.role_name || user.role; // Handle object or string
    if (!allowedRoles.includes(userRole)) {
      // Redirect to root if user doesn't have permission
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
