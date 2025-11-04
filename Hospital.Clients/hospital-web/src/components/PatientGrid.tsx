import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
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
        // Ensure max 3 columns on large screens (>970px)
        // MUI Grid size: xs=12, sm=6 (2 cols), md=4 (3 cols), lg=4 (still 3 cols), xl=4 (still 3 cols)
        '@media (min-width: 1200px)': {
          '& .MuiGrid-item': {
            maxWidth: '33.333333%',
          },
        },
      }}
    >
      {patients.map((patient) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={patient.id}>
          <PatientCard
            patient={patient}
            onClick={() => console.log('Open trend chart for', patient.id)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
