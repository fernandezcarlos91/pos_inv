import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { DashboardResumenDto } from '../DTOs/DashboardDto';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  Users,
  Calendar,
  CreditCard,
  Receipt,
  Sparkles,
  BarChart3,
  Award,
  Filter,
  Percent,
  Banknote,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

type FiltroRango = 'hoy' | '7dias' | 'mes' | 'personalizado';
type CriterioTop = 'cantidad' | 'monto';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardResumenDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros de fecha
  const [filtroTipo, setFiltroTipo] = useState<FiltroRango>('hoy');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Selector para Top 10: por unidades o por monto
  const [criterioTop, setCriterioTop] = useState<CriterioTop>('cantidad');

  const formatDateYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRangoFechas = (tipo: FiltroRango): { desde: string; hasta: string } => {
    const hoy = new Date();
    const hoyStr = formatDateYMD(hoy);

    switch (tipo) {
      case 'hoy':
        return { desde: hoyStr, hasta: hoyStr };
      case '7dias': {
        const hace7 = new Date();
        hace7.setDate(hoy.getDate() - 6);
        return { desde: formatDateYMD(hace7), hasta: hoyStr };
      }
      case 'mes': {
        const primeroMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        return { desde: formatDateYMD(primeroMes), hasta: hoyStr };
      }
      case 'personalizado':
        return { desde: fechaInicio || hoyStr, hasta: fechaFin || hoyStr };
    }
  };

  const fetchDashboardData = async (tipo: FiltroRango = filtroTipo, customDesde?: string, customHasta?: string) => {
    setLoading(true);
    setError(null);
    try {
      const rango = (tipo === 'personalizado' && customDesde && customHasta) 
        ? { desde: customDesde, hasta: customHasta }
        : getRangoFechas(tipo);

      const params: Record<string, string> = {
        fechaInicio: rango.desde,
        fechaFin: rango.hasta,
      };

      const response = await api.get<DashboardResumenDto>('/dashboard/resumen', { params });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { desde, hasta } = getRangoFechas('hoy');
    setFechaInicio(desde);
    setFechaFin(hasta);
    fetchDashboardData('hoy', desde, hasta);
  }, []);

  const handleCambiarFiltro = (tipo: FiltroRango) => {
    setFiltroTipo(tipo);
    if (tipo !== 'personalizado') {
      const { desde, hasta } = getRangoFechas(tipo);
      setFechaInicio(desde);
      setFechaFin(hasta);
      fetchDashboardData(tipo, desde, hasta);
    }
  };

  const handleAplicarPersonalizado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) return;
    fetchDashboardData('personalizado', fechaInicio, fechaFin);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Cálculo de valor máximo para escalar el gráfico de barras
  const maxVenta = data?.VentasPorDia && data.VentasPorDia.length > 0
    ? Math.max(...data.VentasPorDia.map(d => d.Total), 1000)
    : 1000;

  // Lista activa de top productos según pestaña elegida
  const topProductosAMostrar = criterioTop === 'cantidad'
    ? (data?.TopProductos || [])
    : (data?.TopProductosPorMonto || []);

  // Porcentaje de margen sobre ventas netas
  const porcentajeMargen = (data?.TotalVendido && data.TotalVendido > 0)
    ? Math.round(((data.GananciaNetaEstimada || 0) / data.TotalVendido) * 100)
    : 0;

  // Obtener resumen de formas de pago normalizadas
  const getMetodoPagoData = (nombre: string) => {
    const item = data?.VentasPorFormaPago.find(
      p => p.FormaPago.toLowerCase() === nombre.toLowerCase()
    );
    return item || { FormaPago: nombre, Total: 0, CantidadTransacciones: 0, Porcentaje: 0 };
  };

  const efectivoData = getMetodoPagoData('Efectivo');
  const tarjetaData = getMetodoPagoData('Tarjeta');
  const transferenciaData = getMetodoPagoData('Transferencia');

  // Otras formas de pago fuera de las 3 principales si existieran
  const otrasFormasPago = (data?.VentasPorFormaPago || []).filter(
    p => !['efectivo', 'tarjeta', 'transferencia'].includes(p.FormaPago.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado del Dashboard con Controles de Período */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel de Control y Reportes</h1>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
              Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Métricas de ventas, margen de ganancias netas y análisis financiero en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            Actualizar
          </button>
          <Link
            to="/ventas"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Nueva Venta
          </Link>
        </div>
      </div>

      {/* Barra de Filtros de Período (Hoy, 7 días, Mes, Personalizado) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Período:
          </span>

          <button
            type="button"
            onClick={() => handleCambiarFiltro('hoy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroTipo === 'hoy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleCambiarFiltro('7dias')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroTipo === '7dias'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Últimos 7 días
          </button>

          <button
            type="button"
            onClick={() => handleCambiarFiltro('mes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroTipo === 'mes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Mes actual
          </button>

          <button
            type="button"
            onClick={() => setFiltroTipo('personalizado')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroTipo === 'personalizado'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Rango personalizado
          </button>
        </div>

        {/* Formulario de fechas personalizadas */}
        {filtroTipo === 'personalizado' && (
          <form onSubmit={handleAplicarPersonalizado} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="dashboard-desde" className="text-xs text-gray-500 font-medium">Desde:</label>
              <input
                id="dashboard-desde"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="dashboard-hasta" className="text-xs text-gray-500 font-medium">Hasta:</label>
              <input
                id="dashboard-hasta"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              Aplicar
            </button>
          </form>
        )}

        {/* Resumen del rango actual activo */}
        {filtroTipo !== 'personalizado' && (
          <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {filtroTipo === 'hoy' && 'Ventas de hoy'}
              {filtroTipo === '7dias' && 'Reporte semanal acumulado'}
              {filtroTipo === 'mes' && 'Reporte del mes en curso'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchDashboardData()} className="underline font-semibold text-xs ml-4 cursor-pointer">
            Reintentar
          </button>
        </div>
      )}

      {/* 4 Tarjetas de Métricas Principales (con GANANCIA NETA DESTACADA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Vendido en el Período */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {filtroTipo === 'hoy' ? 'Hoy' : 'Período'}
            </span>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Total Vendido</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">
              {loading ? '...' : formatCurrency(data?.TotalVendido || 0)}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500 mr-1" />
              <span>{data?.CantidadTransacciones || 0} ventas</span>
            </div>
            {data?.TotalDescuentos ? (
              <span className="text-red-500 font-medium">-{formatCurrency(data.TotalDescuentos)} desc.</span>
            ) : null}
          </div>
        </div>

        {/* 2. GANANCIA NETA ESTIMADA (¡Tarjeta Destacada del Período!) */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 p-6 rounded-2xl shadow-sm border-2 border-emerald-500/30 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              Margen Neto
            </span>
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-emerald-950">Ganancia Neta Estimada</h3>
              <span 
                className="text-gray-400 hover:text-gray-600 cursor-help" 
                title="Suma calculada de (Precio Venta - Precio Costo) × Cantidad vendida de cada detalle."
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1 tracking-tight">
              {loading ? '...' : formatCurrency(data?.GananciaNetaEstimada || 0)}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              <Percent className="w-3 h-3" />
              {porcentajeMargen}% margen sobre ventas
            </span>
            <span className="text-[11px] text-gray-500 hidden sm:inline">Σ (Venta - Costo) × Cant</span>
          </div>
        </div>

        {/* 3. Operaciones / Transacciones */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Operaciones
            </span>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Transacciones Realizadas</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">
              {loading ? '...' : (data?.CantidadTransacciones || 0)}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <ShoppingCart className="w-3.5 h-3.5 text-indigo-500 mr-1" />
            <span>
              Ticket promedio:{' '}
              {formatCurrency(
                (data?.CantidadTransacciones && data.CantidadTransacciones > 0)
                  ? Math.round(data.TotalVendido / data.CantidadTransacciones)
                  : 0
              )}
            </span>
          </div>
        </div>

        {/* 4. Alertas de Stock Crítico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Inventario
            </span>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Stock Crítico</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">
              {loading ? '...' : (data?.AlertasStockBajo || 0)}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Layers className="w-3.5 h-3.5 text-amber-500 mr-1" />
              <span>{data?.TotalProductos || 0} activos en catálogo</span>
            </div>
            <Link to="/productos" className="font-semibold text-blue-600 hover:text-blue-700">
              Ver
            </Link>
          </div>
        </div>
      </div>

      {/* SECCIÓN REQUERIDA: Total Vendido por Medio de Pago (Efectivo vs Tarjeta vs Transferencia) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Total Vendido por Medio de Pago
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Distribución de ingresos por canal de cobro en el período seleccionado.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            Total Período: <strong className="text-gray-900">{formatCurrency(data?.TotalVendido || 0)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tarjeta Efectivo */}
          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-2xs">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Efectivo</h3>
                    <p className="text-[11px] text-gray-500">{efectivoData.CantidadTransacciones} cobros en caja</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  {efectivoData.Porcentaje}%
                </span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-800 tracking-tight mt-2">
                {formatCurrency(efectivoData.Total)}
              </p>
            </div>
            {/* Barra de progreso porcentual */}
            <div className="mt-4 pt-3 border-t border-emerald-200/60">
              <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(efectivoData.Porcentaje, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 mt-1 block">Participación en la recaudación</span>
            </div>
          </div>

          {/* Tarjeta Tarjeta */}
          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-2xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Tarjeta (Débito / Crédito)</h3>
                    <p className="text-[11px] text-gray-500">{tarjetaData.CantidadTransacciones} cobros POS</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  {tarjetaData.Porcentaje}%
                </span>
              </div>
              <p className="text-2xl font-extrabold text-blue-800 tracking-tight mt-2">
                {formatCurrency(tarjetaData.Total)}
              </p>
            </div>
            {/* Barra de progreso porcentual */}
            <div className="mt-4 pt-3 border-t border-blue-200/60">
              <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(tarjetaData.Porcentaje, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 mt-1 block">Participación en la recaudación</span>
            </div>
          </div>

          {/* Tarjeta Transferencia */}
          <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-2xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Transferencia Bancaria</h3>
                    <p className="text-[11px] text-gray-500">{transferenciaData.CantidadTransacciones} comprobantes</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                  {transferenciaData.Porcentaje}%
                </span>
              </div>
              <p className="text-2xl font-extrabold text-purple-800 tracking-tight mt-2">
                {formatCurrency(transferenciaData.Total)}
              </p>
            </div>
            {/* Barra de progreso porcentual */}
            <div className="mt-4 pt-3 border-t border-purple-200/60">
              <div className="w-full bg-purple-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(transferenciaData.Porcentaje, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 mt-1 block">Participación en la recaudación</span>
            </div>
          </div>
        </div>

        {/* Formas de pago adicionales si las hubiera */}
        {otrasFormasPago.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold text-gray-500">Otros medios registrados:</span>
            {otrasFormasPago.map(p => (
              <span key={p.FormaPago} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-gray-100 text-gray-700 font-medium">
                <strong>{p.FormaPago}:</strong> {formatCurrency(p.Total)} ({p.Porcentaje}%)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN: TOP 10 PRODUCTOS MÁS VENDIDOS Y ALERTAS DE STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla / Lista: Top 10 Productos Más Vendidos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Top 10 Productos Más Vendidos</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Artículos con mayor rotación e ingresos generados durante el período.
              </p>
            </div>

            {/* Selector de orden: por Cantidad vs por Monto */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setCriterioTop('cantidad')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  criterioTop === 'cantidad'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Por Cantidad
              </button>
              <button
                type="button"
                onClick={() => setCriterioTop('monto')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  criterioTop === 'monto'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Por Recaudación ($)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider rounded-xl">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3 text-center">Unidades</th>
                  <th className="py-2.5 px-3 text-right rounded-r-xl">Total Recaudado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProductosAMostrar.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
                      <p className="font-medium text-sm">Sin ventas de productos en este período</p>
                      <p className="text-xs text-gray-400">Prueba ajustando el rango de fechas en la parte superior.</p>
                    </td>
                  </tr>
                ) : (
                  topProductosAMostrar.map((prod, index) => {
                    const badgeColor = index === 0
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : index === 1
                      ? 'bg-slate-200 text-slate-800 border-slate-300'
                      : index === 2
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200';

                    return (
                      <tr key={prod.ProductoId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${badgeColor}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-gray-900 leading-snug">{prod.Nombre}</p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">Cód: {prod.CodigoBarras || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {prod.CantidadVendida} un.
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(prod.MontoTotal)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Listando los 10 productos líderes del período</span>
            <Link to="/historial-ventas" className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver ventas completas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Panel de Productos con Stock Bajo / Crítico (MANTENIDO) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Stock Crítico
              </h2>
              <Link
                to="/productos"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Gestionar
              </Link>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Artículos que han alcanzado o están por debajo del stock mínimo recomendado.
            </p>

            <div className="overflow-y-auto max-h-[360px] divide-y divide-gray-100">
              {data?.ProductosStockBajo.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mb-2 stroke-1 text-emerald-500" />
                  <p className="text-sm font-semibold text-gray-700">¡Inventario en regla!</p>
                  <p className="text-xs text-gray-400">No hay productos con stock por debajo del mínimo.</p>
                </div>
              ) : (
                data?.ProductosStockBajo.map((prod) => (
                  <div key={prod.Id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{prod.Nombre}</p>
                      <p className="text-xs text-gray-400 font-mono">Cód: {prod.CodigoBarras}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {prod.StockActual} / {prod.StockMinimo}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">mínimo</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              to="/proveedores"
              className="w-full py-2.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Contactar Proveedores para Reposición
            </Link>
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Ventas y Transacciones Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolución de Ventas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Evolución de Ingresos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {filtroTipo === 'hoy'
                  ? 'Historial de los últimos 7 días terminando en el día de hoy.'
                  : 'Desglose cronológico de ventas del período.'}
              </p>
            </div>
            <Link
              to="/historial-ventas"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Historial completo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Gráfico de barras interactivo */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-gray-100 overflow-x-auto">
            {(!data?.VentasPorDia || data.VentasPorDia.length === 0) ? (
              <div className="w-full flex items-center justify-center text-sm text-gray-400">
                Sin datos cronológicos en este rango.
              </div>
            ) : (
              data.VentasPorDia.map((item, idx) => {
                const heightPercent = maxVenta > 0 ? Math.max((item.Total / maxVenta) * 100, 4) : 4;
                return (
                  <div key={idx} className="flex-1 min-w-[28px] flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip flotante */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-11 bg-gray-900 text-white text-[11px] rounded-lg py-1 px-2.5 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      <p className="font-semibold">{formatCurrency(item.Total)}</p>
                      <p className="text-[10px] text-gray-300">{item.CantidadTransacciones} transacciones</p>
                    </div>

                    {/* Barra con gradiente */}
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[44px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-300 group-hover:from-blue-700 group-hover:to-indigo-600 shadow-2xs"
                    />

                    {/* Etiqueta de fecha */}
                    <div className="mt-3 text-center">
                      <span className="block text-[11px] font-medium text-gray-600 capitalize">
                        {item.DiaNombre}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        {item.Fecha.slice(8, 10)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Valores expresados en CLP</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Monto Total de Venta
              </span>
            </div>
          </div>
        </div>

        {/* Últimas Transacciones Registradas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Ventas Recientes
              </h2>
              <Link
                to="/historial-ventas"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Ver todas
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {(!data?.VentasRecientes || data.VentasRecientes.length === 0) ? (
                <p className="py-8 text-center text-sm text-gray-400">No hay ventas registradas aún.</p>
              ) : (
                data.VentasRecientes.slice(0, 5).map((v) => (
                  <div key={v.Id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        #{v.Id.toString().padStart(5, '0')}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(v.Fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} • {v.NombreUsuario}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(v.Total)}</p>
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {v.FormaPago}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              to="/historial-ventas"
              className="w-full py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              Ir al Historial Detallado con Filtros
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
