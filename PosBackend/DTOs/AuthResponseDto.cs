namespace PosBackend.DTOs;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UsuarioResponseDto Usuario { get; set; } = new();
}