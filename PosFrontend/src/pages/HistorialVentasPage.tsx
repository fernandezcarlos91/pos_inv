import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { VentaResponseDto } from '../DTOs/VentaDto';
import { 
  Search, 
  Calendar, 
  Eye, 
  X, 
  FileText, 
  CreditCard, 
  DollarSign, 
  RotateCcw,
  Receipt,
  User,
  Filter,
  Printer
} from 'lucide-react';
import { TicketVentaModal } from '../components/TicketVentaModal';

export const HistorialVentasPage: React.FC = () => {
  const [ventas, setVentas] = useState<VentaResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [buscar, setBuscar] = useState('');

  // Estado para el modal de detalle e impresión
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaResponseDto | null>(null);
  const [ventaParaImprimir, setVentaParaImprimir] = useState<VentaResponseDto | null>(null);

  const fetchVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      if (buscar.trim()) params.buscar = buscar.trim();

      const response = await api.get<VentaResponseDto[]>('/ventas', { params });
      setVentas(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVentas();
  };

  const handleLimpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setBuscar('');
    // Invocar fetch con parámetros vacíos
    api.get<VentaResponseDto[]>('/ventas')
      .then(res => setVentas(res.data))
      .catch(err => setError(err.response?.data?.message || 'Error al reiniciar'));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getFormaPagoBadge = (forma: string) => {
    const f = forma.toLowerCase();
    if (f.includes('efectivo')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <DollarSign className="w-3 h-3" /> Efectivo
        </span>
      );
    }
    if (f.includes('tarjeta') || f.includes('debito') || f.includes('credito')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CreditCard className="w-3 h-3" /> Tarjeta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <Receipt className="w-3 h-3" /> {forma}
      </span>
    );
  };

  // Métricas rápidas de los resultados filtrados
  const totalMontoFiltrado = ventas.reduce((acc, v) => acc + v.Total, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Historial de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta, audita y filtra todas las transacciones realizadas en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Total en Vista ({ventas.length} ventas)</span>
            <span className="text-xl font-extrabold text-gray-900">{formatCurrency(totalMontoFiltrado)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleFiltrar} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda por texto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Buscador General
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="ID, cajero, método, producto..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Fecha Inicio
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Fecha Fin
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              title="Restablecer filtros"
              className="p-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-6">ID Venta</th>
                <th className="py-3.5 px-6">Fecha y Hora</th>
                <th className="py-3.5 px-6">Atendido Por</th>
                <th className="py-3.5 px-6">Método de Pago</th>
                <th className="py-3.5 px-6 text-center">Ítems</th>
                <th className="py-3.5 px-6 text-right">Total</th>
                <th className="py-3.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Cargando registros de ventas...
                    </div>
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300 stroke-1" />
                    <p className="font-medium text-gray-600">No se encontraron ventas</p>
                    <p className="text-xs text-gray-400 mt-1">Prueba ajustando los filtros de fecha o búsqueda.</p>
                  </td>
                </tr>
              ) : (
                ventas.map((v) => {
                  const cantItems = v.Detalles?.reduce((acc, d) => acc + d.Cantidad, 0) || 0;
                  return (
                    <tr key={v.Id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-gray-900">
                        #{v.Id.toString().padStart(6, '0')}
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {new Date(v.Fecha).toLocaleString('es-CL', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {(v.NombreUsuario || 'C')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {v.NombreUsuario || 'Cajero'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getFormaPagoBadge(v.FormaPago)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {cantItems} {cantItems === 1 ? 'artículo' : 'artículos'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-gray-900 text-base">
                        {formatCurrency(v.Total)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setVentaSeleccionada(v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Venta */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Detalle de Venta #{ventaSeleccionada.Id.toString().padStart(6, '0')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(ventaSeleccionada.Fecha).toLocaleString('es-CL', {
                      dateStyle: 'full',
                      timeStyle: 'medium'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVentaSeleccionada(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadatos Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 bg-white border-b border-gray-100 text-sm">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Atendido Por</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-blue-500" />
                  {ventaSeleccionada.NombreUsuario || 'Cajero / Admin'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Forma de Pago</span>
                <span className="mt-1 block">
                  {getFormaPagoBadge(ventaSeleccionada.FormaPago)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Total de la Venta</span>
                <span className="text-lg font-extrabold text-blue-600 mt-0.5 block">
                  {formatCurrency(ventaSeleccionada.Total)}
                </span>
                {ventaSeleccionada.Descuento && Number(ventaSeleccionada.Descuento) > 0 ? (
                  <span className="text-xs font-semibold text-emerald-600 block">
                    (Desc: -{formatCurrency(Number(ventaSeleccionada.Descuento))})
                  </span>
                ) : null}
              </div>
            </div>

            {/* Tabla de Productos Vendidos */}
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Productos Comprados ({ventaSeleccionada.Detalles?.length || 0})
              </h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-semibold text-xs">
                    <tr>
                      <th className="py-2.5 px-4">Producto</th>
                      <th className="py-2.5 px-4 text-center">Cantidad</th>
                      <th className="py-2.5 px-4 text-right">Precio Unitario</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ventaSeleccionada.Detalles?.map((d) => (
                      <tr key={d.Id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {d.NombreProducto || `Producto #${d.ProductoId}`}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">
                          {d.Cantidad}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatCurrency(d.PrecioUnitario)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {formatCurrency(d.Subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/80 font-bold border-t border-gray-100 divide-y divide-gray-100">
                    {ventaSeleccionada.Descuento && Number(ventaSeleccionada.Descuento) > 0 ? (
                      <>
                        <tr>
                          <td colSpan={3} className="py-2 px-4 text-right text-gray-600 font-medium">
                            Subtotal Bruto:
                          </td>
                          <td className="py-2 px-4 text-right text-sm text-gray-800">
                            {formatCurrency(
                              ventaSeleccionada.TotalBruto && Number(ventaSeleccionada.TotalBruto) > 0
                                ? Number(ventaSeleccionada.TotalBruto)
                                : Number(ventaSeleccionada.Total) + Number(ventaSeleccionada.Descuento)
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="py-2 px-4 text-right text-emerald-700 font-semibold">
                            Descuento Aplicado{ventaSeleccionada.MotivoDescuento ? ` (${ventaSeleccionada.MotivoDescuento})` : ''}:
                          </td>
                          <td className="py-2 px-4 text-right text-sm text-emerald-700 font-bold">
                            -{formatCurrency(Number(ventaSeleccionada.Descuento))}
                          </td>
                        </tr>
                      </>
                    ) : null}
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right text-gray-700">
                        Total Facturado:
                      </td>
                      <td className="py-3 px-4 text-right text-base text-blue-600 font-black">
                        {formatCurrency(ventaSeleccionada.Total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVentaSeleccionada(null)}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shadow-2xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setVentaParaImprimir(ventaSeleccionada)}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Venta Térmico (80mm) */}
      <TicketVentaModal
        venta={ventaParaImprimir}
        isOpen={Boolean(ventaParaImprimir)}
        onClose={() => setVentaParaImprimir(null)}
      />
    </div>
  );
};

export default HistorialVentasPage;
