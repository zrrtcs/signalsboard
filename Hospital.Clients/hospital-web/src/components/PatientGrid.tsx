import { Grid } from '@mui/material';
import { useHospitalStore, selectFilteredPatients } from '../store/hospitalStore';
import { PatientCard } from './PatientCard';

export function PatientGrid() {
  const patients = useHospitalStore(selectFilteredPatients);

  return (
    <Grid container spacing={3}>
      {patients.map((patient) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={patient.id}>
          <PatientCard
            patient={patient}
            onClick={() => console.log('Open trend chart for', patient.id)}
          />
        </Grid>
      ))}
    </Grid>
  );
}
