# ColdTrace Local API

This document explains how the current frontend consumes the simulated API used for development and demonstrations.

---

## API Provider

The project uses JSON Server as a simple local API.

Folder:

```txt
server/
```

Main data file:

```txt
server/db.json
```

---

## Run Locally

From the server folder:

```bash
cd server
npm install
npm run dev
```

The local API runs at:

```txt
http://localhost:3000
```

---

## Main Collections

The frontend currently expects these collections:

```txt
/users
/organizations
/roles
/password-reset-requests
/assets
/iot-devices
/gateways
/asset-settings
/sensor-readings
/reports
/incidents
/notifications
/maintenance-schedules
/technical-service-requests
```

Most records include `organizationId` so dashboard, access, reports, alerts, and maintenance views can stay scoped to the active organization.

---

## Collection Responsibilities

- `/users`, `/organizations`, `/roles`, and `/password-reset-requests` support the identity and access flows.
- `/assets`, `/iot-devices`, `/gateways`, and `/asset-settings` support asset registration, device linkage, connectivity state, and configurable safety ranges.
- `/sensor-readings` supports monitoring dashboards, report generation, alert detection, and offline sync simulation.
- `/reports` stores generated report references for daily log, compliance, monthly summary, and audit evidence workflows.
- `/incidents` and `/notifications` support alert recognition, corrective closure, escalation, and notification review.
- `/maintenance-schedules` and `/technical-service-requests` support preventive maintenance and technical service tracking.

---

## Environment Files

Development:

```txt
src/environments/environment.development.ts
```

Production:

```txt
src/environments/environment.ts
```

The development environment points to `http://localhost:3000`.

The production environment points to the hosted JSON Server service:

```txt
https://coldtrace-json-server.onrender.com
```

If the hosted service URL changes, update `platformProviderApiBaseUrl` in `environment.ts`. The hosted service is used so the deployed frontend does not require the local JSON Server process to be running.

---

## Frontend Integration Pattern

Each bounded context has infrastructure classes that wrap the endpoint access.

Example pattern:

```txt
domain entity <-> assembler <-> endpoint/api <-> JSON Server resource
```

The purpose is to keep presentation components working with domain entities instead of raw JSON resources.

The shared `BaseApiEndpoint` handles common CRUD operations. Each context still owns its API facade and assembler classes so the project remains close to the professor reference architecture.

---

## Current Limitations

- Authentication is simulated in the frontend flow.
- Password recovery is represented through local data and visual states.
- Email delivery is not implemented.
- Authorization is enforced by visible UI behavior and store logic, not by a production backend.
- Alert escalation, report generation, and maintenance tracking are frontend workflows backed by JSON Server data.
- Telemetry changes for demo dashboards are simulated by the frontend store while reading asset configuration from the API data.
