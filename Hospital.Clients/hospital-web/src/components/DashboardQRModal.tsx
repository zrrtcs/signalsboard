import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { QrCode2 as QRIcon, IosShare as ShareIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import QRCode from 'react-qr-code';

interface DashboardQRModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dashboard QR Modal - Share dashboard link via QR code
 * Allows users to scan and view dashboard on mobile/tablet devices
 * Perfect for multi-device hospital setups
 */
export function DashboardQRModal({ open, onClose }: DashboardQRModalProps) {
  const dashboardUrl = window.location.href;

  const handleDownloadQR = () => {
    // QR code can be downloaded directly from the component
    alert('QR code download feature coming soon');
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(dashboardUrl);
    alert('✓ URL copied to clipboard!');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <QRIcon sx={{ color: '#ff9800' }} />
        Share Dashboard
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
          {/* Instructions */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.95rem' }}>
            📱 Scan with phone or tablet to view this dashboard on another device. Perfect for multi-screen hospital setups.
          </Typography>

          {/* QR Code */}
          <Box
            sx={{
              p: 3,
              bgcolor: '#fff',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid #e0e0e0',
            }}
          >
            <QRCode
              value={dashboardUrl}
              size={280}
              level="H"
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </Box>

          {/* URL Display */}
          <Box
            sx={{
              width: '100%',
              p: 1.5,
              bgcolor: '#1e2a38',
              borderRadius: 1,
              border: '1px solid #333',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Dashboard URL:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  wordBreak: 'break-all',
                  fontSize: '0.75rem',
                  color: '#90caf9',
                  fontFamily: 'monospace',
                  overflowWrap: 'break-word',
                }}
              >
                {dashboardUrl}
              </Typography>
              <Tooltip title="Copy URL">
                <IconButton size="small" onClick={handleCopyURL} sx={{ minWidth: 'auto' }}>
                  <CopyIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Info Box */}
          <Box
            sx={{
              width: '100%',
              p: 1.5,
              bgcolor: '#fff3e0',
              borderLeft: '4px solid #ff9800',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: '#e65100', display: 'block' }}>
              💡 <strong>Tip:</strong> Works on any device on the same network.  
              <br></br>
              View this dashboard on another device. Perfect for multi-screen hospital setups.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          onClick={handleDownloadQR}
          variant="contained"
          color="warning"
          startIcon={<ShareIcon />}
        >
          Download QR
        </Button>
      </DialogActions>
    </Dialog>
  );
}
