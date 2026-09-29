export interface UsuarioResponseDto {
  Id: number;
  Nombre: string;
  Email: string;
  Rol: string;
  IsActive: boolean;
  FechaCreacion: string;
}

export interface CrearUsuarioDto {
  Nombre: string;
  Email: string;
  Password: string;
  Rol: number; // 1 = Admin, 2 = Cajero
}

export interface ActualizarUsuarioDto {
  Nombre: string;
  Email: string;
  Rol: number; // 1 = Admin, 2 = Cajero
  Password?: string;
  IsActive?: boolean;
}

