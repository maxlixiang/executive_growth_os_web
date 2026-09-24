import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Executive Growth OS",
  description: "把学习、实践、反馈与考核连接成长期成长闭环。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-ink">{children}</body>
    </html>
  );
}
