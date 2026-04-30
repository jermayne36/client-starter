import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Users, FileText, BarChart3 } from "lucide-react"

const stats = [
  { label: "Total users", value: "2,847", change: "+12%", icon: Users },
  { label: "Documents", value: "1,204", change: "+4%", icon: FileText },
  { label: "Revenue", value: "$48,295", change: "+8%", icon: TrendingUp },
  { label: "Conversions", value: "6.4%", change: "+1.2%", icon: BarChart3 },
]

const recentActivity = [
  { name: "Alex Chen", action: "Created a new document", time: "2 min ago", initials: "AC" },
  { name: "Sara Kim", action: "Updated account settings", time: "14 min ago", initials: "SK" },
  { name: "Marcus Lee", action: "Invited 3 team members", time: "1 hr ago", initials: "ML" },
  { name: "Priya Patel", action: "Exported analytics report", time: "3 hr ago", initials: "PP" },
]

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <section aria-label="Key metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, change, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {change} this month
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentActivity.map((item, i) => (
                <li key={i}>
                  <div className="flex items-start gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs">{item.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.action}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  {i < recentActivity.length - 1 && <Separator className="mt-4" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Placeholder chart panel */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-sm italic text-muted-foreground">
                Chart component — wire up Recharts when ready.
              </p>
              {/* Loading skeleton to demonstrate the pattern */}
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
