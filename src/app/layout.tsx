import { TempoInit } from "@/components/tempo-init";
import { ClerkClientProvider } from "@/components/clerk-provider";
import { PostHogProviderWrapper } from "@/components/posthog-provider";
import { PostHogAuth } from "@/components/posthog-auth";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RedFlagged - Used Car Analysis",
  description: "Get a clear verdict on any used car listing. Know if it's a Deal, Caution, or Disaster before you buy.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <PostHogProviderWrapper>
          <ClerkClientProvider>
            <PostHogAuth />
            {children}
            <TempoInit />
          </ClerkClientProvider>
        </PostHogProviderWrapper>
      </body>
    </html>
  );
}
