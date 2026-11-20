import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: process.env.OTP_URL ? "otp" : "offline",
    service: "la-hop",
  });
}
