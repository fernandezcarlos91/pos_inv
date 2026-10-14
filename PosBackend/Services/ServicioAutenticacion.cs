using BCrypt.Net;
using PosBackend.DTOs;
using PosBackend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PosBackend.Services;

public class ServicioAutenticacion : IServicioAutenticacion
{
    public const int RolAdmin = 1;
    public const int RolCajero = 2;

    public const string NombreRolAdmin = "Admin";
    public const string NombreRolCajero = "Cajero";

    public string GenerarToken(Usuario usuario, JwtSettings jwtSettings)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nombre),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, ObtenerNombreRol(usuario.Rol))
        };

        if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey))
        {
            throw new InvalidOperationException("La clave secreta JWT no está configurada.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings.Issuer,
            audience: jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(jwtSettings.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
    }

    public string ObtenerNombreRol(int rol) => rol switch
    {
        RolAdmin => NombreRolAdmin,
        RolCajero => NombreRolCajero,
        // Fallback de mínimo privilegio para códigos de rol desconocidos o legados.
        _ => NombreRolCajero
    };

    public bool EsRolValido(int rol) => rol is RolAdmin or RolCajero;
}