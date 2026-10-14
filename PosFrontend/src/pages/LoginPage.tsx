import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth, normalizeUser } from '../context/AuthContext';
import { Store, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response: any = await api.post('/auth/login', form);
      const data = response.data;

      const token = (data?.Token || data?.token) as string | undefined;
      const usuario = normalizeUser(data?.Usuario || data?.usuario);

      if (token && usuario) {
        login(token, usuario);

        if (usuario.rol === 'Admin') {
          navigate('/dashboard');
        } else {
          navigate('/ventas');
        }
      } else {
        setError('Respuesta del servidor inválida.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error en el inicio de sesión. Verifica tus credenciales.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo y Encabezado */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">POS Master</h1>
          <p className="text-xs text-gray-500 mt-1">Sistema Integral de Ventas e Inventario</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                name="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ingresando...
              </>
            ) : (
              <>
                Iniciar Sesión <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Nota de Seguridad */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          El registro de cuentas es gestionado exclusivamente por el Administrador.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;