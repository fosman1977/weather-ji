import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "☔ Barish Se Bachao - Cricket Weather Insurance",
  description: "Cricket + Weather + Insurance = No Tension! Ticket ka paisa dubne se bachao! 🏏💰",
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
