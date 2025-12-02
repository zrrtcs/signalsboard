import { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Tooltip,
  Box,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  FiberManualRecord as StableIcon,
  Warning as CriticalIcon,
} from '@mui/icons-material';
import { useHospitalStore } from '../store/hospitalStore';
import { hospitalApi } from '../services/hospitalApi';

/** Available demo scenarios */
const DemoScenario = {
  Live: 'live',
  AllStable: 'all-stable',
  CriticalEmergency: 'critical-emergency',
} as const;

type DemoScenario = typeof DemoScenario[keyof typeof DemoScenario];

interface ScenarioConfig {
  id: DemoScenario;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: DemoScenario.Live,
    label: '🔄 Live Simulation',
    description: 'Normal simulator operation with random vital changes',
    icon: <PlayIcon fontSize="small" />,
    color: '#2196f3',
  },
  {
    id: DemoScenario.AllStable,
    label: '🟢 All Stable',
    description: 'Reset all patients to healthy vital signs',
    icon: <StableIcon fontSize="small" sx={{ color: '#4caf50' }} />,
    color: '#4caf50',
  },
  {
    id: DemoScenario.CriticalEmergency,
    label: '🔴 Critical Emergency',
    description: 'Trigger critical alert on one patient (low SpO₂ + high HR)',
    icon: <CriticalIcon fontSize="small" sx={{ color: '#f44336' }} />,
    color: '#f44336',
  },
];

/** Healthy vital signs for "All Stable" scenario */
const HEALTHY_VITALS = {
  heartRate: 75,
  spO2: 98,
  bpSystolic: 120,
  bpDiastolic: 80,
};

/** Critical vital signs for emergency scenario */
const CRITICAL_VITALS = {
  heartRate: 145,
  spO2: 84,
  bpSystolic: 180,
  bpDiastolic: 110,
};

/**
 * DemoScenarioSelector - Quick scenario selection for dashboard demonstration
 *
 * Allows quick demonstration of dashboard capabilities:
 * - Live: Normal simulator behavior
 * - All Stable: Reset all patients to healthy state
 * - Critical Emergency: Trigger alerts on one patient
 */
export function DemoScenarioSelector() {
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(DemoScenario.Live);
  const [loading, setLoading] = useState(false);
  const patientsMap = useHospitalStore(state => state.patients);

  const handleScenarioChange = async (event: SelectChangeEvent<DemoScenario>) => {
    const scenario = event.target.value as DemoScenario;
    setCurrentScenario(scenario);

    if (scenario === DemoScenario.Live) {
      // Live mode: disable injection mode for all patients
      await disableAllInjectionModes();
      return;
    }

    setLoading(true);
    try {
      const patients = Array.from(patientsMap.values());

      if (scenario === DemoScenario.AllStable) {
        // Reset all patients to healthy vitals
        for (const patient of patients) {
          await enableInjectionMode(patient.id);
          await hospitalApi.injectVitals({
            patientId: patient.id,
            ...HEALTHY_VITALS,
          });
        }
      } else if (scenario === DemoScenario.CriticalEmergency) {
        // First, stabilize all patients
        for (const patient of patients) {
          await enableInjectionMode(patient.id);
          await hospitalApi.injectVitals({
            patientId: patient.id,
            ...HEALTHY_VITALS,
          });
        }

        // Then make one patient critical
        const targetPatient = patients[0];
        if (targetPatient) {
          await hospitalApi.injectVitals({
            patientId: targetPatient.id,
            ...CRITICAL_VITALS,
          });
        }
      }
    } catch (error) {
      console.error('Failed to apply scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableInjectionMode = async (patientId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    await fetch(`${apiUrl}/simulator/patient/${patientId}/injection-mode?enabled=true`, {
      method: 'POST',
    });
  };

  const disableAllInjectionModes = async () => {
    setLoading(true);
    try {
      const patients = Array.from(patientsMap.values());
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

      for (const patient of patients) {
        await fetch(`${apiUrl}/simulator/patient/${patient.id}/injection-mode?enabled=false`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Failed to disable injection modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = SCENARIOS.find(s => s.id === currentScenario);

  return (
    <Tooltip title={currentConfig?.description || ''} arrow placement="bottom">
      <Box sx={{ minWidth: 180, mr: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel
            id="demo-scenario-label"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-focused': { color: currentConfig?.color },
            }}
          >
            Demo Mode
          </InputLabel>
          <Select
            labelId="demo-scenario-label"
            value={currentScenario}
            onChange={handleScenarioChange}
            label="Demo Mode"
            disabled={loading}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: currentConfig?.color,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: currentConfig?.color,
              },
              '.MuiSvgIcon-root': {
                color: 'white',
              },
            }}
            startAdornment={
              loading ? (
                <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
              ) : null
            }
          >
            {SCENARIOS.map((scenario) => (
              <MenuItem key={scenario.id} value={scenario.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {scenario.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Tooltip>
  );
}
