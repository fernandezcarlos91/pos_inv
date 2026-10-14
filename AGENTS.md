# POS - Punto de Venta e Inventario

## Descripción general
Proyecto de backend para un sistema de Punto de Venta e Inventario desarrollado con .NET 10.0, Entity Framework Core y PostgreSQL 16 en macOS.

## Tecnologías detectadas
- **Runtime**: .NET 10.0
- **ORM**: Entity Framework Core
- **Base de datos**: PostgreSQL 16 (proveedor Npgsql)
- **API**: ASP.NET Core Web API
- **Autenticación**: JWT con BCrypt para hashing de contraseñas
- **Migraciones**: EF Core Migrations

## Estructura del repositorio
```
PosBackend/
├── Controllers/          # Controladores API
│   ├── AuthController.cs       # Endpoints de autenticación (login, register)
│   ├── ProductosController.cs  # CRUD completo de productos con roles
│   ├── VentasController.cs     # Ventas con protección de autorización
│   └── WeatherForecastController.cs
├── DTOs/                 # Objetos de transferencia de datos
│   ├── CrearProductoDto.cs
│   ├── ActualizarProductoDto.cs
│   ├── ProductoResponseDto.cs
│   ├── CrearVentaDto.cs
│   ├── DetalleVentaResponseDto.cs
│   └── VentaResponseDto.cs
│   ├── LoginDto.cs           # DTO para login
│   ├── UsuarioCreateDto.cs   # DTO para crear usuario
│   ├── UsuarioResponseDto.cs # DTO de respuesta de usuario
│   └── AuthResponseDto.cs    # DTO de respuesta de autenticación
├── Models/               # Entidades de dominio
│   ├── Venta.cs
│   ├── DetalleVenta.cs
│   ├── Producto.cs
│   └── Usuario.cs            # Entidad Usuario con seguridad
├── Data/
│   ├── AppDbContext.cs       # Contexto de base de datos con DbSet<Usuario>
│   └── Migrations/           # Migraciones EF Core
│       ├── 20260921163702_InitialCreate.cs
│       ├── 20260921170046_AddVentas.cs
│       └── 20260921201719_AddUsuarios.cs
├── PosBackend.csproj       # Proyecto .NET
├── appsettings.Development.json
├── appsettings.json        # Configuración JWT y conexión
└── Services/               # Servicios de dominio
    ├── IServicioAutenticacion.cs
    └── ServicioAutenticacion.cs
```

## Módulo de Ventas (principal)
### Entidades:
- **Venta**: `Id`, `Fecha`, `TotalBruto` (decimal 18,2), `Descuento` (decimal 18,2, default 0), `Total` (decimal 18,2, total neto final), `MotivoDescuento` (string, opcional), `FormaPago`, `Detalles` (lista de DetalleVenta), `UsuarioId`, `Usuario`
- **DetalleVenta**: `Id`, `VentaId`, `ProductoId`, `Cantidad`, `PrecioUnitario`, `Subtotal`, relaciones Nav a Venta y Producto
- **Producto**: `Id`, `CodigoBarras`, `Nombre`, `PrecioCosto`, `PrecioVenta`, `StockActual`, `StockMinimo`, `ProveedorId`, `Activo`
- **Usuario**: `Id`, `Nombre`, `Email`, `PasswordHash`, `Rol`, `IsActive`, `FechaCreacion`

### Controlador principal:
- **VentasController**: Endpoints GET (listar con filtros, por ID) y POST (CrearVenta con soporte para `Descuento` y `MotivoDescuento`)
- **AuthController**: Endpoints POST `/login` y `/verificar-admin` (autorización liviana de administrador mediante clave)

### Flujo de CrearVenta:
1. Validar que la venta tenga al menos un detalle
2. Iniciar transacción
3. Por cada producto en el dto:
   - Verificar que existe y está activo
   - Verificar stock suficiente
   - Descontar stock: `producto.StockActual -= linea.Cantidad`
   - Calcular subtotal con `producto.PrecioVenta * linea.Cantidad`
   - Agregar detalle a la venta
4. Calcular `TotalBruto` sumando todos los subtotales
5. Validar que `Descuento >= 0` y `Descuento <= TotalBruto` (el total nunca queda en negativo)
6. Calcular `Total` final = `TotalBruto - Descuento`
7. Guardar cambios en transacción

