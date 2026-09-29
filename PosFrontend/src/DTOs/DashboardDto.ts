export interface VentasPorFormaPagoDto {
  FormaPago: string;
  Total: number;
  CantidadTransacciones: number;
  Porcentaje: number;
}

export interface TopProductoDto {
  ProductoId: number;
  CodigoBarras: string;
  Nombre: string;
  CantidadVendida: number;
  MontoTotal: number;
}

export interface VentaPorDiaDto {
  Fecha: string;
  DiaNombre: string;
  Total: number;
  CantidadTransacciones: number;
}

export interface ProductoStockBajoDto {
  Id: number;
  CodigoBarras: string;
  Nombre: string;
  StockActual: number;
  StockMinimo: number;
  PrecioVenta: number;
}

export interface VentaRecienteDto {
  Id: number;
  Fecha: string;
  Total: number;
  FormaPago: string;
  NombreUsuario: string;
}

export interface DashboardResumenDto {
  FechaInicio: string;
  FechaFin: string;
  TotalVendido: number;
  CantidadTransacciones: number;
  TotalBruto: number;
  TotalDescuentos: number;
  GananciaNetaEstimada: number;
  TotalVentasHoy: number;
  CantidadTransaccionesHoy: number;
  VentasPorFormaPago: VentasPorFormaPagoDto[];
  TopProductos: TopProductoDto[];
  TopProductosPorMonto: TopProductoDto[];
  TotalProductos: number;
  AlertasStockBajo: number;
  ProductosStockBajo: ProductoStockBajoDto[];
  VentasPorDia: VentaPorDiaDto[];
  VentasRecientes: VentaRecienteDto[];
}
