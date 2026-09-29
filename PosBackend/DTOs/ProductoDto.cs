using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PosBackend.DTOs;

public class CrearProductoDto
{
    [MaxLength(64)]
    public string? CodigoBarras { get; set; }

    [Required]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal PrecioCosto { get; set; }

    [Range(0, double.MaxValue)]
    public decimal PrecioVenta { get; set; }

    [Range(0, int.MaxValue)]
    public int StockActual { get; set; }

    [Range(0, int.MaxValue)]
    public int StockMinimo { get; set; }

    public int? ProveedorId { get; set; }
}

public class ActualizarProductoDto
{
    [MaxLength(64)]
    public string? CodigoBarras { get; set; }

    [Required]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal PrecioCosto { get; set; }

    [Range(0, double.MaxValue)]
    public decimal PrecioVenta { get; set; }

    [Range(0, int.MaxValue)]
    public int StockActual { get; set; }

    [Range(0, int.MaxValue)]
    public int StockMinimo { get; set; }

    public int? ProveedorId { get; set; }

    public bool Activo { get; set; }
}

public class ProductoResponseDto
{
    public int Id { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public decimal? PrecioCosto { get; set; }

    public decimal PrecioVenta { get; set; }
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public int? ProveedorId { get; set; }
    public bool Activo { get; set; }
}

public class IngresarStockDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public int Cantidad { get; set; }

    [MaxLength(500)]
    public string? Observacion { get; set; }
}


