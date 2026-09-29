namespace PosBackend.DTOs;

public class DashboardResumenDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }

    // Métricas del período filtrado
    public decimal TotalVendido { get; set; }
    public int CantidadTransacciones { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal TotalDescuentos { get; set; }
    public decimal GananciaNetaEstimada { get; set; }

    // Métricas de ventas del día de hoy (compatibilidad y referencia rápida)
    public decimal TotalVentasHoy { get; set; }
    public int CantidadTransaccionesHoy { get; set; }

    // Ventas agrupadas por medio de pago en el período
    public List<VentasPorFormaPagoDto> VentasPorFormaPago { get; set; } = [];

    // Top 10 productos más vendidos en el período
    public List<TopProductoDto> TopProductos { get; set; } = [];
    public List<TopProductoDto> TopProductosPorMonto { get; set; } = [];

    // Inventario y alertas de stock (estado actual)
    public int TotalProductos { get; set; }
    public int AlertasStockBajo { get; set; }
    public List<ProductoStockBajoDto> ProductosStockBajo { get; set; } = [];

    // Evolución diaria para gráficos
    public List<VentaPorDiaDto> VentasPorDia { get; set; } = [];

    // Transacciones recientes
    public List<VentaRecienteDto> VentasRecientes { get; set; } = [];
}

public class VentasPorFormaPagoDto
{
    public string FormaPago { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int CantidadTransacciones { get; set; }
    public decimal Porcentaje { get; set; }
}

public class TopProductoDto
{
    public int ProductoId { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int CantidadVendida { get; set; }
    public decimal MontoTotal { get; set; }
}

public class ProductoStockBajoDto
{
    public int Id { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public decimal PrecioVenta { get; set; }
}

public class VentaPorDiaDto
{
    public string Fecha { get; set; } = string.Empty;
    public string DiaNombre { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public int CantidadTransacciones { get; set; }
}

public class VentaRecienteDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public string FormaPago { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
}
