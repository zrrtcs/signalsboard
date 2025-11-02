import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material';
import {
  Favorite as HeartIcon,
  Air as O2Icon,
  TrendingUp as BPIcon,
  LocalHospital as BedIcon,
} from '@mui/icons-material';
import type { Patient, AlertSeverity } from '../types/hospital';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const latestVitals = patient.vitalSigns[0];

  // Calculate alert severity from vitals
  const getVitalSeverity = (): AlertSeverity => {
    if (!latestVitals) return 'Low';

    const hrCritical = latestVitals.heartRate && (latestVitals.heartRate < 45 || latestVitals.heartRate >= 130);
    const spo2Critical = latestVitals.spO2 && latestVitals.spO2 < 88;
    const bpCritical = latestVitals.bpSystolic && latestVitals.bpSystolic >= 180;

    if (hrCritical || spo2Critical || bpCritical) return 'Critical';

    const hrHigh = latestVitals.heartRate && (latestVitals.heartRate < 55 || latestVitals.heartRate >= 110);
    const spo2High = latestVitals.spO2 && latestVitals.spO2 < 92;
    const bpHigh = latestVitals.bpSystolic && latestVitals.bpSystolic >= 160;

    if (hrHigh || spo2High || bpHigh) return 'High';

    const hrMed = latestVitals.heartRate && (latestVitals.heartRate >= 100);
    const spo2Med = latestVitals.spO2 && latestVitals.spO2 < 94;
    const bpMed = latestVitals.bpSystolic && latestVitals.bpSystolic >= 140;

    if (hrMed || spo2Med || bpMed) return 'Medium';

    return 'Low';
  };

  const severity = getVitalSeverity();

  const getBorderColor = () => {
    switch (severity) {
      case 'Critical': return '#f44336';
      case 'High': return '#ff9800';
      case 'Medium': return '#ff9800';
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
          <Typography variant="h6" component="div" fontWeight={600}>
            {patient.name}
          </Typography>
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
          </Stack>
        ) : (
          <Typography color="text.secondary">No vital signs recorded</Typography>
        )}
      </CardContent>
    </Card>
  );
}