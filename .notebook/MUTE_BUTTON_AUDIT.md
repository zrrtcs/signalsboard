# Mute Button System Audit & Analysis

## 1. MUTE BUTTON PERSISTENCE & DB RELATIONSHIPS

### Current Implementation

**Per-Patient Mute:**
- **Storage**: `localStorage['hospital:muted-patients']` - JSON array of patient IDs
- **State**: `mutedPatientsRef` in `useAudioAlert.ts` (in-memory Set)
- **Persistence**: ✅ Survives page refresh (loaded on component mount)
- **DB Storage**: ❌ **NOT persisted to database**

**Global Mute:**
- **Storage**: `localStorage['hospital:global-mute']` - boolean
- **State**: `globalMuteRef` in `useAudioAlert.ts` (in-memory boolean)
- **Persistence**: ✅ Survives page refresh
- **DB Storage**: ❌ **NOT persisted to database**

### Issues Found

1. **Per-patient mute is NOT in database**
   - Only stored in localStorage (client-side only)
   - If localStorage is cleared, all mutes are lost
   - Cannot sync mute settings across devices
   - Medical staff loses their custom mute preferences

2. **Global mute is NOT in database**
   - Same issue as above
   - Should be a user preference or ward-level setting

### Recommendation

**Add to Patient table (database):**
```sql
ALTER TABLE patients ADD COLUMN audio_muted BOOLEAN DEFAULT false;
```

**Add to new Settings table (for global mute):**
```sql
CREATE TABLE audio_settings (
  id UUID PRIMARY KEY,
  global_mute BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## 2. BUTTON STATE SYNC VERIFICATION

### Current State Sync Chain

```
User clicks mute button
  ↓
togglePatientMute(patientId) called
  ↓
mutedPatientsRef.current updated
  ↓
localStorage persisted
  ↓
PatientCard component re-renders (isPatientMuted check)
  ↓
Button UI updates (color change)
```

### Issues Found

1. **Zustand store NOT updated**
   - Only localStorage and in-memory refs are updated
   - Component relies on calling `isPatientMuted()` hook
   - **GOOD**: Doesn't cause re-renders (using callback)
   - **BAD**: Can't be used in Zustand selectors

2. **Button visual state vs. actual state**
   - Button color: Gray = muted ✅ (correct)
   - Button icon: Mute/Unmute ✅ (correct)
   - Button click handler: Immediate stop ✅ (correct)
   - Persists to localStorage ✅ (correct)
   - Syncs to other tabs: ⚠️ Only via localStorage (no real-time sync)

### Verification Checklist

- ✅ Click mute → audio stops immediately
- ✅ Click mute → button color changes to gray
- ✅ Refresh page → mute state restored
- ⚠️ Open two tabs → mute state NOT synced in real-time
- ❌ Server restart → mutes lost (not in DB)

---

## 3. CRITICAL CONDITIONS & THRESHOLDS

### Heart Rate (HR)

| Value | Severity | Color | Audio Alert |
|-------|----------|-------|-------------|
| ≤45 or ≥130 | **CRITICAL** | 🔴 Red | 🚨 Yes |
| ≤55 or ≥110 | Medium (High) | 🟠 Orange | No |
| 56-109 | Normal | 🟢 Green | No |

**Code location**: `Hospital.Api/Domain/VitalSigns.cs:46-55`

### SpO₂ (Oxygen Saturation)

| Value | Severity | Color | Audio Alert |
|-------|----------|-------|-------------|
| <88 | **CRITICAL** | 🔴 Red | 🚨 Yes |
| 88-91 | High | 🟠 Orange | No |
| 92-93 | Medium | 🟡 Yellow | No |
| ≥94 | Normal | 🟢 Green | No |

**Code location**: `Hospital.Api/Domain/VitalSigns.cs:58-68`

### Blood Pressure (BP)

| Systolic / Diastolic | Severity | Color | Audio Alert |
|----------------------|----------|-------|-------------|
| ≥180 or ≥110 | **CRITICAL** (Hypertensive Crisis) | 🔴 Red | 🚨 Yes |
| ≥160 or ≥100 | High (Stage 2) | 🟠 Orange | No |
| ≥140 or ≥90 | Medium (Stage 1) | 🟡 Yellow | No |
| <140/<90 | Normal | 🟢 Green | No |

**Code location**: `Hospital.Api/Domain/VitalSigns.cs:71-88`

### Overall Patient Status Calculation

**Rules** (from `VitalSignsSimulatorService.cs:309-321`):
- If ANY vital is CRITICAL → Patient status = "critical" 🔴
- If ANY vital is HIGH (and none are CRITICAL) → Patient status = "watch" 🟠
- Otherwise → Patient status = "stable" 🟢

**Audio Alert Triggers On**:
- Patient transitions from non-critical → CRITICAL
- Audio stops when patient transitions from CRITICAL → watch/stable

---

## 4. HEALTHY VITALS OPTION

### Current VitalInjectorPanel Options

1. ✅ **Manual entry** - Type any values
2. ✅ **Critical presets** - HR, SpO2, or BP critical
3. ❌ **Healthy presets** - MISSING

### Recommended Healthy Values

```typescript
const healthyPresets = {
  normal: {
    heartRate: 75,      // Resting normal
    spO2: 98,           // Good oxygen saturation
    bpSystolic: 120,    // Normal systolic
    bpDiastolic: 80,    // Normal diastolic
  },
  athlete: {
    heartRate: 60,      // Athletic resting HR
    spO2: 99,           // Excellent oxygenation
    bpSystolic: 110,    // Athletic low BP
    bpDiastolic: 70,
  },
  recovering: {
    heartRate: 90,      // Slightly elevated
    spO2: 96,           // Slight dip
    bpSystolic: 130,    // Slightly elevated
    bpDiastolic: 85,
  },
};
```

### Implementation Needed

Add button next to "Make Critical":
```jsx
<Button variant="contained" color="success" onClick={handleMakeHealthy}>
  ✓ Make Healthy
