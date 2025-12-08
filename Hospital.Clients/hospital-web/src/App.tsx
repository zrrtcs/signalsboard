import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Chip, CircularProgress, IconButton, Tooltip, Alert, Menu, MenuItem, ListItemIcon, ListItemText, Divider, useMediaQuery } from '@mui/material';
import { SignalCellularAlt as SignalIcon, VolumeOff as MuteIcon, VolumeUp as UnmuteIcon, QrCode2 as QRIcon, GitHub as GitHubIcon, NotificationsOff as NotificationsOffIcon, Notifications as NotificationsIcon, Terminal as TerminalIcon, MoreVert as MoreIcon, Science as ScienceIcon } from '@mui/icons-material';
import { useHospitalSignalR } from './hooks/useHospitalSignalR';
import { useHospitalStore } from './store/hospitalStore';
import { useAudioAlert } from './hooks/useAudioAlert';
import { PatientGrid } from './components/PatientGrid';
import { VitalInjectorPanel } from './components/VitalInjectorPanel';
import { DashboardQRModal } from './components/DashboardQRModal';
import { DemoScenarioSelector } from './components/DemoScenarioSelector';
import { SignalRTerminal } from './components/SignalRTerminal';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [actionBarMenuAnchor, setActionBarMenuAnchor] = useState<null | HTMLElement>(null);

  // Responsive breakpoint - collapse toolbar at < 1024px (tablet/mobile)
  const isCompact = useMediaQuery('(max-width: 1024px)');

  // Pass notificationsEnabled to SignalR hook
  const { connectionStatus } = useHospitalSignalR(notificationsEnabled);
  const { patients, setPatients } = useHospitalStore();
  const { toggleGlobalMute } = useAudioAlert();
  const showSignalRPanel = useHospitalStore(state => state.showSignalRPanel);
  const toggleSignalRPanel = useHospitalStore(state => state.toggleSignalRPanel);
  const [showVitalInjector, setShowVitalInjector] = useState(false);

  // Overflow menu handlers
  const handleActionBarMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionBarMenuAnchor(event.currentTarget);
  };
  const handleActionBarMenuClose = () => {
    setActionBarMenuAnchor(null);
  };

  // Initialize global mute state from localStorage
  // Default: true (MUTED) - ensures audio doesn't surprise users on first load
  useEffect(() => {
    const stored = localStorage.getItem('hospital:global-mute');
    setGlobalMuted(stored ? JSON.parse(stored) : true);
  }, []);

  // Initialize notifications state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('hospital:notifications-enabled');
    setNotificationsEnabled(stored ? JSON.parse(stored) : false);
  }, []);

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    if (import.meta.env.DEV) {
      console.log('🔔 Notifications toggled:', { from: notificationsEnabled, to: newValue });
    }
    setNotificationsEnabled(newValue);
    localStorage.setItem('hospital:notifications-enabled', JSON.stringify(newValue));
  };

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
              <SignalIcon sx={{ mr: { xs: 1, sm: 2 } }} />
              <Typography
                variant="h5"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 600,
                  fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isCompact ? 'Signalsboard' : 'Hospital Vital Signs Dashboard'}
              </Typography>

              {/* === DESKTOP: Show all actions inline === */}
              {!isCompact && (
                <>
                  <DemoScenarioSelector />

                  <Tooltip title="Inject test vitals">
                    <IconButton
                      onClick={() => setShowVitalInjector(!showVitalInjector)}
                      sx={{
                        color: showVitalInjector ? '#4caf50' : '#00bcd4',
                        mr: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 188, 212, 0.1)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <ScienceIcon />
                    </IconButton>
                  </Tooltip>

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

                  <Tooltip title="View source on GitHub">
                    <IconButton
                      component="a"
                      href="https://github.com/zrrtcs/signalsboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: '#ffffff',
                        mr: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <GitHubIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="SignalR WebSocket Monitor">
                    <IconButton
                      onClick={toggleSignalRPanel}
                      sx={{
                        color: showSignalRPanel ? '#4caf50' : '#9c27b0',
                        mr: 1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(156, 39, 176, 0.1)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <TerminalIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* === ALWAYS VISIBLE: Critical controls === */}
              <IconButton
                onClick={() => {
                  toggleGlobalMute();
                  setGlobalMuted(!globalMuted);
                }}
                sx={{
                  color: globalMuted ? '#f44336' : '#4caf50',
                  mr: 0.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.1)',
                  },
                }}
                title={globalMuted ? 'Audio muted' : 'Audio enabled'}
              >
                {globalMuted ? <MuteIcon /> : <UnmuteIcon />}
              </IconButton>

              <IconButton
                onClick={toggleNotifications}
                sx={{
                  color: notificationsEnabled ? '#4caf50' : '#f44336',
                  mr: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.1)',
                  },
                }}
                title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
              >
                {notificationsEnabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
              </IconButton>

              {/* === COMPACT: Overflow menu === */}
              {isCompact && (
                <>
                  <IconButton
                    onClick={handleActionBarMenuOpen}
                    sx={{ color: '#ffffff', mr: 1 }}
                  >
                    <MoreIcon />
                  </IconButton>
                  <Menu
                    anchorEl={actionBarMenuAnchor}
                    open={Boolean(actionBarMenuAnchor)}
                    onClose={handleActionBarMenuClose}
                    slotProps={{
                      paper: { sx: { minWidth: 280, bgcolor: 'background.paper' } }
                    }}
                  >
                    {/* Quick Settings - explain the toolbar icons */}
                    <MenuItem onClick={() => { toggleGlobalMute(); setGlobalMuted(!globalMuted); handleActionBarMenuClose(); }}>
                      <ListItemIcon>{globalMuted ? <MuteIcon sx={{ color: '#f44336' }} /> : <UnmuteIcon sx={{ color: '#4caf50' }} />}</ListItemIcon>
                      <ListItemText
                        primary={globalMuted ? 'Audio Muted' : 'Audio Enabled'}
                        secondary="Toggle alert sounds for critical vitals"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                    <MenuItem onClick={() => { toggleNotifications(); handleActionBarMenuClose(); }}>
                      <ListItemIcon>{notificationsEnabled ? <NotificationsIcon sx={{ color: '#4caf50' }} /> : <NotificationsOffIcon sx={{ color: '#f44336' }} />}</ListItemIcon>
                      <ListItemText
                        primary={notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                        secondary="Browser push alerts for critical patients"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                    <MenuItem disabled>
                      <ListItemIcon><SignalIcon sx={{ color: getConnectionColor() === 'success' ? '#4caf50' : getConnectionColor() === 'error' ? '#f44336' : '#ff9800' }} /></ListItemIcon>
                      <ListItemText
                        primary={`Status: ${getConnectionLabel()}`}
                        secondary="Real-time SignalR WebSocket connection"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                    <Divider />
                    {/* Tools */}
                    <MenuItem onClick={() => { setShowVitalInjector(!showVitalInjector); handleActionBarMenuClose(); }}>
                      <ListItemIcon><ScienceIcon sx={{ color: showVitalInjector ? '#4caf50' : '#00bcd4' }} /></ListItemIcon>
                      <ListItemText
                        primary="Inject Vitals"
                        secondary="Send test vital signs to patients"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                    <MenuItem onClick={() => { toggleSignalRPanel(); handleActionBarMenuClose(); }}>
                      <ListItemIcon><TerminalIcon sx={{ color: showSignalRPanel ? '#4caf50' : '#9c27b0' }} /></ListItemIcon>
                      <ListItemText
                        primary="SignalR Monitor"
                        secondary="View real-time WebSocket messages"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                    <Divider />
                    {/* Share & Links */}
                    <MenuItem onClick={() => { setQrModalOpen(true); handleActionBarMenuClose(); }}>
                      <ListItemIcon><QRIcon sx={{ color: '#ff9800' }} /></ListItemIcon>
                      <ListItemText
                        primary="Share QR Code"
                        secondary="Scan to open on another device"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                    <MenuItem
                      component="a"
                      href="https://github.com/zrrtcs/signalsboard"
                      target="_blank"
                      onClick={handleActionBarMenuClose}
                    >
                      <ListItemIcon><GitHubIcon /></ListItemIcon>
                      <ListItemText
                        primary="View on GitHub"
                        secondary="Browse source code & docs"
                        slotProps={{ secondary: { sx: { color: 'rgba(255,255,255,0.6)' } } }}
                      />
                    </MenuItem>
                  </Menu>
                </>
              )}

              <Chip
                label={isCompact ? (connectionStatus === 'connected' ? '●' : '✕') : getConnectionLabel()}
                color={getConnectionColor()}
                size={isCompact ? 'small' : 'medium'}
                sx={{ fontWeight: 600, minWidth: isCompact ? 'auto' : 80 }}
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

        {/* Vital Injector Testing Tool - Toggle from toolbar */}
        {showVitalInjector && <VitalInjectorPanel />}

        {/* Dashboard QR Modal - Opens from toolbar button */}
        <DashboardQRModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} />

        {/* SignalR Terminal - Live WebSocket Message Monitor */}
        {showSignalRPanel && <SignalRTerminal />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
