using Microsoft.EntityFrameworkCore;
using PosBackend.Models;
using PosBackend.Services;

namespace PosBackend.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context, IServicioAutenticacion authService)
    {
        // 1. Asegurar / actualizar usuario Cajero por defecto
        var cajero = await context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == "cajero@pos.com");
        if (cajero == null)
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Cajero Principal",
                Email = "cajero@pos.com",
                PasswordHash = authService.HashPassword("Cajero123!"),
                Rol = ServicioAutenticacion.RolCajero,
                IsActive = true,
                FechaCreacion = DateTime.UtcNow
            });
        }
        else
        {
            cajero.PasswordHash = authService.HashPassword("Cajero123!");
            cajero.Rol = ServicioAutenticacion.RolCajero;
            cajero.IsActive = true;
        }

        // 2. Asegurar / actualizar usuario Administrador por defecto
        var admin = await context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == "admin@pos.com");
        if (admin == null)
        {
            context.Usuarios.Add(new Usuario
            {
                Nombre = "Administrador Principal",
                Email = "admin@pos.com",
                PasswordHash = authService.HashPassword("Admin123!"),
                Rol = ServicioAutenticacion.RolAdmin,
                IsActive = true,
                FechaCreacion = DateTime.UtcNow
            });
        }
        else
        {
            admin.PasswordHash = authService.HashPassword("Admin123!");
            admin.Rol = ServicioAutenticacion.RolAdmin;
            admin.IsActive = true;
        }

        await context.SaveChangesAsync();
    }
}

