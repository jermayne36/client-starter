import { getUser } from "@/lib/auth"
import { prisma } from "@client/database/client"
import { DashboardShell } from "./shell"

// Server component — runs on every authenticated request to any /dashboard/*
// or /billing route. Performs a lazy Prisma upsert so email/password login users
// (who bypass the OAuth callback sync) always have a database record by the time
// they reach a protected page.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (user?.email) {
    const name: string | null =
      (user.user_metadata?.name as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      null
    const avatarUrl: string | null =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null
    const emailVerified =
      user.email_confirmed_at != null || user.confirmed_at != null

    // Fire-and-forget is intentional: sync failure must not block page render.
    // The upsert is idempotent — existing users hit the UPDATE branch instantly.
    prisma.user
      .upsert({
        where: { supabaseId: user.id },
        update: { email: user.email, name, avatarUrl, emailVerified },
        create: {
          supabaseId: user.id,
          email: user.email,
          name,
          avatarUrl,
          emailVerified,
        },
      })
      .catch((err: unknown) => {
        console.error("[dashboard/layout] lazy user sync failed:", err)
      })
  }

  return <DashboardShell>{children}</DashboardShell>
}
