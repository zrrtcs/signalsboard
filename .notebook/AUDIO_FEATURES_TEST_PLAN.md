# Audio Features - Complete Test Plan & Validation

## Requirements Checklist

### 1. Emergency Siren Audio ✅
**Requirement**: JavaScript audio function plays emergency siren when patient is CRITICAL
**Implementation**: Web Audio API synthesis in `useAudioAlert.ts`

**Test Cases**:
- [ ] **TC-AUDIO-001**: Siren plays when patient status changes to CRITICAL
  - Steps: Inject critical vital (HR ≥130 or SpO2 <88 or BP ≥180/110)
  - Expected: 🚨 Buzzing/beeping sound starts immediately
  - Evidence: Console logs "🚨 Emergency alert: Patient {id}"

- [ ] **TC-AUDIO-002**: Siren continues looping while patient is CRITICAL
  - Steps: Wait 5+ seconds after critical alert starts
  - Expected: Sound continues looping (2-second pattern repeats)
  - Evidence: No "stopped" message in console

- [ ] **TC-AUDIO-003**: Siren stops when patient improves from CRITICAL
  - Steps: Inject healthy vitals after critical event
  - Expected: 🚨 Sound stops immediately
  - Evidence: Console logs "⏹️ Emergency alert stopped for patient {id}"

---

### 2. Multi-Patient Concurrent Audio ✅
**Requirement**: Multiple critical patients can have audio alerts playing simultaneously
**Implementation**: `Map<patientId, HTMLAudioElement>` for per-patient audio elements

**Test Cases**:
- [ ] **TC-AUDIO-004**: Two patients critical = two sirens play together
  - Steps:
    1. Inject Patient A (p1) as CRITICAL
    2. Wait for siren to start
    3. Inject Patient B (p2) as CRITICAL
  - Expected: Both sirens play together (louder, overlapping)
  - Evidence: Console shows both "🚨 Emergency alert" messages

- [ ] **TC-AUDIO-005**: Three patients critical = three sirens
  - Steps: Repeat above with p3
  - Expected: All three sirens audible simultaneously
  - Evidence: Three separate alert log entries

- [ ] **TC-AUDIO-006**: Siren stops only for improved patient
  - Steps: With 3 critical playing, improve p2 to stable
  - Expected: p1 & p3 sirens continue, p2 stops
  - Evidence: Only p2 gets "⏹️ stopped" message, others continue

---

### 3. Per-Patient Mute Button ✅
**Requirement**: Each patient panel has a mute button (speaker icon) that silences THAT patient's alarm

**Test Cases**:
- [ ] **TC-MUTE-001**: Mute button visible on patient cards
  - Steps: Look at any patient card in dashboard
  - Expected: 🔊 or 🔇 icon visible in top-right button group
  - Evidence: Visual inspection

- [ ] **TC-MUTE-002**: Mute button stops currently playing audio
  - Steps:
    1. Patient A critical → 🚨 playing
    2. Click mute button on Patient A's card
  - Expected: Audio stops immediately
  - Evidence: Console logs "🔇 Patient p1 audio muted - stopping playback"

