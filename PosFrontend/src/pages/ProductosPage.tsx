import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ProductoResponseDto } from '../DTOs/ProductoResponseDto';
import type { CrearProductoDto, ActualizarProductoDto } from '../DTOs/ProductoDto';
import type { ProveedorResponseDto } from '../DTOs/ProveedorDto';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Building2,
  ScanBarcode,
  Printer,
  Sparkles
} from 'lucide-react';
import { EtiquetaProductoModal } from '../components/EtiquetaProductoModal';
import { BarcodeSvg } from '../components/EtiquetaProducto';

export const ProductosPage: React.FC = () => {
  const { rol } = useAuth();
  const [products, setProducts] = useState<ProductoResponseDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorResponseDto[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Modal para Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoResponseDto | null>(null);
  const [formData, setFormData] = useState<CrearProductoDto & { Id?: number }>({
    CodigoBarras: '',
    Nombre: '',
    PrecioCosto: 0,
    PrecioVenta: 0,
    StockActual: 0,
    StockMinimo: 0,
    ProveedorId: null,
  });
  const [submitting, setSubmitting] = useState(false);

  // Estados de Modal para Imprimir Etiqueta
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<ProductoResponseDto | null>(null);
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false);

  const openLabelModal = (p: ProductoResponseDto) => {
    setSelectedProductForLabel(p);
    setShowLabelModal(true);
  };

  const handleGenerarCodigo = async () => {
    try {
      const res = await api.get<{ codigoBarras: string }>('/productos/generar-codigo');
      if (res.data?.codigoBarras) {
        setFormData(prev => ({ ...prev, CodigoBarras: res.data.codigoBarras }));
      }
    } catch (error) {
      console.error('Error al generar código de barras automático:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProveedores();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get<ProductoResponseDto[]>('/productos');
      setProducts(response.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al obtener los productos.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const response = await api.get<ProveedorResponseDto[]>('/proveedores', { params: { soloActivos: true } });
      setProveedores(response.data);
    } catch (error) {
      // Si no es admin o no puede cargar proveedores, no bloquea productos
      console.log('No se pudieron cargar proveedores para el selector.');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      CodigoBarras: '',
      Nombre: '',
      PrecioCosto: 0,
      PrecioVenta: 0,
      StockActual: 0,
      StockMinimo: 0,
      ProveedorId: null,
    });
    setShowModal(true);
  };

  const openEditModal = (p: ProductoResponseDto) => {
    setEditingProduct(p);
    setFormData({
      Id: p.Id,
      CodigoBarras: p.CodigoBarras,
      Nombre: p.Nombre,
      PrecioCosto: p.PrecioCosto ?? 0,
      PrecioVenta: p.PrecioVenta,
      StockActual: p.StockActual,
      StockMinimo: p.StockMinimo,
      ProveedorId: p.ProveedorId || null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.PrecioVenta < formData.PrecioCosto) {
      setMessage({ type: 'error', text: 'El precio de venta no puede ser menor al precio de costo.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      if (editingProduct) {
        const updatePayload: ActualizarProductoDto = {
          Nombre: formData.Nombre.trim(),
          CodigoBarras: formData.CodigoBarras?.trim() || undefined,
          PrecioCosto: formData.PrecioCosto,
          PrecioVenta: formData.PrecioVenta,
          StockActual: formData.StockActual,
          StockMinimo: formData.StockMinimo,
          ProveedorId: formData.ProveedorId,
          Activo: true,
        };
        const response = await api.put<ProductoResponseDto>(`/productos/${editingProduct.Id}`, updatePayload);
        setProducts(prev => prev.map(p => p.Id === editingProduct.Id ? response.data : p));
        setMessage({ type: 'success', text: `Producto "${response.data.Nombre}" actualizado exitosamente.` });
      } else {
        const createPayload: CrearProductoDto = {
          Nombre: formData.Nombre.trim(),
          CodigoBarras: formData.CodigoBarras?.trim() || undefined,
          PrecioCosto: formData.PrecioCosto,
          PrecioVenta: formData.PrecioVenta,
          StockActual: formData.StockActual,
          StockMinimo: formData.StockMinimo,
          ProveedorId: formData.ProveedorId,
        };
        const response = await api.post<ProductoResponseDto>('/productos', createPayload);
        setProducts(prev => [...prev, response.data]);
        setMessage({ 
          type: 'success', 
          text: `Producto "${response.data.Nombre}" creado exitosamente con código: ${response.data.CodigoBarras}.` 
        });
      }
      setShowModal(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al guardar el producto.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) return;

    try {
      await api.delete(`/productos/${productId}`);
      setProducts(prev => prev.filter(p => p.Id !== productId));
      setMessage({ type: 'success', text: `Producto "${nombre}" eliminado correctamente.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al eliminar el producto.' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredProducts = products.filter(p =>
    p.Nombre.toLowerCase().includes(filter.toLowerCase()) ||
    p.CodigoBarras.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            Catálogo de Productos e Inventario
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra precios, existencias y alertas de stock de tus productos.
          </p>
        </div>
        {rol === 'Admin' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        )}
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

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre o código de barras..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total: {filteredProducts.length} productos registrados
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">Código</th>
                <th className="py-3.5 px-6">Producto</th>
                <th className="py-3.5 px-6">Proveedor</th>
                {rol === 'Admin' && <th className="py-3.5 px-6 text-right">P. Costo</th>}
                <th className="py-3.5 px-6 text-right">P. Venta</th>
                <th className="py-3.5 px-6 text-center">Stock</th>
                <th className="py-3.5 px-6 text-center">Estado Stock</th>
                {rol === 'Admin' && <th className="py-3.5 px-6 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={rol === 'Admin' ? 8 : 6} className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Cargando productos...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={rol === 'Admin' ? 8 : 6} className="py-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                    <p className="font-medium text-gray-600">No se encontraron productos</p>
                    <p className="text-xs text-gray-400 mt-1">Añade nuevos productos para comenzar.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const sinStock = p.StockActual <= 0;
                  const stockCritico = p.StockActual <= p.StockMinimo;
                  const prov = proveedores.find(pr => pr.Id === p.ProveedorId);

                  return (
                    <tr key={p.Id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-gray-700">
                        {p.CodigoBarras}
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {p.Nombre}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-xs">
                        {prov ? (
                          <span className="inline-flex items-center gap-1 font-medium text-indigo-700">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            {prov.Nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      {rol === 'Admin' && (
                        <td className="py-4 px-6 text-right text-gray-500">
                          {p.PrecioCosto !== undefined ? formatCurrency(p.PrecioCosto) : '—'}
                        </td>
                      )}
                      <td className="py-4 px-6 text-right font-bold text-gray-900">
                        {formatCurrency(p.PrecioVenta)}
                      </td>
                      <td className="py-4 px-6 text-center font-bold">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sinStock 
                            ? 'bg-red-100 text-red-800' 
                            : stockCritico 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.StockActual} un.
                        </span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">mín: {p.StockMinimo}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {sinStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                            Agotado
                          </span>
                        ) : stockCritico ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            Óptimo
                          </span>
                        )}
                      </td>
                      {rol === 'Admin' && (
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openLabelModal(p)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Imprimir Etiqueta"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.Id, p.Nombre)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar Producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Producto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingProduct ? 'Actualiza los datos del producto seleccionado' : 'Ingresa los datos para incorporar un producto al inventario'}
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

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Código de Barras{' '}
                      {editingProduct ? (
                        <span className="text-gray-400 font-normal lowercase">(deja en blanco para mantener)</span>
                      ) : (
                        <span className="text-blue-600 font-normal lowercase">(opcional - auto si está vacío)</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerarCodigo}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      title="Generar un código de barras único"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Autogenerar
                    </button>
                  </div>
                  <div className="relative">
                    <ScanBarcode className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.CodigoBarras ?? ''}
                      onChange={e => setFormData({ ...formData, CodigoBarras: e.target.value })}
                      placeholder="Dejar en blanco para autogenerar o ingresar código..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  {Boolean(formData.CodigoBarras?.trim()) && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 font-medium mb-1">Vista previa del código:</span>
                      <BarcodeSvg value={formData.CodigoBarras?.trim() || ''} height={32} width={1.3} fontSize={11} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Nombre}
                    onChange={e => setFormData({ ...formData, Nombre: e.target.value })}
                    placeholder="Bebida Cola 1.5L"
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Proveedor Asociado
                  </label>
                  <select
                    value={formData.ProveedorId || ''}
                    onChange={e => setFormData({ ...formData, ProveedorId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Sin proveedor asignado --</option>
                    {proveedores.map(pr => (
                      <option key={pr.Id} value={pr.Id}>
                        {pr.Nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Precio Costo ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.PrecioCosto}
                      onChange={e => setFormData({ ...formData, PrecioCosto: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Precio Venta ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.PrecioVenta}
                      onChange={e => setFormData({ ...formData, PrecioVenta: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Stock Actual <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.StockActual}
                      onChange={e => setFormData({ ...formData, StockActual: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Stock Mínimo (Alerta)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.StockMinimo}
                      onChange={e => setFormData({ ...formData, StockMinimo: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      openLabelModal(editingProduct);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors"
                    title="Imprimir etiqueta con código de barras"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Etiqueta
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-3">
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
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Crear Producto')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impresión de Etiqueta con Código de Barras */}
      <EtiquetaProductoModal
        producto={selectedProductForLabel}
        isOpen={showLabelModal}
        onClose={() => {
          setShowLabelModal(false);
          setSelectedProductForLabel(null);
        }}
      />
    </div>
  );
};

export default ProductosPage;