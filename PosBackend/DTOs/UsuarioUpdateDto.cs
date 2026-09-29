using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class UsuarioUpdateDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [MaxLength(100)]
    [EmailAddress(ErrorMessage = "Formato de correo no válido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es obligatorio.")]
    public int Rol { get; set; }

    [MaxLength(256)]
    public string? Password { get; set; }

    public bool? IsActive { get; set; }
}

public class CambiarEstadoUsuarioDto
{
    public bool IsActive { get; set; }
}

