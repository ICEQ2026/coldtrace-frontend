# ColdTrace JSON Server

This folder can be deployed as a standalone JSON Server service for the production frontend.

## Local

```bash
npm install
npm run dev
```

Local Angular development still uses:

```txt
http://localhost:3000
```

## Hosted service

Deploy this `server/` folder as a Node web service.

- Build command: `npm install`
- Start command: `npm start`
- Suggested service name: `coldtrace-json-server`

If the service name is available, the frontend production environment points to:

```txt
https://coldtrace-json-server.onrender.com
```

If the deployed URL is different, update `src/environments/environment.ts`.
