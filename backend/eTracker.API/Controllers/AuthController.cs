using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using eTracker.API.DTOs;
using eTracker.API.Models;
using eTracker.API.Data;
using eTracker.API.Services;
using System.Security.Claims;

namespace eTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ApplicationDbContext _context;

    public AuthController(IAuthService authService, ApplicationDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            return BadRequest(new { message = "Email and password are required" });

        try
        {
            // Find user by email - only select needed fields to minimize memory and transfer
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var user = await _context.Users
                .Where(u => u.Email.ToLower() == normalizedEmail)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.FullName,
                    u.Role,
                    u.PasswordHash,
                    u.IsActive,
                    u.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password (this is intentionally slow for security)
            if (!_authService.VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Check if user is active
            if (!user.IsActive)
            {
                return Unauthorized(new { message = "User account is inactive" });
            }

            // Generate JWT token
            var jwtToken = await _authService.GenerateJwtToken(new User
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            });

            // Set no-cache on auth endpoints to ensure fresh tokens
            Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            Response.Headers["Pragma"] = "no-cache";
            Response.Headers["Expires"] = "0";

            return Ok(new AuthResponseDto
            {
                Token = jwtToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during login: {ex.Message}");
            return Unauthorized(new { message = "Authentication failed" });
        }
    }

    [Authorize]
    [HttpPost("admin/create-user")]
    public async Task<ActionResult<UserDto>> CreateUserAsAdmin([FromBody] CreateUserAdminDto request)
    {
        // Check if user is admin
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin")
        {
            return Forbid();
        }

        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password) ||
            string.IsNullOrEmpty(request.FullName) || string.IsNullOrEmpty(request.Role))
        {
            return BadRequest(new { message = "Email, password, full name, and role are required" });
        }

        try
        {
            // Check if email already exists
            if (_context.Users.Any(u => u.Email == request.Email))
            {
                return Conflict(new { message = "User with this email already exists" });
            }

            // Validate role
            if (request.Role != "Admin" && request.Role != "Seller")
            {
                return BadRequest(new { message = "Role must be either 'Admin' or 'Seller'" });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                FullName = request.FullName,
                Role = request.Role,
                PasswordHash = _authService.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCurrentUser), new { id = user.Id }, new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                ProfilePicture = user.ProfilePicture,
                CreatedAt = user.CreatedAt
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating user: {ex.Message}");
            return StatusCode(500, new { message = "Error creating user" });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // JWT tokens are stateless, so logout is handled client-side by removing the token
        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var user = await _context.Users.FindAsync(userGuid);
        if (user == null)
            return NotFound();

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
}

