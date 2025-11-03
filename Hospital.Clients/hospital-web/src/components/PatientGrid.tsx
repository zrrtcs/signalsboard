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
    <Grid container spacing={3}>
      {patients.map((patient) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={patient.id}>
          <PatientCard
            patient={patient}
            onClick={() => console.log('Open trend chart for', patient.id)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
