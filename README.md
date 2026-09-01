# Frontend Documentation

This frontend is a Next.js application for the health and wellness platform.

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Main Structure

- app/: route pages and layouts
- components/: shared UI components
- lib/: API helpers and auth utilities
- public/: static assets

## Available Routes

- /login
- /dashboard
- /chat
- /goals

## Run Locally

Install dependencies:
```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000.

## Environment Notes

The frontend expects the backend API at the configured API base URL in the client helpers. Update the endpoint configuration if your backend runs on a different host or port.

## Build

```bash
npm run build
```
