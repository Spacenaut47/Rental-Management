using AutoMapper;
using backend.Domain.Entities;
using backend.Dtos.Properties;
using backend.Dtos.Units;
using backend.Dtos.Tenants;

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
    }
}
