using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class CrearProveedorDto
{
    [Required(ErrorMessage = "El nombre del proveedor es obligatorio.")]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Telefono { get; set; } = string.Empty;

    [MaxLength(100)]
    [EmailAddress(ErrorMessage = "El formato de correo no es válido.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(250)]
    public string Direccion { get; set; } = string.Empty;

    [MaxLength(50)]
    public string RutIdentificacion { get; set; } = string.Empty;
}

public class ActualizarProveedorDto
{
    [Required(ErrorMessage = "El nombre del proveedor es obligatorio.")]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Telefono { get; set; } = string.Empty;

    [MaxLength(100)]
    [EmailAddress(ErrorMessage = "El formato de correo no es válido.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(250)]
    public string Direccion { get; set; } = string.Empty;

    [MaxLength(50)]
    public string RutIdentificacion { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;
}

public class ProveedorResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string RutIdentificacion { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}

