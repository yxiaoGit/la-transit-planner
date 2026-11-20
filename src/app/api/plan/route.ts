import { NextRequest, NextResponse } from "next/server";
import { planTrip } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const fromQuery = String(body.fromQuery ?? "");
  const toQuery = String(body.toQuery ?? "");
  const departAt = body.departAt ? String(body.departAt) : undefined;

  if (!fromQuery || !toQuery) {
    return NextResponse.json(
      {
        ok: false,
        mode: process.env.OTP_URL ? "otp" : "offline",
        code: "PLACE_NOT_FOUND",
        message: "Start and destination are required.",
      },
      { status: 400 }
    );
  }

  const result = await planTrip({ fromQuery, toQuery, departAt });
  const status = result.ok ? 200 : result.code === "OUTSIDE_LA_COUNTY" ? 422 : 404;
  return NextResponse.json(result, { status });
}
