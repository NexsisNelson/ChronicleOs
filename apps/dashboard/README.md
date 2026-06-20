# ChronicleOS Dashboard

Developer UI for introspecting agent memory and artifacts.

## Features

- **Memory Timeline Visualizer** - Chronological view of agent state changes
- **Artifact Explorer** - Browse files stored on Walrus
- **Agent Status Monitor** - Real-time agent execution status
- **Execution History** - Replay and analyze past workflows

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_WALRUS_GATEWAY=https://walrus-testnet-gateway.sui.io
NEXT_PUBLIC_MEMWAL_API=/api/memwal
NEXT_PUBLIC_LOG_LEVEL=info
```

## Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── (dashboard)/
│       ├── memory/         # Memory Timeline pages
│       ├── artifacts/      # Artifact Explorer pages
│       ├── agents/         # Agent Status pages
│       └── history/        # Execution History pages
├── components/
│   ├── timeline/           # Timeline visualizer
│   ├── artifact-explorer/  # Walrus file browser
│   ├── agent-monitor/      # Status indicators
│   └── common/             # Shared UI components
├── lib/
│   ├── api/
│   │   ├── memwal-client.ts    # MemWal API client
│   │   └── walrus-client.ts    # Walrus gateway client
│   ├── hooks/              # React hooks
│   └── types.ts            # Shared TypeScript types
└── styles/
    └── globals.css         # Global styles
```

## Development

- **UI Components:** Built with Radix UI + Tailwind CSS
- **Data Visualization:** Recharts + Tremor
- **State Management:** Zustand
- **HTTP Client:** Axios

## Build

```bash
npm run build
npm start
```
