using backend.Data;
using backend.Domain.Entities;
using backend.Repositories.Interfaces;

namespace backend.Repositories.Ef;

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    private readonly AppDbContext _db = db;

    private IGenericRepository<User>? _users;
    private IGenericRepository<Property>? _properties;
    private IGenericRepository<Unit>? _units;

    public IGenericRepository<User> Users => _users ??= new GenericRepository<User>(_db);
    public IGenericRepository<Property> Properties => _properties ??= new GenericRepository<Property>(_db);
    public IGenericRepository<Unit> Units => _units ??= new GenericRepository<Unit>(_db);

    public IGenericRepository<T> GetRepository<T>() where T : class => new GenericRepository<T>(_db);

    public Task<int> SaveChangesAsync() => _db.SaveChangesAsync();

    public ValueTask DisposeAsync() => _db.DisposeAsync();
}
