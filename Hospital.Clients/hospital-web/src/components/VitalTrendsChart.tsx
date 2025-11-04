import { useState, useEffect } from 'react';
import {
  Drawer,
  Typography,
  CircularProgress,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendPoint {
  recordedAt: string;
  heartRate?: number;
  spO2?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
}

interface VitalTrendsChartProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
}

/**
 * VitalTrendsChart - 4-hour vital signs history visualization
 *
 * Displays HR, SpO2, BP trends over last 240 minutes
 * Uses Recharts LineChart for multi-axis visualization
 */
export function VitalTrendsChart({
  patientId,
  patientName,
  open,
  onClose,
}: VitalTrendsChartProps) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchTrendData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${apiUrl}/patients/${patientId}/trend?minutes=240`);

        if (!response.ok) {
          throw new Error(`Failed to fetch trend data: ${response.statusText}`);
        }

        const trendData: TrendPoint[] = await response.json();

        // Transform timestamps for better readability
        const formattedData = trendData.map(point => ({
          ...point,
          time: new Date(point.recordedAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        setData(formattedData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error fetching trend data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [patientId, open]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 800 },
          borderRadius: 0,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <Typography variant="h6" fontWeight={600}>
          📊 Vital Trends - {patientName}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, minHeight: 400 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data.length === 0 && (
          <Alert severity="info">
            No trend data available yet. Check back in a few moments.
          </Alert>
        )}

        {!loading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval={Math.floor(data.length / 6)}
              />
              <YAxis yAxisId="left" label={{ value: 'HR (BPM) / SpO₂ (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'BP (mmHg)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                formatter={(value: any) => (value ? value.toFixed(1) : '--')}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />

              {/* Heart Rate - Red line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="heartRate"
                stroke="#f44336"
                name="HR (BPM)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />

              {/* SpO2 - Blue line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spO2"
                stroke="#2196f3"
                name="SpO₂ (%)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />

              {/* BP Systolic - Green line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bpSystolic"
                stroke="#4caf50"
                name="BP Systolic (mmHg)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />

              {/* BP Diastolic - Orange line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bpDiastolic"
                stroke="#ff9800"
                name="BP Diastolic (mmHg)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Drawer>
  );
}