import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { dark } from '@clerk/themes';
import "./globals.css";

import { ClerkProvider, SignedOut, SignIn, SignedIn } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWS S3 Manager",
  description: "Manage your AWS S3 buckets with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-white`}
        >
          <SignedOut>
            <div className="min-h-screen w-full flex justify-center items-center">
              <SignIn routing="hash" />
            </div>
          </SignedOut>
          <SignedIn>{children}</SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
