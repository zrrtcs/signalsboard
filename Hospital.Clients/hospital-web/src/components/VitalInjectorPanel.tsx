import { useState, useMemo } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Healing as HealingIcon } from '@mui/icons-material';
import { useHospitalStore } from '../store/hospitalStore';
import { hospitalApi } from '../services/hospitalApi';
import type { VitalSignsInjectionRequest } from '../types/hospital';

/**
 * VitalInjectorPanel - Testing tool for manual vital signs injection
 *
 * Allows recruiters to:
 * 1. Select a patient from dropdown
 * 2. Input vital signs values (HR, SpO2, BP)
 * 3. Submit to backend → database → SignalR broadcast → dashboard update
 *
 * Demonstrates full stack integration in real-time
 */
export function VitalInjectorPanel() {
  const patientsMap = useHospitalStore(state => state.patients);

  // Memoize the patients array to avoid infinite re-renders
  // (Array.from creates new reference each time if done in selector)
  const patients = useMemo(() => Array.from(patientsMap.values()), [patientsMap]);

  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    heartRate: '',
    spO2: '',
    bpSystolic: '',
    bpDiastolic: '',
  });

  const [criticalMode, setCriticalMode] = useState<'none' | 'hr' | 'spo2' | 'bp'>('none');

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPatientId('');
    setFormData({
      heartRate: '',
      spO2: '',
      bpSystolic: '',
      bpDiastolic: '',
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePatientChange = (event: any) => {
    setSelectedPatientId(event.target.value);
  };

  const handleMakeCritical = () => {
    // Auto-fill critical values based on selected category
    const criticalValues = {
      heartRate: '135', // >= 130 is critical
      spO2: '85',       // < 88 is critical
      bpSystolic: '185', // >= 180 is critical
      bpDiastolic: '112', // >= 110 is critical
    };

    switch (criticalMode) {
      case 'hr':
        setFormData({ ...criticalValues, spO2: '97', bpSystolic: '125', bpDiastolic: '80' });
        break;
      case 'spo2':
        setFormData({ ...criticalValues, heartRate: '85', bpSystolic: '125', bpDiastolic: '80' });
        break;
      case 'bp':
        setFormData({ ...criticalValues, heartRate: '85', spO2: '97' });
        break;
      default:
        return;
    }

    setSuccessMessage(`🔴 Critical ${criticalMode.toUpperCase()} values loaded! Toggle injection mode ON, then inject.`);
  };

  const validateForm = () => {
    if (!selectedPatientId) {
      setErrorMessage('Please select a patient');
      return false;
    }

    // At least one vital should be provided
    const hasData = formData.heartRate || formData.spO2 || formData.bpSystolic || formData.bpDiastolic;
    if (!hasData) {
      setErrorMessage('Please enter at least one vital sign');
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

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    try {
      setLoading(true);

      const request: VitalSignsInjectionRequest = {
        patientId: selectedPatientId,
        heartRate: formData.heartRate ? parseInt(formData.heartRate, 10) : undefined,
        spO2: formData.spO2 ? parseInt(formData.spO2, 10) : undefined,
        bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic, 10) : undefined,
        bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic, 10) : undefined,
      };

      await hospitalApi.injectVitals(request);

      const patientName = patients.find(p => p.id === selectedPatientId)?.name || 'Patient';
      setSuccessMessage(`✓ Vitals injected for ${patientName}. Check the dashboard update!`);

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to inject vitals';
      setErrorMessage(errorMsg);
      console.error('Injection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="inject vitals"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        <HealingIcon />
      </Fab>

      {/* Dialog Form */}
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
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          💉 Inject Vital Signs (Testing Tool)
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
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

            {/* Patient Selector */}
            <FormControl fullWidth>
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={selectedPatientId}
                onChange={handlePatientChange}
                label="Select Patient"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>-- Choose a patient --</em>
                </MenuItem>
                {patients.map(patient => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name} ({patient.mrn}) - Bed {patient.bed?.number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Current Vitals Display */}
            {selectedPatient && selectedPatient.vitalSigns?.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Current vitals:
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  HR: {selectedPatient.vitalSigns[0]?.heartRate || '--'} |
                  SpO₂: {selectedPatient.vitalSigns[0]?.spO2 || '--'}% |
                  BP: {selectedPatient.vitalSigns[0]?.bpSystolic || '--'}/{selectedPatient.vitalSigns[0]?.bpDiastolic || '--'}
                </div>
              </Box>
            )}

            {/* Make Critical Feature */}
            <Box sx={{ p: 1.5, bgcolor: '#ff9800', borderRadius: 1, border: '1px solid #ffb300' }}>
              <div style={{ fontSize: '0.875rem', color: '#000', fontWeight: 600, marginBottom: '8px' }}>
                🔴 Quick Test: Make Patient CRITICAL
              </div>
              <Stack spacing={1} direction="row">
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Select Vital</InputLabel>
                  <Select
                    value={criticalMode}
                    onChange={(e) => setCriticalMode(e.target.value as any)}
                    label="Select Vital"
                    disabled={loading}
                  >
                    <MenuItem value="none">-- Choose --</MenuItem>
                    <MenuItem value="hr">Heart Rate (≥130 BPM)</MenuItem>
                    <MenuItem value="spo2">SpO₂ (&lt;88%)</MenuItem>
                    <MenuItem value="bp">Blood Pressure (≥180/110)</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  onClick={handleMakeCritical}
                  variant="contained"
                  color="error"
                  size="small"
                  disabled={loading || criticalMode === 'none'}
                  sx={{
                    whiteSpace: 'nowrap',
                    '&.Mui-disabled': {
                      backgroundColor: '#cc5555',
                      color: '#fff',
                      opacity: 0.6,
                    },
                  }}
                >
                  Load Critical
                </Button>
              </Stack>
            </Box>

            {/* Vital Signs Input Fields */}
            <TextField
              label="Heart Rate (BPM)"
              type="number"
              value={formData.heartRate}
              onChange={handleInputChange('heartRate')}
              disabled={loading}
              placeholder="e.g., 120"
              inputProps={{ min: 0, max: 200 }}
              size="small"
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
            />

            {/* Info Text */}
            <Box sx={{ p: 1.5, bgcolor: 'info.dark', borderRadius: 1 }}>
              <span style={{ fontSize: '0.875rem', color: '#90caf9' }}>
                💡 Tip: Leave fields empty to keep current values. SignalR will broadcast updates instantly to the dashboard.
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
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Injecting...' : 'Inject Vitals'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}