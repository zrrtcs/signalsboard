import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Collapse } from '@mui/material';
import { QrCode2 as QRIcon, Close as CloseIcon } from '@mui/icons-material';
import QRCode from 'react-qr-code';

/**
 * Dashboard QR Widget - Floating widget for sharing dashboard link
 * Collapsed by default in top-right corner during demo/showcase
 * Allows recruiters/observers to scan and view dashboard on mobile devices
 */
export function DashboardQRWidget() {
  const [expanded, setExpanded] = useState(false); // Start collapsed
  const dashboardUrl = window.location.href;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 900, // Below AppBar, above content
      }}
    >
      <Paper
        elevation={3}
        sx={{
          bgcolor: '#1e2a38',
          border: '2px solid #ff9800',
          borderRadius: 1,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header - Always Visible */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            minWidth: '44px',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#2a3847',
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Tooltip title="Click to share dashboard QR code">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <QRIcon sx={{ fontSize: '1.2rem', color: '#ff9800' }} />
              {expanded && (
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800', fontSize: '0.8rem', ml: 0.5 }}>
                  Share
                </Typography>
              )}
            </Box>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{
              padding: '4px',
              color: '#ff9800',
              '&:hover': {
                bgcolor: 'rgba(255, 152, 0, 0.1)',
              },
            }}
            title={expanded ? 'Hide QR' : 'Show QR'}
          >
            {expanded ? <CloseIcon sx={{ fontSize: '0.95rem' }} /> : <QRIcon sx={{ fontSize: '0.95rem' }} />}
          </IconButton>
        </Box>

        {/* Content - Expandable */}
        <Collapse in={expanded}>
          <Box sx={{ p: 1.5, borderTop: '1px solid #333' }}>
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <QRCode value={dashboardUrl} size={120} level="H" quietZone={10} />
            </Box>

            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: '#90caf9',
                wordBreak: 'break-all',
                display: 'block',
                textAlign: 'center',
                fontFamily: 'monospace',
              }}
            >
              {dashboardUrl.split('://')[1]?.split(':')[0]}
            </Typography>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}