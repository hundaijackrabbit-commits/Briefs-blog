import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Briefs — Know what changed. Understand why it matters.",
  description: "Living, sourced briefings on technology, business and work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <nav className="nav">
            <Link className="brand" href="/">BRIEFS.</Link>
            <div className="navlinks">
              <Link href="/#today">Today</Link><Link href="/#topics">Topics</Link><Link href="/#living">Living Briefs</Link><Link href="/admin">Freshness</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
