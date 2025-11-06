import type { Patient, VitalSigns, Ward, VitalSignsInjectionRequest } from '../types/hospital';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const FETCH_TIMEOUT = 15000; // 15 second timeout (cold start can take 10-30s, so generous)

/**
 * Hospital API Service
 * Handles all REST API calls to the backend
 */

/**
 * Wrapper for fetch with timeout to prevent hanging on slow API
 */
function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

export const hospitalApi = {
  /**
   * Fetch all patients with their latest vital signs
   */
  async getPatients(wardId?: string): Promise<Patient[]> {
    const url = wardId
      ? `${API_BASE_URL}/patients?wardId=${wardId}`
      : `${API_BASE_URL}/patients`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Fetch all wards
   */
  async getWards(): Promise<Ward[]> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wards`);
    if (!response.ok) {
      throw new Error(`Failed to fetch wards: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Fetch vital signs trend for a specific patient
   */
  async getPatientTrend(patientId: string, minutes: number = 240): Promise<VitalSigns[]> {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/patients/${patientId}/trend?minutes=${minutes}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch patient trend: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Manually inject vital signs (for testing tool)
   */
  async injectVitals(request: VitalSignsInjectionRequest): Promise<void> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vitals/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to inject vitals: ${response.statusText}`);
    }
  },
};

/**
 * Mock data for development/testing when backend is unavailable
 * This mirrors the exact structure returned by the backend API
 */
export const mockPatients: Patient[] = [
  {
    id: 'p1',
    mrn: 'MRN-001',
    name: 'John Doe',
    status: 'stable',
    admittedAt: new Date().toISOString(),
    bed: {
      id: 'b1',
      number: 'A-101',
      wardId: 'w1',
      status: 'occupied',
      ward: { id: 'w1', name: 'ICU', capacity: 10 },
    },
    vitalSigns: [
      {
        id: 'v1',
        patientId: 'p1',
        heartRate: 75,
        spO2: 98,
        bpSystolic: 120,
        bpDiastolic: 80,
        recordedAt: new Date().toISOString(),
      },
    ],
    alerts: [],
  },
  {
    id: 'p2',
    mrn: 'MRN-002',
    name: 'Jane Smith',
    status: 'watch',
    admittedAt: new Date().toISOString(),
    bed: {
      id: 'b2',
      number: 'A-102',
      wardId: 'w1',
      status: 'occupied',
      ward: { id: 'w1', name: 'ICU', capacity: 10 },
    },
    vitalSigns: [
      {
        id: 'v2',
        patientId: 'p2',
        heartRate: 115,
        spO2: 93,
        bpSystolic: 145,
        bpDiastolic: 92,
        recordedAt: new Date().toISOString(),
      },
    ],
    alerts: [],
  },
  {
    id: 'p3',
    mrn: 'MRN-003',
    name: 'Bob Critical',
    status: 'critical',
    admittedAt: new Date().toISOString(),
    bed: {
      id: 'b3',
      number: 'A-103',
      wardId: 'w1',
      status: 'occupied',
      ward: { id: 'w1', name: 'ICU', capacity: 10 },
    },
    vitalSigns: [
      {
        id: 'v3',
        patientId: 'p3',
        heartRate: 165,
        spO2: 86,
        bpSystolic: 185,
        bpDiastolic: 110,
        recordedAt: new Date().toISOString(),
      },
    ],
    alerts: [],
  },
];