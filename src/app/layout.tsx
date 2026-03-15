import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay Tasks Starter",
  description:
    "A minimal task manager starter with add, edit, delete, and per-task agent calls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
