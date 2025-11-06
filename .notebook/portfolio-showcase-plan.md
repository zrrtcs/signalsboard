# Portfolio Showcase Plan: Real-time Hospital Dashboard

**Objective:** Build a visually impressive real-time hospital monitoring dashboard for portfolio presentation with code walkthrough capability for recruiters.

**Timeline:** 5 hours
**Date:** 2025-11-02
**Branch:** `feature/realtime-dashboard-showcase`

---

## Project Goals

1. **Visual Impact**: Create a compelling demo showing real-time vital signs monitoring
2. **Code Quality**: Clean, well-architected code suitable for technical interviews
3. **Full-Stack Skills**: Demonstrate .NET + SignalR + React + TypeScript proficiency
4. **Medical Domain**: Show understanding of healthcare monitoring requirements

---

## Architecture Overview

### Technology Stack

**Backend:**
- ASP.NET Core 8 Minimal API
- SignalR for WebSocket real-time communication
- Entity Framework Core 9 + PostgreSQL
- Background Services for simulation

**Frontend:**
- React 19 + TypeScript + Vite
- Zustand for state management (modern, lightweight)
- SignalR Client for real-time updates
- Recharts for vital signs visualization
- Tailwind CSS for styling
- Framer Motion for animations

**Why These Choices:**
- **SignalR**: Industry-standard for .NET real-time apps, shows understanding of WebSocket protocols
- **Zustand**: Modern alternative to Redux, demonstrates knowledge of latest React patterns
- **TypeScript**: Type safety critical for medical applications
- **Recharts**: Production-ready charting library, declarative React API

---

## Hour-by-Hour Breakdown

### Hour 1: Backend - SignalR Hub + Simulation (60 min)

#### 1.1 SignalR Infrastructure (15 min)
**Files to create:**
- `Hospital.Api/Hubs/VitalsHub.cs`

**Implementation:**
```csharp
public class VitalsHub : Hub
{
    // Broadcast vital signs update to all connected clients
    public async Task SendVitalUpdate(string patientId, VitalSigns vitals)

    // Join patient-specific group for targeted updates
    public async Task SubscribeToPatient(string patientId)
}
```

**Configuration:**
- Add `Microsoft.AspNetCore.SignalR` package
- Configure CORS for React dev server (localhost:5173)
- Register hub at `/hubs/vitals` endpoint

**Walkthrough Points:**
- "SignalR uses WebSocket with long-polling fallback for browser compatibility"
- "Hub pattern provides RPC-style API over persistent connection"
- "CORS configured for development, would use environment-specific in production"

#### 1.2 Vital Signs Simulator Service (30 min)
**Files to create:**
- `Hospital.Api/Services/VitalSignsSimulatorService.cs`

**Implementation:**
- Implement `IHostedService` for background execution
- Simulate realistic vital signs with gradual drift (not random jumps)
- 20% probability of abnormal vitals, 5% critical
- Inject `AlertService` to generate alerts on critical conditions
- Broadcast updates via `IHubContext<VitalsHub>`

**Medical Realism:**
- Heart rate drifts ±5 BPM per update
- SpO2 slowly decreases during deterioration
- Blood pressure changes gradually

**Walkthrough Points:**
- "BackgroundService demonstrates proper .NET hosted service lifecycle"
- "Dependency injection for HubContext and AlertService shows SOLID principles"
- "Realistic simulation more impressive than random data for medical domain"

#### 1.3 Manual Testing API (15 min)
**Endpoint:** `POST /api/vitals/inject`

**Purpose:** Allow manual vital signs injection from UI testing tool

**Walkthrough Points:**
- "Testing endpoint demonstrates understanding of E2E testing needs"
- "Immediate SignalR broadcast shows real-time flow"

---

### Hour 2: Frontend Setup + Architecture (60 min)

#### 2.1 Dependencies (10 min)
```bash
npm install @microsoft/signalr zustand recharts
npm install -D tailwindcss @tailwindcss/forms
```

