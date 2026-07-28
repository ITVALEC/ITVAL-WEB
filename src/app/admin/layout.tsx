import { Manrope } from "next/font/google";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
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
    <html lang="es" className={manrope.variable}>
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
