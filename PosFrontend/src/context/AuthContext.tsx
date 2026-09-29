import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  token: string | null;
  usuario: User | null;
  rol: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Normalización del usuario/rol: soporta camelCase ("rol"), PascalCase ("Rol")
// y rol numérico (1 = Admin, 2 = Cajero) para ser tolerante a cualquier
// contrato del backend y a datos previos guardados en localStorage.
// ---------------------------------------------------------------------------

export const normalizeRol = (value: unknown): string => {
  if (typeof value === 'number') {
    return value === 1 ? 'Admin' : 'Cajero';
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'administrador') return 'Admin';
    if (normalized === 'cajero' || normalized === 'usuario' || normalized === 'user') return 'Cajero';
  }
  return 'Cajero';
};

export const normalizeUser = (raw: unknown): User | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const getKey = (name: string): unknown => {
    const lower = name.toLowerCase();
    const found = Object.keys(obj).find((key) => key.toLowerCase() === lower);
    return found !== undefined ? obj[found] : undefined;
  };

  const idRaw = getKey('id');
  const nombre = getKey('nombre');
  const email = getKey('email');

  return {
    id: Number(idRaw) || 0,
    nombre: typeof nombre === 'string' ? nombre : '',
    email: typeof email === 'string' ? email : '',
    rol: normalizeRol(getKey('rol')),
  };
};

const readStoredUser = (): User | null => {
  const stored = localStorage.getItem('user_data');
  if (!stored) return null;
  try {
    return normalizeUser(JSON.parse(stored));
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('jwt_token');
    return stored || null;
  });

  const [usuario, setUsuario] = useState<User | null>(() => readStoredUser());

  const [rol, setRol] = useState<string | null>(() => readStoredUser()?.rol ?? null);

  // Verificar token al iniciar y derivar el rol desde el claim JWT
  useEffect(() => {
    const verificarToken = () => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          // El claim de rol puede venir como "rol", "Rol" o como URI
          // "http://schemas.microsoft.com/ws/2008/06/identity/claims/role".
          const keyRol = Object.keys(payload).find(
            (k) => k.toLowerCase() === 'rol' || k.toLowerCase().endsWith('role')
          );
          const rolClaim = keyRol ? payload[keyRol] : undefined;
          const rolNormalizado = normalizeRol(rolClaim);
          setRol(rolNormalizado);
          // Mantener coherente el usuario ante cambios de rol en el token
          setUsuario((prev) => (prev ? { ...prev, rol: rolNormalizado } : prev));
        } catch (e) {
          console.error('Error al decodificar token', e);
          logout();
        }
      }
    };
    verificarToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = (newToken: string, user: User) => {
    const usuarioNormalizado = normalizeUser(user) ?? user;
    setToken(newToken);
    setUsuario(usuarioNormalizado);
    setRol(usuarioNormalizado.rol);
    localStorage.setItem('jwt_token', newToken);
    localStorage.setItem('user_data', JSON.stringify(usuarioNormalizado));
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setRol(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  };

  return (
    <AuthContext.Provider value={{ token, usuario, rol, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;