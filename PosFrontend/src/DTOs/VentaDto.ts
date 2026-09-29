export interface CrearDetalleVentaDto {
  ProductoId: number;
  Cantidad: number;
}

export interface CrearVentaDto {
  FormaPago: string;
  Descuento?: number;
  MotivoDescuento?: string;
  Detalles: CrearDetalleVentaDto[];
}

export interface DetalleVentaResponseDto {
  Id: number;
  ProductoId: number;
  NombreProducto: string;
  Cantidad: number;
  PrecioUnitario: number;
  Subtotal: number;
}

export interface VentaResponseDto {
  Id: number;
  Fecha: string;
  TotalBruto?: number;
  Descuento?: number;
  Total: number;
  MotivoDescuento?: string | null;
  FormaPago: string;
  UsuarioId?: number | null;
  NombreUsuario?: string;
  Detalles: DetalleVentaResponseDto[];
}