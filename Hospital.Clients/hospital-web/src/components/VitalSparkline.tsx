import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';
import type { Patient } from '../types/hospital';

interface VitalSparklineProps {
  patient: Patient;
  onClick?: () => void;
}

/**
 * VitalSparkline - 4 separate mini-sparklines for each vital
 * Shows HR, SpO2, BP Sys, BP Dia trends in real-time
 * Click to open full 4-hour trends chart in drawer
 */
export function VitalSparkline({ patient, onClick }: VitalSparklineProps) {
  const vitalsList = Array.isArray(patient.vitalSigns) ? patient.vitalSigns : [];

  // Use last 15 vitals for mini sparklines
  const sparklineData = vitalsList.slice(0, 15).reverse().map((v, idx) => ({
    time: idx,
    hr: v.heartRate,
    spo2: v.spO2,
    bpSys: v.bpSystolic,
    bpDia: v.bpDiastolic,
  }));

  if (sparklineData.length === 0) {
    return <Typography variant="caption" color="text.secondary">--</Typography>;
  }

  const sparklineConfigs = [
    { label: 'HR', dataKey: 'hr', stroke: '#f44336', color: 'text.secondary' },
    { label: 'SpO₂', dataKey: 'spo2', stroke: '#2196f3', color: 'text.secondary' },
    { label: 'BP Sys', dataKey: 'bpSys', stroke: '#4caf50', color: 'text.secondary' },
    { label: 'BP Dia', dataKey: 'bpDia', stroke: '#ff9800', color: 'text.secondary' },
  ];

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        '&:hover': {
          opacity: 0.8,
        },
      }}
      title="Click to see full 4-hour trends"
    >
      {sparklineConfigs.map(({ label, dataKey, stroke }) => (
        <Box
          key={dataKey}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            p: 0.5,
            border: '1px solid #eee',
            borderRadius: 1,
            bg: '#fafafa',
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, color: stroke }}>
            {label}
          </Typography>
          <div style={{ width: '100%', height: '25px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={stroke}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Box>
      ))}
    </Box>
  );
}