import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CallProvider } from "@/context/CallContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Masum Chat | Premium Messenger",
  description: "Connect instantly with a premium real-time chat experience.",
  verification: {
    google: [
      "8cO8_pbpH1FddeKdmjy_7GdWdDBXoSyLq5xoMmcCc8U",
      "HI59Lh6FHhgYgXvEW--dg-P1K4swS3VlYgdXkumnyNA"
    ]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-black text-white`} suppressHydrationWarning>
        <AuthProvider>
          <CallProvider>
            <div className="mobile-container overflow-hidden">
              {children}
            </div>
          </CallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
