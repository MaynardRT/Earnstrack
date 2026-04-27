using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using eTracker.API.DTOs;
using eTracker.API.Services;
using System.Security.Claims;

namespace eTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private bool IsAdmin() => User.IsInRole("Admin") || User.FindFirst(ClaimTypes.Role)?.Value == "Admin";

    private bool TryGetCurrentUserId(out Guid userId)
    {
        // Claims parsing is centralized here so every action enforces the same identity contract.
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdValue, out userId);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<TransactionSummaryDto>> GetSummary([FromQuery] bool includeStatusBreakdown = false, [FromQuery] bool includeAllUsers = false)
    {
        if (!TryGetCurrentUserId(out var userGuid))
            return Unauthorized();

        // Dashboard endpoints can intentionally switch to an all-user view without weakening auth on write operations.
        Guid? scopedUserId = includeAllUsers || IsAdmin() ? null : userGuid;
        var summary = await _transactionService.GetTransactionSummary(scopedUserId, includeStatusBreakdown);
        return Ok(summary);
    }

    [HttpGet("recent")]
    public async Task<ActionResult<List<TransactionListDto>>> GetRecentTransactions([FromQuery] int days = 30, [FromQuery] bool includeAllUsers = false)
    {
        if (!TryGetCurrentUserId(out var userGuid))
            return Unauthorized();

        Guid? scopedUserId = includeAllUsers || IsAdmin() ? null : userGuid;
        var transactions = await _transactionService.GetRecentTransactions(scopedUserId, days);
        return Ok(transactions);
    }

    [HttpGet("by-period")]
    public async Task<ActionResult<List<TransactionListDto>>> GetTransactionsByPeriod([FromQuery] string period = "monthly", [FromQuery] bool includeAllUsers = false)
    {
        if (!TryGetCurrentUserId(out var userGuid))
            return Unauthorized();

        Guid? scopedUserId = includeAllUsers || IsAdmin() ? null : userGuid;
        var transactions = await _transactionService.GetTransactionsByPeriod(scopedUserId, period);
        return Ok(transactions);
    }

    [HttpPost("ewallet")]
    public async Task<ActionResult<TransactionListDto>> CreateEWalletTransaction([FromBody] CreateEWalletTransactionDto request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var transaction = await _transactionService.CreateEWalletTransaction(userGuid, request);
        if (transaction == null)
            return BadRequest("Failed to create transaction");

        return Ok(transaction);
    }

    [HttpPost("printing")]
    public async Task<ActionResult<TransactionListDto>> CreatePrintingTransaction([FromBody] CreatePrintingTransactionDto request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var transaction = await _transactionService.CreatePrintingTransaction(userGuid, request);
        if (transaction == null)
            return BadRequest("Failed to create transaction");

        return Ok(transaction);
    }

    [HttpPost("eloading")]
    public async Task<ActionResult<TransactionListDto>> CreateELoadingTransaction([FromBody] CreateELoadingTransactionDto request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var transaction = await _transactionService.CreateELoadingTransaction(userGuid, request);
        if (transaction == null)
            return BadRequest("Failed to create transaction");

        return Ok(transaction);
    }

    [HttpPost("bills-payment")]
    public async Task<ActionResult<TransactionListDto>> CreateBillsPaymentTransaction([FromBody] CreateBillsPaymentTransactionDto request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var transaction = await _transactionService.CreateBillsPaymentTransaction(userGuid, request);
        if (transaction == null)
            return BadRequest("Failed to create transaction");

        return Ok(transaction);
    }
}
