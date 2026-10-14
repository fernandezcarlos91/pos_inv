import React, { useState } from 'react';
import api from '../services/api';
import type { CambiarPasswordDto } from '../DTOs/UsuarioDto';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck 
} from 'lucide-react';

interface CambiarPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CambiarPasswordModal: React.FC<CambiarPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [actualPassword, setActualPassword] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setActualPassword('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setShowActual(false);
    setShowNueva(false);
    setShowConfirmar(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!actualPassword || !nuevaPassword || !confirmarPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (nuevaPassword.length < 8) {
      setError('La nueva contraseña debe tener como mínimo 8 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('La confirmación de la contraseña no coincide con la nueva contraseña.');
      return;
    }

    if (actualPassword === nuevaPassword) {
      setError('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    setLoading(true);
    try {
      const payload: CambiarPasswordDto = {
        ActualPassword: actualPassword,
        NuevaPassword: nuevaPassword,
        ConfirmarPassword: confirmarPassword,
      };

      const response = await api.post('/auth/cambiar-password', payload);
      const msg = response.data?.message || response.data?.Message || 'Contraseña actualizada con éxito.';
      setSuccess(msg);
      setActualPassword('');
      setNuevaPassword('');
      setConfirmarPassword('');

      // Cerrar modal automáticamente tras 2 segundos si el usuario no lo cierra antes
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      let errMsg = 'Error al cambiar la contraseña. Inténtalo nuevamente.';
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.response?.data?.Message) {
        errMsg = err.response.data.Message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstKey = Object.keys(errors)[0];
        if (firstKey && Array.isArray(errors[firstKey]) && errors[firstKey].length > 0) {
          errMsg = errors[firstKey][0];
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h3>
              <p className="text-xs text-gray-500">Actualiza tu clave de acceso personal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2.5 bg-red-50 text-red-800 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Contraseña Actual */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Contraseña Actual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type={showActual ? 'text' : 'password'}
                required
                value={actualPassword}
                onChange={(e) => setActualPassword(e.target.value)}
                placeholder="Ingresa tu clave actual"
                disabled={loading || !!success}
                className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nueva Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type={showNueva ? 'text' : 'password'}
                required
                minLength={8}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={loading || !!success}
                className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowNueva(!showNueva)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              Debe contener al menos 8 caracteres.
            </p>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Confirmar Nueva Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type={showConfirmar ? 'text' : 'password'}
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite la nueva clave"
                disabled={loading || !!success}
                className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Guardar Contraseña'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPasswordModal;

