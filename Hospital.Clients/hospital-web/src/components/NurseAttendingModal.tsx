import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useHospitalStore } from '../store/hospitalStore';
import { useAudioAlert } from '../hooks/useAudioAlert';
import { hospitalApi } from '../services/hospitalApi';
import type { Patient, VitalSignsInjectionRequest } from '../types/hospital';

interface NurseAttendingModalProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

export function NurseAttendingModal({ patient, open, onClose }: NurseAttendingModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNurseAttending, setIsNurseAttending] = useState(false);
  const [togglingInjectionMode, setTogglingInjectionMode] = useState(false);

  // Store actions for managing nurse attending state
  const setNurseAttending = useHospitalStore(state => state.setNurseAttending);
  const storeOriginalMuteState = useHospitalStore(state => state.storeOriginalMuteState);
  const getOriginalMuteState = useHospitalStore(state => state.getOriginalMuteState);
  const toggleInjectionModeInStore = useHospitalStore(state => state.toggleInjectionMode);

  // Audio alert hook
  const { togglePatientMute, isPatientMuted } = useAudioAlert();

  // Form state for vital signs injection
  const [formData, setFormData] = useState({
    heartRate: '',
    spO2: '',
    bpSystolic: '',
    bpDiastolic: '',
  });

  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleClose = () => {
    // If nurse was attending, restore original mute state
    if (isNurseAttending) {
      const originalMuteState = getOriginalMuteState(patient.id);
      const currentMuteState = isPatientMuted(patient.id);

      // Only toggle if states differ
      if (originalMuteState !== undefined && originalMuteState !== currentMuteState) {
        togglePatientMute(patient.id);
      }

      // Clear nurse attending state
      setNurseAttending(undefined);
    }

    setSuccessMessage(null);
    setErrorMessage(null);
    setFormData({
      heartRate: '',
      spO2: '',
      bpSystolic: '',
      bpDiastolic: '',
    });
    setIsNurseAttending(false);
    onClose();
  }

  const handleToggleNurseAttending = () => {
    const newAttendingState = !isNurseAttending;
    setIsNurseAttending(newAttendingState);

    if (newAttendingState) {
      // Starting nurse attending: store original mute state and mute patient
      const currentMuteState = isPatientMuted(patient.id);
      storeOriginalMuteState(patient.id, currentMuteState);
      setNurseAttending(patient.id);

      // Mute the patient while nurse is attending
      if (!currentMuteState) {
        // Only mute if not already muted
        togglePatientMute(patient.id);
      }

      setSuccessMessage(`👨‍⚕️ Nurse attending ${patient.name}. Patient audio muted during attendance.`);
    } else {
      // Stopping nurse attending: restore original mute state
      const originalMuteState = getOriginalMuteState(patient.id);
      const currentMuteState = isPatientMuted(patient.id);

      if (originalMuteState !== undefined && originalMuteState !== currentMuteState) {
        togglePatientMute(patient.id);
      }

      setNurseAttending(undefined);
      setSuccessMessage(`✓ Nurse finished attending. Audio restored to previous state.`);
    }
  };

  const validateForm = () => {
    // At least one vital should be provided
    const hasData = formData.heartRate || formData.spO2 || formData.bpSystolic || formData.bpDiastolic;
    if (!hasData) {
      setErrorMessage('Please enter at least one vital sign or leave empty to keep current values');
      return false;
    }

    // Validate heart rate range (30-200 BPM)
    if (formData.heartRate) {
      const hr = parseInt(formData.heartRate, 10);
      if (isNaN(hr) || hr < 30 || hr > 200) {
        setErrorMessage('❌ Heart Rate must be between 30-200 BPM');
        return false;
      }
    }

    // Validate SpO2 range (0-100%)
    if (formData.spO2) {
      const spo2 = parseInt(formData.spO2, 10);
      if (isNaN(spo2) || spo2 < 0 || spo2 > 100) {
        setErrorMessage('❌ SpO₂ must be between 0-100%');
        return false;
      }
    }

    // Validate BP Systolic range (50-250 mmHg)
    if (formData.bpSystolic) {
      const bpSys = parseInt(formData.bpSystolic, 10);
      if (isNaN(bpSys) || bpSys < 50 || bpSys > 250) {
        setErrorMessage('❌ BP Systolic must be between 50-250 mmHg');
        return false;
      }
    }

    // Validate BP Diastolic range (30-150 mmHg)
    if (formData.bpDiastolic) {
      const bpDia = parseInt(formData.bpDiastolic, 10);
      if (isNaN(bpDia) || bpDia < 30 || bpDia > 150) {
        setErrorMessage('❌ BP Diastolic must be between 30-150 mmHg');
        return false;
      }
    }

    // Validate logical relationship: Systolic should be >= Diastolic
    if (formData.bpSystolic && formData.bpDiastolic) {
      const bpSys = parseInt(formData.bpSystolic, 10);
      const bpDia = parseInt(formData.bpDiastolic, 10);
      if (!isNaN(bpSys) && !isNaN(bpDia) && bpSys < bpDia) {
        setErrorMessage('❌ BP Systolic must be ≥ Diastolic');
        return false;
      }
    }

    return true;
  };

  const handleToggleInjectionMode = async (enabled: boolean) => {
    setTogglingInjectionMode(true);
    setErrorMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const response = await fetch(
        `${apiUrl}/simulator/patient/${patient.id}/injection-mode?enabled=${enabled}`,
        { method: 'POST' }
      );

      if (response.ok) {
        toggleInjectionModeInStore(patient.id, enabled);
        console.log(`Injection mode ${enabled ? 'ENABLED' : 'DISABLED'} for ${patient.name}`);
      } else {
        setErrorMessage('Failed to toggle injection mode');
      }
    } catch (error) {
      console.error('Error toggling injection mode:', error);
      setErrorMessage('Failed to toggle injection mode');
    } finally {
      setTogglingInjectionMode(false);
    }
  };

  const handleInjectVitals = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Auto-enable injection mode if not already enabled
      if (!patient.injectionModeEnabled) {
        await handleToggleInjectionMode(true);
      }

      const request: VitalSignsInjectionRequest = {
        patientId: patient.id,
        heartRate: formData.heartRate ? parseInt(formData.heartRate, 10) : undefined,
        spO2: formData.spO2 ? parseInt(formData.spO2, 10) : undefined,
        bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic, 10) : undefined,
        bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic, 10) : undefined,
      };

      await hospitalApi.injectVitals(request);

      setSuccessMessage(`✓ Vitals injected for ${patient.name}. Dashboard updating in real-time.`);

      // Clear form after successful injection
      setFormData({
        heartRate: '',
        spO2: '',
        bpSystolic: '',
        bpDiastolic: '',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to inject vitals';
      setErrorMessage(errorMsg);
      console.error('Injection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestVitals = Array.isArray(patient.vitalSigns) && patient.vitalSigns.length > 0
    ? patient.vitalSigns[0]
    : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>👨‍⚕️ Nurse Attending: {patient.name}</span>
        <Button
          size="small"
          onClick={handleClose}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {/* Patient Info */}
          <Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`MRN: ${patient.mrn}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Bed: ${patient.bed?.number || 'No Bed'}`}
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

          {/* Success Alert */}
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {/* Current Vitals Display */}
          {latestVitals && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Current vitals:
              </Typography>
              <div style={{ fontSize: '0.875rem' }}>
                HR: {latestVitals.heartRate || '--'} BPM |
                SpO₂: {latestVitals.spO2 || '--'}% |
                BP: {latestVitals.bpSystolic || '--'}/{latestVitals.bpDiastolic || '--'} mmHg
              </div>
            </Box>
          )}

          {/* Nurse Attending Toggle */}
          <Box sx={{ p: 1.5, bgcolor: '#66bb6a', borderRadius: 1, border: '1px solid #81c784' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isNurseAttending}
                  onChange={handleToggleNurseAttending}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#1b4d2e',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#1b4d2e',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#000' }}>
                  {isNurseAttending ? '👨‍⚕️ Nurse Attending (Audio Muted)' : 'Toggle Nurse Attending'}
                </Typography>
              }
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#1a3a24', fontWeight: 500 }}>
              {isNurseAttending
                ? 'Patient audio is muted while you attend. It will be restored when you finish.'
                : 'Toggle to start attending this patient.'}
            </Typography>
          </Box>

          {/* Injection Mode Status + Toggle */}
          <Box sx={{ p: 1.5, bgcolor: patient.injectionModeEnabled ? '#fff3e0' : '#f5f5f5', borderRadius: 1, border: `1px solid ${patient.injectionModeEnabled ? '#ffb74d' : '#ccc'}` }}>
            <FormControlLabel
              control={
                <Switch
                  checked={patient.injectionModeEnabled ?? false}
                  onChange={(e) => handleToggleInjectionMode(e.target.checked)}
                  disabled={togglingInjectionMode || loading}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#ff9800',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#ff9800',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: patient.injectionModeEnabled ? '#e65100' : '#666' }}>
                  {patient.injectionModeEnabled ? '💉 Injection Mode: ON' : '💉 Injection Mode: OFF'}
                </Typography>
              }
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: patient.injectionModeEnabled ? '#b71c1c' : '#666', fontWeight: 500 }}>
              {patient.injectionModeEnabled
                ? 'Simulator uses injected vitals as baseline with realistic drift.'
                : 'Enable to inject vitals. Will auto-enable when you inject.'}
            </Typography>
          </Box>

          {/* Vital Signs Input Fields */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                💉 Inject Vital Signs (optional)
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({
                    heartRate: '75',
                    spO2: '98',
                    bpSystolic: '120',
                    bpDiastolic: '80',
                  })}
                  sx={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  Healthy
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData({
                    heartRate: '',
                    spO2: '',
                    bpSystolic: '',
                    bpDiastolic: '',
                  })}
                  sx={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  Clear
                </Button>
              </Stack>
            </Box>

            <TextField
              label="Heart Rate (BPM)"
              type="number"
              value={formData.heartRate}
              onChange={handleInputChange('heartRate')}
              disabled={loading}
              placeholder="e.g., 120"
              inputProps={{ min: 0, max: 200 }}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />

            <TextField
              label="SpO₂ (%)"
              type="number"
              value={formData.spO2}
              onChange={handleInputChange('spO2')}
              disabled={loading}
              placeholder="e.g., 95"
              inputProps={{ min: 0, max: 100 }}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />

            <TextField
              label="BP Systolic (mmHg)"
              type="number"
              value={formData.bpSystolic}
              onChange={handleInputChange('bpSystolic')}
              disabled={loading}
              placeholder="e.g., 140"
              inputProps={{ min: 0, max: 250 }}
              size="small"
              fullWidth
              sx={{ mb: 1 }}
            />

            <TextField
              label="BP Diastolic (mmHg)"
              type="number"
              value={formData.bpDiastolic}
              onChange={handleInputChange('bpDiastolic')}
              disabled={loading}
              placeholder="e.g., 90"
              inputProps={{ min: 0, max: 150 }}
              size="small"
              fullWidth
            />
          </Box>

          {/* Info Text */}
          <Box sx={{ p: 1.5, bgcolor: 'info.dark', borderRadius: 1 }}>
            <span style={{ fontSize: '0.875rem', color: '#90caf9' }}>
              💡 Tip: Leave fields empty to keep current values. Vitals will be broadcast to dashboard in real-time via SignalR.
            </span>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Close
        </Button>
        <Button
          onClick={handleInjectVitals}
          disabled={loading || !formData.heartRate && !formData.spO2 && !formData.bpSystolic && !formData.bpDiastolic}
          variant="contained"
          color="secondary"
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Injecting...' : 'Inject Vitals'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
