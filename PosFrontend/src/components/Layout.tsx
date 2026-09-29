import React from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Package, 
  Building2, 
  LogOut, 
  ShieldCheck, 
  UserCheck,
  Users 
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { rol, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = rol === 'Admin';

  const navLinks = [
    ...(isAdmin ? [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ] : []),
    { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
    ...(isAdmin ? [
      { to: '/historial-ventas', label: 'Historial', icon: Receipt },
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/proveedores', label: 'Proveedores', icon: Building2 },
      { to: '/usuarios', label: 'Usuarios', icon: Users },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Barra de navegación superior moderna */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo y Enlaces Principales */}
            <div className="flex items-center gap-8">
              <Link 
                to={isAdmin ? '/dashboard' : '/ventas'} 
                className="flex items-center gap-2.5 text-gray-900 font-bold text-lg hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Store className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <span className="block font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    POS Master
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                    Punto de Venta
                  </span>
                </div>
              </Link>

              {/* Menú de Navegación según Rol */}
              <nav className="hidden md:flex items-center gap-1.5">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-100/80'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Perfil del Usuario y Salir */}
            <div className="flex items-center gap-3">
              {/* Badge de Rol y Nombre */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </div>
                <div className="text-left leading-none">
                  <span className="block text-xs font-bold text-gray-800">
                    {usuario?.nombre || 'Usuario'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin ? 'text-indigo-600' : 'text-emerald-600'
                  }`}>
                    {rol || (isAdmin ? 'Admin' : 'Cajero')}
                  </span>
                </div>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Menú móvil */}
          <div className="md:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-gray-100">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;