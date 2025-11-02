using Microsoft.AspNetCore.SignalR;
using Signalsboard.Hospital.Api.Domain;

namespace Signalsboard.Hospital.Api.Hubs;

/// <summary>
/// SignalR Hub for broadcasting real-time vital signs updates to connected clients.
/// Uses WebSocket with automatic long-polling fallback for maximum compatibility.
/// </summary>
public class VitalsHub : Hub<IVitalsClient>
{
    private readonly ILogger<VitalsHub> _logger;

    public VitalsHub(ILogger<VitalsHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Client connects to the hub.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Client disconnects from the hub.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Subscribe client to updates for a specific patient.
    /// Clients in the same group receive targeted broadcasts.
    /// </summary>
    /// <param name="patientId">Patient ID to subscribe to</param>
    public async Task SubscribeToPatient(string patientId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"patient-{patientId}");
        _logger.LogInformation("Client {ConnectionId} subscribed to patient {PatientId}",
            Context.ConnectionId, patientId);
    }

    /// <summary>
    /// Unsubscribe client from patient updates.
    /// </summary>
    /// <param name="patientId">Patient ID to unsubscribe from</param>
    public async Task UnsubscribeFromPatient(string patientId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"patient-{patientId}");
        _logger.LogInformation("Client {ConnectionId} unsubscribed from patient {PatientId}",
            Context.ConnectionId, patientId);
    }
}

/// <summary>
/// Strongly-typed client interface for SignalR messages.
/// Ensures type safety when broadcasting from server to clients.
/// </summary>
public interface IVitalsClient
{
    /// <summary>
    /// Broadcasts vital signs update to all connected clients.
    /// </summary>
    Task ReceiveVitalUpdate(VitalSignsUpdate update);

    /// <summary>
    /// Broadcasts alert generation to all connected clients.
    /// </summary>
    Task ReceiveAlert(AlertNotification alert);
}

/// <summary>
/// DTO for vital signs updates sent via SignalR.
/// Includes patient context and latest vitals.
/// </summary>
public record VitalSignsUpdate(
    string PatientId,
    string PatientName,
    string? Bed,
    string? Ward,
    int? HeartRate,
    int? SpO2,
    int? BpSystolic,
    int? BpDiastolic,
    string AlertSeverity,
    DateTime RecordedAt
);

/// <summary>
/// DTO for alert notifications sent via SignalR.
/// </summary>
public record AlertNotification(
    string AlertId,
    string PatientId,
    string PatientName,
    string AlertType,
    string Severity,
    string Message,
    DateTime TriggeredAt
);
