import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { ProductoResponseDto } from '../DTOs/ProductoResponseDto';
import type { CrearVentaDto, CrearDetalleVentaDto, VentaResponseDto } from '../DTOs/VentaDto';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  CreditCard, 
  ArrowRight,
  Package,
  PackagePlus,
  CheckCircle,
  AlertCircle,
  Receipt,
  ScanBarcode,
  Printer,
  X,
  Tag,
  Percent,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TicketVentaModal } from '../components/TicketVentaModal';

interface CartItem {
  producto: ProductoResponseDto;
  cantidad: number;
}

export const VentasPage: React.FC = () => {
  const { usuario } = useAuth();
  const [products, setProducts] = useState<ProductoResponseDto[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formaPago, setFormaPago] = useState<string>('Efectivo');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados del Ticket de Venta (80mm)
  const [ventaCompletada, setVentaCompletada] = useState<VentaResponseDto | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Estados del Modal de Ingreso de Mercadería (Recepción de Stock)
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<ProductoResponseDto | null>(null);
  const [stockProductQuery, setStockProductQuery] = useState('');
  const [stockCantidad, setStockCantidad] = useState<number | string>(1);
  const [stockObservacion, setStockObservacion] = useState('');
  const [submittingStock, setSubmittingStock] = useState(false);
  const [stockModalError, setStockModalError] = useState<string | null>(null);

  // Estados del Descuento Manual con Autorización de Admin
  const [descuentoAplicado, setDescuentoAplicado] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState<'monto' | 'porcentaje'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number | string>(10);
  const [motivoDescuento, setMotivoDescuento] = useState('');
  const [adminAutorizador, setAdminAutorizador] = useState<{ nombre?: string; email?: string } | null>(null);

  // Estados del Modal de Autorización de Descuento
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempTipoDescuento, setTempTipoDescuento] = useState<'monto' | 'porcentaje'>('porcentaje');
  const [tempValorDescuento, setTempValorDescuento] = useState<number | string>(10);
  const [tempMotivoDescuento, setTempMotivoDescuento] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [discountModalError, setDiscountModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get<ProductoResponseDto[]>('/productos');
      setProducts(response.data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.Activo &&
    (p.Nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.CodigoBarras.toLowerCase().includes(search.toLowerCase()))
  );

  const modalFilteredProducts = products.filter(p =>
    p.Activo &&
    (stockProductQuery.trim() === '' ||
      p.Nombre.toLowerCase().includes(stockProductQuery.toLowerCase()) ||
      p.CodigoBarras.toLowerCase().includes(stockProductQuery.toLowerCase()))
  );

  const openStockModal = (product?: ProductoResponseDto) => {
    setSelectedStockProduct(product || null);
    setStockProductQuery(product ? `${product.Nombre} (${product.CodigoBarras})` : '');
    setStockCantidad(1);
    setStockObservacion('');
    setStockModalError(null);
    setShowStockModal(true);
  };

  const handleSelectProductForStock = (p: ProductoResponseDto) => {
    setSelectedStockProduct(p);
    setStockProductQuery(`${p.Nombre} (${p.CodigoBarras})`);
    setStockModalError(null);
  };

  const handleIngresarStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockProduct) {
      setStockModalError('Por favor selecciona un producto para ingresar stock.');
      return;
    }

    const cantidadNum = Number(stockCantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      setStockModalError('La cantidad a ingresar debe ser mayor a 0.');
      return;
    }

    setSubmittingStock(true);
    setStockModalError(null);

    try {
      const response = await api.post<ProductoResponseDto>(
        `/productos/${selectedStockProduct.Id}/ingresar-stock`,
        {
          cantidad: cantidadNum,
          observacion: stockObservacion.trim() || undefined
        }
      );

      const updated = response.data;
      const nuevoStock = updated.StockActual;
      const nombreProd = updated.Nombre || selectedStockProduct.Nombre;

      // Mensaje de confirmación requerido: "Se agregaron X unidades a [Nombre producto]. Nuevo stock: Y"
      setMessage({
        type: 'success',
        text: `Se agregaron ${cantidadNum} unidades a ${nombreProd}. Nuevo stock: ${nuevoStock}`
      });

      setShowStockModal(false);
      await fetchProducts();
    } catch (error: any) {
      setStockModalError(error.response?.data?.message || 'Error al registrar el ingreso de mercadería.');
    } finally {
      setSubmittingStock(false);
    }
  };

  const addToCart = (product: ProductoResponseDto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.Id === product.Id);
      if (existing) {
        if (existing.cantidad + 1 > product.StockActual) {
          setMessage({ type: 'error', text: `Stock insuficiente para "${product.Nombre}" (Máx: ${product.StockActual})` });
          return prev;
        }
        return prev.map(item =>
          item.producto.Id === product.Id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto: product, cantidad: 1 }];
    });
    setSearch('');
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    const item = cart.find(c => c.producto.Id === productId);
    if (!item) return;
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > item.producto.StockActual) {
      setMessage({ type: 'error', text: `Stock insuficiente para "${item.producto.Nombre}". Disponible: ${item.producto.StockActual}` });
      return;
    }
    setMessage(null);
    setCart(prev =>
      prev.map(c =>
        c.producto.Id === productId ? { ...c, cantidad: newQuantity } : c
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(c => c.producto.Id !== productId));
  };

  const getSubtotal = (item: CartItem): number => {
    return Number(item.producto.PrecioVenta) * item.cantidad;
  };

  const getTotalBruto = (): number => {
    return cart.reduce((sum, item) => sum + getSubtotal(item), 0);
  };

  const getDescuentoCalculado = (): number => {
    if (!descuentoAplicado || cart.length === 0) return 0;
    const bruto = getTotalBruto();
    const val = Number(valorDescuento) || 0;
    if (val <= 0) return 0;

    let desc = 0;
    if (tipoDescuento === 'porcentaje') {
      desc = Math.round((bruto * val) / 100);
    } else {
      desc = val;
    }
    return Math.max(0, Math.min(desc, bruto));
  };

  const getTotalFinal = (): number => {
    const bruto = getTotalBruto();
    const desc = getDescuentoCalculado();
    return Math.max(0, bruto - desc);
  };

  const getModalPreviewDiscount = (): { descMonto: number; totalEstimado: number } => {
    const bruto = getTotalBruto();
    const val = Number(tempValorDescuento) || 0;
    let desc = 0;
    if (tempTipoDescuento === 'porcentaje') {
      desc = Math.round((bruto * Math.min(100, Math.max(0, val))) / 100);
    } else {
      desc = Math.min(bruto, Math.max(0, val));
    }
    return {
      descMonto: desc,
      totalEstimado: Math.max(0, bruto - desc),
    };
  };

  const openDiscountModal = () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Agrega productos al carrito antes de aplicar un descuento.' });
      return;
    }
    setTempTipoDescuento(descuentoAplicado ? tipoDescuento : 'porcentaje');
    setTempValorDescuento(descuentoAplicado ? valorDescuento : 10);
    setTempMotivoDescuento(descuentoAplicado ? motivoDescuento : '');
    setAdminPassword('');
    setAdminEmail('');
    setShowPassword(false);
    setDiscountModalError(null);
    setShowDiscountModal(true);
  };

  const handleRemoveDiscount = () => {
    setDescuentoAplicado(false);
    setAdminAutorizador(null);
    setMotivoDescuento('');
    setMessage({ type: 'success', text: 'Descuento eliminado de la venta.' });
  };

  const handleAuthorizeDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempValorDescuento);
    if (isNaN(val) || val <= 0) {
      setDiscountModalError('El valor del descuento debe ser mayor a 0.');
      return;
    }

    const bruto = getTotalBruto();
    if (tempTipoDescuento === 'porcentaje' && val > 100) {
      setDiscountModalError('El porcentaje de descuento no puede ser superior al 100%.');
      return;
    }
    if (tempTipoDescuento === 'monto' && val > bruto) {
      setDiscountModalError(`El descuento no puede superar el subtotal (${formatCurrency(bruto)}).`);
      return;
    }

    if (!adminPassword.trim()) {
      setDiscountModalError('Debe ingresar la contraseña de administrador para autorizar.');
      return;
    }

    setVerifyingAdmin(true);
    setDiscountModalError(null);

    try {
      const response = await api.post<{
        Autorizado: boolean;
        Mensaje: string;
        NombreAdmin?: string;
        EmailAdmin?: string;
      }>('/auth/verificar-admin', {
        Email: adminEmail.trim() || undefined,
        Password: adminPassword,
      });

      if (response.data.Autorizado) {
        setTipoDescuento(tempTipoDescuento);
        setValorDescuento(val);
        setMotivoDescuento(tempMotivoDescuento.trim());
        setDescuentoAplicado(true);
        setAdminAutorizador({
          nombre: response.data.NombreAdmin,
          email: response.data.EmailAdmin,
        });
        setShowDiscountModal(false);
        setAdminPassword('');

        setMessage({
          type: 'success',
          text: `Descuento autorizado por ${response.data.NombreAdmin || 'Administrador'} y aplicado exitosamente.`
        });
      } else {
        setDiscountModalError(response.data.Mensaje || 'No se pudo autorizar el descuento.');
      }
    } catch (err: any) {
      setDiscountModalError(
        err.response?.data?.message || 'Contraseña de administrador incorrecta.'
      );
    } finally {
      setVerifyingAdmin(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'El carrito está vacío.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const detalles: CrearDetalleVentaDto[] = cart.map(item => ({
        ProductoId: item.producto.Id,
        Cantidad: item.cantidad,
      }));
      const descuentoMonto = descuentoAplicado ? getDescuentoCalculado() : 0;
      const ventaDto: CrearVentaDto = {
        FormaPago: formaPago,
        Descuento: descuentoMonto,
        MotivoDescuento: descuentoAplicado && motivoDescuento.trim() ? motivoDescuento.trim() : undefined,
        Detalles: detalles,
      };
      
      const response = await api.post('/ventas', ventaDto);
      const venta: VentaResponseDto = response.data;

      // Enriquecer datos para asegurar impresión de ticket completa
      if (venta.Detalles) {
        venta.Detalles = venta.Detalles.map(d => ({
          ...d,
          NombreProducto: d.NombreProducto || products.find(p => p.Id === d.ProductoId)?.Nombre || `Producto #${d.ProductoId}`
        }));
      }
      if (!venta.NombreUsuario && usuario?.nombre) {
        venta.NombreUsuario = usuario.nombre;
      }

      setVentaCompletada(venta);
      setShowTicketModal(true);

      setMessage({ 
        type: 'success', 
        text: `¡Venta #${venta.Id} registrada exitosamente por ${formatCurrency(venta.Total)}!` 
      });
      setCart([]);
      setDescuentoAplicado(false);
      setAdminAutorizador(null);
      setMotivoDescuento('');
      fetchProducts(); // Refrescar stock de productos
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al procesar la venta.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado Superior con Acción de Ingresar Mercadería */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Punto de Venta
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Emisión de tickets de venta y recepción de mercadería para stock.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openStockModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PackagePlus className="w-4 h-4" />
          Ingresar mercadería
        </button>
      </div>

      {/* Alerta de notificación con botón de Imprimir Ticket */}
      {message && (
        <div className={`p-4 rounded-2xl text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border shadow-xs animate-in fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>

          {message.type === 'success' && ventaCompletada && (
            <button
              type="button"
              onClick={() => setShowTicketModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100/80 border border-emerald-300 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              Imprimir ticket (#{ventaCompletada.Id})
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo y Búsqueda de Productos (5 columnas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-[750px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-blue-600" />
                Catálogo de Productos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Busca o escanea para añadir al carrito.</p>
            </div>
            <button
              type="button"
              onClick={() => openStockModal()}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-colors inline-flex items-center gap-1.5"
              title="Registrar recepción de mercadería"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              + Stock
            </button>
          </div>

          {/* Input de Búsqueda */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  const exactMatch = products.find(p => p.Activo && p.CodigoBarras.toLowerCase() === search.trim().toLowerCase());
                  const match = exactMatch || (filteredProducts.length === 1 ? filteredProducts[0] : null);
                  if (match && match.StockActual > 0) {
                    addToCart(match);
                    setSearch('');
                  }
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Lista de productos scrolleable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-medium">Cargando productos...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center p-4">
                <Package className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No se encontraron productos</p>
                <p className="text-xs text-gray-400">Verifica el nombre o código ingresado.</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const sinStock = product.StockActual <= 0;
                const stockBajo = product.StockActual <= product.StockMinimo;
                return (
                  <div
                    key={product.Id}
                    className={`w-full p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                      sinStock 
                        ? 'bg-gray-50/80 border-gray-200' 
                        : 'bg-white hover:bg-blue-50/40 hover:border-blue-200 border-gray-100 shadow-2xs'
                    }`}
                  >
                    <div
                      onClick={() => !sinStock && addToCart(product)}
                      className={`min-w-0 flex-1 ${sinStock ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                        {product.Nombre}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-gray-500">
                          {product.CodigoBarras}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          sinStock 
                            ? 'bg-red-100 text-red-700' 
                            : stockBajo 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Stock: {product.StockActual}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <span className="text-base font-extrabold text-gray-900 block">
                          {formatCurrency(Number(product.PrecioVenta))}
                        </span>
                        {!sinStock ? (
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="text-[11px] text-blue-600 font-semibold hover:underline block ml-auto"
                          >
                            + Agregar
                          </button>
                        ) : (
                          <span className="text-[10px] text-red-500 font-medium block">Sin stock</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStockModal(product);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        title={`Ingresar mercadería para ${product.Nombre}`}
                      >
                        <PackagePlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Carrito de Compra y Cobro (7 columnas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[750px]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Caja Registradora
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {cart.length === 0 ? 'Sin artículos en el ticket' : `${cart.length} productos agregados`}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => {
                  setCart([]);
                  setDescuentoAplicado(false);
                  setAdminAutorizador(null);
                  setMotivoDescuento('');
                }}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 py-1 px-2.5 rounded-lg font-semibold transition-colors"
              >
                Vaciar Carrito
              </button>
            )}
          </div>

          {/* Lista de productos en Carrito */}
          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <ShoppingCart className="w-8 h-8 text-gray-300 stroke-1" />
                </div>
                <p className="text-base font-semibold text-gray-700">El carrito está vacío</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Selecciona productos del catálogo izquierdo para registrar la venta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.producto.Id}
                    className="p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {item.producto.Nombre}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(Number(item.producto.PrecioVenta))} c/u
                      </p>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.producto.Id, item.cantidad - 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.producto.StockActual}
                        value={item.cantidad}
                        onChange={e => updateQuantity(item.producto.Id, parseInt(e.target.value) || 1)}
                        className="w-10 text-center font-bold text-sm bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.producto.Id, item.cantidad + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal y Borrar */}
                    <div className="text-right min-w-[100px]">
                      <span className="block font-extrabold text-sm text-gray-900">
                        {formatCurrency(getSubtotal(item))}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.producto.Id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium inline-flex items-center gap-1 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección de Pago y Total */}
          <div className="pt-4 border-t border-gray-100 space-y-4 bg-white">
            {/* Resumen de Valores (Subtotal, Descuento, Botón de Descuento) */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Subtotal (bruto):</span>
                <span className="font-semibold text-gray-900">{formatCurrency(getTotalBruto())}</span>
              </div>

              {descuentoAplicado ? (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Tag className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>
                        Descuento ({tipoDescuento === 'porcentaje' ? `${valorDescuento}%` : 'fijo'}):
                      </span>
                      <span className="text-emerald-700 font-extrabold">-{formatCurrency(getDescuentoCalculado())}</span>
                    </div>
                    {motivoDescuento && (
                      <p className="text-[11px] text-emerald-800/80 truncate mt-0.5">
                        Motivo: {motivoDescuento}
                      </p>
                    )}
                    {adminAutorizador?.nombre && (
                      <p className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Autorizado por: {adminAutorizador.nombre}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={openDiscountModal}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">¿Deseas aplicar una rebaja?</span>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={openDiscountModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Aplicar Descuento
                  </button>
                </div>
              )}
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Efectivo', label: 'Efectivo', icon: DollarSign },
                  { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard },
                  { id: 'Transferencia', label: 'Transferencia', icon: Receipt },
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = formaPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormaPago(m.id)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total a Pagar y Botón Completar Venta */}
            <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
              <div>
                <span className="text-xs text-gray-500 block">
                  {descuentoAplicado ? 'Total a Pagar (con descuento)' : 'Total a Pagar'}
                </span>
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  {formatCurrency(getTotalFinal())}
                </span>
              </div>
              <button
                onClick={handleCompleteSale}
                disabled={submitting || cart.length === 0}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Completar Venta <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ingreso de Mercadería */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Ingresar Mercadería
                  </h3>
                  <p className="text-xs text-gray-500">
                    Registra recepción de stock para actualizar inventario en caja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngresarStockSubmit}>
              <div className="p-6 space-y-4">
                {stockModalError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{stockModalError}</span>
                  </div>
                )}

                {/* Selección o Búsqueda de Producto */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Producto a Ingresar <span className="text-red-500">*</span>
                  </label>
                  
                  {selectedStockProduct ? (
                    <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-gray-900 truncate">
                          {selectedStockProduct.Nombre}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-600">
                          <span className="font-mono text-gray-500">{selectedStockProduct.CodigoBarras}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-700">Precio: {formatCurrency(Number(selectedStockProduct.PrecioVenta))}</span>
                          <span>•</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            Stock Actual: {selectedStockProduct.StockActual} un.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStockProduct(null);
                          setStockProductQuery('');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 hover:bg-blue-100/60 rounded-lg transition-colors ml-2 shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={stockProductQuery}
                          onChange={e => setStockProductQuery(e.target.value)}
                          placeholder="Buscar por nombre o código de barras..."
                          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>

                      {/* Lista de productos para seleccionar */}
                      <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-1 bg-gray-50/50">
                        {modalFilteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">
                            No se encontraron productos activos con ese criterio.
                          </div>
                        ) : (
                          modalFilteredProducts.map(p => (
                            <button
                              key={p.Id}
                              type="button"
                              onClick={() => handleSelectProductForStock(p)}
                              className="w-full text-left p-2.5 rounded-lg hover:bg-white hover:shadow-2xs border border-transparent hover:border-gray-200 transition-all flex items-center justify-between text-xs group"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="font-semibold text-gray-900 group-hover:text-indigo-600 block truncate">
                                  {p.Nombre}
                                </span>
                                <span className="font-mono text-gray-400 text-[11px]">{p.CodigoBarras}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-gray-700 font-medium block">
                                  {formatCurrency(Number(p.PrecioVenta))}
                                </span>
                                <span className="font-bold text-indigo-600 text-[11px]">
                                  Stock: {p.StockActual}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cantidad a ingresar */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Cantidad a Ingresar <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={stockCantidad}
                      onChange={e => setStockCantidad(e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-1 shrink-0">
                      {[1, 5, 10, 20].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setStockCantidad(prev => (Number(prev) || 0) + n)}
                          className="px-2.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition-colors"
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vista previa de stock resultante */}
                {selectedStockProduct && (
                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-emerald-900 font-bold block">
                        Stock Actual: {selectedStockProduct.StockActual} unidades
                      </span>
                      <span className="text-emerald-700 text-[11px]">
                        + {Number(stockCantidad) > 0 ? Number(stockCantidad) : 0} unidades a ingresar
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold block">
                        Nuevo Stock Resultante
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        {selectedStockProduct.StockActual + (Number(stockCantidad) > 0 ? Number(stockCantidad) : 0)} un.
                      </span>
                    </div>
                  </div>
                )}

                {/* Observación (opcional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Observación o Motivo <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={stockObservacion}
                    onChange={e => setStockObservacion(e.target.value)}
                    placeholder="Ej: Recepción proveedor, pedido reposición..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingStock || !selectedStockProduct || Number(stockCantidad) <= 0}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {submittingStock ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-4 h-4" />
                      Registrar Ingreso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Autorización de Descuento (Admin) */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Autorización de Descuento
                  </h3>
                  <p className="text-xs text-gray-500">
                    Requiere validación de contraseña de Administrador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuthorizeDiscount}>
              <div className="p-5 space-y-4">
                {discountModalError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{discountModalError}</span>
                  </div>
                )}

                {/* Selector de Tipo de Descuento: Monto o Porcentaje */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tipo de Descuento
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTempTipoDescuento('porcentaje')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tempTipoDescuento === 'porcentaje'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Porcentaje (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempTipoDescuento('monto')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tempTipoDescuento === 'monto'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Monto Fijo ($)
                    </button>
                  </div>
                </div>

                {/* Input de Valor */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {tempTipoDescuento === 'porcentaje' ? 'Porcentaje a descontar (%)' : 'Monto en pesos ($)'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={tempTipoDescuento === 'porcentaje' ? 100 : getTotalBruto()}
                      step={tempTipoDescuento === 'porcentaje' ? '1' : '100'}
                      required
                      value={tempValorDescuento}
                      onChange={e => setTempValorDescuento(e.target.value)}
                      placeholder={tempTipoDescuento === 'porcentaje' ? '10' : '2000'}
                      className="w-full px-3.5 py-2.5 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3.5 top-3 text-sm font-semibold text-gray-400">
                      {tempTipoDescuento === 'porcentaje' ? '%' : 'CLP'}
                    </span>
                  </div>

                  {/* Botones de sugerencia rápida */}
                  <div className="flex gap-1.5 mt-2">
                    {tempTipoDescuento === 'porcentaje' ? (
                      [5, 10, 15, 20, 50].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTempValorDescuento(p)}
                          className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            Number(tempValorDescuento) === p
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                          }`}
                        >
                          {p}%
                        </button>
                      ))
                    ) : (
                      [500, 1000, 2000, 5000].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTempValorDescuento(m)}
                          className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            Number(tempValorDescuento) === m
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                          }`}
                        >
                          +${m >= 1000 ? `${m / 1000}k` : m}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Motivo del Descuento */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Motivo o Razón <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={tempMotivoDescuento}
                    onChange={e => setTempMotivoDescuento(e.target.value)}
                    placeholder="Ej: Cliente frecuente, Cortesía, Promoción..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Pills de motivos sugeridos */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['Cliente frecuente', 'Promoción especial', 'Cortesía comercial', 'Detalle producto'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTempMotivoDescuento(m)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Previsualización del cálculo */}
                {(() => {
                  const preview = getModalPreviewDiscount();
                  return (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-indigo-900 font-bold block">
                          Subtotal Bruto: {formatCurrency(getTotalBruto())}
                        </span>
                        <span className="text-emerald-700 font-semibold text-[11px]">
                          Descuento: -{formatCurrency(preview.descMonto)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-indigo-700 font-semibold block">
                          Nuevo Total a Pagar
                        </span>
                        <span className="text-base font-black text-indigo-900">
                          {formatCurrency(preview.totalEstimado)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Sección de Autorización de Admin con Contraseña */}
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Autorización de Administrador
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        El administrador debe ingresar su clave para validar la rebaja
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Contraseña de Administrador <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        value={adminPassword}
                        onChange={e => {
                          setAdminPassword(e.target.value);
                          setDiscountModalError(null);
                        }}
                        placeholder="Ingresa la contraseña Admin"
                        className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={verifyingAdmin || !adminPassword.trim() || Number(tempValorDescuento) <= 0}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                >
                  {verifyingAdmin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Autorizar y Aplicar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ticket de Venta (80mm) */}
      <TicketVentaModal
        venta={ventaCompletada}
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
      />
    </div>
  );
};

export default VentasPage;
