using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosBackend.Data;
using PosBackend.DTOs;

namespace PosBackend.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("resumen")]
    [HttpGet("reporte")]
    [HttpGet("reportes")]
    public async Task<ActionResult<DashboardResumenDto>> GetResumen(
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null,
        [FromQuery] DateTime? desde = null,
        [FromQuery] DateTime? hasta = null)
    {
        // 1. Normalización de fechas de filtro (soporta fechaInicio/fechaFin y desde/hasta)
        var inicioParam = fechaInicio ?? desde;
        var finParam = fechaFin ?? hasta;

        var hoyUtc = DateTime.UtcNow.Date;
        DateTime inicioUtc;
        DateTime finUtcExclusivo;

        if (inicioParam.HasValue && finParam.HasValue)
        {
            var iUtc = DateTime.SpecifyKind(inicioParam.Value.Date, DateTimeKind.Utc);
            var fUtc = DateTime.SpecifyKind(finParam.Value.Date, DateTimeKind.Utc);

            if (iUtc <= fUtc)
            {
                inicioUtc = iUtc;
                finUtcExclusivo = fUtc.AddDays(1);
            }
            else
            {
                inicioUtc = fUtc;
                finUtcExclusivo = iUtc.AddDays(1);
            }
        }
        else if (inicioParam.HasValue)
        {
            inicioUtc = DateTime.SpecifyKind(inicioParam.Value.Date, DateTimeKind.Utc);
            finUtcExclusivo = inicioUtc.AddDays(1);
        }
        else if (finParam.HasValue)
        {
            var fUtc = DateTime.SpecifyKind(finParam.Value.Date, DateTimeKind.Utc);
            inicioUtc = fUtc;
            finUtcExclusivo = fUtc.AddDays(1);
        }
        else
        {
            // Por defecto, período de hoy
            inicioUtc = hoyUtc;
            finUtcExclusivo = hoyUtc.AddDays(1);
        }

        // 2. Ventas del día de hoy (para referencia rápida y compatibilidad)
        var mananaUtc = hoyUtc.AddDays(1);
        var ventasHoy = await _context.Ventas
            .AsNoTracking()
            .Where(v => v.Fecha >= hoyUtc && v.Fecha < mananaUtc)
            .ToListAsync();

        var totalVentasHoy = ventasHoy.Sum(v => v.Total);
        var transaccionesHoy = ventasHoy.Count;

        // 3. Ventas del período filtrado (con detalles y productos para cálculo de ganancias y top)
        var ventasPeriodo = await _context.Ventas
            .AsNoTracking()
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
            .Where(v => v.Fecha >= inicioUtc && v.Fecha < finUtcExclusivo)
            .OrderByDescending(v => v.Fecha)
            .ToListAsync();

        var totalVendido = ventasPeriodo.Sum(v => v.Total);
        var totalBruto = ventasPeriodo.Sum(v => v.TotalBruto > 0 ? v.TotalBruto : v.Total);
        var totalDescuentos = ventasPeriodo.Sum(v => v.Descuento);
        var cantidadTransacciones = ventasPeriodo.Count;

        // 4. a) Total vendido agrupado por FormaPago (Efectivo, Tarjeta, Transferencia) en el período
        var formasEstandar = new List<string> { "Efectivo", "Tarjeta", "Transferencia" };
        var agrupadoFormaPago = ventasPeriodo
            .GroupBy(v => string.IsNullOrWhiteSpace(v.FormaPago) ? "Otros" : v.FormaPago.Trim())
            .ToDictionary(g => g.Key, g => new
            {
                Total = g.Sum(v => v.Total),
                Cantidad = g.Count()
            }, StringComparer.OrdinalIgnoreCase);

        var ventasPorFormaPago = new List<VentasPorFormaPagoDto>();
        var formasAgregadas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var forma in formasEstandar)
        {
            if (agrupadoFormaPago.TryGetValue(forma, out var val))
            {
                ventasPorFormaPago.Add(new VentasPorFormaPagoDto
                {
                    FormaPago = forma,
                    Total = val.Total,
                    CantidadTransacciones = val.Cantidad,
                    Porcentaje = totalVendido > 0 ? Math.Round((val.Total / totalVendido) * 100, 1) : 0
                });
            }
            else
            {
                ventasPorFormaPago.Add(new VentasPorFormaPagoDto
                {
                    FormaPago = forma,
                    Total = 0,
                    CantidadTransacciones = 0,
                    Porcentaje = 0
                });
            }
            formasAgregadas.Add(forma);
        }

        foreach (var kvp in agrupadoFormaPago)
        {
            if (!formasAgregadas.Contains(kvp.Key))
            {
                ventasPorFormaPago.Add(new VentasPorFormaPagoDto
                {
                    FormaPago = kvp.Key,
                    Total = kvp.Value.Total,
                    CantidadTransacciones = kvp.Value.Cantidad,
                    Porcentaje = totalVendido > 0 ? Math.Round((kvp.Value.Total / totalVendido) * 100, 1) : 0
                });
            }
        }

        // 5. b) Top 10 productos más vendidos (por cantidad y por monto) en el período
        var todosDetalles = ventasPeriodo.SelectMany(v => v.Detalles).ToList();

        var productosAgrupados = todosDetalles
            .GroupBy(d => d.ProductoId)
            .Select(g =>
            {
                var primerDetalle = g.First();
                var nombre = primerDetalle.Producto != null ? primerDetalle.Producto.Nombre : $"Producto #{g.Key}";
                var codigo = primerDetalle.Producto != null ? primerDetalle.Producto.CodigoBarras : "";
                var cantidadVendida = g.Sum(d => d.Cantidad);
                var montoTotal = g.Sum(d => d.Subtotal);

                return new TopProductoDto
                {
                    ProductoId = g.Key,
                    Nombre = nombre,
                    CodigoBarras = codigo,
                    CantidadVendida = cantidadVendida,
                    MontoTotal = montoTotal
                };
            })
            .ToList();

        var topProductosPorCantidad = productosAgrupados
            .OrderByDescending(p => p.CantidadVendida)
            .ThenByDescending(p => p.MontoTotal)
            .Take(10)
            .ToList();

        var topProductosPorMonto = productosAgrupados
            .OrderByDescending(p => p.MontoTotal)
            .ThenByDescending(p => p.CantidadVendida)
            .Take(10)
            .ToList();

        // 6. c) Ganancia neta estimada del período = suma de (PrecioVenta - PrecioCosto) * cantidad vendida de cada detalle
        var gananciaNetaEstimada = todosDetalles.Sum(d =>
        {
            var precioVenta = d.PrecioUnitario;
            var precioCosto = d.Producto?.PrecioCosto ?? 0m;
            return (precioVenta - precioCosto) * d.Cantidad;
        });

        // 7. d) Métricas de inventario y alertas de productos con stock bajo/crítico
        var totalProductos = await _context.Productos.CountAsync(p => p.Activo);
        var productosStockBajoCount = await _context.Productos
            .CountAsync(p => p.Activo && p.StockActual <= p.StockMinimo);

        var productosStockBajo = await _context.Productos
            .Where(p => p.Activo && p.StockActual <= p.StockMinimo)
            .OrderBy(p => p.StockActual)
            .Take(10)
            .Select(p => new ProductoStockBajoDto
            {
                Id = p.Id,
                CodigoBarras = p.CodigoBarras,
                Nombre = p.Nombre,
                StockActual = p.StockActual,
                StockMinimo = p.StockMinimo,
                PrecioVenta = p.PrecioVenta
            })
            .ToListAsync();

        // 8. Ventas por día para gráfico de tendencias
        var ventasPorDia = new List<VentaPorDiaDto>();
        var diasEnPeriodo = (finUtcExclusivo.Date - inicioUtc.Date).Days;

        if (diasEnPeriodo <= 1)
        {
            // Filtro de 1 solo día: mostramos los últimos 7 días terminando en este día
            var desde7Dias = finUtcExclusivo.AddDays(-7);
            var ventasUltimos7 = await _context.Ventas
                .AsNoTracking()
                .Where(v => v.Fecha >= desde7Dias && v.Fecha < finUtcExclusivo)
                .ToListAsync();

            for (int i = 0; i < 7; i++)
            {
                var dia = desde7Dias.AddDays(i);
                var diaSiguiente = dia.AddDays(1);
                var ventasDelDia = ventasUltimos7
                    .Where(v => v.Fecha >= dia && v.Fecha < diaSiguiente)
                    .ToList();

                ventasPorDia.Add(new VentaPorDiaDto
                {
                    Fecha = dia.ToString("yyyy-MM-dd"),
                    DiaNombre = dia.ToString("ddd", new CultureInfo("es-ES")),
                    Total = ventasDelDia.Sum(v => v.Total),
                    CantidadTransacciones = ventasDelDia.Count
                });
            }
        }
        else
        {
            // Rango de múltiples días: mostramos hasta 31 días dentro del período
            var maxDias = Math.Min(diasEnPeriodo, 31);
            for (int i = 0; i < maxDias; i++)
            {
                var dia = inicioUtc.AddDays(i);
                var diaSiguiente = dia.AddDays(1);
                var ventasDelDia = ventasPeriodo
                    .Where(v => v.Fecha >= dia && v.Fecha < diaSiguiente)
                    .ToList();

                ventasPorDia.Add(new VentaPorDiaDto
                {
                    Fecha = dia.ToString("yyyy-MM-dd"),
                    DiaNombre = dia.ToString("ddd", new CultureInfo("es-ES")),
                    Total = ventasDelDia.Sum(v => v.Total),
                    CantidadTransacciones = ventasDelDia.Count
                });
            }
        }

        // 9. Ventas recientes
        var ventasRecientes = ventasPeriodo
            .Take(8)
            .Select(v => new VentaRecienteDto
            {
                Id = v.Id,
                Fecha = v.Fecha,
                Total = v.Total,
                FormaPago = v.FormaPago,
                NombreUsuario = v.Usuario != null ? v.Usuario.Nombre : "Cajero / Admin"
            })
            .ToList();

        if (ventasRecientes.Count == 0)
        {
            ventasRecientes = await _context.Ventas
                .AsNoTracking()
                .Include(v => v.Usuario)
                .OrderByDescending(v => v.Fecha)
                .Take(5)
                .Select(v => new VentaRecienteDto
                {
                    Id = v.Id,
                    Fecha = v.Fecha,
                    Total = v.Total,
                    FormaPago = v.FormaPago,
                    NombreUsuario = v.Usuario != null ? v.Usuario.Nombre : "Cajero / Admin"
                })
                .ToListAsync();
        }

        return Ok(new DashboardResumenDto
        {
            FechaInicio = inicioUtc,
            FechaFin = finUtcExclusivo.AddDays(-1),
            TotalVendido = totalVendido,
            CantidadTransacciones = cantidadTransacciones,
            TotalBruto = totalBruto,
            TotalDescuentos = totalDescuentos,
            GananciaNetaEstimada = gananciaNetaEstimada,
            TotalVentasHoy = totalVentasHoy,
            CantidadTransaccionesHoy = transaccionesHoy,
            VentasPorFormaPago = ventasPorFormaPago,
            TopProductos = topProductosPorCantidad,
            TopProductosPorMonto = topProductosPorMonto,
            TotalProductos = totalProductos,
            AlertasStockBajo = productosStockBajoCount,
            ProductosStockBajo = productosStockBajo,
            VentasPorDia = ventasPorDia,
            VentasRecientes = ventasRecientes
        });
    }
}
