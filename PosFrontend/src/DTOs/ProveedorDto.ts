export interface ProveedorResponseDto {
  Id: number;
  Nombre: string;
  Telefono: string;
  Email: string;
  Direccion: string;
  RutIdentificacion: string;
  Activo: boolean;
  FechaRegistro: string;
}

export interface CrearProveedorDto {
  Nombre: string;
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  RutIdentificacion?: string;
}

export interface ActualizarProveedorDto {
  Nombre: string;
  Telefono?: string;
  Email?: string;
  Direccion?: string;
  RutIdentificacion?: string;
  Activo: boolean;
}

