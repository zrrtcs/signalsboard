Noted. Here’s a drop-in **README.md** you can paste into Claude Code to scaffold the repo.

---

# hospital-display

Production-ready demo: **Hospital Patient-Care Dashboard** with **realtime SignalR** updates and React UI. Optimized for a wall/TV display.

## Goals

* Zero-touch TV mode: readable at 2–5 m, resilient to flaky networks.
* Show skills in **.NET + SignalR + React + TypeScript**.
* Easy deploy: **Azure App Service** (API) + optional **GitHub Pages** (web).

## Architecture (choice A: recommended)

* **Frontend**: React + Vite + TS, Tailwind, Recharts, Zustand.
* **Backend**: ASP.NET Core Minimal API + **SignalR** hub.
* **Contracts**: Swagger/OpenAPI → generate TS client (NSwag).
* **Hosting**:

  * API: Azure App Service (free tier OK).
  * Web: GitHub Pages or same App Service (static files).
* **Why**: Pages is static; SignalR needs a backend → decouple UI from API.

```
hospital-display/
├─ src/
│  ├─ Api/                 # ASP.NET Core + SignalR
│  └─ Web/                 # React + Vite (static)
├─ packages/
│  └─ ts-contracts/        # generated TS client/types
├─ .github/workflows/      # CI + Pages
└─ Hospital.sln
```

> Alternative (choice B): single ASP.NET app serving `.cshtml` or SPA and hosting SignalR in one deployable. Simpler for SignalR, no Pages.

---

## Features

1. **Realtime dashboard** via **SignalR WebSocket** with REST fallback.
2. Ward overview: table/grid of patients (Name, MRN, Bed, Status, HR, BP, SpO₂, last update).
3. Alerts: color thresholds (red/yellow/green) + sticky/high-contrast badges.
4. Mini sparkline per patient; modal trend chart on click.
5. Search/filter: ward, acuity, “only alerts”.
6. Offline/recovery: connection pill, auto-retry, stale watermark after N sec.
7. TV/Kiosk mode: rotate cards full-screen, no pointer, ErrorBoundary safety.
8. Settings drawer (protected toggle): thresholds, rotation interval, 12/24h.

---

## Tech

* React + Vite + TypeScript
* State: Zustand
* Router: React Router
* Styling: Tailwind
* Charts: Recharts
* **Realtime: SignalR client**; REST fallback (Axios)
* Testing: Vitest + React Testing Library
* Lint/Format: ESLint + Prettier
* Docker: API + Web
* CI: GitHub Actions (build, test, deploy)

---

## Data Contracts (DTOs)

```json
// Ward
{ "id":"w1", "name":"Ward A" }

// Patient summary
{
  "id":"p1","name":"Jane Doe","mrn":"MRN123","bed":"A-12",
  "status":"stable|watch|critical",
  "vitals":{"hr":92,"bpSys":124,"bpDia":78,"spo2":98},
  "updatedAt":"2025-08-28T03:21:00Z"
}

// Trend point
{ "tISO":"2025-08-28T03:21:00Z","hr":92,"bpSys":124,"bpDia":78,"spo2":98 }
```

**REST**

* `GET /api/wards` → `Ward[]`
* `GET /api/patients?wardId=...` → `Patient[]`
* `GET /api/patients/:id/trend?minutes=240` → `TrendPoint[]`

**SignalR Hub**

* Hub: `/hubs/vitals`
* Server → client message `vitals:update`

```json
{
  "patientId":"p123",
  "vitals":{"hr":92,"bpSys":124,"bpDia":78,"spo2":98},
  "updatedAt":"2025-08-28T03:21:00Z",
  "name":"Jane Doe","mrn":"MRN123","bed":"A-12","status":"watch"
}
```

---

## Alert Logic (defaults)

* HR: <50 or >120 → red; 50–60 or 100–120 → yellow
* SpO₂: <92 → red; 92–94 → yellow
* BP Sys: >160 red; 140–160 yellow
* Adjustable in Settings; persisted to localStorage.

---

## Environment

Frontend (`src/Web/.env`):

```
VITE_API_BASE=https://<your-api>.azurewebsites.net
VITE_WS_URL=wss://<your-api>.azurewebsites.net/hubs/vitals
VITE_DEMO_MODE=true
```

