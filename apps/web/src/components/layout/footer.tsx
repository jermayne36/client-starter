import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  Offer: [
    { href: "#proof", label: "Proof" },
    { href: "#deliverables", label: "Deliverables" },
    { href: "#pricing", label: "Pricing" },
  ],
  Company: [
    { href: "https://www.edukassolutions.com", label: "Edukas Solutions" },
    { href: "/about", label: "About" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
    { href: "/refund", label: "Refund" },
  ],
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 font-semibold mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                10
              </div>
              <span>First 10 Users</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Evidence-backed first-user research packs for founders who need distribution signal.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-3 text-sm font-semibold">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} Edukas Solutions LLC. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            by{" "}
            <Link
              href="https://www.edukassolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              Edukas Solutions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
