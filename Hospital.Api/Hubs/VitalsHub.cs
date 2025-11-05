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

    /// <summary>
    /// Broadcasts injection mode toggle to all connected clients.
    /// Ensures all browsers sync when one client toggles injection mode.
    /// </summary>
    Task ReceiveInjectionModeChange(InjectionModeChange change);

    /// <summary>
    /// Broadcasts nurse attending status change to all connected clients.
    /// Ensures all browsers sync when nurse attends/leaves patient.
    /// </summary>
    Task ReceiveNurseAttendingChange(NurseAttendingChange change);
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

/// <summary>
/// DTO for injection mode changes sent via SignalR.
/// Broadcast to all clients when injection mode is toggled.
/// </summary>
public record InjectionModeChange(
    string PatientId,
    string PatientName,
    bool InjectionModeEnabled,
    DateTime ChangedAt
);

/// <summary>
/// DTO for nurse attending status changes sent via SignalR.
/// Broadcast to all clients when nurse attending status changes.
/// </summary>
public record NurseAttendingChange(
    string PatientId,
    string PatientName,
    bool NurseAttending,
    DateTime ChangedAt
);
