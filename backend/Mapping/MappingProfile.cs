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
        CreateMap<Unit, UnitReadDto>();
        CreateMap<UnitCreateDto, Unit>();
        CreateMap<UnitUpdateDto, Unit>();

        // Tenants
        CreateMap<Tenant, TenantReadDto>();
        CreateMap<TenantCreateDto, Tenant>();
        CreateMap<TenantUpdateDto, Tenant>();

        // Leases
        CreateMap<Lease, LeaseReadDto>();
        CreateMap<LeaseCreateDto, Lease>();

        // For updates: only map non-null source members so partial updates don't overwrite existing values
        CreateMap<LeaseUpdateDto, Lease>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Payments
        CreateMap<Payment, PaymentReadDto>();
        CreateMap<PaymentCreateDto, Payment>();

        // Maintenance
        CreateMap<MaintenanceRequest, MaintenanceReadDto>();
        CreateMap<MaintenanceCreateDto, MaintenanceRequest>();
        CreateMap<MaintenanceUpdateDto, MaintenanceRequest>();
    }
}
