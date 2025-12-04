namespace AuthApiMinimal.Models
{
    public class Info
    {
        public int Id { get; set; }

        public string Note { get; set; } = string.Empty;

        // Foreign key
        public int UserId { get; set; }

        // Navigation property
        public AppUser? User { get; set; }
    }
}
