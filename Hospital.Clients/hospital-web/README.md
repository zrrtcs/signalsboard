# Hospital Dashboard Web Client

React frontend for the Signalsboard hospital patient monitoring system.

## Quick Start

```bash
# Install dependencies
npm install

# Development (requires API running on localhost:8080)
npm run dev

# Production build
npm run build
```

## Environment

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | REST API base URL |
| `VITE_HUB_URL` | SignalR WebSocket hub URL |

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Build tool
- **Material-UI** - Component library
- **Zustand** - State management
- **SignalR** - Real-time WebSocket updates
- **Recharts** - Vital signs visualization

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom hooks (SignalR, etc.)
├── services/       # API client
├── store/          # Zustand state
└── types/          # TypeScript interfaces
```