import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parequilib Group",
  description: "A real marketplace — buy, sell, and message with real accounts and real payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text font-sans min-h-screen">{children}</body>
    </html>
  );
}
