using Microsoft.EntityFrameworkCore;
using eTracker.API.Data;
using eTracker.API.DTOs;
using eTracker.API.Models;

namespace eTracker.API.Services;

public interface IServiceFeeService
{
    Task<ServiceFee?> GetServiceFeeForEWallet(string provider, string method, decimal baseAmount);
    Task<ServiceFee?> GetServiceFeeForPrinting(string serviceType);
    Task<List<ServiceFeeDto>> GetAllServiceFees();
    Task<ServiceFeeDto?> CreateServiceFee(CreateServiceFeeDto dto);
    Task<ServiceFeeDto?> UpdateServiceFee(Guid id, UpdateServiceFeeDto dto);
    Task<bool> DeleteServiceFee(Guid id);
}

public class ServiceFeeService : IServiceFeeService
{
    private readonly ApplicationDbContext _context;

    public ServiceFeeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceFee?> GetServiceFeeForEWallet(string provider, string method, decimal baseAmount)
    {
        return await _context.ServiceFees
            .Where(f =>
                f.ServiceType == "EWallet" &&
                (string.IsNullOrWhiteSpace(f.ProviderType) || f.ProviderType == provider) &&
                (string.IsNullOrWhiteSpace(f.MethodType) || f.MethodType == method) &&
                (!f.BracketMinAmount.HasValue || f.BracketMinAmount <= baseAmount) &&
                (!f.BracketMaxAmount.HasValue || f.BracketMaxAmount >= baseAmount))
            .OrderByDescending(f => f.ProviderType == provider)
            .ThenByDescending(f => f.MethodType == method)
            .ThenByDescending(f => f.BracketMinAmount)
            .FirstOrDefaultAsync();
    }

    public async Task<ServiceFee?> GetServiceFeeForPrinting(string serviceType)
    {
        return await _context.ServiceFees
            .FirstOrDefaultAsync(f =>
                f.ServiceType == "Printing" &&
                f.ProviderType == serviceType);
    }

    public async Task<List<ServiceFeeDto>> GetAllServiceFees()
    {
        return await _context.ServiceFees
            .Select(f => new ServiceFeeDto
            {
                Id = f.Id,
                ServiceType = f.ServiceType,
                ProviderType = f.ProviderType,
                MethodType = f.MethodType,
                FeePercentage = f.FeePercentage,
                FlatFee = f.FlatFee,
                BracketMinAmount = f.BracketMinAmount,
                BracketMaxAmount = f.BracketMaxAmount
            })
            .ToListAsync();
    }

    public async Task<ServiceFeeDto?> CreateServiceFee(CreateServiceFeeDto dto)
    {
        var serviceFee = new ServiceFee
        {
            Id = Guid.NewGuid(),
            ServiceType = dto.ServiceType,
            ProviderType = dto.ProviderType,
            MethodType = dto.MethodType,
            FeePercentage = dto.FeePercentage,
            FlatFee = dto.FlatFee,
            BracketMinAmount = dto.BracketMinAmount,
            BracketMaxAmount = dto.BracketMaxAmount
        };

        _context.ServiceFees.Add(serviceFee);
        await _context.SaveChangesAsync();

        return new ServiceFeeDto
        {
            Id = serviceFee.Id,
            ServiceType = serviceFee.ServiceType,
            ProviderType = serviceFee.ProviderType,
            MethodType = serviceFee.MethodType,
            FeePercentage = serviceFee.FeePercentage,
            FlatFee = serviceFee.FlatFee,
            BracketMinAmount = serviceFee.BracketMinAmount,
            BracketMaxAmount = serviceFee.BracketMaxAmount
        };
    }

    public async Task<ServiceFeeDto?> UpdateServiceFee(Guid id, UpdateServiceFeeDto dto)
    {
        var serviceFee = await _context.ServiceFees.FindAsync(id);
        if (serviceFee == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.ServiceType))
            serviceFee.ServiceType = dto.ServiceType;

        serviceFee.ProviderType = string.IsNullOrWhiteSpace(dto.ProviderType)
            ? null
            : dto.ProviderType;

        serviceFee.MethodType = string.IsNullOrWhiteSpace(dto.MethodType)
            ? null
            : dto.MethodType;

        serviceFee.FeePercentage = dto.FeePercentage;
        serviceFee.FlatFee = dto.FlatFee;
        serviceFee.BracketMinAmount = dto.BracketMinAmount;
        serviceFee.BracketMaxAmount = dto.BracketMaxAmount;

        serviceFee.UpdatedAt = DateTime.UtcNow;

        _context.ServiceFees.Update(serviceFee);
        await _context.SaveChangesAsync();

        return new ServiceFeeDto
        {
            Id = serviceFee.Id,
            ServiceType = serviceFee.ServiceType,
            ProviderType = serviceFee.ProviderType,
            MethodType = serviceFee.MethodType,
            FeePercentage = serviceFee.FeePercentage,
            FlatFee = serviceFee.FlatFee,
            BracketMinAmount = serviceFee.BracketMinAmount,
            BracketMaxAmount = serviceFee.BracketMaxAmount
        };
    }

    public async Task<bool> DeleteServiceFee(Guid id)
    {
        var serviceFee = await _context.ServiceFees.FindAsync(id);
        if (serviceFee == null) return false;

        _context.ServiceFees.Remove(serviceFee);
        await _context.SaveChangesAsync();
        return true;
    }
}
