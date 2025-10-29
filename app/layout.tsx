import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ClientSessionProvider } from "./providers";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Jasamarga - Sistem Inspeksi Jalan Tol",
  description: "Sistem Inspeksi dan Monitoring Jalan Tol Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} antialiased`}>
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}
