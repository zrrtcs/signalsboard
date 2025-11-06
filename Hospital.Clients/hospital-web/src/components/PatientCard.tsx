import { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Stack, IconButton } from '@mui/material';
import {
  Favorite as HeartIcon,
  Air as O2Icon,
  TrendingUp as BPIcon,
  LocalHospital as BedIcon,
  Speed as SpeedIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  LocalFlorist as NurseIcon,
} from '@mui/icons-material';
import type { Patient, AlertSeverity } from '../types/hospital';
import { useHospitalStore } from '../store/hospitalStore';
import { useAudioAlert } from '../hooks/useAudioAlert';
import { NurseAttendingModal } from './NurseAttendingModal';
import { VitalTrendsChart } from './VitalTrendsChart';
import { VitalSparkline } from './VitalSparkline';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const [togglingInjection, setTogglingInjection] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showNurseModal, setShowNurseModal] = useState(false);

  // Audio alert hook - manages critical event sounds and per-patient mute settings
  const { togglePatientMute, isPatientMuted } = useAudioAlert();
  const isMuted = isPatientMuted(patient.id);

  // Nurse attending state from store
  const nurseAttendingPatientId = useHospitalStore(state => state.nurseAttendingPatientId);
  const isNurseAttending = nurseAttendingPatientId === patient.id;

  // Read injection mode from patient object (database source of truth)
  // On page load, always trust the DB. Store is only for optimistic updates during toggle.
  // BUG FIX: Previous logic used store's false default instead of DB value on reload
  const injectionModeEnabled = patient.injectionModeEnabled ?? false;
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
    <>
      <Card
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          borderLeft: isNurseAttending ? '6px solid #66bb6a' : `6px solid ${getBorderColor()}`,
          transition: 'all 0.3s ease',
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          } : {},
          // When nurse attending: solid green glow
          ...(isNurseAttending && {
            boxShadow: '0 0 15px #66bb6a66, inset 0 0 10px #66bb6a20',
          }),
          // Critical status: pulsing border + outer glow (unless nurse attending)
          animation: !isNurseAttending && severity === 'Critical' ? 'criticalPulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes criticalPulse': {
            '0%, 100%': {
              borderLeft: `6px solid ${getBorderColor()}`,
              boxShadow: `0 0 0 0 ${getBorderColor()}60, inset 0 0 10px ${getBorderColor()}20`,
            },
            '50%': {
              borderLeft: `6px solid ${getBorderColor()}dd`,
              boxShadow: `0 0 0 12px ${getBorderColor()}00, inset 0 0 15px ${getBorderColor()}40`,
            },
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
            <Stack direction="row" spacing={0.5}>
              {/* Audio Mute Button - Visible for all, especially critical patients */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePatientMute(patient.id);
                }}
                sx={{
                  color: isMuted ? '#666' : 'inherit',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: isMuted ? '#999' : '#f44336',
                  },
                  ...(patient.status === 'critical' && isMuted && {
                    animation: 'pulse-mute 1.5s ease-in-out infinite',
                    '@keyframes pulse-mute': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                    },
                  }),
                }}
                title={isMuted ? '🔇 Audio Muted (Critical alert)' : '🔊 Audio Active'}
              >
                {isMuted ? <MuteIcon /> : <UnmuteIcon />}
              </IconButton>

              {/* Injection Mode Button */}
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

              {/* Nurse Attending Button */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNurseModal(true);
                }}
                sx={{
                  color: isNurseAttending ? '#66bb6a' : 'inherit',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: isNurseAttending ? '#81c784' : '#66bb6a',
                  },
                }}
                title={isNurseAttending ? '👨‍⚕️ Nurse Attending' : '👨‍⚕️ Call Nurse'}
              >
                <NurseIcon />
              </IconButton>
            </Stack>
          </Box>
            <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 0.5,
              flexWrap: 'wrap',
              gap: 1, // Add gap for better spacing when wrapping
            }}
            >
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
            <Chip
              label={injectionModeEnabled ? '💉 Injection: ON' : '💉 Injection: OFF'}
              size="small"
              variant="outlined"
              sx={{
              borderColor: injectionModeEnabled ? '#ff9800' : '#999',
              color: injectionModeEnabled ? '#ff9800' : '#999',
              fontWeight: 500,
              }}
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
                Vital Signs Trend (Last 15 readings)
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

      {/* Nurse Attending Modal */}
      <NurseAttendingModal
        patient={patient}
        open={showNurseModal}
        onClose={() => setShowNurseModal(false)}
      />
    </Card>
    </>
  );
}