#### 2.2 Tailwind Configuration (15 min)
**Medical Color Palette:**
- Critical: red-600
- High: orange-500
- Medium: yellow-500
- Normal: green-500
- Dark theme optimized for TV displays

**Walkthrough Points:**
- "Design system approach with semantic color naming"
- "Accessibility considerations for medical monitoring"

#### 2.3 Type Definitions (15 min)
**File:** `src/types/hospital.ts`

**Types to define:**
```typescript
interface Patient {
  id: string
  name: string
  mrn: string
  bed?: Bed
  status: 'stable' | 'watch' | 'critical'
  vitalSigns: VitalSigns[]
}

interface VitalSigns {
  heartRate?: number
  spO2?: number
  bpSystolic?: number
  bpDiastolic?: number
  recordedAt: string
}

type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
```

**Walkthrough Points:**
- "TypeScript prevents runtime errors in medical applications"
- "Types mirror backend domain entities for consistency"

#### 2.4 Zustand Store (20 min)
**File:** `src/store/hospitalStore.ts`

**State:**
- Patients map (keyed by ID for O(1) updates)
- Connection status
- Active alerts
- Selected ward filter

**Walkthrough Points:**
- "Zustand provides Redux-like patterns with less boilerplate"
- "Immer integration for immutable updates"
- "Selector pattern for derived state (filtered patients)"

---

### Hour 3: Real-time Dashboard (60 min)

#### 3.1 SignalR Hook (20 min)
**File:** `src/hooks/useSignalR.ts`

**Features:**
- Auto-connect on mount with cleanup
- Exponential backoff reconnection (1s, 2s, 4s, 8s)
- Event handlers update Zustand store
- Return connection status for UI

**Walkthrough Points:**
- "Custom hook encapsulates SignalR complexity - single responsibility"
- "Reconnection logic handles network interruptions gracefully"
- "Effect cleanup prevents memory leaks"

#### 3.2 Patient Dashboard (40 min)
**Files:**
- `src/components/PatientGrid.tsx` - Responsive grid layout
- `src/components/PatientCard.tsx` - Individual patient display

**PatientCard Features:**
- Name, MRN, bed, ward
- Vital signs with color indicators
- Alert badges
- Mini sparkline (last 10 readings)
- Click to open trend chart

**Visual States:**
- Green border: all normal
- Yellow border: Medium severity
- Red border + pulse: Critical
- Gray border: stale data (>30 sec)

**Walkthrough Points:**
- "Component composition: Grid owns layout, Card owns display logic"
- "Pure presentational components for testability"
- "CSS animations for critical alerts - no JavaScript performance hit"

---

### Hour 4: Charts + Testing Tool (60 min)

#### 4.1 Vital Trends Chart (30 min)
**File:** `src/components/VitalTrendsChart.tsx`

**Features:**
- Recharts LineChart with multi-series
- Threshold zones (background fills for normal ranges)
- Interactive tooltip with timestamp
- Responsive container
- Fetches historical data from `/api/patients/{id}/trend`

**Walkthrough Points:**
- "Recharts declarative API fits React paradigm"
- "Detail-on-demand UX pattern reduces cognitive load"
- "Threshold visualization helps identify patterns"

#### 4.2 Testing Tool (30 min)
**File:** `src/components/VitalInjectorPanel.tsx`

**Features:**
- Patient selector dropdown
- Range sliders for each vital sign
- Live severity preview
- Preset buttons (Normal, Alert, Critical)
- POST to `/api/vitals/inject` on submit

**Walkthrough Points:**
- "Demonstrates full-stack integration understanding"
- "Shows knowledge of medical thresholds"
- "Testing mindset - building tools for QA"

---

### Hour 5: Polish + Demo Prep (60 min)

#### 5.1 Visual Enhancements (20 min)
- Framer Motion animations:
  - Critical alerts: pulsing glow
  - Vital updates: fade-in
  - Modal enter/exit
- Connection status indicator (top-right)
- Loading skeletons
- Error boundaries

**Walkthrough Points:**
- "Animations enhance UX without hurting performance"
- "Error boundaries prevent cascading failures"
- "Progressive enhancement - works without animations"

