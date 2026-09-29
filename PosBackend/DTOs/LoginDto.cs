using System.ComponentModel.DataAnnotations;

namespace PosBackend.DTOs;

public class LoginDto
{
    [Required]
    [MaxLength(100)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Password { get; set; } = string.Empty;
}