- [ ] **TC-MUTE-003**: Muted patient shows gray mute icon
  - Steps: Click mute button
  - Expected: Button color changes from default → gray (#666)
  - Evidence: Visual inspection of button color

- [ ] **TC-MUTE-004**: Unmuting restores button color
  - Steps: Click muted button again
  - Expected: Button color returns to default
  - Evidence: Visual inspection

- [ ] **TC-MUTE-005**: Mute state persists across page refresh
  - Steps:
    1. Mute Patient A
    2. Refresh page (Ctrl+R)
    3. Check Patient A card
  - Expected: Mute button still shows gray icon
  - Evidence: Icon persists, localStorage still contains muted patient

- [ ] **TC-MUTE-006**: Mute prevents alarm from playing
  - Steps:
    1. Mute Patient A
    2. Inject critical vitals for Patient A
  - Expected: No sound plays, console shows "🔇 Patient p1 is muted, skipping audio alert"
  - Evidence: No siren sound, console message confirms skip

---

### 4. Global Mute Button ✅
**Requirement**: Top-right AppBar button mutes ALL patient alerts (enabled by default)

**Test Cases**:
- [ ] **TC-GLOBAL-001**: Global mute button visible in AppBar
  - Steps: Look at top-right of page
  - Expected: 🔊 icon visible next to connection status chip
  - Evidence: Visual inspection

- [ ] **TC-GLOBAL-002**: Global mute OFF by default (audio enabled)
  - Steps: Fresh page load
  - Expected: Button shows 🔊 (not gray)
  - Evidence: Visual inspection

- [ ] **TC-GLOBAL-003**: Clicking global mute stops all patient audio
  - Steps:
    1. Inject multiple critical patients (p1, p2, p3)
    2. Wait for all sirens to play
    3. Click global mute button in AppBar
  - Expected: All audio stops immediately
  - Evidence: Console shows "🔇 Global audio MUTED - all patient alarms silenced"

- [ ] **TC-GLOBAL-004**: Global mute button turns red when ON
  - Steps: Click global mute button
  - Expected: Button icon color changes → red (#f44336)
  - Evidence: Visual inspection

- [ ] **TC-GLOBAL-005**: Global mute persists across page refresh
  - Steps:
    1. Enable global mute
    2. Refresh page
  - Expected: Global mute is still ON (button still red)
  - Evidence: Button color persists, localStorage confirms state

- [ ] **TC-GLOBAL-006**: Global mute overrides per-patient unmute
  - Steps:
    1. Enable global mute
    2. Patient A critical
    3. Unmute Patient A individually
  - Expected: No sound plays (global mute takes precedence)
  - Evidence: Console shows "🔇 Global audio mute enabled, skipping alert"

- [ ] **TC-GLOBAL-007**: Disabling global mute allows per-patient audio
  - Steps:
    1. With global mute ON and Patient A critical
    2. Click global mute button to turn OFF
  - Expected: If Patient A still critical and not individually muted, siren plays
  - Evidence: Audio plays, console shows alert message

---

### 5. Critical Border Animation ✅
**Requirement**: When patient is CRITICAL, card border pulses red to grab attention

**Test Cases**:
- [ ] **TC-ANIMATION-001**: Non-critical cards have static borders
  - Steps: Look at stable/watch patients
  - Expected: Borders are static (green/orange), no animation
  - Evidence: Visual inspection

- [ ] **TC-ANIMATION-002**: Critical patient card has pulsing red border
  - Steps: Inject critical vitals
  - Expected: Left border pulses red, outer glow expands/contracts
  - Evidence: Visual animation (1.5s cycle)

- [ ] **TC-ANIMATION-003**: Pulsing stops when patient improves
  - Steps: With critical patient pulsing, inject healthy vitals
  - Expected: Animation stops immediately, border returns to normal color
  - Evidence: No more pulsing animation

- [ ] **TC-ANIMATION-004**: Multiple critical cards all pulse independently
  - Steps: Make 3 patients critical
  - Expected: All 3 cards pulse red, synchronized
  - Evidence: All borders animate in sync

---

### 6. Muted + Critical Visual Indicator ✅
**Requirement**: When patient is muted AND critical, show visual pulse on mute button

**Test Cases**:
- [ ] **TC-VISUAL-001**: Muted-critical patient shows pulsing mute button
  - Steps:
    1. Patient A critical
    2. Click mute on Patient A
    3. Patient A still critical (border pulsing, button gray)
  - Expected: Mute button pulses with reduced opacity
  - Evidence: Button pulses at 1.5s interval, opacity 1.0 → 0.6 → 1.0

- [ ] **TC-VISUAL-002**: Pulsing stops when patient improves
  - Steps: With muted-critical patient, inject healthy vitals
  - Expected: Mute button pulsing stops
  - Evidence: Button stays gray but no longer pulses

---

### 7. Audio Quality & Volume ✅
**Requirement**: Siren is audible, not distorted, at appropriate volume

**Test Cases**:
- [ ] **TC-AUDIO-QA-001**: Siren is clearly audible
  - Steps: Inject critical vital with speaker on
  - Expected: Sound is loud enough to hear clearly
  - Evidence: Audible beeping/buzzing

- [ ] **TC-AUDIO-QA-002**: Siren is not distorted
  - Steps: Listen to siren for full 10 seconds
  - Expected: Two-tone pattern (800Hz/1200Hz) is clean, no crackling
  - Evidence: Clear tones, no noise artifacts

- [ ] **TC-AUDIO-QA-003**: Volume is consistent across multiple patients
  - Steps: Play 3 patient sirens simultaneously
  - Expected: All sirens are equally loud (0.8 volume)
  - Evidence: No one siren dominates

---

### 8. Cross-Browser Sync (localStorage) ⚠️
**Requirement**: Mute settings sync across browser tabs

**Test Cases**:
- [ ] **TC-SYNC-001**: Mute one patient, check in another tab
  - Steps:
    1. Open dashboard in Tab A and Tab B
    2. In Tab A: Inject critical vital
    3. In Tab A: Click mute button
    4. Check Tab B
  - Expected: Tab B shows patient as muted (gray button)
  - Evidence: Button color matches in both tabs

- [ ] **TC-SYNC-002**: Global mute syncs across tabs
  - Steps:
    1. Open dashboard in Tab A and Tab B
    2. In Tab A: Click global mute
    3. Check Tab B
  - Expected: Tab B global mute button is also red
  - Evidence: Button color matches in both tabs

**Note**: Sync depends on localStorage events, which may not fire across all browsers by default. This is a "nice to have" and can be improved with service workers.

---

### 9. Console Logging ✅
**Requirement**: Clear console messages for debugging audio state

**Test Cases**:
- [ ] **TC-LOG-001**: All audio actions logged to console
  - Steps: Inject critical, mute, unmute, improve
  - Expected: Each action has a corresponding console message
  - Evidence: Console shows:
    - "🚨 Emergency alert: Patient {id}"
    - "🔇 Patient {id} audio muted - stopping playback"
    - "🔊 Patient {id} audio unmuted"
    - "⏹️ Emergency alert stopped for patient {id}"

---

## Test Execution Checklist

### Manual Testing Steps

**Setup**:
```bash
# 1. Start backend
cd Hospital.Api
dotnet run

# 2. Start frontend
cd Hospital.Clients/hospital-web
npm run dev

# 3. Open browser to http://localhost:5173
# 4. Open browser console (F12 → Console tab)
# 5. System sound should be ON
```

**Test Sequence**:
```
1. [ ] Load dashboard - verify 3 patients (John Doe, Jane Smith, Bob Critical) visible
2. [ ] Check global mute button - should show 🔊 icon
3. [ ] Inject John Doe as CRITICAL (HR: 135)
   - [ ] Siren plays 🚨
   - [ ] Card border pulses red
   - [ ] Console shows "🚨 Emergency alert: Patient p1"
4. [ ] Inject Jane Smith as CRITICAL (SpO2: 85)
   - [ ] Second siren plays (both audible)
   - [ ] Both cards pulse red
   - [ ] Console shows "🚨 Emergency alert: Patient p2"
5. [ ] Click mute on Jane Smith
   - [ ] Jane's audio stops immediately
   - [ ] Jane's button turns gray
   - [ ] John's audio continues
   - [ ] Console shows "🔇 Patient p2 audio muted"
6. [ ] Click global mute button
   - [ ] John's audio stops
   - [ ] Button turns red
   - [ ] Console shows "🔇 Global audio MUTED"
7. [ ] Click global mute button again
   - [ ] Button turns back to 🔊
   - [ ] Console shows "🔊 Global audio UNMUTED"
   - [ ] John's audio does NOT restart (already stopped)
8. [ ] Inject John with healthy vitals
   - [ ] John's card stops pulsing
   - [ ] Console shows "⏹️ Emergency alert stopped"
9. [ ] Refresh page (Ctrl+R)
   - [ ] Jane still shows muted (gray button)
   - [ ] Global mute is OFF (🔊 icon)
   - [ ] localStorage still has Jane as muted
10. [ ] Open DevTools → Application → Storage → localStorage
    - [ ] Verify `hospital:muted-patients` contains `["p2"]`
    - [ ] Verify `hospital:global-mute` is `false`
```

---

## Known Issues & Limitations

### Current Limitations:
1. ❌ **Not in Database**: Mute settings only in localStorage (lost if cleared)
2. ⚠️ **Tab Sync**: May not sync across tabs in all browsers (needs service worker)
3. ⚠️ **Auto-restart**: Once audio stops, won't auto-restart even if patient becomes critical again (need manual toggle)

### Browser Compatibility:
- ✅ Chrome/Edge: Fully supported
- ✅ Firefox: Fully supported
- ⚠️ Safari: May have autoplay restrictions
- ⚠️ Mobile: Audio may not work without user interaction first

---

## Sign-Off Criteria

**Audio feature is READY FOR CODE WALKTHROUGH if:**
- [ ] All 7 core test categories pass (TC-AUDIO, TC-MUTE, TC-GLOBAL, TC-ANIMATION, TC-VISUAL, TC-AUDIO-QA, TC-LOG)
- [ ] Console logging is clear and consistent
- [ ] No errors in browser console
- [ ] Audio is audible and not distorted
- [ ] All buttons show correct visual states
- [ ] Mute state persists across refresh
- [ ] Multi-patient concurrent audio works
- [ ] Border animation is smooth and visible

**If all tests pass**: ✅ **READY FOR CODE WALKTHROUGH DOCUMENTATION**
