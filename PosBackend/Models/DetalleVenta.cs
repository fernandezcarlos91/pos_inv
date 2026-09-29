using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace PosBackend.Models;

public class DetalleVenta
{
    public int Id { get; set; }

    public int VentaId { get; set; }

    public int ProductoId { get; set; }

    public int Cantidad { get; set; }

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Precision(18, 2)]
    [Column(TypeName = "numeric(18,2)")]
    public decimal Subtotal { get; set; }

    public Venta? Venta { get; set; }

    public Producto? Producto { get; set; }
}
