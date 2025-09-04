using backend.Domain.Entities;

namespace backend.Repositories.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Property> Properties { get; }
    IGenericRepository<Unit> Units { get; }

    IGenericRepository<T> GetRepository<T>() where T : class;

    Task<int> SaveChangesAsync();
}
