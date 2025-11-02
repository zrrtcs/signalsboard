import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Chip, CircularProgress } from '@mui/material';
import { SignalCellularAlt as SignalIcon } from '@mui/icons-material';
import { useHospitalSignalR } from './hooks/useHospitalSignalR';
import { useHospitalStore } from './store/hospitalStore';
import { PatientGrid } from './components/PatientGrid';
import { hospitalApi, mockPatients } from './services/hospitalApi';

// Medical dashboard theme - optimized for TV displays
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3', // Blue for medical tech
    },
    success: {
      main: '#4caf50', // Green - normal vitals
    },
    warning: {
      main: '#ff9800', // Orange - medium alerts
    },
    error: {
      main: '#f44336', // Red - critical alerts
    },
    background: {
      default: '#0a1929',
      paper: '#1e2a38',
    },
  },
  typography: {
    fontSize: 16, // Larger for TV readability
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const { connectionStatus } = useHospitalSignalR();
  const { patients, setPatients } = useHospitalStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial patient data
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        // Try to fetch from API, fallback to mock data
        const data = await hospitalApi.getPatients().catch(() => {
          console.warn('API unavailable, using mock data');
          return mockPatients;
        });
        setPatients(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError('Failed to load patient data');
        // Use mock data as fallback
        setPatients(mockPatients);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [setPatients]);

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'info';
      case 'reconnecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getConnectionLabel = () => {
    switch (connectionStatus) {
      case 'connected': return '● Live';
      case 'connecting': return '◌ Connecting';
      case 'reconnecting': return '⟳ Reconnecting';
      case 'disconnected': return '✕ Offline';
      default: return connectionStatus;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={2}>
          <Toolbar>
            <SignalIcon sx={{ mr: 2 }} />
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Hospital Vital Signs Dashboard
            </Typography>
            <Chip
              label={getConnectionLabel()}
              color={getConnectionColor()}
              size="medium"
              sx={{ fontWeight: 600 }}
            />
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Typography color="error" variant="h6">
              {error}
            </Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Intensive Care Unit - {patients.size} Patients
              </Typography>
              <PatientGrid />
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
