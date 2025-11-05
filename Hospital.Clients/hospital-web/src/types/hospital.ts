/**
 * TypeScript type definitions for Hospital Dashboard
 * Mirrors backend domain entities for type-safe client-server communication
 */

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type PatientStatus = 'stable' | 'watch' | 'critical';

export interface Ward {
  id: string;
  name: string;
  capacity: number;
}

export interface Bed {
  id: string;
  number: string;
  wardId: string;
  status: string;
  ward?: Ward;
}

export interface VitalSigns {
  id: string;
  patientId: string;
  heartRate?: number;
  spO2?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  temperature?: number;
  recordedAt: string; // ISO 8601 timestamp
  recordedBy?: string;
}

export interface Alert {
  id: string;
  patientId: string;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  bedId?: string;
  status: PatientStatus;
  admittedAt: string;
  attendingPhysician?: string;
  primaryDiagnosis?: string;
  injectionModeEnabled?: boolean; // ← Database persisted state
  nurseAttending?: boolean; // ← Database persisted state

  // Navigation properties
  bed?: Bed;
  vitalSigns: VitalSigns[];
  alerts: Alert[];
}

/**
 * SignalR real-time update DTOs
 * Note: SignalR automatically converts C# PascalCase to JavaScript camelCase
 */

export interface VitalSignsUpdate {
  patientId: string;
  patientName: string;
  bed?: string;
  ward?: string;
  heartRate?: number;
  spO2?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  alertSeverity: AlertSeverity;
  recordedAt: string;
}

export interface AlertNotification {
  alertId: string;
  patientId: string;
  patientName: string;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: string;
}

export interface NurseAttendingChange {
  patientId: string;
  patientName: string;
  nurseAttending: boolean;
  changedAt: string;
}

/**
 * API Request/Response types
 */

export interface VitalSignsInjectionRequest {
  patientId: string;
  heartRate?: number;
  spO2?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
}

/**
 * Connection status for SignalR
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

/**
 * Utility type for patient with latest vitals
 */
export interface PatientWithLatestVitals extends Patient {
  latestVitals?: VitalSigns;
  riskLevel: AlertSeverity;
}