Backend (`src/Api/appsettings.json`):

```json
{ "Cors": { "AllowedOrigins": ["https://<user>.github.io"] } }
```

---

## Tasks for Claude (scaffold instructions)

1. **Create solution & projects**

* `Hospital.sln` with `src/Api` (.NET 8 minimal API + SignalR) and `src/Web` (Vite React TS).

2. **API**

* Add Swagger/Swashbuckle at `/swagger/v1/swagger.json`.
* Add SignalR hub `VitalsHub` at `/hubs/vitals`. Broadcast `vitals:update`.
* Add endpoints: `GET /api/wards`, `GET /api/patients`, `GET /api/patients/{id}/trend`.
* Add `/healthz` liveness.
* CORS: allow `http://localhost:5173` and `https://<user>.github.io`.
* Seed: background service pushes random vitals every 1–2s via hub.

3. **Contracts generation**

* Add NSwag (CLI or MSBuild) to emit TS client/types into `packages/ts-contracts`.
* Web imports generated types and client.

4. **Web**

* Zustand store with shape:

```ts
{ wards: Ward[]; currentWardId?: string;
  patients: Record<string,Patient>;
  alertsOnly: boolean;
  thresholds: { hr:{hi,lo}, spo2:{lo}, bpSys:{hi}, bpDia:{hi} };
  kiosk: { rotate: boolean; intervalSec: number };
  connection: { online: boolean; lastHeartbeat?: string }; }
```

* Components: `AppShell`, `WardSelector`, `PatientGrid`, `PatientRow`, `AlertBadge`, `Sparkline`, `PatientBannerRotator`, `VitalsChart`, `SettingsDrawer`, `ConnectionStatus`, `ErrorBoundary`.
* SignalR client connects to `VITE_WS_URL`, updates store; REST poll every 10s as fallback.
* Tailwind configured; high-contrast theme.

5. **Tests (Vitest/RTL)**

* Renders with empty data.
* Threshold coloring works.
* WS reconnect shows offline banner.
* Single patient update doesn’t re-render entire grid.
* ErrorBoundary recovers after refresh.

6. **Docker**

* API Dockerfile (ASP.NET runtime).
* Web Dockerfile (nginx serve of `dist`).
* Optional `docker-compose.yml` for local run.

7. **CI/CD**

* `ci.yml`: build/test API + Web, run unit tests, build Web.
* `pages.yml`: build Web and deploy `dist/` to GitHub Pages (set Vite `base`).
* `azure-webapp.yml`: build/publish API to Azure App Service.

8. **README badges + demo**

* Add scripts: `dev`, `build`, `preview`, `test`, `lint`.
* Short demo script (switch ward, trigger alert, show banner, tweak thresholds, simulate offline).

---

## Local Dev

```bash
# API
cd src/Api
dotnet restore
dotnet run  # https://localhost:5001

# Web
cd src/Web
npm i
npm run dev  # http://localhost:5173
```

If hosting Web on Pages:

* Set `base` in `vite.config.ts` to `/${repo}/`.
* Configure `VITE_API_BASE` and `VITE_WS_URL` to your Azure URL.

---

## Deploy

### API → Azure App Service

* Create App Service (Free F1).
* Deployment Center → connect GitHub repo → .NET build → deploy.
* Get URL: `https://<app>.azurewebsites.net`.

### Web → GitHub Pages

* Enable Pages in repo settings.
* Use `pages.yml` to build and publish `/src/Web/dist`.
* Point env vars to Azure API.

---

## Acceptance Criteria

* Web shows ward table with live vitals via **SignalR**; updates within 2s (demo seed).
* Disconnect simulation shows offline banner; REST fallback continues updates every 10s.
* Alerts color according to thresholds; settings modify behavior without reload.
* Trend modal renders for a patient and fetches last 240 minutes on open.
* Lighthouse: FCP ≤ 1s (local), no major accessibility violations.

---

## Stretch

* PIN-locked settings.
* i18n: `en`, `ms` via `react-i18next`.
* OpenTelemetry traces: route load, WS connect/disconnect.

---

## License

MIT (demo; mock data only).

---

If you want, I can generate the **SignalR hub + Minimal API skeleton** and the **Vite config** next.
