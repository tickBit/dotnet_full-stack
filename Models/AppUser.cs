using System.Text.Json.Serialization;

namespace AuthApiMinimal.Models;

public class AppUser
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";

    // Navigation collection
    [JsonIgnore]
    public List<Info> Infos { get; set; } = new();
}
