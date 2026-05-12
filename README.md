# ColdTrace Frontend

ColdTrace is the frontend web application for ICEQ, a platform focused on cold-chain monitoring for food businesses. The current implementation is an Angular application that simulates the product flow with a local JSON Server API.

The project follows the course style used in the reference applications: bounded contexts, standalone Angular components, route-level lazy loading, simple domain entities, infrastructure assemblers, and a small `server/db.json` data source for development.

## Current Scope

- Identity and access management: account creation, sign in, password recovery, users, roles, and permissions.
- Asset management: cold rooms, transport units, IoT devices, gateways, calibration, connectivity, and asset settings.
- Operational monitoring: dashboard KPIs, current readings, alerts, connectivity state, offline sync, charts, and maintenance widgets.
- Reports and audit support: daily log, operational history, sanitary compliance CSV, monthly report CSV, findings, and audit evidence.
- Local and hosted API simulation through JSON Server.

## Project Structure

```txt
src/app/
  identity-access/       Account, users, roles, permissions
  asset-management/      Assets, devices, gateways, calibration
  monitoring/            Dashboard, readings, alerts, offline sync
  reports/               Daily log, history, compliance, audit evidence
  shared/                Layout, shell, language switcher, infrastructure base classes
server/
  db.json                JSON Server data source
docs/
  user-stories.md        User stories and acceptance criteria
  class-diagram.puml     PlantUML class diagram
  frontend-architecture.md
  local-api.md
```

Each bounded context keeps the same internal structure:

```txt
application/             Signal-based state store
domain/model/            Entities, enums, and domain types
infrastructure/          API services, endpoints, resources, assemblers
presentation/            Routes, views, and presentation components
```

## Development

Install dependencies:

```bash
npm install
```

Run the JSON Server API:

```bash
cd server
npm install
npm run dev
```

Run the Angular application:

```bash
npm start
```

Open:

```txt
http://localhost:4200
```

The development frontend uses:

```txt
http://localhost:3000
```

## Build and Test

```bash
npm run build
npm test
```

## Documentation

- [User Stories](docs/user-stories.md)
- [Class Diagram](docs/class-diagram.puml)
- [Frontend Architecture](docs/frontend-architecture.md)
- [Local API](docs/local-api.md)

## Notes

- The application keeps the product-facing UI in English.
- The local API is used only to simulate the required flows for the course delivery.
- Real JWT authentication, real email delivery, and production backend authorization are outside the current frontend scope.
