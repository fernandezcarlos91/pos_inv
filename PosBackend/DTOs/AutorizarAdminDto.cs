using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class AutorizarAdminDto
{
    public string? Email { get; set; }

    [Required(ErrorMessage = "La contraseña de administrador es requerida.")]
    public string Password { get; set; } = string.Empty;
}

public class AutorizarAdminResponseDto
{
    public bool Autorizado { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string? NombreAdmin { get; set; }
    public string? EmailAdmin { get; set; }
}
