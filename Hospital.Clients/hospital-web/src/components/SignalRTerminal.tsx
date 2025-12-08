import { useEffect, useRef, memo } from 'react';
import { Box, Typography, IconButton, Chip, Stack, Paper } from '@mui/material';
import {
  Terminal as TerminalIcon,
  Close as CloseIcon,
  Delete as ClearIcon,
  Circle as DotIcon,
} from '@mui/icons-material';
import { useHospitalStore, type SignalRLogEntry } from '../store/hospitalStore';

/**
 * Terminal-style SignalR message viewer
 * Shows real-time WebSocket communication as proof for recruiters
 *
 * Design: Matrix/hacker terminal aesthetic with:
 * - Green monospace text on dark background
 * - Live message feed with auto-scroll
 * - Statistics bar showing throughput
 * - Color-coded event types
 */

const EVENT_COLORS: Record<SignalRLogEntry['eventType'], string> = {
  VitalUpdate: '#4caf50',    // Green - most common
  Alert: '#f44336',          // Red - critical
  InjectionMode: '#ff9800',  // Orange - user action
  NurseAttending: '#2196f3', // Blue - staff action
  Connection: '#9c27b0',     // Purple - system
};

const EVENT_ICONS: Record<SignalRLogEntry['eventType'], string> = {
  VitalUpdate: '📊',
  Alert: '🚨',
  InjectionMode: '💉',
  NurseAttending: '👨‍⚕️',
  Connection: '🔌',
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function formatLogEntry(entry: SignalRLogEntry): string {
  const icon = EVENT_ICONS[entry.eventType];
  const time = formatTimestamp(entry.timestamp);
  const patient = entry.patientName ? `[${entry.patientName}]` : '';

  // Format data based on event type
  let dataStr = '';
  switch (entry.eventType) {
    case 'VitalUpdate':
      dataStr = `HR:${entry.data.heartRate} SpO2:${entry.data.spO2}% BP:${entry.data.bpSystolic}/${entry.data.bpDiastolic}`;
      break;
    case 'Alert':
      dataStr = `${entry.data.severity}: ${entry.data.message}`;
      break;
    case 'InjectionMode':
      dataStr = entry.data.enabled ? 'ENABLED' : 'DISABLED';
      break;
    case 'NurseAttending':
      dataStr = entry.data.attending ? 'ATTENDING' : 'LEFT';
      break;
    case 'Connection':
      dataStr = String(entry.data.status).toUpperCase();
      break;
  }

  return `${time} ${icon} ${entry.eventType.padEnd(14)} ${patient.padEnd(20)} ${dataStr}`;
}

const LogLine = memo(function LogLine({ entry }: { entry: SignalRLogEntry }) {
  const color = EVENT_COLORS[entry.eventType];

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 0.5,
        fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
        fontSize: '0.75rem',
        color,
        borderLeft: `3px solid ${color}`,
        pl: 1,
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.05)',
        },
      }}
    >
      {formatLogEntry(entry)}
    </Box>
  );
});

export const SignalRTerminal = memo(function SignalRTerminal() {
  const logs = useHospitalStore(state => state.signalRLogs);
  const stats = useHospitalStore(state => state.signalRStats);
  const connectionStatus = useHospitalStore(state => state.connectionStatus);
  const togglePanel = useHospitalStore(state => state.toggleSignalRPanel);
  const clearLogs = useHospitalStore(state => state.clearSignalRLogs);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Scroll to top (newest first)
    }
  }, [logs.length]);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 600,
        maxWidth: 'calc(100vw - 32px)',
        height: 400,
        bgcolor: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
      }}
    >
      {/* Terminal Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: '#161b22',
          borderBottom: '1px solid #30363d',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TerminalIcon sx={{ color: '#58a6ff', fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: 'monospace',
              color: '#c9d1d9',
              fontWeight: 600,
            }}
          >
            SignalR WebSocket Monitor
          </Typography>
          <Chip
            size="small"
            icon={<DotIcon sx={{ fontSize: '12px !important' }} />}
            label={connectionStatus.toUpperCase()}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              bgcolor: connectionStatus === 'connected' ? '#238636' : '#da3633',
              color: '#fff',
              '& .MuiChip-icon': {
                color: connectionStatus === 'connected' ? '#3fb950' : '#f85149',
              },
            }}
          />
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={clearLogs}
            sx={{ color: '#8b949e', '&:hover': { color: '#c9d1d9' } }}
            title="Clear logs"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={togglePanel}
            sx={{ color: '#8b949e', '&:hover': { color: '#c9d1d9' } }}
            title="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Stats Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 0.75,
          bgcolor: '#21262d',
          borderBottom: '1px solid #30363d',
          flexWrap: 'wrap',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontFamily: 'monospace', color: '#8b949e' }}
        >
          📈 <span style={{ color: '#58a6ff' }}>{stats.messagesPerMinute}</span> msg/min
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontFamily: 'monospace', color: '#8b949e' }}
        >
          📊 Total: <span style={{ color: '#58a6ff' }}>{stats.totalMessages}</span>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {Object.entries(stats.eventCounts).map(([type, count]) => (
            <Typography
              key={type}
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                color: EVENT_COLORS[type as SignalRLogEntry['eventType']],
              }}
            >
              {EVENT_ICONS[type as SignalRLogEntry['eventType']]} {count}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Terminal Body */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: '#161b22',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#30363d',
            borderRadius: 4,
          },
        }}
      >
        {logs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#484f58',
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', mb: 1 }}
            >
              Waiting for SignalR messages...
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', color: '#30363d' }}
            >
              Real-time WebSocket communication will appear here
            </Typography>
          </Box>
        ) : (
          logs.map((entry) => <LogLine key={entry.id} entry={entry} />)
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: '#161b22',
          borderTop: '1px solid #30363d',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            color: '#484f58',
            fontSize: '0.65rem',
          }}
        >
          💡 This panel shows LIVE SignalR WebSocket messages between .NET backend and React frontend
        </Typography>
      </Box>
    </Paper>
  );
});
