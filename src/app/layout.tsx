import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:{default:"Briefs — Know what changed",template:"%s | Briefs"},description:"Living, sourced briefings on technology, business and the ideas changing how we work.",metadataBase:new URL(process.env.BRIEFS_BASE_URL||"https://briefs.blog")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><div className="wrap"><header className="nav"><a className="brand" href="/">BRIEFS.</a><span className="muted">Know what changed.</span></header>{children}</div></body></html>}
