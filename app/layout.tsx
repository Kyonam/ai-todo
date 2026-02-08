import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    template: "%s | Task Master AI",
    default: "AI 할 일 관리 서비스"
  },
  description: "AI가 도와주는 똑똑한 할 일 관리 서비스. Task Master AI를 통해 생산성을 극대화하세요.",
  keywords: ["Todo", "Management", "AI", "Productivity", "할일", "투두"],
  openGraph: {
    title: "AI 할 일 관리 서비스",
    description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
    url: "https://task-master-ai.vercel.app",
    siteName: "Task Master AI",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 할 일 관리 서비스",
    description: "AI가 도와주는 똑똑한 할 일 관리 서비스",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
