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
    private readonly ApplicationDbContext _context;

    public SettingsController(IServiceFeeService serviceFeeService, ApplicationDbContext context)
    {
        _serviceFeeService = serviceFeeService;
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
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var transactions = await _context.Transactions
            .Where(t => t.UserId == userGuid)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Date,Time,Type,Amount,Service Charge,Total,Status");

        foreach (var transaction in transactions)
        {
            csv.AppendLine($"{transaction.CreatedAt:yyyy-MM-dd},{transaction.CreatedAt:HH:mm:ss},{transaction.TransactionType},{transaction.Amount},{transaction.ServiceCharge},{transaction.TotalAmount},{transaction.Status}");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"transactions_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
    }
}
