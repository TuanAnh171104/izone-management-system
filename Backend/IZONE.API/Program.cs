using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using IZONE.Infrastructure.Data;
using IZONE.Infrastructure.Repositories;
using IZONE.Infrastructure.Services;
using IZONE.Core.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add DbContext
builder.Services.AddDbContext<IZONEDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add repositories
builder.Services.AddScoped<ITaiKhoanRepository, TaiKhoanRepository>();
builder.Services.AddScoped<IHocVienRepository, HocVienRepository>();
builder.Services.AddScoped<IGiangVienRepository, GiangVienRepository>();
builder.Services.AddScoped<IKhoaHocRepository, KhoaHocRepository>();
builder.Services.AddScoped<ILopHocRepository, LopHocRepository>();
builder.Services.AddScoped<ILopHocService, LopHocService>();
builder.Services.AddScoped<IThongBaoRepository, ThongBaoRepository>();
builder.Services.AddScoped<IDiaDiemRepository, DiaDiemRepository>();
builder.Services.AddScoped<IDangKyLopRepository, DangKyLopRepository>();
builder.Services.AddScoped<IThanhToanRepository, ThanhToanRepository>();
builder.Services.AddScoped<IViHocVienRepository, ViHocVienRepository>();
builder.Services.AddScoped<IBaoLuuRepository, BaoLuuRepository>();
builder.Services.AddScoped<IBuoiHocRepository, BuoiHocRepository>();
builder.Services.AddScoped<IDiemDanhRepository, DiemDanhRepository>();
builder.Services.AddScoped<IDiemSoRepository, DiemSoRepository>();
builder.Services.AddScoped<IChiPhiRepository, ChiPhiRepository>();
builder.Services.AddScoped<IChiPhiImportService, ChiPhiImportService>();
builder.Services.AddScoped<IThueMatBangRepository, ThueMatBangRepository>();
builder.Services.AddScoped<IBaoCaoRepository, BaoCaoRepository>();
builder.Services.AddScoped<IBaoCaoService, BaoCaoService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://localhost:3004",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:3002",
                "http://127.0.0.1:3003",
                "http://127.0.0.1:3004"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Add Authentication (temporarily disabled for debugging)
// builder.Services.AddAuthentication(options =>
// {
//     options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
// })
// .AddJwtBearer(options =>
// {
//     options.TokenValidationParameters = new TokenValidationParameters
//     {
//         ValidateIssuer = false,
//         ValidateAudience = false,
//         ValidateLifetime = true,
//         ValidateIssuerSigningKey = true,
//         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("your-secret-key-here"))
//     };
// });

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IZONE.API", Version = "v1" });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "IZONE.API v1"));
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowReactApp");

// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();
