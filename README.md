# LA Hop

LA Hop is a full-stack web app that plans **public bus trips in Los Angeles County**.

You pick a **departure time** (now or a custom time), a **starting place**, and a **destination**. The app returns a ranked list of bus options with walk/bus steps and a map. If either place is outside LA County, it responds with **Not available**.

---

## Architecture

```
Browser (React UI)
        |
        |  HTTP JSON
        v
Next.js App Router
  - pages / components   (frontend)
  - /api/* route handlers (backend)
        |
        +-- offline planner (default)  --> local JSON fixtures

```

**Default path (desktop):** everything runs inside one Next.js process. Place search, LA County checks, and trip planning use **checked-in data** under `src/data/`. No external transit API is required at runtime.

**Optional path (later phone + AWS):** set `OTP_URL` so the same `/api/plan` endpoint can call an OpenTripPlanner service. Docker/OTP scaffolding lives in `otp/` and is **not** required to run the desktop app.

### Main folders

| Path | Role |
|------|------|
| `src/app/` | Next.js pages and API routes |
| `src/components/` | Planner form, option list, step details, map |
| `src/lib/` | County geofence, geocoding helpers, offline planner, OTP hook |
| `src/data/` | Places directory, LA County polygon, bus network fixtures |
| `otp/` | Optional OpenTripPlanner Docker setup for AWS |

---

## Languages and frameworks

| Layer | Choice |
|-------|--------|
| Language | **TypeScript** |
| UI | **React 18** |
| Full-stack framework | **Next.js 14** (App Router) |
| Styling | **Tailwind CSS 3** |
| Map | **Leaflet** + **react-leaflet** |
| Package manager | **npm** |

Dependencies are pinned in `package.json` (no floating `latest`).

---

## APIs

### App APIs (this project)

These are local Next.js route handlers — not third-party SaaS APIs.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness check and planner mode (`offline` or `otp`) |
| `GET` | `/api/geocode?q=` | Search the local LA places directory |
| `POST` | `/api/plan` | Plan trips: `{ fromQuery, toQuery, departAt? }` |

Example plan request:

```bash
curl -X POST http://localhost:3000/api/plan \
  -H 'Content-Type: application/json' \
  -d '{"fromQuery":"Union Station","toQuery":"UCLA"}'
```

### External services

| Service | Used in default desktop mode? | Notes |
|---------|-------------------------------|-------|
| OpenStreetMap map tiles | Optional | Map tiles need internet; route lines still work if tiles fail |
| Transitland / Metro live APIs | No | Intentionally avoided for sandbox/offline use |
| OpenTripPlanner | No (unless `OTP_URL` is set) | Optional backend for later AWS hosting |

---

## How to run on desktop

### Requirements

- **Node.js 18+**
- **npm**
- No Docker needed for the default app

### Steps

```bash
git clone https://github.com/yxiaoGit/la-transit-planner.git
cd la-transit-planner
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

Production-style run:

```bash
npm run build
npm start
```

### Try these trips

- Union Station → UCLA  
- LAX → USC  
- Santa Monica Pier → Hollywood/Vine  
- San Diego Downtown → UCLA (shows outside LA County)

---

## Optional: OpenTripPlanner (AWS / phone later)

See [`otp/README.md`](otp/README.md).

1. Build/serve OTP with Docker on a server.  
2. Deploy this Next.js app.  
3. Set `OTP_URL` (see `.env.example`).  
4. Open the site on your phone — Docker stays on the server, not on the device.

---

## License

Personal project. Add a license file if you want to distribute it under specific terms.
