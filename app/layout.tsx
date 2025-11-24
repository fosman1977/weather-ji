import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Match Day Protection - DLS-Based Parametric Cricket Insurance",
  description: "Comprehensive parametric insurance for IPL matches using the Duckworth-Lewis-Stern method. Protect your entire match day investment from rain interruptions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
