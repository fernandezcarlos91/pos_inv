using Microsoft.EntityFrameworkCore;
using PosBackend.Models;

namespace PosBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<DetalleVenta> DetallesVenta => Set<DetalleVenta>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("productos");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Nombre).IsRequired();
            entity.Property(p => p.CodigoBarras).IsRequired();
            entity.HasIndex(p => p.CodigoBarras).IsUnique();
        });

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("ventas");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.FormaPago).IsRequired().HasMaxLength(50);
            entity.Property(v => v.Fecha).HasColumnType("timestamp with time zone");
            entity.Property(v => v.TotalBruto).HasPrecision(18, 2);
            entity.Property(v => v.Descuento).HasPrecision(18, 2).HasDefaultValue(0m);
            entity.Property(v => v.Total).HasPrecision(18, 2);
            entity.Property(v => v.MotivoDescuento).HasMaxLength(250);
            entity.HasMany(v => v.Detalles)
                .WithOne(d => d.Venta)
                .HasForeignKey(d => d.VentaId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(v => v.Usuario)
                .WithMany()
                .HasForeignKey(v => v.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DetalleVenta>(entity =>
        {
            entity.ToTable("detalle_ventas");
            entity.HasKey(d => d.Id);
            entity.HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("proveedores");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Nombre).IsRequired().HasMaxLength(150);
            entity.Property(p => p.Telefono).HasMaxLength(50);
            entity.Property(p => p.Email).HasMaxLength(100);
            entity.Property(p => p.Direccion).HasMaxLength(250);
            entity.Property(p => p.RutIdentificacion).HasMaxLength(50);
            entity.Property(p => p.FechaRegistro).HasColumnType("timestamp with time zone");
        });
    }
}
