// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Models;

public class ContactMessage
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Subject { get; set; }
    public string Message { get; set; } = "";
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public bool Read { get; set; } = false;
}
