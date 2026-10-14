using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosBackend.Data;
using PosBackend.DTOs;
using PosBackend.Models;
using PosBackend.Services;

namespace PosBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtSettings _jwtSettings;
    private readonly IServicioAutenticacion _authService;

    public AuthController(AppDbContext context, JwtSettings jwtSettings, IServicioAutenticacion authService)
    {
        _context = context;
        _jwtSettings = jwtSettings;
        _authService = authService;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == loginDto.Email.ToLower().Trim());

        if (usuario is null || !_authService.VerifyPassword(loginDto.Password, usuario.PasswordHash))
        {
            return Unauthorized(new { message = "Credenciales inválidas." });
        }

        if (!usuario.IsActive)
        {
            return Unauthorized(new { message = "El usuario se encuentra desactivado. Contacta al administrador." });
        }

        return Ok(new AuthResponseDto
        {
            Token = _authService.GenerarToken(usuario, _jwtSettings),
            Usuario = MapToResponse(usuario)
        });
    }

    [HttpPost("verificar-admin")]
    [ProducesResponseType(typeof(AutorizarAdminResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AutorizarAdminResponseDto>> VerificarAdmin([FromBody] AutorizarAdminDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Debe ingresar la contraseña de administrador." });
        }

        // Si se especificó un email de administrador
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var adminEspecifico = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim() && u.Rol == ServicioAutenticacion.RolAdmin && u.IsActive);

            if (adminEspecifico is null || !_authService.VerifyPassword(dto.Password, adminEspecifico.PasswordHash))
            {
                return Unauthorized(new { message = "Contraseña o credenciales de administrador no válidas." });
            }

            return Ok(new AutorizarAdminResponseDto
            {
                Autorizado = true,
                Mensaje = "Autorización concedida con éxito.",
                NombreAdmin = adminEspecifico.Nombre,
                EmailAdmin = adminEspecifico.Email
            });
        }

        // Si no se especificó un email, verificar contra cualquier Administrador activo del sistema
        var admins = await _context.Usuarios
            .Where(u => u.Rol == ServicioAutenticacion.RolAdmin && u.IsActive)
            .ToListAsync();

        if (admins.Count == 0)
        {
            return Unauthorized(new { message = "No hay administradores activos configurados en el sistema." });
        }

        var adminValido = admins.FirstOrDefault(a => _authService.VerifyPassword(dto.Password, a.PasswordHash));
        if (adminValido is null)
        {
            return Unauthorized(new { message = "Contraseña de administrador incorrecta." });
        }

        return Ok(new AutorizarAdminResponseDto
        {
            Autorizado = true,
            Mensaje = "Autorización concedida con éxito.",
            NombreAdmin = adminValido.Nombre,
            EmailAdmin = adminValido.Email
        });
    }

    [Authorize]
    [HttpPost("cambiar-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Sesión inválida o expirada." });
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
        if (usuario is null)
        {
            return NotFound(new { message = "Usuario no encontrado." });
        }

        if (!usuario.IsActive)
        {
            return Unauthorized(new { message = "La cuenta de usuario se encuentra desactivada." });
        }

        if (dto.NuevaPassword != dto.ConfirmarPassword)
        {
            return BadRequest(new { message = "La nueva contraseña y su confirmación no coinciden." });
        }

        if (dto.NuevaPassword.Length < 8)
        {
            return BadRequest(new { message = "La nueva contraseña debe tener al menos 8 caracteres." });
        }

        if (!_authService.VerifyPassword(dto.ActualPassword, usuario.PasswordHash))
        {
            return BadRequest(new { message = "La contraseña actual no es correcta." });
        }

        if (dto.ActualPassword == dto.NuevaPassword)
        {
            return BadRequest(new { message = "La nueva contraseña debe ser diferente a la contraseña actual." });
        }

        usuario.PasswordHash = _authService.HashPassword(dto.NuevaPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contraseña actualizada exitosamente." });
    }

    private UsuarioResponseDto MapToResponse(Usuario usuario) => new()
    {
        Id = usuario.Id,
        Nombre = usuario.Nombre,
        Email = usuario.Email,
        Rol = _authService.ObtenerNombreRol(usuario.Rol),
        IsActive = usuario.IsActive,
        FechaCreacion = usuario.FechaCreacion
    };
}