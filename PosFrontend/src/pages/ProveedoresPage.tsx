import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { ProveedorResponseDto, CrearProveedorDto, ActualizarProveedorDto } from '../DTOs/ProveedorDto';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  CheckCircle,
  AlertCircle,
  RotateCw
} from 'lucide-react';

export const ProveedoresPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<ProveedorResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Estados del modal de Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CrearProveedorDto & { Activo?: boolean }>({
    Nombre: '',
    Telefono: '',
    Email: '',
    Direccion: '',
    RutIdentificacion: '',
    Activo: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ProveedorResponseDto[]>('/proveedores');
      setProveedores(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener los proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      Nombre: '',
      Telefono: '',
      Email: '',
      Direccion: '',
      RutIdentificacion: '',
      Activo: true
    });
    setShowModal(true);
  };

  const openEditModal = (p: ProveedorResponseDto) => {
    setEditingId(p.Id);
    setFormData({
      Nombre: p.Nombre,
      Telefono: p.Telefono || '',
      Email: p.Email || '',
      Direccion: p.Direccion || '',
      RutIdentificacion: p.RutIdentificacion || '',
      Activo: p.Activo
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Nombre.trim()) {
      setError('El nombre del proveedor es obligatorio.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        // Actualizar proveedor
        const payload: ActualizarProveedorDto = {
          Nombre: formData.Nombre.trim(),
          Telefono: formData.Telefono?.trim(),
          Email: formData.Email?.trim(),
          Direccion: formData.Direccion?.trim(),
          RutIdentificacion: formData.RutIdentificacion?.trim(),
          Activo: formData.Activo ?? true
        };
        const response = await api.put<ProveedorResponseDto>(`/proveedores/${editingId}`, payload);
        setProveedores(prev => prev.map(item => item.Id === editingId ? response.data : item));
        setSuccess('Proveedor actualizado correctamente.');
      } else {
        // Crear proveedor
        const payload: CrearProveedorDto = {
          Nombre: formData.Nombre.trim(),
          Telefono: formData.Telefono?.trim(),
          Email: formData.Email?.trim(),
          Direccion: formData.Direccion?.trim(),
          RutIdentificacion: formData.RutIdentificacion?.trim()
        };
        const response = await api.post<ProveedorResponseDto>('/proveedores', payload);
        setProveedores(prev => [...prev, response.data]);
        setSuccess('Proveedor creado exitosamente.');
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el proveedor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar o desactivar al proveedor "${nombre}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const response = await api.delete(`/proveedores/${id}`);
      setSuccess(response.data?.message || `Proveedor "${nombre}" eliminado/desactivado.`);
      fetchProveedores();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el proveedor.');
    }
  };

  const filteredProveedores = proveedores.filter(p =>
    p.Nombre.toLowerCase().includes(filter.toLowerCase()) ||
    p.RutIdentificacion.toLowerCase().includes(filter.toLowerCase()) ||
    p.Email.toLowerCase().includes(filter.toLowerCase()) ||
    p.Telefono.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Gestión de Proveedores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra los socios comerciales, datos de contacto y facturación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProveedores}
            disabled={loading}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            title="Recargar proveedores"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filtro y Barra de búsqueda */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, RUT, teléfono o email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Mostrando {filteredProveedores.length} de {proveedores.length} proveedores
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">Nombre / Empresa</th>
                <th className="py-3.5 px-6">RUT / Identificación</th>
                <th className="py-3.5 px-6">Teléfono</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Dirección</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
                <th className="py-3.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Cargando proveedores...
                    </div>
                  </td>
                </tr>
              ) : filteredProveedores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                    <p className="font-medium text-gray-600">No hay proveedores registrados</p>
                    <p className="text-xs text-gray-400 mt-1">Registra tu primer proveedor usando el botón superior.</p>
                  </td>
                </tr>
              ) : (
                filteredProveedores.map((p) => (
                  <tr key={p.Id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {p.Nombre}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-600 text-xs">
                      {p.RutIdentificacion || '—'}
                    </td>
                    <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                      {p.Telefono ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {p.Telefono}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {p.Email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {p.Email}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-xs max-w-xs truncate">
                      {p.Direccion ? (
                        <span className="flex items-center gap-1.5" title={p.Direccion}>
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{p.Direccion}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.Activo 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {p.Activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.Id, p.Nombre)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar o Desactivar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar Proveedor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingId ? 'Actualiza los datos del proveedor seleccionado' : 'Ingresa la información comercial del nuevo proveedor'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nombre o Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Nombre}
                    onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                    placeholder="Ej. Distribuidora Central SpA"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      RUT o Identificación
                    </label>
                    <input
                      type="text"
                      value={formData.RutIdentificacion}
                      onChange={(e) => setFormData({ ...formData, RutIdentificacion: e.target.value })}
                      placeholder="Ej. 76.123.456-7"
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.Telefono}
                      onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                      placeholder="Ej. +56 9 8765 4321"
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    placeholder="contacto@proveedor.com"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    value={formData.Direccion}
                    onChange={(e) => setFormData({ ...formData, Direccion: e.target.value })}
                    placeholder="Av. Industrial 1234, Bodega 5"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {editingId && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="activo-check"
                      checked={formData.Activo}
                      onChange={(e) => setFormData({ ...formData, Activo: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="activo-check" className="text-sm font-medium text-gray-700">
                      Proveedor Activo para Compras
                    </label>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Proveedor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresPage;
