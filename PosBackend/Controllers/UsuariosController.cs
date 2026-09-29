using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosBackend.Data;
using PosBackend.DTOs;
using PosBackend.Models;
using PosBackend.Services;

namespace PosBackend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IServicioAutenticacion _authService;

    public UsuariosController(AppDbContext context, IServicioAutenticacion authService)
    {
        _context = context;
        _authService = authService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UsuarioResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UsuarioResponseDto>>> GetUsuarios([FromQuery] string? buscar = null)
    {
        var query = _context.Usuarios.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var b = buscar.Trim().ToLower();
            query = query.Where(u =>
                u.Nombre.ToLower().Contains(b) ||
                u.Email.ToLower().Contains(b));
        }

        var usuarios = await query
            .OrderBy(u => u.Id)
            .ToListAsync();

        return Ok(usuarios.Select(MapToResponse));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UsuarioResponseDto>> GetUsuario(int id)
    {
        var usuario = await _context.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null)
        {
            return NotFound(new { message = $"No se encontró el usuario con id {id}." });
        }

        return Ok(MapToResponse(usuario));
    }

    [HttpPost]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UsuarioResponseDto>> CrearUsuario([FromBody] UsuarioCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!_authService.EsRolValido(dto.Rol))
        {
            return BadRequest(new { message = "Rol inválido. Use 1 (Admin) o 2 (Cajero)." });
        }

        var existeEmail = await _context.Usuarios
            .AnyAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());

        if (existeEmail)
        {
            return BadRequest(new { message = $"El correo '{dto.Email}' ya está registrado por otro usuario." });
        }

        var usuario = new Usuario
        {
            Nombre = dto.Nombre.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = _authService.HashPassword(dto.Password),
            Rol = dto.Rol,
            IsActive = true,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var response = MapToResponse(usuario);
        return CreatedAtAction(nameof(GetUsuario), new { id = usuario.Id }, response);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UsuarioResponseDto>> ActualizarUsuario(int id, [FromBody] UsuarioUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!_authService.EsRolValido(dto.Rol))
        {
            return BadRequest(new { message = "Rol inválido. Use 1 (Admin) o 2 (Cajero)." });
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null)
        {
            return NotFound(new { message = $"No se encontró el usuario con id {id}." });
        }

        var existeOtroEmail = await _context.Usuarios
            .AnyAsync(u => u.Id != id && u.Email.ToLower() == dto.Email.Trim().ToLower());

        if (existeOtroEmail)
        {
            return BadRequest(new { message = $"El correo '{dto.Email}' ya está en uso por otro usuario." });
        }

        usuario.Nombre = dto.Nombre.Trim();
        usuario.Email = dto.Email.Trim().ToLower();
        usuario.Rol = dto.Rol;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            usuario.PasswordHash = _authService.HashPassword(dto.Password);
        }

        if (dto.IsActive.HasValue)
        {
            usuario.IsActive = dto.IsActive.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(usuario));
    }

    [HttpPut("{id:int}/estado")]
    [ProducesResponseType(typeof(UsuarioResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UsuarioResponseDto>> CambiarEstado(int id, [FromBody] CambiarEstadoUsuarioDto? dto = null)
    {
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (usuario is null)
        {
            return NotFound(new { message = $"No se encontró el usuario con id {id}." });
        }

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == id.ToString())
        {
            return BadRequest(new { message = "No puedes desactivar tu propia cuenta mientras tengas la sesión activa." });
        }

        if (dto != null)
        {
            usuario.IsActive = dto.IsActive;
        }
        else
        {
            usuario.IsActive = !usuario.IsActive;
        }

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(usuario));
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

