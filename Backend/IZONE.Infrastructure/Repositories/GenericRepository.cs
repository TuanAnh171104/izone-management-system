using IZONE.Core.Interfaces;
using IZONE.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace IZONE.Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly IZONEDbContext _context;

        public GenericRepository(IZONEDbContext context)
        {
            _context = context;
        }

        public async Task<T> GetByIdAsync(int id)
        {
            return await _context.Set<T>().FindAsync(id);
        }

        public virtual async Task<IReadOnlyList<T>> GetAllAsync()
        {
            try
            {
                return await _context.Set<T>().ToListAsync();
            }
            catch (Exception ex)
            {
                // Log the exception or handle it appropriately
                throw new Exception($"Error retrieving all {typeof(T).Name}: {ex.Message}", ex);
            }
        }

        public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _context.Set<T>().Where(predicate).ToListAsync();
        }

        public async Task<T> AddAsync(T entity)
        {
            await _context.Set<T>().AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task UpdateAsync(T entity)
        {
            try
            {
                Console.WriteLine($"=== BẮT ĐẦU CẬP NHẬT {typeof(T).Name} ===");
                Console.WriteLine($"Entity: {entity?.ToString()}");

                // Tìm primary key của entity để so sánh
                var keyProperty = _context.Model.FindEntityType(typeof(T))?.FindPrimaryKey()?.Properties?.FirstOrDefault();
                if (keyProperty == null)
                {
                    throw new InvalidOperationException($"Không tìm thấy primary key cho entity {typeof(T).Name}");
                }

                var keyValue = keyProperty.PropertyInfo?.GetValue(entity);
                if (keyValue == null)
                {
                    throw new InvalidOperationException($"Primary key value là null cho entity {typeof(T).Name}");
                }

                Console.WriteLine($"Primary key: {keyProperty.Name}, Value: {keyValue}");

                // Kiểm tra xem entity có đang được track không
                var existingEntry = _context.ChangeTracker.Entries<T>()
                    .FirstOrDefault(e => keyProperty.PropertyInfo?.GetValue(e.Entity)?.Equals(keyValue) == true);

                if (existingEntry != null)
                {
                    Console.WriteLine($"Tìm thấy entity đang được track, detach entity cũ...");
                    existingEntry.State = EntityState.Detached;
                }

                // Attach entity mới và set state thành Modified
                var entry = _context.Attach(entity);
                entry.State = EntityState.Modified;

                Console.WriteLine($"Entity state set to Modified. Calling SaveChangesAsync...");
                var result = await _context.SaveChangesAsync();

                Console.WriteLine($"=== CẬP NHẬT THÀNH CÔNG ===");
                Console.WriteLine($"Affected rows: {result}");
                Console.WriteLine($"=========================");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== LỖI KHI CẬP NHẬT {typeof(T).Name} ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                if (entity != null)
                {
                    try
                    {
                        Console.WriteLine($"Entity state: {_context.Entry(entity).State}");
                    }
                    catch
                    {
                        Console.WriteLine("Không thể lấy entity state");
                    }
                }
                Console.WriteLine($"================================");
                throw;
            }
        }

        public async Task DeleteAsync(T entity)
        {
            _context.Set<T>().Remove(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<int> CountAsync(Expression<Func<T, bool>> predicate = null)
        {
            if (predicate == null)
                return await _context.Set<T>().CountAsync();

            return await _context.Set<T>().Where(predicate).CountAsync();
        }

        public async Task<IDbContextTransaction> BeginTransactionAsync()
        {
            return await _context.Database.BeginTransactionAsync();
        }
    }
}
