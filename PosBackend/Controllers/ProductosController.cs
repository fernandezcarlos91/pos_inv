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
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Cajero")]
    [ProducesResponseType(typeof(IEnumerable<ProductoResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProductoResponseDto>>> GetProductos()
    {
        var esAdmin = User.IsInRole("Admin");

        var productos = await _context.Productos
            .AsNoTracking()
            .Where(p => p.Activo)
            .OrderBy(p => p.Nombre)
            .ToListAsync();

        return Ok(productos.Select(p => MapToResponse(p, esAdmin)));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ProductoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductoResponseDto>> GetProducto(int id)
    {
        var producto = await _context.Productos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (producto is null)
        {
            return NotFound(new { message = $"No se encontró el producto con id {id}." });
        }

        return Ok(MapToResponse(producto, true));
    }

    [HttpGet("buscar/{codigoBarras}")]
    [Authorize(Roles = "Admin,Cajero")]
    [ProducesResponseType(typeof(ProductoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductoResponseDto>> GetProductoPorCodigoBarras(string codigoBarras)
    {
        var esAdmin = User.IsInRole("Admin");

        var producto = await _context.Productos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.CodigoBarras == codigoBarras && p.Activo);

        if (producto is null)
        {
            return NotFound(new { message = $"No se encontró un producto activo con código de barras {codigoBarras}." });
        }

        return Ok(MapToResponse(producto, esAdmin));
    }

    [HttpGet("generar-codigo")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GenerarCodigo()
    {
        var codigo = await GenerarCodigoBarrasUnicoAsync();
        return Ok(new { codigoBarras = codigo });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ProductoResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductoResponseDto>> CrearProducto([FromBody] CrearProductoDto dto)
    {
        var errorPrecio = ValidarPrecios(dto.PrecioCosto, dto.PrecioVenta);
        if (errorPrecio is not null)
        {
            return BadRequest(new { message = errorPrecio });
        }

        string codigoBarras;
        if (string.IsNullOrWhiteSpace(dto.CodigoBarras))
        {
            codigoBarras = await GenerarCodigoBarrasUnicoAsync();
        }
        else
        {
            codigoBarras = dto.CodigoBarras.Trim();
            var codigoExiste = await _context.Productos
                .AnyAsync(p => p.CodigoBarras == codigoBarras);

            if (codigoExiste)
            {
                return BadRequest(new { message = $"Ya existe un producto con el código de barras {codigoBarras}." });
            }
        }

        var producto = new Producto
        {
            CodigoBarras = codigoBarras,
            Nombre = dto.Nombre.Trim(),
            PrecioCosto = dto.PrecioCosto,
            PrecioVenta = dto.PrecioVenta,
            StockActual = dto.StockActual,
            StockMinimo = dto.StockMinimo,
            ProveedorId = dto.ProveedorId ?? 0,
            Activo = true
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        var response = MapToResponse(producto);
        return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, response);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ProductoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductoResponseDto>> ActualizarProducto(int id, [FromBody] ActualizarProductoDto dto)
    {
        var errorPrecio = ValidarPrecios(dto.PrecioCosto, dto.PrecioVenta);
        if (errorPrecio is not null)
        {
            return BadRequest(new { message = errorPrecio });
        }

        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
        if (producto is null)
        {
            return NotFound(new { message = $"No se encontró el producto con id {id}." });
        }

        if (!string.IsNullOrWhiteSpace(dto.CodigoBarras))
        {
            var nuevoCodigo = dto.CodigoBarras.Trim();
            if (nuevoCodigo != producto.CodigoBarras)
            {
                var codigoExiste = await _context.Productos
                    .AnyAsync(p => p.CodigoBarras == nuevoCodigo && p.Id != id);

                if (codigoExiste)
                {
                    return BadRequest(new { message = $"Ya existe otro producto con el código de barras {nuevoCodigo}." });
                }

                producto.CodigoBarras = nuevoCodigo;
            }
        }
        else if (string.IsNullOrWhiteSpace(producto.CodigoBarras))
        {
            producto.CodigoBarras = await GenerarCodigoBarrasUnicoAsync();
        }

        producto.Nombre = dto.Nombre.Trim();
        producto.PrecioCosto = dto.PrecioCosto;
        producto.PrecioVenta = dto.PrecioVenta;
        producto.StockActual = dto.StockActual;
        producto.StockMinimo = dto.StockMinimo;
        producto.ProveedorId = dto.ProveedorId ?? 0;
        producto.Activo = dto.Activo;

        await _context.SaveChangesAsync();
        return Ok(MapToResponse(producto));
    }

    private async Task<string> GenerarCodigoBarrasUnicoAsync()
    {
        var maxId = await _context.Productos.MaxAsync(p => (int?)p.Id) ?? 0;
        var totalProductos = await _context.Productos.CountAsync();
        long secuencial = Math.Max(totalProductos + 1, maxId + 1);

        string codigoGenerado;
        do
        {
            codigoGenerado = $"200{secuencial:D10}";
            secuencial++;
        } while (await _context.Productos.AnyAsync(p => p.CodigoBarras == codigoGenerado));

        return codigoGenerado;
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarProducto(int id)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
        if (producto is null)
        {
            return NotFound(new { message = $"No se encontró el producto con id {id}." });
        }

        producto.Activo = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"El producto {id} se desactivó correctamente." });
    }

    [HttpPost("{id:int}/ingresar-stock")]
    [Authorize(Roles = "Admin,Cajero")]
    [ProducesResponseType(typeof(ProductoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductoResponseDto>> IngresarStock(int id, [FromBody] IngresarStockDto dto)
    {
        if (dto.Cantidad <= 0)
        {
            return BadRequest(new { message = "La cantidad a ingresar debe ser mayor a cero." });
        }

        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
        if (producto is null)
        {
            return NotFound(new { message = $"No se encontró el producto con id {id}." });
        }

        if (!producto.Activo)
        {
            return BadRequest(new { message = $"El producto '{producto.Nombre}' se encuentra inactivo." });
        }

        producto.StockActual += dto.Cantidad;
        await _context.SaveChangesAsync();

        var esAdmin = User.IsInRole("Admin");
        return Ok(MapToResponse(producto, esAdmin));
    }


    private static string? ValidarPrecios(decimal precioCosto, decimal precioVenta)
    {
        if (precioVenta < precioCosto)
        {
            return "El precio de venta debe ser mayor o igual al precio de costo.";
        }

        return null;
    }

    private static ProductoResponseDto MapToResponse(Producto producto, bool includePrecioCosto = true) => new()
    {
        Id = producto.Id,
        CodigoBarras = producto.CodigoBarras,
        Nombre = producto.Nombre,
        PrecioCosto = includePrecioCosto ? producto.PrecioCosto : null,
        PrecioVenta = producto.PrecioVenta,
        StockActual = producto.StockActual,
        StockMinimo = producto.StockMinimo,
        ProveedorId = producto.ProveedorId == 0 ? null : producto.ProveedorId,
        Activo = producto.Activo
    };
}
