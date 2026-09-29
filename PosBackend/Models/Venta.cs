using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PosBackend.Models;

public class Venta
{
    public int Id { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal TotalBruto { get; set; }

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal Descuento { get; set; } = 0;

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal Total { get; set; }

    [MaxLength(250)]
    public string? MotivoDescuento { get; set; }

    [Required]
    [MaxLength(50)]
    public string FormaPago { get; set; } = string.Empty;

    public List<DetalleVenta> Detalles { get; set; } = [];

    public int? UsuarioId { get; set; }

    public Usuario? Usuario { get; set; }
}
