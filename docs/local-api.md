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
/assets
/iot-devices
/gateways
/asset-settings
/sensor-readings
/reports
/password-reset-requests
```

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

If the hosted service URL changes, update `platformProviderApiBaseUrl` in `environment.ts`.

---

## Frontend Integration Pattern

Each bounded context has infrastructure classes that wrap the endpoint access.

Example pattern:

```txt
domain entity <-> assembler <-> endpoint/api <-> JSON Server resource
```

The purpose is to keep presentation components working with domain entities instead of raw JSON resources.

---

## Current Limitations

- Authentication is simulated in the frontend flow.
- Password recovery is represented through local data and visual states.
- Email delivery is not implemented.
- Authorization is enforced by visible UI behavior and store logic, not by a production backend.
