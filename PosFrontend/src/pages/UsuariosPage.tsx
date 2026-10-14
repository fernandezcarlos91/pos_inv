import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { UsuarioResponseDto, CrearUsuarioDto, ActualizarUsuarioDto, RestablecerPasswordDto } from '../DTOs/UsuarioDto';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  UserCheck, 
  ShieldCheck, 
  UserX, 
  X, 
  CheckCircle, 
  AlertCircle, 
  RotateCw,
  Lock,
  Mail,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  Wand2
} from 'lucide-react';

export const UsuariosPage: React.FC = () => {
  const { usuario: currentLoggedUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de modal Crear
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CrearUsuarioDto>({
    Nombre: '',
    Email: '',
    Password: '',
    Rol: 2 // 2 = Cajero
  });
  const [creating, setCreating] = useState(false);

  // Estados de modal Editar
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ActualizarUsuarioDto>({
    Nombre: '',
    Email: '',
    Rol: 2,
    Password: '',
    IsActive: true
  });
  const [editing, setEditing] = useState(false);

  // Estados de modal Restablecer Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UsuarioResponseDto | null>(null);
  const [resetForm, setResetForm] = useState({
    NuevaPassword: '',
    ConfirmarPassword: '',
  });
  const [showResetPass, setShowResetPass] = useState(false);
  const [showConfirmResetPass, setShowConfirmResetPass] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);

  const openRestablecer = (u: UsuarioResponseDto) => {
    setResetTargetUser(u);
    setResetForm({ NuevaPassword: '', ConfirmarPassword: '' });
    setShowResetPass(false);
    setShowConfirmResetPass(false);
    setResetModalError(null);
    setShowResetModal(true);
  };

  const generarPasswordSegura = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetForm({ NuevaPassword: pass, ConfirmarPassword: pass });
    setShowResetPass(true);
    setShowConfirmResetPass(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    setResetModalError(null);

    if (!resetForm.NuevaPassword) {
      setResetModalError('Debes ingresar la nueva contraseña.');
      return;
    }

    if (resetForm.NuevaPassword.length < 8) {
      setResetModalError('La nueva contraseña debe tener como mínimo 8 caracteres.');
      return;
    }

    if (resetForm.ConfirmarPassword && resetForm.NuevaPassword !== resetForm.ConfirmarPassword) {
      setResetModalError('Las contraseñas no coinciden.');
      return;
    }

    setResetting(true);
    try {
      const payload: RestablecerPasswordDto = {
        NuevaPassword: resetForm.NuevaPassword,
        ConfirmarPassword: resetForm.ConfirmarPassword || resetForm.NuevaPassword,
      };

      const response = await api.post(`/usuarios/${resetTargetUser.Id}/restablecer-password`, payload);
      const okMsg = response.data?.message || response.data?.Message || `Contraseña restablecida exitosamente para ${resetTargetUser.Nombre}.`;

      setMessage({ type: 'success', text: okMsg });
      setShowResetModal(false);
      setResetTargetUser(null);
      setResetForm({ NuevaPassword: '', ConfirmarPassword: '' });
    } catch (err: any) {
      let errMsg = 'Error al restablecer la contraseña.';
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
      setResetModalError(errMsg);
    } finally {
      setResetting(false);
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get<UsuarioResponseDto[]>('/usuarios');
      setUsuarios(response.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al obtener la lista de usuarios.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.Nombre.trim() || !createForm.Email.trim() || !createForm.Password) {
      setMessage({ type: 'error', text: 'Todos los campos son obligatorios para crear un usuario.' });
      return;
    }

    setCreating(true);
    setMessage(null);
    try {
      const payload: CrearUsuarioDto = {
        Nombre: createForm.Nombre.trim(),
        Email: createForm.Email.trim().toLowerCase(),
        Password: createForm.Password,
        Rol: createForm.Rol
      };

      const response = await api.post<UsuarioResponseDto>('/usuarios', payload);
      setUsuarios(prev => [...prev, response.data]);
      setMessage({ type: 'success', text: `Usuario "${response.data.Nombre}" creado exitosamente.` });
      setShowCreateModal(false);
      setCreateForm({ Nombre: '', Email: '', Password: '', Rol: 2 });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al crear el usuario.' });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: UsuarioResponseDto) => {
    setEditingUserId(u.Id);
    setEditForm({
      Nombre: u.Nombre,
      Email: u.Email,
      Rol: u.Rol === 'Admin' ? 1 : 2,
      Password: '',
      IsActive: u.IsActive
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    setEditing(true);
    setMessage(null);
    try {
      const payload: ActualizarUsuarioDto = {
        Nombre: editForm.Nombre.trim(),
        Email: editForm.Email.trim().toLowerCase(),
        Rol: editForm.Rol,
        IsActive: editForm.IsActive
      };

      if (editForm.Password && editForm.Password.trim()) {
        payload.Password = editForm.Password.trim();
      }

      const response = await api.put<UsuarioResponseDto>(`/usuarios/${editingUserId}`, payload);
      setUsuarios(prev => prev.map(u => u.Id === editingUserId ? response.data : u));
      setMessage({ type: 'success', text: `Usuario "${response.data.Nombre}" actualizado exitosamente.` });
      setShowEditModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al actualizar el usuario.' });
    } finally {
      setEditing(false);
    }
  };

  const handleToggleEstado = async (u: UsuarioResponseDto) => {
    const accion = u.IsActive ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de que deseas ${accion} la cuenta de "${u.Nombre}"?`)) {
      return;
    }

    setMessage(null);
    try {
      const response = await api.put<UsuarioResponseDto>(`/usuarios/${u.Id}/estado`, {
        IsActive: !u.IsActive
      });
      setUsuarios(prev => prev.map(item => item.Id === u.Id ? response.data : item));
      setMessage({
        type: 'success',
        text: `La cuenta de "${response.data.Nombre}" fue ${response.data.IsActive ? 'activada' : 'desactivada'} correctamente.`
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || `Error al ${accion} el usuario.` });
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.Nombre.toLowerCase().includes(filter.toLowerCase()) ||
    u.Email.toLowerCase().includes(filter.toLowerCase()) ||
    u.Rol.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            Gestión de Usuarios y Accesos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea cuentas de cajeros o administradores, gestiona sus roles y controla el estado de activación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsuarios}
            disabled={loading}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            title="Recargar usuarios"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Alertas */}
      {message && (
        <div className={`p-4 rounded-2xl text-sm flex items-center gap-2 border shadow-xs animate-in fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, email o rol..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total: {filteredUsuarios.length} de {usuarios.length} cuentas registradas
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">Usuario</th>
                <th className="py-3.5 px-6">Correo Electrónico</th>
                <th className="py-3.5 px-6">Rol Asignado</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
                <th className="py-3.5 px-6">Fecha Registro</th>
                <th className="py-3.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                    <p className="font-medium text-gray-600">No se encontraron usuarios</p>
                    <p className="text-xs text-gray-400 mt-1">Crea nuevos usuarios usando el botón superior.</p>
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((u) => {
                  const isAdmin = u.Rol === 'Admin';
                  const isCurrent = currentLoggedUser?.email === u.Email;

                  return (
                    <tr key={u.Id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">
                              {u.Nombre}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                (Tu cuenta actual)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-mono text-xs">
                        {u.Email}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isAdmin 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {u.Rol}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.IsActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.IsActive ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(u.FechaCreacion).toLocaleDateString('es-CL', {
                          dateStyle: 'medium'
                        })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar usuario o rol"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRestablecer(u)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title={`Restablecer contraseña de ${u.Nombre}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleEstado(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.IsActive
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={isCurrent ? 'No puedes desactivar tu propia cuenta' : (u.IsActive ? 'Desactivar cuenta' : 'Activar cuenta')}
                          >
                            {u.IsActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Usuario</h3>
                  <p className="text-xs text-gray-500">Asigna credenciales y permisos en el sistema</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={createForm.Nombre}
                    onChange={e => setCreateForm({ ...createForm, Nombre: e.target.value })}
                    placeholder="Ej. Roberto Martínez"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={createForm.Email}
                    onChange={e => setCreateForm({ ...createForm, Email: e.target.value })}
                    placeholder="cajero2@pos.com"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Contraseña Inicial <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={createForm.Password}
                    onChange={e => setCreateForm({ ...createForm, Password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, Rol: 2 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      createForm.Rol === 2
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Cajero
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, Rol: 1 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      createForm.Rol === 1
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Editar Usuario</h3>
                  <p className="text-xs text-gray-500">Modifica datos personales, rol o contraseña</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={editForm.Nombre}
                    onChange={e => setEditForm({ ...editForm, Nombre: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={editForm.Email}
                    onChange={e => setEditForm({ ...editForm, Email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cambiar Contraseña (Opcional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="Dejar en blanco para mantener la actual"
                    value={editForm.Password || ''}
                    onChange={e => setEditForm({ ...editForm, Password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, Rol: 2 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      editForm.Rol === 2
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Cajero
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, Rol: 1 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      editForm.Rol === 1
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Admin
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-active-check"
                  checked={editForm.IsActive}
                  onChange={e => setEditForm({ ...editForm, IsActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="user-active-check" className="text-sm font-medium text-gray-700">
                  Cuenta Activa para Iniciar Sesión
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {editing ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restablecer Contraseña (Solo Admin) */}
      {showResetModal && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Restablecer Contraseña</h3>
                  <p className="text-xs text-gray-500">Asigna una nueva clave a este usuario</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!resetting) setShowResetModal(false);
                }}
                disabled={resetting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              {/* Tarjeta de usuario afectado */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    {resetTargetUser.Nombre}
                  </span>
                  <span className="text-xs font-mono text-gray-500">
                    {resetTargetUser.Email}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  resetTargetUser.Rol === 'Admin'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {resetTargetUser.Rol}
                </span>
              </div>

              {resetModalError && (
                <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2.5 bg-red-50 text-red-800 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{resetModalError}</span>
                </div>
              )}

              {/* Botón para generar clave segura */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={generarPasswordSegura}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generar clave sugerida
                </button>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={resetForm.NuevaPassword}
                    onChange={(e) => setResetForm({ ...resetForm, NuevaPassword: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    disabled={resetting}
                    className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(!showResetPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmResetPass ? 'text' : 'password'}
                    required
                    value={resetForm.ConfirmarPassword}
                    onChange={(e) => setResetForm({ ...resetForm, ConfirmarPassword: e.target.value })}
                    placeholder="Repetir la nueva contraseña"
                    disabled={resetting}
                    className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmResetPass(!showConfirmResetPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {resetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Restableciendo...
                    </>
                  ) : (
                    'Restablecer Clave'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;

