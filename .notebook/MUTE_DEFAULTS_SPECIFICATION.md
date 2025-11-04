# Mute Button Defaults - Specification & Validation

## Default Mute States

### Per-Patient Mutes
- **Default State**: UNMUTED (all patients can alert)
- **Storage**: `localStorage['hospital:muted-patients']`
- **Format**: JSON array of patient IDs
- **Initial Value**: `[]` (empty array)
- **Example**: `["p2", "p5"]` (patients p2 and p5 are muted)
- **Sync**: ❌ **LOCAL ONLY** - No cross-tab sync, No database

### Global Mute
- **Default State**: MUTED (🔇 red icon) - Audio disabled by default
- **Storage**: `localStorage['hospital:global-mute']`
- **Format**: JSON boolean
- **Initial Value**: `true` (audio is muted/disabled)
- **Visual**: Red 🔇 button on first load
- **Sync**: ❌ **LOCAL ONLY** - No real-time cross-tab sync, No database

---

## Implementation Details

### useAudioAlert.ts - Lines 43-46

```typescript
// Load global mute setting (default: true, meaning audio is MUTED/disabled)
// This ensures audio alerts don't surprise users on first load
const globalMute = localStorage.getItem('hospital:global-mute');
globalMuteRef.current = globalMute ? JSON.parse(globalMute) : true;
```

**Logic**:
- If `localStorage['hospital:global-mute']` exists → use stored value
- If not found → default to `true` (MUTED)

### App.tsx - Lines 55-62

```typescript
const [globalMuted, setGlobalMuted] = useState(true);

// Initialize global mute state from localStorage
// Default: true (MUTED) - ensures audio doesn't surprise users on first load
useEffect(() => {
  const stored = localStorage.getItem('hospital:global-mute');
  setGlobalMuted(stored ? JSON.parse(stored) : true);
}, []);
```

**Logic**:
- Component state initialized to `true` (MUTED)
- On mount, loads from localStorage with same default `true`
- Button color: `globalMuted ? '#f44336' : 'inherit'` (red when true/muted)

---

## User Experience on First Load

### Initial State (Fresh Page Load)

| Setting | Value | Visual | Audio |
|---------|-------|--------|-------|
| Global Mute | `true` | 🔇 Red button | ❌ Silenced |
| Per-Patient Mutes | `[]` | 🔊 White buttons | ❌ Blocked by global |

**User Behavior**:
1. Opens dashboard → Global mute is ON (🔇 red) by default
2. Critical patient appears → No sound plays
3. User sees red button and realizes audio is muted
4. User clicks button to toggle global mute OFF (🔊 white)
5. Patient alarms now audible

---

## Storage & Persistence

### localStorage Keys

```javascript
// Per-patient mutes (NOT synced between tabs)
localStorage['hospital:muted-patients']
// Value: JSON array
// Example: ["p1", "p3"]
// Persists across: Page refresh, Browser restart
// NOT persisted across: Clearing cache, Incognito mode

// Global mute (NOT synced between tabs)
localStorage['hospital:global-mute']
// Value: JSON boolean (true/false)
// Example: true (muted) or false (unmuted)
// Persists across: Page refresh, Browser restart
// NOT persisted across: Clearing cache, Incognito mode
```

### No Cross-Tab Synchronization

⚠️ **Important**: Per-patient and global mute settings do NOT sync in real-time across browser tabs.

**Example Scenario**:
- Tab A: Open dashboard, toggle global mute ON
- Tab B: Open dashboard (separate tab)
- Tab B's global mute button is still OFF (🔊)
- Tab A and Tab B have **different mute states**

**Why**: localStorage events are not reliable across all browsers for this use case. Would require:
- Service workers (complex)
- Broadcast Channel API (not supported in all browsers)
- Database persistence + SignalR sync (major change)

---

## Testing Defaults

### Test Case: Initial Load (First Time User)

**Steps**:
1. Clear browser cache and cookies
2. Open http://localhost:5173
3. Observe global mute button color

**Expected**:
- ✅ Global mute button shows 🔇 (red, indicating MUTED)
- ✅ No audio plays even if critical patient appears
- ✅ console.log shows "🔇 Global audio mute enabled, skipping alert"

**Verification**:
```javascript
// Open DevTools → Application → Storage → localStorage
localStorage.getItem('hospital:global-mute')  // Returns: "true" (or null, defaults to true)
localStorage.getItem('hospital:muted-patients')  // Returns: null or "[]"
```

---

## Toggle Behavior

### Toggling Global Mute

```typescript
// Click button →
toggleGlobalMute()
  // Toggle value
  globalMuteRef.current = !globalMuteRef.current  // true → false or false → true

  // Save to localStorage
  localStorage.setItem('hospital:global-mute', JSON.stringify(globalMuteRef.current))

  // Update UI
  setGlobalMuted(!globalMuted)  // Updates button color
```

**Before → After**:
- **MUTED (true)** → Click → **UNMUTED (false)** → Button turns white (🔊)
- **UNMUTED (false)** → Click → **MUTED (true)** → Button turns red (🔇)

---

## Console Logging

### Expected Console Messages

```
// On app load with default mute ON
🔇 Global audio mute enabled, skipping alert for patient p1

// User toggles global mute OFF
🔊 Global audio UNMUTED - patient alarms enabled

// Critical patient now plays audio
🚨 Emergency alert: Patient p1

// User toggles global mute ON again
🔇 Global audio MUTED - all patient alarms silenced
⏹️ Emergency alert stopped for patient p1

// User mutes individual patient
🔇 Patient p2 audio muted - stopping playback
hospital:muted-patients → ["p2"]
```

---

## Sign-Off Checklist

- [ ] Global mute defaults to MUTED (true) on first load
- [ ] Global mute button shows red (🔇) on first load
- [ ] Per-patient mutes default to empty array (all unmuted)
- [ ] Per-patient mute buttons show white (🔊) on first load
- [ ] localStorage keys persist across page refresh
- [ ] Toggling global mute updates button color immediately
- [ ] Toggling per-patient mute updates button color immediately
- [ ] Audio respects mute settings (both global and per-patient)
- [ ] No errors in browser console
- [ ] Cross-tab testing confirms NO sync (expected behavior)

---

## Summary

✅ **Per-Patient Mutes**
- Default: UNMUTED (empty array)
- Storage: localStorage only (local)
- Sync: None (expected)

✅ **Global Mute**
- Default: MUTED (true) - Audio disabled by default
- Storage: localStorage only (local)
- Sync: None (expected)
- Button: Red (🔇) on first load

✅ **No Database Storage** (as specified)
✅ **No Cross-Tab Sync** (as specified)
✅ **localStorage Persistence** (survives page refresh)
