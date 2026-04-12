import { NextResponse } from "next/server";

// Force dynamic rendering — health checks must never be cached
export const dynamic = "force-dynamic";

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  version: string;
  environment: string;
  checks: Record<string, boolean>;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  // Health route checks runtime state directly — process.env intentional here.
  // Using process.env is acceptable in monitoring endpoints that validate env
  // presence without the requireEnv throw semantics from lib/env.ts.
  const checks = {
    server: true,
    env: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };

  const healthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      environment: process.env.NODE_ENV ?? "production",
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}
