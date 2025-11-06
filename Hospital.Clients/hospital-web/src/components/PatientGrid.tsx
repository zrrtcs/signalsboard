import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { useHospitalStore } from '../store/hospitalStore';
import { PatientCard } from './PatientCard';

export function PatientGrid() {
  // Get the Map directly (stable reference)
  const patientsMap = useHospitalStore((state) => state.patients);

  // Convert to array only when Map reference changes
  const patients = useMemo(() => Array.from(patientsMap.values()), [patientsMap]);

  return (
    <Grid
      container
      spacing={3}
      sx={{
        // Responsive grid sizing with controlled max-width
        // Mobile (xs): 1 column (full width)
        // Tablet (sm): 2 columns (50% each)
        // Desktop (md): 3 columns (33.33% each) - optimal for patient cards
        // Large (lg/xl): cap at 3 columns to prevent stretching
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',                    // 1 column on mobile
          sm: 'repeat(2, 1fr)',         // 2 columns on tablet
          md: 'repeat(3, 1fr)',         // 3 columns on desktop
          lg: 'repeat(3, minmax(350px, 1fr))', // 3 cols with min-width
          xl: 'repeat(3, minmax(350px, 1fr))', // 3 cols with min-width
        },
        gap: 3,
        width: '100%',
      }}
    >
      {patients.map((patient) => (
        <Box key={patient.id}>
          <PatientCard
            patient={patient}
            onClick={() => console.log('Open trend chart for', patient.id)}
          />
        </Box>
      ))}
    </Grid>
  );
}
