using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using eTracker.API.Data;
using eTracker.API.DTOs;
using eTracker.API.Services;
using System.Security.Claims;

namespace eTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IServiceFeeService _serviceFeeService;
    private readonly IProductService _productService;
    private readonly ApplicationDbContext _context;

    public SettingsController(IServiceFeeService serviceFeeService, IProductService productService, ApplicationDbContext context)
    {
        _serviceFeeService = serviceFeeService;
        _productService = productService;
        _context = context;
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var user = await _context.Users.FindAsync(userGuid);
        if (user == null)
            return NotFound();

        user.ProfilePicture = string.IsNullOrWhiteSpace(request.ProfilePicture)
            ? null
            : request.ProfilePicture;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            ProfilePicture = user.ProfilePicture,
            CreatedAt = user.CreatedAt
        });
    }

    // Service Fees Endpoints
    [HttpGet("service-fees")]
    public async Task<ActionResult<List<ServiceFeeDto>>> GetServiceFees()
    {
        var fees = await _serviceFeeService.GetAllServiceFees();
        return Ok(fees);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("service-fees")]
    public async Task<ActionResult<ServiceFeeDto>> CreateServiceFee([FromBody] CreateServiceFeeDto request)
    {
        var fee = await _serviceFeeService.CreateServiceFee(request);
        if (fee == null)
            return BadRequest("Failed to create service fee");

        return Ok(fee);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("service-fees/{id}")]
    public async Task<ActionResult<ServiceFeeDto>> UpdateServiceFee(Guid id, [FromBody] UpdateServiceFeeDto request)
    {
        var fee = await _serviceFeeService.UpdateServiceFee(id, request);
        if (fee == null)
            return NotFound();

        return Ok(fee);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("service-fees/{id}")]
    public async Task<IActionResult> DeleteServiceFee(Guid id)
    {
        var result = await _serviceFeeService.DeleteServiceFee(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    // User Management (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<ActionResult<List<UserManagementDto>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new UserManagementDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("users/{id}")]
    public async Task<ActionResult<UserManagementDto>> UpdateUser(Guid id, [FromBody] UpdateUserDto request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        user.FullName = request.FullName;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return Ok(new UserManagementDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    // Data Export Endpoint
    [HttpGet("export/transactions")]
    public async Task<IActionResult> ExportTransactions()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var transactions = await _context.Transactions
            .Include(t => t.EWalletTransaction)
            .Where(t => t.UserId == userGuid)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Date,Time,Type,Amount,Service Charge,Total,Status,Failure Reason,Screenshot Reference,Screenshot Stored In Database");

        foreach (var transaction in transactions)
        {
            var failureReason = EscapeCsvField(transaction.FailureReason);
            var screenshotReference = EscapeCsvField(BuildScreenshotReference(
                transaction.EWalletTransaction?.ScreenshotUrl,
                transaction.EWalletTransaction?.ScreenshotContent,
                transaction.EWalletTransaction?.ScreenshotContentType));
            var screenshotStoredInDatabase = transaction.EWalletTransaction?.ScreenshotContent?.Length > 0 ? "Yes" : "No";

            csv.AppendLine(
                $"{transaction.CreatedAt:yyyy-MM-dd},{transaction.CreatedAt:HH:mm:ss},{EscapeCsvField(transaction.TransactionType)},{transaction.Amount},{transaction.ServiceCharge},{transaction.TotalAmount},{EscapeCsvField(transaction.Status)},{failureReason},{screenshotReference},{screenshotStoredInDatabase}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"transactions_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
    }

    private static string EscapeCsvField(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value
            .Replace("\r", " ")
            .Replace("\n", " ");

        return $"\"{normalized.Replace("\"", "\"\"")}\"";
    }

    private string? BuildScreenshotReference(string? screenshotUrl, byte[]? screenshotContent, string? screenshotContentType)
    {
        if (!string.IsNullOrWhiteSpace(screenshotUrl))
        {
            if (Uri.TryCreate(screenshotUrl, UriKind.Absolute, out var absoluteUri))
            {
                return absoluteUri.ToString();
            }

            return $"{Request.Scheme}://{Request.Host}{screenshotUrl}";
        }

        return ReceiptContentHelper.ToDataUrl(screenshotContent, screenshotContentType);
    }

    // Products Endpoints
    [HttpGet("products")]
    public async Task<ActionResult<List<ProductDto>>> GetProducts()
    {
        var products = await _productService.GetAllProducts();
        return Ok(products);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto request)
    {
        var product = await _productService.CreateProduct(request);
        if (product == null)
            return BadRequest("Failed to create product");

        return Ok(product);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("products/{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto request)
    {
        var product = await _productService.UpdateProduct(id, request);
        if (product == null)
            return NotFound();

        return Ok(product);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var result = await _productService.DeleteProduct(id);
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPost("products/{id}/sell")]
    public async Task<ActionResult<ProductDto>> SellProduct(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var product = await _productService.SellProduct(id, userGuid);
        if (product == null)
            return BadRequest("Product not found, out of stock, or inactive.");

        return Ok(product);
    }
}
