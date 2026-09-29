using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosBackend.Data;
using PosBackend.DTOs;
using PosBackend.Models;

namespace PosBackend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VentasController : ControllerBase
{
    private readonly AppDbContext _context;

    public VentasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<VentaResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<VentaResponseDto>>> GetVentas(
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] string? buscar = null)
    {
        var query = _context.Ventas
            .AsNoTracking()
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .AsQueryable();

        if (fechaInicio.HasValue)
        {
            var inicioUtc = DateTime.SpecifyKind(fechaInicio.Value.Date, DateTimeKind.Utc);
            query = query.Where(v => v.Fecha >= inicioUtc);
        }

        if (fechaFin.HasValue)
        {
            var finUtc = DateTime.SpecifyKind(fechaFin.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(v => v.Fecha <= finUtc);
        }

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var b = buscar.Trim().ToLower();
            query = query.Where(v =>
                v.Id.ToString() == b ||
                v.FormaPago.ToLower().Contains(b) ||
                (v.Usuario != null && v.Usuario.Nombre.ToLower().Contains(b)) ||
                v.Detalles.Any(d => d.Producto != null && d.Producto.Nombre.ToLower().Contains(b)));
        }

        var ventas = await query
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();

        return Ok(ventas.Select(MapToResponse));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(VentaResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VentaResponseDto>> GetVenta(int id)
    {
        var venta = await _context.Ventas
            .AsNoTracking()
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (venta is null)
        {
            return NotFound(new { message = $"No se encontró la venta con id {id}." });
        }

        return Ok(MapToResponse(venta));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Cajero")]
    [ProducesResponseType(typeof(VentaResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<VentaResponseDto>> CrearVenta([FromBody] CrearVentaDto dto)
    {
        if (dto.Detalles.Count == 0)
        {
            return BadRequest(new { message = "La venta debe incluir al menos un producto." });
        }

        int? usuarioId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
        {
            usuarioId = parsedUserId;
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var venta = new Venta
            {
                Fecha = DateTime.UtcNow,
                FormaPago = dto.FormaPago.Trim(),
                UsuarioId = usuarioId,
                Detalles = []
            };

            decimal totalBruto = 0;

            foreach (var linea in dto.Detalles)
            {
                if (linea.Cantidad <= 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "La cantidad de cada producto debe ser mayor a cero." });
                }

                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.Id == linea.ProductoId);

                if (producto is null || !producto.Activo)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new
                    {
                        message = $"El producto con id {linea.ProductoId} no existe o está inactivo."
                    });
                }

                if (producto.StockActual < linea.Cantidad)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new
                    {
                        message = $"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.StockActual}, solicitado: {linea.Cantidad}."
                    });
                }

                producto.StockActual -= linea.Cantidad;

                var subtotal = producto.PrecioVenta * linea.Cantidad;
                totalBruto += subtotal;

                venta.Detalles.Add(new DetalleVenta
                {
                    ProductoId = producto.Id,
                    Producto = producto,
                    Cantidad = linea.Cantidad,
                    PrecioUnitario = producto.PrecioVenta,
                    Subtotal = subtotal
                });
            }

            var descuento = dto.Descuento;
            if (descuento < 0)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "El descuento no puede ser negativo." });
            }

            if (descuento > totalBruto)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = $"El descuento no puede superar el total de la venta (${totalBruto:N0})." });
            }

            var totalNeto = totalBruto - descuento;

            venta.TotalBruto = totalBruto;
            venta.Descuento = descuento;
            venta.Total = totalNeto;
            venta.MotivoDescuento = string.IsNullOrWhiteSpace(dto.MotivoDescuento) ? null : dto.MotivoDescuento.Trim();

            _context.Ventas.Add(venta);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (usuarioId.HasValue)
            {
                venta.Usuario = await _context.Usuarios.FindAsync(usuarioId.Value);
            }

            var response = MapToResponse(venta);
            return CreatedAtAction(nameof(GetVenta), new { id = venta.Id }, response);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static VentaResponseDto MapToResponse(Venta venta) => new()
    {
        Id = venta.Id,
        Fecha = venta.Fecha,
        TotalBruto = venta.TotalBruto > 0 ? venta.TotalBruto : venta.Total,
        Descuento = venta.Descuento,
        Total = venta.Total,
        MotivoDescuento = venta.MotivoDescuento,
        FormaPago = venta.FormaPago,
        UsuarioId = venta.UsuarioId,
        NombreUsuario = venta.Usuario?.Nombre ?? "Cajero / Admin",
        Detalles = venta.Detalles.Select(d => new DetalleVentaResponseDto
        {
            Id = d.Id,
            ProductoId = d.ProductoId,
            NombreProducto = d.Producto?.Nombre ?? string.Empty,
            Cantidad = d.Cantidad,
            PrecioUnitario = d.PrecioUnitario,
            Subtotal = d.Subtotal
        }).ToList()
    };
}
