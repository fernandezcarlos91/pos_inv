import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { normalizeUser } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VentasPage from './pages/VentasPage';
import HistorialVentasPage from './pages/HistorialVentasPage';
import ProductosPage from './pages/ProductosPage';
import ProveedoresPage from './pages/ProveedoresPage';
import UsuariosPage from './pages/UsuariosPage';

const getLoggedUser = (): { rol?: string } | null => {
  const hasSession = localStorage.getItem('jwt_token') && localStorage.getItem('user_data');
  if (!hasSession) return null;
  try {
    return normalizeUser(JSON.parse(localStorage.getItem('user_data') || '{}'));
  } catch {
    return null;
  }
};

/** Redirige a la vista inicial según la sesión y rol del usuario */
const SessionRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const usuario = getLoggedUser();
  if (usuario) {
    return <Navigate to={usuario.rol === 'Admin' ? '/dashboard' : '/ventas'} replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas autenticadas dentro del Layout */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Cajero']}><Layout /></ProtectedRoute>}>
            
            {/* Ventas: accesible para Admin y Cajero */}
            <Route path="/ventas" element={<VentasPage />} />

            {/* Rutas exclusivas para Administradores */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/historial-ventas"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <HistorialVentasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <ProductosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proveedores"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <ProveedoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirección por defecto y rutas desconocidas */}
          <Route path="/" element={<SessionRedirect><Navigate to="/login" replace /></SessionRedirect>} />
          <Route path="*" element={<SessionRedirect><Navigate to="/login" replace /></SessionRedirect>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;