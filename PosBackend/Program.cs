using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PosBackend.Data;
using PosBackend.Models;
using PosBackend.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configurar puerto de escucha si la variable de entorno PORT está definida (Render.com la inyecta, ej. 10000)
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// ---------------------------------------------------------------------------
// 1. Conexión a Base de Datos (Segura y compatible con Render / Docker / Local)
// ---------------------------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

// Soportar formato URI postgres:// o postgresql:// provisto por plataformas como Render
if (!string.IsNullOrWhiteSpace(connectionString) &&
    (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
     connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var username = userInfo[0];
    var password = userInfo.Length > 1 ? userInfo[1] : string.Empty;
    var dbPort = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');
    connectionString = $"Host={uri.Host};Port={dbPort};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "CRÍTICO: La cadena de conexión a la base de datos no está configurada. " +
        "Configure la variable de entorno 'ConnectionStrings__DefaultConnection' (o 'DATABASE_URL' en Render).");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ---------------------------------------------------------------------------
// 2. Configuración Segura de CORS
// ---------------------------------------------------------------------------
var corsOriginsSetting = builder.Configuration["Cors:AllowedOrigins"]
    ?? Environment.GetEnvironmentVariable("Cors__AllowedOrigins")
    ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");

var configuredOrigins = (corsOriginsSetting ?? string.Empty)
    .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
    .Select(o => o.Trim().TrimEnd('/'))
    .Where(o => !string.IsNullOrEmpty(o))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    Action<CorsPolicyBuilder> configurePolicy = policy =>
    {
        if (configuredOrigins.Length > 0)
        {
            // En producción (o desarrollo con variable): permitir estrictamente los orígenes configurados
            policy.WithOrigins(configuredOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else if (builder.Environment.IsDevelopment())
        {
            // En desarrollo sin orígenes explícitos: permitir localhost en puertos estándar
            policy.WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:4173",
                    "http://localhost:8080",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:4173",
                    "http://127.0.0.1:8080"
                )
                .SetIsOriginAllowed(origin =>
                {
                    if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return uri.Host is "localhost" or "127.0.0.1";
                    }
                    return false;
                })
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
        else
        {
            // En producción sin orígenes configurados: fallar de forma segura (default-deny / bloqueo de CORS)
        }
    };

    options.AddDefaultPolicy(configurePolicy);
    options.AddPolicy("PosCorsPolicy", configurePolicy);
    options.AddPolicy("AllowAll", configurePolicy); // Alias retrocompatible
});

// ---------------------------------------------------------------------------
// 3. Configuración Segura de JWT (Validación estricta de SecretKey)
// ---------------------------------------------------------------------------
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection("JwtSettings").Bind(jwtSettings);

var jwtSecretKey = builder.Configuration["JwtSettings:SecretKey"]
    ?? Environment.GetEnvironmentVariable("JwtSettings__SecretKey")
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

if (string.IsNullOrWhiteSpace(jwtSecretKey))
{
    throw new InvalidOperationException(
        "CRÍTICO: La clave secreta JWT ('JwtSettings:SecretKey') no está configurada. " +
        "Configure la variable de entorno 'JwtSettings__SecretKey' en el hosting con un mínimo de 32 caracteres.");
}

if (jwtSecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "CRÍTICO: La clave secreta JWT ('JwtSettings:SecretKey') debe tener al menos 32 caracteres (256 bits) para garantizar seguridad HMAC-SHA256.");
}

jwtSettings.SecretKey = jwtSecretKey;
if (string.IsNullOrWhiteSpace(jwtSettings.Issuer)) jwtSettings.Issuer = "PosBackend";
if (string.IsNullOrWhiteSpace(jwtSettings.Audience)) jwtSettings.Audience = "PosClient";
if (jwtSettings.ExpiryMinutes <= 0) jwtSettings.ExpiryMinutes = 1440;

builder.Services.AddSingleton(jwtSettings);
builder.Services.Configure<JwtSettings>(options =>
{
    options.SecretKey = jwtSettings.SecretKey;
    options.Issuer = jwtSettings.Issuer;
    options.Audience = jwtSettings.Audience;
    options.ExpiryMinutes = jwtSettings.ExpiryMinutes;
});

// Register authentication service
builder.Services.AddScoped<IServicioAutenticacion, ServicioAutenticacion>();

// Los DTOs se exponen en PascalCase para respetar el contrato consumido por el frontend React.
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = null);

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };
});

// Authorization policies based on role
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireUserOrAdmin", policy => policy.RequireRole("User", "Admin"));
});

var app = builder.Build();

// Diagnóstico de seguridad en consola al iniciar
if (configuredOrigins.Length > 0)
{
    Console.WriteLine($"[SEGURIDAD - CORS] Orígenes permitidos activos: {string.Join(", ", configuredOrigins)}");
}
else if (app.Environment.IsDevelopment())
{
    Console.WriteLine("[SEGURIDAD - CORS] Modo Desarrollo: CORS habilitado para localhost / 127.0.0.1.");
}
else
{
    Console.WriteLine("[SEGURIDAD - CORS] Modo Producción: No se definieron orígenes en 'Cors:AllowedOrigins'. Peticiones CORS bloqueadas de forma segura.");
}

// Aplicar migraciones pendientes y sembrar usuarios por defecto al iniciar la aplicación
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var authService = scope.ServiceProvider.GetRequiredService<IServicioAutenticacion>();
    DbInitializer.SeedAsync(db, authService).GetAwaiter().GetResult();
}

// Configure the HTTP request pipeline.
// CORS debe ejecutarse antes de Authentication y Authorization
app.UseCors();

// Quitar o condicionar app.UseHttpsRedirection() para que no rompa en Render free ni detrás de proxies inversos
if (app.Environment.IsDevelopment() && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT")))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();