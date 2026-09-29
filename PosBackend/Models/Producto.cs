using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PosBackend.Models;

public class Producto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(64)]
    public string CodigoBarras { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal PrecioCosto { get; set; }

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal PrecioVenta { get; set; }

    public int StockActual { get; set; }

    public int StockMinimo { get; set; }

    public int ProveedorId { get; set; }

    public bool Activo { get; set; } = true;
}
