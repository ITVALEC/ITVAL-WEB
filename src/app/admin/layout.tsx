import { IBM_Plex_Sans } from "next/font/google";
import "../globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata = {
  title: "Admin — ITVAL",
  robots: "noindex, nofollow",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={ibmPlexSans.variable}>
      <body
        className={`${ibmPlexSans.className} min-h-screen bg-surface text-[15.5px] leading-[1.55] tracking-normal text-ink antialiased [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold`}
      >
        {children}
      </body>
    </html>
  );
}