### Protección de Endpoints en VentasController:
- **Nivel de clase**: `[Authorize]` - requiere autenticación para todos los endpoints
- **Método CrearVenta**: `[Authorize(Roles = "Admin,Cajero")]` - accesible para Admin y Cajero
- **GET Ventas**: Accesible para rol Admin
- **GET Venta**: Accesible para roles Admin y Cajero

## Módulo de Autenticación
### Endpoints del `AuthController`:
- **POST /api/auth/register**: Registra un nuevo usuario
  - Valida que el email no esté ya registrado
  - Hashela la contraseña usando BCrypt.Net
  - Guarda el usuario en la base de datos
  - Retorna `AuthResponseDto` con token JWT

- **POST /api/auth/login**: Inicia sesión
  - Verifica email y contraseña contra la base de datos
  - Si son correctas y el usuario está activo, genera token JWT
  - Retorna `AuthResponseDto` con token y datos del usuario

- **POST /api/auth/cambiar-password** (`[Authorize]`): Cambiar propia contraseña
  - Requiere autenticación JWT (Admin y Cajero)
  - Recibe `ActualPassword`, `NuevaPassword` (mínimo 8 caracteres) y `ConfirmarPassword`
  - Valida que la actual sea correcta, que las nuevas coincidan y sean distintas a la actual
  - Encripta con BCrypt y guarda cambios sin retornar hashes

- **POST /api/usuarios/{id}/restablecer-password** (`[Authorize(Roles = "Admin")]`): Restablecer contraseña
  - Solo accesible por el rol Admin
  - Recibe `NuevaPassword` (mínimo 8 caracteres) y `ConfirmarPassword`
  - Encripta con BCrypt y actualiza la clave del usuario destino de forma inmediata

### Configuración de Seguridad y JWT (Variables de entorno / appsettings.json):
- `JwtSettings:SecretKey`: Inyectada en producción vía variable de entorno `JwtSettings__SecretKey` (mínimo 32 caracteres).
- `JwtSettings:Issuer`: `PosBackend`
- `JwtSettings:Audience`: `PosClient`
- `JwtSettings:ExpiryMinutes`: 1440
- `Cors:AllowedOrigins`: Inyectada en producción vía variable de entorno `Cors__AllowedOrigins` (orígenes separados por coma). En Development permite localhost por defecto. En Production rechaza peticiones CORS de forma segura si no hay orígenes configurados.

### Hashing de contraseñas:
- Utiliza `BCrypt.Net-Next` para hashing y verificación
- `ServicioAutenticacion.HashPassword()`: Genera hash BCrypt
- `ServicioAutenticacion.VerifyPassword()`: Verifica password contra hash

## Módulo de Productos (`ProductosController`)
### Endpoints y Protección:
- **Controlador nivel clase**: `[Authorize]`
- **GET /api/productos**: Listar productos - accesible para **Cajero** y **Admin** (para Cajero, omite `PrecioCosto`)
- **GET /api/productos/{id}** (`[Authorize(Roles = "Admin")]`): Obtener producto por ID - **solo Admin**
- **GET /api/productos/buscar/{codigoBarras}**: Buscar por código de barras - accesible para **Cajero** y **Admin** (para Cajero, omite `PrecioCosto`)
- **POST /api/productos** (`[Authorize(Roles = "Admin")]`): Crear producto - **solo Admin**
- **PUT /api/productos/{id}** (`[Authorize(Roles = "Admin")]`): Actualizar producto - **solo Admin**
- **DELETE /api/productos/{id}** (`[Authorize(Roles = "Admin")]`): Desactivar producto - **solo Admin**
- **POST /api/productos/{id}/ingresar-stock** (`[Authorize(Roles = "Admin,Cajero")]`): Recepción de mercadería / Aumento de stock - **Admin y Cajero** (no expone precio de costo)

### DTOs de Producto:
- **CrearProductoDto**: `CodigoBarras`, `Nombre`, `PrecioCosto`, `PrecioVenta`, `StockActual`, `StockMinimo`, `ProveedorId`
- **ActualizarProductoDto**: Campos opcionales para actualización
- **IngresarStockDto**: `Cantidad` (> 0), `Observacion` (opcional)
- **ProductoResponseDto**: Devolución completa de datos del producto (omite `PrecioCosto` para rol Cajero)

