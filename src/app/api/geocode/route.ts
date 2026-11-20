import { NextRequest, NextResponse } from "next/server";
import { searchPlaces, listPlaces } from "@/lib/places";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = q.trim() ? searchPlaces(q) : listPlaces().slice(0, 12);
  return NextResponse.json({ results });
}
