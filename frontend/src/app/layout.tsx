import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "TraceMe - Lost People & Criminal Finder App",
  description: "A comprehensive community-driven platform designed to help locate lost persons and track criminals through verified reports, geo-tagged locations, and an intelligent notification system with expanding search radius.",
  keywords: ["TraceMe", "missing persons", "criminal tracking", "community safety", "geolocation", "notifications"],
  authors: [{ name: "TraceMe Team" }],
  openGraph: {
    title: "TraceMe - Lost People & Criminal Finder App",
    description: "Community-driven platform for finding missing persons and tracking criminals",
    url: "https://traceme.app",
    siteName: "TraceMe",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TraceMe - Lost People & Criminal Finder App",
    description: "Community-driven platform for finding missing persons and tracking criminals",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
