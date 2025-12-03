import { describe, it, expect } from 'vitest';
import { validateVitalSigns, VITAL_RANGES } from './vitalSignsValidation';

describe('vitalSignsValidation', () => {
  describe('validateVitalSigns', () => {
    it('returns valid for normal vital signs', () => {
      const result = validateVitalSigns({
        heartRate: '75',
        spO2: '98',
        bpSystolic: '120',
        bpDiastolic: '80',
      });
      expect(result.valid).toBe(true);
    });

    it('requires at least one vital sign by default', () => {
      const result = validateVitalSigns({
        heartRate: '',
        spO2: '',
        bpSystolic: '',
        bpDiastolic: '',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('at least one');
      }
    });

    it('allows empty when requireAtLeastOne is false', () => {
      const result = validateVitalSigns(
        { heartRate: '', spO2: '', bpSystolic: '', bpDiastolic: '' },
        false
      );
      expect(result.valid).toBe(true);
    });

    describe('heart rate validation', () => {
      it('rejects heart rate below minimum', () => {
        const result = validateVitalSigns({
          heartRate: '20',
          spO2: '',
          bpSystolic: '',
          bpDiastolic: '',
        });
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toContain('Heart Rate');
          expect(result.error).toContain(String(VITAL_RANGES.heartRate.min));
        }
      });

      it('rejects heart rate above maximum', () => {
        const result = validateVitalSigns({
          heartRate: '250',
          spO2: '',
          bpSystolic: '',
          bpDiastolic: '',
        });
        expect(result.valid).toBe(false);
      });

      it('rejects non-numeric heart rate', () => {
        const result = validateVitalSigns({
          heartRate: 'abc',
          spO2: '',
          bpSystolic: '',
          bpDiastolic: '',
        });
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toContain('valid number');
        }
      });
    });

    describe('SpO2 validation', () => {
      it('accepts SpO2 at boundaries', () => {
        const lowResult = validateVitalSigns({
          heartRate: '',
          spO2: '0',
          bpSystolic: '',
          bpDiastolic: '',
        });
        expect(lowResult.valid).toBe(true);

        const highResult = validateVitalSigns({
          heartRate: '',
          spO2: '100',
          bpSystolic: '',
          bpDiastolic: '',
        });
        expect(highResult.valid).toBe(true);
      });

      it('rejects SpO2 over 100%', () => {
        const result = validateVitalSigns({
          heartRate: '',
          spO2: '101',
          bpSystolic: '',
          bpDiastolic: '',
        });
        expect(result.valid).toBe(false);
      });
    });

    describe('blood pressure validation', () => {
      it('rejects systolic below diastolic', () => {
        const result = validateVitalSigns({
          heartRate: '',
          spO2: '',
          bpSystolic: '80',
          bpDiastolic: '120',
        });
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toContain('Systolic must be');
        }
      });

      it('accepts systolic equal to diastolic', () => {
        const result = validateVitalSigns({
          heartRate: '',
          spO2: '',
          bpSystolic: '100',
          bpDiastolic: '100',
        });
        expect(result.valid).toBe(true);
      });

      it('validates systolic range', () => {
        const result = validateVitalSigns({
          heartRate: '',
          spO2: '',
          bpSystolic: '300',
          bpDiastolic: '',
        });
        expect(result.valid).toBe(false);
      });

      it('validates diastolic range', () => {
        const result = validateVitalSigns({
          heartRate: '',
          spO2: '',
          bpSystolic: '',
          bpDiastolic: '200',
        });
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('VITAL_RANGES', () => {
    it('has medically reasonable ranges', () => {
      expect(VITAL_RANGES.heartRate.min).toBeGreaterThan(0);
      expect(VITAL_RANGES.heartRate.max).toBeLessThanOrEqual(250);
      expect(VITAL_RANGES.spO2.min).toBe(0);
      expect(VITAL_RANGES.spO2.max).toBe(100);
      expect(VITAL_RANGES.bpSystolic.min).toBeLessThan(VITAL_RANGES.bpSystolic.max);
      expect(VITAL_RANGES.bpDiastolic.min).toBeLessThan(VITAL_RANGES.bpDiastolic.max);
    });
  });
});
