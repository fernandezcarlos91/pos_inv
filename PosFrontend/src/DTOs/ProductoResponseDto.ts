export interface ProductoResponseDto {
  Id: number;
  CodigoBarras: string;
  Nombre: string;
  PrecioCosto?: number;
  PrecioVenta: number;
  StockActual: number;
  StockMinimo: number;
  ProveedorId: number | null;
  Activo: boolean;
}

export interface CrearProductoDto {
  CodigoBarras?: string;
  Nombre: string;
  PrecioCosto: number;
  PrecioVenta: number;
  StockActual: number;
  StockMinimo: number;
  ProveedorId: number | null;
}

export interface ActualizarProductoDto {
  CodigoBarras?: string;
  Nombre: string;
  PrecioCosto: number;
  PrecioVenta: number;
  StockActual: number;
  StockMinimo: number;
  ProveedorId: number | null;
  Activo: boolean;
}

export interface IngresarStockDto {
  Cantidad: number;
  Observacion?: string;
}