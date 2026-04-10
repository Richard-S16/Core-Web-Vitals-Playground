import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReportProvider } from "@/context/report-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Core Web Vitals Playground",
  description:
    "Analyze any website's performance and understand WHY it is slow. Visualize LCP, CLS, INP and get actionable suggestions.",
  openGraph: {
    title: "Core Web Vitals Playground",
    description:
      "Analyze any website's performance and understand WHY it is slow. Visualize LCP, CLS, INP and get actionable suggestions.",
    type: "website",
    siteName: "CWV Playground",
  },
  twitter: {
    card: "summary_large_image",
    title: "Core Web Vitals Playground",
    description:
      "Analyze any website's performance and understand WHY it is slow.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReportProvider>{children}</ReportProvider>
      </body>
    </html>
  );
}
