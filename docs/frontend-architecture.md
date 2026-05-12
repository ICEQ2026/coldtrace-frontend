# ColdTrace Frontend Architecture

This document describes the current frontend architecture used by `coldtrace-frontend`. It follows the same lightweight documentation style used in the class reference projects.

---

## Architectural Style

The application is organized by bounded context. Each context separates domain models, API infrastructure, application state, and presentation views.

```txt
bounded-context/
  application/
  domain/model/
  infrastructure/
  presentation/
```

Angular standalone components are loaded through route-level lazy loading. Shared layout elements live under `shared/presentation/components`.

---

## Bounded Contexts

### Identity Access

Folder: `src/app/identity-access`

Purpose:

- Account creation.
- Sign in.
- Password recovery and reset.
- User list.
- Role and permission management.
- Current organization and role context.

Main store:

- `IdentityAccessStore`

Main routes:

- `/identity-access/sign-in`
- `/identity-access/sign-up`
- `/identity-access/password-recovery`
- `/identity-access/reset-password`
- `/identity-access/roles-permissions`

---

### Asset Management

Folder: `src/app/asset-management`

Purpose:

- Cold rooms and refrigerated transport units.
- IoT devices.
- Gateways.
- Calibration and connectivity state.
- Safety settings used by monitoring and reports.

Main store:

- `AssetManagementStore`

Main route:

- `/asset-management/assets`

---

### Monitoring

Folder: `src/app/monitoring`

Purpose:

- Operational dashboard.
- KPI cards.
- Temperature chart.
- Storage distribution.
- Recent alerts.
- Maintenance list.
- Offline reading sync state.

Main store:

- `MonitoringStore`

Main route:

- `/identity-access/dashboard`

The dashboard reads both asset data and sensor readings to present operational status.

---

### Reports

Folder: `src/app/reports`

Purpose:

- Daily thermal log.
- Operational history.
- Sanitary compliance export.
- Monthly report export.
- Compliance findings.
- Audit evidence checklist.

Main store:

- `ReportsStore`

Main routes:

- `/reports/daily-log`
- `/reports/history`
- `/reports/compliance`
- `/reports/monthly`
- `/reports/findings`
- `/reports/audit-evidence`

---

## Shared Layer

Folder: `src/app/shared`

Purpose:

- Dashboard shell.
- Public layout.
- Language switcher.
- Page not found view.
- Base API endpoint, assembler, response, and entity contracts.

The shared infrastructure keeps the JSON Server integration consistent across contexts.

---

## Routing

Root route file: `src/app/app.routes.ts`

```txt
/identity-access
/asset-management
/monitoring
/reports
```

Each route loads its feature routes lazily. This keeps the root router simple and close to the professor reference style.

---

## State Management

The application uses Angular signals in lightweight stores instead of a global state library.

Examples:

- `IdentityAccessStore` keeps users, roles, organizations, and current user context.
- `AssetManagementStore` keeps assets, devices, gateways, and settings.
- `MonitoringStore` keeps sensor readings and offline sync state.
- `ReportsStore` builds report view models from monitoring and asset data.

---

## Internationalization

The application uses `@ngx-translate/core`.

Translation files:

```txt
public/i18n/en.json
public/i18n/es.json
```

Product UI text is kept in English by default, with Spanish support where translation keys exist.

---

## API Simulation

Development uses `server/db.json` through JSON Server.

The frontend reads endpoint paths from:

```txt
src/environments/environment.development.ts
src/environments/environment.ts
```

The local development URL is:

```txt
http://localhost:3000
```

Production is configured to use the hosted JSON Server URL when available.
