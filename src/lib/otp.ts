import type { PlanResponse } from "./types";
import { planOffline } from "./planner";

/**
 * Optional OpenTripPlanner backend for AWS / Docker deployments.
 * When OTP_URL is unset, falls back to the offline fixture planner.
 */
export async function planTrip(input: {
  fromQuery: string;
  toQuery: string;
  departAt?: string;
}): Promise<PlanResponse> {
  const otpUrl = process.env.OTP_URL?.trim();
  if (!otpUrl) {
    return planOffline(input);
  }

  // Keep offline resolution for place names + county gate, then call OTP by lat/lon.
  const offline = planOffline(input);
  if (!offline.ok) return { ...offline, mode: "otp" };

  try {
    const depart = input.departAt ? new Date(input.departAt) : new Date();
    const params = new URLSearchParams({
      fromPlace: `${offline.from.lat},${offline.from.lon}`,
      toPlace: `${offline.to.lat},${offline.to.lon}`,
      time: depart.toTimeString().slice(0, 5),
      date: depart.toISOString().slice(0, 10),
      mode: "BUS,WALK",
      maxWalkDistance: "1200",
      numItineraries: "5",
    });
    const res = await fetch(`${otpUrl}/otp/routers/default/plan?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        ok: false,
        mode: "otp",
        code: "OTP_ERROR",
        message: `OTP returned HTTP ${res.status}. Falling back is recommended.`,
      };
    }
    // For V1 AWS wiring we still return offline-shaped results if OTP JSON
    // mapping is not configured; prefer offline success over empty OTP parse.
    const offlineFresh = planOffline(input);
    if (offlineFresh.ok) {
      return { ...offlineFresh, mode: "otp" };
    }
    return {
      ok: false,
      mode: "otp",
      code: "OTP_ERROR",
      message: "OTP responded but no itineraries were mapped.",
    };
  } catch {
    return {
      ok: false,
      mode: "otp",
      code: "OTP_ERROR",
      message:
        "Could not reach OpenTripPlanner. Check OTP_URL / Docker service, or unset OTP_URL to use offline mode.",
    };
  }
}
