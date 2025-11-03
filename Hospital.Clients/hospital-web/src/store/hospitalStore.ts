import { create } from 'zustand';
import type { Patient, Alert, ConnectionStatus, VitalSignsUpdate, AlertNotification } from '../types/hospital';

/**
 * Hospital Dashboard State Management
 * Uses Zustand for lightweight, performant state management
 */

interface HospitalState {
  // Patient data (keyed by ID for O(1) updates)
  patients: Map<string, Patient>;

  // Active alerts across all patients
  alerts: Alert[];

  // SignalR connection status
  connectionStatus: ConnectionStatus;
  lastHeartbeat?: Date;

  // UI State
  selectedWardId?: string;
  showAlertsOnly: boolean;
  selectedPatientId?: string; // For trend chart modal

  // Actions
  setPatients: (patients: Patient[]) => void;
  updatePatientVitals: (update: VitalSignsUpdate) => void;
  addAlert: (alert: AlertNotification) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSelectedWard: (wardId?: string) => void;
  setShowAlertsOnly: (show: boolean) => void;
  setSelectedPatient: (patientId?: string) => void;
  acknowledgeAlert: (alertId: string) => void;
}

export const useHospitalStore = create<HospitalState>((set) => ({
  patients: new Map(),
  alerts: [],
  connectionStatus: 'disconnected',
  showAlertsOnly: false,

  setPatients: (patients) => set({
    patients: new Map(patients.map(p => [p.id, p]))
  }),

  updatePatientVitals: (update) => set((state) => {
    const patients = new Map(state.patients);
    const patient = patients.get(update.patientId);

    if (patient) {
      // Create new vital signs entry
      const newVitals = {
        id: crypto.randomUUID(),
        patientId: update.patientId,
        heartRate: update.heartRate,
        spO2: update.spO2,
        bpSystolic: update.bpSystolic,
        bpDiastolic: update.bpDiastolic,
        recordedAt: update.recordedAt,
      };

      // Ensure vitalSigns is always an array (API returns latestVitals object initially)
      const existingVitals = Array.isArray(patient.vitalSigns) ? patient.vitalSigns : [];

      // Update patient with new vitals (keep last 20 for sparkline)
      const updatedPatient = {
        ...patient,
        vitalSigns: [newVitals, ...existingVitals].slice(0, 20),
      };

      patients.set(update.patientId, updatedPatient);
    }

    return { patients };
  }),

  addAlert: (alertNotification) => set((state) => ({
    alerts: [{
      id: alertNotification.alertId,
      patientId: alertNotification.patientId,
      alertType: alertNotification.alertType,
      severity: alertNotification.severity,
      message: alertNotification.message,
      triggeredAt: alertNotification.triggeredAt,
      isActive: true,
    }, ...state.alerts].slice(0, 50) // Keep last 50 alerts
  })),

  setConnectionStatus: (status) => set({
    connectionStatus: status,
    lastHeartbeat: status === 'connected' ? new Date() : undefined
  }),

  setSelectedWard: (wardId) => set({ selectedWardId: wardId }),

  setShowAlertsOnly: (show) => set({ showAlertsOnly: show }),

  setSelectedPatient: (patientId) => set({ selectedPatientId: patientId }),

  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, isActive: false, acknowledgedAt: new Date().toISOString() }
        : alert
    )
  })),
}));

/**
 * Selectors for derived state
 */

export const selectFilteredPatients = (state: HospitalState): Patient[] => {
  let patients = Array.from(state.patients.values());

  // Filter by ward
  if (state.selectedWardId) {
    patients = patients.filter(p => p.bed?.wardId === state.selectedWardId);
  }

  // Filter by alerts only
  if (state.showAlertsOnly) {
    patients = patients.filter(p => {
      const vitalsList = Array.isArray(p.vitalSigns) ? p.vitalSigns : [];
      const latestVitals = vitalsList[0];
      if (!latestVitals) return false;

      // Consider patient in alert state if any vital is abnormal
      const hasAbnormalHR = latestVitals.heartRate && (latestVitals.heartRate < 50 || latestVitals.heartRate > 120);
      const hasLowSpO2 = latestVitals.spO2 && latestVitals.spO2 < 94;
      const hasHighBP = latestVitals.bpSystolic && latestVitals.bpSystolic > 140;

      return hasAbnormalHR || hasLowSpO2 || hasHighBP;
    });
  }

  return patients.sort((a, b) => a.name.localeCompare(b.name));
};

export const selectActiveAlerts = (state: HospitalState): Alert[] => {
  return state.alerts.filter(a => a.isActive);
};

export const selectPatientAlerts = (patientId: string) => (state: HospitalState): Alert[] => {
  return state.alerts.filter(a => a.patientId === patientId && a.isActive);
};