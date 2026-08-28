import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "AI Revenue Recovery | Risk & Recovery Console",
  description: "Recover more revenue. Take fewer risks. AI-driven revenue recovery with safety policy controls and Human-in-the-Loop approval.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
