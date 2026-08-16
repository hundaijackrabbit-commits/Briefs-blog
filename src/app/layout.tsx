import "./globals.css";
import type { Metadata } from "next";

export const metadata:Metadata={
  title:{default:"Briefs — Brief me on…",template:"%s | Briefs"},
  description:"Living, sourced briefings built from a continuously maintained knowledge system.",
  metadataBase:new URL(process.env.BRIEFS_BASE_URL||"https://briefs.blog")
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><div className="wrap"><header className="nav nav-minimal"><a className="brand" href="/">BRIEFS.</a></header>{children}</div></body></html>;
}
