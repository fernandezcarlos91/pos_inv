using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class UsuarioCreateDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public int Rol { get; set; }
}