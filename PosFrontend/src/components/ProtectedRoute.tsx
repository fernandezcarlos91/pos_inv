import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles = ['Admin', 'Cajero'], 
  children 
}) => {
  const { token, rol } = useAuth();
  const location = useLocation();

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si el rol no está permitido para esta ruta:
  // Redirigir inteligentemente a la pantalla principal según su rol
  if (allowedRoles && !allowedRoles.includes(rol || '')) {
    if (rol === 'Cajero') {
      return <Navigate to="/ventas" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;