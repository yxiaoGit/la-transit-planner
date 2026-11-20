# OpenTripPlanner (optional AWS / Docker path)

This folder is **not required** to run LA Hop in offline/Handshake mode.

## When to use it

Host OTP on a server (EC2, ECS, etc.), set `OTP_URL` on the Next.js app, and point your phone browser at the web app. Docker never runs on the phone.

## Rough AWS flow

1. Provision a VM / container host with ≥4GB RAM.
2. Run `otp/scripts/download-data.sh` (needs internet) and add an LA OSM `.pbf`.
3. Build the OTP graph, then serve on port 8080.
4. Deploy the Next.js app with `OTP_URL=https://your-otp-host`.
5. Keep `OTP_URL` empty for offline fixture planning.

Image pin: `opentripplanner/opentripplanner:2.5.0` (mature release).
