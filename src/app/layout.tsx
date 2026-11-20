import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LA Hop — County Bus Planner",
  description:
    "Plan bus trips across Los Angeles County by time, start, and destination.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
