using AutoMapper;
using backend.Domain.Entities;
using backend.Dtos.Properties;
using backend.Dtos.Units;
using backend.Dtos.Tenants;
using backend.Dtos.Leases;
using backend.Dtos.Payments;
using backend.Dtos.Maintenance;

namespace backend.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Properties
        CreateMap<Property, PropertyReadDto>();
        CreateMap<PropertyCreateDto, Property>();
        CreateMap<PropertyUpdateDto, Property>();

        // Units
        CreateMap<Unit, UnitReadDto>()
            .ForMember(d => d.IsOccupied, o => o.MapFrom(s =>
                s.Leases.Any(l => l.IsActive && l.StartDateUtc <= DateTime.UtcNow && l.EndDateUtc > DateTime.UtcNow)));
        CreateMap<UnitCreateDto, Unit>().ForMember(d => d.IsOccupied, o => o.Ignore());
        CreateMap<UnitUpdateDto, Unit>().ForMember(d => d.IsOccupied, o => o.Ignore());

        // Tenants
        CreateMap<Tenant, TenantReadDto>();
        CreateMap<TenantCreateDto, Tenant>();
        CreateMap<TenantUpdateDto, Tenant>();

        // Leases
        CreateMap<Lease, LeaseReadDto>()
            .ForMember(d => d.IsActive, o => o.MapFrom(s =>
                s.IsActive && s.StartDateUtc <= DateTime.UtcNow && s.EndDateUtc > DateTime.UtcNow));
        CreateMap<LeaseCreateDto, Lease>();
        CreateMap<LeaseUpdateDto, Lease>();

        // Payments
        CreateMap<Payment, PaymentReadDto>();
        CreateMap<PaymentCreateDto, Payment>();
        CreateMap<PaymentUpdateDto, Payment>();

        // Maintenance
        CreateMap<MaintenanceRequest, MaintenanceReadDto>();
        CreateMap<MaintenanceCreateDto, MaintenanceRequest>();
        CreateMap<MaintenanceUpdateDto, MaintenanceRequest>();
    }
}
