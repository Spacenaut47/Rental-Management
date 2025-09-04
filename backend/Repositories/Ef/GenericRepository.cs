using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories.Ef;

public class GenericRepository<T>(DbContext context) : IGenericRepository<T> where T : class
{
    protected readonly DbContext _context = context;
    protected readonly DbSet<T> _set = context.Set<T>();

    public async Task<T?> GetByIdAsync(int id) => await _set.FindAsync(id);

    public async Task<IReadOnlyList<T>> GetAllAsync() => await _set.AsNoTracking().ToListAsync();

    public async Task<IReadOnlyList<T>> FindAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate)
        => await _set.AsNoTracking().Where(predicate).ToListAsync();

    public async Task AddAsync(T entity) => await _set.AddAsync(entity);
    public void Update(T entity) => _set.Update(entity);
    public void Remove(T entity) => _set.Remove(entity);
}