#### 5.2 Code Documentation (20 min)
**File:** `.notebook/code-walkthrough-script.md`

**Sections:**
- Backend architecture
- SignalR hub pattern
- Frontend state management
- Real-time synchronization
- Medical domain logic

**Walkthrough Points:**
- "Documentation as code - JSDoc for IDE support"
- "Architectural decision records (ADRs) explain why, not just what"

#### 5.3 Demo Recording (20 min)
**Demo Script:**
1. Show dashboard with 12 patients
2. Auto-updates every 2-3 seconds
3. Use injector to trigger critical alert
4. Watch visual changes (red border, pulse, alert badge)
5. Click card → trend chart modal
6. Show reconnection (stop backend, restart, auto-reconnect in <2 sec)

**Recording Tools:**
- OBS Studio for video
- ScreenToGif for GIF
- 2-3 minutes max

---

## Code Walkthrough Script for Recruiters

### Backend (10 min walkthrough)

**1. Domain-Driven Design:**
- "Started with domain entities (Patient, VitalSigns, Alert)"
- "Business logic lives in domain layer (CalculateRiskLevel, AssessHeartRateAlert)"
- "Services orchestrate domain entities (AlertService)"

**2. SignalR Hub:**
- "Hub provides strongly-typed RPC over WebSocket"
- "Scales horizontally with Redis backplane in production"
- "Graceful degradation to long-polling if WebSocket unavailable"

**3. Background Service:**
- "IHostedService for long-running tasks"
- "Scoped DI pattern for DbContext - avoids lifetime issues"
- "Realistic simulation shows understanding of medical monitoring"

### Frontend (15 min walkthrough)

**1. Architecture:**
- "Component-based architecture with clear separation"
- "Custom hooks for reusable logic (useSignalR, usePatientAlerts)"
- "Zustand for predictable state updates"

**2. Real-time Updates:**
- "SignalR client maintains persistent connection"
- "Optimistic updates for responsiveness"
- "State reconciliation on reconnect"

**3. Type Safety:**
- "TypeScript prevents entire classes of bugs"
- "Shared types with backend via code generation (future)"
- "Discriminated unions for exhaustive checks"

### Integration (5 min walkthrough)

**1. SignalR Protocol:**
- "MessagePack for binary serialization (smaller payloads)"
- "Automatic reconnection with exponential backoff"
- "CORS configured properly for security"

**2. Medical Logic:**
- "Evidence-based alert thresholds (AHA guidelines)"
- "Risk escalation logic (multiple abnormal vitals)"
- "Time-series optimization for trend queries"

---

## Success Metrics

**Visual:**
✅ Real-time updates visible within 2-3 seconds
✅ Critical alerts immediately noticeable (red pulse)
✅ Smooth animations, no jank
✅ Professional appearance for portfolio

**Technical:**
✅ All 47 tests still passing
✅ Clean git history with conventional commits
✅ Well-documented code with JSDoc
✅ No ESLint warnings

**Demo:**
✅ 2-3 minute video recorded
✅ Screenshots for portfolio
✅ Code walkthrough script prepared

---

## Future Enhancements (Post-Portfolio)

1. **Authentication & Authorization**
   - Role-based access (Nurse, Doctor, Admin)
   - Azure AD / OAuth integration

2. **Mobile App**
   - React Native with shared SignalR logic
   - Push notifications for critical alerts

3. **Advanced Analytics**
   - ML-based early warning scores
   - Trend prediction
   - Anomaly detection

4. **Scalability**
   - Redis backplane for SignalR
   - Azure SignalR Service
   - Microservices decomposition

5. **Compliance**
   - HIPAA audit logging
   - PHI encryption at rest/transit
   - Data retention policies

---

## References

- [SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Recharts Examples](https://recharts.org/)
- [AHA Vital Signs Guidelines](https://www.heart.org/)
- [Medical Device Design Patterns](https://www.fda.gov/medical-devices)

---

**Last Updated:** 2025-11-02
**Status:** In Progress
**Branch:** `feature/realtime-dashboard-showcase`
