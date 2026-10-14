using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class CambiarPasswordDto
{
    [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
    public string ActualPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La nueva contraseña debe tener al menos 8 caracteres.")]
    public string NuevaPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "La confirmación de la nueva contraseña es obligatoria.")]
    public string ConfirmarPassword { get; set; } = string.Empty;
}

public class RestablecerPasswordDto
{
    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La nueva contraseña debe tener al menos 8 caracteres.")]
    public string NuevaPassword { get; set; } = string.Empty;

    public string? ConfirmarPassword { get; set; }
}

