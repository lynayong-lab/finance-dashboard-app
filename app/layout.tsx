import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description:
    "One-click finance export → executive dashboard: EBIT vs Budget, GP%, team RAG status.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f9f9f7] text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