### Flujo de validación de precios y stock:
- El método `ValidarPrecios()` asegura que `PrecioVenta >= PrecioCosto`
- Si no, retorna error `BadRequest` con mensaje descriptivo
- `IngresarStock` valida que cantidad sea mayor a cero, que el producto exista y esté activo, e incrementa únicamente `StockActual`

## Estado de la base de datos
- Migraciones aplicadas: `InitialCreate`, `AddVentas`, `AddUsuarios`, `AddProveedoresYVentaUsuario`, `AddDescuentoAVentas`
- Estado: Base de datos actualizada y sincronizada en PostgreSQL
- Tablas: `productos`, `ventas` (con `TotalBruto`, `Descuento`, `MotivoDescuento`), `detalle_ventas`, `Usuarios`, `proveedores`

## Estado Actual del Proyecto ✅
- **Backend (.NET 10 Web API)**:
  - Compilando exitosamente (`dotnet build` = 0 errors)
  - Autenticación JWT + BCrypt implementada y funcional (sin registro público externo)
  - Endpoint de validación de clave Admin (`POST /api/auth/verificar-admin`)
  - Controladores Protegidos: `AuthController`, `ProductosController`, `VentasController`, `ProveedoresController`, `DashboardController`, `UsuariosController`
  - Control de roles estricto: Admin y Cajero
  - Registro de ventas con soporte para descuentos manuales validados (`TotalBruto`, `Descuento`, `Total`, `MotivoDescuento`) y asociación al usuario atendido (`UsuarioId`)
- **Frontend (React 19 + TypeScript + Vite + Tailwind CSS)**:
  - Estilizado profesionalmente con Tailwind CSS e iconos Lucide
  - Vistas implementadas:
    - **Dashboard Profesional y Reportes Financieros (Admin)**: Filtros por rango de fechas (Hoy, Últimos 7 días, Mes actual, Personalizado con calendario), tarjeta destacada de Ganancia Neta Estimada calculada en tiempo real según costos y precios, desglose completo de recaudación por medio de pago (Efectivo vs Tarjeta vs Transferencia con barras de porcentaje), tabla interactiva de Top 10 productos más vendidos (conmutador por unidades y por recaudación monetaria), gráfico interactivo cronológico de ingresos, alertas activas de stock crítico y transacciones recientes
    - **Historial de Ventas (Admin)**: Filtros por rango de fechas y buscador en tiempo real, tabla con método de pago, cajero, total y modal detallado de ítems vendidos con desglose de descuentos
    - **Gestión de Proveedores (Admin)**: CRUD completo con modal interactivo, búsqueda y soft-delete
    - **Gestión de Usuarios (Admin)**: Vista `/usuarios` para crear usuarios (Admin/Cajero), editar datos, restablecer contraseñas y activar/desactivar cuentas
    - **Catálogo de Productos (Admin)**: Inventario, precios, stock actual y mínimo, alertas y vinculación con proveedores
    - **Punto de Venta / Ventas (Admin / Cajero)**: Carrito dinámico, recepción de stock de mercadería, modal de descuento con autorización de Administrador (porcentaje o monto fijo), validación estricta de credenciales, y registro inmediato
    - **Ticket Térmico (80mm)**: Refleja con precisión Subtotal bruto, Descuento aplicado (con motivo y monto) y Total a pagar, tanto en vista previa como en impresión nativa
    - **Iniciar Sesión**: Autenticación segura, botones de acceso rápido con credenciales demo y redirección automática según rol (sin registro público)
  - Seeder de Inicialización (`DbInitializer`): Creación y actualización automática en startup de `cajero@pos.com` (`Cajero123!`) y `admin@pos.com` (`Admin123!`)
  - Control de acceso por rol: El rol **Cajero** ve exclusivamente la vista de Ventas y el perfil en el Navbar, con redirección y bloqueo automático de rutas administrativas y endpoints de reportes / costos
  - Build de producción y despliegue exitoso en Docker Compose (`pos-frontend`, `pos-backend`, `pos-postgres`)
  - Configuración lista para GitHub y Producción:
    - `.gitignore` robusto para .NET, React, Docker y macOS
    - `.env.example` con plantilla limpia de secretos
    - `docker-compose.prod.yml` con aislamiento total de PostgreSQL (puerto 5432 privado) y backend protegido tras Nginx
    - `README.md` detallado con guía paso a paso de despliegue y credenciales demo