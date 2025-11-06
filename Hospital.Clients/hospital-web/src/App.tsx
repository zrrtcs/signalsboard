import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Chip, CircularProgress, IconButton, Tooltip, Alert } from '@mui/material';
import { SignalCellularAlt as SignalIcon, VolumeOff as MuteIcon, VolumeUp as UnmuteIcon, QrCode2 as QRIcon } from '@mui/icons-material';
import { useHospitalSignalR } from './hooks/useHospitalSignalR';
import { useHospitalStore } from './store/hospitalStore';
import { useAudioAlert } from './hooks/useAudioAlert';
import { PatientGrid } from './components/PatientGrid';
import { VitalInjectorPanel } from './components/VitalInjectorPanel';
import { DashboardQRModal } from './components/DashboardQRModal';
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
  const { toggleGlobalMute } = useAudioAlert();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Initialize global mute state from localStorage
  // Default: true (MUTED) - ensures audio doesn't surprise users on first load
  useEffect(() => {
    const stored = localStorage.getItem('hospital:global-mute');
    setGlobalMuted(stored ? JSON.parse(stored) : true);
  }, []);

  // Load initial patient data
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        // Try to fetch from API, fallback to mock data
        const data = await hospitalApi.getPatients().catch(() => {
          console.warn('API timeout/unavailable - using mock data');
          setUsingMockData(true);
          return mockPatients;
        });

        // Use mock data if API returns empty array
        if (data.length === 0) {
          console.warn('API returned no patients - using mock data');
          setUsingMockData(true);
          setPatients(mockPatients);
        } else {
          setUsingMockData(false);
          setPatients(data);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError('Failed to load patient data - showing mock data');
        setUsingMockData(true);
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
        <AppBar position="sticky" elevation={2} sx={{ width: '100%' }}>
          <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%', px: 3 }}>
            <Toolbar sx={{ px: 0 }}>
              <SignalIcon sx={{ mr: 2 }} />
              <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                Hospital Vital Signs Dashboard
              </Typography>

              {/* Dashboard QR Share Button */}
              <Tooltip title="Share dashboard QR code">
                <IconButton
                  onClick={() => setQrModalOpen(true)}
                  sx={{
                    color: '#ff9800',
                    mr: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <QRIcon />
                </IconButton>
              </Tooltip>

              {/* Global Audio Mute Button */}
              <IconButton
                onClick={() => {
                  toggleGlobalMute();
                  setGlobalMuted(!globalMuted);
                }}
                sx={{
                  color: globalMuted ? '#f44336' : 'inherit',
                  mr: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.1)',
                  },
                }}
                title={globalMuted ? '🔇 Global Mute: ON (all alerts silenced)' : '🔊 Global Mute: OFF (alerts enabled)'}
              >
                {globalMuted ? <MuteIcon /> : <UnmuteIcon />}
              </IconButton>

              <Chip
                label={getConnectionLabel()}
                color={getConnectionColor()}
                size="medium"
                sx={{ fontWeight: 600 }}
              />
            </Toolbar>
          </Box>
        </AppBar>

        {/* Mock Data Warning Banner */}
        {usingMockData && (
          <Alert severity="warning" sx={{ borderRadius: 0, mb: 2 }}>
            ⚠️ <strong>Demo Mode:</strong> Using demonstration data. Live patient data currently unavailable (API request timed out).
          </Alert>
        )}

        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', width: '100%' }}>
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

        {/* Vital Injector Testing Tool */}
        <VitalInjectorPanel />

        {/* Dashboard QR Modal - Opens from toolbar button */}
        <DashboardQRModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
