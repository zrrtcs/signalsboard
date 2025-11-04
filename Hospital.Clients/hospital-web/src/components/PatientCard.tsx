import { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Stack, IconButton } from '@mui/material';
import {
  Favorite as HeartIcon,
  Air as O2Icon,
  TrendingUp as BPIcon,
  LocalHospital as BedIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import type { Patient, AlertSeverity } from '../types/hospital';
import { useHospitalStore } from '../store/hospitalStore';
import { VitalTrendsChart } from './VitalTrendsChart';
import { VitalSparkline } from './VitalSparkline';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const [togglingInjection, setTogglingInjection] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  // Read injection mode from patient object (database source of truth)
  // During toggle, Zustand store updates optimistically, but DB state is authoritative
  const injectionModeFromDB = patient.injectionModeEnabled ?? false;
  const injectionModeFromStore = useHospitalStore(state => state.injectionModeEnabled.get(patient.id) ?? false);
  // Use store value if it's been toggled (optimistic), otherwise use DB value
  const injectionModeEnabled = injectionModeFromStore !== injectionModeFromDB ? injectionModeFromStore : injectionModeFromDB;
  const toggleInjectionMode = useHospitalStore(state => state.toggleInjectionMode);

  const vitalsList = Array.isArray(patient.vitalSigns) ? patient.vitalSigns : [];
  const latestVitals = vitalsList[0];

  // Handle injection mode toggle
  const handleToggleInjection = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click
    setTogglingInjection(true);

    try {
      const newState = !injectionModeEnabled;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

      // Call backend API
      const response = await fetch(
        `${apiUrl}/simulator/patient/${patient.id}/injection-mode?enabled=${newState}`,
        { method: 'POST' }
      );

      if (response.ok) {
        // Update local state
        toggleInjectionMode(patient.id, newState);
        console.log(`Injection mode ${newState ? 'ENABLED' : 'DISABLED'} for ${patient.name}`);
      } else {
        console.error('Failed to toggle injection mode:', response.statusText);
      }
    } catch (error) {
      console.error('Error toggling injection mode:', error);
    } finally {
      setTogglingInjection(false);
    }
  };

  // Use patient.status from API as single source of truth (already computed by backend)
  const getSeverityFromStatus = (status: string): AlertSeverity => {
    switch (status.toLowerCase()) {
      case 'critical': return 'Critical';
      case 'watch': return 'High';
      default: return 'Low';
    }
  };

  const severity = getSeverityFromStatus(patient.status);

  const getBorderColor = () => {
    switch (severity) {
      case 'Critical': return '#f44336';
      case 'High': return '#ff9800';
      default: return '#4caf50';
    }
  };

  const getVitalColor = (value: number | undefined, low: number, high: number, critical: number) => {
    if (!value) return 'text.secondary';
    if (value < low || value > critical) return 'error.main';
    if (value > high) return 'warning.main';
    return 'success.main';
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `6px solid ${getBorderColor()}`,
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        } : {},
        animation: severity === 'Critical' ? 'pulse 2s ease-in-out infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { boxShadow: `0 0 0 0 ${getBorderColor()}40` },
          '50%': { boxShadow: `0 0 0 10px ${getBorderColor()}00` },
        },
      }}
    >
      <CardContent>
        {/* Patient Info */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" component="div" fontWeight={600}>
              {patient.name}
            </Typography>
            <IconButton
              size="small"
              onClick={handleToggleInjection}
              disabled={togglingInjection}
              sx={{
                color: injectionModeEnabled ? '#ff9800' : 'inherit',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: injectionModeEnabled ? '#ff6f00' : '#999',
                },
              }}
              title={injectionModeEnabled ? '💉 Injection Mode: ON' : '💉 Injection Mode: OFF'}
            >
              <SpeedIcon />
            </IconButton>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip
              icon={<BedIcon />}
              label={patient.bed?.number || 'No Bed'}
              size="small"
              variant="outlined"
            />
            <Chip
              label={patient.mrn}
              size="small"
              variant="outlined"
            />
            <Chip
              label={patient.status.toUpperCase()}
              size="small"
              color={patient.status === 'critical' ? 'error' : patient.status === 'watch' ? 'warning' : 'success'}
            />
          </Stack>
        </Box>

        {/* Vital Signs */}
        {latestVitals ? (
          <Stack spacing={1.5}>
            {/* Heart Rate */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HeartIcon sx={{ color: getVitalColor(latestVitals.heartRate, 50, 100, 130) }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                HR:
              </Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ color: getVitalColor(latestVitals.heartRate, 50, 100, 130) }}
              >
                {latestVitals.heartRate || '--'} <span style={{ fontSize: '0.8rem' }}>BPM</span>
              </Typography>
            </Box>

            {/* SpO2 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <O2Icon sx={{ color: getVitalColor(latestVitals.spO2, 88, 94, 100) }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                SpO₂:
              </Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ color: getVitalColor(latestVitals.spO2, 88, 94, 100) }}
              >
                {latestVitals.spO2 || '--'} <span style={{ fontSize: '0.8rem' }}>%</span>
              </Typography>
            </Box>

            {/* Blood Pressure */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BPIcon sx={{ color: getVitalColor(latestVitals.bpSystolic, 90, 140, 180) }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
                BP:
              </Typography>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ color: getVitalColor(latestVitals.bpSystolic, 90, 140, 180) }}
              >
                {latestVitals.bpSystolic || '--'}/{latestVitals.bpDiastolic || '--'}
                <span style={{ fontSize: '0.8rem' }}> mmHg</span>
              </Typography>
            </Box>

            {/* Last Updated */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Updated: {new Date(latestVitals.recordedAt).toLocaleTimeString()}
            </Typography>

            {/* Sparkline - Click to see full trends */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                4-hour Trend (HR)
              </Typography>
              <VitalSparkline patient={patient} onClick={() => setShowTrends(true)} />
            </Box>
          </Stack>
        ) : (
          <Typography color="text.secondary">No vital signs recorded</Typography>
        )}
      </CardContent>

      {/* Full Trends Chart in Drawer */}
      <VitalTrendsChart
        patientId={patient.id}
        patientName={patient.name}
        open={showTrends}
        onClose={() => setShowTrends(false)}
      />
    </Card>
  );
}