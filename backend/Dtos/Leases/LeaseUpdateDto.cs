namespace backend.Dtos.Leases;

public class LeaseUpdateDto : LeaseCreateDto
{
    public bool IsActive { get; set; }
}
