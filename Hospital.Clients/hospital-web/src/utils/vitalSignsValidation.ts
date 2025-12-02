/**
 * Vital Signs Validation Utility
 *
 * Centralized validation for vital signs input across the application.
 * Used by VitalInjectorPanel and NurseAttendingModal.
 */

/** Valid ranges for vital signs based on medical standards */
export const VITAL_RANGES = {
  heartRate: { min: 30, max: 200, unit: 'BPM' },
  spO2: { min: 0, max: 100, unit: '%' },
  bpSystolic: { min: 50, max: 250, unit: 'mmHg' },
  bpDiastolic: { min: 30, max: 150, unit: 'mmHg' },
} as const;

/** Form data structure for vital signs input */
export interface VitalSignsFormData {
  heartRate: string;
  spO2: string;
  bpSystolic: string;
  bpDiastolic: string;
}

/** Result of validation - either success or error with message */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Validates a single numeric vital sign field
 */
function validateField(
  value: string,
  fieldName: string,
  min: number,
  max: number,
  unit: string
): ValidationResult {
  if (!value) return { valid: true };

  const numValue = parseInt(value, 10);

  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (numValue < min || numValue > max) {
    return { valid: false, error: `❌ ${fieldName} must be between ${min}-${max} ${unit}` };
  }

  return { valid: true };
}

/**
 * Validates vital signs form data
 *
 * @param formData - Form values to validate
 * @param requireAtLeastOne - Whether at least one field must be filled
 * @returns ValidationResult with error message if invalid
 */
export function validateVitalSigns(
  formData: VitalSignsFormData,
  requireAtLeastOne: boolean = true
): ValidationResult {
  const { heartRate, spO2, bpSystolic, bpDiastolic } = formData;

  // Check if at least one vital is provided
  if (requireAtLeastOne) {
    const hasData = heartRate || spO2 || bpSystolic || bpDiastolic;
    if (!hasData) {
      return { valid: false, error: 'Please enter at least one vital sign' };
    }
  }

  // Validate each field
  const hrResult = validateField(heartRate, 'Heart Rate', VITAL_RANGES.heartRate.min, VITAL_RANGES.heartRate.max, VITAL_RANGES.heartRate.unit);
  if (!hrResult.valid) return hrResult;

  const spo2Result = validateField(spO2, 'SpO₂', VITAL_RANGES.spO2.min, VITAL_RANGES.spO2.max, VITAL_RANGES.spO2.unit);
  if (!spo2Result.valid) return spo2Result;

  const bpSysResult = validateField(bpSystolic, 'BP Systolic', VITAL_RANGES.bpSystolic.min, VITAL_RANGES.bpSystolic.max, VITAL_RANGES.bpSystolic.unit);
  if (!bpSysResult.valid) return bpSysResult;

  const bpDiaResult = validateField(bpDiastolic, 'BP Diastolic', VITAL_RANGES.bpDiastolic.min, VITAL_RANGES.bpDiastolic.max, VITAL_RANGES.bpDiastolic.unit);
  if (!bpDiaResult.valid) return bpDiaResult;

  // Validate BP relationship: Systolic >= Diastolic
  if (bpSystolic && bpDiastolic) {
    const sys = parseInt(bpSystolic, 10);
    const dia = parseInt(bpDiastolic, 10);
    if (!isNaN(sys) && !isNaN(dia) && sys < dia) {
      return { valid: false, error: '❌ BP Systolic must be ≥ Diastolic' };
    }
  }

  return { valid: true };
}