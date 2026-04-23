import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { cn } from "@/lib/cn";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  title: "Strobl Online App",
  description: "Modern Dataverse-based business application for Strobl."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={cn(
          manrope.variable,
          spaceGrotesk.variable,
          "min-h-screen bg-[var(--background)] font-sans text-ink-900 antialiased"
        )}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
