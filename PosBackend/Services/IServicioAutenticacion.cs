using PosBackend.Models;

namespace PosBackend.Services;

public interface IServicioAutenticacion
{
    string GenerarToken(Usuario usuario, JwtSettings jwtSettings);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);

    /// <summary>Traduce el código numérico de rol al nombre usado por RBAC ("Admin" / "Cajero").</summary>
    string ObtenerNombreRol(int rol);

    /// <summary>Indica si el código de rol corresponde a un rol soportado por el sistema.</summary>
    bool EsRolValido(int rol);
}