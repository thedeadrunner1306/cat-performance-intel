import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout-shell";
import { AppDataProvider } from "@/lib/data/app-data-context";
import { AuthProvider } from "@/lib/context/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CAT Performance Intelligence",
  description: "Transform raw CAT preparation data into actionable performance intelligence. Know exactly where you stand, why your score is changing, and where your next study hour should go.",
  keywords: ["CAT", "Performance", "Analytics", "Intelligence", "MBA", "Preparation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#09090b] text-white`}>
        <AuthProvider>
          <AppDataProvider>
            <LayoutShell>{children}</LayoutShell>
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
