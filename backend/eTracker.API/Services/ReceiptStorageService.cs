using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;

namespace eTracker.API.Services;

public interface IReceiptStorageService
{
    Task<ReceiptStorageResult?> SaveReceiptAsync(string? screenshotBase64, CancellationToken cancellationToken = default);
}

public sealed class ReceiptStorageResult
{
    public string? RelativeUrl { get; init; }
    public byte[]? Content { get; init; }
    public string? ContentType { get; init; }
}

public static class ReceiptContentHelper
{
    public static string? ToDataUrl(byte[]? content, string? contentType)
    {
        if (content is null || content.Length == 0 || string.IsNullOrWhiteSpace(contentType))
        {
            return null;
        }

        return $"data:{contentType};base64,{Convert.ToBase64String(content)}";
    }
}

public class LocalReceiptStorageService : IReceiptStorageService
{
    private static readonly Regex DataUrlPattern = new(
        "^data:(?<mime>image\\/[a-zA-Z0-9.+-]+);base64,(?<data>.+)$",
        RegexOptions.Compiled | RegexOptions.Singleline);

    private readonly IWebHostEnvironment _environment;

    public LocalReceiptStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<ReceiptStorageResult?> SaveReceiptAsync(string? screenshotBase64, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(screenshotBase64))
        {
            return null;
        }

        if (!screenshotBase64.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return new ReceiptStorageResult
            {
                RelativeUrl = screenshotBase64
            };
        }

        var match = DataUrlPattern.Match(screenshotBase64);
        if (!match.Success)
        {
            throw new InvalidOperationException("Screenshot payload is not a valid image data URL.");
        }

        var mimeType = match.Groups["mime"].Value;
        var base64Payload = match.Groups["data"].Value;
        var extension = mimeType.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            _ => throw new InvalidOperationException("Screenshot image type is not supported.")
        };

        byte[] fileBytes;
        try
        {
            fileBytes = Convert.FromBase64String(base64Payload);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException("Screenshot payload could not be decoded.", ex);
        }

        var webRootPath = string.IsNullOrWhiteSpace(_environment.WebRootPath)
            ? Path.Combine(_environment.ContentRootPath, "wwwroot")
            : _environment.WebRootPath;
        var receiptsDirectory = Path.Combine(webRootPath, "uploads", "receipts");
        Directory.CreateDirectory(receiptsDirectory);

        var fileName = $"receipt-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(receiptsDirectory, fileName);

        await File.WriteAllBytesAsync(filePath, fileBytes, cancellationToken);
        return new ReceiptStorageResult
        {
            RelativeUrl = $"/uploads/receipts/{fileName}",
            Content = fileBytes,
            ContentType = mimeType
        };
    }
}