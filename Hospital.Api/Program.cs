using Microsoft.EntityFrameworkCore;
using Hospital.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add PostgreSQL Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<HospitalDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Apply EF migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HospitalDbContext>();

    // Apply pending migrations
    context.Database.Migrate();

    // Development-only sample data seeding
    // TODO: Implement SeedDevelopmentData method for:
    // - Sample wards (ICU, Emergency, General Medicine, Pediatrics)
    // - Mock patients with realistic names and MRNs
    // - Generated vital signs with varying severities for dashboard testing
    // - Alert scenarios (critical HR, low SpO2, high BP) for UI validation
    // - Staff assignments across different shifts and roles
    // - Bed occupancy patterns for realistic ward visualization
    // if (app.Environment.IsDevelopment())
    // {
    //     await SeedDevelopmentData(context);
    // }
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetW  1. Installing EF CLI tools globally\n  2. Adding PostgreSQL packages to Hospital.Api\n  3. Creating the EF entities in Hospital.ContractseatherForecast")
.WithOpenApi();

app.MapHealthChecks("/health");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
