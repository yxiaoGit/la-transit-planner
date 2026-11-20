#!/usr/bin/env bash
# Downloads LA Metro bus GTFS + a SoCal OSM extract for OTP graph builds.
# Requires internet. Not used in Handshake offline mode.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/data"
mkdir -p "$DATA"

echo "Downloading LA Metro bus GTFS..."
curl -L "https://gitlab.com/LACMTA/gtfs_bus/-/raw/master/gtfs_bus.zip" -o "$DATA/gtfs_bus.zip"

echo "Copying OTP configs into data dir..."
cp "$ROOT/config/"*.json "$DATA/" 2>/dev/null || true

echo "Done. Next:"
echo "  1) Add an OSM .pbf for the LA area into otp/data (e.g. from Geofabrik)"
echo "  2) docker compose -f otp/docker-compose.yml run --rm otp --build --save"
echo "  3) docker compose -f otp/docker-compose.yml up"
echo "  4) export OTP_URL=http://localhost:8080"
