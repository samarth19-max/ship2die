import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: "BF Rocket v2",
    licenseServer: process.env.LS_API_KEY ? "configured" : "not-configured",
    time: new Date().toISOString(),
  });
}
