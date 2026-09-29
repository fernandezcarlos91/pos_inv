using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class CrearDetalleVentaDto
{
    [Range(1, int.MaxValue)]
    public int ProductoId { get; set; }

    [Range(1, int.MaxValue)]
    public int Cantidad { get; set; }
}

public class CrearVentaDto
{
    [Required]
    [MaxLength(50)]
    public string FormaPago { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "El descuento no puede ser negativo.")]
    public decimal Descuento { get; set; } = 0;

    [MaxLength(250)]
    public string? MotivoDescuento { get; set; }

    [Required]
    [MinLength(1)]
    public List<CrearDetalleVentaDto> Detalles { get; set; } = [];
}

public class DetalleVentaResponseDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

public class VentaResponseDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public decimal TotalBruto { get; set; }
    public decimal Descuento { get; set; }
    public decimal Total { get; set; }
    public string? MotivoDescuento { get; set; }
    public string FormaPago { get; set; } = string.Empty;
    public int? UsuarioId { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public List<DetalleVentaResponseDto> Detalles { get; set; } = [];
}

