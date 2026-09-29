using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosBackend.Data;
using PosBackend.DTOs;
using PosBackend.Models;

namespace PosBackend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class ProveedoresController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProveedoresController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProveedorResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProveedorResponseDto>>> GetProveedores(
        [FromQuery] bool? soloActivos = null,
        [FromQuery] string? buscar = null)
    {
        var query = _context.Proveedores.AsNoTracking().AsQueryable();

        if (soloActivos.HasValue && soloActivos.Value)
        {
            query = query.Where(p => p.Activo);
        }

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var b = buscar.Trim().ToLower();
            query = query.Where(p =>
                p.Nombre.ToLower().Contains(b) ||
                p.RutIdentificacion.ToLower().Contains(b) ||
                p.Email.ToLower().Contains(b) ||
                p.Telefono.ToLower().Contains(b));
        }

        var proveedores = await query
            .OrderBy(p => p.Nombre)
            .ToListAsync();

        return Ok(proveedores.Select(MapToResponse));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProveedorResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProveedorResponseDto>> GetProveedor(int id)
    {
        var proveedor = await _context.Proveedores
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proveedor is null)
        {
            return NotFound(new { message = $"No se encontró el proveedor con id {id}." });
        }

        return Ok(MapToResponse(proveedor));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProveedorResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProveedorResponseDto>> CrearProveedor([FromBody] CrearProveedorDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existeNombre = await _context.Proveedores
            .AnyAsync(p => p.Nombre.ToLower() == dto.Nombre.Trim().ToLower());

        if (existeNombre)
        {
            return BadRequest(new { message = $"Ya existe un proveedor registrado con el nombre '{dto.Nombre}'." });
        }

        var proveedor = new Proveedor
        {
            Nombre = dto.Nombre.Trim(),
            Telefono = dto.Telefono?.Trim() ?? string.Empty,
            Email = dto.Email?.Trim() ?? string.Empty,
            Direccion = dto.Direccion?.Trim() ?? string.Empty,
            RutIdentificacion = dto.RutIdentificacion?.Trim() ?? string.Empty,
            Activo = true,
            FechaRegistro = DateTime.UtcNow
        };

        _context.Proveedores.Add(proveedor);
        await _context.SaveChangesAsync();

        var response = MapToResponse(proveedor);
        return CreatedAtAction(nameof(GetProveedor), new { id = proveedor.Id }, response);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ProveedorResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProveedorResponseDto>> ActualizarProveedor(int id, [FromBody] ActualizarProveedorDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var proveedor = await _context.Proveedores.FirstOrDefaultAsync(p => p.Id == id);
        if (proveedor is null)
        {
            return NotFound(new { message = $"No se encontró el proveedor con id {id}." });
        }

        var existeOtro = await _context.Proveedores
            .AnyAsync(p => p.Id != id && p.Nombre.ToLower() == dto.Nombre.Trim().ToLower());

        if (existeOtro)
        {
            return BadRequest(new { message = $"Ya existe otro proveedor con el nombre '{dto.Nombre}'." });
        }

        proveedor.Nombre = dto.Nombre.Trim();
        proveedor.Telefono = dto.Telefono?.Trim() ?? string.Empty;
        proveedor.Email = dto.Email?.Trim() ?? string.Empty;
        proveedor.Direccion = dto.Direccion?.Trim() ?? string.Empty;
        proveedor.RutIdentificacion = dto.RutIdentificacion?.Trim() ?? string.Empty;
        proveedor.Activo = dto.Activo;

        await _context.SaveChangesAsync();

        return Ok(MapToResponse(proveedor));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarProveedor(int id)
    {
        var proveedor = await _context.Proveedores.FirstOrDefaultAsync(p => p.Id == id);
        if (proveedor is null)
        {
            return NotFound(new { message = $"No se encontró el proveedor con id {id}." });
        }

        // Si hay productos asociados a este proveedor, realizamos un soft-delete (desactivación)
        var tieneProductos = await _context.Productos.AnyAsync(p => p.ProveedorId == id);
        if (tieneProductos)
        {
            proveedor.Activo = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"El proveedor '{proveedor.Nombre}' fue desactivado porque tiene productos asociados." });
        }

        _context.Proveedores.Remove(proveedor);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"El proveedor '{proveedor.Nombre}' fue eliminado exitosamente." });
    }

    private static ProveedorResponseDto MapToResponse(Proveedor p) => new()
    {
        Id = p.Id,
        Nombre = p.Nombre,
        Telefono = p.Telefono,
        Email = p.Email,
        Direccion = p.Direccion,
        RutIdentificacion = p.RutIdentificacion,
        Activo = p.Activo,
        FechaRegistro = p.FechaRegistro
    };
}