</Button>
```

---

## 5. COLOR CONTRAST AT LINE 306

### Current Implementation (Line 306)

```jsx
<Box sx={{
  p: 1.5,
  bgcolor: '#fff3e0',           // Light orange background
  borderRadius: 1,
  border: '1px solid #ffb74d'   // Medium orange border
}}>
  <div style={{
    fontSize: '0.875rem',
    color: '#e65100',           // Dark orange text
    fontWeight: 500,
    marginBottom: '8px'
  }}>
    🔴 Quick Test: Make Patient CRITICAL
  </div>
```

### Contrast Analysis

| Element | BG Color | Text Color | Contrast Ratio | WCAG AA | Issue |
|---------|----------|-----------|-----------------|---------|-------|
| Main text | #fff3e0 | #e65100 | 8.5:1 | ✅ Pass | OK |
| Border | N/A | #ffb74d | N/A | N/A | Low contrast on light BG |
| Overall | #fff3e0 | #e65100 | 8.5:1 | ✅ Pass | OK |

### Recommendation

Make more visually distinct:
```jsx
<Box sx={{
  p: 1.5,
  bgcolor: '#ffccbc',           // Darker orange background
  borderRadius: 1,
  border: '2px solid #d84315'   // Darker orange border
  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)'
}}>
  <div style={{
    fontSize: '0.875rem',
    color: '#b71c1c',           // Darker red text
    fontWeight: 700,            // Bolder font
    marginBottom: '8px',
    textShadow: '0 1px 2px rgba(255,255,255,0.3)' // Subtle shadow for readability
  }}>
    🔴 Quick Test: Make Patient CRITICAL
  </div>
```

---

## Summary & Action Items

### Critical (Fix Now)
- [ ] Add "Make Healthy" button to VitalInjectorPanel
- [ ] Improve color contrast at line 306
- [ ] Document CRITICAL thresholds in code comments

### High Priority (Do Soon)
- [ ] Persist per-patient mute to database
- [ ] Persist global mute to database
- [ ] Add real-time mute sync across tabs (via localStorage events)

### Medium Priority (Nice to Have)
- [ ] Add user preferences table for mute settings
- [ ] Sync mute settings across devices
- [ ] Add audit log for mute changes

### Notes
- ✅ Button states ARE currently syncing correctly (just not to DB)
- ✅ CRITICAL conditions are well-defined and correct
- ⚠️ Healthy vitals preset would be very useful for demo
- ⚠️ Color contrast is acceptable but could be improved
